import type { SponsorAccount, SponsorCampaign, CampaignStatus, TokenTransactionResult } from '../types/token-economy.types';
import { applyTokenTransaction, getOrCreateSponsorWallet } from './token-ledger.service';

const INITIAL_SPONSORS: SponsorAccount[] = [
  { id: 'sp-sony-bugada', name: 'Sony Music Afrique / BUGADA', legalEntity: 'Sony Music Entertainment Ltd', role: 'LABEL', isVerified: true, contactEmail: 'licensing@sonymusic.africa', createdAtIso: '2026-01-10T08:00:00Z' },
  { id: 'sp-direct-prod', name: 'Direct Prod Gabon', legalEntity: 'Direct Prod SARL', role: 'PRODUCER', isVerified: true, contactEmail: 'direction@directprod.ga', createdAtIso: '2026-02-14T10:30:00Z' },
  { id: 'sp-khavap-records', name: 'Khavap Mawa Records', legalEntity: 'Khavap Music Group', role: 'ARTIST', isVerified: true, contactEmail: 'contact@khavapmawa.ga', createdAtIso: '2026-03-01T12:00:00Z' },
];

const INITIAL_CAMPAIGNS: SponsorCampaign[] = [
  {
    id: 'camp-khavap-01', sponsorId: 'sp-khavap-records', title: 'Découverte Titre Phare Khavap Mawa — Tcham 4',
    targetTrackId: 't-1793630114895', targetArtistName: 'Khavap Mawa', totalBudgetTokens: 50_000,
    reservedTokens: 50_000, distributedTokens: 0, rewardPerMission: 50, maxParticipants: 1000,
    missionType: 'LISTEN_1_TRACK', status: 'ACTIVE', startDateIso: '2026-11-01T00:00:00Z', endDateIso: '2026-12-31T23:59:59Z',
  },
  {
    id: 'camp-chansa-02', sponsorId: 'sp-sony-bugada', title: 'Mission Afro-Pop & Rumba — AKALEZE (Chans\'A)',
    targetTrackId: 't-1793635636298', targetArtistName: 'Chans\'A', totalBudgetTokens: 100_000,
    reservedTokens: 100_000, distributedTokens: 0, rewardPerMission: 75, maxParticipants: 1333,
    missionType: 'DISCOVER_ARTIST', status: 'ACTIVE', startDateIso: '2026-11-05T00:00:00Z', endDateIso: '2026-12-31T23:59:59Z',
  },
];

let sponsorsRegistry: SponsorAccount[] = [...INITIAL_SPONSORS];
let campaignsRegistry: SponsorCampaign[] = [...INITIAL_CAMPAIGNS];

// Initialise un solde initial pour les sponsors partenaires afin de supporter les réservations
applyTokenTransaction({ idempotencyKey: 'seed-sp-sony-init', sourceBucket: 'SYSTEM_PLATFORM', destinationBucket: 'SPONSOR_FUNDING', amountTokens: 250_000, sponsorId: 'sp-sony-bugada', reason: 'FUNDING' });
applyTokenTransaction({ idempotencyKey: 'seed-sp-khavap-init', sourceBucket: 'SYSTEM_PLATFORM', destinationBucket: 'SPONSOR_FUNDING', amountTokens: 150_000, sponsorId: 'sp-khavap-records', reason: 'FUNDING' });
applyTokenTransaction({ idempotencyKey: 'seed-sp-direct-init', sourceBucket: 'SYSTEM_PLATFORM', destinationBucket: 'SPONSOR_FUNDING', amountTokens: 100_000, sponsorId: 'sp-direct-prod', reason: 'FUNDING' });

export function getSponsorAccounts(): SponsorAccount[] {
  return [...sponsorsRegistry];
}

export function registerSponsorAccount(account: SponsorAccount): SponsorAccount {
  const existing = sponsorsRegistry.find((s) => s.id === account.id);
  if (existing) return existing;
  sponsorsRegistry.push(account);
  return account;
}

export function getSponsorCampaigns(statusFilter?: CampaignStatus): SponsorCampaign[] {
  if (!statusFilter) return [...campaignsRegistry];
  return campaignsRegistry.filter((c) => c.status === statusFilter);
}

export function fundSponsorAccount(sponsorId: string, amountTokens: number, note?: string): TokenTransactionResult {
  const sp = sponsorsRegistry.find((s) => s.id === sponsorId);
  if (!sp) return { success: false, error: 'Compte partenaire introuvable' };
  const idemKey = `fund-${sponsorId}-${Date.now()}`;
  return applyTokenTransaction({
    idempotencyKey: idemKey, sourceBucket: 'SYSTEM_PLATFORM', destinationBucket: 'SPONSOR_FUNDING',
    amountTokens, sponsorId, reason: 'FUNDING', referenceNote: note || `Financement officiel par virement/Mobile Money de ${sp.name}`,
  });
}

export function createAndFundCampaign(
  payload: Omit<SponsorCampaign, 'id' | 'reservedTokens' | 'distributedTokens' | 'status'>
): { success: boolean; campaign?: SponsorCampaign; error?: string } {
  const sp = sponsorsRegistry.find((s) => s.id === payload.sponsorId);
  if (!sp) return { success: false, error: 'Compte partenaire inexistant' };
  if (!sp.isVerified) return { success: false, error: 'Le compte partenaire doit être vérifié par l’administration' };

  const requiredTokens = payload.totalBudgetTokens || (payload.maxParticipants * payload.rewardPerMission);
  if (requiredTokens <= 0) return { success: false, error: 'Budget de campagne invalide (> 0 requis)' };

  const spWallet = getOrCreateSponsorWallet(payload.sponsorId);
  if (spWallet.remainingAvailableTokens < requiredTokens) {
    return { success: false, error: `Budget sponsor disponible insuffisant (${spWallet.remainingAvailableTokens} dispo, ${requiredTokens} requis)` };
  }

  const campId = `camp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const idemKey = `camp-reserve-${campId}`;

  const reserveTx = applyTokenTransaction({
    idempotencyKey: idemKey, sourceBucket: 'SPONSOR_FUNDING', destinationBucket: 'CAMPAIGN_BUDGET',
    amountTokens: requiredTokens, sponsorId: payload.sponsorId, campaignId: campId,
    reason: 'CAMPAIGN_RESERVE', referenceNote: `Réservation budget campagne « ${payload.title} »`,
  });

  if (!reserveTx.success) return { success: false, error: reserveTx.error };

  const campaign: SponsorCampaign = {
    ...payload, id: campId, totalBudgetTokens: requiredTokens, reservedTokens: requiredTokens,
    distributedTokens: 0, status: 'ACTIVE',
  };

  campaignsRegistry.unshift(campaign);
  return { success: true, campaign };
}

export function getCampaignById(campaignId: string): SponsorCampaign | undefined {
  return campaignsRegistry.find((c) => c.id === campaignId);
}

export function incrementCampaignDistributedTokens(campaignId: string, amount: number): boolean {
  const camp = campaignsRegistry.find((c) => c.id === campaignId);
  if (!camp) return false;
  camp.distributedTokens += amount;
  if (camp.distributedTokens >= camp.totalBudgetTokens) {
    camp.status = 'COMPLETED';
  }
  return true;
}
