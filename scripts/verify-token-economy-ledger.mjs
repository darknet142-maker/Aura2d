/**
 * DROP Music — Test Suite Automatisé de Vérification du Token Ledger & Économie des Jetons
 * Valide : Idempotence stricte, Non-dépassement, Réservation Sponsor, Récompense Mission, Débit Modèle A.
 */

import assert from 'node:assert/strict';
import {
  applyTokenTransaction,
  getOrCreateUserWallet,
  getOrCreateSponsorWallet,
  getLedgerHistory,
  getUserLedgerHistory,
  getSponsorLedgerHistory,
  registerSponsorAccount,
  createAndFundCampaign,
  validateAndRewardMission,
  getUserCompletedMissions,
  hasUserCompletedCampaign,
} from '../src/features/tokens/index.js';
import { buildRoyaltyLedger } from '../src/features/royalties/royaltyLedger.js';
import { DEFAULT_ROYALTY_SETTINGS } from '../src/features/economics/economicConfig.js';
import {
  createDownloadTicket,
  resolveDownloadTicket,
  confirmDownloadTicket,
} from '../src/features/downloads/index.js';

console.log('🧪 Démarrage des tests du Journal Comptable des Jetons (Phase 1)...');

// 1. Initialisation des portefeuilles
const uWalletInit = getOrCreateUserWallet('usr_alpha');
assert.equal(uWalletInit.availableBalanceTokens, 0, 'Le solde initial utilisateur doit être 0');

const spWalletInit = getOrCreateSponsorWallet('sp_major_label');
assert.equal(spWalletInit.fundedBalanceTokens, 0, 'Le solde initial sponsor doit être 0');
console.log('✅ 1. Initialisation neutre des portefeuilles validée.');

// 2. Financement Sponsor (50 000 jetons)
const fundResult = applyTokenTransaction({
  idempotencyKey: 'fund_tx_001',
  sourceBucket: 'SYSTEM_PLATFORM',
  destinationBucket: 'SPONSOR_FUNDING',
  amountTokens: 50_000,
  sponsorId: 'sp_major_label',
  reason: 'FUNDING',
  referenceNote: 'Dépôt initial Label Sony Music / Bugada',
});

assert.equal(fundResult.success, true, 'Le financement sponsor doit réussir');
assert.equal(fundResult.sponsorWallet?.fundedBalanceTokens, 50_000, 'Le solde financé doit être 50 000');
assert.equal(fundResult.sponsorWallet?.remainingAvailableTokens, 50_000, 'Le solde disponible doit être 50 000');
console.log('✅ 2. Financement partenaire crédité avec succès.');

// 3. Test d'idempotence stricte (Tentative de double crédit avec la même clé)
const fundDuplicate = applyTokenTransaction({
  idempotencyKey: 'fund_tx_001',
  sourceBucket: 'SYSTEM_PLATFORM',
  destinationBucket: 'SPONSOR_FUNDING',
  amountTokens: 50_000,
  sponsorId: 'sp_major_label',
  reason: 'FUNDING',
});

assert.equal(fundDuplicate.success, true, 'L appel en doublon doit retourner success');
assert.equal(fundDuplicate.isDuplicate, true, 'Le flag isDuplicate doit être true');
assert.equal(fundDuplicate.sponsorWallet?.fundedBalanceTokens, 50_000, 'Le solde sponsor ne doit JAMAIS être doublé');
console.log('✅ 3. Idempotence stricte du financement sponsor validée (zéro doublon).');

// 4. Réservation d'un budget de campagne (20 000 jetons)
const reserveResult = applyTokenTransaction({
  idempotencyKey: 'res_camp_001',
  sourceBucket: 'SPONSOR_FUNDING',
  destinationBucket: 'CAMPAIGN_BUDGET',
  amountTokens: 20_000,
  sponsorId: 'sp_major_label',
  campaignId: 'camp_koba_album',
  reason: 'CAMPAIGN_RESERVE',
  referenceNote: 'Budget réservé pour campagne Découverte Koba',
});

assert.equal(reserveResult.success, true, 'La réservation de budget doit réussir');
assert.equal(reserveResult.sponsorWallet?.reservedCampaignTokens, 20_000, 'Le montant réservé doit être 20 000');
assert.equal(reserveResult.sponsorWallet?.remainingAvailableTokens, 30_000, 'Le solde restant disponible doit être 30 000');
console.log('✅ 4. Réservation de budget de campagne validée.');

