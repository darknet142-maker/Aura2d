/**
 * Types & Contrats de l'Économie des Jetons Sponsorisés DROP
 * Règle d'or : Modèle A — Financement exclusif Partenaires / Zéro achat ou retrait auditeur.
 */

export type PartnerRole = 'LABEL' | 'PRODUCER' | 'ARTIST';

export type CampaignMissionType =
  | 'LISTEN_1_TRACK'
  | 'LISTEN_3_TRACKS'
  | 'DISCOVER_ARTIST'
  | 'IN_APP_OPINION';

export type CampaignStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type TokenTransactionReason =
  | 'FUNDING'
  | 'CAMPAIGN_RESERVE'
  | 'MISSION_REWARD'
  | 'PLAN_REDEMPTION'
  | 'ADMIN_ADJUSTMENT'
  | 'REVERSAL';

export type AccountBucket =
  | 'SPONSOR_FUNDING'
  | 'CAMPAIGN_BUDGET'
  | 'USER_WALLET'
  | 'SUBSCRIPTION_RESERVE'
  | 'SYSTEM_PLATFORM';

export interface SponsorAccount {
  id: string;
  name: string;
  legalEntity: string;
  role: PartnerRole;
  isVerified: boolean;
  contactEmail: string;
  createdAtIso: string;
}

export interface SponsorCampaign {
  id: string;
  sponsorId: string;
  title: string;
  targetTrackId?: string;
  targetArtistName?: string;
  totalBudgetTokens: number;
  reservedTokens: number;
  distributedTokens: number;
  rewardPerMission: number;
  maxParticipants: number;
  missionType: CampaignMissionType;
  status: CampaignStatus;
  startDateIso: string;
  endDateIso: string;
}

export interface TokenLedgerEntry {
  transactionId: string;
  idempotencyKey: string;
  timestampIso: string;
  sourceBucket: AccountBucket;
  destinationBucket: AccountBucket;
  amountTokens: number;
  userId?: string;
  sponsorId?: string;
  campaignId?: string;
  reason: TokenTransactionReason;
  referenceNote?: string;
}

export interface UserTokenWallet {
  userId: string;
  availableBalanceTokens: number;
  lifetimeEarnedTokens: number;
  lifetimeSpentTokens: number;
  lastUpdatedIso: string;
}

export interface SponsorTokenWallet {
  sponsorId: string;
  fundedBalanceTokens: number;
  reservedCampaignTokens: number;
  remainingAvailableTokens: number;
  lastUpdatedIso: string;
}

export interface TokenTransactionResult {
  success: boolean;
  isDuplicate?: boolean;
  entry?: TokenLedgerEntry;
  error?: string;
  userWallet?: UserTokenWallet;
  sponsorWallet?: SponsorTokenWallet;
}

export interface UserMissionCompletion {
  id: string;
  campaignId: string;
  userId: string;
  missionType: CampaignMissionType;
  completedAtIso: string;
  rewardTokens: number;
  transactionId: string;
  proof: {
    trackId: string;
    durationPlayedSeconds?: number;
    retentionPct?: number;
    deviceHardwareId?: string;
  };
}

export interface MissionValidationRequest {
  userId: string;
  campaignId: string;
  trackId: string;
  durationPlayedSeconds?: number;
  opinionText?: string;
  deviceHardwareId?: string;
}
