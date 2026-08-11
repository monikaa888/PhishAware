import type { AuthResponse, AuthUser } from './api';

const TOKEN_KEY = 'phishaware_token';
const USER_KEY = 'phishaware_user';

function browserStorage() {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

export function saveAuthSession(session: AuthResponse) {
  const storage = browserStorage();
  if (!storage) return;

  storage.setItem(TOKEN_KEY, session.accessToken);
  storage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function getAuthToken() {
  return browserStorage()?.getItem(TOKEN_KEY) ?? null;
}

export function getStoredUser(): AuthUser | null {
  const raw = browserStorage()?.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: AuthUser) {
  const storage = browserStorage();
  if (!storage) return;

  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  const storage = browserStorage();
  if (!storage) return;

  storage.removeItem(TOKEN_KEY);
  storage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}