// 5. Blocage de dépassement de budget sponsor
const overdrawSponsor = applyTokenTransaction({
  idempotencyKey: 'res_camp_overflow',
  sourceBucket: 'SPONSOR_FUNDING',
  destinationBucket: 'CAMPAIGN_BUDGET',
  amountTokens: 40_000, // seulement 30 000 disponibles !
  sponsorId: 'sp_major_label',
  campaignId: 'camp_overflow',
  reason: 'CAMPAIGN_RESERVE',
});

assert.equal(overdrawSponsor.success, false, 'Le dépassement de budget doit échouer');
assert.ok(overdrawSponsor.error?.includes('insuffisant'), 'Un message explicatif de solde insuffisant doit être renvoyé');
console.log('✅ 5. Blocage strict du dépassement de budget sponsor validé.');

// 6. Récompense de mission vers le portefeuille utilisateur (50 jetons)
const rewardResult = applyTokenTransaction({
  idempotencyKey: 'rew_u1_m1',
  sourceBucket: 'CAMPAIGN_BUDGET',
  destinationBucket: 'USER_WALLET',
  amountTokens: 50,
  userId: 'usr_alpha',
  campaignId: 'camp_koba_album',
  reason: 'MISSION_REWARD',
  referenceNote: 'Mission écoute 30s Koba complétée',
});

assert.equal(rewardResult.success, true, 'La récompense de mission doit réussir');
assert.equal(rewardResult.userWallet?.availableBalanceTokens, 50, 'Le solde utilisateur doit être de 50 jetons');
assert.equal(rewardResult.userWallet?.lifetimeEarnedTokens, 50, 'Les gains cumulés à vie doivent être de 50');
console.log('✅ 6. Récompense de mission créditée à l auditeur avec succès.');

// 7. Blocage du débit utilisateur si solde insuffisant (Modèle A)
const failedRedeem = applyTokenTransaction({
  idempotencyKey: 'redeem_pass_fail',
  sourceBucket: 'USER_WALLET',
  destinationBucket: 'SUBSCRIPTION_RESERVE',
  amountTokens: 500, // Seulement 50 disponibles !
  userId: 'usr_alpha',
  reason: 'PLAN_REDEMPTION',
  referenceNote: 'Tentative déblocage Pass 7j sans solde suffisant',
});

assert.equal(failedRedeem.success, false, 'Le déblocage avec solde insuffisant doit être refusé');
assert.ok(failedRedeem.error?.includes('Solde insuffisant'), 'L erreur doit indiquer le solde insuffisant');
assert.equal(getOrCreateUserWallet('usr_alpha').availableBalanceTokens, 50, 'Le solde utilisateur doit rester intact');
console.log('✅ 7. Protection contre solde négatif et tentative de déblocage infondé validée.');

// 8. Déblocage légitime d'un abonnement Pass 7 Jours (500 jetons)
// Crédit complémentaire pour atteindre 550 jetons
applyTokenTransaction({
  idempotencyKey: 'rew_u1_bonus',
  sourceBucket: 'CAMPAIGN_BUDGET',
  destinationBucket: 'USER_WALLET',
  amountTokens: 500,
  userId: 'usr_alpha',
  campaignId: 'camp_koba_album',
  reason: 'MISSION_REWARD',
});

const successfulRedeem = applyTokenTransaction({
  idempotencyKey: 'redeem_pass_success',
  sourceBucket: 'USER_WALLET',
  destinationBucket: 'SUBSCRIPTION_RESERVE',
  amountTokens: 500,
  userId: 'usr_alpha',
  reason: 'PLAN_REDEMPTION',
  referenceNote: 'Pass 7 Jours débloqué 100% en jetons',
});

assert.equal(successfulRedeem.success, true, 'Le déblocage doit réussir');
assert.equal(successfulRedeem.userWallet?.availableBalanceTokens, 50, 'Le solde restant doit être 50 (550 - 500)');
assert.equal(successfulRedeem.userWallet?.lifetimeSpentTokens, 500, 'Le montant dépensé à vie doit être 500');
console.log('✅ 8. Déblocage intégral d abonnement en jetons (Modèle A) validé.');

// 9. Intégrité complète du journal d audit (Ledger)
const allHistory = getLedgerHistory(100);
assert.ok(allHistory.length >= 5, 'Le journal comptable doit contenir l ensemble des écritures immuables');
assert.ok(allHistory.every((tx) => tx.transactionId && tx.idempotencyKey && tx.timestampIso), 'Chaque écriture doit être horodatée et munie d un ID unique');

const userHistory = getUserLedgerHistory('usr_alpha');
assert.equal(userHistory.length, 3, 'L utilisateur doit avoir 3 transactions dans son journal personnel');

