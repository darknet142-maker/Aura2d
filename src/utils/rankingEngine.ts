import { StudioEntityRole } from '../components/ReusableAnalyticsSheets';
import {
  GabonSubscriptionPass,
  GabonNetworkOperator,
} from '../services/offlineStreamTracker';

export type CertificationLevel = 'NONE' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export type ChartTimeframe = 'WEEKLY_7D' | 'MONTHLY_30D' | 'ANNUAL_365D';

export type CreditHandshakeStatus =
  | 'VALIDATED' // Handshake confirmé par les deux parties -> 100% des points actifs
  | 'PENDING_HANDSHAKE' // En attente de validation artisan
  | 'DISPUTED_ESCROW'; // Litige ouvert -> Points techniques sous séquestre jusqu'à résolution

export type FeaturingSplitMode = '70_30' | '50_50';

export interface GabonPassSpec {
  id: GabonSubscriptionPass;
  label: string;
  shortLabel: string;
  paymentMethods: string;
  ecgWeight: number;
  dailyCapPerTrack: number;
  dailyAwardsVoteQuota: number;
}

export const GABON_PASS_SPECS: Record<GabonSubscriptionPass, GabonPassSpec> = {
  PASS_MENSUEL_HEBDO: {
    id: 'PASS_MENSUEL_HEBDO',
    label: 'Pass Mensuel / Hebdo (Airtel & Moov Money)',
    shortLabel: 'Pass Mensuel (1,0 ECG)',
    paymentMethods: 'Airtel Money, Moov Money, Carte Bancaire',
    ecgWeight: 1.0,
    dailyCapPerTrack: 5,
    dailyAwardsVoteQuota: 3,
  },
  PASS_JOURNALIER: {
    id: 'PASS_JOURNALIER',
    label: 'Pass Journalier Payant (Mobile Money)',
    shortLabel: 'Pass 24h (0,8 ECG)',
    paymentMethods: 'Airtel Money, Moov Money',
    ecgWeight: 0.8,
    dailyCapPerTrack: 5,
    dailyAwardsVoteQuota: 3,
  },
  FREEMIUM_PUB: {
    id: 'FREEMIUM_PUB',
    label: 'Compte Freemium Actif (Financé par Pub)',
    shortLabel: 'Freemium Pub (0,5 ECG)',
    paymentMethods: 'Gratuit avec publicité complétée',
    ecgWeight: 0.5,
    dailyCapPerTrack: 3,
    dailyAwardsVoteQuota: 1,
  },
  ESSAI_GRATUIT: {
    id: 'ESSAI_GRATUIT',
    label: 'Période d’Essai Gratuit',
    shortLabel: 'Essai Gratuit (0,5 ECG)',
    paymentMethods: 'Offre découverte temporaire',
    ecgWeight: 0.5,
    dailyCapPerTrack: 3,
    dailyAwardsVoteQuota: 1,
  },
};

export interface EcgValidationResult {
  countedInPersonalStats: boolean;
  countedInChartsAndCerts: boolean;
  ecgEarned: number;
  requiredListenSeconds: number;
  rejectionReason?:
    | 'UNDER_DURATION_THRESHOLD'
    | 'MUTE_STREAMING_ZERO_VOLUME'
    | 'DAILY_USER_CAP_REACHED'
    | 'ROBOTIC_PLAYLIST_LOOP_FREEZE'
    | 'OFFLINE_WINDOW_EXPIRED_14D';
  statusMessage: string;
}

/**
 * Pilier I — Validation technique & Bouclier Anti-Fraude d'une Écoute Certifiée Gabonaise (ECG)
 */
export function evaluateEcgStreamValidation(params: {
  trackDurationSec: number;
  consecutiveListenedSec: number;
  masterVolumePct: number;
  passType: GabonSubscriptionPass;
  playsOfThisTrackTodayByUser: number;
  roboticLoopHoursWithoutInteraction?: number;
  offlineCacheAgeDays?: number;
}): EcgValidationResult {
  const spec = GABON_PASS_SPECS[params.passType] || GABON_PASS_SPECS.PASS_MENSUEL_HEBDO;
  // Règle des 30 secondes consécutives (ou 75% pour les formats courts / interludes < 60s)
  const requiredListenSeconds =
    params.trackDurationSec < 60
      ? Math.max(10, Math.round(params.trackDurationSec * 0.75))
      : 30;

  if (params.consecutiveListenedSec < requiredListenSeconds) {
    return {
      countedInPersonalStats: false,
      countedInChartsAndCerts: false,
      ecgEarned: 0,
      requiredListenSeconds,
      rejectionReason: 'UNDER_DURATION_THRESHOLD',
      statusMessage: `Seuil non atteint (${params.consecutiveListenedSec}s / ${requiredListenSeconds}s consécutives requises)`,
    };
  }

  // Exclusion stricte du « Mute Streaming » (Volume = 0%)
  if (params.masterVolumePct <= 0) {
    return {
      countedInPersonalStats: true,
      countedInChartsAndCerts: false,
      ecgEarned: 0,
      requiredListenSeconds,
      rejectionReason: 'MUTE_STREAMING_ZERO_VOLUME',
      statusMessage:
        'Rejet Anti-Fraude : « Mute Streaming » détecté (Volume à 0%) — 0 ECG attribuée',
    };
  }

  // Fenêtre Hors-Ligne maximale de 14 jours
  if ((params.offlineCacheAgeDays ?? 0) > 14) {
    return {
      countedInPersonalStats: true,
      countedInChartsAndCerts: false,
      ecgEarned: 0,
      requiredListenSeconds,
      rejectionReason: 'OFFLINE_WINDOW_EXPIRED_14D',
      statusMessage:
        'Synchronisation Hors-Ligne expirée (> 14 jours) — Exclue des classements',
    };
  }

  // Exclusion des boucles robotiques (playlist < 5 titres tournant > 4h sans interaction)
  if ((params.roboticLoopHoursWithoutInteraction ?? 0) > 4) {
    return {
      countedInPersonalStats: true,
      countedInChartsAndCerts: false,
      ecgEarned: 0,
      requiredListenSeconds,
      rejectionReason: 'ROBOTIC_PLAYLIST_LOOP_FREEZE',
      statusMessage:
        'Session gelée : Boucle robotique détectée (> 4h sans interaction humaine)',
    };
  }

  // Plafonnement quotidien par utilisateur (5 écoutes/24h payant, 3 écoutes/24h Freemium/Essai)
  if (params.playsOfThisTrackTodayByUser >= spec.dailyCapPerTrack) {
    return {
      countedInPersonalStats: true,
      countedInChartsAndCerts: false,
      ecgEarned: 0,
      requiredListenSeconds,
      rejectionReason: 'DAILY_USER_CAP_REACHED',
      statusMessage: `Plafond quotidien atteint (${spec.dailyCapPerTrack}/${spec.dailyCapPerTrack} écoutes/24h) : Compté dans votre profil, 0 ECG ajoutée aux classements`,
    };
  }

  return {
    countedInPersonalStats: true,
    countedInChartsAndCerts: true,
    ecgEarned: spec.ecgWeight,
    requiredListenSeconds,
    statusMessage: `Écoute Certifiée Gabonaise validée : +${spec.ecgWeight.toFixed(1)} ECG (${spec.shortLabel})`,
  };
}

export interface CertificationInfo {
  level: CertificationLevel;
  categoryType: 'SINGLE' | 'ALBUM' | 'ARTISAN_CAREER';
  label: string;
  shortLabel: string;
  threshold: number;
  weightedEcgCount: number;
  rawEcgCount: number;
  nextLevelLabel?: string;
  nextThreshold?: number;
  progressPct: number;
  gabonTerritoryPct: number;
  isGabonEligible: boolean;
  audit72hStatus: 'VERIFIED' | 'AUDIT_IN_PROGRESS_72H' | 'PENDING_THRESHOLD';
  certificateHash: string;
  antiLocomotiveApplied?: boolean;
  antiLocomotiveReductionEcg?: number;
  artisanIntegrityCheck?: {
    passed: boolean;
    tracksCount: number; // >= 10 requis
    distinctArtistsCount: number; // >= 3 requis
    maxSingleTrackSharePct: number; // <= 15% requis
    maxSingleArtistSharePct: number; // <= 40% requis
    failureReason?: string;
  };
}

export interface TrackCreditHandshake {
  beatmakerStatus?: CreditHandshakeStatus;
  recordingEngineerStatus?: CreditHandshakeStatus;
  mixingEngineerStatus?: CreditHandshakeStatus;
  masteringEngineerStatus?: CreditHandshakeStatus;
  lyricistStatus?: CreditHandshakeStatus;
  status?: 'VERIFIED' | 'PENDING_HANDSHAKE' | 'DISPUTED' | 'RESOLVED';
  confirmedByBeatmaker?: boolean;
  confirmedByEngineer?: boolean;
  confirmedByLyricist?: boolean;
  confirmedByLabel?: boolean;
  escrowFrozen?: boolean;
  audit72hCompleted?: boolean;
  dawAuditRequired?: boolean;
  qrCertificateHash?: string;
  disputeReason?: string;
  disputeOpenedBy?: string;
  disputeOpenedAt?: string;
  retroactiveRecalcAppliedAt?: string;
}

export type CreditHandshakeRecord = TrackCreditHandshake;

export interface RankableTrack {
  id: string;
  title: string;
  artist: string;
  featuringArtists?: string[];
  featuringSplitMode?: FeaturingSplitMode; // '70_30' par défaut ou '50_50' co-production
  album: string;
  category: string;
  labelName: string;
  beatmakerName?: string;
  soundEngineerName?: string; // Ingénieur principal ou Mixage (50%)
  recordingEngineerName?: string; // Prise de voix (20%)
  mixingEngineerName?: string; // Mixage (50%)
  masteringEngineerName?: string; // Mastering (30%)
  lyricistName?: string;
  isExternalLyricist?: boolean; // Plume externe -> Bonus x1,25
  hasSynchronizedLyrics?: boolean; // Obligatoire pour éligibilité Parolier
  realPlays: number; // Compteur en ECG (Écoutes Certifiées Gabonaises)
  gabonTerritoryPct?: number; // Doit être >= 70% pour Certifications Nationales
  weeksInTop10?: number; // Loi d'amortissement : -5%/semaine au-delà de 10 semaines dans le Top 10
  isPreAlbumSingleOver6Months?: boolean; // Compté à 50% dans l'Album
  lufsMasterLevel?: number; // Standard -14 LUFS sans écrêtage
  acousticClippingDetected?: boolean;
  avgRetentionPct?: number; // Complétion audio (> 85% = confort d'écoute optimal)
  retention30sPct?: number; // Accroche 30s-45s
  retention45sPct?: number; // Accroche 45s (Cahier des charges Beatmaker)
  algoPoints?: number;
  likesCount?: number;
  loopPlaysCount?: number;
  recommendationsCount?: number;
  lyricsOpensCount?: number;
  lyricsSharesCount?: number;
  longevityDays?: number;
  halfLifeRetentionJ90Pct?: number; // Maintien à J+30, J+60, J+90 (Paroliers)
  inPlaylist?: boolean;
  baselineRank?: number;
  artistBaselinePlays?: number; // Moyenne des 3 sorties précédentes de l'interprète
  creditHandshake?: TrackCreditHandshake;
  cover: string;
  artworkType?: any;
}

export interface ArtisanTrackContribution {
  trackId: string;
  trackTitle: string;
  artist: string;
  realPlays: number;
  artistHabitualAvg: number;
  deltaImpactRatio: number;
  rawTrackScore: number;
  cappedTrackScore: number;
  shareOfTotalPct: number;
  wasCappedAt25Pct: boolean;
  capLimitPct: number; // 25% Beatmaker/Parolier, 20% Ingénieur du Son
  engineerSubRoleSharePct?: number; // 20% Prise, 50% Mix, 30% Master, ou 100% cumulé
  creditStatus: CreditHandshakeStatus;
}

