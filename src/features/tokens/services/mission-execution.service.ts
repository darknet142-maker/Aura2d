import type {
  UserMissionCompletion,
  MissionValidationRequest,
} from '../types/token-economy.types';
import { applyTokenTransaction } from './token-ledger.service';
import { getCampaignById, incrementCampaignDistributedTokens } from './sponsor-campaign.service';

const completionsRegistry: UserMissionCompletion[] = [];

export function getUserCompletedMissions(userId: string): UserMissionCompletion[] {
  return completionsRegistry.filter((m) => m.userId === userId);
}

export function hasUserCompletedCampaign(userId: string, campaignId: string): boolean {
  return completionsRegistry.some((m) => m.userId === userId && m.campaignId === campaignId);
}

export function validateAndRewardMission(req: MissionValidationRequest): {
  success: boolean;
  rewardTokens?: number;
  error?: string;
  alreadyRewarded?: boolean;
  completion?: UserMissionCompletion;
} {
  const { userId, campaignId, trackId, durationPlayedSeconds } = req;
  if (!userId || !campaignId) {
    return { success: false, error: 'Identifiant utilisateur ou campagne manquant' };
  }

  // 1. Déduplication & Anti-fraude : 1 seule récompense par utilisateur et par campagne
  if (hasUserCompletedCampaign(userId, campaignId)) {
    return {
      success: false,
      alreadyRewarded: true,
      error: 'Mission déjà récompensée pour cet utilisateur (anti-doublon)',
    };
  }

  // 2. Vérification de l'existence et du statut de la campagne
  const camp = getCampaignById(campaignId);
  if (!camp) {
    return { success: false, error: 'Campagne sponsorisée introuvable' };
  }
  if (camp.status !== 'ACTIVE') {
    return { success: false, error: `La campagne n’est plus active (statut: ${camp.status})` };
  }

  // 3. Validation de la condition d'écoute ou d'action qualifiée
  if (camp.missionType === 'LISTEN_1_TRACK' || camp.missionType === 'DISCOVER_ARTIST') {
    if ((durationPlayedSeconds ?? 0) < 30) {
      return {
        success: false,
        error: 'Durée d’écoute qualifiée insuffisante (30 secondes requises)',
      };
    }
  } else if (camp.missionType === 'IN_APP_OPINION') {
    if (!req.opinionText || req.opinionText.trim().length < 10) {
      return {
        success: false,
        error: 'Avis constructif d’au moins 10 caractères requis',
      };
    }
  }

  // 4. Contrôle du budget disponible dans la campagne
  const remainingBudget = camp.totalBudgetTokens - camp.distributedTokens;
  if (remainingBudget < camp.rewardPerMission) {
    camp.status = 'COMPLETED';
    return {
      success: false,
      error: 'Le budget alloué à cette campagne est entièrement distribué',
    };
  }

  // 5. Transaction atomique de récompense dans le Ledger
  const idemKey = `mission-reward-${campaignId}-${userId}`;
  const tx = applyTokenTransaction({
    idempotencyKey: idemKey,
    sourceBucket: 'CAMPAIGN_BUDGET',
    destinationBucket: 'USER_WALLET',
    amountTokens: camp.rewardPerMission,
    userId,
    sponsorId: camp.sponsorId,
    campaignId,
    reason: 'MISSION_REWARD',
    referenceNote: `Récompense mission « ${camp.title} » (${camp.missionType})`,
  });

  if (!tx.success) {
    return { success: false, error: tx.error };
  }

  // 6. Mise à jour de la distribution et clôture automatique si budget atteint
  incrementCampaignDistributedTokens(campaignId, camp.rewardPerMission);

  const completion: UserMissionCompletion = {
    id: `mc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    campaignId,
    userId,
    missionType: camp.missionType,
    completedAtIso: new Date().toISOString(),
    rewardTokens: camp.rewardPerMission,
    transactionId: tx.entry?.transactionId || '',
    proof: {
      trackId,
      durationPlayedSeconds,
      deviceHardwareId: req.deviceHardwareId,
    },
  };

  completionsRegistry.push(completion);
  return { success: true, rewardTokens: camp.rewardPerMission, completion };
}