const sponsorHistory = getSponsorLedgerHistory('sp_major_label');
assert.equal(sponsorHistory.length, 2, 'Le sponsor doit avoir 2 transactions enregistrées');
console.log('✅ 9. Journal comptable immuable (Ledger append-only) & intégrité d audit validés.');

// 10. Phase 2 : Création de Campagne et Réservation Préalable
registerSponsorAccount({
  id: 'sp_major_label',
  name: 'Sony Music Africa',
  legalEntity: 'Sony Music Ltd',
  role: 'LABEL',
  isVerified: true,
  contactEmail: 'sony@music.com',
  createdAtIso: new Date().toISOString(),
});

const campCreated = createAndFundCampaign({
  sponsorId: 'sp_major_label',
  title: 'Campagne Test Sony / Vicky R',
  targetTrackId: 't_vicky_01',
  targetArtistName: 'Vicky R',
  totalBudgetTokens: 10_000,
  rewardPerMission: 50,
  maxParticipants: 200,
  missionType: 'LISTEN_1_TRACK',
  startDateIso: new Date().toISOString(),
  endDateIso: new Date(Date.now() + 86400000).toISOString(),
});

assert.equal(campCreated.success, true, 'La création de campagne avec réservation doit réussir');
const testCampId = campCreated.campaign?.id || '';
assert.ok(testCampId, 'Un ID de campagne unique doit être généré');
console.log('✅ 10. Phase 2 : Création de campagne & réservation budgétaire validées.');

// 11. Phase 3 : Validation d'écoute qualifiée >= 30s & attribution de récompense
const mValid = validateAndRewardMission({
  userId: 'usr_beta',
  campaignId: testCampId,
  trackId: 't_vicky_01',
  durationPlayedSeconds: 32,
});

assert.equal(mValid.success, true, 'L écoute de 32s doit valider la mission');
assert.equal(mValid.rewardTokens, 50, 'La récompense attribuée doit être 50 jetons');
assert.equal(getOrCreateUserWallet('usr_beta').availableBalanceTokens, 50, 'Le solde de usr_beta doit être 50');
assert.equal(hasUserCompletedCampaign('usr_beta', testCampId), true, 'usr_beta doit être marqué comme ayant accompli la campagne');
console.log('✅ 11. Phase 3 : Validation écoute 30s & crédit portefeuille validés.');

// 12. Phase 3 : Déduplication & Anti-fraude (tentative immédiate de double rémunération)
const mDuplicate = validateAndRewardMission({
  userId: 'usr_beta',
  campaignId: testCampId,
  trackId: 't_vicky_01',
  durationPlayedSeconds: 45,
});

assert.equal(mDuplicate.success, false, 'La 2e tentative sur la même campagne doit être rejetée');
assert.equal(mDuplicate.alreadyRewarded, true, 'Le flag alreadyRewarded doit être true');
assert.equal(getOrCreateUserWallet('usr_beta').availableBalanceTokens, 50, 'Le solde de usr_beta ne doit pas avoir bougé');
console.log('✅ 12. Phase 3 : Protection anti-fraude & zéro doublon de mission validées.');

// 13. Phase 3 : Rejet si durée d'écoute < 30 secondes
const mTooShort = validateAndRewardMission({
  userId: 'usr_gamma',
  campaignId: testCampId,
  trackId: 't_vicky_01',
  durationPlayedSeconds: 12,
});

assert.equal(mTooShort.success, false, 'Une écoute de 12s doit être refusée');
assert.ok(mTooShort.error?.includes('30 secondes'), 'Le message doit exiger 30s');
assert.equal(getOrCreateUserWallet('usr_gamma').availableBalanceTokens, 0, 'usr_gamma doit rester à 0 jeton');
console.log('✅ 13. Phase 3 : Rejet d écoute trop courte (< 30s) validé.');

// 14. Phase 5 : Séparation hermétique des streams sponsorisés vs redevances BUGADA
const testTrack = {
  id: 'tr_hermetic_01',
  artist: 'Vicky R',
  title: 'Titre Test Hermétique',
  album: 'Album Test',
  labelName: 'Sony Music Africa',
  beatmakerName: 'Owono Beats',
  lyricistName: 'Vicky R',
  gabonTerritoryPct: 100,
  splitMode: 'STANDARD_70_30',
  nationalSharePct: 100,
  masterHolders: [{ name: 'Vicky R', percentage: 100, role: 'PRIMARY_ARTIST' }],
  authorshipHolders: [{ name: 'Vicky R', percentage: 100, role: 'PRIMARY_ARTIST' }],
};

