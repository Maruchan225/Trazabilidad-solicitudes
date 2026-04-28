import type { AuthSession } from '../types/domain';

const sessionKey = 'dom-ticket-tracking.session';

export function getStoredSession() {
  const rawSession = localStorage.getItem(sessionKey);
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    localStorage.removeItem(sessionKey);
    return null;
  }
}

export function getStoredToken() {
  return getStoredSession()?.accessToken ?? null;
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(sessionKey, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(sessionKey);
}
