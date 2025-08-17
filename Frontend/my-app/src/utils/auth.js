export const USER_KEY = 'user';
export const ACTIVE_KEY = 'cmr:active';

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function initStoredUser() {
  const existing = getStoredUser();
  if (existing && !sessionStorage.getItem(ACTIVE_KEY)) {
    localStorage.removeItem(USER_KEY);
    return null;
  }
  sessionStorage.setItem(ACTIVE_KEY, '1');
  return existing;
}

export function storeUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(ACTIVE_KEY, '1');
  }
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(ACTIVE_KEY);
}
