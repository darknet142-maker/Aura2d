import { useState, useMemo } from 'react';
import {
  computeAllDecoupledStudioRankings,
  computeDropAwardsCategories,
  computeTrackExplosionScore,
} from '../../../utils/rankingEngine';
import type { AlbumNode, AppUser, Track, UserTrackStat } from '../../../shared/types/domain.types';

export function useAdminAnalytics(params: {
  allTracksFlat: Track[];
  artistSubscribers: Record<string, number>;
  categories: string[];
  catalogue: AlbumNode[];
  trackRankMap: Record<string, { rank: number; delta: number }>;
  users: AppUser[];
}) {
  const { allTracksFlat, artistSubscribers, categories, catalogue, trackRankMap, users } = params;
  // --- Full-Screen Detail Sheets (Track, Artist, Consumer User) ---
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);
  const [selectedConsumerUserId, setSelectedConsumerUserId] = useState<string | null>(null);

  // --- Algorithm Filter Dimension ---
  const [algoDimension, setAlgoDimension] = useState<
    | 'GENERAL'
    | 'CATEGORY'
    | 'ARTIST'
    | 'LABEL'
    | 'BEATMAKER'
    | 'ENGINEER'
    | 'LYRICIST'
    | 'AWARDS'
  >('GENERAL');
  const [algoFilterValue, setAlgoFilterValue] = useState<string>('ALL');


  // --- Computed Analytics & Decoupled Anti-Halo Rankings ---
  const decoupledStudioRankings = useMemo(
    () => computeAllDecoupledStudioRankings(allTracksFlat, artistSubscribers),
    [allTracksFlat, artistSubscribers]
  );

  const dropAwardsList = useMemo(
    () => computeDropAwardsCategories(allTracksFlat, decoupledStudioRankings, categories),
    [allTracksFlat, decoupledStudioRankings, categories]
  );

  const algoFilterOptions = useMemo(() => {
    if (algoDimension === 'CATEGORY') {
      return categories;
    }
    if (algoDimension === 'ARTIST') {
      return Array.from(
        new Set(allTracksFlat.flatMap((t) => [t.artist, ...(t.featuringArtists || [])]))
      );
    }
    if (algoDimension === 'LABEL') {
      return Array.from(new Set(allTracksFlat.map((t) => t.labelName)));
    }
    if (algoDimension === 'BEATMAKER') {
      return Array.from(new Set(allTracksFlat.map((t) => t.beatmakerName)));
    }
    if (algoDimension === 'ENGINEER') {
      return Array.from(new Set(allTracksFlat.map((t) => t.soundEngineerName)));
    }
    if (algoDimension === 'LYRICIST') {
      return Array.from(new Set(allTracksFlat.map((t) => t.lyricistName)));
    }
    return [];
  }, [algoDimension, allTracksFlat, categories]);

  const rankedFilteredTracks = useMemo(() => {
    let list = [...allTracksFlat];
    if (algoDimension !== 'GENERAL' && algoDimension !== 'AWARDS' && algoFilterValue !== 'ALL') {
      list = list.filter((t) => {
        if (algoDimension === 'CATEGORY') return t.category === algoFilterValue;
        if (algoDimension === 'ARTIST') {
          return (
            t.artist === algoFilterValue ||
            (t.featuringArtists || []).includes(algoFilterValue)
          );
        }
        if (algoDimension === 'LABEL') return t.labelName === algoFilterValue;
        if (algoDimension === 'BEATMAKER') return t.beatmakerName === algoFilterValue;
        if (algoDimension === 'ENGINEER') return t.soundEngineerName === algoFilterValue;
        if (algoDimension === 'LYRICIST') return t.lyricistName === algoFilterValue;
        return true;
      });
    }
    return list.sort(
      (a, b) =>
        computeTrackExplosionScore(b).explosionScore -
        computeTrackExplosionScore(a).explosionScore
    );
  }, [allTracksFlat, algoDimension, algoFilterValue]);

  const groupedDimensionRankings = useMemo(() => {
    if (
      algoDimension === 'ARTIST' ||
      algoDimension === 'LABEL' ||
      algoDimension === 'BEATMAKER' ||
      algoDimension === 'ENGINEER' ||
      algoDimension === 'LYRICIST'
    ) {
      return decoupledStudioRankings
        .filter((e) => e.role === algoDimension)
        .map((e) => ({
          name: e.name,
          tracksCount: e.tracksCount,
          totalPoints: e.decoupledScore,
          primaryMetricLabel: `${e.primaryMetricLabel} : ${e.primaryMetricValue}`,
          deltaImpactFactor: e.avgDeltaImpactRatio,
          versatilityMultiplier: e.versatilityMultiplier,
          maxSingleTrackSharePct: e.maxSingleTrackSharePct,
        }));
    }

    const groups: Record<
      string,
      {
        name: string;
        tracksCount: number;
        totalPoints: number;
        primaryMetricLabel?: string;
        deltaImpactFactor?: number;
        versatilityMultiplier?: number;
        maxSingleTrackSharePct?: number;
      }
    > = {};

    for (const cat of categories) {
      groups[cat] = {
        name: cat,
        tracksCount: 0,
        totalPoints: 0,
      };
    }

    for (const t of allTracksFlat) {
      const key = t.category;
      if (!groups[key]) {
        groups[key] = {
          name: key,
          tracksCount: 0,
          totalPoints: 0,
        };
      }
      groups[key].tracksCount += 1;
      groups[key].totalPoints =
        Math.round(
          (groups[key].totalPoints + computeTrackExplosionScore(t).explosionScore) * 10
        ) / 10;
    }

    return Object.values(groups).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [allTracksFlat, algoDimension, decoupledStudioRankings, categories]);

  // Selected Full-Screen Track Detail
  const selectedTrackDetail = useMemo(() => {
    if (!selectedTrackId) return null;
    for (let aIdx = 0; aIdx < catalogue.length; aIdx++) {
      const alb = catalogue[aIdx];
      const tIdx = alb.tracks.findIndex((t) => t.id === selectedTrackId);
      if (tIdx >= 0) {
        const track = alb.tracks[tIdx];
        const rankInfo = trackRankMap[track.id] || { rank: 1, delta: 0 };
        return { album: alb, albumIndex: aIdx, trackIndex: tIdx, track, rankInfo };
      }
    }
    return null;
  }, [selectedTrackId, catalogue, trackRankMap]);

  // Selected Full-Screen Consumer User Detail
  const selectedConsumerUser = useMemo(
    () => users.find((u) => u.id === selectedConsumerUserId) || null,
    [users, selectedConsumerUserId]
  );

  const consumerAnalytics = useMemo(() => {
    if (!selectedConsumerUser) return null;
    const statsList = Object.values(selectedConsumerUser.trackStats)
      .map((st) => {
        const track = allTracksFlat.find((t) => t.id === st.trackId);
        return track ? { stat: st, track } : null;
      })
      .filter((item): item is { stat: UserTrackStat; track: Track } => item !== null);

    const byListenTime = [...statsList].sort((a, b) => b.stat.listenSeconds - a.stat.listenSeconds);
    const byLoops = [...statsList].sort((a, b) => b.stat.loopsCount - a.stat.loopsCount);
    const topLoopedItem = byLoops[0] || null;

    const genreTotals: Record<
      string,
      { category: string; seconds: number; plays: number; loops: number }
    > = {};
    for (const item of statsList) {
      const cat = item.track.category;
      if (!genreTotals[cat]) {
        genreTotals[cat] = { category: cat, seconds: 0, plays: 0, loops: 0 };
      }
      genreTotals[cat].seconds += item.stat.listenSeconds;
      genreTotals[cat].plays += item.stat.playsCount;
      genreTotals[cat].loops += item.stat.loopsCount;
    }
    const favoriteGenres = Object.values(genreTotals).sort((a, b) => b.seconds - a.seconds);

    return {
      byListenTime,
      topLoopedItem,
      favoriteGenres,
    };
  }, [selectedConsumerUser, allTracksFlat]);

  // Selected Full-Screen Artist Detail (Includes Solo + Featuring Tracks)
  const selectedArtistAnalytics = useMemo(() => {
    if (!selectedArtistName) return null;
    const lowerTarget = selectedArtistName.toLowerCase();
    const artistTracks = allTracksFlat
      .filter(
        (t) =>
          t.artist.toLowerCase() === lowerTarget ||
          (t.featuringArtists || []).some((f) => f.toLowerCase() === lowerTarget)
      )
      .sort(
        (a, b) =>
          computeTrackExplosionScore(b).explosionScore -
          computeTrackExplosionScore(a).explosionScore
      );

    if (artistTracks.length === 0) return null;

    const totalPlays = artistTracks.reduce((acc, t) => acc + t.realPlays, 0);
    const totalLoops = artistTracks.reduce((acc, t) => acc + t.loopPlaysCount, 0);
    const totalLikes = artistTracks.reduce((acc, t) => acc + t.likesCount, 0);
    const totalListenSeconds = artistTracks.reduce((acc, t) => acc + t.totalListenSeconds, 0);
    const avgRetention = Math.round(
      artistTracks.reduce((acc, t) => acc + t.avgRetentionPct, 0) / artistTracks.length
    );

    const labelsMap = new Map<
      string,
      { name: string; role: 'LABEL'; tracksCount: number; plays: number; loops: number }
    >();
    const beatmakersMap = new Map<
      string,
      { name: string; role: 'BEATMAKER'; tracksCount: number; plays: number; loops: number }
    >();
    const engineersMap = new Map<
      string,
      { name: string; role: 'ENGINEER'; tracksCount: number; plays: number; loops: number }
    >();
    const lyricistsMap = new Map<
      string,
      { name: string; role: 'LYRICIST'; tracksCount: number; plays: number; loops: number }
    >();

    for (const t of artistTracks) {
      const l = labelsMap.get(t.labelName) || {
        name: t.labelName,
        role: 'LABEL' as const,
        tracksCount: 0,
        plays: 0,
        loops: 0,
      };
      l.tracksCount += 1;
      l.plays += t.realPlays;
      l.loops += t.loopPlaysCount;
      labelsMap.set(t.labelName, l);

      const b = beatmakersMap.get(t.beatmakerName) || {
        name: t.beatmakerName,
        role: 'BEATMAKER' as const,
        tracksCount: 0,
        plays: 0,
        loops: 0,
      };
      b.tracksCount += 1;
      b.plays += t.realPlays;
      b.loops += t.loopPlaysCount;
      beatmakersMap.set(t.beatmakerName, b);

      const e = engineersMap.get(t.soundEngineerName) || {
        name: t.soundEngineerName,
        role: 'ENGINEER' as const,
        tracksCount: 0,
        plays: 0,
        loops: 0,
      };
      e.tracksCount += 1;
      e.plays += t.realPlays;
      e.loops += t.loopPlaysCount;
      engineersMap.set(t.soundEngineerName, e);

      const lyr = lyricistsMap.get(t.lyricistName) || {
        name: t.lyricistName,
        role: 'LYRICIST' as const,
        tracksCount: 0,
        plays: 0,
        loops: 0,
      };
      lyr.tracksCount += 1;
      lyr.plays += t.realPlays;
      lyr.loops += t.loopPlaysCount;
      lyricistsMap.set(t.lyricistName, lyr);
    }

    const artistTrackIds = new Set(artistTracks.map((t) => t.id));
    const topListeners = users
      .map((u) => {
        let listenSeconds = 0;
        let playsCount = 0;
        let loopsCount = 0;

        for (const [tId, st] of Object.entries(u.trackStats)) {
          if (artistTrackIds.has(tId)) {
            listenSeconds += st.listenSeconds;
            playsCount += st.playsCount;
            loopsCount += st.loopsCount;
          }
        }

        return {
          user: u,
          listenSeconds,
          playsCount,
          loopsCount,
        };
      })
      .filter((item) => item.listenSeconds > 0 || item.playsCount > 0)
      .sort((a, b) => b.listenSeconds - a.listenSeconds);

    return {
      artistName: selectedArtistName,
      primaryCategory: artistTracks[0].category,
      cover: artistTracks[0].cover,
      artworkType: artistTracks[0].artworkType,
      tracks: artistTracks,
      totalPlays,
      totalLoops,
      totalLikes,
      totalListenSeconds,
      avgRetention,
      studioTeam: {
        labels: Array.from(labelsMap.values()),
        beatmakers: Array.from(beatmakersMap.values()),
        engineers: Array.from(engineersMap.values()),
        lyricists: Array.from(lyricistsMap.values()),
      },
      topListeners,
    };
  }, [selectedArtistName, allTracksFlat, users]);


  return {
    selectedTrackId, setSelectedTrackId,
    selectedArtistName, setSelectedArtistName,
    selectedConsumerUserId, setSelectedConsumerUserId,
    algoDimension, setAlgoDimension,
    algoFilterValue, setAlgoFilterValue,
    decoupledStudioRankings,
    dropAwardsList,
    algoFilterOptions,
    rankedFilteredTracks,
    groupedDimensionRankings,
    selectedTrackDetail,
    selectedConsumerUser,
    consumerAnalytics,
    selectedArtistAnalytics,
  };
}
