import { StudioEntityRole } from '../../components/ReusableAnalyticsSheets';
import {
  GabonSubscriptionPass,
  GabonNetworkOperator,
} from '../../services/offlineStreamTracker';

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

export function generateDeterministicHash(seed: string): string {
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