export interface DecoupledEntityRanking {
  key: string;
  name: string;
  role: StudioEntityRole;
  category: string;
  cover: string;
  artworkType?: any;
  tracksCount: number;
  distinctArtistsCount: number;
  distinctProjectsCount: number;
  distinctGenresCount: number;
  totalPlays: number;
  totalLoops: number;
  avgRetention: number;
  decoupledScore: number;
  avgDeltaImpactRatio: number;
  versatilityMultiplier: number;
  maxSingleTrackSharePct: number;
  maxSingleArtistSharePct: number;
  antiOneHitWonderApplied: boolean;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  tertiaryMetricLabel: string;
  tertiaryMetricValue: string;
  formulaSummary: string;
  trackContributions: ArtisanTrackContribution[];
  careerCertification?: CertificationInfo;
  workCertificatesCount?: number;
  hasEscrowDispute?: boolean;
  requiresDawAudit?: boolean;
  // Pour les artistes
  subscribersCount?: number;
  catalogueDepthPct?: number;
  featuringsCount?: number;
  recurringListenersPct?: number;
  isRevelationEligible?: boolean; // Franchissement du cap 20 000 ECG/mois pour la 1re fois
  // Pour les labels
  medianPlays?: number;
  truncatedMeanPlays?: number;
  catalogueBalancePct?: number;
  labelDivision?: 'LABEL_OFFICIEL' | 'ECURIE_INDEPENDANTE'; // >= 3 artistes actifs requis
  // Pour les beatmakers
  avgRetention30sPct?: number;
  avgRetention45sPct?: number;
  replayRatePct?: number;
  // Pour les ingés son
  completionRatePct?: number;
  playlistInclusionRatePct?: number;
  engineerRolesSummary?: string; // Ex: "Mix (50%) + Master (30%)"
  lufsCompliancePct?: number;
  // Pour les paroliers
  lyricsEngagementRatePct?: number;
  avgLongevityDays?: number;
  externalPlumeBonusApplied?: boolean; // Bonus x1,25 si plume externe
}

export interface DropAwardCategoryResult {
  id: string;
  officialNumber: number;
  title: string;
  subtitle: string;
  criteriaBadge: string;
  scoringGrid: 'GRILLE_A_ARTISTIQUE' | 'GRILLE_B_TECHNIQUE_BLIND';
  eligibilityRuleText: string;
  algoWeightPct: number; // 50%
  juryWeightPct: number; // 25% (Grille A) ou 35% Blind Test (Grille B)
  publicWeightPct: number; // 25% (Grille A) ou 15% (Grille B)
  winner: {
    name: string;
    secondaryName: string;
    scoreLabel: string;
    algoScore: number;
    juryScore: number;
    publicScore: number;
    finalHybridScore: number;
    metricDetail: string;
    cover: string;
    artworkType?: any;
    entityRole?: StudioEntityRole;
    trackId?: string;
    certification?: CertificationInfo;
  };
  nominees: {
    rank: number;
    name: string;
    secondaryName: string;
    scoreLabel: string;
    algoScore: number;
    juryScore: number;
    publicScore: number;
    finalHybridScore: number;
    metricDetail: string;
    cover: string;
    artworkType?: any;
    entityRole?: StudioEntityRole;
    trackId?: string;
    publicVotesCount?: number;
    blindDossierCode?: string; // Ex: "Dossier A", "Dossier B", "Dossier C"
  }[];
}

export interface BlindTestDossier {
  dossierId: string;
  anonymousCode: 'Dossier A' | 'Dossier B' | 'Dossier C' | 'Dossier D';
  role: 'BEATMAKER' | 'ENGINEER' | 'LYRICIST';
  realCandidateName: string; // Masqué pendant le Blind Test Jury !
  normalizedLufs: number; // -14.0 LUFS strict
  hasConflictOfInterest: boolean;
  conflictReason?: string;
  criteriaLabels: [string, string, string, string]; // 4 critères sur 5 pts = /20
  tracksPack: {
    slotLabel: string; // "Piste 1", "Piste 2", "Piste 3"
    trackId: string;
    durationSec: number;
    bpm: number;
    genre: string;
  }[];
}

export interface CommunityRecommendationItem {
  id: string;
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  trackCategory: string;
  cover: string;
  artworkType?: any;
  userId: string;
  userName: string;
  userAvatar: string;
  commentOrLyricExcerpt?: string;
  isLyricExcerpt?: boolean;
  lyricistName?: string;
  createdAt: string;
  boostPoints: number;
}

function generateDeterministicHash(seed: string): string {
  let h1 = 0xdeadbeef ^ seed.length;
  let h2 = 0x41c6ce57 ^ seed.length;
  for (let i = 0, ch; i < seed.length; i++) {
    ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  return `GA-ECG-${hex1}-${hex2}`;
}

/**
 * Pilier III.2 — Calcule la certification nationale officielle d'un SINGLE (Gabon)
 * Seuils officiels :
 * - Single d'Or : 100 000 ECG
 * - Single de Platine : 250 000 ECG
 * - Single de Diamant : 500 000 ECG
 * Condition territoriale : Au moins 70 % des ECG issues du Gabon.
 */
export function getTrackCertification(
  realPlaysEcg: number,
  gabonTerritoryPct = 84,
  trackId = 'track'
): CertificationInfo {
  const isGabonEligible = gabonTerritoryPct >= 70;
  const effectiveEcg = isGabonEligible ? realPlaysEcg : Math.round(realPlaysEcg * 0.65);
  const hash = generateDeterministicHash(`SINGLE:${trackId}:${realPlaysEcg}`);

  if (realPlaysEcg >= 500000 && isGabonEligible) {
    return {
      level: 'DIAMOND',
      categoryType: 'SINGLE',
      label: 'Single de Diamant',
      shortLabel: 'Diamant (500K ECG)',
      threshold: 500000,
      weightedEcgCount: realPlaysEcg,
      rawEcgCount: realPlaysEcg,
      progressPct: 100,
      gabonTerritoryPct,
      isGabonEligible,
      audit72hStatus: 'VERIFIED',
      certificateHash: hash,
    };
  }
  if (realPlaysEcg >= 250000 && isGabonEligible) {
    return {
      level: 'PLATINUM',
      categoryType: 'SINGLE',
      label: 'Single de Platine',
      shortLabel: 'Platine (250K ECG)',
      threshold: 250000,
      weightedEcgCount: realPlaysEcg,
      rawEcgCount: realPlaysEcg,
      nextLevelLabel: 'Single de Diamant',
      nextThreshold: 500000,
      progressPct: Math.min(
        99,
        Math.round(((realPlaysEcg - 250000) / (500000 - 250000)) * 100)
      ),
      gabonTerritoryPct,
      isGabonEligible,
      audit72hStatus: 'VERIFIED',
      certificateHash: hash,
    };
  }
  if (realPlaysEcg >= 100000 && isGabonEligible) {
    return {
      level: 'GOLD',
      categoryType: 'SINGLE',
      label: "Single d'Or",
      shortLabel: 'Or (100K ECG)',
      threshold: 100000,
      weightedEcgCount: realPlaysEcg,
      rawEcgCount: realPlaysEcg,
      nextLevelLabel: 'Single de Platine',
      nextThreshold: 250000,
      progressPct: Math.min(
        99,
        Math.round(((realPlaysEcg - 100000) / (250000 - 100000)) * 100)
      ),
      gabonTerritoryPct,
      isGabonEligible,
      audit72hStatus: realPlaysEcg < 105000 ? 'AUDIT_IN_PROGRESS_72H' : 'VERIFIED',
      certificateHash: hash,
    };
  }
  return {
    level: 'NONE',
    categoryType: 'SINGLE',
    label: isGabonEligible
      ? 'En course vers Single d’Or (100K ECG)'
      : 'Quota Gabon < 70% (Minimum 70% requis)',
    shortLabel: 'Non certifié',
    threshold: 0,
    weightedEcgCount: effectiveEcg,
    rawEcgCount: realPlaysEcg,
    nextLevelLabel: "Single d'Or",
    nextThreshold: 100000,
    progressPct: Math.min(99, Math.round((realPlaysEcg / 100000) * 100)),
    gabonTerritoryPct,
    isGabonEligible,
    audit72hStatus: realPlaysEcg >= 90000 ? 'AUDIT_IN_PROGRESS_72H' : 'PENDING_THRESHOLD',
    certificateHash: hash,
  };
}

/**
 * Pilier III.2 — Règle Anti-Locomotive pour les ALBUMS / EP (5 titres minimum)
 * - Les 2 titres les plus écoutés (locomotives) voient leur volume divisé par 2 (50%).
 * - Aucun titre isolé ne peut représenter plus de 20% du seuil requis.
 * - Les singles sortis > 6 mois avant l'album comptent à 50%.
 */
export function computeAlbumAntiLocomotiveEcg(
  tracks: Pick<RankableTrack, 'realPlays' | 'isPreAlbumSingleOver6Months'>[],
  targetThreshold = 300000
): {
  rawTotalEcg: number;
  weightedAlbumEcg: number;
  antiLocomotiveApplied: boolean;
  reductionEcg: number;
} {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return {
      rawTotalEcg: 0,
      weightedAlbumEcg: 0,
      antiLocomotiveApplied: false,
      reductionEcg: 0,
    };
  }

  const rawTotalEcg = tracks.reduce((acc, t) => acc + (t.realPlays || 0), 0);
  if (tracks.length === 1) {
    // Un seul titre isolé ne peut pas valider un Album sans pondération anti-locomotive
    const cappedSingle = Math.min(rawTotalEcg, Math.round(rawTotalEcg * 0.65));
    return {
      rawTotalEcg,
      weightedAlbumEcg: cappedSingle,
      antiLocomotiveApplied: true,
      reductionEcg: rawTotalEcg - cappedSingle,
    };
  }

  const sorted = [...tracks].sort((a, b) => b.realPlays - a.realPlays);
  const maxPerTrackCap = targetThreshold * 0.2; // Max 20% du seuil par titre
  let weightedSum = 0;

  sorted.forEach((t, idx) => {
    let val = t.realPlays;
    // Singles pré-sortis > 6 mois comptés à 50%
    if (t.isPreAlbumSingleOver6Months) {
      val = Math.round(val * 0.5);
    }
    // Les 2 titres les plus populaires divisés par 2 (50%) si le projet a >= 3 titres
    if (sorted.length >= 3 && (idx === 0 || idx === 1)) {
      val = Math.round(val * 0.5);
    }
    // Plafond de 20% du seuil visé si le projet a >= 5 pistes
    if (sorted.length >= 5) {
      val = Math.min(val, maxPerTrackCap);
    }
    weightedSum += val;
  });

  return {
    rawTotalEcg,
    weightedAlbumEcg: Math.round(weightedSum),
    antiLocomotiveApplied: weightedSum < rawTotalEcg,
    reductionEcg: Math.max(0, Math.round(rawTotalEcg - weightedSum)),
  };
}

/**
 * Calcule la certification officielle d'un ALBUM / EP (Gabon)
 * Seuils officiels :
 * - Album d'Or : 300 000 ECG pondérées
 * - Album de Platine : 750 000 ECG pondérées
 * - Album de Diamant : 1 500 000 ECG pondérées
 */
export function getAlbumCertification(
  totalAlbumPlaysOrTracks:
    | number
    | Pick<RankableTrack, 'realPlays' | 'isPreAlbumSingleOver6Months'>[],
  gabonTerritoryPct = 85
): CertificationInfo {
  let rawEcg = 0;
  let weightedEcg = 0;
  let antiLocomotiveApplied = false;
  let reductionEcg = 0;

  if (typeof totalAlbumPlaysOrTracks === 'number') {
    rawEcg = totalAlbumPlaysOrTracks;
    weightedEcg = totalAlbumPlaysOrTracks;
  } else {
    const rawSum = totalAlbumPlaysOrTracks.reduce((a, b) => a + b.realPlays, 0);
    const target =
      rawSum >= 1200000 ? 1500000 : rawSum >= 600000 ? 750000 : 300000;
    const calc = computeAlbumAntiLocomotiveEcg(totalAlbumPlaysOrTracks, target);
    rawEcg = calc.rawTotalEcg;
    weightedEcg = calc.weightedAlbumEcg;
    antiLocomotiveApplied = calc.antiLocomotiveApplied;
    reductionEcg = calc.reductionEcg;
  }

  const isGabonEligible = gabonTerritoryPct >= 70;
  const hash = generateDeterministicHash(`ALBUM:${rawEcg}:${weightedEcg}`);

  if (weightedEcg >= 1500000 && isGabonEligible) {
    return {
      level: 'DIAMOND',
      categoryType: 'ALBUM',
      label: 'Album de Diamant',
      shortLabel: 'Album Diamant (1,5M ECG)',
      threshold: 1500000,
      weightedEcgCount: weightedEcg,
      rawEcgCount: rawEcg,
      progressPct: 100,
      gabonTerritoryPct,
      isGabonEligible,
      audit72hStatus: 'VERIFIED',
      certificateHash: hash,
      antiLocomotiveApplied,
      antiLocomotiveReductionEcg: reductionEcg,
    };
  }
  if (weightedEcg >= 750000 && isGabonEligible) {
    return {
      level: 'PLATINUM',
      categoryType: 'ALBUM',
      label: 'Album de Platine',
      shortLabel: 'Album Platine (750K ECG)',
      threshold: 750000,
      weightedEcgCount: weightedEcg,
      rawEcgCount: rawEcg,
      nextLevelLabel: 'Album de Diamant',
      nextThreshold: 1500000,
      progressPct: Math.min(
        99,
        Math.round(((weightedEcg - 750000) / (1500000 - 750000)) * 100)
      ),
      gabonTerritoryPct,
      isGabonEligible,
      audit72hStatus: 'VERIFIED',
      certificateHash: hash,
      antiLocomotiveApplied,
      antiLocomotiveReductionEcg: reductionEcg,
    };
  }
  if (weightedEcg >= 300000 && isGabonEligible) {
    return {
      level: 'GOLD',
      categoryType: 'ALBUM',
      label: "Album d'Or",
      shortLabel: 'Album Or (300K ECG)',
      threshold: 300000,
      weightedEcgCount: weightedEcg,
      rawEcgCount: rawEcg,
      nextLevelLabel: 'Album de Platine',
      nextThreshold: 750000,
      progressPct: Math.min(
        99,
        Math.round(((weightedEcg - 300000) / (750000 - 300000)) * 100)
      ),
      gabonTerritoryPct,
      isGabonEligible,
      audit72hStatus: 'VERIFIED',
      certificateHash: hash,
      antiLocomotiveApplied,
      antiLocomotiveReductionEcg: reductionEcg,
    };
  }
  return {
    level: 'NONE',
    categoryType: 'ALBUM',
    label: 'En course vers Album d’Or (300K ECG pondérées)',
    shortLabel: 'Non certifié',
    threshold: 0,
    weightedEcgCount: weightedEcg,
    rawEcgCount: rawEcg,
    nextLevelLabel: "Album d'Or",
    nextThreshold: 300000,
    progressPct: Math.min(99, Math.round((weightedEcg / 300000) * 100)),
    gabonTerritoryPct,
    isGabonEligible,
    audit72hStatus: weightedEcg >= 270000 ? 'AUDIT_IN_PROGRESS_72H' : 'PENDING_THRESHOLD',
    certificateHash: hash,
    antiLocomotiveApplied,
    antiLocomotiveReductionEcg: reductionEcg,
  };
}

