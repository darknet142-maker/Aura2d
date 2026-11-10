export interface SubscriptionRecord {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  planTitle: string;
  method: 'AIRTEL_MONEY' | 'MOOV_MONEY' | 'CARD' | 'TOKEN_UNLOCKED';
  amountFcfa: number;
  tokensCost?: number;
  startDate: string;
  expiresInDays: number;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'FAILED' | 'SUSPENDED';
  autoRenew: boolean;
}

const STORAGE_SUBS_KEY = 'drop_real_subscriptions_v2';

export function loadSubscriptions(): SubscriptionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_SUBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSubscription(sub: SubscriptionRecord): void {
  try {
    const existing = loadSubscriptions();
    const updated = [sub, ...existing.filter((s) => s.id !== sub.id)];
    localStorage.setItem(STORAGE_SUBS_KEY, JSON.stringify(updated));
  } catch {
    // quota safe
  }
}

export function recordNewSubscription(params: {
  userId: string;
  userName: string;
  userAvatar?: string;
  planTitle: string;
  method: 'AIRTEL_MONEY' | 'MOOV_MONEY' | 'CARD' | 'TOKEN_UNLOCKED';
  amountFcfa: number;
  tokensCost?: number;
  durationDays?: number;
}): SubscriptionRecord {
  const days = params.durationDays ?? (params.planTitle.includes('24H') ? 1 : params.planTitle.includes('7') ? 7 : 30);
  const record: SubscriptionRecord = {
    id: `sub-${Date.now().toString(36)}`,
    userId: params.userId,
    userName: params.userName,
    userAvatar: params.userAvatar || '🎧',
    planTitle: params.planTitle,
    method: params.method,
    amountFcfa: params.amountFcfa,
    tokensCost: params.tokensCost,
    startDate: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    expiresInDays: days,
    status: 'ACTIVE',
    autoRenew: params.method !== 'TOKEN_UNLOCKED',
  };

  saveSubscription(record);
  return record;
}

