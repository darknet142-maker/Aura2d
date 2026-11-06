import type { StudioEntityRole } from '../../components/ReusableAnalyticsSheets';
import type {
  BlindTestDossier,
  DecoupledEntityRanking,
  DropAwardCategoryResult,
  RankableTrack,
} from './ecgAndTypesEngine';
import {
  computeAlbumAntiLocomotiveEcg,
  computeTrackExplosionScore,
  getAlbumCertification,
  getTrackCertification,
} from './certificationsAndExplosionEngine';
import { computeAllDecoupledStudioRankings } from './antiHaloStudioEngine';

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