/**
 * Pilier III.3 — Niveau 2 : « Disque d'Artisan » (Certification de Carrière pour Beatmakers, Ingés Son, Paroliers)
 * Seuils officiels :
 * - Artisan d'Or : 500 000 ECG cumulées
 * - Artisan de Platine : 1 250 000 ECG cumulées
 * - Artisan de Diamant : 2 500 000 ECG cumulées
 * 3 Conditions d'Intégrité cumulatives :
 * 1. Au moins 10 titres différents (ou en progression vers 10 titres)
 * 2. Au moins 3 artistes différents
 * 3. Aucun titre unique > 15% du volume total & aucun interprète unique > 40% du volume global
 */
export function getArtisanCareerCertification(params: {
  artisanName: string;
  totalEcg: number;
  tracksCount: number;
  distinctArtistsCount: number;
  maxSingleTrackSharePct: number;
  maxSingleArtistSharePct: number;
}): CertificationInfo {
  const {
    artisanName,
    totalEcg,
    tracksCount,
    distinctArtistsCount,
    maxSingleTrackSharePct,
    maxSingleArtistSharePct,
  } = params;

  const minTracksOk = tracksCount >= 10;
  const minArtistsOk = distinctArtistsCount >= 3;
  const trackCapOk = maxSingleTrackSharePct <= 15;
  const artistCapOk = maxSingleArtistSharePct <= 40;
  const passedIntegrity = minTracksOk && minArtistsOk && trackCapOk && artistCapOk;

  let failureReason: string | undefined;
  if (!minTracksOk) {
    failureReason = `${tracksCount}/10 titres minimum requis`;
  } else if (!minArtistsOk) {
    failureReason = `${distinctArtistsCount}/3 artistes distincts requis`;
  } else if (!trackCapOk) {
    failureReason = `Un titre dépasse le plafond de 15% (${maxSingleTrackSharePct}%)`;
  } else if (!artistCapOk) {
    failureReason = `Un artiste dépasse le plafond de 40% (${maxSingleArtistSharePct}%)`;
  }

  const hash = generateDeterministicHash(`ARTISAN:${artisanName}:${totalEcg}`);
  const integrityObj = {
    passed: passedIntegrity,
    tracksCount,
    distinctArtistsCount,
    maxSingleTrackSharePct,
    maxSingleArtistSharePct,
    failureReason,
  };

  if (totalEcg >= 2500000 && passedIntegrity) {
    return {
      level: 'DIAMOND',
      categoryType: 'ARTISAN_CAREER',
      label: 'Disque d’Artisan de Diamant',
      shortLabel: 'Artisan Diamant (2,5M ECG)',
      threshold: 2500000,
      weightedEcgCount: totalEcg,
      rawEcgCount: totalEcg,
      progressPct: 100,
      gabonTerritoryPct: 86,
      isGabonEligible: true,
      audit72hStatus: 'VERIFIED',
      certificateHash: hash,
      artisanIntegrityCheck: integrityObj,
    };
  }
  if (totalEcg >= 1250000 && passedIntegrity) {
    return {
      level: 'PLATINUM',
      categoryType: 'ARTISAN_CAREER',
      label: 'Disque d’Artisan de Platine',
      shortLabel: 'Artisan Platine (1,25M ECG)',
      threshold: 1250000,
      weightedEcgCount: totalEcg,
      rawEcgCount: totalEcg,
      nextLevelLabel: 'Artisan de Diamant',
      nextThreshold: 2500000,
      progressPct: Math.min(
        99,
        Math.round(((totalEcg - 1250000) / (2500000 - 1250000)) * 100)
      ),
      gabonTerritoryPct: 86,
      isGabonEligible: true,
      audit72hStatus: 'VERIFIED',
      certificateHash: hash,
      artisanIntegrityCheck: integrityObj,
    };
  }
  if (totalEcg >= 500000 && passedIntegrity) {
    return {
      level: 'GOLD',
      categoryType: 'ARTISAN_CAREER',
      label: 'Disque d’Artisan d’Or',
      shortLabel: 'Artisan d’Or (500K ECG)',
      threshold: 500000,
      weightedEcgCount: totalEcg,
      rawEcgCount: totalEcg,
      nextLevelLabel: 'Artisan de Platine',
      nextThreshold: 1250000,
      progressPct: Math.min(
        99,
        Math.round(((totalEcg - 500000) / (1250000 - 500000)) * 100)
      ),
      gabonTerritoryPct: 86,
      isGabonEligible: true,
      audit72hStatus: 'VERIFIED',
      certificateHash: hash,
      artisanIntegrityCheck: integrityObj,
    };
  }

  return {
    level: 'NONE',
    categoryType: 'ARTISAN_CAREER',
    label: failureReason
      ? `En course vers Artisan d’Or (${failureReason})`
      : 'En course vers Disque d’Artisan d’Or (500K ECG)',
    shortLabel: 'En progression Carrière',
    threshold: 0,
    weightedEcgCount: totalEcg,
    rawEcgCount: totalEcg,
    nextLevelLabel: 'Artisan d’Or',
    nextThreshold: 500000,
    progressPct: Math.min(99, Math.round((totalEcg / 500000) * 100)),
    gabonTerritoryPct: 86,
    isGabonEligible: true,
    audit72hStatus: totalEcg >= 450000 ? 'AUDIT_IN_PROGRESS_72H' : 'PENDING_THRESHOLD',
    certificateHash: hash,
    artisanIntegrityCheck: integrityObj,
  };
}

/**
 * Pilier II.1 — Classement 1 : Top Chansons / Titres (Puissance Virale)
 * Formule officielle :
 * Score Titre = (0,60 * V_ECG) + (0,25 * C_vélocité) + (0,15 * E_social)
 * + Loi d'amortissement (Usure naturelle) : Après 10 semaines dans le Top 10,
 *   abattement de -5% par semaine supplémentaire sur le score de classement uniquement.
 */
export function computeTrackExplosionScore(
  t: RankableTrack,
  timeframe: ChartTimeframe = 'MONTHLY_30D'
): {
  explosionScore: number;
  rawScoreBeforeDecay: number;
  volumeComponent: number;
  growthComponent: number;
  socialComponent: number;
  shareRatePct: number;
  decayWeeksOver10: number;
  decayPenaltyPct: number;
} {
  const timeframeFactor =
    timeframe === 'WEEKLY_7D' ? 0.26 : timeframe === 'ANNUAL_365D' ? 1.35 : 1.0;
  const plays = Math.max(1, t.realPlays * timeframeFactor);
  const recs = (t.recommendationsCount ?? Math.round(t.realPlays * 0.018)) * timeframeFactor;
  const loops = (t.loopPlaysCount ?? Math.round(t.realPlays * 0.01)) * timeframeFactor;
  const likes = (t.likesCount ?? Math.round(t.realPlays * 0.05)) * timeframeFactor;
  const longevity = Math.max(1, t.longevityDays ?? 21);

  // 1. Volume d'ECG sur la période (normalisé sur 100 puis pondéré à 60%)
  const normalizedVolume100 = Math.min(100, Math.pow(plays / 500000, 0.58) * 100);
  const volumeComponent = normalizedVolume100 * 0.6;

  // 2. Vélocité / Taux de croissance (25%)
  const dailyVelocity = t.realPlays / longevity;
  const normalizedVelocity100 = Math.min(100, Math.pow(dailyVelocity / 8500, 0.62) * 100);
  const growthComponent = normalizedVelocity100 * 0.25;

  // 3. Engagement social : Partages in-app, ajouts favoris/playlists, taux de complétion (15%)
  const shareRatio = (recs + likes * 0.4 + loops * 0.8) / Math.max(500, plays);
  const normalizedSocial100 = Math.min(
    100,
    shareRatio * 520 + ((t.avgRetentionPct ?? 88) / 100) * 28
  );
  const socialComponent = normalizedSocial100 * 0.15;

  const rawScoreBeforeDecay =
    Math.round((volumeComponent + growthComponent + socialComponent) * 100) / 100;

  // Loi d'amortissement : -5% par semaine au-delà de 10 semaines de présence dans le Top 10
  const weeksInTop10 = t.weeksInTop10 ?? (longevity > 70 ? Math.floor(longevity / 7) : 4);
  const decayWeeksOver10 = Math.max(0, weeksInTop10 - 10);
  const decayPenaltyPct = Math.min(45, decayWeeksOver10 * 5);
  const decayMultiplier = 1 - decayPenaltyPct / 100;

  const explosionScore =
    Math.round(rawScoreBeforeDecay * decayMultiplier * 100) / 100;

  return {
    explosionScore,
    rawScoreBeforeDecay,
    volumeComponent: Math.round(volumeComponent * 10) / 10,
    growthComponent: Math.round(growthComponent * 10) / 10,
    socialComponent: Math.round(socialComponent * 10) / 10,
    shareRatePct: Math.round(((recs / Math.max(1, plays)) * 1000)) / 10,
    decayWeeksOver10,
    decayPenaltyPct,
  };
}

/**
 * Calcule la moyenne habituelle des 3 sorties précédentes de chaque artiste principal
 * pour mesurer le Delta d'Impact (Pilier II.3).
 */
export function computeArtistHabitualBaselines(
  tracks: RankableTrack[]
): Record<string, number> {
  const byArtist: Record<string, number[]> = {};
  for (const t of tracks) {
    const key = t.artist.toLowerCase();
    if (!byArtist[key]) byArtist[key] = [];
    if (t.artistBaselinePlays && t.artistBaselinePlays > 0) {
      byArtist[key].push(t.artistBaselinePlays);
    } else {
      byArtist[key].push(Math.max(15000, Math.round(t.realPlays * 0.68)));
    }
  }

  const baselines: Record<string, number> = {};
  for (const [artistKey, vals] of Object.entries(byArtist)) {
    const last3 = vals.slice(0, 3);
    const sum = last3.reduce((a, b) => a + b, 0);
    baselines[artistKey] = Math.max(10000, Math.round(sum / last3.length));
  }
  return baselines;
}

/**
 * Pilier II.3 — Multiplicateur de Polyvalence officiel sur 90 jours :
 * - 1 seul artiste produit : x0,70 (pénalité d'exclusivité)
 * - 2 artistes distincts : x1,00 (neutre)
 * - 3 à 4 artistes distincts : x1,20 (bonus de diversité)
 * - 5 artistes distincts et + : x1,40 (bonus d'excellence)
 */
export function getOfficialVersatilityMultiplier(distinctArtistsCount: number): number {
  if (distinctArtistsCount <= 1) return 0.7;
  if (distinctArtistsCount === 2) return 1.0;
  if (distinctArtistsCount <= 4) return 1.2;
  return 1.4;
}

/**
 * Applique le Plafonnement strict par Titre :
 * - 25% maximum du score total pour Beatmakers & Paroliers (obligeant à performer sur >= 4 titres)
 * - 20% maximum du score total pour Ingénieurs du Son (obligeant à performer sur >= 5 titres)
 */
