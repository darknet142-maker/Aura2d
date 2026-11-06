import type {
  ArtisanTrackContribution,
  CertificationInfo,
  CertificationLevel,
  ChartTimeframe,
  CreditHandshakeStatus,
  RankableTrack,
} from './ecgAndTypesEngine';
import { generateDeterministicHash } from './ecgAndTypesEngine';

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
export function applyStrictArtisanTrackCap(
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
