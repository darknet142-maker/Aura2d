import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  CoverArtwork,
  ArtworkType,
  DropOfficialLogo,
  RankMedalSvg,
} from './CoverArtwork';
import {
  SyncStatusSnapshot,
  GabonSubscriptionPass,
  GabonNetworkOperator,
} from '../services/offlineStreamTracker';
import {
  AnalyticsTrackItem,
  AnalyticsAlbumNode,
  AnalyticsAppUser,
  StudioEntityRole,
  StudioEntityAnalyticsData,
  SynchronizedMiniPlayer,
  ReusableTrackDetailSheet,
  ReusableArtistDetailSheet,
  ReusableUserProfileSheet,
  RankBadgeSvg,
  CertificationBadgeSvg,
  OfficialQrCodeSvg,
} from './ReusableAnalyticsSheets';
import {
  ChartTimeframe,
  FeaturingSplitMode,
  TrackCreditHandshake,
  GABON_PASS_SPECS,
  CommunityRecommendationItem,
  buildBlindTestJuryDossiers,
  computeAllDecoupledStudioRankings,
  computeDropAwardsCategories,
  computeTrackExplosionScore,
  getTrackCertification,
  getAlbumCertification,
} from '../utils/rankingEngine';

export interface LyricLine {
  time: number;
  text: string;
}

export interface PlayerTrackItem {
  id: string;
  title: string;
  artist: string;
  featuringArtists?: string[];
  featuringSplitMode?: FeaturingSplitMode;
  album: string;
  category: string;
  labelName: string;
  copyrightText?: string;
  beatmakerName?: string;
  soundEngineerName?: string;
  recordingEngineerName?: string;
  mixingEngineerName?: string;
  masteringEngineerName?: string;
  lyricistName?: string;
  isExternalLyricist?: boolean;
  hasSynchronizedLyrics?: boolean;
  gabonTerritoryPct?: number;
  weeksInTop10?: number;
  isPreAlbumSingleOver6Months?: boolean;
  lufsMasterLevel?: number;
  acousticClippingDetected?: boolean;
  retention45sPct?: number;
  halfLifeRetentionJ90Pct?: boolean | number;
  creditHandshake?: TrackCreditHandshake;
  cover: string;
  artworkType?: ArtworkType;
  ambientPrimary?: string;
  ambientSecondary?: string;
  duration: number;
  dropStart: number;
  dropDuration: number;
  bpm?: number;
  realPlays: number;
  displayPlaysFormatted?: string;
  lastActivityAgo: string;
  totalListenSeconds?: number;
  listenSessions?: number;
  avgRetentionPct?: number;
  retention30sPct?: number;
  algoPoints?: number;
  likesCount?: number;
  loopPlaysCount?: number;
  recommendationsCount?: number;
  lyricsOpensCount?: number;
  lyricsSharesCount?: number;
  longevityDays?: number;
  consecutiveLoops?: number;
  baselineRank?: number;
  artistBaselinePlays?: number;
  downloadedOffline?: boolean;
  inPlaylist?: boolean;
  lyrics?: LyricLine[];
}

export interface PlayerAlbumNode {
  id: string;
  artist: string;
  albumTitle: string;
  category: string;
  year: string;
  tracks: PlayerTrackItem[];
}

export interface EqPreset {
  id: string;
  name: string;
  description: string;
  gains: number[]; // [60Hz, 250Hz, 1kHz, 4kHz, 12kHz]
}

export const EQ_PRESETS: EqPreset[] = [
  {
    id: 'flat',
    name: 'Neutre Studio',
    description: 'Réponse plate fidèle au mix original',
    gains: [0, 0, 0, 0, 0],
  },
  {
    id: 'drop-signature',
    name: 'DROP Signature',
    description: 'Sub-basses profondes et attaque cristalline',
    gains: [6, 3, -1, 2.5, 4.5],
  },
  {
    id: 'bass-boost',
    name: 'Bass Boost',
    description: 'Renfort massif à 60Hz et 250Hz',
    gains: [7.5, 4.5, 0, 0, 1],
  },
  {
    id: 'vocal-crystal',
    name: 'Voix & Présence',
    description: 'Clarté vocale mise en avant à 1kHz et 4kHz',
    gains: [-2, 1, 5, 4, 2],
  },
  {
    id: 'warm-analog',
    name: 'Chaleur Analogique',
    description: 'Graves ronds et aigus adoucis',
    gains: [4.5, 3, 1, -1.5, -2.5],
  },
  {
    id: 'treble-air',
    name: 'Haute Définition',
    description: 'Ouverture spatiale et brillance à 12kHz',
    gains: [0, 0, 1.5, 4.5, 6.5],
  },
];

const EQ_BANDS_META = [
  { freq: '60Hz', label: 'Sub-Bass' },
  { freq: '250Hz', label: 'Graves' },
  { freq: '1kHz', label: 'Médiums' },
  { freq: '4kHz', label: 'Présence' },
  { freq: '12kHz', label: 'Air / Aigus' },
];