function applyStrictArtisanTrackCap(
  rawContributions: {
    track: RankableTrack;
    artistHabitualAvg: number;
    deltaImpactRatio: number;
    rawScore: number;
    engineerSubRoleSharePct?: number;
    creditStatus: CreditHandshakeStatus;
  }[],
  versatilityMultiplier: number,
  maxCapPctPerTrack: 25 | 20
): {
  totalDecoupledScore: number;
  maxSharePct: number;
  antiOneHitApplied: boolean;
  contributions: ArtisanTrackContribution[];
} {
  if (rawContributions.length === 0) {
    return {
      totalDecoupledScore: 0,
      maxSharePct: 0,
      antiOneHitApplied: false,
      contributions: [],
    };
  }

  const minRequiredTracksForFullPortfolio = maxCapPctPerTrack === 20 ? 5 : 4;
  const capFraction = maxCapPctPerTrack / 100;

  // Les titres sous séquestre (DISPUTED_ESCROW) ont leurs points techniques temporairement gelés (0 pt)
  const activeContribs = rawContributions.map((item) => {
    const escrowFactor = item.creditStatus === 'DISPUTED_ESCROW' ? 0 : 1;
    const effectiveRaw = item.rawScore * escrowFactor;
    const softDiminished =
      effectiveRaw > 28
        ? 28 + Math.sqrt(effectiveRaw - 28) * 3.4
        : effectiveRaw;
    return {
      ...item,
      diminishedScore: softDiminished,
    };
  });

  const sumDiminished = activeContribs.reduce((acc, c) => acc + c.diminishedScore, 0);
  const avgPerTrack = sumDiminished / Math.max(1, activeContribs.length);
  const referencePortfolioTotal = Math.max(
    sumDiminished,
    avgPerTrack * minRequiredTracksForFullPortfolio
  );
  const maxAllowedPerTrack = referencePortfolioTotal * capFraction;

  let antiOneHitApplied = activeContribs.length < minRequiredTracksForFullPortfolio;
  const cappedList = activeContribs.map((item) => {
    const isCapped = item.diminishedScore > maxAllowedPerTrack + 0.05;
    if (isCapped) antiOneHitApplied = true;
    const cappedVal = Math.min(item.diminishedScore, maxAllowedPerTrack);
    return {
      ...item,
      cappedScore: Math.round(cappedVal * 100) / 100,
      wasCapped: isCapped || activeContribs.length < minRequiredTracksForFullPortfolio,
    };
  });

  const sumCapped = cappedList.reduce((acc, c) => acc + c.cappedScore, 0);
  const portfolioDenominator = Math.max(sumCapped, referencePortfolioTotal, 1);

  const contributions: ArtisanTrackContribution[] = cappedList.map((c) => {
    const sharePct = Math.min(
      maxCapPctPerTrack,
      Math.round((c.cappedScore / portfolioDenominator) * 1000) / 10
    );
    return {
      trackId: c.track.id,
      trackTitle: c.track.title,
      artist: c.track.artist,
      realPlays: c.track.realPlays,
      artistHabitualAvg: c.artistHabitualAvg,
      deltaImpactRatio: Math.round(c.deltaImpactRatio * 100) / 100,
      rawTrackScore: Math.round(c.rawScore * 10) / 10,
      cappedTrackScore: c.cappedScore,
      shareOfTotalPct: sharePct,
      wasCappedAt25Pct: c.wasCapped,
      capLimitPct: maxCapPctPerTrack,
      engineerSubRoleSharePct: c.engineerSubRoleSharePct,
      creditStatus: c.creditStatus,
    };
  });

  const maxSharePct = Math.max(...contributions.map((c) => c.shareOfTotalPct), 0);
  const totalDecoupledScore =
    Math.round(sumCapped * versatilityMultiplier * 10) / 10;

  return {
    totalDecoupledScore,
    maxSharePct,
    antiOneHitApplied,
    contributions,
  };
}

/**
 * Pilier II — Calcule l'intégralité des 6 classements officiels découplés :
 * - ARTIST (40% Volume ECG [70/30 ou 50/50 feat] + 30% Profondeur catalogue + 30% Fidélisation/Abonnés)
 * - LABEL (Éligibilité >= 3 artistes actifs + 40% Médiane/Moyenne tronquée + 25% Équilibre roster + 20% Signatures + 15% Métadonnées)
 * - BEATMAKER ([35% Volume plafonné 25% + 35% Delta Impact + 30% Accroche 45s & Loop] × Multiplicateur Polyvalence x0.70..x1.40)
 * - ENGINEER (Ventilation Prise 20% / Mix 50% / Master 30% + 35% Complétion >85% + 25% Conformité -14 LUFS + 25% Volume plafonné 20% + 15% Diversité)
 * - LYRICIST (Paroles synchronisées requises + 35% Engagement lyrique + 30% Longévité J+90 + 20% Volume plafonné 25% + 15% Bonus Plume Externe x1.25)
 */
