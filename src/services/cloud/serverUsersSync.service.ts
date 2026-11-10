import type { AppUser } from '../../shared/types/domain.types';

const STORAGE_USERS_KEY = 'drop_real_users_v2';
const STORAGE_CURRENT_USER_KEY = 'drop_real_current_user_v2';

export const DEFAULT_BETA_USER: AppUser = {
  id: 'usr-beta-1',
  name: 'Auditeur DROP Beta',
  email: 'auditeur@drop.ga',
  role: 'ADMIN',
  joinedAt: 'Beta 2026',
  avatar: 'AB',
  totalLikes: 0,
  totalListenSeconds: 0,
  totalValidatedPlays: 0,
  totalLoops: 0,
  trackStats: {},
};

export function loadUsersFromStorage(): AppUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return [DEFAULT_BETA_USER];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_BETA_USER];
  } catch {
    return [DEFAULT_BETA_USER];
  }
}

export function saveUsersToStorage(users: AppUser[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch {
    // quota safe
  }
}

export function loadCurrentUserFromStorage(): AppUser {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!raw) return DEFAULT_BETA_USER;
    const parsed = JSON.parse(raw);
    return parsed && parsed.id ? parsed : DEFAULT_BETA_USER;
  } catch {
    return DEFAULT_BETA_USER;
  }
}

export function saveCurrentUserToStorage(user: AppUser): void {
  try {
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
  } catch {
    // quota safe
  }
}

export function registerNewUser(name: string, email: string, role: 'USER' | 'ADMIN' = 'USER'): AppUser {
  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const initials = cleanName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'DP';

  const newUser: AppUser = {
    id: `usr-${Date.now().toString(36)}`,
    name: cleanName,
    email: cleanEmail,
    role,
    joinedAt: 'Aujourd’hui',
    avatar: initials,
    totalLikes: 0,
    totalListenSeconds: 0,
    totalValidatedPlays: 0,
    totalLoops: 0,
    trackStats: {},
  };

  const existing = loadUsersFromStorage();
  const updated = [newUser, ...existing.filter((u) => u.email !== cleanEmail)];
  saveUsersToStorage(updated);
  saveCurrentUserToStorage(newUser);
  return newUser;
}

