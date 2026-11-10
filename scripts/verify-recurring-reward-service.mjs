import {
  getDailyStreakInfo,
  claimDailyRecurringReward,
  DAILY_STREAK_TIERS,
} from '../src/features/tokens/services/recurring-reward.service.ts';
import { getOrCreateUserWallet } from '../src/features/tokens/services/token-ledger.service.ts';

// Test mock localStorage
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

console.log('🧪 Test du Service de Récompenses Récurrentes...');

const testUser = 'usr-test-recurring-123';
const initialInfo = getDailyStreakInfo(testUser);
console.log('1. Info initiale:', {
  effectiveDay: initialInfo.effectiveDay,
  tokens: initialInfo.currentTier.tokens,
  canClaimToday: initialInfo.canClaimToday,
});

if (!initialInfo.canClaimToday || initialInfo.effectiveDay !== 1 || initialInfo.currentTier.tokens !== 10) {
  throw new Error('Échec du calcul initial J1');
}

// Réclamation J1
const claimResult = claimDailyRecurringReward(testUser);
console.log('2. Résultat claim J1:', claimResult);

if (!claimResult.success || claimResult.tokensAwarded !== 10 || claimResult.streakDay !== 1) {
  throw new Error('Échec réclamation J1');
}

const wallet = getOrCreateUserWallet(testUser);
console.log('3. Solde utilisateur après J1:', wallet.availableBalanceTokens);
if (wallet.availableBalanceTokens < 10) {
  throw new Error('Solde portefeuille non crédité');
}

// Double réclamation le même jour (doit être bloquée)
const doubleClaim = claimDailyRecurringReward(testUser);
console.log('4. Tentative de double claim le même jour:', doubleClaim);
if (doubleClaim.success) {
  throw new Error('Le double claim n a pas été bloqué !');
}

console.log('✅ Tous les tests du service de récompenses récurrentes sont validés avec succès !');