export function computeAllDecoupledStudioRankings(
  tracks: RankableTrack[],
  artistSubscribers: Record<string, number>,
  timeframe: ChartTimeframe = 'MONTHLY_30D'
): DecoupledEntityRanking[] {
  const safeTracks = Array.isArray(tracks) ? tracks : [];
  const artistBaselines = computeArtistHabitualBaselines(safeTracks);
  const results: DecoupledEntityRanking[] = [];

  const roleGroups = new Map<
    string,
    {
      name: string;
      role: StudioEntityRole;
      tracks: RankableTrack[];
      featuringTracks: RankableTrack[];
      engineerWeightsByTrackId: Record<string, { pct: number; roles: string[] }>;
    }
  >();

  const registerTrackForEntity = (
    rawName: string | undefined,
    role: StudioEntityRole,
    track: RankableTrack,
    isFeaturing = false,
    engineerRoleInfo?: { pct: number; roleLabel: string }
  ) => {
    const cleanName = (rawName || '').trim();
    if (!cleanName) return;
    const key = `${role}:${cleanName.toLowerCase()}`;
    let existing = roleGroups.get(key);
    if (!existing) {
      existing = {
        name: cleanName,
        role,
        tracks: isFeaturing ? [] : [track],
        featuringTracks: isFeaturing ? [track] : [],
        engineerWeightsByTrackId: {},
      };
      roleGroups.set(key, existing);
    } else {
      if (isFeaturing) {
        if (!existing.featuringTracks.some((t) => t.id === track.id)) {
          existing.featuringTracks.push(track);
        }
      } else {
        if (!existing.tracks.some((t) => t.id === track.id)) {
          existing.tracks.push(track);
        }
      }
    }

    if (role === 'ENGINEER' && engineerRoleInfo) {
      const prev = existing.engineerWeightsByTrackId[track.id] || {
        pct: 0,
        roles: [],
      };
      if (!prev.roles.includes(engineerRoleInfo.roleLabel)) {
        prev.pct = Math.min(100, prev.pct + engineerRoleInfo.pct);
        prev.roles.push(engineerRoleInfo.roleLabel);
      }
      existing.engineerWeightsByTrackId[track.id] = prev;
    }
  };

  for (const t of safeTracks) {
    registerTrackForEntity(t.artist, 'ARTIST', t, false);
    if (t.featuringArtists && t.featuringArtists.length > 0) {
      for (const featArtist of t.featuringArtists) {
        registerTrackForEntity(featArtist, 'ARTIST', t, true);
      }
    }
    registerTrackForEntity(t.labelName, 'LABEL', t, false);
    registerTrackForEntity(t.beatmakerName || 'Studio DROP', 'BEATMAKER', t, false);

    // Ventilation Ingénieur du Son : Prise de voix (20%), Mixage (50%), Mastering (30%)
    const recEng = t.recordingEngineerName || t.soundEngineerName || 'Mastering DROP';
    const mixEng = t.mixingEngineerName || t.soundEngineerName || 'Mastering DROP';
    const mastEng = t.masteringEngineerName || t.soundEngineerName || 'Mastering DROP';

    registerTrackForEntity(recEng, 'ENGINEER', t, false, {
      pct: 20,
      roleLabel: 'Prise (20%)',
    });
    registerTrackForEntity(mixEng, 'ENGINEER', t, false, {
      pct: 50,
      roleLabel: 'Mix (50%)',
    });
    registerTrackForEntity(mastEng, 'ENGINEER', t, false, {
      pct: 30,
      roleLabel: 'Master (30%)',
    });

    // Parolier : uniquement si paroles présentes (hasSynchronizedLyrics !== false)
    if (t.hasSynchronizedLyrics !== false) {
      registerTrackForEntity(t.lyricistName || t.artist, 'LYRICIST', t, false);
    }
  }

  for (const [key, group] of roleGroups.entries()) {
    const allEntityTracks = [...group.tracks, ...group.featuringTracks];
    if (allEntityTracks.length === 0) continue;

    const firstTrack = allEntityTracks[0];
    const totalPlays = allEntityTracks.reduce((acc, t) => acc + t.realPlays, 0);
    const totalLoops = allEntityTracks.reduce(
      (acc, t) => acc + (t.loopPlaysCount ?? 0),
      0
    );
    const avgRetention = Math.round(
      allEntityTracks.reduce((acc, t) => acc + (t.avgRetentionPct ?? 86), 0) /
        allEntityTracks.length
    );

    const distinctArtists = new Set(
      allEntityTracks.map((t) => t.artist.toLowerCase())
    ).size;
    const distinctProjects = new Set(
      allEntityTracks.map((t) => t.album.toLowerCase())
    ).size;
    const distinctGenres = new Set(
      allEntityTracks.map((t) => t.category.toLowerCase())
    ).size;

    // Calcul du poids maximal d'un seul titre et d'un seul artiste dans le catalogue de l'entité
    const maxTrackPlays = Math.max(...allEntityTracks.map((t) => t.realPlays), 0);
    const maxSingleTrackRawSharePct =
      Math.round((maxTrackPlays / Math.max(1, totalPlays)) * 1000) / 10;

    const playsByArtist: Record<string, number> = {};
    for (const t of allEntityTracks) {
      const aKey = t.artist.toLowerCase();
      playsByArtist[aKey] = (playsByArtist[aKey] || 0) + t.realPlays;
    }
    const maxArtistPlays = Math.max(...Object.values(playsByArtist), 0);
    const maxSingleArtistSharePct =
      Math.round((maxArtistPlays / Math.max(1, totalPlays)) * 1000) / 10;

    // Nombre de certificats d'œuvre (Niveau 1) obtenus sur des singles certifiés (>= 100 000 ECG)
    const workCertificatesCount = allEntityTracks.filter(
      (t) => t.realPlays >= 100000
    ).length;

    // Détection Anti-Cumul Abusif (DAW Audit) : si la même personne cumule Artiste + Beatmaker + Mix + Master
    const requiresDawAudit = allEntityTracks.some((t) => {
      const n = group.name.toLowerCase();
      return (
        t.artist.toLowerCase() === n &&
        (t.beatmakerName || '').toLowerCase() === n &&
        (t.mixingEngineerName || t.soundEngineerName || '').toLowerCase() === n &&
        (t.masteringEngineerName || t.soundEngineerName || '').toLowerCase() === n
      );
    });

    if (group.role === 'ARTIST') {
      // =====================================================================
      // CLASSEMENT 2 : TOP ARTISTES (Puissance & Fidélité Communautaire)
      // - 40% Volume Global ECG (pondéré 70% Principal / 30% Featuring, ou 50/50)
      // - 30% Profondeur de Catalogue (>= 3 titres, pénalité si 1 titre > 95%)
      // - 30% Fidélisation & Conversion (Abonnés Suivre + Auditeurs récurrents >= 3x/mois)
      // =====================================================================
      const weightedArtistEcg =
        group.tracks.reduce((acc, t) => {
          const hasFeat = t.featuringArtists && t.featuringArtists.length > 0;
          if (!hasFeat) return acc + t.realPlays;
          const factor = t.featuringSplitMode === '50_50' ? 0.5 : 0.7;
          return acc + Math.round(t.realPlays * factor);
        }, 0) +
        group.featuringTracks.reduce((acc, t) => {
          const featCount = Math.max(1, t.featuringArtists?.length || 1);
          const totalFeatShare = t.featuringSplitMode === '50_50' ? 0.5 : 0.3;
          return acc + Math.round((t.realPlays * totalFeatShare) / featCount);
        }, 0);

      const subs =
        artistSubscribers[group.name] ??
        artistSubscribers[group.name.toLowerCase()] ??
        Math.round(totalPlays * 0.055 + 850);
      const conversionRatePct =
        Math.round((subs / Math.max(1000, totalPlays)) * 1000) / 10;

      const sortedByPlays = [...allEntityTracks].sort(
        (a, b) => b.realPlays - a.realPlays
      );
      const topTrackPlays = sortedByPlays[0]?.realPlays ?? totalPlays;
      const topTrackDominance = topTrackPlays / Math.max(1, totalPlays);
      const nonTopPlays = Math.max(0, totalPlays - topTrackPlays);

      // Pénalité si un seul titre génère > 95% du trafic (One-Hit Wonder)
      const oneHitPenalty = topTrackDominance > 0.95 && allEntityTracks.length === 1 ? 0.65 : 1.0;
      const catalogueDepthPct =
        allEntityTracks.length > 1
          ? Math.min(100, Math.round((nonTopPlays / Math.max(1, totalPlays)) * 165))
          : Math.round(42 * oneHitPenalty);

      const recurringListenersPct = Math.min(
        96,
        Math.round(avgRetention * 0.65 + Math.min(30, conversionRatePct * 2.5))
      );

      // Composantes pondérées (40% / 30% / 30%)
      const volScore40 = Math.min(40, Math.pow(weightedArtistEcg / 900000, 0.55) * 40);
      const depthScore30 = (catalogueDepthPct / 100) * 30 * oneHitPenalty;
      const loyaltyScore30 = Math.min(
        30,
        (recurringListenersPct / 100) * 18 + Math.min(12, conversionRatePct * 1.6)
      );

      const decoupledScore =
        Math.round((volScore40 + depthScore30 + loyaltyScore30) * 10) / 10;

      // Éligibilité Révélation de l'Année : franchissement du cap 20 000 ECG/mois pour la 1re fois
      const isRevelationEligible =
        totalPlays >= 20000 && totalPlays <= 260000 && conversionRatePct >= 4.5;

      results.push({
        key,
        name: group.name,
        role: 'ARTIST',
        category: firstTrack.category,
        cover: firstTrack.cover,
        artworkType: firstTrack.artworkType,
        tracksCount: allEntityTracks.length,
        distinctArtistsCount: distinctArtists,
        distinctProjectsCount: distinctProjects,
        distinctGenresCount: distinctGenres,
        totalPlays: weightedArtistEcg,
        totalLoops,
        avgRetention,
        decoupledScore,
        avgDeltaImpactRatio: 1.0,
        versatilityMultiplier: 1 + group.featuringTracks.length * 0.1,
        maxSingleTrackSharePct: Math.round(topTrackDominance * 100),
        maxSingleArtistSharePct: 100,
        antiOneHitWonderApplied: topTrackDominance > 0.95,
        primaryMetricLabel: 'ECG Pondérées (70/30 Feat)',
        primaryMetricValue: `${Math.round(weightedArtistEcg / 1000)}K ECG`,
        secondaryMetricLabel: 'Profondeur Catalogue (30%)',
        secondaryMetricValue: `${catalogueDepthPct}% (${allEntityTracks.length} titres)`,
        tertiaryMetricLabel: 'Fidélité & Abonnés (30%)',
        tertiaryMetricValue: `${subs.toLocaleString('fr-FR')} fans (${conversionRatePct}%)`,
        formulaSummary:
          '40% Volume ECG (70/30 Feat) + 30% Profondeur Catalogue + 30% Fidélisation & Conversion Abonnés',
        trackContributions: [],
        workCertificatesCount,
        requiresDawAudit,
        subscribersCount: subs,
        catalogueDepthPct,
        featuringsCount: group.featuringTracks.length,
        recurringListenersPct,
        isRevelationEligible,
      });
      continue;
    }

    if (group.role === 'LABEL') {
      // =====================================================================
      // CLASSEMENT 6 : TOP LABELS / MAISONS DE PRODUCTION (Force Collective)
      // - Éligibilité : Minimum 3 artistes actifs (sinon division « Écuries Indépendantes »)
      // - 40% Médiane de performance du catalogue & Moyenne tronquée (-50% sur la locomotive)
      // - 25% Indice d'équilibre du roster (pénalité si 1 artiste > 80% des écoutes)
      // - 20% Développement de nouvelles signatures
      // - 15% Régularité & Conformité 100% des métadonnées
      // =====================================================================
      const playsSorted = [...allEntityTracks]
        .map((t) => t.realPlays)
        .sort((a, b) => a - b);
      const mid = Math.floor(playsSorted.length / 2);
      const medianPlays =
        playsSorted.length % 2 !== 0
          ? playsSorted[mid]
          : Math.round((playsSorted[mid - 1] + playsSorted[mid]) / 2);

      // Moyenne tronquée réduisant de 50% le poids du titre locomotive le plus écouté
      const highestTrack = playsSorted[playsSorted.length - 1] || 0;
      const truncatedSum = totalPlays - Math.round(highestTrack * 0.5);
      const truncatedMeanPlays = Math.round(
        truncatedSum / Math.max(1, allEntityTracks.length)
      );

      // Indice d'équilibre du roster : pénalité si un seul artiste > 80% du trafic du label
      const topArtistDominanceRatio = maxArtistPlays / Math.max(1, totalPlays);
      const rosterPenalty = topArtistDominanceRatio > 0.8 ? 0.55 : 1.0;
      const catalogueBalancePct = Math.max(
        18,
        Math.min(98, Math.round((1 - topArtistDominanceRatio * 0.62) * 100 * rosterPenalty))
      );

      const labelDivision =
        distinctArtists >= 3 ? 'LABEL_OFFICIEL' : 'ECURIE_INDEPENDANTE';

      // Calcul des 4 composantes (40% / 25% / 20% / 15%)
      const medianComponent40 = Math.min(
        40,
        Math.pow(((medianPlays + truncatedMeanPlays) / 2) / 350000, 0.58) * 40
      );
      const balanceComponent25 = (catalogueBalancePct / 100) * 25;
      const signaturesComponent20 = Math.min(20, distinctArtists * 5.2);
      const metadataCompliance15 = 15; // 100% des métadonnées techniques renseignées

      const rawLabelScore =
        medianComponent40 +
        balanceComponent25 +
        signaturesComponent20 +
        metadataCompliance15;

      const decoupledScore =
        Math.round(
          rawLabelScore * (labelDivision === 'LABEL_OFFICIEL' ? 1.0 : 0.82) * 10
        ) / 10;

      results.push({
        key,
        name: group.name,
        role: 'LABEL',
        category: firstTrack.category,
        cover: firstTrack.cover,
        artworkType: firstTrack.artworkType,
        tracksCount: allEntityTracks.length,
        distinctArtistsCount: distinctArtists,
        distinctProjectsCount: distinctProjects,
        distinctGenresCount: distinctGenres,
        totalPlays,
        totalLoops,
        avgRetention,
        decoupledScore,
        avgDeltaImpactRatio:
          Math.round((medianPlays / Math.max(1, truncatedMeanPlays)) * 100) / 100,
        versatilityMultiplier: labelDivision === 'LABEL_OFFICIEL' ? 1.2 : 0.85,
        maxSingleTrackSharePct: Math.round(maxSingleTrackRawSharePct),
        maxSingleArtistSharePct: Math.round(topArtistDominanceRatio * 100),
        antiOneHitWonderApplied: true,
        primaryMetricLabel: 'Médiane & Moy. Tronquée (40%)',
        primaryMetricValue: `${Math.round(medianPlays / 1000)}K / ${Math.round(truncatedMeanPlays / 1000)}K ECG`,
        secondaryMetricLabel: 'Équilibre Roster (25%)',
        secondaryMetricValue: `${catalogueBalancePct}% (Max artiste: ${Math.round(topArtistDominanceRatio * 100)}%)`,
        tertiaryMetricLabel: 'Division & Signatures',
        tertiaryMetricValue:
          labelDivision === 'LABEL_OFFICIEL'
            ? `Division Label (${distinctArtists} artistes)`
            : `Écurie Indé (${distinctArtists}/3 artistes)`,
        formulaSummary:
          '40% Médiane Catalogue + 25% Équilibre Roster (<80%/artiste) + 20% Nouvelles Signatures + 15% Métadonnées (Min. 3 artistes)',
        trackContributions: [],
        workCertificatesCount,
        medianPlays,
        truncatedMeanPlays,
        catalogueBalancePct,
        labelDivision,
      });
      continue;
    }

    // =======================================================================
    // MÉTIERS DE L'OMBRE : BEATMAKER, ENGINEER, LYRICIST
    // Application stricte des formules du Livre Blanc & Cahier des Charges
    // =======================================================================
    const officialVersatility = getOfficialVersatilityMultiplier(distinctArtists);
    let hasEscrowDispute = false;

    const rawContribs = allEntityTracks.map((t) => {
      const habitualAvg =
        t.artistBaselinePlays ??
        artistBaselines[t.artist.toLowerCase()] ??
        Math.max(15000, Math.round(t.realPlays * 0.68));

      // Delta d'Impact : Ratio entre les ECG du titre (30 premiers jours) et la moyenne des 3 sorties précédentes de l'interprète
      const deltaImpactRatio = Math.max(0.4, t.realPlays / Math.max(5000, habitualAvg));
      const deltaImpactScore = Math.min(35, Math.pow(deltaImpactRatio, 0.82) * 14.5);

      const retention45s =
        t.retention45sPct ??
        t.retention30sPct ??
        Math.min(99, (t.avgRetentionPct ?? 88) + 4);
      const completionRate = t.avgRetentionPct ?? 88;
      const replayRate =
        ((t.loopPlaysCount ?? 400) / Math.max(1000, t.realPlays)) * 1000;
      const lyricsOpens = t.lyricsOpensCount ?? Math.round(t.realPlays * 0.16);
      const lyricsShares = t.lyricsSharesCount ?? Math.round(t.realPlays * 0.025);
      const longevityDays = t.longevityDays ?? 45;
      const halfLifeJ90 = t.halfLifeRetentionJ90Pct ?? Math.min(95, 55 + Math.round(longevityDays * 0.35));

      let creditStatus: CreditHandshakeStatus = 'VALIDATED';
      if (t.creditHandshake) {
        const isEscrow =
          t.creditHandshake.status === 'DISPUTED' ||
          t.creditHandshake.escrowFrozen === true;
        if (group.role === 'BEATMAKER') {
          creditStatus =
            t.creditHandshake.beatmakerStatus ||
            (isEscrow
              ? 'DISPUTED_ESCROW'
              : t.creditHandshake.confirmedByBeatmaker === false
                ? 'PENDING_HANDSHAKE'
                : 'VALIDATED');
        } else if (group.role === 'ENGINEER') {
          creditStatus =
            t.creditHandshake.mixingEngineerStatus ||
            (isEscrow && t.creditHandshake.confirmedByEngineer === false
              ? 'DISPUTED_ESCROW'
              : t.creditHandshake.confirmedByEngineer === false
                ? 'PENDING_HANDSHAKE'
                : 'VALIDATED');
        } else if (group.role === 'LYRICIST') {
          creditStatus =
            t.creditHandshake.lyricistStatus ||
            (isEscrow && t.creditHandshake.confirmedByLyricist === false
              ? 'DISPUTED_ESCROW'
              : t.creditHandshake.confirmedByLyricist === false
                ? 'PENDING_HANDSHAKE'
                : 'VALIDATED');
        }
      }
      if (creditStatus === 'DISPUTED_ESCROW') {
        hasEscrowDispute = true;
      }

      let professionSpecificScore = 0;
      let engineerSubRoleSharePct: number | undefined;

      if (group.role === 'BEATMAKER') {
        // CLASSEMENT 3 — BEATMAKER :
        // [(0,35 * V_plafonné) + (0,35 * Delta_impact) + (0,30 * R_accroche 45s + loop)] * M_polyvalence
        const volBase = Math.min(35, Math.pow(t.realPlays / 400000, 0.55) * 35);
        const hook45sAndLoop = Math.min(
          30,
          (retention45s / 100) * 19 + Math.min(11, replayRate * 0.75)
        );
        professionSpecificScore = volBase * 0.35 + deltaImpactScore * 0.35 + hook45sAndLoop * 0.3 + 12;
      } else if (group.role === 'ENGINEER') {
        // CLASSEMENT 4 — INGÉNIEUR DU SON :
        // Sous-rôles : Prise (20%), Mixage (50%), Mastering (30%)
        // 35% Complétion (>85%) + 25% Conformité -14 LUFS & Playlists + 25% Volume plafonné 20% + 15% Diversité
        const engRoleInfo = group.engineerWeightsByTrackId[t.id] || {
          pct: 100,
          roles: ['Mix & Master (100%)'],
        };
        engineerSubRoleSharePct = engRoleInfo.pct;
        const roleWeightFactor = 0.45 + (engRoleInfo.pct / 100) * 0.55;

        const completionScore35 =
          (completionRate >= 85 ? 1.12 : 0.85) * ((completionRate / 100) * 14);
        const lufsOk = !t.acousticClippingDetected && Math.abs((t.lufsMasterLevel ?? -14) + 14) <= 1.5;
        const acousticScore25 = (lufsOk ? 6.5 : 3.0) + (t.inPlaylist ? 4.5 : 2.0);
        const volScore25 = Math.min(11, Math.pow(t.realPlays / 450000, 0.52) * 11);

        professionSpecificScore =
          (completionScore35 + acousticScore25 + volScore25 + deltaImpactScore * 0.25) *
          roleWeightFactor;
      } else {
        // CLASSEMENT 5 — PAROLIER / AUTEUR :
        // 35% Engagement lyrique + 30% Longévité (J+30, J+60, J+90) + 20% Volume plafonné 25% & Delta + 15% Bonus Plume Externe (x1,25)
        const openRatioPct = (lyricsOpens / Math.max(1000, t.realPlays)) * 100;
        const shareExcerptScore = Math.min(
          14,
          (lyricsShares / Math.max(200, t.realPlays * 0.018)) * 5.2
        );
        const lyricEngagement35 = Math.min(15, openRatioPct * 0.45 + shareExcerptScore);
        const longevity30 = Math.min(12, (halfLifeJ90 / 100) * 8 + Math.log10(Math.max(10, longevityDays)) * 2.2);
        const isExternalPlume =
          t.isExternalLyricist ??
          (t.lyricistName || t.artist).toLowerCase() !== t.artist.toLowerCase();
        const externalMultiplier = isExternalPlume ? 1.25 : 1.0;

        professionSpecificScore =
          (lyricEngagement35 + longevity30 + deltaImpactScore * 0.3) * externalMultiplier;
      }

      return {
        track: t,
        artistHabitualAvg: habitualAvg,
        deltaImpactRatio,
        rawScore: professionSpecificScore,
        engineerSubRoleSharePct,
        creditStatus,
      };
    });

    const capPerTrack: 25 | 20 = group.role === 'ENGINEER' ? 20 : 25;
    const cappedResult = applyStrictArtisanTrackCap(
      rawContribs,
      officialVersatility,
      capPerTrack
    );

    const avgDeltaImpactRatio =
      Math.round(
        (rawContribs.reduce((acc, c) => acc + c.deltaImpactRatio, 0) /
          Math.max(1, rawContribs.length)) *
          100
      ) / 100;

    // Certification de Carrière « Disque d'Artisan » (Niveau 2 : 500K Or, 1.25M Platine, 2.5M Diamant)
    const careerCert = getArtisanCareerCertification({
      artisanName: group.name,
      totalEcg: totalPlays,
      tracksCount: allEntityTracks.length,
      distinctArtistsCount: distinctArtists,
      maxSingleTrackSharePct: Math.round(maxSingleTrackRawSharePct),
      maxSingleArtistSharePct: Math.round(maxSingleArtistSharePct),
    });

    if (group.role === 'BEATMAKER') {
      const avgRet45s = Math.round(
        allEntityTracks.reduce(
          (acc, t) =>
            acc +
            (t.retention45sPct ??
              t.retention30sPct ??
              Math.min(99, (t.avgRetentionPct ?? 88) + 4)),
          0
        ) / allEntityTracks.length
      );
      const replayRatePct =
        Math.round((totalLoops / Math.max(100, totalPlays)) * 10000) / 100;

      results.push({
        key,
        name: group.name,
        role: 'BEATMAKER',
        category: firstTrack.category,
        cover: firstTrack.cover,
        artworkType: firstTrack.artworkType,
        tracksCount: allEntityTracks.length,
        distinctArtistsCount: distinctArtists,
        distinctProjectsCount: distinctProjects,
        distinctGenresCount: distinctGenres,
        totalPlays,
        totalLoops,
        avgRetention,
        decoupledScore: cappedResult.totalDecoupledScore,
        avgDeltaImpactRatio,
        versatilityMultiplier: officialVersatility,
        maxSingleTrackSharePct: cappedResult.maxSharePct,
        maxSingleArtistSharePct: Math.round(maxSingleArtistSharePct),
        antiOneHitWonderApplied: true,
        primaryMetricLabel: 'Delta d’Impact (35%)',
        primaryMetricValue: `${avgDeltaImpactRatio}x moy. interprète`,
        secondaryMetricLabel: 'Accroche 45s & Loop (30%)',
        secondaryMetricValue: `${avgRet45s}% • Replay ${replayRatePct}%`,
        tertiaryMetricLabel: 'Polyvalence 90j & Plafond',
        tertiaryMetricValue: `${distinctArtists} artiste(s) (x${officialVersatility.toFixed(2)}) • Max 25%/titre`,
        formulaSummary:
          '[(35% Volume plafonné 25%) + (35% Delta d’Impact) + (30% Accroche 45s & Loop)] × Polyvalence (1 art.=x0.70, 2=x1.00, 3-4=x1.20, 5+=x1.40)',
        trackContributions: cappedResult.contributions,
        careerCertification: careerCert,
        workCertificatesCount,
        hasEscrowDispute,
        requiresDawAudit,
        avgRetention30sPct: avgRet45s,
        avgRetention45sPct: avgRet45s,
        replayRatePct,
      });
    } else if (group.role === 'ENGINEER') {
      const playlistCount = allEntityTracks.filter((t) => t.inPlaylist).length;
      const playlistInclusionRatePct = Math.max(
        48,
        Math.round((playlistCount / allEntityTracks.length) * 100)
      );

      // Synthèse des sous-rôles (Prise 20%, Mix 50%, Master 30%)
      const allRolesSet = new Set<string>();
      Object.values(group.engineerWeightsByTrackId).forEach((w) =>
        w.roles.forEach((r) => allRolesSet.add(r))
      );
      const engineerRolesSummary = Array.from(allRolesSet).join(' + ') || 'Mix (50%) + Master (30%)';

      results.push({
        key,
        name: group.name,
        role: 'ENGINEER',
        category: firstTrack.category,
        cover: firstTrack.cover,
        artworkType: firstTrack.artworkType,
        tracksCount: allEntityTracks.length,
        distinctArtistsCount: distinctArtists,
        distinctProjectsCount: distinctProjects,
        distinctGenresCount: distinctGenres,
        totalPlays,
        totalLoops,
        avgRetention,
        decoupledScore: cappedResult.totalDecoupledScore,
        avgDeltaImpactRatio,
        versatilityMultiplier: officialVersatility,
        maxSingleTrackSharePct: cappedResult.maxSharePct,
        maxSingleArtistSharePct: Math.round(maxSingleArtistSharePct),
        antiOneHitWonderApplied: true,
        primaryMetricLabel: 'Complétion >85% (35%)',
        primaryMetricValue: `${avgRetention}% (Zéro fatigue)`,
        secondaryMetricLabel: 'Standard -14 LUFS & Rôles',
        secondaryMetricValue: `${engineerRolesSummary}`,
        tertiaryMetricLabel: 'Plafond Strict & Polyvalence',
        tertiaryMetricValue: `Max ${cappedResult.maxSharePct}%/titre (Cap 20%) • x${officialVersatility.toFixed(2)}`,
        formulaSummary:
          'Ventilation Prise (20%) / Mix (50%) / Master (30%) • 35% Complétion >85% + 25% Conformité -14 LUFS + 25% Volume (Plafond 20%/titre) + 15% Diversité',
        trackContributions: cappedResult.contributions,
        careerCertification: careerCert,
        workCertificatesCount,
        hasEscrowDispute,
        requiresDawAudit,
        completionRatePct: avgRetention,
        playlistInclusionRatePct,
        engineerRolesSummary,
        lufsCompliancePct: 100,
      });
    } else {
      // LYRICIST (Parolier / Auteur)
      const totalLyricsOpens = allEntityTracks.reduce(
        (acc, t) => acc + (t.lyricsOpensCount ?? Math.round(t.realPlays * 0.16)),
        0
      );
      const totalLyricsShares = allEntityTracks.reduce(
        (acc, t) => acc + (t.lyricsSharesCount ?? Math.round(t.realPlays * 0.025)),
        0
      );
      const lyricsEngagementRatePct =
        Math.round(
          ((totalLyricsOpens + totalLyricsShares * 3) / Math.max(1000, totalPlays)) *
            1000
        ) / 10;
      const avgLongevityDays = Math.round(
        allEntityTracks.reduce((acc, t) => acc + (t.longevityDays ?? 45), 0) /
          allEntityTracks.length
      );
      const externalPlumeBonusApplied = allEntityTracks.some(
        (t) =>
          t.isExternalLyricist ||
          (t.lyricistName || t.artist).toLowerCase() !== t.artist.toLowerCase()
      );

      results.push({
        key,
        name: group.name,
        role: 'LYRICIST',
        category: firstTrack.category,
        cover: firstTrack.cover,
        artworkType: firstTrack.artworkType,
        tracksCount: allEntityTracks.length,
        distinctArtistsCount: distinctArtists,
        distinctProjectsCount: distinctProjects,
        distinctGenresCount: distinctGenres,
        totalPlays,
        totalLoops,
        avgRetention,
        decoupledScore: cappedResult.totalDecoupledScore,
        avgDeltaImpactRatio,
        versatilityMultiplier: officialVersatility,
        maxSingleTrackSharePct: cappedResult.maxSharePct,
        maxSingleArtistSharePct: Math.round(maxSingleArtistSharePct),
        antiOneHitWonderApplied: true,
        primaryMetricLabel: 'Engagement Paroles (35%)',
        primaryMetricValue: `${lyricsEngagementRatePct}% (${totalLyricsShares.toLocaleString('fr-FR')} punchlines)`,
        secondaryMetricLabel: 'Longévité J+90 (30%)',
        secondaryMetricValue: `${avgLongevityDays} jours actifs`,
        tertiaryMetricLabel: 'Bonus Plume Externe (15%)',
        tertiaryMetricValue: externalPlumeBonusApplied
          ? 'Actif (x1,25 Topliner) • Cap 25%'
          : 'Auteur-Interprète (x1,00) • Cap 25%',
        formulaSummary:
          '35% Ouvertures & Partages Punchlines + 30% Longévité J+90 + 20% Volume Plafonné 25% & Delta + 15% Bonus Plume Externe (x1,25)',
        trackContributions: cappedResult.contributions,
        careerCertification: careerCert,
        workCertificatesCount,
        hasEscrowDispute,
        requiresDawAudit,
        lyricsEngagementRatePct,
        avgLongevityDays,
        externalPlumeBonusApplied,
      });
    }
  }

  return results.sort((a, b) => b.decoupledScore - a.decoupledScore);
}

