import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  syncUserPlaylistsToCloud,
  getUserPlaylistsFromCloud,
  DEFAULT_AD_BANNERS,
  DEFAULT_AD_BANNER_SETTINGS,
} from '../../../services/musicService';
import {
  AnalyticsTrackItem,
  AnalyticsAlbumNode,
  StudioEntityRole,
  StudioEntityAnalyticsData,
  UserPlaylist,
} from '../../../components/ReusableAnalyticsSheets';
import {
  ChartTimeframe,
  GABON_PASS_SPECS,
  buildBlindTestJuryDossiers,
  computeAllDecoupledStudioRankings,
  computeDropAwardsCategories,
  computeTrackExplosionScore,
  getTrackCertification,
  getAlbumCertification,
} from '../../../utils/rankingEngine';
import {
  Immersive3DPlayerProps,
  LyricLine,
  EQ_PRESETS,
  getArtworkDominantColors,
  normalizeSearchStr,
  normalizeToAnalyticsTrack,
} from '../../../components/player/playerEngineHelpers';
import {
  ensureTrackSurgicalAnalysis,
  parseMusicIntelligenceNaturalQuery,
} from '../../music-intelligence';
import {
  buildComposerOptionsFromCatalogue,
  useSocialFeedController,
  type SocialTargetSubject,
  type StudioAudioCaptureMode,
  type StudioLaunchConfig,
} from '../../social-feed';

