import type { AppNotification } from '../../shared/types/domain.types';

export interface NotificationPrefs {
  dndMutePopups: boolean;
  enableReleases: boolean;
  enableCommunity: boolean;
  enableCertifications: boolean;
  enableAdminSystem: boolean;
  cooldownSec: 0 | 4 | 10 | 30;
}

const NOTIF_PREFS_KEY = 'drop_notification_prefs_v1';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  dndMutePopups: false,
  enableReleases: true,
  enableCommunity: true,
  enableCertifications: true,
  enableAdminSystem: true,
  cooldownSec: 4,
};

export function loadNotificationPrefs(): NotificationPrefs {
  try {
    const raw = window.localStorage.getItem(NOTIF_PREFS_KEY);
    return raw ? { ...DEFAULT_NOTIFICATION_PREFS, ...(JSON.parse(raw) as Partial<NotificationPrefs>) } : DEFAULT_NOTIFICATION_PREFS;
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  try {
    window.localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage error
  }
}

const ADMIN_SYSTEM_REGEX =
  /(base\b|sql|supabase|opus|content id|encodage|bannière|paramètres admin|clôture bugada|synchronisation|enregistré dans la base|studio|pochette hd|master audio|analyse bpm|litige|crédits vérifiés|piste modifiée|piste supprimée)/i;

export function classifyNotificationAudience(
  title: string,
  message: string,
  type: AppNotification['type'],
  explicit?: AppNotification['audience']
): 'ADMIN' | 'USER' | 'ALL' {
  if (explicit) return explicit;
  if (type === 'DATABASE') return 'ADMIN';
  if (ADMIN_SYSTEM_REGEX.test(`${title} ${message}`)) return 'ADMIN';
  if (type === 'COMMUNITY' || type === 'CERTIFICATION') return 'USER';
  return 'ALL';
}

export function isNotificationCategoryEnabled(
  notif: AppNotification,
  audience: 'ADMIN' | 'USER' | 'ALL',
  prefs: NotificationPrefs
): boolean {
  if (audience === 'ADMIN') return prefs.enableAdminSystem;
  if (notif.type === 'COMMUNITY') return prefs.enableCommunity;
  if (notif.type === 'CERTIFICATION') return prefs.enableCertifications;
  return prefs.enableReleases;
}

export function filterNotificationsForViewer(
  notifications: AppNotification[],
  isAdminViewer: boolean,
  prefs: NotificationPrefs
): AppNotification[] {
  return notifications.filter((n) => {
    const aud = classifyNotificationAudience(n.title, n.message, n.type, n.audience);
    if (!isAdminViewer && aud === 'ADMIN') return false;
    return isNotificationCategoryEnabled(n, aud, prefs);
  });
}

export function shouldDisplayNotificationToast(params: {
  notif: AppNotification;
  isAdminViewer: boolean;
  prefs: NotificationPrefs;
  lastToastAtMs: number;
}): boolean {
  const { notif, isAdminViewer, prefs, lastToastAtMs } = params;
  if (prefs.dndMutePopups) return false;
  const aud = classifyNotificationAudience(notif.title, notif.message, notif.type, notif.audience);
  if (!isAdminViewer && aud === 'ADMIN') return false;
  if (!isNotificationCategoryEnabled(notif, aud, prefs)) return false;
  if (prefs.cooldownSec > 0 && Date.now() - lastToastAtMs < prefs.cooldownSec * 1000) {
    return false;
  }
  return true;
}