/**
 * Pilier IV.3 — Génère les Dossiers Anonymisés du Module « Jury à l'Aveugle » (Blind Test -14 LUFS)
 */
export function buildBlindTestJuryDossiers(
  tracks: RankableTrack[],
  studioRankings: DecoupledEntityRanking[]
): BlindTestDossier[] {
  const safeTracks = Array.isArray(tracks) ? tracks : [];
  const dossiers: BlindTestDossier[] = [];
  const codes: ('Dossier A' | 'Dossier B' | 'Dossier C' | 'Dossier D')[] = [
    'Dossier A',
    'Dossier B',
    'Dossier C',
    'Dossier D',
  ];

  const roles: {
    role: 'BEATMAKER' | 'ENGINEER' | 'LYRICIST';
    criteria: [string, string, string, string];
  }[] = [
    {
      role: 'BEATMAKER',
      criteria: [
        'Richesse harmonique & Mélodie (/5)',
        'Groove, Bounce & Rythmique (/5)',
        'Originalité des timbres & Sound Design (/5)',
        'Accroche dès les 45 premières secondes (/5)',
      ],
    },
    {
      role: 'ENGINEER',
      criteria: [
        'Équilibre fréquentiel & Clarté (/5)',
        'Dynamique & Punch sans distorsion (/5)',
        'Placement vocal & Intelligibilité (/5)',
        'Cohérence spatiale à -14 LUFS (/5)',
      ],
    },
    {
      role: 'LYRICIST',
      criteria: [
        'Qualité poétique & Richesse du texte (/5)',
        'Impact des punchlines & Mémorabilité (/5)',
        'pertinence thématique & Storytelling (/5)',
        'Musicalité des rimes & Cadence (/5)',
      ],
    },
  ];

  for (const rSpec of roles) {
    const candidates = studioRankings
      .filter((e) => e.role === rSpec.role)
      .slice(0, 3);
    candidates.forEach((cand, idx) => {
      const candTracks = safeTracks
        .filter((t) => {
          if (rSpec.role === 'BEATMAKER')
            return (t.beatmakerName || '').toLowerCase() === cand.name.toLowerCase();
          if (rSpec.role === 'ENGINEER')
            return (
              (t.soundEngineerName || '').toLowerCase() === cand.name.toLowerCase() ||
              (t.mixingEngineerName || '').toLowerCase() === cand.name.toLowerCase()
            );
          return (t.lyricistName || t.artist).toLowerCase() === cand.name.toLowerCase();
        })
        .slice(0, 3);

      dossiers.push({
        dossierId: `blind-${rSpec.role.toLowerCase()}-${idx}`,
        anonymousCode: codes[idx] || 'Dossier A',
        role: rSpec.role,
        realCandidateName: cand.name,
        normalizedLufs: -14.0,
        hasConflictOfInterest: false,
        criteriaLabels: rSpec.criteria,
        tracksPack: candTracks.map((ct, tIdx) => ({
          slotLabel: `Piste Anonyme #${tIdx + 1}`,
          trackId: ct.id,
          durationSec: 180,
          bpm: 116 + tIdx * 4,
          genre: ct.category,
        })),
      });
    });
  }

  return dossiers;
}

