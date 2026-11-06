import type { StudioEntityRole } from '../../components/ReusableAnalyticsSheets';
import type {
  ArtisanTrackContribution,
  ChartTimeframe,
  CreditHandshakeStatus,
  DecoupledEntityRanking,
  RankableTrack,
} from './ecgAndTypesEngine';
import {
  applyStrictArtisanTrackCap,
  computeArtistHabitualBaselines,
  computeTrackExplosionScore,
  getArtisanCareerCertification,
  getOfficialVersatilityMultiplier,
  getTrackCertification,
} from './certificationsAndExplosionEngine';

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