export interface Immersive3DPlayerProps {
  catalogue: PlayerAlbumNode[];
  albumIdx: number;
  trackIdx: number;
  currentTrack: PlayerTrackItem;
  currentTime: number;
  isPlaying: boolean;
  isDropMode: boolean;
  isShuffle: boolean;
  repeatMode: number; // 0: Off, 1: All, 2: One
  isCurrentLiked: boolean;
  likedTrackIds?: Record<string, boolean>;
  recommendedTrackIds?: Record<string, boolean>;
  subscribedArtists?: Record<string, boolean>;
  artistSubscribers?: Record<string, number>;
  communityRecommendations?: CommunityRecommendationItem[];
  rankInfo?: { rank: number; delta: number };
  currentRankInfo?: { rank: number; delta: number };
  trackRankMap?: Record<string, { rank: number; delta: number }>;
  users?: AnalyticsAppUser[];
  currentUser?: AnalyticsAppUser;
  categories?: string[];
  masterVolume: number;
  eqGains: number[];
  userPlan: 'BASIC' | 'PRO';
  syncSnapshot: SyncStatusSnapshot;
  onToggleUserPlan: () => void;
  onTogglePlay: () => void;
  onForceStopPlay?: () => void;
  onNavigateAlbum: (dir: 1 | -1) => void;
  onSelectAlbumIndex: (
    newAlbumIdx: number,
    newTrackIdx?: number,
    startFullPlay?: boolean
  ) => void;
  onNavigateTrack: (dir: 1 | -1) => void;
  onSelectTrackIndex: (newTrackIdx: number) => void;
  onSeek: (targetSeconds: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleLike: (trackId: string, e?: React.MouseEvent) => void;
  onRecommendTrack?: (
    trackId: string,
    commentOrExcerpt?: string,
    isLyricExcerpt?: boolean
  ) => void;
  onToggleSubscribeArtist?: (artistName: string) => void;
  onRecordLyricsOpen?: (trackId: string) => void;
  onToggleDownload: (trackId: string) => void;
  onChangeMasterVolume: (val: number) => void;
  onChangeEqBand: (bandIdx: number, gainDb: number) => void;
  onApplyEqPreset: (gains: number[]) => void;
  onResetEq: () => void;
  onOpenArtistProfile?: (artistName: string) => void;
  onOpenTrackDetail?: (trackId: string) => void;
  onOpenAdminStudio: () => void;
  onToggleOfflineSim: () => void;
  subscriptionPass?: GabonSubscriptionPass;
  onChangeSubscriptionPass?: (pass: GabonSubscriptionPass) => void;
  networkOperator?: GabonNetworkOperator;
  onChangeNetworkOperator?: (op: GabonNetworkOperator) => void;
  lastEcgValidationMsg?: string;
  onConfirmCreditHandshake?: (
    trackId: string,
    roleKey:
      | 'beatmakerStatus'
      | 'recordingEngineerStatus'
      | 'mixingEngineerStatus'
      | 'masteringEngineerStatus'
      | 'lyricistStatus'
  ) => void;
  onOpenCreditDispute?: (trackId: string, reason: string) => void;
  onResolveCreditDispute?: (trackId: string) => void;
}

interface UserPlaylist {
  id: string;
  name: string;
  count: number;
  added: boolean;
  iconType: 'sparkle' | 'moon' | 'studio' | 'flame';
}

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? '0' : ''}${rem}`;
}

function formatCompactPlays(realPlays: number, preset?: string): string {
  if (preset && realPlays <= 76000) return preset;
  if (realPlays >= 1000000) return `${(realPlays / 1000000).toFixed(2).replace(/\.00$/, '')}M`;
  if (realPlays >= 1000) return `${Math.round(realPlays / 1000)}K`;
  return String(realPlays);
}

function getArtworkDominantColors(artworkType?: ArtworkType): {
  primary: string;
  secondary: string;
} {
  switch (artworkType) {
    case 'crimson_bloom':
      return { primary: '#e11d48', secondary: '#881337' };
    case 'pastel_heart':
      return { primary: '#60a5fa', secondary: '#1e40af' };
    case 'emerald_matrix':
      return { primary: '#10b981', secondary: '#065f46' };
    case 'violet_odyssey':
      return { primary: '#a855f7', secondary: '#581c87' };
    case 'creative_yellow':
    default:
      return { primary: '#eab308', secondary: '#a16207' };
  }
}

function normalizeToAnalyticsTrack(t: PlayerTrackItem): AnalyticsTrackItem {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    featuringArtists: t.featuringArtists,
    featuringSplitMode: t.featuringSplitMode,
    album: t.album,
    category: t.category,
    labelName: t.labelName,
    copyrightText: t.copyrightText,
    beatmakerName: t.beatmakerName || 'Studio DROP',
    soundEngineerName: t.soundEngineerName || 'Mastering DROP',
    recordingEngineerName: t.recordingEngineerName,
    mixingEngineerName: t.mixingEngineerName,
    masteringEngineerName: t.masteringEngineerName,
    lyricistName: t.lyricistName || t.artist,
    isExternalLyricist: t.isExternalLyricist,
    hasSynchronizedLyrics: t.hasSynchronizedLyrics,
    gabonTerritoryPct: t.gabonTerritoryPct ?? 86,
    weeksInTop10: t.weeksInTop10,
    isPreAlbumSingleOver6Months: t.isPreAlbumSingleOver6Months,
    lufsMasterLevel: t.lufsMasterLevel ?? -14.0,
    acousticClippingDetected: t.acousticClippingDetected,
    retention45sPct:
      t.retention45sPct ??
      t.retention30sPct ??
      Math.min(99, (t.avgRetentionPct ?? 90) + 4),
    halfLifeRetentionJ90Pct:
      typeof t.halfLifeRetentionJ90Pct === 'number'
        ? t.halfLifeRetentionJ90Pct
        : undefined,
    creditHandshake: t.creditHandshake,
    cover: t.cover,
    artworkType: t.artworkType,
    ambientPrimary: t.ambientPrimary,
    ambientSecondary: t.ambientSecondary,
    lyrics: t.lyrics,
    duration: t.duration,
    dropStart: t.dropStart,
    dropDuration: t.dropDuration,
    bpm: t.bpm || 120,
    realPlays: t.realPlays,
    displayPlaysFormatted: t.displayPlaysFormatted,
    lastActivityAgo: t.lastActivityAgo,
    totalListenSeconds: t.totalListenSeconds ?? t.realPlays * 3,
    listenSessions: t.listenSessions ?? Math.max(1, Math.round(t.realPlays / 40)),
    avgRetentionPct: t.avgRetentionPct ?? 92,
    retention30sPct:
      t.retention30sPct ?? Math.min(99, (t.avgRetentionPct ?? 90) + 4),
    algoPoints: t.algoPoints ?? 15,
    likesCount: t.likesCount ?? Math.max(10, Math.round(t.realPlays / 10)),
    loopPlaysCount: t.loopPlaysCount ?? Math.max(5, Math.round(t.realPlays / 45)),
    recommendationsCount:
      t.recommendationsCount ?? Math.max(14, Math.round(t.realPlays * 0.018)),
    lyricsOpensCount:
      t.lyricsOpensCount ?? Math.max(25, Math.round(t.realPlays * 0.14)),
    lyricsSharesCount:
      t.lyricsSharesCount ?? Math.max(8, Math.round(t.realPlays * 0.022)),
    longevityDays: t.longevityDays ?? 28,
    consecutiveLoops: t.consecutiveLoops ?? 0,
    baselineRank: t.baselineRank ?? 3,
    artistBaselinePlays: t.artistBaselinePlays,
    downloadedOffline: t.downloadedOffline,
    inPlaylist: t.inPlaylist,
  };
}

function ProLockBadgeSvg() {
  return (
    <span
      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-900/95 border border-white/25 flex items-center justify-center text-amber-400 shadow"
      title="Réservé aux comptes DROP Pro"
    >
      <svg
        className="w-2.5 h-2.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </svg>
    </span>
  );
}

function PlaylistVectorIcon({
  type,
}: {
  type: 'sparkle' | 'moon' | 'studio' | 'flame';
}) {
  if (type === 'sparkle') {
    return (
      <svg
        className="w-4 h-4 text-amber-400 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l1.9 5.8a2 2 0 001.3 1.3L21 12l-5.8 1.9a2 2 0 00-1.3 1.3L12 21l-1.9-5.8a2 2 0 00-1.3-1.3L3 12l5.8-1.9a2 2 0 001.3-1.3L12 3z"
        />
      </svg>
    );
  }
  if (type === 'moon') {
    return (
      <svg
        className="w-4 h-4 text-sky-400 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        />
      </svg>
    );
  }
  if (type === 'studio') {
    return (
      <svg
        className="w-4 h-4 text-emerald-400 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 18v-6a9 9 0 0118 0v6"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="w-4 h-4 text-rose-400 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2c1.5 3.5 4 5.5 4 9a4 4 0 11-8 0c0-2 1-3.5 2-5-.5 2 1 3 2 3s1-2 0-7z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.5 14.5A2.5 2.5 0 0011 17h2a2.5 2.5 0 002.5-2.5"
      />
    </svg>
  );
}

export const Immersive3DPlayer: React.FC<Immersive3DPlayerProps> = ({
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
  onNavigateAlbum,
  onSelectAlbumIndex,
  onNavigateTrack,
  onSelectTrackIndex,
  onSeek,
  onToggleShuffle,
  onCycleRepeat,
  onToggleLike,
  onRecommendTrack,
  onToggleSubscribeArtist,
  onRecordLyricsOpen,
  onToggleDownload,
  onChangeMasterVolume,
  onChangeEqBand,
  onApplyEqPreset,
  onResetEq,
  onOpenAdminStudio,
  subscriptionPass = 'PASS_MENSUEL_HEBDO',
  onChangeSubscriptionPass,
  networkOperator = 'AIRTEL_GABON',
  onChangeNetworkOperator,
  lastEcgValidationMsg,
  onConfirmCreditHandshake,
  onOpenCreditDispute,
  onResolveCreditDispute,
}) => {
  const safeRankInfo = rankInfo || currentRankInfo || { rank: 4, delta: 3 };
  const isPro = userPlan === 'PRO';

  const [fullBleed, setFullBleed] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'PLAYLIST' | 'EQ' | 'QUEUE' | 'OPTIONS' | 'MINI' | 'RECOMMEND'
  >('NONE');
  const [recommendNote, setRecommendNote] = useState<string>('');

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

  // Open Track Detail directly inside User View (never redirects to Admin)
  const openUserTrackSheet = (trackId: string) => {
    if (!isPro) {
      notifyProRequired('Fiche détaillée du titre');
      return;
    }
    setInPlayerEntity(null);
    setInPlayerUserId(null);
    setInPlayerTrackId(trackId);
  };

  // Open Artist or Studio Collaborator Profile directly inside User View (never redirects to Admin)
  const openUserEntitySheet = (
    name: string,
    role: StudioEntityRole = 'ARTIST'
  ) => {
    if (!isPro) {
      notifyProRequired('Profil Artiste & Équipe Studio');
      return;
    }
    setInPlayerTrackId(null);
    setInPlayerUserId(null);
    setInPlayerEntity({ name, role });
  };

  // Open Listener Profile directly inside User View
  const openUserListenerSheet = (userId: string) => {
    if (!isPro) {
      notifyProRequired('Profil Auditeur Pro');
      return;
    }
    setInPlayerTrackId(null);
    setInPlayerEntity(null);
    setInPlayerUserId(userId);
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
    const topListeners = users
      .map((u) => {
        let listenSeconds = 0;
        let playsCount = 0;
        let loopsCount = 0;
        for (const [tId, st] of Object.entries(u.trackStats)) {
          if (trackIdSet.has(tId)) {
            listenSeconds += st.listenSeconds;
            playsCount += st.playsCount;
            loopsCount += st.loopsCount;
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

  // Compute Selected In-Player Listener Profile Sheet Data
  const activeUserSheetData = useMemo(() => {
    if (!inPlayerUserId) return null;
    const foundUser = users.find((u) => u.id === inPlayerUserId);
    if (!foundUser) return null;
    const rank =
      [...users]
        .sort((a, b) => b.totalListenSeconds - a.totalListenSeconds)
        .findIndex((u) => u.id === foundUser.id) + 1;
    return { user: foundUser, rank: Math.max(1, rank) };
  }, [inPlayerUserId, users]);

  // Instant Multi-Criteria Search Results (reacts from the very 1st letter typed)
  // Includes Featuring Artists, Lyricists, Lyrics text, and all Dynamic Genres!
  const instantSearchResults = useMemo(() => {
    const raw = hubSearchQuery.trim().toLowerCase();
    if (!raw) return null;

    const scoreMatch = (text?: string): number => {
      if (!text) return 0;
      const lower = text.toLowerCase();
      if (lower === raw) return 100;
      if (lower.startsWith(raw)) return 82;
      if (lower.includes(raw)) return 52;
      return 0;
    };

    const matchingGenres = availableGenres.filter(
      (g) => scoreMatch(g) > 0
    );

    const matchingTracks = allTracksFlat
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

        const score = Math.max(
          scoreMatch(track.title) * 1.35,
          scoreMatch(track.artist) * 1.2,
          featScore * 1.15,
          scoreMatch(track.lyricistName) * 1.1,
          scoreMatch(track.category) * 1.1,
          scoreMatch(track.album),
          scoreMatch(track.labelName) * 0.9,
          scoreMatch(track.beatmakerName) * 0.9,
          scoreMatch(track.soundEngineerName) * 0.9,
          lyricsTextScore
        );
        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort(
        (a, b) => b.score - a.score || b.track.algoPoints - a.track.algoPoints
      );

    const matchingEntities = decoupledStudioRankings
      .map((ent) => {
        const score = Math.max(
          scoreMatch(ent.name) * 1.25,
          scoreMatch(ent.category) * 0.9
        );
        return { ...ent, score };
      })
      .filter((ent) => ent.score > 0)
      .sort((a, b) => b.score - a.score || b.decoupledScore - a.decoupledScore);

    return {
      genres: matchingGenres,
      tracks: matchingTracks,
      entities: matchingEntities,
      totalCount:
        matchingGenres.length +
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

  // Playlists state
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([
    {
      id: 'pl-1',
      name: 'Favoris Créatifs',
      count: 42,
      added: true,
      iconType: 'sparkle',
    },
    {
      id: 'pl-2',
      name: 'Late Night Drive',
      count: 28,
      added: false,
      iconType: 'moon',
    },
    {
      id: 'pl-3',
      name: 'Design & Focus Studio',
      count: 65,
      added: true,
      iconType: 'studio',
    },
    {
      id: 'pl-4',
      name: 'Workout Boost',
      count: 19,
      added: false,
      iconType: 'flame',
    },
  ]);
  const [newPlaylistInput, setNewPlaylistInput] = useState('');

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

  return (
    <div className="relative h-[100dvh] w-screen bg-[#050507] flex items-center justify-center overflow-hidden">
      {/* Bouton flottant sur Bureau pour basculer entre 9:16 et Plein Écran Intégral */}
      <button
        type="button"
        onClick={() => setFullBleed(!fullBleed)}
        className="hidden sm:flex fixed top-4 right-4 z-50 items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-xs font-medium text-zinc-200 border border-white/15 backdrop-blur-md shadow-xl transition-all"
        title="Basculer l'affichage plein écran"
      >
        <svg
          className="w-4 h-4 text-amber-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
        <span>{fullBleed ? 'Format Mobile 9:16' : 'Étendre Plein Écran'}</span>
      </button>

      {/* CONTENEUR PRINCIPAL DU LECTEUR DROP (100% Adaptatif Mobile 100dvh) */}
      <main id="app-viewport" className={fullBleed ? 'full-bleed' : ''}>
        {/* Fond ambiant dynamique prenant la couleur dominante exacte de la pochette */}
        <div className="ambient-bg" />
        <div className="ambient-vignette" />

        {/* Notification Toast Interactive */}
        <div
          className={`pointer-events-none fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-zinc-900/95 border border-white/20 text-white text-xs font-medium shadow-2xl flex items-center gap-2.5 transition-all duration-300 backdrop-blur-xl whitespace-nowrap ${
            toastMsg ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
          }`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${toastDotColor}`} />
          <span>{toastMsg || 'Action effectuée'}</span>
        </div>

        {/* 1. EN-TÊTE DE NAVIGATION FIXE */}
        <header className="relative z-20 flex items-center justify-between px-6 pt-3 sm:pt-4 pb-0.5 shrink-0">
          {/* Bouton Flèche vers le bas (Ouvre le Hub Central de Découverte, Recherche & Mini-Lecteur) */}
          <button
            type="button"
            onClick={() => setActiveModal('MINI')}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:scale-90 transition"
            aria-label="Ouvrir le Hub Central et la Recherche"
            title="Hub Central, Recherche & Mini-Lecteur"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Logo Officiel DROP Fixe au centre de l'en-tête */}
          <button
            type="button"
            onClick={() => setActiveModal('QUEUE')}
            className="flex items-center justify-center px-3 py-1 rounded-full hover:bg-white/[0.06] transition"
            aria-label="DROP — Ouvrir la file de lecture"
            title="File de lecture DROP"
          >
            <DropOfficialLogo className="h-[14px] sm:h-[15px] w-auto" />
          </button>

          {/* Menu Options, Compte Pro/Basic & Studio Admin (•••) */}
          <button
            type="button"
            onClick={() => setActiveModal('OPTIONS')}
            className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:scale-90 transition"
            aria-label="Options et Paramètres"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </header>

        {/* 2. ZONE CENTRALE : CARROUSEL 3D SUPERPOSÉ OU PANNEAU PAROLES INTERACTIF */}
        <section className="relative z-20 flex-1 min-h-0 flex flex-col justify-center">
          <div
            onPointerDown={handleCarouselPointerDown}
            onPointerMove={handleCarouselPointerMove}
            onPointerUp={handleCarouselPointerUp}
            onPointerCancel={handleCarouselPointerUp}
            onWheel={handleCarouselWheel}
            className="carousel-stage"
          >
            {catalogue.map((alb, idx) => {
              const isActiveCard = idx === albumIdx;
              const displayedTrack = isActiveCard
                ? currentTrack
                : alb.tracks[0];

              const rawOffset = idx - albumIdx + dragOffsetRatio;
              const absOffset = Math.abs(rawOffset);

              const translateX = rawOffset * 108;
              const translateY =
                isActiveCard && dragAxis === 'Y'
                  ? dragDeltaY * 0.42
                  : absOffset * 6;
              const translateZ = -absOffset * 95;
              const rotateY = rawOffset * -22;
              const rotateZ = rawOffset * 2.5;
              const scale = Math.max(0.68, 1 - absOffset * 0.14);

              const blurPx =
                absOffset < 0.05
                  ? 0
                  : Math.min(14, 6.2 + Math.max(0, absOffset - 0.85) * 4.8);
              const brightness =
                absOffset < 0.05
                  ? 1
                  : Math.max(0.22, 0.42 - Math.max(0, absOffset - 1) * 0.16);
              const saturate = absOffset < 0.05 ? 1 : 0.78;
              const opacity =
                absOffset > 2.1
                  ? 0
                  : absOffset < 0.05
                    ? 1
                    : Math.max(0.24, 0.72 - Math.max(0, absOffset - 1) * 0.45);
              const zIndex = Math.round(30 - absOffset * 10);

              return (
                <div
                  key={alb.id}
                  onClick={() => {
                    if (dragMovedRef.current) return;
                    if (!isActiveCard) {
                      onSelectAlbumIndex(idx, 0, false);
                    }
                  }}
                  style={{
                    zIndex,
                    opacity,
                    transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                    filter: `blur(${blurPx.toFixed(2)}px) brightness(${brightness.toFixed(2)}) saturate(${saturate})`,
                    pointerEvents: absOffset > 1.5 ? 'none' : 'auto',
                  }}
                  className={`cover-card ${isDraggingCarousel ? 'dragging' : ''}`}
                >
                  <div className="cover-card-inner">
                    <CoverArtwork
                      artworkType={displayedTrack.artworkType}
                      coverUrl={displayedTrack.cover}
                      title={displayedTrack.title}
                      artist={displayedTrack.artist}
                    />
                    <div className="cover-glare" />

                    {!isActiveCard && (
                      <div className="absolute inset-0 bg-black/38 pointer-events-none transition-opacity duration-300" />
                    )}

                    {isActiveCard && currentAlbum.tracks.length > 1 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5 py-2 px-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15">
                        {currentAlbum.tracks.map((t, tIdx) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTrackIndex(tIdx);
                            }}
                            aria-label={`Piste ${tIdx + 1}: ${t.title}`}
                            className={`w-1.5 rounded-full transition-all ${
                              tIdx === trackIdx
                                ? 'h-4 bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                                : 'h-1.5 bg-white/45 hover:bg-white/80'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panneau Paroles Synchronisées Interactif avec Crédit Parolier & Partage d'Extrait en Direct */}
          {lyricsOpen && isPro && (
            <div className="absolute inset-x-4 sm:inset-x-5 inset-y-1 z-30 rounded-[28px] bg-zinc-950/94 border border-white/15 backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xl transition-all animate-fade-in">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-wide text-amber-300">
                      Paroles Synchronisées
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-violet-500/20 border border-violet-400/35 text-violet-300 text-[10px] font-mono">
                      Score Plume Actif
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLyricsOpen(false);
                      openUserEntitySheet(currentLyricist, 'LYRICIST');
                    }}
                    className="text-[11px] text-zinc-300 hover:text-amber-300 flex items-center gap-1 mt-0.5 truncate transition"
                  >
                    <span className="text-zinc-400">Parolier / Auteur :</span>
                    <span className="font-semibold text-white underline decoration-white/30">
                      {currentLyricist}
                    </span>
                    <span>→</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setLyricsOpen(false)}
                  className="text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 shrink-0"
                >
                  Fermer
                </button>
              </div>

              <div className="lyrics-scroll flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
                {trackLyrics.map((line, i) => {
                  const cleanLine = line.text.replace(/^🔥\s*/, '');
                  const isActiveLine = i === activeLyricIdx;
                  return (
                    <div
                      key={i}
                      className={`group flex items-center justify-between gap-2 p-2 rounded-xl transition ${
                        isActiveLine
                          ? 'bg-white/[0.08] border border-amber-400/35'
                          : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <p
                        onClick={() => onSeek(line.time)}
                        className={`lyrics-line flex-1 text-sm sm:text-base font-bold leading-snug cursor-pointer ${
                          isActiveLine ? 'active-lyric text-white' : 'text-zinc-300'
                        }`}
                      >
                        {cleanLine}
                      </p>

                      {/* Bouton Partager l'extrait de paroles vers le Fil Commun DROP (Valorise le Parolier en direct) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecommendTrack?.(
                            currentTrack.id,
                            `« ${cleanLine.replace('[DROP] ', '')} »`,
                            true
                          );
                          showToast(
                            `Extrait partagé dans le Fil DROP (+Score Parolier : ${currentLyricist})`,
                            'bg-violet-400'
                          );
                        }}
                        className="px-2 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/35 border border-violet-400/40 text-violet-200 text-[10px] font-mono font-bold shrink-0 transition"
                        title="Partager cet extrait dans le fil commun DROP et valoriser le parolier"
                      >
                        Extrait ↗
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
                <span>
                  Touchez une phrase pour synchroniser ou « Extrait ↗ » pour
                  partager
                </span>
                <span className="font-mono text-zinc-300">
                  {formatTime(currentTime)}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* 3. MÉTADONNÉES, CRÉDITS FEATURING, ABONNEMENT ARTISTE, LIKE + RECOMMANDER & BARRE DE PROGRESSION */}
        <section className="relative z-20 px-6 pt-0.5 pb-1.5 sm:pb-2 shrink-0">
          {/* Titre, Artiste (+ Featurings + S'abonner) & Boutons Like + Recommander */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1
                  onClick={() => openUserTrackSheet(currentTrack.id)}
                  title={
                    isPro
                      ? 'Ouvrir la fiche analytique du titre (sans quitter le lecteur)'
                      : 'Fiche détaillée réservée aux comptes DROP Pro'
                  }
                  className={`text-[21px] sm:text-[25px] leading-tight font-bold text-white tracking-tight truncate transition-colors ${
                    isPro
                      ? 'cursor-pointer hover:text-amber-200'
                      : 'cursor-default opacity-90'
                  }`}
                >
                  {currentTrack.title}
                </h1>
                <CertificationBadgeSvg cert={currentTrackCert} compact />
              </div>

              {/* Ligne Artiste Principal + Featuring + Bouton S'abonner (Fans) */}
              <div className="flex items-center gap-1.5 mt-0.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() =>
                    openUserEntitySheet(currentTrack.artist, 'ARTIST')
                  }
                  title={
                    isPro
                      ? 'Ouvrir le profil analytique artiste'
                      : 'Profil artiste réservé aux comptes DROP Pro'
                  }
                  className={`text-[14px] sm:text-[16px] leading-snug font-semibold text-zinc-200 truncate shrink-0 transition-colors ${
                    isPro
                      ? 'cursor-pointer hover:text-amber-300'
                      : 'cursor-default opacity-80'
                  }`}
                >
                  {currentTrack.artist}
                </button>

                {currentTrack.featuringArtists &&
                  currentTrack.featuringArtists.length > 0 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-zinc-400 font-mono">
                        feat.
                      </span>
                      {currentTrack.featuringArtists.map((feat) => (
                        <button
                          key={feat}
                          type="button"
                          onClick={() => openUserEntitySheet(feat, 'ARTIST')}
                          className="px-1.5 py-0.5 rounded-md bg-white/[0.08] hover:bg-amber-400/20 text-xs font-semibold text-amber-200 border border-white/10 shrink-0 transition"
                        >
                          {feat}
                        </button>
                      ))}
                    </div>
                  )}

                {/* Bouton S'abonner à l'Artiste (Fans) */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleSubscribeArtist?.(currentTrack.artist);
                    showToast(
                      !currentArtistSubscribed
                        ? `Abonné à ${currentTrack.artist} (+1 Fan au classement)`
                        : `Désabonné de ${currentTrack.artist}`,
                      !currentArtistSubscribed ? 'bg-emerald-400' : 'bg-zinc-400'
                    );
                  }}
                  className={`ml-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border shrink-0 transition flex items-center gap-1 ${
                    currentArtistSubscribed
                      ? 'bg-emerald-500/20 border-emerald-500/45 text-emerald-300'
                      : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                  }`}
                  title="S’abonner à l’artiste pour soutenir sa communauté dans le classement"
                >
                  <span>
                    {currentArtistSubscribed ? 'Abonné ✓' : '+ S’abonner'}
                  </span>
                  <span className="font-mono text-[10px] opacity-85">
                    {formatCompactPlays(currentArtistSubscribersCount)}
                  </span>
                </button>
              </div>
            </div>

            {/* Groupe Actions Sociales : Bouton Recommander (Partage Communautaire) + Bouton Like (Coeur) */}
            <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
              {/* Bouton Recommander (placé juste à côté du Like) */}
              <button
                type="button"
                onClick={() => setActiveModal('RECOMMEND')}
                className={`h-10 px-2.5 sm:px-3 rounded-full border flex items-center gap-1.5 active:scale-90 transition ${
                  isCurrentRecommended
                    ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.28)]'
                    : 'bg-white/[0.07] hover:bg-white/[0.14] border-white/15 text-zinc-200'
                }`}
                aria-label="Recommander ce titre à d'autres utilisateurs DROP"
                title="Recommander ce titre dans le fil commun DROP"
              >
                <svg
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
                  />
                </svg>
                <span className="text-xs font-mono font-bold">
                  {formatCompactPlays(currentRecsCount)}
                </span>
              </button>

              {/* Bouton Favori (Coeur Rouge Vectoriel) */}
              <button
                type="button"
                onClick={(e) => {
                  setHeartAnimKey((prev) => prev + 1);
                  onToggleLike(currentTrack.id, e);
                  showToast(
                    !isCurrentLiked
                      ? 'Ajouté aux titres aimés'
                      : 'Retiré des titres aimés',
                    !isCurrentLiked ? 'bg-rose-500' : 'bg-zinc-400'
                  );
                }}
                className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center active:scale-90 transition relative shrink-0"
                aria-label="Ajouter aux favoris"
              >
                <svg
                  key={heartAnimKey}
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                    heartAnimKey > 0 ? 'heart-animate' : ''
                  } ${
                    isCurrentLiked
                      ? 'text-[#ef233c] drop-shadow-[0_0_12px_rgba(239,35,60,0.45)]'
                      : 'text-zinc-300'
                  }`}
                  fill={isCurrentLiked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.9"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Ligne Analytique & Classement (#4 ▲+3 | Plume | ▶ 76K • il y a 5 min) */}
          <div className="flex items-center justify-between mt-1.5 sm:mt-2 text-[12px] sm:text-[13px] tabular-nums gap-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="font-bold text-white tracking-tight inline-flex items-center gap-1 shrink-0">
                <span>#{safeRankInfo.rank}</span>
                <RankMedalSvg
                  rank={safeRankInfo.rank}
                  className="w-3.5 h-3.5"
                />
              </span>
              {safeRankInfo.delta !== 0 && (
                <span
                  className={`font-semibold flex items-center gap-1 shrink-0 ${
                    safeRankInfo.delta > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                  }`}
                >
                  {safeRankInfo.delta > 0 ? (
                    <svg
                      className="w-2.5 h-2.5 fill-current"
                      viewBox="0 0 12 12"
                    >
                      <path d="M6 2L11 10H1L6 2Z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-2.5 h-2.5 fill-current"
                      viewBox="0 0 12 12"
                    >
                      <path d="M6 10L1 2H11L6 10Z" />
                    </svg>
                  )}
                  <span>
                    {safeRankInfo.delta > 0
                      ? `+${safeRankInfo.delta}`
                      : `${safeRankInfo.delta}`}
                  </span>
                </span>
              )}

              <button
                type="button"
                onClick={() => openUserEntitySheet(currentLyricist, 'LYRICIST')}
                className="px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 text-[10px] font-mono shrink-0 transition"
                title="Voir le profil du Parolier / Auteur des paroles"
              >
                Plume : {currentLyricist}
              </button>

              {isDropMode && (
                <button
                  type="button"
                  onClick={() => onSeek(0)}
                  className="px-2 py-0.5 rounded-full bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 text-[10px] font-semibold shrink-0 transition"
                  title="Quitter la boucle Drop et écouter depuis 0:00"
                >
                  Drop • Écouter dès 0:00
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-zinc-300/90 shrink-0">
              <svg
                className="w-3.5 h-3.5 text-white fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="font-bold text-white">
                {formatCompactPlays(
                  currentTrack.realPlays,
                  currentTrack.displayPlaysFormatted
                )}
              </span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-300/80">
                {currentTrack.lastActivityAgo}
              </span>
            </div>
          </div>

          {/* Barre de Progression Interactive avec Segment Drop Ambre Lumineux */}
          <div className="mt-2 sm:mt-2.5">
            <div
              ref={scrubberRef}
              onPointerDown={handleScrubberPointerDown}
              onPointerMove={handleScrubberPointerMove}
              onPointerUp={handleScrubberPointerUp}
              onPointerCancel={handleScrubberPointerUp}
              className={`scrubber-container ${isScrubbing ? 'dragging' : ''}`}
              role="slider"
              aria-label="Progression du titre et zone de Drop"
            >
              <div className="scrubber-track">
                <div
                  style={{
                    left: `${dropStartPct}%`,
                    width: `${dropWidthPct}%`,
                  }}
                  className={`absolute -top-[1.5px] -bottom-[1.5px] rounded-full transition-all pointer-events-none ${
                    isDropMode
                      ? 'bg-amber-400/60 ring-1 ring-amber-300/90 shadow-[0_0_16px_rgba(251,191,36,0.85)]'
                      : 'bg-amber-400/35 border-x border-amber-300/70'
                  }`}
                />

                <div
                  className="scrubber-fill"
                  style={{ width: `${progressPct}%` }}
                >
                  <div className="scrubber-thumb" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[12px] font-medium text-zinc-300/80 mt-0.5 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(currentTrack.duration)}</span>
            </div>
          </div>
        </section>

        {/* 4. DOCK DE CONTRÔLE GLASSMORPHIQUE ACCENTUÉ */}
        <section className="relative z-20 px-5 sm:px-6 pb-1.5 shrink-0">
          <div className="glass-dock px-4 py-3.5 sm:px-5 sm:py-4.5">
            {/* Rangée 1 : Contrôles de flux principaux */}
            <div className="relative z-10 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => {
                  onToggleShuffle();
                  showToast(
                    !isShuffle
                      ? 'Lecture aléatoire activée'
                      : 'Lecture aléatoire désactivée'
                  );
                }}
                className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center hover:text-white active:scale-90 transition ${
                  isShuffle ? 'text-amber-400' : 'text-white/90'
                }`}
                aria-label="Lecture aléatoire"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
                  />
                </svg>
                {isShuffle && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigateTrack(-1)}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white hover:text-amber-200 active:scale-90 transition"
                aria-label="Titre précédent"
              >
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={onTogglePlay}
                className="play-btn-main"
                aria-label={isPlaying ? 'Mettre en pause' : 'Lancer la lecture'}
                title={isPlaying ? 'Mettre en pause' : 'Reprendre la lecture'}
              >
                {isPlaying ? (
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-current ml-1"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigateTrack(1)}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white hover:text-amber-200 active:scale-90 transition"
                aria-label="Titre suivant"
              >
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextMode = (repeatMode + 1) % 3;
                  onCycleRepeat();
                  if (nextMode === 0) showToast('Répétition désactivée');
                  else if (nextMode === 1)
                    showToast('Répéter toute la sélection');
                  else showToast('Répéter ce titre en boucle');
                }}
                className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center hover:text-white active:scale-90 transition ${
                  repeatMode > 0 ? 'text-amber-400' : 'text-white/90'
                }`}
                aria-label="Mode répétition"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 1l4 4-4 4"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 13v2a4 4 0 01-4 4H3"
                  />
                </svg>
                {repeatMode === 2 && (
                  <span className="flex absolute -top-0.5 right-1 text-[9px] font-extrabold bg-amber-400 text-black rounded-full w-3.5 h-3.5 items-center justify-center">
                    1
                  </span>
                )}
                {repeatMode > 0 && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                )}
              </button>
            </div>

            {/* Rangée 2 : 4 Boutons Utilitaires 100% Fonctionnels */}
            <div className="relative z-10 flex items-center justify-between px-2.5 sm:px-3 mt-3.5 sm:mt-4">
              {/* 1. Ajouter à une sélection / Playlist */}
              <button
                type="button"
                onClick={() => setActiveModal('PLAYLIST')}
                className="utility-pill"
                aria-label="Ajouter à une sélection"
                title="Ajouter à une sélection"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h12M4 10h12M4 14h8M17 14v6M14 17h6"
                  />
                </svg>
              </button>

              {/* 2. Paroles Synchronisées & Score Parolier en Direct */}
              <button
                type="button"
                onClick={() => {
                  if (!isPro) {
                    notifyProRequired('Paroles synchronisées');
                    return;
                  }
                  const nextOpen = !lyricsOpen;
                  setLyricsOpen(nextOpen);
                  if (nextOpen) {
                    onRecordLyricsOpen?.(currentTrack.id);
                  }
                }}
                className={`utility-pill ${
                  !isPro
                    ? 'opacity-40 grayscale cursor-not-allowed'
                    : lyricsOpen
                      ? 'active-pill'
                      : ''
                }`}
                aria-label="Paroles synchronisées"
                title={
                  isPro
                    ? 'Paroles synchronisées & Partage d’extrait'
                    : 'Paroles synchronisées (Réservé DROP Pro)'
                }
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10zM8 9h8M8 13h5"
                  />
                </svg>
                {!isPro && <ProLockBadgeSvg />}
              </button>

              {/* 3. Égaliseur 5 Bandes & Préréglages Audio */}
              <button
                type="button"
                onClick={() => {
                  if (!isPro) {
                    notifyProRequired('Égaliseur 5 bandes & Préréglages');
                    return;
                  }
                  setActiveModal('EQ');
                }}
                className={`utility-pill ${
                  !isPro
                    ? 'opacity-40 grayscale cursor-not-allowed'
                    : isEqCustomOrActive
                      ? 'active-pill'
                      : ''
                }`}
                aria-label="Égaliseur 5 bandes et Préréglages"
                title={
                  isPro
                    ? 'Égaliseur 5 bandes & Préréglages'
                    : 'Égaliseur 5 bandes (Réservé DROP Pro)'
                }
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <line x1="4" y1="21" x2="4" y2="14" strokeLinecap="round" />
                  <line x1="4" y1="10" x2="4" y2="3" strokeLinecap="round" />
                  <line x1="12" y1="21" x2="12" y2="12" strokeLinecap="round" />
                  <line x1="12" y1="8" x2="12" y2="3" strokeLinecap="round" />
                  <line x1="20" y1="21" x2="20" y2="16" strokeLinecap="round" />
                  <line x1="20" y1="12" x2="20" y2="3" strokeLinecap="round" />
                  <circle cx="4" cy="12" r="2" />
                  <circle cx="12" cy="10" r="2" />
                  <circle cx="20" cy="14" r="2" />
                </svg>
                {!isPro && <ProLockBadgeSvg />}
              </button>

              {/* 4. Téléchargement Hors-Ligne */}
              <button
                type="button"
                onClick={() => {
                  if (!isPro) {
                    notifyProRequired('Téléchargement hors-ligne');
                    return;
                  }
                  onToggleDownload(currentTrack.id);
                  showToast(
                    !currentTrack.downloadedOffline
                      ? 'Enregistré pour écoute hors-ligne'
                      : 'Retiré des téléchargements hors-ligne',
                    !currentTrack.downloadedOffline
                      ? 'bg-emerald-400'
                      : 'bg-zinc-400'
                  );
                }}
                className={`utility-pill relative ${
                  !isPro
                    ? 'opacity-40 grayscale cursor-not-allowed'
                    : currentTrack.downloadedOffline
                      ? 'active-pill'
                      : ''
                }`}
                aria-label="Télécharger pour écoute hors-ligne"
                title={
                  isPro
                    ? 'Écoute hors-ligne'
                    : 'Écoute hors-ligne (Réservé DROP Pro)'
                }
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v11m0 0l-4-4m4 4l4-4"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                  />
                </svg>
                {!isPro ? (
                  <ProLockBadgeSvg />
                ) : (
                  currentTrack.downloadedOffline && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                  )
                )}
              </button>
            </div>
          </div>
        </section>

        {/* 5. PIED DE PAGE */}
        <footer className="relative z-20 pb-2.5 sm:pb-3.5 pt-0.5 text-center shrink-0">
          <p className="text-[11px] sm:text-[11.5px] text-zinc-400/75 tracking-tight">
            {currentTrack.copyrightText ||
              `Copyright 2028 ${currentTrack.labelName}. All rights reserved`}
          </p>
        </footer>

        {/* =================================================================== */}
        {/* MODALE RECOMMANDER AU FIL COMMUN DROP (Placé à côté du Like)        */}
        {/* =================================================================== */}
        {activeModal === 'RECOMMEND' && (
          <div
            onClick={() => setActiveModal('NONE')}
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col justify-end p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-zinc-900/95 border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">
                    Recommander à la communauté DROP
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Propulsez « {currentTrack.title} » dans le Fil Commun et
                    boostez son score d&apos;explosion
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  <CoverArtwork
                    artworkType={currentTrack.artworkType}
                    coverUrl={currentTrack.cover}
                    title={currentTrack.title}
                    artist={currentTrack.artist}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">
                    {currentTrack.title}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {currentTrack.artist} • {currentRecsCount} recommandations
                  </p>
                </div>
                <CertificationBadgeSvg cert={currentTrackCert} compact />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Message ou pourquoi écouter ce titre (optionnel)
                </label>
                <input
                  type="text"
                  value={recommendNote}
                  onChange={(e) => setRecommendNote(e.target.value)}
                  placeholder="Ex: Le drop à 1:16 et le mix sont incroyables..."
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onRecommendTrack?.(
                      currentTrack.id,
                      recommendNote.trim() ||
                        'Recommande fortement ce titre à la communauté DROP !',
                      false
                    );
                    setRecommendNote('');
                    setActiveModal('MINI');
                    setHubTab('RECOS');
                    showToast(
                      'Recommandation publiée dans le Fil Commun DROP !',
                      'bg-amber-400'
                    );
                  }}
                  className="py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition shadow-[0_0_16px_rgba(251,191,36,0.35)]"
                >
                  Publier dans le Fil DROP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('MINI');
                    setHubTab('RECOS');
                  }}
                  className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition"
                >
                  Voir le Fil Commun ({communityRecommendations.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 1. Modale : Ajouter à une sélection */}
        {activeModal === 'PLAYLIST' && (
          <div
            onClick={() => setActiveModal('NONE')}
            className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex flex-col justify-end p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-zinc-900/95 border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">
                  Ajouter à une sélection
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {playlists.map((pl, idx) => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => {
                      setPlaylists((prev) =>
                        prev.map((item, i) =>
                          i === idx
                            ? {
                                ...item,
                                added: !item.added,
                                count: item.added
                                  ? item.count - 1
                                  : item.count + 1,
                              }
                            : item
                        )
                      );
                      showToast(
                        !pl.added
                          ? `Ajouté à "${pl.name}"`
                          : `Retiré de "${pl.name}"`
                      );
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                        <PlaylistVectorIcon type={pl.iconType} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {pl.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {pl.count} titres
                        </p>
                      </div>
                    </div>
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        pl.added
                          ? 'bg-amber-400 text-black'
                          : 'border border-white/30 text-white'
                      }`}
                    >
                      {pl.added ? '✓' : '+'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-1">
                {isPro ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPlaylistInput}
                      onChange={(e) => setNewPlaylistInput(e.target.value)}
                      placeholder="Nouvelle sélection..."
                      className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = newPlaylistInput.trim();
                        if (!val) return;
                        setPlaylists((prev) => [
                          ...prev,
                          {
                            id: `pl-${Date.now()}`,
                            name: val,
                            count: 1,
                            added: true,
                            iconType: 'sparkle',
                          },
                        ]);
                        setNewPlaylistInput('');
                        showToast(`Sélection "${val}" créée et titre ajouté`);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition"
                    >
                      Créer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      notifyProRequired('Création de sélections illimitées')
                    }
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 opacity-50 cursor-not-allowed text-xs"
                  >
                    <span>Créer une nouvelle sélection personnalisée</span>
                    <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-semibold">
                      PRO
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Modale : Égaliseur 5 Bandes Haute Précision */}
        {activeModal === 'EQ' && isPro && (
          <div
            onClick={() => setActiveModal('NONE')}
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col justify-end p-3.5 sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-zinc-900/95 border border-white/15 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xl max-h-[90dvh] overflow-y-auto animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">
                    Égaliseur 5 Bandes &amp; Gain
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Traitement fréquentiel temps réel au demi-décibel (0.5 dB)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetEq();
                      showToast('Égaliseur remis à plat (0 dB)');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-amber-300 transition"
                  >
                    Plat (0 dB)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal('NONE')}
                    className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center"
                    aria-label="Fermer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-emerald-300 block">
                    Normalisation Automatique -14,0 LUFS Active
                  </span>
                  <span className="text-[10px] font-mono text-zinc-300 block truncate">
                    Volume uniforme garanti sur toutes les chansons (Compensateur RMS + Limiteur Broadcast)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-mono text-[10px] font-bold shrink-0">
                  -14.0 LUFS Constant
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-zinc-400 block">
                  Préréglages Audio
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {EQ_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          onApplyEqPreset(preset.gains);
                          showToast(`Préréglage : ${preset.name}`);
                        }}
                        className={`px-2.5 py-2 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                            : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 font-medium'
                        }`}
                      >
                        <span className="text-xs block truncate">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/55 border border-white/10 space-y-3">
                <div className="relative h-20 w-full">
                  <svg
                    viewBox="0 0 280 88"
                    className="w-full h-full overflow-visible"
                  >
                    <line
                      x1="12"
                      y1="44"
                      x2="268"
                      y2="44"
                      stroke="rgba(255,255,255,0.14)"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <polyline
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={eqCurvePoints}
                    />
                    {eqGains.map((gain, i) => {
                      const cx = 24 + i * 58;
                      const cy = 44 - (gain / 12) * 32;
                      const isBandActive = selectedBandIdx === i;
                      return (
                        <g
                          key={EQ_BANDS_META[i].freq}
                          onClick={() => setSelectedBandIdx(i)}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isBandActive ? 8 : 5.5}
                            fill={isBandActive ? '#fbbf24' : '#18181b'}
                            stroke="#ffffff"
                            strokeWidth={isBandActive ? 2.5 : 1.8}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {EQ_BANDS_META.map((band, idx) => {
                    const gain = eqGains[idx] ?? 0;
                    const isSelected = selectedBandIdx === idx;
                    return (
                      <button
                        key={band.freq}
                        type="button"
                        onClick={() => setSelectedBandIdx(idx)}
                        className={`min-h-[54px] py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition ${
                          isSelected
                            ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-[0_0_16px_rgba(251,191,36,0.4)]'
                            : 'bg-white/[0.06] text-white border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-[11px] font-bold">
                          {band.freq}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            isSelected
                              ? 'text-black/85 font-extrabold'
                              : 'text-amber-300'
                          }`}
                        >
                          {gain > 0 ? `+${gain}` : gain}dB
                        </span>
                      </button>
                    );
                  })}
                </div>

                {(() => {
                  const activeBand = EQ_BANDS_META[selectedBandIdx];
                  const activeGain = eqGains[selectedBandIdx] ?? 0;
                  return (
                    <div className="pt-2 border-t border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">
                          Bande active :{' '}
                          <span className="text-amber-400">
                            {activeBand.freq} ({activeBand.label})
                          </span>
                        </span>
                        <span className="font-mono text-sm font-extrabold text-amber-400">
                          {activeGain > 0 ? `+${activeGain}` : activeGain} dB
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => stepSelectedBandGain(-0.5)}
                          className="min-w-[64px] min-h-[46px] px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-white font-mono text-xs font-bold flex items-center justify-center transition"
                        >
                          -0.5 dB
                        </button>

                        <input
                          type="range"
                          min={-12}
                          max={12}
                          step={0.5}
                          value={activeGain}
                          onInput={(e) =>
                            onChangeEqBand(
                              selectedBandIdx,
                              parseFloat(e.currentTarget.value)
                            )
                          }
                          onChange={(e) =>
                            onChangeEqBand(
                              selectedBandIdx,
                              parseFloat(e.target.value)
                            )
                          }
                          className="flex-1 fat-slider cursor-pointer"
                          aria-label={`Gain ${activeBand.freq}`}
                        />

                        <button
                          type="button"
                          onClick={() => stepSelectedBandGain(0.5)}
                          className="min-w-[64px] min-h-[46px] px-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 active:scale-95 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold flex items-center justify-center transition"
                        >
                          +0.5 dB
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-200 font-semibold">
                    Volume Master Temps Réel
                  </span>
                  <span className="font-mono text-amber-400 font-bold">
                    {Math.round(masterVolume)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={masterVolume}
                  onInput={handleVolumeInput}
                  onChange={handleVolumeInput}
                  className="w-full fat-slider cursor-pointer"
                  aria-label="Volume Master"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Modale : File d'attente / Catalogue DROP */}
        {activeModal === 'QUEUE' && (
          <div
            onClick={() => setActiveModal('NONE')}
            className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex flex-col justify-end p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-zinc-900/95 border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <DropOfficialLogo className="h-3.5 w-auto" />
                  <span className="text-xs text-zinc-400 font-medium">
                    • File de lecture
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {catalogue.map((alb, aIdx) =>
                  alb.tracks.map((t, tIdx) => {
                    const isCurrent = aIdx === albumIdx && tIdx === trackIdx;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          handlePlayOrToggleSpecificTrack(aIdx, tIdx);
                          setActiveModal('NONE');
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border transition text-left ${
                          isCurrent
                            ? 'bg-white/15 border-amber-400/50'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                          <CoverArtwork
                            artworkType={t.artworkType}
                            coverUrl={t.cover}
                            title={t.title}
                            artist={t.artist}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {t.title}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">
                            {t.artist}
                            {t.featuringArtists && t.featuringArtists.length > 0
                              ? ` feat. ${t.featuringArtists.join(', ')}`
                              : ''}{' '}
                            •{' '}
                            {formatCompactPlays(
                              t.realPlays,
                              t.displayPlaysFormatted
                            )}{' '}
                            écoutes
                          </p>
                        </div>
                        <span className="text-xs font-medium text-amber-400">
                          {isCurrent
                            ? isPlaying
                              ? 'En écoute'
                              : 'En pause'
                            : formatTime(t.duration)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. Modale : Options Audio Temps Réel, Forfait Basic/Pro & Accès Studio Admin */}
        {activeModal === 'OPTIONS' && (
          <div
            onClick={() => setActiveModal('NONE')}
            className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex flex-col justify-end p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-zinc-900/95 border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl max-h-[88dvh] overflow-y-auto animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">
                  Contrôles Audio &amp; Compte
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Niveau de Compte DROP
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {isPro
                      ? 'DROP Pro actif (Toutes les données analytiques débloquées)'
                      : 'Compte Basic (Fonctions Pro grisées)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onToggleUserPlan();
                    showToast(
                      !isPro
                        ? 'Compte passé en DROP Pro'
                        : 'Compte passé en DROP Basic',
                      !isPro ? 'bg-amber-400' : 'bg-zinc-400'
                    );
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                    isPro
                      ? 'bg-amber-400 text-black shadow-[0_0_16px_rgba(251,191,36,0.35)]'
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                  }`}
                >
                  {isPro ? 'PRO Actif' : 'Passer en PRO'}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-semibold">
                    Volume Master Temps Réel
                  </span>
                  <span className="font-mono text-amber-400 font-bold">
                    {Math.round(masterVolume)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={masterVolume}
                  onInput={handleVolumeInput}
                  onChange={handleVolumeInput}
                  className="w-full fat-slider cursor-pointer"
                  aria-label="Volume Master"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isPro) {
                      notifyProRequired('Fiche détaillée du titre');
                      return;
                    }
                    setActiveModal('NONE');
                    openUserTrackSheet(currentTrack.id);
                  }}
                  className={`relative p-3 rounded-2xl border text-xs font-semibold text-center transition ${
                    isPro
                      ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
                      : 'bg-white/5 border-white/10 text-zinc-400 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span>Fiche Titre</span>
                  {!isPro && <ProLockBadgeSvg />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isPro) {
                      notifyProRequired('Profil Artiste');
                      return;
                    }
                    setActiveModal('NONE');
                    openUserEntitySheet(currentTrack.artist, 'ARTIST');
                  }}
                  className={`relative p-3 rounded-2xl border text-xs font-semibold text-center transition ${
                    isPro
                      ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
                      : 'bg-white/5 border-white/10 text-zinc-400 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span>Profil Artiste</span>
                  {!isPro && <ProLockBadgeSvg />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isPro) {
                      notifyProRequired('Profil Parolier');
                      return;
                    }
                    setActiveModal('NONE');
                    openUserEntitySheet(currentLyricist, 'LYRICIST');
                  }}
                  className={`relative p-3 rounded-2xl border text-xs font-semibold text-center transition ${
                    isPro
                      ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
                      : 'bg-white/5 border-white/10 text-zinc-400 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span>Parolier</span>
                  {!isPro && <ProLockBadgeSvg />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveModal('NONE');
                  onOpenAdminStudio();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 font-semibold text-sm transition"
              >
                <span>Studio Admin (Catalogue, Featuring, Paroliers &amp; DRM)</span>
                <span className="text-xs">Ouvrir →</span>
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 5. HUB CENTRAL DE DÉCOUVERTE, ONGLETS GLISSANTS & RECHERCHE BASSE   */}
        {/* =================================================================== */}
        {activeModal === 'MINI' && (
          <div className="absolute inset-0 z-40 bg-zinc-950/96 backdrop-blur-2xl flex flex-col justify-between p-3.5 sm:p-5 animate-fade-in overflow-hidden">
            {/* En-tête du Hub Central */}
            <div className="flex items-center justify-between gap-2 shrink-0 pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <DropOfficialLogo className="h-3.5 w-auto shrink-0" />
                <span className="text-xs font-bold text-white truncate">
                  Hub Central DROP
                </span>
                <button
                  type="button"
                  onClick={onToggleUserPlan}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition shrink-0 ${
                    isPro
                      ? 'bg-amber-400 text-black'
                      : 'bg-white/10 text-zinc-300 border border-white/15'
                  }`}
                >
                  {isPro ? 'PRO' : 'BASIC'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  closeAllAnalyticsSheets();
                  setActiveModal('NONE');
                }}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition shrink-0"
              >
                <span>Lecteur 3D</span>
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
            </div>

            {/* BARRE D'ONGLETS GLISSANTS (SLIDING TABS — ZÉRO COUPURE DE TEXTE) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white/[0.04] p-1.5 rounded-2xl border border-white/10 my-2.5 shrink-0">
              {(
                [
                  { id: 'EXPLORER', label: 'Explorer Genres & Projets' },
                  { id: 'RANGS', label: 'Top Rangs (Anti-Halo)' },
                  { id: 'AWARDS', label: 'DROP Awards & Certifications' },
                  {
                    id: 'RECOS',
                    label: `Fil Commun Recos (${communityRecommendations.length})`,
                  },
                  { id: 'ARTISTES', label: 'Artistes & Métiers Studio' },
                  { id: 'PROFIL', label: 'Mon Profil Pro' },
                ] as const
              ).map((tab) => {
                const isTabActive =
                  hubTab === tab.id &&
                  !instantSearchResults &&
                  !hasOpenAnalyticsSheet;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      closeAllAnalyticsSheets();
                      setHubSearchQuery('');
                      setHubTab(tab.id);
                    }}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition ${
                      isTabActive
                        ? 'bg-[#e11d38] text-white shadow-[0_4px_12px_rgba(225,29,56,0.4)]'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Zone Centrale Dynamique */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 flex flex-col gap-3">
              {/* CAS A : Une Fiche Analytique Réutilisable est ouverte directement dans l'interface utilisateur */}
              {activeTrackSheetData ? (
                <ReusableTrackDetailSheet
                  track={activeTrackSheetData.track}
                  album={activeTrackSheetData.album}
                  albumIndex={activeTrackSheetData.albumIndex}
                  trackIndex={activeTrackSheetData.trackIndex}
                  rankInfo={activeTrackSheetData.rankInfo}
                  isCurrentTrack={
                    activeTrackSheetData.track.id === currentTrack.id
                  }
                  isPlaying={isPlaying}
                  isLiked={!!likedTrackIds[activeTrackSheetData.track.id]}
                  isRecommended={
                    !!recommendedTrackIds[activeTrackSheetData.track.id]
                  }
                  isArtistSubscribed={
                    !!subscribedArtists[activeTrackSheetData.track.artist] ||
                    !!subscribedArtists[
                      activeTrackSheetData.track.artist.toLowerCase()
                    ]
                  }
                  artistSubscribersCount={
                    artistSubscribers[activeTrackSheetData.track.artist] ??
                    artistSubscribers[
                      activeTrackSheetData.track.artist.toLowerCase()
                    ]
                  }
                  isAdminView={false}
                  onClose={closeAllAnalyticsSheets}
                  onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                  onToggleLike={onToggleLike}
                  onRecommendTrack={(tId) => {
                    onRecommendTrack?.(
                      tId,
                      'Recommandé depuis la fiche analytique du titre',
                      false
                    );
                    showToast('Titre recommandé dans le Fil Commun DROP !');
                  }}
                  onToggleSubscribeArtist={(artName) => {
                    onToggleSubscribeArtist?.(artName);
                  }}
                  onOpenEntityProfile={(name, role) =>
                    openUserEntitySheet(name, role)
                  }
                  onConfirmCreditHandshake={onConfirmCreditHandshake}
                  onOpenCreditDispute={onOpenCreditDispute}
                  onResolveCreditDispute={onResolveCreditDispute}
                />
              ) : activeEntitySheetData ? (
                <ReusableArtistDetailSheet
                  analytics={activeEntitySheetData}
                  trackRankMap={trackRankMap}
                  currentTrackId={currentTrack.id}
                  isPlaying={isPlaying}
                  onClose={closeAllAnalyticsSheets}
                  onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
                  onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                  onOpenEntityProfile={(name, role) =>
                    openUserEntitySheet(name, role)
                  }
                  onOpenUserProfile={(uId) => openUserListenerSheet(uId)}
                  onToggleSubscribeArtist={(artName) =>
                    onToggleSubscribeArtist?.(artName)
                  }
                />
              ) : activeUserSheetData ? (
                <ReusableUserProfileSheet
                  user={activeUserSheetData.user}
                  userRank={activeUserSheetData.rank}
                  isOwnProfile={currentUser?.id === activeUserSheetData.user.id}
                  userPlan={userPlan}
                  onToggleUserPlan={onToggleUserPlan}
                  subscriptionPass={subscriptionPass}
                  onChangeSubscriptionPass={onChangeSubscriptionPass}
                  networkOperator={networkOperator}
                  onChangeNetworkOperator={onChangeNetworkOperator}
                  lastEcgValidationMsg={lastEcgValidationMsg}
                  allTracksFlat={allTracksFlat}
                  trackRankMap={trackRankMap}
                  currentTrackId={currentTrack.id}
                  isPlaying={isPlaying}
                  onClose={closeAllAnalyticsSheets}
                  onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
                  onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                />
              ) : instantSearchResults ? (
                /* CAS B : Résultats de Recherche Instantanée dès la 1ère lettre tapée */
                <div className="space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-amber-300">
                      Résultats instantanés pour &ldquo;{hubSearchQuery}&rdquo; (
                      {instantSearchResults.totalCount})
                    </span>
                    <button
                      type="button"
                      onClick={() => setHubSearchQuery('')}
                      className="text-[11px] text-zinc-400 hover:text-white"
                    >
                      Effacer la recherche
                    </button>
                  </div>

                  {/* Genres correspondants (incluant tous les nouveaux genres créés dans l'Admin) */}
                  {instantSearchResults.genres.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-1 block">
                        Genres &amp; Catégories DROP (
                        {instantSearchResults.genres.length})
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {instantSearchResults.genres.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setHubSearchQuery('');
                              setHubGenreFilter(g);
                              setHubTab('EXPLORER');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-black border border-amber-400/40 text-xs font-bold whitespace-nowrap shrink-0 transition"
                          >
                            Genre : {g} →
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Titres correspondants */}
                  {instantSearchResults.tracks.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-1 block">
                        Titres, Featurings &amp; Paroles (
                        {instantSearchResults.tracks.length})
                      </span>
                      {instantSearchResults.tracks.map(
                        ({ track: t, albumIndex, trackIndex }) => {
                          const isThisPlaying =
                            currentTrack.id === t.id && isPlaying;
                          const rInfo = trackRankMap[t.id] || {
                            rank: 1,
                            delta: 0,
                          };
                          const cert = getTrackCertification(t.realPlays);
                          return (
                            <div
                              key={t.id}
                              onClick={() =>
                                handlePlayOrToggleSpecificTrack(
                                  albumIndex,
                                  trackIndex
                                )
                              }
                              className={`flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border cursor-pointer transition ${
                                currentTrack.id === t.id
                                  ? 'bg-white/15 border-amber-400/50'
                                  : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0">
                                  <CoverArtwork
                                    artworkType={t.artworkType}
                                    coverUrl={t.cover}
                                    title={t.title}
                                    artist={t.artist}
                                  />
                                  <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-white">
                                    {isThisPlaying ? '❚❚' : '▶'}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs sm:text-sm font-bold text-white truncate">
                                      {t.title}
                                    </p>
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono text-zinc-300 shrink-0">
                                      {t.category}
                                    </span>
                                    <CertificationBadgeSvg
                                      cert={cert}
                                      compact
                                    />
                                  </div>
                                  <p className="text-[11px] text-zinc-400 truncate">
                                    {t.artist}
                                    {t.featuringArtists &&
                                    t.featuringArtists.length > 0
                                      ? ` feat. ${t.featuringArtists.join(', ')}`
                                      : ''}{' '}
                                    • Plume : {t.lyricistName || t.artist}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <RankBadgeSvg
                                  rank={rInfo.rank}
                                  delta={rInfo.delta}
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openUserTrackSheet(t.id);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold border bg-amber-400/15 hover:bg-amber-400/25 border-amber-400/40 text-amber-300 transition"
                                >
                                  Fiche
                                </button>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}

                  {/* Artistes, Paroliers, Beatmakers, Ingés Son & Labels correspondants */}
                  {instantSearchResults.entities.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-1 block">
                        Artistes, Paroliers &amp; Équipes Studio (
                        {instantSearchResults.entities.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {instantSearchResults.entities.map((ent) => (
                          <button
                            key={ent.key}
                            type="button"
                            onClick={() =>
                              openUserEntitySheet(ent.name, ent.role)
                            }
                            className="flex items-center justify-between p-2.5 rounded-2xl border bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-left transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                                <CoverArtwork
                                  artworkType={ent.artworkType}
                                  coverUrl={ent.cover}
                                  title={ent.name}
                                  artist={ent.name}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-white truncate">
                                    {ent.name}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 text-[9px] font-mono font-bold shrink-0">
                                    {ent.role === 'ARTIST'
                                      ? 'ARTISTE'
                                      : ent.role === 'LABEL'
                                        ? 'LABEL'
                                        : ent.role === 'BEATMAKER'
                                          ? 'BEATMAKER'
                                          : ent.role === 'LYRICIST'
                                            ? 'PAROLIER'
                                            : 'INGÉ SON'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-400 truncate">
                                  Score : {ent.decoupledScore} pts •{' '}
                                  {ent.primaryMetricValue}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-amber-300 font-semibold shrink-0">
                              Profil →
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* CAS C : Contenu des Onglets du Hub Central */
                <>
                  {/* ONGLET 1 : EXPLORER GENRES DYNAMIQUES & PROJETS 2D */}
                  {hubTab === 'EXPLORER' && (
                    <div className="space-y-3.5 animate-fade-in">
                      {/* Barre Glissante des Genres (Tous les genres Admin inclus, zéro troncature) */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        <button
                          type="button"
                          onClick={() => setHubGenreFilter('ALL')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                            hubGenreFilter === 'ALL'
                              ? 'bg-amber-400 text-black font-bold'
                              : 'bg-white/[0.06] text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          Tous les genres ({availableGenres.length})
                        </button>
                        {availableGenres.map((genre) => (
                          <button
                            key={genre}
                            type="button"
                            onClick={() => setHubGenreFilter(genre)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                              hubGenreFilter === genre
                                ? 'bg-amber-400 text-black font-bold'
                                : 'bg-white/[0.06] text-zinc-300 hover:bg-white/10'
                            }`}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>

                      {/* Grille 2D des Projets et de leurs Titres */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analyticsCatalogue.map((alb, aIdx) => {
                          if (
                            hubGenreFilter !== 'ALL' &&
                            alb.category !== hubGenreFilter
                          ) {
                            return null;
                          }
                          const firstTrack = alb.tracks[0];
                          const isCurrentAlbum = aIdx === albumIdx;
                          const albPlays = alb.tracks.reduce(
                            (acc, t) => acc + t.realPlays,
                            0
                          );
                          const albCert = getAlbumCertification(albPlays);

                          return (
                            <div
                              key={alb.id}
                              className={`p-3 rounded-2xl bg-white/[0.04] border transition flex flex-col gap-2.5 ${
                                isCurrentAlbum
                                  ? 'border-amber-400/50 bg-white/[0.07]'
                                  : 'border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  onClick={() =>
                                    handlePlayOrToggleSpecificTrack(aIdx, 0)
                                  }
                                  className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 cursor-pointer border border-white/10"
                                >
                                  <CoverArtwork
                                    artworkType={firstTrack.artworkType}
                                    coverUrl={firstTrack.cover}
                                    title={alb.albumTitle}
                                    artist={alb.artist}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-amber-300">
                                      {alb.category} • {alb.year}
                                    </span>
                                    <CertificationBadgeSvg
                                      cert={albCert}
                                      compact
                                    />
                                  </div>
                                  <p className="text-sm font-bold text-white truncate mt-1">
                                    {alb.albumTitle}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openUserEntitySheet(alb.artist, 'ARTIST')
                                    }
                                    className="text-xs text-zinc-400 hover:text-amber-300 truncate block transition"
                                  >
                                    {alb.artist}
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1.5 pt-1 border-t border-white/10">
                                {alb.tracks.map((t, tIdx) => {
                                  const isThisTrackCurrent =
                                    aIdx === albumIdx && tIdx === trackIdx;
                                  const isThisPlaying =
                                    isThisTrackCurrent && isPlaying;
                                  const rInfo = trackRankMap[t.id] || {
                                    rank: 1,
                                    delta: 0,
                                  };
                                  const tCert = getTrackCertification(
                                    t.realPlays
                                  );
                                  return (
                                    <div
                                      key={t.id}
                                      onClick={() =>
                                        handlePlayOrToggleSpecificTrack(
                                          aIdx,
                                          tIdx
                                        )
                                      }
                                      className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition ${
                                        isThisTrackCurrent
                                          ? 'bg-[#e11d38]/20 border border-[#e11d38]/50'
                                          : 'bg-black/35 hover:bg-white/10 border border-white/5'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] shrink-0">
                                          {isThisPlaying ? '❚❚' : '▶'}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-semibold text-white truncate">
                                              {t.title}
                                            </span>
                                            <CertificationBadgeSvg
                                              cert={tCert}
                                              compact
                                            />
                                          </div>
                                          {t.featuringArtists &&
                                            t.featuringArtists.length > 0 && (
                                              <span className="text-[10px] text-amber-200/80 block truncate">
                                                feat.{' '}
                                                {t.featuringArtists.join(', ')}
                                              </span>
                                            )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[10px] font-mono text-amber-300">
                                          #{rInfo.rank}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openUserTrackSheet(t.id);
                                          }}
                                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 hover:bg-amber-400 hover:text-black border border-white/15 text-zinc-200 transition"
                                        >
                                          Infos
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ONGLET 2 : CLASSEMENTS DÉCOUPLÉS ANTI-EFFET DE HALO (PILIER II) */}
                  {hubTab === 'RANGS' && (
                    <div className="space-y-3 animate-fade-in">
                      {/* Sélecteur de Période Officielle (Hebdo 7j / Mensuel 30j / Annuel glissant 365j) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/[0.03] border border-white/10 rounded-xl p-2">
                        <span className="text-[10.5px] font-mono text-zinc-300 px-1">
                          Périodicité Officielle des Classements (ECG) :
                        </span>
                        <div className="flex items-center gap-1">
                          {(
                            [
                              { id: 'WEEKLY_7D', label: 'Hebdomadaire (7j)' },
                              { id: 'MONTHLY_30D', label: 'Mensuel (30j)' },
                              { id: 'ANNUAL_365D', label: 'Annuel glissant' },
                            ] as { id: ChartTimeframe; label: string }[]
                          ).map((tf) => (
                            <button
                              key={tf.id}
                              type="button"
                              onClick={() => setChartTimeframe(tf.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition ${
                                chartTimeframe === tf.id
                                  ? 'bg-[#e11d38] text-white'
                                  : 'bg-white/5 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {tf.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Onglets Glissants par Philosophie de Métier */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {(
                          [
                            { id: 'ALL', label: '1. Top Chansons (60/25/15)' },
                            { id: 'ARTIST', label: '2. Top Artistes (70/30 Feat)' },
                            {
                              id: 'BEATMAKER',
                              label: '3. Top Beatmakers (Cap 25%)',
                            },
                            {
                              id: 'ENGINEER',
                              label: '4. Top Ingés Son (20/50/30 • Cap 20%)',
                            },
                            {
                              id: 'LYRICIST',
                              label: '5. Top Paroliers (Plume x1,25)',
                            },
                            {
                              id: 'LABEL',
                              label: '6. Top Labels (Médiane • Min 3 Art.)',
                            },
                            { id: 'CATEGORY', label: 'Top Genres Gabonais' },
                          ] as const
                        ).map((dim) => (
                          <button
                            key={dim.id}
                            type="button"
                            onClick={() => setHubRankDimension(dim.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                              hubRankDimension === dim.id
                                ? 'bg-amber-400 text-black font-bold'
                                : 'bg-white/[0.06] text-zinc-300 hover:bg-white/10'
                            }`}
                          >
                            {dim.label}
                          </button>
                        ))}
                      </div>

                      {/* Bandeau explicatif de la formule officielle du classement sélectionné */}
                      <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-[11px] text-amber-200 flex items-center justify-between gap-2">
                        <span>
                          {hubRankDimension === 'ALL' &&
                            'Top Chansons : Score Titre = 60% Volume ECG + 25% Vélocité + 15% Engagement social. Loi d’amortissement : -5%/semaine après 10 semaines dans le Top 10.'}
                          {hubRankDimension === 'ARTIST' &&
                            'Top Artistes : 40% Volume ECG (70% Principal / 30% Featuring ou 50/50) + 30% Profondeur Catalogue + 30% Fidélisation & Conversion Abonnés.'}
                          {hubRankDimension === 'BEATMAKER' &&
                            'Top Beatmakers : [(35% Volume plafonné 25%/titre) + (35% Delta d’Impact vs 3 sorties) + (30% Accroche 45s & Loop)] × Polyvalence 90j (1 art.=x0.70, 2=x1.00, 3-4=x1.20, 5+=x1.40).'}
                          {hubRankDimension === 'ENGINEER' &&
                            'Top Ingénieurs du Son : Ventilation Prise (20%) / Mixage (50%) / Mastering (30%) • 35% Complétion >85% + 25% Standard -14 LUFS + 25% Volume (Plafond strict 20%/titre) + 15% Diversité.'}
                          {hubRankDimension === 'LYRICIST' &&
                            'Top Paroliers : Paroles synchronisées requises • 35% Ouvertures & Partages de punchlines + 30% Longévité J+90 + 20% Volume (Plafond 25%) + 15% Bonus Plume Externe (x1,25).'}
                          {hubRankDimension === 'LABEL' &&
                            'Top Labels : Éligibilité min. 3 artistes actifs • 40% Médiane & Moyenne tronquée (-50% locomotive) + 25% Équilibre Roster (<80%/artiste) + 20% Nouvelles signatures + 15% Métadonnées.'}
                          {hubRankDimension === 'CATEGORY' &&
                            'Genres Musicaux Gabonais : Ntcham, Rap Gabonais, Afrobeats, Rumba Gabonaise, Gospel, Tradimoderne et tous les genres créés dans l’Admin.'}
                        </span>
                      </div>

                      {hubRankDimension === 'ALL' ? (
                        <div className="space-y-2">
                          {[...allTracksFlat]
                            .map((item) => ({
                              ...item,
                              explosion: computeTrackExplosionScore(
                                item.track,
                                chartTimeframe
                              ),
                              cert: getTrackCertification(
                                item.track.realPlays,
                                item.track.gabonTerritoryPct ?? 86,
                                item.track.id
                              ),
                            }))
                            .sort(
                              (a, b) =>
                                b.explosion.explosionScore -
                                a.explosion.explosionScore
                            )
                            .map(
                              (
                                {
                                  track: t,
                                  albumIndex,
                                  trackIndex,
                                  explosion,
                                  cert,
                                },
                                idx
                              ) => {
                                const rInfo = trackRankMap[t.id] || {
                                  rank: idx + 1,
                                  delta: 0,
                                };
                                const isThisPlaying =
                                  currentTrack.id === t.id && isPlaying;
                                return (
                                  <div
                                    key={t.id}
                                    onClick={() =>
                                      handlePlayOrToggleSpecificTrack(
                                        albumIndex,
                                        trackIndex
                                      )
                                    }
                                    className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer transition"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <RankBadgeSvg
                                        rank={idx + 1}
                                        delta={rInfo.delta}
                                      />
                                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0">
                                        <CoverArtwork
                                          artworkType={t.artworkType}
                                          coverUrl={t.cover}
                                          title={t.title}
                                          artist={t.artist}
                                        />
                                        <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-xs">
                                          {isThisPlaying ? '❚❚' : '▶'}
                                        </span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <p className="text-xs font-bold text-white truncate">
                                            {t.title}
                                          </p>
                                          <CertificationBadgeSvg
                                            cert={cert}
                                            compact
                                          />
                                          {explosion.decayPenaltyPct > 0 && (
                                            <span className="px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/35 text-rose-300 text-[9px] font-mono">
                                              Usure Top 10 : -{explosion.decayPenaltyPct}%
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-zinc-400 truncate">
                                          {t.artist}
                                          {t.featuringArtists &&
                                          t.featuringArtists.length > 0
                                            ? ` feat. ${t.featuringArtists.join(', ')}`
                                            : ''}{' '}
                                          • {formatCompactPlays(t.realPlays)} ECG •
                                          Vol:{explosion.volumeComponent} / Vél:{explosion.growthComponent} / Soc:{explosion.socialComponent}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-mono text-[11px] font-bold">
                                        {explosion.explosionScore} pts
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openUserTrackSheet(t.id);
                                        }}
                                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold border bg-amber-400/15 hover:bg-amber-400/25 border-amber-400/40 text-amber-300 transition"
                                      >
                                        Fiche →
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                        </div>
                      ) : hubRankDimension === 'CATEGORY' ? (
                        <div className="space-y-2">
                          {availableGenres.map((genre, idx) => {
                            const tracksInGenre = allTracksFlat.filter(
                              (m) => m.track.category === genre
                            );
                            const totalPlays = tracksInGenre.reduce(
                              (acc, m) => acc + m.track.realPlays,
                              0
                            );
                            return (
                              <div
                                key={genre}
                                onClick={() => {
                                  setHubGenreFilter(genre);
                                  setHubTab('EXPLORER');
                                }}
                                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer transition"
                              >
                                <div className="flex items-center gap-3">
                                  <RankBadgeSvg rank={idx + 1} delta={0} />
                                  <div>
                                    <p className="text-xs font-bold text-white">
                                      {genre}
                                    </p>
                                    <p className="text-[11px] text-zinc-400">
                                      {tracksInGenre.length} titre(s) •{' '}
                                      {formatCompactPlays(totalPlays)} ECG cumulées
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs text-amber-300 font-semibold">
                                  Explorer →
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {decoupledStudioRankings
                            .filter((ent) => ent.role === hubRankDimension)
                            .map((ent, idx) => (
                              <div
                                key={ent.key}
                                onClick={() =>
                                  openUserEntitySheet(ent.name, ent.role)
                                }
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer transition"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <RankBadgeSvg rank={idx + 1} delta={1} />
                                  <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10">
                                    <CoverArtwork
                                      artworkType={ent.artworkType}
                                      coverUrl={ent.cover}
                                      title={ent.name}
                                      artist={ent.name}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                                        {ent.name}
                                      </p>
                                      {ent.careerCertification &&
                                        ent.careerCertification.level !==
                                          'NONE' && (
                                          <CertificationBadgeSvg
                                            cert={ent.careerCertification}
                                            compact
                                          />
                                        )}
                                      {ent.labelDivision && (
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                            ent.labelDivision ===
                                            'LABEL_OFFICIEL'
                                              ? 'bg-emerald-500/20 text-emerald-300'
                                              : 'bg-amber-500/20 text-amber-300'
                                          }`}
                                        >
                                          {ent.labelDivision ===
                                          'LABEL_OFFICIEL'
                                            ? 'Label Officiel (≥3 art.)'
                                            : 'Écurie Indé (<3 art.)'}
                                        </span>
                                      )}
                                      {ent.antiOneHitWonderApplied &&
                                        ent.role !== 'LABEL' && (
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9.5px] font-mono">
                                            Cap{' '}
                                            {ent.role === 'ENGINEER'
                                              ? '20%'
                                              : '25%'}{' '}
                                            • Polyvalence x
                                            {ent.versatilityMultiplier.toFixed(
                                              2
                                            )}
                                          </span>
                                        )}
                                      {ent.hasEscrowDispute && (
                                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-mono font-bold">
                                          Litige Séquestre
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                                      <span className="text-amber-300 font-semibold">
                                        {ent.primaryMetricLabel} :{' '}
                                        {ent.primaryMetricValue}
                                      </span>{' '}
                                      • {ent.secondaryMetricLabel} :{' '}
                                      {ent.secondaryMetricValue}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-white/10">
                                  <span className="px-2.5 py-1 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-extrabold">
                                    {ent.decoupledScore} pts
                                  </span>
                                  <span className="text-xs text-white font-semibold">
                                    Détails →
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ONGLET 3 : DROP AWARDS ANNUELS (GRILLES A & B, BLIND TEST -14 LUFS, VOTE +241 & REGISTRE QR) */}
                  {hubTab === 'AWARDS' && (
                    <div className="space-y-3.5 animate-fade-in">
                      {/* Sous-Navigation des Awards : 1. Palmarès & Vote Public (+241) | 2. Jury à l'Aveugle (-14 LUFS) | 3. Registre National & QR */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/[0.04] border border-white/10 rounded-2xl p-2">
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                          {(
                            [
                              {
                                id: 'PALMARES',
                                label:
                                  '10 Catégories & Vote Public (+241)',
                              },
                              {
                                id: 'BLIND_TEST',
                                label:
                                  'Module « Jury à l’Aveugle » (-14 LUFS)',
                              },
                              {
                                id: 'CERTIFICATIONS',
                                label:
                                  'Registre National ECG & QR Codes',
                              },
                            ] as const
                          ).map((sub) => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => setAwardsSubView(sub.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                                awardsSubView === sub.id
                                  ? 'bg-amber-400 text-black'
                                  : 'bg-white/5 text-zinc-300 hover:text-white'
                              }`}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-[10.5px] font-mono px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
                          <span>OTP +241 Vérifié</span>
                          <span>•</span>
                          <span>
                            Quota Vote : {remainingDailyVotes}/{maxDailyVotes}{' '}
                            restant(s) aujourd&apos;hui
                          </span>
                        </div>
                      </div>

                      {/* SOUS-VUE 1 : LES 10 CATÉGORIES OFFICIELLES (GRILLES A 50/25/25 & B 50/35/15) + VOTE PUBLIC */}
                      {awardsSubView === 'PALMARES' && (
                        <div className="space-y-3">
                          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-zinc-300 flex flex-wrap items-center justify-between gap-2">
                            <span>
                              Période d&apos;éligibilité : <strong>1er Nov N-1 – 31 Oct N</strong> •{' '}
                              <strong className="text-amber-300">
                                Grille A (Artistique) : 50% Algo / 25% Jury / 25% Public
                              </strong>{' '}
                              •{' '}
                              <strong className="text-cyan-300">
                                Grille B (Artisans) : 50% Algo / 35% Blind Test / 15% Public
                              </strong>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {dropAwardsList.map((award) => (
                              <div
                                key={award.id}
                                className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-3"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                        award.scoringGrid ===
                                        'GRILLE_B_TECHNIQUE_BLIND'
                                          ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/40'
                                          : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                      }`}
                                    >
                                      {award.criteriaBadge} (
                                      {award.algoWeightPct}% /{' '}
                                      {award.juryWeightPct}% /{' '}
                                      {award.publicWeightPct}%)
                                    </span>
                                    {award.winner.certification && (
                                      <CertificationBadgeSvg
                                        cert={award.winner.certification}
                                        compact
                                      />
                                    )}
                                  </div>
                                  <h4 className="text-sm font-bold text-white mt-1.5">
                                    {award.title}
                                  </h4>
                                  <p className="text-[11px] text-zinc-400 mt-0.5">
                                    {award.subtitle}
                                  </p>
                                  <p className="text-[10px] font-mono text-amber-200/80 mt-1">
                                    {award.eligibilityRuleText}
                                  </p>
                                </div>

                                {/* Lauréat #1 */}
                                <div
                                  onClick={() => {
                                    if (award.winner.trackId) {
                                      openUserTrackSheet(award.winner.trackId);
                                    } else if (award.winner.entityRole) {
                                      openUserEntitySheet(
                                        award.winner.name,
                                        award.winner.entityRole
                                      );
                                    }
                                  }}
                                  className="p-3 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-amber-400/20 transition"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-amber-300/40">
                                      <CoverArtwork
                                        artworkType={award.winner.artworkType}
                                        coverUrl={award.winner.cover}
                                        title={award.winner.name}
                                        artist={award.winner.secondaryName}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-[10px] font-mono font-bold text-amber-300 block">
                                        LAURÉAT EN TÊTE #1
                                      </span>
                                      <p className="text-xs font-bold text-white truncate">
                                        {award.winner.name}
                                      </p>
                                      <p className="text-[10px] text-zinc-300 truncate">
                                        {award.winner.secondaryName}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right font-mono shrink-0">
                                    <span className="text-xs font-extrabold text-amber-300 block">
                                      {award.winner.scoreLabel}
                                    </span>
                                    <span className="text-[9.5px] text-zinc-300">
                                      Algo {award.winner.algoScore} | Jury{' '}
                                      {award.winner.juryScore} | Pub{' '}
                                      {award.winner.publicScore}
                                    </span>
                                  </div>
                                </div>

                                {/* Nominés & Bouton Vote Public In-App (+241) */}
                                <div className="space-y-1.5">
                                  {award.nominees.map((nom) => {
                                    const voteKey = `${award.id}:${nom.trackId || nom.name}`;
                                    return (
                                      <div
                                        key={`${award.id}-${nom.rank}-${nom.name}`}
                                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-black/45 border border-white/5 text-xs"
                                      >
                                        <div
                                          onClick={() => {
                                            if (nom.trackId) {
                                              openUserTrackSheet(nom.trackId);
                                            } else if (nom.entityRole) {
                                              openUserEntitySheet(
                                                nom.name,
                                                nom.entityRole
                                              );
                                            }
                                          }}
                                          className="min-w-0 flex-1 cursor-pointer hover:text-amber-300 transition"
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <strong className="text-amber-300 font-mono">
                                              #{nom.rank}
                                            </strong>
                                            <span className="text-white font-semibold truncate">
                                              {nom.name}
                                            </span>
                                            {nom.blindDossierCode && (
                                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[9px] font-mono">
                                                {nom.blindDossierCode}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[10px] font-mono text-zinc-400 block truncate">
                                            {nom.metricDetail} •{' '}
                                            {nom.publicVotesCount} votes +241
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <span className="font-mono text-[11px] font-bold text-amber-200">
                                            {nom.finalHybridScore}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (remainingDailyVotes <= 0) {
                                                showToast(
                                                  `Quota quotidien atteint (${maxDailyVotes}/${maxDailyVotes} votes/jour pour votre Pass)`,
                                                  'bg-rose-500'
                                                );
                                                return;
                                              }
                                              setCustomPublicVotes((prev) => ({
                                                ...prev,
                                                [voteKey]:
                                                  (prev[voteKey] || 0) + 1,
                                              }));
                                              setVotesUsedToday((v) => v + 1);
                                              showToast(
                                                `Vote +241 enregistré pour ${nom.name} !`,
                                                'bg-emerald-400'
                                              );
                                            }}
                                            className="px-2 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold transition"
                                          >
                                            Voter +1
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SOUS-VUE 2 : MODULE « JURY À L'AVEUGLE » (BLIND TEST -14 LUFS — GRILLE B 35%) */}
                      {awardsSubView === 'BLIND_TEST' && (
                        <div className="space-y-3">
                          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0B121E] to-[#110D1B] border border-cyan-400/35 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 block">
                                  Pilier IV.3 — Protocole « Jury à l&apos;Aveugle » (Anti-Copinage • Grille B 35%)
                                </span>
                                <h3 className="text-sm font-bold text-white">
                                  Écoute Anonymisée de Packs de 3 Titres Normalisés à -14,0 LUFS
                                </h3>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-mono text-[10.5px]">
                                Conflit d&apos;intérêts : 0 détecté ✓
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300">
                              Les noms d&apos;artistes, pochettes et studios sont masqués. Notez chaque dossier anonyme sur 20 points : la note met immédiatement à jour la composante Jury (35%) de la Grille B.
                            </p>

                            <div className="flex items-center gap-1.5 pt-1">
                              {(
                                [
                                  {
                                    id: 'BEATMAKER',
                                    label: '5. Beatmaker de l’Année',
                                  },
                                  {
                                    id: 'ENGINEER',
                                    label: '6. Ingénieur du Son de l’Année',
                                  },
                                  {
                                    id: 'LYRICIST',
                                    label: '7. Parolier / Plume de l’Année',
                                  },
                                ] as const
                              ).map((rTab) => (
                                <button
                                  key={rTab.id}
                                  type="button"
                                  onClick={() => setBlindRoleFilter(rTab.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    blindRoleFilter === rTab.id
                                      ? 'bg-cyan-400 text-black'
                                      : 'bg-white/10 text-zinc-300 hover:text-white'
                                  }`}
                                >
                                  {rTab.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {blindTestDossiers
                              .filter((d) => d.role === blindRoleFilter)
                              .map((dossier) => {
                                const awardId =
                                  dossier.role === 'BEATMAKER'
                                    ? 'award-beatmaker-year'
                                    : dossier.role === 'ENGINEER'
                                      ? 'award-engineer-year'
                                      : 'award-lyricist-year';
                                const scoreKey = `${awardId}:${dossier.realCandidateName}`;
                                const currentCriteria = blindCriteriaDraft[
                                  dossier.dossierId
                                ] || [4.5, 4.5, 4.5, 4.5];
                                const total20 =
                                  Math.round(
                                    currentCriteria.reduce((a, b) => a + b, 0) *
                                      10
                                  ) / 10;

                                return (
                                  <div
                                    key={dossier.dossierId}
                                    className="p-3.5 rounded-2xl bg-[#07080C] border border-cyan-400/25 flex flex-col justify-between gap-3"
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-1 rounded-lg bg-cyan-400/20 text-cyan-200 font-mono text-xs font-extrabold">
                                          {dossier.anonymousCode}
                                        </span>
                                        <span className="text-[10px] font-mono text-emerald-400">
                                          Master : {dossier.normalizedLufs.toFixed(1)} LUFS
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-zinc-400 font-mono">
                                        Identité &amp; Studio masqués (Blind Test actif)
                                      </p>

                                      {/* Pack de 3 pistes anonymes écoutables */}
                                      <div className="space-y-1.5 pt-1">
                                        {dossier.tracksPack.map((tp) => {
                                          const found = allTracksFlat.find(
                                            (m) => m.track.id === tp.trackId
                                          );
                                          const isPlayingThis =
                                            currentTrack.id === tp.trackId &&
                                            isPlaying;
                                          return (
                                            <button
                                              key={tp.trackId}
                                              type="button"
                                              onClick={() => {
                                                if (found) {
                                                  handlePlayOrToggleSpecificTrack(
                                                    found.albumIndex,
                                                    found.trackIndex
                                                  );
                                                }
                                              }}
                                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-cyan-400/15 border border-white/10 text-xs transition"
                                            >
                                              <span className="font-mono text-white font-semibold">
                                                {isPlayingThis ? '❚❚' : '▶'}{' '}
                                                {tp.slotLabel} ({tp.genre})
                                              </span>
                                              <span className="text-[10px] font-mono text-cyan-300">
                                                -14 LUFS
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Grille de Notation /20 (4 critères sur 5 pts) */}
                                    <div className="space-y-2 pt-2 border-t border-white/10">
                                      {dossier.criteriaLabels.map(
                                        (cLabel, cIdx) => (
                                          <div
                                            key={cLabel}
                                            className="space-y-0.5"
                                          >
                                            <div className="flex justify-between text-[10px] font-mono text-zinc-300">
                                              <span className="truncate">
                                                {cLabel}
                                              </span>
                                              <span className="text-amber-300 font-bold">
                                                {currentCriteria[cIdx]} / 5
                                              </span>
                                            </div>
                                            <input
                                              type="range"
                                              min={1}
                                              max={5}
                                              step={0.5}
                                              value={currentCriteria[cIdx]}
                                              onChange={(e) => {
                                                const val = parseFloat(
                                                  e.target.value
                                                );
                                                const next: [
                                                  number,
                                                  number,
                                                  number,
                                                  number,
                                                ] = [...currentCriteria] as [
                                                  number,
                                                  number,
                                                  number,
                                                  number,
                                                ];
                                                next[cIdx] = val;
                                                setBlindCriteriaDraft(
                                                  (prev) => ({
                                                    ...prev,
                                                    [dossier.dossierId]: next,
                                                  })
                                                );
                                                const sum20 = next.reduce(
                                                  (a, b) => a + b,
                                                  0
                                                );
                                                setCustomJuryScores((prev) => ({
                                                  ...prev,
                                                  [scoreKey]: sum20,
                                                }));
                                              }}
                                              className="w-full accent-cyan-400 cursor-pointer h-1.5"
                                            />
                                          </div>
                                        )
                                      )}

                                      <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs font-mono font-bold text-cyan-300">
                                          Note Jury : {total20} / 20
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCustomJuryScores((prev) => ({
                                              ...prev,
                                              [scoreKey]: total20,
                                            }));
                                            showToast(
                                              `Note Jury à l’Aveugle (${total20}/20) validée pour ${dossier.anonymousCode}`,
                                              'bg-cyan-400'
                                            );
                                          }}
                                          className="px-2.5 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-[11px] transition"
                                        >
                                          Valider {total20}/20
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* SOUS-VUE 3 : REGISTRE NATIONAL DES CERTIFICATIONS ECG & QR CODE SHA-256 */}
                      {awardsSubView === 'CERTIFICATIONS' && (
                        <div className="space-y-3">
                          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-zinc-900 to-cyan-500/10 border border-amber-400/35 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
                                  Pilier III — Registre Public des Certifications Nationales (Gabon ≥ 70% ECG • Audit 72h)
                                </span>
                                <h3 className="text-sm font-bold text-white">
                                  Singles (100K/250K/500K) • Albums Anti-Locomotive (300K/750K/1,5M) • Disques d&apos;Artisan (500K/1,25M/2,5M)
                                </h3>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {allTracksFlat.map(
                                ({ track: t }) => {
                                  const cert = getTrackCertification(
                                    t.realPlays,
                                    t.gabonTerritoryPct ?? 86,
                                    t.id
                                  );
                                  if (cert.level === 'NONE') return null;
                                  return (
                                    <div
                                      key={t.id}
                                      onClick={() => openUserTrackSheet(t.id)}
                                      className="p-3 rounded-xl bg-black/65 hover:bg-black/80 border border-white/15 flex items-center justify-between gap-3 cursor-pointer transition"
                                    >
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <CertificationBadgeSvg
                                            cert={cert}
                                            compact
                                          />
                                          <span className="text-[10px] font-mono text-emerald-400">
                                            Gabon {t.gabonTerritoryPct ?? 86}% • Audit 72h OK
                                          </span>
                                        </div>
                                        <p className="text-xs font-bold text-white truncate">
                                          {t.title} — {t.artist}
                                        </p>
                                        <p className="text-[10px] font-mono text-zinc-400 truncate">
                                          {t.realPlays.toLocaleString('fr-FR')} ECG •{' '}
                                          {cert.certificateHash}
                                        </p>
                                        <p className="text-[10px] text-amber-200/90 truncate">
                                          Co-Certifiés : Beatmaker {t.beatmakerName} • Mix {t.mixingEngineerName || t.soundEngineerName} • Plume {t.lyricistName || t.artist}
                                        </p>
                                      </div>
                                      <OfficialQrCodeSvg
                                        hash={cert.certificateHash}
                                        size={58}
                                      />
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ONGLET 4 : FIL COMMUN DES RECOMMANDATIONS DROP */}
                  {hubTab === 'RECOS' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-wrap items-center justify-between gap-2.5">
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            Fil Commun des Recommandations DROP
                          </h3>
                          <p className="text-xs text-zinc-400">
                            Titres et extraits de paroles poussés par la
                            communauté pour faire découvrir de nouveaux talents
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onRecommendTrack?.(
                              currentTrack.id,
                              `Je recommande « ${currentTrack.title} » de ${currentTrack.artist} !`,
                              false
                            );
                            showToast(
                              'Titre actuel ajouté au Fil Commun DROP !'
                            );
                          }}
                          className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition shrink-0"
                        >
                          + Recommander « {currentTrack.title} »
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {communityRecommendations.map((rec) => {
                          const foundTrack = allTracksFlat.find(
                            (m) => m.track.id === rec.trackId
                          );
                          return (
                            <div
                              key={rec.id}
                              onClick={() => {
                                if (foundTrack) {
                                  handlePlayOrToggleSpecificTrack(
                                    foundTrack.albumIndex,
                                    foundTrack.trackIndex
                                  );
                                }
                              }}
                              className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex flex-col gap-2 cursor-pointer transition"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center justify-center">
                                    {rec.userAvatar}
                                  </span>
                                  <span className="text-xs font-bold text-white">
                                    {rec.userName}
                                  </span>
                                  <span className="text-[11px] text-zinc-400">
                                    {rec.isLyricExcerpt
                                      ? 'a partagé un extrait de paroles'
                                      : 'a recommandé ce titre'}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-amber-300">
                                  {rec.createdAt} • +{rec.boostPoints} pt
                                </span>
                              </div>

                              {rec.commentOrLyricExcerpt && (
                                <p
                                  className={`text-xs px-3 py-2 rounded-xl border ${
                                    rec.isLyricExcerpt
                                      ? 'bg-violet-500/15 border-violet-400/35 text-violet-200 italic font-semibold'
                                      : 'bg-black/40 border-white/5 text-zinc-200'
                                  }`}
                                >
                                  {rec.commentOrLyricExcerpt}
                                  {rec.isLyricExcerpt && rec.lyricistName && (
                                    <span className="block text-[10px] font-mono text-violet-300 mt-1 not-italic">
                                      — Plume : {rec.lyricistName}
                                    </span>
                                  )}
                                </p>
                              )}

                              <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                                    <CoverArtwork
                                      artworkType={rec.artworkType}
                                      coverUrl={rec.cover}
                                      title={rec.trackTitle}
                                      artist={rec.trackArtist}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">
                                      {rec.trackTitle}
                                    </p>
                                    <p className="text-[11px] text-zinc-400 truncate">
                                      {rec.trackArtist} • {rec.trackCategory}
                                    </p>
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-lg bg-[#e11d38] text-white text-[11px] font-bold shrink-0">
                                  Écouter ▶
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ONGLET 5 : ARTISTES, PAROLIERS & ÉQUIPES STUDIO */}
                  {hubTab === 'ARTISTES' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {(
                          [
                            { id: 'ALL', label: 'Tous les Métiers Studio' },
                            { id: 'ARTIST', label: 'Artistes & Featurings' },
                            { id: 'LYRICIST', label: 'Paroliers (Plumes)' },
                            { id: 'BEATMAKER', label: 'Beatmakers' },
                            { id: 'ENGINEER', label: 'Ingénieurs du Son' },
                            { id: 'LABEL', label: 'Labels' },
                          ] as const
                        ).map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setHubTeamRoleFilter(f.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                              hubTeamRoleFilter === f.id
                                ? 'bg-amber-400 text-black font-bold'
                                : 'bg-white/[0.06] text-zinc-300 hover:bg-white/10'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {decoupledStudioRankings
                           .filter(
                            (ent) =>
                              hubTeamRoleFilter === 'ALL' ||
                              ent.role === hubTeamRoleFilter
                          )
                          .map((ent) => (
                            <button
                              key={ent.key}
                              type="button"
                              onClick={() =>
                                openUserEntitySheet(ent.name, ent.role)
                              }
                              className="relative flex items-center justify-between p-3 rounded-2xl border bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-left transition"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10">
                                  <CoverArtwork
                                    artworkType={ent.artworkType}
                                    coverUrl={ent.cover}
                                    title={ent.name}
                                    artist={ent.name}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white truncate">
                                      {ent.name}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                                        ent.role === 'ARTIST'
                                          ? 'bg-amber-400/20 text-amber-300'
                                          : ent.role === 'LABEL'
                                            ? 'bg-[#e11d38]/20 text-rose-300'
                                            : ent.role === 'BEATMAKER'
                                              ? 'bg-emerald-500/20 text-emerald-300'
                                              : ent.role === 'LYRICIST'
                                                ? 'bg-violet-500/20 text-violet-300'
                                                : 'bg-sky-500/20 text-sky-300'
                                      }`}
                                    >
                                      {ent.role === 'ARTIST'
                                        ? 'ARTISTE'
                                        : ent.role === 'LABEL'
                                          ? 'LABEL'
                                          : ent.role === 'BEATMAKER'
                                            ? 'BEATMAKER'
                                            : ent.role === 'LYRICIST'
                                              ? 'PAROLIER'
                                              : 'INGÉ SON'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                    {ent.primaryMetricLabel} :{' '}
                                    {ent.primaryMetricValue} • Score :{' '}
                                    {ent.decoupledScore} pts
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-amber-300 shrink-0 ml-2">
                                Ouvrir →
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* ONGLET 6 : MON PROFIL & SIMULATEUR MOBILE MONEY ECG */}
                  {hubTab === 'PROFIL' && currentUser && (
                    <ReusableUserProfileSheet
                      user={currentUser}
                      userRank={Math.max(
                        1,
                        [...users]
                          .sort(
                            (a, b) =>
                              b.totalListenSeconds - a.totalListenSeconds
                          )
                          .findIndex((u) => u.id === currentUser.id) + 1
                      )}
                      isOwnProfile={true}
                      userPlan={userPlan}
                      onToggleUserPlan={onToggleUserPlan}
                      subscriptionPass={subscriptionPass}
                      onChangeSubscriptionPass={onChangeSubscriptionPass}
                      networkOperator={networkOperator}
                      onChangeNetworkOperator={onChangeNetworkOperator}
                      lastEcgValidationMsg={lastEcgValidationMsg}
                      allTracksFlat={allTracksFlat}
                      trackRankMap={trackRankMap}
                      currentTrackId={currentTrack.id}
                      isPlaying={isPlaying}
                      onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
                      onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                    />
                  )}
                </>
              )}
            </div>

            {/* PILE FIXE EN BAS : MINI-LECTEUR JUSTE AU-DESSUS + RECHERCHE BAS */}
            <div className="pt-2.5 space-y-2 shrink-0 border-t border-white/10 bg-zinc-950/95">
              <SynchronizedMiniPlayer
                currentTrack={currentTrack}
                currentTime={currentTime}
                isPlaying={isPlaying}
                isDropMode={isDropMode}
                rankInfo={safeRankInfo}
                onTogglePlay={onTogglePlay}
                onNavigateTrack={onNavigateTrack}
                onExpandPlayer={() => {
                  closeAllAnalyticsSheets();
                  setActiveModal('NONE');
                }}
              />

              <div className="relative flex items-center">
                <svg
                  className="w-4 h-4 text-amber-400 absolute left-3.5 pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={hubSearchQuery}
                  onChange={(e) => {
                    if (hasOpenAnalyticsSheet) {
                      closeAllAnalyticsSheets();
                    }
                    setHubSearchQuery(e.target.value);
                  }}
                  placeholder="Rechercher un titre, artiste, featuring, parolier, genre, label, beatmaker..."
                  className="w-full pl-10 pr-20 py-3 rounded-2xl bg-white/[0.07] hover:bg-white/[0.1] focus:bg-zinc-900 border border-white/15 focus:border-amber-400 text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none shadow-lg transition"
                />
                {hubSearchQuery.trim().length > 0 && (
                  <div className="absolute right-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                      {instantSearchResults?.totalCount ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setHubSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
                      aria-label="Effacer la recherche"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. OVERLAY ANALYTIQUE PRO DIRECT DEPUIS LE LECTEUR 3D (ZÉRO ADMIN) */}
        {activeModal === 'NONE' && hasOpenAnalyticsSheet && (
          <div className="absolute inset-0 z-40 bg-zinc-950/96 backdrop-blur-2xl flex flex-col justify-between p-3.5 sm:p-5 animate-fade-in overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {activeTrackSheetData ? (
                <ReusableTrackDetailSheet
                  track={activeTrackSheetData.track}
                  album={activeTrackSheetData.album}
                  albumIndex={activeTrackSheetData.albumIndex}
                  trackIndex={activeTrackSheetData.trackIndex}
                  rankInfo={activeTrackSheetData.rankInfo}
                  isCurrentTrack={
                    activeTrackSheetData.track.id === currentTrack.id
                  }
                  isPlaying={isPlaying}
                  isLiked={!!likedTrackIds[activeTrackSheetData.track.id]}
                  isRecommended={
                    !!recommendedTrackIds[activeTrackSheetData.track.id]
                  }
                  isArtistSubscribed={
                    !!subscribedArtists[activeTrackSheetData.track.artist] ||
                    !!subscribedArtists[
                      activeTrackSheetData.track.artist.toLowerCase()
                    ]
                  }
                  artistSubscribersCount={
                    artistSubscribers[activeTrackSheetData.track.artist] ??
                    artistSubscribers[
                      activeTrackSheetData.track.artist.toLowerCase()
                    ]
                  }
                  isAdminView={false}
                  onClose={closeAllAnalyticsSheets}
                  onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                  onToggleLike={onToggleLike}
                  onRecommendTrack={(tId) => {
                    onRecommendTrack?.(
                      tId,
                      'Recommandé depuis la fiche analytique du titre',
                      false
                    );
                    showToast('Titre recommandé dans le Fil Commun DROP !');
                  }}
                  onToggleSubscribeArtist={(artName) =>
                    onToggleSubscribeArtist?.(artName)
                  }
                  onOpenEntityProfile={(name, role) =>
                    openUserEntitySheet(name, role)
                  }
                  onConfirmCreditHandshake={onConfirmCreditHandshake}
                  onOpenCreditDispute={onOpenCreditDispute}
                  onResolveCreditDispute={onResolveCreditDispute}
                />
              ) : activeEntitySheetData ? (
                <ReusableArtistDetailSheet
                  analytics={activeEntitySheetData}
                  trackRankMap={trackRankMap}
                  currentTrackId={currentTrack.id}
                  isPlaying={isPlaying}
                  onClose={closeAllAnalyticsSheets}
                  onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
                  onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                  onOpenEntityProfile={(name, role) =>
                    openUserEntitySheet(name, role)
                  }
                  onOpenUserProfile={(uId) => openUserListenerSheet(uId)}
                  onToggleSubscribeArtist={(artName) =>
                    onToggleSubscribeArtist?.(artName)
                  }
                />
              ) : activeUserSheetData ? (
                <ReusableUserProfileSheet
                  user={activeUserSheetData.user}
                  userRank={activeUserSheetData.rank}
                  isOwnProfile={currentUser?.id === activeUserSheetData.user.id}
                  userPlan={userPlan}
                  onToggleUserPlan={onToggleUserPlan}
                  subscriptionPass={subscriptionPass}
                  onChangeSubscriptionPass={onChangeSubscriptionPass}
                  networkOperator={networkOperator}
                  onChangeNetworkOperator={onChangeNetworkOperator}
                  lastEcgValidationMsg={lastEcgValidationMsg}
                  allTracksFlat={allTracksFlat}
                  trackRankMap={trackRankMap}
                  currentTrackId={currentTrack.id}
                  isPlaying={isPlaying}
                  onClose={closeAllAnalyticsSheets}
                  onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
                  onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                />
              ) : null}
            </div>

            <div className="pt-2.5 shrink-0">
              <SynchronizedMiniPlayer
                currentTrack={currentTrack}
                currentTime={currentTime}
                isPlaying={isPlaying}
                isDropMode={isDropMode}
                rankInfo={safeRankInfo}
                onTogglePlay={onTogglePlay}
                onNavigateTrack={onNavigateTrack}
                onExpandPlayer={closeAllAnalyticsSheets}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
