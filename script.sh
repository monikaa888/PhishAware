#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
RUNTIME_DIR="$ROOT_DIR/.runtime"

BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-3001}"
MONGODB_PORT="${MONGODB_PORT:-27017}"
MONGODB_DB_NAME="${MONGODB_DB_NAME:-phishaware}"
MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:${MONGODB_PORT}/${MONGODB_DB_NAME}}"
MONGODB_IMAGE="${MONGODB_IMAGE:-mongo:4.4}"
FORCE_PORTS="${FORCE_PORTS:-1}"
DEV_ADMIN_PASSWORD="${DEV_ADMIN_PASSWORD:-phishaware-dev-admin}"

PIDS=()
STARTED_DOCKER_MONGO=0

log() {
  printf '[PhishAware] %s\n' "$*"
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

port_open() {
  local host="$1"
  local port="$2"
  (echo >"/dev/tcp/${host}/${port}") >/dev/null 2>&1
}

port_listener() {
  local port="$1"
  if command_exists lsof; then
    if lsof -i :"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
  fi

  if command_exists ss; then
    if ss -tuln "sport = :$port" 2>/dev/null | grep -q ":$port"; then
      return 0
    fi
  fi

  port_open 127.0.0.1 "$port"
}

ensure_port_free() {
  local port="$1"
  local name="$2"

  if port_listener "$port"; then
    log "$name port $port is already in use."
    if command_exists lsof; then
      lsof -i :"$port" -sTCP:LISTEN || true
    fi

    if [ "$FORCE_PORTS" != "1" ]; then
      log "Stop the old process first, or run with a different port, for example ${name^^}_PORT=$((port + 1)) ./script.sh"
      exit 1
    fi

    log "Stopping existing $name listener on port $port"
    if command_exists lsof; then
      local pids
      pids="$(lsof -ti :"$port" -sTCP:LISTEN || true)"
      if [ -n "$pids" ]; then
        kill $pids >/dev/null 2>&1 || true
        sleep 1
      fi
    fi

    if command_exists fuser; then
      fuser -k "${port}/tcp" >/dev/null 2>&1 || true
      sleep 1
    fi

    if port_listener "$port"; then
      log "$name port $port is still in use; forcing stop"
      if command_exists lsof; then
        local force_pids
        force_pids="$(lsof -ti :"$port" -sTCP:LISTEN || true)"
        if [ -n "$force_pids" ]; then
          kill -9 $force_pids >/dev/null 2>&1 || true
          sleep 1
        fi
      fi

      if command_exists fuser; then
        fuser -k -9 "${port}/tcp" >/dev/null 2>&1 || true
        sleep 1
      fi
    fi

    if port_listener "$port"; then
      log "Could not free $name port $port. Run: lsof -i :$port -sTCP:LISTEN"
      exit 1
    fi

    log "$name port $port is free"
  fi
}

wait_for_port() {
  local host="$1"
  local port="$2"
  local name="$3"
  local attempts="${4:-40}"

  for _ in $(seq 1 "$attempts"); do
    if port_open "$host" "$port"; then
      log "$name is ready on ${host}:${port}"
      return 0
    fi
    sleep 0.5
  done

  log "$name did not become ready on ${host}:${port}"
  return 1
}

wait_for_process_port() {
  local host="$1"
  local port="$2"
  local name="$3"
  local pid="$4"
  local attempts="${5:-40}"

  for _ in $(seq 1 "$attempts"); do
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      log "$name process exited before it became ready."
      return 1
    fi

    if port_open "$host" "$port"; then
      sleep 3
      if kill -0 "$pid" >/dev/null 2>&1; then
        log "$name is ready on ${host}:${port}"
        return 0
      fi
      log "$name opened port ${port} but then exited."
      return 1
    fi

    sleep 0.5
  done

  log "$name did not become ready on ${host}:${port}"
  return 1
}

wait_for_docker_mongo() {
  for _ in $(seq 1 120); do
    if ! docker ps --format '{{.Names}}' | grep -qx 'phishaware-mongo'; then
      log "MongoDB Docker container exited before it became ready."
      docker logs phishaware-mongo 2>&1 || true
      return 1
    fi

    if docker exec phishaware-mongo mongosh --quiet --eval 'db.adminCommand({ ping: 1 }).ok' >/dev/null 2>&1; then
      log "MongoDB Docker container is ready"
      return 0
    fi

    if docker exec phishaware-mongo mongo --quiet --eval 'db.adminCommand({ ping: 1 }).ok' >/dev/null 2>&1; then
      log "MongoDB Docker container is ready"
      return 0
    fi

    sleep 0.5
  done

  log "MongoDB Docker container did not become ready."
  docker logs phishaware-mongo 2>&1 || true
  return 1
}

cleanup() {
  log "Stopping services..."
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done

  if [ "$STARTED_DOCKER_MONGO" = "1" ] && command_exists docker; then
    docker rm -f phishaware-mongo >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

ensure_dependencies() {
  if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    log "Missing backend dependencies. Run: cd backend && npm install"
    exit 1
  fi

  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    log "Missing frontend dependencies. Run: cd frontend && npm install"
    exit 1
  fi
}

start_database() {
  mkdir -p "$RUNTIME_DIR/mongodb"

  if port_open 127.0.0.1 "$MONGODB_PORT"; then
    log "Using existing MongoDB on port $MONGODB_PORT"
    return 0
  fi

  if command_exists mongod; then
    log "Starting local MongoDB on port $MONGODB_PORT"
    mongod \
      --dbpath "$RUNTIME_DIR/mongodb" \
      --bind_ip 127.0.0.1 \
      --port "$MONGODB_PORT" \
      >"$RUNTIME_DIR/mongod.log" 2>&1 &
    PIDS+=("$!")
    wait_for_port 127.0.0.1 "$MONGODB_PORT" "MongoDB" 60
    return 0
  fi

  if command_exists docker; then
    log "Starting MongoDB with Docker image $MONGODB_IMAGE on port $MONGODB_PORT"
    docker rm -f phishaware-mongo >/dev/null 2>&1 || true
    if ! docker run -d --name phishaware-mongo -p "${MONGODB_PORT}:27017" "$MONGODB_IMAGE" >/dev/null; then
      log "Docker could not start MongoDB. Make sure Docker is running and the $MONGODB_IMAGE image can be pulled."
      exit 1
    fi
    STARTED_DOCKER_MONGO=1
    wait_for_docker_mongo
    wait_for_port 127.0.0.1 "$MONGODB_PORT" "MongoDB" 120
    return 0
  fi

  log "MongoDB could not be started. Install mongod or Docker, or set MONGODB_URI to an existing MongoDB server."
  exit 1
}

start_backend() {
  ensure_port_free "$BACKEND_PORT" "backend"
  log "Starting backend on http://localhost:${BACKEND_PORT}"
  (
    cd "$BACKEND_DIR"
    PORT="$BACKEND_PORT" \
    MONGODB_URI="$MONGODB_URI" \
    MONGODB_DB_NAME="$MONGODB_DB_NAME" \
    DEV_ADMIN_PASSWORD="$DEV_ADMIN_PASSWORD" \
    npm run dev
  ) &
  local backend_pid="$!"
  PIDS+=("$backend_pid")
  wait_for_process_port 127.0.0.1 "$BACKEND_PORT" "Backend" "$backend_pid" 80
}

start_frontend() {
  ensure_port_free "$FRONTEND_PORT" "frontend"
  log "Starting frontend on http://localhost:${FRONTEND_PORT}"
  (
    cd "$FRONTEND_DIR"
    NEXT_PUBLIC_API_URL="http://localhost:${BACKEND_PORT}/api/v1" \
    ./node_modules/.bin/next dev --port "$FRONTEND_PORT"
  ) &
  local frontend_pid="$!"
  PIDS+=("$frontend_pid")
  wait_for_process_port 127.0.0.1 "$FRONTEND_PORT" "Frontend" "$frontend_pid" 80
}

ensure_dependencies
start_database
start_backend
start_frontend

log "All services are running."
log "Frontend: http://localhost:${FRONTEND_PORT}"
log "Backend:  http://localhost:${BACKEND_PORT}"
log "Docs:     http://localhost:${BACKEND_PORT}/docs"
log "MongoDB:  $MONGODB_URI"
log "Dev admin: http://localhost:${FRONTEND_PORT}/123admin"
log "Dev admin password: $DEV_ADMIN_PASSWORD"
log "Press Ctrl+C to stop everything started by this script."

wait
