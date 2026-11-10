/**
 * Service de Récompense Quotidienne pour Utilisateurs Récurrents (Daily Streak)
 * Connecté au grand livre comptable (Ledger) avec transactions immuables réelles.
 */

import { applyTokenTransaction, getOrCreateUserWallet } from './token-ledger.service';

export interface StreakRewardTier {
  day: number;
  tokens: number;
  title: string;
  bonusLabel?: string;
  isSpecial?: boolean;
}

export const DAILY_STREAK_TIERS: Record<number, StreakRewardTier> = {
  1: { day: 1, tokens: 10, title: 'Bienvenue au Studio', bonusLabel: 'Drop Initial' },
  2: { day: 2, tokens: 15, title: 'Fidélité Rythme', bonusLabel: '+5 Jetons' },
  3: { day: 3, tokens: 20, title: 'Session Live', bonusLabel: '+5 Jetons' },
  4: { day: 4, tokens: 25, title: 'Cadence Broadcast', bonusLabel: '+5 Jetons' },
  5: { day: 5, tokens: 30, title: 'Pépite Sonore', bonusLabel: '+5 Jetons' },
  6: { day: 6, tokens: 40, title: 'Maestria Acoustique', bonusLabel: '+10 Jetons' },
  7: { day: 7, tokens: 50, title: 'Grand Pass Hebdo Master', bonusLabel: 'Mega Drop', isSpecial: true },
};

export interface DailyStreakState {
  userId: string;
  currentStreakDay: number; // 1 à 7
  lastClaimDateStr: string; // YYYY-MM-DD
  totalClaimsCount: number;
  totalTokensClaimed: number;
  claimedHistory: Array<{
    dateStr: string;
    day: number;
    tokens: number;
    txId: string;
  }>;
}

const STORAGE_PREFIX = 'drop_recurring_streak_v1_';

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

function getMillisecondsUntilMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, tomorrow.getTime() - now.getTime());
}

export function loadUserStreakState(userId: string): DailyStreakState {
  const safeId = userId || 'usr-default';
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${safeId}`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DailyStreakState;
      if (parsed && typeof parsed.currentStreakDay === 'number') {
        return parsed;
      }
    } catch {
      // Ignorer les corruptions
    }
  }

  return {
    userId: safeId,
    currentStreakDay: 1,
    lastClaimDateStr: '',
    totalClaimsCount: 0,
    totalTokensClaimed: 0,
    claimedHistory: [],
  };
}

export function saveUserStreakState(state: DailyStreakState): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${state.userId}`, JSON.stringify(state));
  } catch {
    // quota dépassé ou mode privé
  }
}

export interface UserStreakInfo {
  state: DailyStreakState;
  effectiveDay: number;
  currentTier: StreakRewardTier;
  canClaimToday: boolean;
  msUntilNextDrop: number;
  formattedCountdown: string;
}

export function getDailyStreakInfo(userId: string): UserStreakInfo {
  const state = loadUserStreakState(userId);
  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();

  let effectiveDay = state.currentStreakDay || 1;
  let canClaimToday = false;

  if (!state.lastClaimDateStr) {
    // Premier jour de tous les temps
    effectiveDay = 1;
    canClaimToday = true;
  } else if (state.lastClaimDateStr === todayStr) {
    // Déjà réclamé aujourd'hui
    effectiveDay = state.currentStreakDay;
    canClaimToday = false;
  } else if (state.lastClaimDateStr === yesterdayStr) {
    // Réclamé hier : la série continue
    effectiveDay = state.currentStreakDay >= 7 ? 1 : state.currentStreakDay + 1;
    canClaimToday = true;
  } else {
    // Interruption de plus de 24h : la série recommence à J1
    effectiveDay = 1;
    canClaimToday = true;
  }

  const currentTier = DAILY_STREAK_TIERS[effectiveDay] || DAILY_STREAK_TIERS[1];
  const msUntilNextDrop = getMillisecondsUntilMidnight();

  const hours = Math.floor(msUntilNextDrop / (1000 * 60 * 60));
  const minutes = Math.floor((msUntilNextDrop % (1000 * 60 * 60)) / (1000 * 60));
  const formattedCountdown = `${hours}h ${String(minutes).padStart(2, '0')}m`;

  return {
    state,
    effectiveDay,
    currentTier,
    canClaimToday,
    msUntilNextDrop,
    formattedCountdown,
  };
}

export interface ClaimRewardResult {
  success: boolean;
  tokensAwarded: number;
  streakDay: number;
  newBalance: number;
  error?: string;
  txId?: string;
}

export function claimDailyRecurringReward(userId: string): ClaimRewardResult {
  const safeId = userId || 'usr-default';
  const info = getDailyStreakInfo(safeId);

  if (!info.canClaimToday) {
    const currentWallet = getOrCreateUserWallet(safeId);
    return {
      success: false,
      tokensAwarded: 0,
      streakDay: info.effectiveDay,
      newBalance: currentWallet.availableBalanceTokens,
      error: `Récompense quotidienne déjà obtenue pour aujourd'hui. Prochain drop dans ${info.formattedCountdown}.`,
    };
  }

  const todayStr = getLocalDateString();
  const idempotencyKey = `daily-streak-claim-${safeId}-${todayStr}`;
  const tier = info.currentTier;

  // Transaction comptable immuable réelle
  const tx = applyTokenTransaction({
    idempotencyKey,
    sourceBucket: 'SYSTEM_PLATFORM',
    destinationBucket: 'USER_WALLET',
    amountTokens: tier.tokens,
    userId: safeId,
    reason: 'MISSION_REWARD',
    referenceNote: `Récompense Quotidienne Série Jour ${tier.day} (${tier.tokens} Jetons) — ${tier.title}`,
  });

  if (!tx.success) {
    const currentWallet = getOrCreateUserWallet(safeId);
    return {
      success: false,
      tokensAwarded: 0,
      streakDay: tier.day,
      newBalance: currentWallet.availableBalanceTokens,
      error: tx.error || 'Erreur lors du versement des jetons.',
    };
  }

  // Mise à jour de l'état de fidélité persisté
  const updatedState: DailyStreakState = {
    ...info.state,
    currentStreakDay: tier.day,
    lastClaimDateStr: todayStr,
    totalClaimsCount: (info.state.totalClaimsCount || 0) + 1,
    totalTokensClaimed: (info.state.totalTokensClaimed || 0) + tier.tokens,
    claimedHistory: [
      {
        dateStr: todayStr,
        day: tier.day,
        tokens: tier.tokens,
        txId: tx.entry?.transactionId || `tx-${Date.now()}`,
      },
      ...(info.state.claimedHistory || []).slice(0, 30),
    ],
  };

  saveUserStreakState(updatedState);

  const finalWallet = getOrCreateUserWallet(safeId);

  // Notification d'événement global pour synchronisation instantanée du chrome UI
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('drop:token-balance-updated', {
        detail: {
          userId: safeId,
          newBalance: finalWallet.availableBalanceTokens,
          earned: tier.tokens,
        },
      })
    );
  }

  return {
    success: true,
    tokensAwarded: tier.tokens,
    streakDay: tier.day,
    newBalance: finalWallet.availableBalanceTokens,
    txId: tx.entry?.transactionId,
  };
}