export function useImmersivePlayerState(props: Immersive3DPlayerProps) {
  const {
    catalogue,
    albumIdx,
    trackIdx,
    currentTrack,
    currentTime,
    isPlaying,
    isDropMode,
    isShuffle,
    repeatMode,
    isCurrentLiked,
    likedTrackIds = {},
    recommendedTrackIds = {},
    subscribedArtists = {},
    artistSubscribers = {},
    communityRecommendations = [],
    rankInfo,
    currentRankInfo,
    trackRankMap = {},
    users = [],
    currentUser,
    categories = [],
    masterVolume,
    eqGains,
    userPlan,
    onToggleUserPlan,
    onTogglePlay,
    onForceStopPlay,
    onNavigateAlbum,
    onSelectAlbumIndex,
    onNavigateTrack,
    onSelectTrackIndex,
    onSeek,
    onToggleShuffle,
    onCycleRepeat,
    onToggleLike,
    onRecommendTrack,
    onApplySocialPoints,
    onToggleSubscribeArtist,
    onRecordLyricsOpen,
    onToggleDownload,
    onChangeMasterVolume,
    onChangeEqBand,
    onApplyEqPreset,
    onResetEq,
    eqBypassed = false,
    preampDb = 0,
    eqQFactor = 1.1,
    onToggleEqBypass,
    onChangePreampDb,
    onChangeEqQFactor,
    getAudioSpectrumData,
    onOpenAdminStudio,
    subscriptionPass = 'PASS_MENSUEL_HEBDO',
    onChangeSubscriptionPass,
    networkOperator = 'AIRTEL_GABON',
    onChangeNetworkOperator,
    lastEcgValidationMsg,
    onConfirmCreditHandshake,
    onOpenCreditDispute,
    onResolveCreditDispute,
    unreadNotificationsCount = 0,
    onOpenNotifications,
    adBanners = DEFAULT_AD_BANNERS,
    adBannerSettings = DEFAULT_AD_BANNER_SETTINGS,
    enableAwardsCeremony = false,
    rightsLines = [],
    payoutStatements = [],
    royaltySettings,
  } = props;

  // Desktop Split-Deck Studio Mode (True by default on large screens so Desktop is a real Studio Workstation, not a phone box)
  const [desktopSplitMode, setDesktopSplitMode] = useState<boolean>(true);

  const safeRankInfo = rankInfo || currentRankInfo || { rank: 4, delta: 3 };
  const isPro = userPlan === 'PRO';

  const [fullBleed, setFullBleed] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'PLAYLIST' | 'EQ' | 'QUEUE' | 'OPTIONS' | 'MINI' | 'RECOMMEND'
  >('NONE');
  const [showTrendStudioModal, setShowTrendStudioModal] = useState(false);
  const [trendStudioLaunchConfig, setTrendStudioLaunchConfig] = useState<StudioLaunchConfig>({
    captureMode: 'DROP_MUSIC_30S',
  });
  const [recommendNote, setRecommendNote] = useState<string>('');

  const openTrendStudioWithConfig = (
    captureMode: StudioAudioCaptureMode = 'DROP_MUSIC_30S',
    targetSubject?: SocialTargetSubject
  ) => {
    setTrendStudioLaunchConfig({ captureMode, targetSubject });
    setShowTrendStudioModal(true);
  };

  // In-Player Reusable Analytics Sheets State (Zero redirection to Admin!)
  const [inPlayerTrackId, setInPlayerTrackId] = useState<string | null>(null);
  const [inPlayerEntity, setInPlayerEntity] = useState<{
    name: string;
    role: StudioEntityRole;
  } | null>(null);
  const [inPlayerUserId, setInPlayerUserId] = useState<string | null>(null);

  // Central Hub Tabs & Instant Bottom Search State (Sliding Tabs)
  const [hubTab, setHubTab] = useState<
    'EXPLORER' | 'RANGS' | 'AWARDS' | 'RECOS' | 'ARTISTES' | 'PROFIL'
  >('EXPLORER');

  useEffect(() => {
    if (!enableAwardsCeremony && hubTab === 'AWARDS') {
      setHubTab('EXPLORER');
    }
  }, [enableAwardsCeremony, hubTab]);
  const [centralFullPageView, setCentralFullPageView] = useState<{
    type: 'ROLE' | 'GENRE' | 'DROPS' | 'ARTISTS_CIRCLES' | 'ALBUMS';
    title: string;
    role?: StudioEntityRole | 'ALL';
    genre?: string;
    accentColor: string;
  } | null>(null);
  const [hubGenreFilter, setHubGenreFilter] = useState<string>('ALL');
  const [hubRankDimension, setHubRankDimension] = useState<
    'ALL' | 'ARTIST' | 'BEATMAKER' | 'ENGINEER' | 'LYRICIST' | 'LABEL' | 'CATEGORY'
  >('ALL');
  const [chartTimeframe, setChartTimeframe] =
    useState<ChartTimeframe>('MONTHLY_30D');
  const [awardsSubView, setAwardsSubView] = useState<
    'PALMARES' | 'BLIND_TEST' | 'CERTIFICATIONS'
  >('PALMARES');
  const [blindRoleFilter, setBlindRoleFilter] = useState<
    'BEATMAKER' | 'ENGINEER' | 'LYRICIST'
  >('BEATMAKER');
  const [customJuryScores, setCustomJuryScores] = useState<
    Record<string, number>
  >({});
  const [blindCriteriaDraft, setBlindCriteriaDraft] = useState<
    Record<string, [number, number, number, number]>
  >({});
  const [customPublicVotes, setCustomPublicVotes] = useState<
    Record<string, number>
  >({});
  const [votesUsedToday, setVotesUsedToday] = useState<number>(0);

  const [hubTeamRoleFilter, setHubTeamRoleFilter] = useState<
    'ALL' | StudioEntityRole
  >('ALL');
  const [hubSearchQuery, setHubSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Selected EQ band index for fat-finger precision controls (0..4)
  const [selectedBandIdx, setSelectedBandIdx] = useState<number>(0);

  // Toast Notification state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastDotColor, setToastDotColor] = useState<string>('bg-amber-400');
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string, dotColor = 'bg-amber-400') => {
    setToastMsg(msg);
    setToastDotColor(dotColor);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 2600);
  };

  const notifyProRequired = (featureName: string) => {
    showToast(`${featureName} réservé aux comptes DROP Pro`, 'bg-amber-400');
  };

  // Open Track Detail & Studio Parameters directly inside User View (never blocks, never redirects to Admin)
  const openUserTrackSheet = (trackId: string) => {
    setActiveModal((prev) => (prev === 'MINI' ? 'MINI' : 'NONE'));
    setInPlayerEntity(null);
    setInPlayerUserId(null);
    setInPlayerTrackId(trackId);
  };

  // Open Artist or Studio Collaborator Profile directly inside User View (never blocks, never redirects to Admin)
  const openUserEntitySheet = (
    name: string,
    role: StudioEntityRole = 'ARTIST'
  ) => {
    if (!name || !name.trim()) return;
    setActiveModal((prev) => (prev === 'MINI' ? 'MINI' : 'NONE'));
    setInPlayerTrackId(null);
    setInPlayerUserId(null);
    setInPlayerEntity({ name: name.trim(), role });
  };

  // Open Listener Profile directly inside User View (100% safe, never crashes)
  const openUserListenerSheet = (userId: string) => {
    setActiveModal((prev) => (prev === 'MINI' ? 'MINI' : 'NONE'));
    setInPlayerTrackId(null);
    setInPlayerEntity(null);
    setInPlayerUserId(userId || 'usr-fallback');
  };

  const closeAllAnalyticsSheets = () => {
    setInPlayerTrackId(null);
    setInPlayerEntity(null);
    setInPlayerUserId(null);
  };

  // Synchronized Play/Toggle helper
  const handlePlayOrToggleSpecificTrack = (aIdx: number, tIdx: number) => {
    if (aIdx === albumIdx && tIdx === trackIdx) {
      onTogglePlay();
    } else {
      onSelectAlbumIndex(aIdx, tIdx, true);
    }
  };

  // Normalized Catalogue & Flat Tracks for Reusable Analytics & Central Hub
  const analyticsCatalogue: AnalyticsAlbumNode[] = useMemo(
    () =>
      catalogue.map((alb) => ({
        id: alb.id,
        artist: alb.artist,
        albumTitle: alb.albumTitle,
        category: alb.category,
        year: alb.year,
        tracks: alb.tracks.map(normalizeToAnalyticsTrack),
      })),
    [catalogue]
  );

  const allTracksFlat = useMemo(() => {
    const list: {
      track: AnalyticsTrackItem;
      album: AnalyticsAlbumNode;
      albumIndex: number;
      trackIndex: number;
    }[] = [];
    analyticsCatalogue.forEach((alb, aIdx) => {
      alb.tracks.forEach((t, tIdx) => {
        list.push({ track: t, album: alb, albumIndex: aIdx, trackIndex: tIdx });
      });
    });
    return list;
  }, [analyticsCatalogue]);

  const socialFeedCatalogueRefs = useMemo(
    () =>
      allTracksFlat.map(({ track, album }) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        albumId: album.id,
        realPlays: track.realPlays,
        category: track.category,
        bpm: track.bpm,
        featuringArtists: track.featuringArtists,
        beatmakerName: track.beatmakerName,
        soundEngineerName: track.soundEngineerName,
        lyricistName: track.lyricistName,
      })),
    [allTracksFlat]
  );

  const socialFeedCtrl = useSocialFeedController({
    actor: {
      id: currentUser?.id || 'u-guest',
      name: currentUser?.name || 'Auditeur DROP (+241)',
      avatar: currentUser?.avatar || 'DR',
    },
    legacyRecommendations: communityRecommendations,
    likedTrackIds,
    catalogueTracks: socialFeedCatalogueRefs,
    onApplySocialPoints,
    onToast: showToast,
  });

  const studioSelectableTargets = useMemo(
    () => buildComposerOptionsFromCatalogue(allTracksFlat).studioTargets,
    [allTracksFlat]
  );

  // Every new genre added in Admin is immediately included here
  const availableGenres = useMemo(() => {
    const set = new Set<string>(categories);
    allTracksFlat.forEach(({ track }) => set.add(track.category));
    return Array.from(set);
  }, [categories, allTracksFlat]);

  // Decoupled Studio Rankings (Anti-Halo Effect Engine)
  const decoupledStudioRankings = useMemo(
    () =>
      computeAllDecoupledStudioRankings(
        allTracksFlat.map((m) => m.track),
        artistSubscribers,
        chartTimeframe
      ),
    [allTracksFlat, artistSubscribers, chartTimeframe]
  );

  // Dossiers Anonymisés du Module « Jury à l'Aveugle » (Blind Test -14 LUFS)
  const blindTestDossiers = useMemo(
    () =>
      buildBlindTestJuryDossiers(
        allTracksFlat.map((m) => m.track),
        decoupledStudioRankings
      ),
    [allTracksFlat, decoupledStudioRankings]
  );

  // Official DROP Awards Categories (Grille A 50/25/25 & Grille B 50/35/15)
  const dropAwardsList = useMemo(
    () =>
      computeDropAwardsCategories(
        allTracksFlat.map((m) => m.track),
        decoupledStudioRankings,
        availableGenres,
        customJuryScores,
        customPublicVotes
      ),
    [
      allTracksFlat,
      decoupledStudioRankings,
      availableGenres,
      customJuryScores,
      customPublicVotes,
    ]
  );

  const maxDailyVotes =
    GABON_PASS_SPECS[subscriptionPass]?.dailyAwardsVoteQuota ?? 3;
  const remainingDailyVotes = Math.max(0, maxDailyVotes - votesUsedToday);

  // Compute Selected In-Player Track Sheet Data
  const activeTrackSheetData = useMemo(() => {
    if (!inPlayerTrackId) return null;
    const found = allTracksFlat.find(
      (item) => item.track.id === inPlayerTrackId
    );
    if (!found) return null;
    const rInfo = trackRankMap[found.track.id] || { rank: 1, delta: 0 };
    return { ...found, rankInfo: rInfo };
  }, [inPlayerTrackId, allTracksFlat, trackRankMap]);

  // Compute Selected In-Player Artist / Studio Collaborator Sheet Data
  const activeEntitySheetData: StudioEntityAnalyticsData | null = useMemo(() => {
    if (!inPlayerEntity) return null;
    const { name, role } = inPlayerEntity;
    const targetLower = name.toLowerCase();

    const matching = allTracksFlat
      .map((item) => {
        const { track } = item;
        const isMainArtist = track.artist.toLowerCase() === targetLower;
        const isFeatArtist =
          track.featuringArtists?.some(
            (f) => f.toLowerCase() === targetLower
          ) ?? false;

        let matches = false;
        if (role === 'ARTIST') matches = isMainArtist || isFeatArtist;
        else if (role === 'LABEL')
          matches = track.labelName.toLowerCase() === targetLower;
        else if (role === 'BEATMAKER')
          matches = track.beatmakerName.toLowerCase() === targetLower;
        else if (role === 'ENGINEER')
          matches = track.soundEngineerName.toLowerCase() === targetLower;
        else if (role === 'LYRICIST')
          matches =
            (track.lyricistName || track.artist).toLowerCase() === targetLower;

        return matches
          ? { ...item, isFeaturing: role === 'ARTIST' && !isMainArtist && isFeatArtist }
          : null;
      })
      .filter(
        (
          item
        ): item is {
          track: AnalyticsTrackItem;
          album: AnalyticsAlbumNode;
          albumIndex: number;
          trackIndex: number;
          isFeaturing: boolean;
        } => item !== null
      )
      .sort((a, b) => b.track.algoPoints - a.track.algoPoints);

    if (matching.length === 0) return null;

    const totalPlays = matching.reduce((acc, m) => acc + m.track.realPlays, 0);
    const totalLoops = matching.reduce(
      (acc, m) => acc + m.track.loopPlaysCount,
      0
    );
    const totalLikes = matching.reduce((acc, m) => acc + m.track.likesCount, 0);
    const totalListenSeconds = matching.reduce(
      (acc, m) => acc + m.track.totalListenSeconds,
      0
    );
    const avgRetention = Math.round(
      matching.reduce((acc, m) => acc + m.track.avgRetentionPct, 0) /
        matching.length
    );

    const artistsMap = new Map<
      string,
      { name: string; role: StudioEntityRole; tracksCount: number }
    >();
    const labelsMap = new Map<
      string,
      { name: string; role: StudioEntityRole; tracksCount: number }
    >();
    const beatmakersMap = new Map<
      string,
      { name: string; role: StudioEntityRole; tracksCount: number }
    >();
    const engineersMap = new Map<
      string,
      { name: string; role: StudioEntityRole; tracksCount: number }
    >();
    const lyricistsMap = new Map<
      string,
      { name: string; role: StudioEntityRole; tracksCount: number }
    >();

    for (const { track: t } of matching) {
      const a = artistsMap.get(t.artist) || {
        name: t.artist,
        role: 'ARTIST' as const,
        tracksCount: 0,
      };
      a.tracksCount += 1;
      artistsMap.set(t.artist, a);

      if (t.featuringArtists) {
        for (const feat of t.featuringArtists) {
          const fa = artistsMap.get(feat) || {
            name: feat,
            role: 'ARTIST' as const,
            tracksCount: 0,
          };
          fa.tracksCount += 1;
          artistsMap.set(feat, fa);
        }
      }

      const l = labelsMap.get(t.labelName) || {
        name: t.labelName,
        role: 'LABEL' as const,
        tracksCount: 0,
      };
      l.tracksCount += 1;
      labelsMap.set(t.labelName, l);

      const b = beatmakersMap.get(t.beatmakerName) || {
        name: t.beatmakerName,
        role: 'BEATMAKER' as const,
        tracksCount: 0,
      };
      b.tracksCount += 1;
      beatmakersMap.set(t.beatmakerName, b);

      const e = engineersMap.get(t.soundEngineerName) || {
        name: t.soundEngineerName,
        role: 'ENGINEER' as const,
        tracksCount: 0,
      };
      e.tracksCount += 1;
      engineersMap.set(t.soundEngineerName, e);

      const lyrName = t.lyricistName || t.artist;
      const lyr = lyricistsMap.get(lyrName) || {
        name: lyrName,
        role: 'LYRICIST' as const,
        tracksCount: 0,
      };
      lyr.tracksCount += 1;
      lyricistsMap.set(lyrName, lyr);
    }

    const trackIdSet = new Set(matching.map((m) => m.track.id));
    const topListeners = (users || [])
      .map((u) => {
        let listenSeconds = 0;
        let playsCount = 0;
        let loopsCount = 0;
        for (const [tId, st] of Object.entries(u.trackStats || {})) {
          if (trackIdSet.has(tId) && st) {
            listenSeconds += st.listenSeconds || 0;
            playsCount += st.playsCount || 0;
            loopsCount += st.loopsCount || 0;
          }
        }
        return { user: u, listenSeconds, playsCount, loopsCount };
      })
      .filter((item) => item.listenSeconds > 0 || item.playsCount > 0)
      .sort((a, b) => b.listenSeconds - a.listenSeconds);

    const decoupledRanking = decoupledStudioRankings.find(
      (r) => r.role === role && r.name.toLowerCase() === targetLower
    );

    const subsCount =
      artistSubscribers[name] ??
      artistSubscribers[targetLower] ??
      decoupledRanking?.subscribersCount ??
      Math.round(totalPlays * 0.065 + 420);

    return {
      entityName: name,
      role,
      primaryCategory: matching[0].track.category,
      cover: matching[0].track.cover,
      artworkType: matching[0].track.artworkType,
      tracks: matching.map((m) => ({
        track: m.track,
        albumIndex: m.albumIndex,
        trackIndex: m.trackIndex,
        isFeaturing: m.isFeaturing,
      })),
      totalPlays,
      totalLoops,
      totalLikes,
      totalListenSeconds,
      avgRetention,
      decoupledRanking,
      subscribersCount: subsCount,
      isSubscribed:
        !!subscribedArtists[name] || !!subscribedArtists[targetLower],
      studioTeam: {
        artists: Array.from(artistsMap.values()),
        labels: Array.from(labelsMap.values()),
        beatmakers: Array.from(beatmakersMap.values()),
        engineers: Array.from(engineersMap.values()),
        lyricists: Array.from(lyricistsMap.values()),
      },
      topListeners,
    };
  }, [
    inPlayerEntity,
    allTracksFlat,
    users,
    decoupledStudioRankings,
    artistSubscribers,
    subscribedArtists,
  ]);

  // Compute Selected In-Player Listener Profile Sheet Data (with safe fallback)
  const activeUserSheetData = useMemo(() => {
    if (!inPlayerUserId) return null;
    const foundUser =
      (users || []).find((u) => u.id === inPlayerUserId) ||
      currentUser ||
      (users && users[0]) || {
        id: inPlayerUserId,
        name: 'Auditeur Fidèle (+241)',
        email: 'auditeur@drop.ga',
        role: 'USER' as const,
        joinedAt: '2024',
        avatar: 'AF',
        totalLikes: 18,
        totalListenSeconds: 5400,
        totalValidatedPlays: 42,
        totalLoops: 12,
        trackStats: {},
      };
    const sortedUsers = [...(users || [])].sort(
      (a, b) => (b.totalListenSeconds || 0) - (a.totalListenSeconds || 0)
    );
    const rankIdx = sortedUsers.findIndex((u) => u.id === foundUser.id);
    return { user: foundUser, rank: rankIdx >= 0 ? rankIdx + 1 : 1 };
  }, [inPlayerUserId, users, currentUser]);

  // Instant Multi-Criteria Intelligent Search Results (reacts from the very 1st letter typed!)
  // Accent-insensitive, prefix-prioritized + word-boundary + fuzzy subsequence matching across:
  // Titres, Beats & Instrumentales, Artistes & Featurings, Beatmakers, Ingés Son, Paroliers, Labels, Genres & DROP-CID
  const instantSearchResults = useMemo(() => {
    const raw = normalizeSearchStr(hubSearchQuery.trim());
    if (!raw) return null;

    const scoreMatch = (text?: string): number => {
      if (!text) return 0;
      const lower = normalizeSearchStr(text);
      if (!lower) return 0;
      if (lower === raw) return 100;
      if (lower.startsWith(raw)) return 88;
      // Word boundary prefix match (e.g. typing "b" matches "L'Oiseau Rare" or "Beat Tape")
      const words = lower.split(/[\s\-_.,/()]+/);
      if (words.some((w) => w.startsWith(raw))) return 76;
      if (lower.includes(raw)) return 58;
      // Subsequence fuzzy match for 2+ letters
      if (raw.length >= 2) {
        let qIdx = 0;
        for (let i = 0; i < lower.length && qIdx < raw.length; i++) {
          if (lower[i] === raw[qIdx]) qIdx++;
        }
        if (qIdx === raw.length) return 32;
      }
      return 0;
    };

    const matchingGenres = availableGenres.filter((g) => scoreMatch(g) > 0);
    const nq = parseMusicIntelligenceNaturalQuery(hubSearchQuery);

    const allScoredTracks = allTracksFlat
      .map((item) => {
        const { track } = item;
        const featScore =
          track.featuringArtists && track.featuringArtists.length > 0
            ? Math.max(...track.featuringArtists.map((f) => scoreMatch(f)))
            : 0;
        const lyricsTextScore =
          track.lyrics && track.lyrics.length > 0
            ? Math.max(...track.lyrics.map((l) => scoreMatch(l.text))) * 0.7
            : 0;

        let nqBoost = 0;
        const analysis = ensureTrackSurgicalAnalysis(track);
        const effBpm = analysis.confirmedBpm ?? analysis.detectedBpm ?? track.bpm;
        if (nq.targetBpm && effBpm) {
          const delta = Math.abs(effBpm - nq.targetBpm);
          if (delta <= nq.bpmTolerance) nqBoost += 90 - delta * 4;
        }
        if (nq.bpmRange && effBpm && effBpm >= nq.bpmRange[0] && effBpm <= nq.bpmRange[1]) {
          nqBoost += 88;
        }
        const effKey = (analysis.confirmedKey || analysis.detectedKey || track.musicalKey || '').toLowerCase();
        if (nq.targetKeyQuery && effKey.includes(nq.targetKeyQuery.toLowerCase())) {
          nqBoost += 82;
        }
        if (nq.targetCamelot && (analysis.camelotKey || '').toUpperCase() === nq.targetCamelot) {
          nqBoost += 85;
        }
        if (nq.minEnergy && (analysis.energy ?? 0.78) >= nq.minEnergy) {
          nqBoost += 42;
        }
        if (nq.maxEnergy && (analysis.energy ?? 0.72) <= nq.maxEnergy) {
          nqBoost += 42;
        }
        if (nq.minDanceability && (analysis.danceability ?? 0.78) >= nq.minDanceability) {
          nqBoost += 38;
        }
        if (nq.targetGenreHint && track.category.toLowerCase().includes(nq.targetGenreHint.slice(0, 4))) {
          nqBoost += 65;
        }

        const baseScore = Math.max(
          scoreMatch(track.title) * 1.4,
          scoreMatch(track.artist) * 1.25,
          featScore * 1.2,
          scoreMatch(track.dropContentId) * 1.35,
          scoreMatch(track.beatmakerName) * 1.15,
          scoreMatch(track.lyricistName) * 1.1,
          scoreMatch(track.soundEngineerName) * 1.05,
          scoreMatch(track.category) * 1.1,
          scoreMatch(track.album),
          scoreMatch(track.labelName) * 0.95,
          scoreMatch(track.musicalKey) * 0.85,
          lyricsTextScore
        );
        const score = baseScore > 0 ? baseScore + nqBoost : nqBoost > 0 ? nqBoost : 0;
        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort(
        (a, b) => b.score - a.score || b.track.algoPoints - a.track.algoPoints
      );

    const matchingBeats = allScoredTracks.filter(
      (m) =>
        m.track.isInstrumental || m.track.category === 'Beats & Instrumentales'
    );
    const matchingTracks = allScoredTracks.filter(
      (m) =>
        !(
          m.track.isInstrumental ||
          m.track.category === 'Beats & Instrumentales'
        )
    );

    const matchingEntities = decoupledStudioRankings
      .map((ent) => {
        const score = Math.max(
          scoreMatch(ent.name) * 1.3,
          scoreMatch(ent.category) * 0.9
        );
        return { ...ent, score };
      })
      .filter((ent) => ent.score > 0)
      .sort((a, b) => b.score - a.score || b.decoupledScore - a.decoupledScore);

    return {
      genres: matchingGenres,
      beats: matchingBeats,
      tracks: matchingTracks,
      entities: matchingEntities,
      totalCount:
        matchingGenres.length +
        matchingBeats.length +
        matchingTracks.length +
        matchingEntities.length,
    };
  }, [
    hubSearchQuery,
    availableGenres,
    allTracksFlat,
    decoupledStudioRankings,
  ]);

  // Heart pop animation trigger
  const [heartAnimKey, setHeartAnimKey] = useState(0);

  // Persistent User Playlists state (synchronized between Player, Central & Mon Profil)
  const [playlists, setPlaylists] = useState<UserPlaylist[]>(() => {
    const defaultIds = allTracksFlat.map((m) => m.track.id);
    const fallbackPlaylists: UserPlaylist[] = [
      {
        id: 'pl-1',
        name: 'Hits Gabon 241',
        colorTheme: '#e11d38',
        iconType: 'fire',
        trackIds: defaultIds.slice(0, 3),
        createdAt: '2025',
      },
      {
        id: 'pl-2',
        name: 'Ntcham & Vibe',
        colorTheme: '#f59e0b',
        iconType: 'sparkle',
        trackIds: defaultIds.slice(1, 4),
        createdAt: '2025',
      },
      {
        id: 'pl-3',
        name: 'Nuit Libreville',
        colorTheme: '#8b5cf6',
        iconType: 'moon',
        trackIds: defaultIds.slice(0, 2),
        createdAt: '2025',
      },
      {
        id: 'pl-4',
        name: 'Sport & Boost',
        colorTheme: '#10b981',
        iconType: 'heart',
        trackIds: defaultIds.slice(2, 5),
        createdAt: '2025',
      },
    ];
    try {
      const saved = window.localStorage.getItem('drop_user_playlists_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return fallbackPlaylists;
  });
  const [newPlaylistInput, setNewPlaylistInput] = useState('');

  // Récupération initiale depuis Supabase Cloud pour persistance multi-appareils
  useEffect(() => {
    getUserPlaylistsFromCloud(currentUser?.id || 'usr-1')
      .then((cloudPls) => {
        if (cloudPls && cloudPls.length > 0) {
          setPlaylists(cloudPls);
        }
      })
      .catch(() => {});
  }, [currentUser?.id]);

  useEffect(() => {
    syncUserPlaylistsToCloud(playlists, currentUser?.id || 'usr-1').catch(
      () => {}
    );
  }, [playlists, currentUser?.id]);

  const handleCreatePlaylist = (
    name: string,
    colorTheme = '#e11d38',
    initialTrackId?: string
  ) => {
    const clean = name.trim();
    if (!clean) return;
    const newPl: UserPlaylist = {
      id: `pl-${Date.now()}`,
      name: clean,
      colorTheme,
      iconType: 'sparkle',
      trackIds: initialTrackId ? [initialTrackId] : [],
      createdAt: new Date().toLocaleDateString('fr-FR'),
    };
    setPlaylists((prev) => [newPl, ...prev]);
    showToast(`Playlist « ${clean} » créée dans votre profil !`, 'bg-emerald-400');
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    showToast('Playlist supprimée de votre bibliothèque', 'bg-zinc-400');
  };

  const handleToggleTrackInPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const exists = pl.trackIds.includes(trackId);
        const nextIds = exists
          ? pl.trackIds.filter((id) => id !== trackId)
          : [...pl.trackIds, trackId];
        showToast(
          exists
            ? `Retiré de « ${pl.name} »`
            : `Ajouté à « ${pl.name} »`,
          exists ? 'bg-zinc-400' : 'bg-emerald-400'
        );
        return { ...pl, trackIds: nextIds };
      })
    );
  };

  // 2D Carousel Drag Physics
  const [isDraggingCarousel, setIsDraggingCarousel] = useState(false);
  const [dragAxis, setDragAxis] = useState<'NONE' | 'X' | 'Y'>('NONE');
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const [dragDeltaY, setDragDeltaY] = useState(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragMovedRef = useRef(false);
  const wheelCooldownRef = useRef(false);

  // Scrubber drag state
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Dominant Cover Color Extraction & Dynamic Ambient CSS Variables
  useEffect(() => {
    const fallbackColors = getArtworkDominantColors(currentTrack.artworkType);
    const basePrimary = currentTrack.ambientPrimary?.startsWith('#')
      ? currentTrack.ambientPrimary
      : fallbackColors.primary;
    const baseSecondary = currentTrack.ambientSecondary?.startsWith('#')
      ? currentTrack.ambientSecondary
      : fallbackColors.secondary;

    document.documentElement.style.setProperty('--ambient-primary', basePrimary);
    document.documentElement.style.setProperty(
      '--ambient-secondary',
      baseSecondary
    );

    if (currentTrack.cover && currentTrack.cover.trim().length > 0) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 24;
          canvas.height = 24;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, 24, 24);
          const data = ctx.getImageData(0, 0, 24, 24).data;
          let r = 0;
          let g = 0;
          let b = 0;
          let count = 0;
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (alpha > 128 && lum > 24 && lum < 245) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              count++;
            }
          }
          if (count > 0) {
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            const primaryRgb = `rgb(${r}, ${g}, ${b})`;
            const secondaryRgb = `rgb(${Math.round(r * 0.55)}, ${Math.round(
              g * 0.55
            )}, ${Math.round(b * 0.55)})`;
            document.documentElement.style.setProperty(
              '--ambient-primary',
              primaryRgb
            );
            document.documentElement.style.setProperty(
              '--ambient-secondary',
              secondaryRgb
            );
          }
        } catch {
          // Keep artwork fallback colors if canvas is tainted
        }
      };
      img.src = currentTrack.cover;
    }
  }, [currentTrack]);

  // Close lyrics or Pro sheets if user switches to BASIC while open
  useEffect(() => {
    if (!isPro) {
      if (lyricsOpen) setLyricsOpen(false);
      closeAllAnalyticsSheets();
    }
  }, [isPro, lyricsOpen]);

  // Carousel Pointer Handlers
  const handleCarouselPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDraggingCarousel(true);
    setDragAxis('NONE');
    setDragDeltaX(0);
    setDragDeltaY(0);
    dragMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleCarouselPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCarousel || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    let currentAxis = dragAxis;
    if (currentAxis === 'NONE') {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        currentAxis = Math.abs(dx) >= Math.abs(dy) ? 'X' : 'Y';
        setDragAxis(currentAxis);
        dragMovedRef.current = true;
      }
    }

    if (currentAxis === 'X') {
      setDragDeltaX(dx);
      setDragDeltaY(0);
    } else if (currentAxis === 'Y') {
      setDragDeltaX(0);
      setDragDeltaY(Math.max(-110, Math.min(110, dy)));
    }
  };

  const handleCarouselPointerUp = () => {
    if (!isDraggingCarousel) return;
    setIsDraggingCarousel(false);

    const threshold = 44;
    if (dragAxis === 'X') {
      if (dragDeltaX < -threshold) {
        onNavigateAlbum(1);
      } else if (dragDeltaX > threshold) {
        onNavigateAlbum(-1);
      }
    } else if (dragAxis === 'Y') {
      if (dragDeltaY < -threshold) {
        onNavigateTrack(1);
        showToast('Titre suivant de l’album');
      } else if (dragDeltaY > threshold) {
        onNavigateTrack(-1);
        showToast('Titre précédent de l’album');
      }
    }

    dragStartRef.current = null;
    setDragAxis('NONE');
    setDragDeltaX(0);
    setDragDeltaY(0);
  };

  const handleCarouselWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (wheelCooldownRef.current) return;
    const isHorizontal = Math.abs(e.deltaX) >= Math.abs(e.deltaY);
    const delta = isHorizontal ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 18) {
      wheelCooldownRef.current = true;
      if (delta > 0) onNavigateAlbum(1);
      else onNavigateAlbum(-1);
      window.setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 420);
    }
  };

  // Scrubber Seek Handlers
  const seekFromPointer = (clientX: number) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(Math.round(ratio * currentTrack.duration));
  };

  const handleScrubberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    seekFromPointer(e.clientX);
  };

  const handleScrubberPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    seekFromPointer(e.clientX);
  };

  const handleScrubberPointerUp = () => {
    setIsScrubbing(false);
  };

  const handleVolumeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const val = parseFloat(e.currentTarget.value);
    if (!Number.isNaN(val)) {
      onChangeMasterVolume(val);
    }
  };

  const stepSelectedBandGain = (deltaDb: number) => {
    const currentVal = eqGains[selectedBandIdx] ?? 0;
    const nextVal = Math.max(
      -12,
      Math.min(12, Math.round((currentVal + deltaDb) * 2) / 2)
    );
    onChangeEqBand(selectedBandIdx, nextVal);
  };

  const activePresetId =
    EQ_PRESETS.find((preset) =>
      preset.gains.every(
        (g, idx) => Math.abs(g - (eqGains[idx] ?? 0)) < 0.1
      )
    )?.id || 'custom';

  const isEqCustomOrActive = eqGains.some((g) => Math.abs(g) > 0.1);

  const progressPct = Math.min(
    100,
    Math.max(0, (currentTime / Math.max(1, currentTrack.duration)) * 100)
  );
  const dropStartPct = Math.min(
    100,
    Math.max(0, (currentTrack.dropStart / Math.max(1, currentTrack.duration)) * 100)
  );
  const dropWidthPct = Math.min(
    100 - dropStartPct,
    Math.max(4, (currentTrack.dropDuration / Math.max(1, currentTrack.duration)) * 100)
  );

  const currentAlbum = catalogue[albumIdx] || catalogue[0];
  const dragOffsetRatio = dragAxis === 'X' ? dragDeltaX / 220 : 0;

  const trackLyrics: LyricLine[] =
    currentTrack.lyrics && currentTrack.lyrics.length > 0
      ? currentTrack.lyrics
      : [
          { time: 0, text: `${currentTrack.title} — ${currentTrack.artist}` },
          {
            time: Math.max(5, Math.floor(currentTrack.dropStart * 0.5)),
            text: "Les fréquences s'alignent dans l'espace sonore",
          },
          {
            time: currentTrack.dropStart,
            text: '[DROP] Le refrain résonne à pleine intensité',
          },
          {
            time: Math.min(
              currentTrack.duration - 10,
              currentTrack.dropStart + currentTrack.dropDuration
            ),
            text: `Production Studio • ${currentTrack.labelName}`,
          },
        ];

  let activeLyricIdx = 0;
  trackLyrics.forEach((l, idx) => {
    if (currentTime >= l.time) activeLyricIdx = idx;
  });

  const eqCurvePoints = eqGains
    .map((gain, i) => {
      const x = 24 + i * 58;
      const y = 44 - (gain / 12) * 32;
      return `${x},${y.toFixed(1)}`;
    })
    .join(' ');

  const hasOpenAnalyticsSheet = !!(
    activeTrackSheetData ||
    activeEntitySheetData ||
    activeUserSheetData
  );

  const currentTrackCert = getTrackCertification(currentTrack.realPlays);
  const currentArtistSubscribed =
    !!subscribedArtists[currentTrack.artist] ||
    !!subscribedArtists[currentTrack.artist.toLowerCase()];
  const currentArtistSubscribersCount =
    artistSubscribers[currentTrack.artist] ??
    artistSubscribers[currentTrack.artist.toLowerCase()] ??
    Math.round(currentTrack.realPlays * 0.065 + 420);
  const currentRecsCount =
    currentTrack.recommendationsCount ??
    Math.max(14, Math.round(currentTrack.realPlays * 0.018));
  const isCurrentRecommended = !!recommendedTrackIds[currentTrack.id];
  const currentLyricist = currentTrack.lyricistName || currentTrack.artist;



  return {
    ...props,
    eqBypassed,
    preampDb,
    eqQFactor,
    adBanners,
    adBannerSettings,
    enableAwardsCeremony,
    rightsLines,
    payoutStatements,
    royaltySettings,
    likedTrackIds,
    recommendedTrackIds,
    subscribedArtists,
    artistSubscribers,
    communityRecommendations,
    trackRankMap,
    users,
    categories,
    subscriptionPass,
    networkOperator,
    unreadNotificationsCount,
    safeRankInfo,
    isPro,
    fullBleed,
    setFullBleed,
    desktopSplitMode,
    setDesktopSplitMode,
    lyricsOpen,
    setLyricsOpen,
    activeModal,
    setActiveModal,
    showTrendStudioModal,
    setShowTrendStudioModal,
    trendStudioLaunchConfig,
    openTrendStudioWithConfig,
    studioSelectableTargets,
    socialFeedCtrl,
    onForceStopPlay,
    recommendNote,
    setRecommendNote,
    inPlayerTrackId,
    setInPlayerTrackId,
    inPlayerEntity,
    setInPlayerEntity,
    inPlayerUserId,
    setInPlayerUserId,
    hubTab,
    setHubTab,
    centralFullPageView,
    setCentralFullPageView,
    hubGenreFilter,
    setHubGenreFilter,
    hubRankDimension,
    setHubRankDimension,
    chartTimeframe,
    setChartTimeframe,
    awardsSubView,
    setAwardsSubView,
    blindRoleFilter,
    setBlindRoleFilter,
    customJuryScores,
    setCustomJuryScores,
    blindCriteriaDraft,
    setBlindCriteriaDraft,
    customPublicVotes,
    setCustomPublicVotes,
    votesUsedToday,
    setVotesUsedToday,
    hubTeamRoleFilter,
    setHubTeamRoleFilter,
    hubSearchQuery,
    setHubSearchQuery,
    searchInputRef,
    selectedBandIdx,
    setSelectedBandIdx,
    toastMsg,
    setToastMsg,
    toastDotColor,
    showToast,
    notifyProRequired,
    openUserTrackSheet,
    openUserEntitySheet,
    openUserListenerSheet,
    closeAllAnalyticsSheets,
    handlePlayOrToggleSpecificTrack,
    analyticsCatalogue,
    allTracksFlat,
    availableGenres,
    decoupledStudioRankings,
    blindTestDossiers,
    dropAwardsList,
    maxDailyVotes,
    remainingDailyVotes,
    activeTrackSheetData,
    activeEntitySheetData,
    activeUserSheetData,
    instantSearchResults,
    heartAnimKey,
    setHeartAnimKey,
    playlists,
    setPlaylists,
    newPlaylistInput,
    setNewPlaylistInput,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleToggleTrackInPlaylist,
    isEqCustomOrActive,
    currentAlbum,
    trackLyrics,
    activeLyricIdx,
    hasOpenAnalyticsSheet,
    currentTrackCert,
    currentArtistSubscribed,
    currentArtistSubscribersCount,
    currentRecsCount,
    isCurrentRecommended,
    currentLyricist,
  };
}

export type ReturnTypeUseImmersivePlayerState = ReturnType<typeof useImmersivePlayerState>;