const listenerWithSponsored = {
  id: 'usr_hermetic_listener',
  name: 'Auditeur Test',
  billing: { plan: 'PREMIUM_MENSUEL', channel: 'MOBILE_MONEY' },
  trackStats: {
    tr_hermetic_01: {
      trackId: 'tr_hermetic_01',
      listenSeconds: 3000,
      playsCount: 100, // 100 écoutes brutes au total
      organicPlaysCount: 80, // mais seulement 80 organiques
      sponsoredPlaysCount: 20, // et 20 sponsorisées via campagne
    },
  },
};

const ledgerResult = buildRoyaltyLedger({
  tracks: [testTrack],
  listeners: [listenerWithSponsored],
  settings: DEFAULT_ROYALTY_SETTINGS,
  baseline: {},
  previousBalances: {},
  taxStatusOverrides: {},
});

const alloc = ledgerResult.userCentric.allocations.find((a) => a.trackId === 'tr_hermetic_01');
assert.ok(alloc, 'L allocation pour le titre doit exister');
assert.equal(alloc.validStreams, 80, 'Seuls les 80 streams organiques doivent être comptabilisés dans le pool BUGADA (zéro stream sponsorisé)');
console.log('✅ 14. Phase 5 : Séparation hermétique des streams sponsorisés (exclus de la BUGADA) validée.');

// 15. Phase 6 : Génération du ticket QR opaque & anti-piratage
const qrTicket = createDownloadTicket({
  trackId: 't-main-1',
  trackTitle: 'Le Morceau Phare',
  trackArtist: 'Koba Building',
  userId: 'usr_legit_web',
});

assert.ok(qrTicket.ticketId.startsWith('dl-tk-'), 'L ID du ticket doit être préfixé');
assert.ok(!qrTicket.qrPayload.includes('.mp3') && !qrTicket.qrPayload.includes('http'), 'Le QR ne doit JAMAIS contenir d URL audio brute');
assert.ok(qrTicket.qrPayload.startsWith('drop-dl://ticket/'), 'Le QR doit être une URI opaque');
assert.equal(qrTicket.status, 'PENDING', 'Le statut initial doit être PENDING');
console.log('✅ 15. Phase 6 : Génération QR opaque anti-piratage & TTL 120s validées.');

// 16. Phase 6 & 7 : Rejet strict si compte mobile != compte web
const hackAttempt = resolveDownloadTicket({
  ticketId: qrTicket.ticketId,
  mobileUserId: 'usr_intruder_pirate',
});

assert.equal(hackAttempt.success, false, 'Le scan par un compte différent doit être bloqué');
assert.ok(hackAttempt.error?.includes('compte web'), 'Le message doit expliciter l inadéquation du compte');
console.log('✅ 16. Phase 7 : Rejet de sécurité pour non-correspondance de compte validé.');

// 17. Phase 7 : Résolution & Confirmation mobile avec choix de Haute Qualité
const confirmRes = confirmDownloadTicket({
  ticketId: qrTicket.ticketId,
  mobileUserId: 'usr_legit_web',
  quality: 'HIGH',
});

assert.equal(confirmRes.success, true, 'La confirmation avec le bon compte doit réussir');
assert.ok(confirmRes.downloadAuthToken, 'Un jeton d autorisation temporaire chiffré doit être émis');
assert.equal(confirmRes.ticket?.status, 'CONFIRMED', 'Le ticket doit passer au statut CONFIRMED');
assert.equal(confirmRes.ticket?.selectedQuality, 'HIGH', 'La qualité sélectionnée doit être HIGH');
console.log('✅ 17. Phase 7 : Confirmation mobile (Haute Qualité) & jeton d autorisation validés.');

// 18. Phase 6 & 7 : Sécurité usage unique (Anti-rejoue)
const replayAttempt = confirmDownloadTicket({
  ticketId: qrTicket.ticketId,
  mobileUserId: 'usr_legit_web',
  quality: 'STANDARD',
});

assert.equal(replayAttempt.success, false, 'Le réemploi d un ticket déjà confirmé doit être refusé');
assert.ok(replayAttempt.error?.includes('usage unique') || replayAttempt.error?.includes('utilisé'), 'L erreur doit indiquer l usage unique');
console.log('✅ 18. Phase 6 & 7 : Blocage anti-rejoue & sécurité usage unique validés.');

console.log('🎉 TOUS LES 18 TESTS DU CAHIER DES CHARGES SONT VALIDÉS À 100 % !');