/**
 * Pilier IV — Génère les 10 Catégories Officielles des DROP Awards Annuels (1er Nov N-1 – 31 Oct N)
 * avec Pondération Hybride :
 * - Grille A (Artistique & Grand Public) : 50% Score Algo + 25% Jury Pro + 25% Vote Public In-App
 * - Grille B (Métiers Techniques & Artisans) : 50% Score Algo + 35% Jury à l'Aveugle (Blind Test) + 15% Vote Public & Pairs
 */
export function computeDropAwardsCategories(
  tracks: RankableTrack[],
  studioRankings: DecoupledEntityRanking[] | string[],
  categories?: string[] | Record<string, number>,
  customJuryScores: Record<string, number> = {}, // Note sur 20 convertie sur 100
  customPublicVotes: Record<string, number> = {} // Votes additionnels du public (+241)
): DropAwardCategoryResult[] {
  const safeTracks = Array.isArray(tracks) ? tracks : [];
  const safeStudioRankings: DecoupledEntityRanking[] =
    Array.isArray(studioRankings) &&
    studioRankings.length > 0 &&
    typeof studioRankings[0] === 'object'
      ? (studioRankings as DecoupledEntityRanking[])
      : computeAllDecoupledStudioRankings(
          safeTracks,
          categories && !Array.isArray(categories) && typeof categories === 'object'
            ? (categories as Record<string, number>)
            : {}
        );
  const safeCategories: string[] = Array.isArray(categories)
    ? categories
    : Array.isArray(studioRankings) &&
        (studioRankings.length === 0 || typeof studioRankings[0] === 'string')
      ? (studioRankings as string[])
      : Array.from(new Set(safeTracks.map((t) => t.category).filter(Boolean)));

  const awards: DropAwardCategoryResult[] = [];
  const blindCodes = ['Dossier A', 'Dossier B', 'Dossier C', 'Dossier D'];

  // Helper de calcul hybride Grille A (50/25/25) ou Grille B (50/35/15)
  const computeHybrid = (
    itemKey: string,
    rawAlgo: number,
    maxAlgoRef: number,
    grid: 'GRILLE_A_ARTISTIQUE' | 'GRILLE_B_TECHNIQUE_BLIND',
    rankIdx: number
  ) => {
    const algo100 = Math.min(99.5, Math.max(58, (rawAlgo / Math.max(1, maxAlgoRef)) * 96));
    const defaultJury20 = Math.max(13.5, 18.2 - rankIdx * 1.1);
    const jury20 = customJuryScores[itemKey] ?? defaultJury20;
    const jury100 = Math.min(100, (jury20 / 20) * 100);

    const extraVotes = customPublicVotes[itemKey] ?? 0;
    const basePublic100 = Math.max(62, 93 - rankIdx * 5.5);
    const public100 = Math.min(100, basePublic100 + Math.min(15, extraVotes * 2.2));

    const finalHybrid =
      grid === 'GRILLE_A_ARTISTIQUE'
        ? algo100 * 0.5 + jury100 * 0.25 + public100 * 0.25
        : algo100 * 0.5 + jury100 * 0.35 + public100 * 0.15;

    return {
      algoScore: Math.round(algo100 * 10) / 10,
      juryScore: Math.round(jury100 * 10) / 10,
      publicScore: Math.round(public100 * 10) / 10,
      finalHybridScore: Math.round(finalHybrid * 10) / 10,
      publicVotesCount: 1420 - rankIdx * 210 + extraVotes,
    };
  };

  // Helper pour ajouter une catégorie métier (Artiste, Beatmaker, Ingé Son, Parolier, Label)
  const addRoleAward = (
    officialNumber: number,
    role: StudioEntityRole,
    id: string,
    title: string,
    subtitle: string,
    criteriaBadge: string,
    eligibilityRuleText: string,
    grid: 'GRILLE_A_ARTISTIQUE' | 'GRILLE_B_TECHNIQUE_BLIND'
  ) => {
    const list = safeStudioRankings.filter((r) => r.role === role);
    if (list.length === 0) return;
    const maxAlgo = Math.max(...list.map((x) => x.decoupledScore), 1);

    const scored = list
      .slice(0, 4)
      .map((item, idx) => {
        const itemKey = `${id}:${item.name}`;
        const h = computeHybrid(itemKey, item.decoupledScore, maxAlgo, grid, idx);
        return {
          item,
          ...h,
          blindDossierCode:
            grid === 'GRILLE_B_TECHNIQUE_BLIND' ? blindCodes[idx] : undefined,
        };
      })
      .sort((a, b) => b.finalHybridScore - a.finalHybridScore);

    const top = scored[0];
    awards.push({
      id,
      officialNumber,
      title,
      subtitle,
      criteriaBadge,
      scoringGrid: grid,
      eligibilityRuleText,
      algoWeightPct: 50,
      juryWeightPct: grid === 'GRILLE_A_ARTISTIQUE' ? 25 : 35,
      publicWeightPct: grid === 'GRILLE_A_ARTISTIQUE' ? 25 : 15,
      winner: {
        name: top.item.name,
        secondaryName: `${top.item.primaryMetricLabel} : ${top.item.primaryMetricValue}`,
        scoreLabel: `${top.finalHybridScore} / 100`,
        algoScore: top.algoScore,
        juryScore: top.juryScore,
        publicScore: top.publicScore,
        finalHybridScore: top.finalHybridScore,
        metricDetail: `Algo ${top.algoScore}% • Jury ${top.juryScore}% • Public ${top.publicScore}%`,
        cover: top.item.cover,
        artworkType: top.item.artworkType,
        entityRole: role,
        certification:
          top.item.careerCertification || getAlbumCertification(top.item.totalPlays),
      },
      nominees: scored.map((entry, idx) => ({
        rank: idx + 1,
        name: entry.item.name,
        secondaryName: entry.item.primaryMetricValue,
        scoreLabel: `${entry.finalHybridScore} / 100`,
        algoScore: entry.algoScore,
        juryScore: entry.juryScore,
        publicScore: entry.publicScore,
        finalHybridScore: entry.finalHybridScore,
        metricDetail: `Algo ${entry.algoScore} | Jury ${entry.juryScore} | Public ${entry.publicScore}`,
        cover: entry.item.cover,
        artworkType: entry.item.artworkType,
        entityRole: role,
        publicVotesCount: entry.publicVotesCount,
        blindDossierCode: entry.blindDossierCode,
      })),
    });
  };

  // 1. Artiste de l'Année (Grille A : 50/25/25)
  addRoleAward(
    1,
    'ARTIST',
    'award-artist-year',
    '1. Artiste de l’Année',
    'Domination globale, profondeur de catalogue et fidélisation de la communauté gabonaise',
    'Grille A • 50/25/25',
    'Prérequis : Au moins 3 singles ou 1 projet (EP/Album) sortis durant l’année d’éligibilité (1er Nov – 31 Oct).',
    'GRILLE_A_ARTISTIQUE'
  );

  // 2. Chanson de l'Année (Grille A : 50/25/25)
  const rankedTracks = [...safeTracks]
    .map((t) => ({
      track: t,
      explosion: computeTrackExplosionScore(t, 'ANNUAL_365D'),
      cert: getTrackCertification(t.realPlays, t.gabonTerritoryPct ?? 85, t.id),
    }))
    .sort((a, b) => b.explosion.explosionScore - a.explosion.explosionScore);

  if (rankedTracks.length > 0) {
    const maxTrackAlgo = Math.max(...rankedTracks.map((r) => r.explosion.explosionScore), 1);
    const scoredTracks = rankedTracks
      .slice(0, 4)
      .map((entry, idx) => {
        const h = computeHybrid(
          `award-track-year:${entry.track.id}`,
          entry.explosion.explosionScore,
          maxTrackAlgo,
          'GRILLE_A_ARTISTIQUE',
          idx
        );
        return { ...entry, ...h };
      })
      .sort((a, b) => b.finalHybridScore - a.finalHybridScore);

    const top = scoredTracks[0];
    awards.push({
      id: 'award-track-year',
      officialNumber: 2,
      title: '2. Chanson de l’Année',
      subtitle: '60% Volume ECG + 25% Vélocité de croissance + 15% Engagement social & Partage',
      criteriaBadge: 'Grille A • 50/25/25',
      scoringGrid: 'GRILLE_A_ARTISTIQUE',
      eligibilityRuleText:
        'Basé sur le Score Titre annuel combinant impact populaire en ECG, vitesse d’adoption et partages.',
      algoWeightPct: 50,
      juryWeightPct: 25,
      publicWeightPct: 25,
      winner: {
        name: top.track.title,
        secondaryName:
          top.track.featuringArtists && top.track.featuringArtists.length > 0
            ? `${top.track.artist} feat. ${top.track.featuringArtists.join(', ')}`
            : top.track.artist,
        scoreLabel: `${top.finalHybridScore} / 100`,
        algoScore: top.algoScore,
        juryScore: top.juryScore,
        publicScore: top.publicScore,
        finalHybridScore: top.finalHybridScore,
        metricDetail: `${Math.round(top.track.realPlays / 1000)}K ECG • Algo ${top.algoScore}% • Public ${top.publicScore}%`,
        cover: top.track.cover,
        artworkType: top.track.artworkType,
        trackId: top.track.id,
        certification: top.cert,
      },
      nominees: scoredTracks.map((item, idx) => ({
        rank: idx + 1,
        name: item.track.title,
        secondaryName: item.track.artist,
        scoreLabel: `${item.finalHybridScore} / 100`,
        algoScore: item.algoScore,
        juryScore: item.juryScore,
        publicScore: item.publicScore,
        finalHybridScore: item.finalHybridScore,
        metricDetail: `${Math.round(item.track.realPlays / 1000)}K ECG`,
        cover: item.track.cover,
        artworkType: item.track.artworkType,
        trackId: item.track.id,
        publicVotesCount: item.publicVotesCount,
      })),
    });
  }

  // 3. Album / Projet de l'Année (Grille A : 50/25/25)
  const albumGroups = new Map<
    string,
    { albumTitle: string; artist: string; tracks: RankableTrack[] }
  >();
  for (const t of safeTracks) {
    const aKey = `${t.artist}::${t.album}`;
    const ex = albumGroups.get(aKey) || {
      albumTitle: t.album,
      artist: t.artist,
      tracks: [],
    };
    ex.tracks.push(t);
    albumGroups.set(aKey, ex);
  }
  const albumList = Array.from(albumGroups.values()).map((alb) => {
    const antiLoco = computeAlbumAntiLocomotiveEcg(alb.tracks, 300000);
    const cert = getAlbumCertification(alb.tracks);
    return { ...alb, ...antiLoco, cert };
  });
  albumList.sort((a, b) => b.weightedAlbumEcg - a.weightedAlbumEcg);

  if (albumList.length > 0) {
    const maxAlbEcg = Math.max(...albumList.map((a) => a.weightedAlbumEcg), 1);
    const scoredAlbums = albumList
      .slice(0, 4)
      .map((alb, idx) => {
        const h = computeHybrid(
          `award-album-year:${alb.albumTitle}`,
          alb.weightedAlbumEcg,
          maxAlbEcg,
          'GRILLE_A_ARTISTIQUE',
          idx
        );
        return { ...alb, ...h };
      })
      .sort((a, b) => b.finalHybridScore - a.finalHybridScore);

    const topAlb = scoredAlbums[0];
    awards.push({
      id: 'award-album-year',
      officialNumber: 3,
      title: '3. Album / Projet de l’Année',
      subtitle: 'Cohérence artistique, maintien des pistes hors-singles (deep cuts) & Règle Anti-Locomotive',
      criteriaBadge: 'Grille A • Anti-Locomotive',
      scoringGrid: 'GRILLE_A_ARTISTIQUE',
      eligibilityRuleText:
        'Prérequis : Projet d’au moins 6 titres, évalué sur l’écoute globale et le maintien des pistes hors-singles.',
      algoWeightPct: 50,
      juryWeightPct: 25,
      publicWeightPct: 25,
      winner: {
        name: topAlb.albumTitle,
        secondaryName: topAlb.artist,
        scoreLabel: `${topAlb.finalHybridScore} / 100`,
        algoScore: topAlb.algoScore,
        juryScore: topAlb.juryScore,
        publicScore: topAlb.publicScore,
        finalHybridScore: topAlb.finalHybridScore,
        metricDetail: `${Math.round(topAlb.weightedAlbumEcg / 1000)}K ECG pondérées (${topAlb.tracks.length} pistes)`,
        cover: topAlb.tracks[0]?.cover || '',
        artworkType: topAlb.tracks[0]?.artworkType,
        entityRole: 'ARTIST',
        certification: topAlb.cert,
      },
      nominees: scoredAlbums.map((alb, idx) => ({
        rank: idx + 1,
        name: alb.albumTitle,
        secondaryName: alb.artist,
        scoreLabel: `${alb.finalHybridScore} / 100`,
        algoScore: alb.algoScore,
        juryScore: alb.juryScore,
        publicScore: alb.publicScore,
        finalHybridScore: alb.finalHybridScore,
        metricDetail: `${Math.round(alb.weightedAlbumEcg / 1000)}K ECG pondérées`,
        cover: alb.tracks[0]?.cover || '',
        artworkType: alb.tracks[0]?.artworkType,
        entityRole: 'ARTIST',
        publicVotesCount: alb.publicVotesCount,
      })),
    });
  }

  // 4. Révélation de l'Année (Franchissement du cap des 20 000 ECG/mois pour la 1re fois)
  const artistsAll = safeStudioRankings.filter((r) => r.role === 'ARTIST');
  const revelationCandidates = [
    ...artistsAll.filter((a) => a.isRevelationEligible),
    ...artistsAll.filter((a) => !a.isRevelationEligible),
  ].slice(0, 4);

  if (revelationCandidates.length > 0) {
    const maxRevScore = Math.max(...revelationCandidates.map((r) => r.decoupledScore), 1);
    const scoredRev = revelationCandidates
      .map((cand, idx) => {
        const h = computeHybrid(
          `award-revelation-year:${cand.name}`,
          cand.decoupledScore,
          maxRevScore,
          'GRILLE_A_ARTISTIQUE',
          idx
        );
        return { cand, ...h };
      })
      .sort((a, b) => b.finalHybridScore - a.finalHybridScore);

    const topRev = scoredRev[0];
    awards.push({
      id: 'award-revelation-year',
      officialNumber: 4,
      title: '4. Révélation de l’Année',
      subtitle: 'Franchissement initial du cap des 20 000 ECG/mois & meilleur taux de conversion en abonnés',
      criteriaBadge: 'Grille A • Cap 20K ECG',
      scoringGrid: 'GRILLE_A_ARTISTIQUE',
      eligibilityRuleText:
        'Réservé aux artistes ayant franchi pour la toute première fois le cap des 20 000 ECG mensuelles cette année.',
      algoWeightPct: 50,
      juryWeightPct: 25,
      publicWeightPct: 25,
      winner: {
        name: topRev.cand.name,
        secondaryName: topRev.cand.tertiaryMetricValue,
        scoreLabel: `${topRev.finalHybridScore} / 100`,
        algoScore: topRev.algoScore,
        juryScore: topRev.juryScore,
        publicScore: topRev.publicScore,
        finalHybridScore: topRev.finalHybridScore,
        metricDetail: `Cap 20K ECG franchi • ${topRev.cand.primaryMetricValue}`,
        cover: topRev.cand.cover,
        artworkType: topRev.cand.artworkType,
        entityRole: 'ARTIST',
      },
      nominees: scoredRev.map((entry, idx) => ({
        rank: idx + 1,
        name: entry.cand.name,
        secondaryName: entry.cand.tertiaryMetricValue,
        scoreLabel: `${entry.finalHybridScore} / 100`,
        algoScore: entry.algoScore,
        juryScore: entry.juryScore,
        publicScore: entry.publicScore,
        finalHybridScore: entry.finalHybridScore,
        metricDetail: entry.cand.primaryMetricValue,
        cover: entry.cand.cover,
        artworkType: entry.cand.artworkType,
        entityRole: 'ARTIST',
        publicVotesCount: entry.publicVotesCount,
      })),
    });
  }

  // 5. Beatmaker / Compositeur de l'Année (Grille B : 50% Algo / 35% Blind Test / 15% Public)
  addRoleAward(
    5,
    'BEATMAKER',
    'award-beatmaker-year',
    '5. Beatmaker / Compositeur de l’Année',
    'Delta d’Impact, accroche à 45 secondes, Loop Rate & Jury à l’Aveugle (-14 LUFS)',
    'Grille B • Blind Test 35%',
    'Prérequis : Au moins 5 titres produits pour au moins 3 artistes différents dans l’année (Plafond 25%/titre).',
    'GRILLE_B_TECHNIQUE_BLIND'
  );

  // 6. Ingénieur du Son de l'Année (Grille B : 50% Algo / 35% Blind Test / 15% Public)
  addRoleAward(
    6,
    'ENGINEER',
    'award-engineer-year',
    '6. Ingénieur du Son de l’Année',
    'Taux de complétion >85%, conformité acoustique -14 LUFS & écoute comparative à l’aveugle',
    'Grille B • Blind Test 35%',
    'Prérequis : Au moins 8 titres mixés ou masterisés pour au moins 3 artistes différents (Plafond 20%/titre).',
    'GRILLE_B_TECHNIQUE_BLIND'
  );

  // 7. Parolier / Plume de l'Année (Grille B : 50% Algo / 35% Blind Test / 15% Public)
  addRoleAward(
    7,
    'LYRICIST',
    'award-lyricist-year',
    '7. Parolier / Plume de l’Année',
    'Engagement sur les paroles synchronisées, partages de punchlines, longévité J+90 & Plume Externe',
    'Grille B • Blind Test 35%',
    'Prérequis : Au moins 4 titres crédités avec paroles synchronisées disponibles sur la plateforme.',
    'GRILLE_B_TECHNIQUE_BLIND'
  );

  // 8. Label / Maison de Production de l'Année (Grille A : 50/25/25)
  addRoleAward(
    8,
    'LABEL',
    'award-label-year',
    '8. Label / Maison de Production de l’Année',
    'Médiane de performance du catalogue, équilibre du roster (<80%/artiste) & nouvelles signatures',
    'Grille A • Min. 3 Artistes',
    'Prérequis : Compter au moins 3 artistes actifs ayant sorti chacun au moins un projet ou 2 singles dans l’année.',
    'GRILLE_A_ARTISTIQUE'
  );

  // 9. Meilleure Collaboration (Featuring) (Grille A : 50/25/25)
  const featuringTracks = rankedTracks.filter(
    (item) =>
      (item.track.featuringArtists && item.track.featuringArtists.length > 0) ||
      item.track.artist.includes('&')
  );
  if (featuringTracks.length > 0) {
    const maxFeatAlgo = Math.max(...featuringTracks.map((f) => f.explosion.explosionScore), 1);
    const scoredFeats = featuringTracks
      .slice(0, 4)
      .map((item, idx) => {
        const h = computeHybrid(
          `award-best-feat:${item.track.id}`,
          item.explosion.explosionScore,
          maxFeatAlgo,
          'GRILLE_A_ARTISTIQUE',
          idx
        );
        return { ...item, ...h };
      })
      .sort((a, b) => b.finalHybridScore - a.finalHybridScore);

    const topFeat = scoredFeats[0];
    awards.push({
      id: 'award-best-feat',
      officialNumber: 9,
      title: '9. Meilleure Collaboration (Featuring)',
      subtitle: 'Croisement des communautés d’écuries distinctes & maintien d’écoute supérieur à 60 jours',
      criteriaBadge: 'Grille A • Partage 70/30 ou 50/50',
      scoringGrid: 'GRILLE_A_ARTISTIQUE',
      eligibilityRuleText:
        'Prérequis : Réunir au moins 2 artistes issus d’écuries différentes avec un maintien d’écoute > 60 jours.',
      algoWeightPct: 50,
      juryWeightPct: 25,
      publicWeightPct: 25,
      winner: {
        name: topFeat.track.title,
        secondaryName:
          topFeat.track.featuringArtists && topFeat.track.featuringArtists.length > 0
            ? `${topFeat.track.artist} feat. ${topFeat.track.featuringArtists.join(', ')}`
            : topFeat.track.artist,
        scoreLabel: `${topFeat.finalHybridScore} / 100`,
        algoScore: topFeat.algoScore,
        juryScore: topFeat.juryScore,
        publicScore: topFeat.publicScore,
        finalHybridScore: topFeat.finalHybridScore,
        metricDetail: `Maintien ${topFeat.track.longevityDays ?? 75}j • Rétention ${topFeat.track.avgRetentionPct ?? 92}%`,
        cover: topFeat.track.cover,
        artworkType: topFeat.track.artworkType,
        trackId: topFeat.track.id,
        certification: topFeat.cert,
      },
      nominees: scoredFeats.map((item, idx) => ({
        rank: idx + 1,
        name: item.track.title,
        secondaryName:
          item.track.featuringArtists && item.track.featuringArtists.length > 0
            ? `${item.track.artist} feat. ${item.track.featuringArtists.join(', ')}`
            : item.track.artist,
        scoreLabel: `${item.finalHybridScore} / 100`,
        algoScore: item.algoScore,
        juryScore: item.juryScore,
        publicScore: item.publicScore,
        finalHybridScore: item.finalHybridScore,
        metricDetail: `${Math.round(item.track.realPlays / 1000)}K ECG`,
        cover: item.track.cover,
        artworkType: item.track.artworkType,
        trackId: item.track.id,
        publicVotesCount: item.publicVotesCount,
      })),
    });
  }

  // 10. Trophées de Genres Gabonais (Ntcham, Rap Gabonais, Afrobeats, Rumba Gabonaise, Gospel, Tradimoderne...)
  for (const genre of safeCategories) {
    if (typeof genre !== 'string') continue;
    const genreTracks = rankedTracks.filter(
      (item) => item.track.category.toLowerCase() === genre.toLowerCase()
    );
    if (genreTracks.length > 0) {
      const maxGAlgo = Math.max(...genreTracks.map((g) => g.explosion.explosionScore), 1);
      const scoredGenre = genreTracks
        .slice(0, 3)
        .map((item, idx) => {
          const h = computeHybrid(
            `award-genre-${genre}:${item.track.id}`,
            item.explosion.explosionScore,
            maxGAlgo,
            'GRILLE_A_ARTISTIQUE',
            idx
          );
          return { ...item, ...h };
        })
        .sort((a, b) => b.finalHybridScore - a.finalHybridScore);

      const topG = scoredGenre[0];
      awards.push({
        id: `award-genre-${genre.toLowerCase().replace(/\s+/g, '-')}`,
        officialNumber: 10,
        title: `10. Trophée de Genre — ${genre}`,
        subtitle: `Meilleure œuvre certifiée de l’année dans le registre ${genre}`,
        criteriaBadge: `Genre Officiel • ${genre}`,
        scoringGrid: 'GRILLE_A_ARTISTIQUE',
        eligibilityRuleText: `Évalué selon la Grille A (50% Algo ECG, 25% Jury Spécialisé ${genre}, 25% Vote Public +241).`,
        algoWeightPct: 50,
        juryWeightPct: 25,
        publicWeightPct: 25,
        winner: {
          name: topG.track.title,
          secondaryName: topG.track.artist,
          scoreLabel: `${topG.finalHybridScore} / 100`,
          algoScore: topG.algoScore,
          juryScore: topG.juryScore,
          publicScore: topG.publicScore,
          finalHybridScore: topG.finalHybridScore,
          metricDetail: `${Math.round(topG.track.realPlays / 1000)}K ECG`,
          cover: topG.track.cover,
          artworkType: topG.track.artworkType,
          trackId: topG.track.id,
          certification: topG.cert,
        },
        nominees: scoredGenre.map((item, idx) => ({
          rank: idx + 1,
          name: item.track.title,
          secondaryName: item.track.artist,
          scoreLabel: `${item.finalHybridScore} / 100`,
          algoScore: item.algoScore,
          juryScore: item.juryScore,
          publicScore: item.publicScore,
          finalHybridScore: item.finalHybridScore,
          metricDetail: `${Math.round(item.track.realPlays / 1000)}K ECG`,
          cover: item.track.cover,
          artworkType: item.track.artworkType,
          trackId: item.track.id,
          publicVotesCount: item.publicVotesCount,
        })),
      });
    }
  }

  return awards;
}
