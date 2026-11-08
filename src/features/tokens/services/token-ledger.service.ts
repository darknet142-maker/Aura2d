import type {
  TokenLedgerEntry, UserTokenWallet, SponsorTokenWallet, TokenTransactionResult,
} from '../types/token-economy.types';

const ledgerEntries: TokenLedgerEntry[] = [];
const idempotencyRegistry = new Map<string, TokenLedgerEntry>();
const userWalletsMap = new Map<string, UserTokenWallet>();
const sponsorWalletsMap = new Map<string, SponsorTokenWallet>();

export function getOrCreateUserWallet(userId: string): UserTokenWallet {
  const existing = userWalletsMap.get(userId);
  if (existing) return existing;
  const initial: UserTokenWallet = {
    userId, availableBalanceTokens: 0, lifetimeEarnedTokens: 0, lifetimeSpentTokens: 0,
    lastUpdatedIso: new Date().toISOString(),
  };
  userWalletsMap.set(userId, initial);
  return initial;
}

export function getOrCreateSponsorWallet(sponsorId: string): SponsorTokenWallet {
  const existing = sponsorWalletsMap.get(sponsorId);
  if (existing) return existing;
  const initial: SponsorTokenWallet = {
    sponsorId, fundedBalanceTokens: 0, reservedCampaignTokens: 0, remainingAvailableTokens: 0,
    lastUpdatedIso: new Date().toISOString(),
  };
  sponsorWalletsMap.set(sponsorId, initial);
  return initial;
}

export function applyTokenTransaction(
  payload: Omit<TokenLedgerEntry, 'transactionId' | 'timestampIso'>
): TokenTransactionResult {
  const { idempotencyKey, sourceBucket, destinationBucket, amountTokens, userId, sponsorId, reason } = payload;
  if (!idempotencyKey) return { success: false, error: 'Clé d’idempotence obligatoire' };
  if (amountTokens <= 0 || !Number.isFinite(amountTokens)) return { success: false, error: 'Montant de jetons invalide (> 0 requis)' };

  const existingTx = idempotencyRegistry.get(idempotencyKey);
  if (existingTx) {
    return {
      success: true, isDuplicate: true, entry: existingTx,
      userWallet: userId ? getOrCreateUserWallet(userId) : undefined,
      sponsorWallet: sponsorId ? getOrCreateSponsorWallet(sponsorId) : undefined,
    };
  }

  const nowIso = new Date().toISOString();
  let userWallet: UserTokenWallet | undefined;
  let sponsorWallet: SponsorTokenWallet | undefined;

  if (sourceBucket === 'USER_WALLET' && userId) {
    userWallet = getOrCreateUserWallet(userId);
    if (userWallet.availableBalanceTokens < amountTokens) {
      return { success: false, error: `Solde insuffisant (${userWallet.availableBalanceTokens} jetons disponibles, ${amountTokens} requis)` };
    }
  }

  if (sourceBucket === 'SPONSOR_FUNDING' && sponsorId) {
    sponsorWallet = getOrCreateSponsorWallet(sponsorId);
    if (reason === 'CAMPAIGN_RESERVE' && sponsorWallet.remainingAvailableTokens < amountTokens) {
      return { success: false, error: `Budget sponsor disponible insuffisant (${sponsorWallet.remainingAvailableTokens} disponibles)` };
    }
  }

  const txId = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry: TokenLedgerEntry = { transactionId: txId, timestampIso: nowIso, ...payload };

  if (userId) {
    userWallet = getOrCreateUserWallet(userId);
    if (destinationBucket === 'USER_WALLET') {
      userWallet.availableBalanceTokens += amountTokens;
      userWallet.lifetimeEarnedTokens += amountTokens;
    } else if (sourceBucket === 'USER_WALLET') {
      userWallet.availableBalanceTokens -= amountTokens;
      userWallet.lifetimeSpentTokens += amountTokens;
    }
    userWallet.lastUpdatedIso = nowIso;
  }

  if (sponsorId) {
    sponsorWallet = getOrCreateSponsorWallet(sponsorId);
    if (destinationBucket === 'SPONSOR_FUNDING' && reason === 'FUNDING') {
      sponsorWallet.fundedBalanceTokens += amountTokens;
      sponsorWallet.remainingAvailableTokens += amountTokens;
    } else if (sourceBucket === 'SPONSOR_FUNDING' && reason === 'CAMPAIGN_RESERVE') {
      sponsorWallet.reservedCampaignTokens += amountTokens;
      sponsorWallet.remainingAvailableTokens -= amountTokens;
    }
    sponsorWallet.lastUpdatedIso = nowIso;
  }

  ledgerEntries.push(entry);
  idempotencyRegistry.set(idempotencyKey, entry);

  return { success: true, entry, userWallet, sponsorWallet };
}

export function getLedgerHistory(limit = 100): TokenLedgerEntry[] {
  return [...ledgerEntries].reverse().slice(0, limit);
}

export function getUserLedgerHistory(userId: string, limit = 50): TokenLedgerEntry[] {
  return ledgerEntries.filter((e) => e.userId === userId).reverse().slice(0, limit);
}

export function getSponsorLedgerHistory(sponsorId: string, limit = 50): TokenLedgerEntry[] {
  return ledgerEntries.filter((e) => e.sponsorId === sponsorId).reverse().slice(0, limit);
}

