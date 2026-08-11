import type { AuthUser } from './api';

const SOLVED_KEY_PREFIX = 'phishaware_solved_challenges';
const SOLVED_HISTORY_KEY_PREFIX = 'phishaware_solved_history';

function storage() {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

function userKey(user: AuthUser | null) {
  return `${SOLVED_KEY_PREFIX}:${user?.id ?? user?.email ?? 'guest'}`;
}

function historyKey(user: AuthUser | null) {
  return `${SOLVED_HISTORY_KEY_PREFIX}:${user?.id ?? user?.email ?? 'guest'}`;
}

export function getSolvedChallengeIds(user: AuthUser | null) {
  const raw = storage()?.getItem(userKey(user));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function saveSolvedChallengeId(user: AuthUser | null, challengeId: string) {
  const current = new Set(getSolvedChallengeIds(user));
  const alreadySolved = current.has(challengeId);
  current.add(challengeId);
  storage()?.setItem(userKey(user), JSON.stringify([...current]));

  if (!alreadySolved) {
    const history = getSolvedChallengeHistory(user);
    storage()?.setItem(historyKey(user), JSON.stringify([...history, { id: challengeId, completedAt: new Date().toISOString() }]));
  }
}

export function getSolvedChallengeHistory(user: AuthUser | null): Array<{ id: string; completedAt: string }> {
  const raw = storage()?.getItem(historyKey(user));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is { id: string; completedAt: string } => Boolean(item && typeof item === 'object' && 'id' in item && 'completedAt' in item))
      .map((item) => ({ id: String(item.id), completedAt: String(item.completedAt) }));
  } catch {
    return [];
  }
}

export function getSolvedChallengeStreak(user: AuthUser | null) {
  const uniqueDays = [...new Set(getSolvedChallengeHistory(user).map((item) => item.completedAt.slice(0, 10)))].sort().reverse();
  if (!uniqueDays.length) return 0;

  let streak = 0;
  const cursor = new Date(`${uniqueDays[0]}T12:00:00`);
  for (const day of uniqueDays) {
    const expected = cursor.toISOString().slice(0, 10);
    if (day !== expected) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
