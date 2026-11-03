import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Bell,
  Ellipsis,
  Share2,
  Heart,
  UserPlus,
  UserCheck,
  ListPlus,
  MicVocal,
  Video,
  SlidersHorizontal,
  ArrowDownToLine,
  Check,
  X,
  Search,
  Compass,
  ChartNoAxesColumn,
  MessageCircle,
  UserRound,
  Trophy,
  Lock,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Shuffle,
  Repeat,
  Repeat1,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Sparkles,
  Flame,
  Radio,
  Download,
} from 'lucide-react';
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
  syncUserPlaylistsToCloud,
  getUserPlaylistsFromCloud,
  AdBannerSlide,
  AdBannerSettings,
  DEFAULT_AD_BANNERS,
  DEFAULT_AD_BANNER_SETTINGS,
  triggerBeatAudioDownload,
  generateDropContentId,
  computeDeterministicWaveformPeaks,
} from '../services/musicService';
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
  AutoMarqueeText,
  UserPlaylist,
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
import { DropTrendMagazineStudio } from './DropTrendMagazineStudio';
import { PlayerHeader } from './player/PlayerHeader';
import { PlayerCoverFlow } from './player/PlayerCoverFlow';
import { PlayerLyricsPanel } from './player/PlayerLyricsPanel';
import { PlayerMetadataBar } from './player/PlayerMetadataBar';
import { PlayerPlaybackDock } from './player/PlayerPlaybackDock';
import { EqualizerModal } from './player/modals/EqualizerModal';
import { PlaylistModal } from './player/modals/PlaylistModal';
import { QueueModal } from './player/modals/QueueModal';
import { OptionsMenuModal } from './player/modals/OptionsMenuModal';
import { RecommendModal } from './player/modals/RecommendModal';

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
  isInstrumental?: boolean;
  isBeatDownloadable?: boolean;
  musicalKey?: string;
  dropContentId?: string;
  waveformPeaks?: number[];
  audioCodec?: 'OPUS' | 'AAC' | 'WAV';
  audioUrl?: string;
  synthNotes?: number[];
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
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  adBanners?: AdBannerSlide[];
  adBannerSettings?: AdBannerSettings;
  enableAwardsCeremony?: boolean;
}

const CentralAdSlideshowBanner: React.FC<{
  position: 'TOP' | 'BOTTOM';
  slides: AdBannerSlide[];
  settings: AdBannerSettings;
  onSelectTrackId: (trackId: string) => void;
  onSelectAlbumId: (albumId: string) => void;
}> = ({ position, slides, settings, onSelectTrackId, onSelectAlbumId }) => {
  const isEnabled =
    position === 'TOP' ? settings.enableTopBanner : settings.enableBottomBanner;

  const matchingSlides = useMemo(
    () =>
      (slides || [])
        .filter(
          (s) =>
            s.active &&
            Boolean(s.imageUrl) &&
            (s.placement === position || s.placement === 'BOTH')
        )
        .sort((a, b) => a.orderIndex - b.orderIndex),
    [slides, position]
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (currentIdx >= matchingSlides.length) {
      setCurrentIdx(0);
    }
  }, [matchingSlides.length, currentIdx]);

  useEffect(() => {
    if (!isEnabled || matchingSlides.length <= 1) return;
    if (settings.pauseOnTouch && isPaused) return;
    const intervalMs = Math.max(1500, (settings.slideIntervalSec || 5) * 1000);
    const timer = window.setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % matchingSlides.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [
    isEnabled,
    matchingSlides.length,
    settings.slideIntervalSec,
    settings.pauseOnTouch,
    isPaused,
  ]);

  if (!isEnabled || matchingSlides.length === 0) return null;

  const activeSlide = matchingSlides[currentIdx] || matchingSlides[0];
  const transitionMs = Math.max(150, settings.transitionDurationMs || 500);

  const handleSlideClick = () => {
    if (!activeSlide) return;
    if (activeSlide.redirectType === 'TRACK' && activeSlide.targetTrackId) {
      onSelectTrackId(activeSlide.targetTrackId);
    } else if (
      activeSlide.redirectType === 'ALBUM' &&
      activeSlide.targetAlbumId
    ) {
      onSelectAlbumId(activeSlide.targetAlbumId);
    }
  };

  const bannerInner = (
    <div
      className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.55)] select-none bg-[#090d16]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        className="flex w-full h-full"
        style={{
          transform: `translateX(-${currentIdx * 100}%)`,
          transition: `transform ${transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      >
        {matchingSlides.map((slide) => (
          <div key={slide.id} className="w-full h-full shrink-0 relative">
            <img
              src={slide.imageUrl}
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {matchingSlides.length > 1 && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/45 backdrop-blur-sm z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {matchingSlides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIdx(idx);
              }}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIdx
                  ? 'w-5 bg-amber-400'
                  : 'w-1.5 bg-white/45 hover:bg-white/80'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (
    activeSlide.redirectType === 'EXTERNAL' &&
    activeSlide.externalUrl &&
    activeSlide.externalUrl.trim()
  ) {
    const cleanHref = activeSlide.externalUrl.trim().startsWith('http')
      ? activeSlide.externalUrl.trim()
      : `https://${activeSlide.externalUrl.trim()}`;
    return (
      <a
        href={cleanHref}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full cursor-pointer transition-transform active:scale-[0.99]"
      >
        {bannerInner}
      </a>
    );
  }

  if (
    (activeSlide.redirectType === 'TRACK' && activeSlide.targetTrackId) ||
    (activeSlide.redirectType === 'ALBUM' && activeSlide.targetAlbumId)
  ) {
    return (
      <div
        onClick={handleSlideClick}
        className="w-full cursor-pointer transition-transform active:scale-[0.99]"
      >
        {bannerInner}
      </div>
    );
  }

  return <div className="w-full">{bannerInner}</div>;
};

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

function normalizeSearchStr(str?: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function highlightMatchedText(
  text: string | undefined,
  query: string
): React.ReactNode {
  if (!text) return '';
  const cleanQuery = normalizeSearchStr(query.trim());
  if (!cleanQuery) return text;
  const normText = normalizeSearchStr(text);
  const matchIdx = normText.indexOf(cleanQuery);
  if (matchIdx === -1) return text;
  const before = text.slice(0, matchIdx);
  const match = text.slice(matchIdx, matchIdx + cleanQuery.length);
  const after = text.slice(matchIdx + cleanQuery.length);
  return (
    <>
      {before}
      <mark className="bg-amber-400/35 text-amber-200 font-extrabold rounded px-0.5">
        {match}
      </mark>
      {after}
    </>
  );
}

function normalizeToAnalyticsTrack(t: PlayerTrackItem): AnalyticsTrackItem {
  const peaks =
    t.waveformPeaks && t.waveformPeaks.length === 64
      ? t.waveformPeaks
      : computeDeterministicWaveformPeaks(
          `${t.id}|${t.title}|${t.artist}`,
          64
        );
  const cid =
    t.dropContentId ||
    generateDropContentId(
      peaks,
      t.duration,
      `${t.id}|${t.title}|${t.artist}`
    );

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
    lyricistName: t.isInstrumental ? 'Instrumental' : t.lyricistName || t.artist,
    isInstrumental: t.isInstrumental,
    isBeatDownloadable:
      t.isBeatDownloadable ??
      Boolean(t.isInstrumental || t.category === 'Beats & Instrumentales'),
    musicalKey: t.musicalKey,
    dropContentId: cid,
    waveformPeaks: peaks,
    audioUrl: t.audioUrl,
    audioCodec: 'OPUS',
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
      <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
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
  unreadNotificationsCount = 0,
  onOpenNotifications,
  adBanners = DEFAULT_AD_BANNERS,
  adBannerSettings = DEFAULT_AD_BANNER_SETTINGS,
  enableAwardsCeremony = false,
}) => {
  const safeRankInfo = rankInfo || currentRankInfo || { rank: 4, delta: 3 };
  const isPro = userPlan === 'PRO';

  const [fullBleed, setFullBleed] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'PLAYLIST' | 'EQ' | 'QUEUE' | 'OPTIONS' | 'MINI' | 'RECOMMEND'
  >('NONE');
  const [showTrendStudioModal, setShowTrendStudioModal] = useState(false);
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

  // Open Listener Profile directly inside User View (100% safe, never crashes)
  const openUserListenerSheet = (userId: string) => {
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

        const score = Math.max(
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

  return (
    <div className="relative h-[100dvh] w-screen bg-[#050507] flex items-center justify-center overflow-hidden">
      {/* Bouton flottant sur Bureau pour basculer entre 9:16 et Plein Écran Intégral */}
      <button
        type="button"
        onClick={() => setFullBleed(!fullBleed)}
        className="hidden sm:flex fixed top-4 right-4 z-50 items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-xs font-medium text-zinc-200 border border-white/15 backdrop-blur-md shadow-xl transition-all"
        title="Basculer l'affichage plein écran"
      >
        {fullBleed ? (
          <Minimize2 className="w-4 h-4 text-amber-400" />
        ) : (
          <Maximize2 className="w-4 h-4 text-amber-400" />
        )}
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

        {/* 1. EN-TÊTE STRICTEMENT SYMÉTRIQUE AVEC LOGO DROP CENTRÉ AU PIXEL PRÈS */}
        <PlayerHeader
          onOpenCentral={() => setActiveModal('MINI')}
          onOpenQueue={() => setActiveModal('QUEUE')}
          onOpenOptions={() => setActiveModal('OPTIONS')}
          onOpenNotifications={onOpenNotifications}
          unreadNotificationsCount={unreadNotificationsCount}
        />

        {/* 2. ZONE CENTRALE : CARROUSEL 3D COVERFLOW ULTRA-FLUIDE 60 FPS & PAROLES */}
        <PlayerCoverFlow
          catalogue={catalogue}
          albumIdx={albumIdx}
          trackIdx={trackIdx}
          currentTrack={currentTrack}
          onNavigateAlbum={onNavigateAlbum}
          onSelectAlbumIndex={onSelectAlbumIndex}
          onNavigateTrack={onNavigateTrack}
          onSelectTrackIndex={onSelectTrackIndex}
          onToast={showToast}
        >
          <PlayerLyricsPanel
            isOpen={lyricsOpen}
            isPro={isPro}
            currentTrack={currentTrack}
            currentTime={currentTime}
            activeLyricIdx={activeLyricIdx}
            currentLyricist={currentLyricist}
            onClose={() => setLyricsOpen(false)}
            onSeek={onSeek}
            onOpenLyricistProfile={(lyricist) => openUserEntitySheet(lyricist, 'LYRICIST')}
            onShareExcerpt={(cleanExcerpt) => {
              onRecommendTrack?.(currentTrack.id, cleanExcerpt, true);
              showToast(
                `Extrait partagé dans le Fil DROP (+Score Parolier : ${currentLyricist})`,
                'bg-violet-400'
              );
            }}
            formatTime={formatTime}
          />
        </PlayerCoverFlow>

        {/* 3. MÉTADONNÉES, DÉFILEMENT MARQUEE, BADGES, SCRUBBER & SEGMENT DROP */}
        <PlayerMetadataBar
          currentTrack={currentTrack}
          currentTrackCert={currentTrackCert}
          isPro={isPro}
          currentArtistSubscribed={currentArtistSubscribed}
          currentArtistSubscribersCount={currentArtistSubscribersCount}
          onToggleSubscribeArtist={onToggleSubscribeArtist}
          isCurrentRecommended={isCurrentRecommended}
          currentRecsCount={currentRecsCount}
          onOpenRecommendModal={() => setActiveModal('RECOMMEND')}
          isCurrentLiked={isCurrentLiked}
          onToggleLike={(e) => onToggleLike(currentTrack.id, e)}
          onOpenTrackSheet={() => openUserTrackSheet(currentTrack.id)}
          onOpenArtistProfile={() => openUserEntitySheet(currentTrack.artist, 'ARTIST')}
          safeRankInfo={safeRankInfo}
          isDropMode={isDropMode}
          currentTime={currentTime}
          onSeek={onSeek}
          formatTime={formatTime}
          formatCompactPlays={formatCompactPlays}
          onToast={showToast}
        />

        {/* 4. DOCK DE CONTRÔLE GLASSMORPHIQUE & 5 BOUTONS DONT LE BOUTON ROUGE PHARE TREND 30S */}
        <PlayerPlaybackDock
          isPlaying={isPlaying}
          isDropMode={isDropMode}
          isShuffle={isShuffle}
          repeatMode={repeatMode}
          onTogglePlay={onTogglePlay}
          onNavigateTrack={onNavigateTrack}
          onToggleShuffle={onToggleShuffle}
          onCycleRepeat={onCycleRepeat}
          onToast={showToast}
          isPro={isPro}
          lyricsOpen={lyricsOpen}
          onToggleLyrics={() => {
            const nextOpen = !lyricsOpen;
            setLyricsOpen(nextOpen);
            if (nextOpen) {
              onRecordLyricsOpen?.(currentTrack.id);
            }
          }}
          onOpenPlaylistModal={() => setActiveModal('PLAYLIST')}
          onOpenTrendStudio={() => setShowTrendStudioModal(true)}
          isTrendStudioOpen={showTrendStudioModal}
          onOpenEqModal={() => setActiveModal('EQ')}
          isEqCustomOrActive={isEqCustomOrActive}
          isDownloadedOffline={Boolean(currentTrack.downloadedOffline)}
          onToggleDownload={() => onToggleDownload(currentTrack.id)}
          onNotifyProRequired={notifyProRequired}
        />

        {/* 5. PIED DE PAGE DISCRET */}
        <footer className="relative z-20 pb-2 sm:pb-2.5 pt-0.5 text-center shrink-0">
          <p className="text-[8.5px] sm:text-[9.5px] text-zinc-500/65 tracking-tight">
            {currentTrack.copyrightText ||
              `© 2028 ${currentTrack.labelName}. Tous droits réservés`}
          </p>
        </footer>

        {/* MODALES DÉCOUPLÉES ET ERGONOMIQUES */}
        <RecommendModal
          isOpen={activeModal === 'RECOMMEND'}
          currentTrack={currentTrack}
          currentTrackCert={currentTrackCert}
          currentRecsCount={currentRecsCount}
          communityRecommendationsCount={communityRecommendations ? communityRecommendations.length : 0}
          onClose={() => setActiveModal('NONE')}
          onOpenTrendStudio={() => {
            setActiveModal('NONE');
            setShowTrendStudioModal(true);
          }}
          onPublishRecommendation={(note) => {
            onRecommendTrack?.(currentTrack.id, note, false);
            setActiveModal('MINI');
            setHubTab('RECOS');
            showToast('Recommandation publiée dans le Fil Commun DROP !', 'bg-amber-400');
          }}
          onViewFeed={() => {
            setActiveModal('MINI');
            setHubTab('RECOS');
          }}
        />

        <PlaylistModal
          isOpen={activeModal === 'PLAYLIST'}
          currentTrackId={currentTrack.id}
          playlists={playlists}
          onClose={() => setActiveModal('NONE')}
          onToggleTrackInPlaylist={handleToggleTrackInPlaylist}
          onCreatePlaylist={handleCreatePlaylist}
        />

        <EqualizerModal
          isOpen={activeModal === 'EQ'}
          isPro={isPro}
          eqGains={eqGains}
          masterVolume={masterVolume}
          onClose={() => setActiveModal('NONE')}
          onResetEq={onResetEq}
          onApplyEqPreset={onApplyEqPreset}
          onChangeEqBand={onChangeEqBand}
          onChangeMasterVolume={onChangeMasterVolume}
          onToast={showToast}
        />

        <QueueModal
          isOpen={activeModal === 'QUEUE'}
          catalogue={catalogue}
          albumIdx={albumIdx}
          trackIdx={trackIdx}
          isPlaying={isPlaying}
          onClose={() => setActiveModal('NONE')}
          onSelectTrack={handlePlayOrToggleSpecificTrack}
          formatCompactPlays={formatCompactPlays}
          formatTime={formatTime}
        />

        <OptionsMenuModal
          isOpen={activeModal === 'OPTIONS'}
          isPro={isPro}
          masterVolume={masterVolume}
          currentTrackId={currentTrack.id}
          currentArtist={currentTrack.artist}
          currentLyricist={currentLyricist}
          onClose={() => setActiveModal('NONE')}
          onToggleUserPlan={onToggleUserPlan}
          onChangeMasterVolume={onChangeMasterVolume}
          onOpenTrackSheet={openUserTrackSheet}
          onOpenArtistProfile={(art) => openUserEntitySheet(art, 'ARTIST')}
          onOpenLyricistProfile={(lyr) => openUserEntitySheet(lyr, 'LYRICIST')}
          onOpenAdminStudio={onOpenAdminStudio}
          onNotifyProRequired={notifyProRequired}
          onToast={showToast}
        />
        {/* =================================================================== */}
        {/* 5. ÉCRAN "CENTRAL" AÉRÉ AVEC ACTIONS RAPIDES EN HAUT & MENU BAS FIXE */}
        {/* =================================================================== */}
        {activeModal === 'MINI' && (
          <div className="absolute inset-0 z-40 bg-zinc-950/98 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-5 animate-fade-in overflow-hidden">
            {/* En-tête de l'écran "Central" épuré (Sans le bouton Répertoire) */}
            <div className="flex items-center justify-between gap-2 shrink-0 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <DropOfficialLogo className="h-[18px] w-auto shrink-0 max-w-[90px]" />
                <span className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">
                  Central
                </span>
              </div>

              {/* Actions rapides épurées en haut de l'écran Central */}
              <div className="flex items-center gap-1.5 shrink-0">
                {onOpenNotifications && (
                  <button
                    type="button"
                    onClick={onOpenNotifications}
                    className="relative w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/12 border border-white/10 flex items-center justify-center text-zinc-200 transition"
                    title="Notifications"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-[#e11d38] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                        {unreadNotificationsCount > 9
                          ? '9+'
                          : unreadNotificationsCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('NONE');
                    onOpenAdminStudio();
                  }}
                  className="px-2.5 py-1.5 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/35 text-amber-300 text-[11px] font-bold transition"
                  title="Ouvrir l'espace Studio Admin"
                >
                  Admin
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeAllAnalyticsSheets();
                    setActiveModal('NONE');
                  }}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1 transition shrink-0"
                >
                  <span>Lecteur</span>
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
            </div>

            {/* Zone Centrale Aérée */}
            <div className="flex-1 min-h-0 overflow-y-auto py-3 pr-0.5 flex flex-col gap-4">
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
                  userPlaylists={playlists}
                  onCreatePlaylist={handleCreatePlaylist}
                  onDeletePlaylist={handleDeletePlaylist}
                  onToggleTrackInPlaylist={handleToggleTrackInPlaylist}
                  likedTrackIds={likedTrackIds}
                  onToggleLike={onToggleLike}
                  subscribedArtists={subscribedArtists}
                  onToggleSubscribeArtist={onToggleSubscribeArtist}
                  onOpenEntityProfile={(name, role) =>
                    openUserEntitySheet(name, role)
                  }
                  onClose={closeAllAnalyticsSheets}
                  onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
                  onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                />
              ) : instantSearchResults ? (
                /* CAS B : Résultats de Recherche Intelligente Instantanée dès la 1ère lettre tapée */
                <div className="space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-amber-300">
                      Recherche temps réel « {hubSearchQuery} » (
                      {instantSearchResults.totalCount} résultat
                      {instantSearchResults.totalCount > 1 ? 's' : ''})
                    </span>
                    <button
                      type="button"
                      onClick={() => setHubSearchQuery('')}
                      className="text-[11px] text-zinc-400 hover:text-white"
                    >
                      Effacer la recherche
                    </button>
                  </div>

                  {instantSearchResults.totalCount === 0 && (
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-1">
                      <p className="text-xs font-bold text-zinc-300">
                        Aucune correspondance pour « {hubSearchQuery} »
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Essayez une lettre, un titre, un artiste, un beatmaker ou un code DROP-CID.
                      </p>
                    </div>
                  )}

                  {/* Genres correspondants */}
                  {instantSearchResults.genres.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-1 block">
                        Genres &amp; Catégories ({instantSearchResults.genres.length})
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {instantSearchResults.genres.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setHubSearchQuery('');
                              setHubTab('EXPLORER');
                              setCentralFullPageView({
                                type: 'GENRE',
                                genre: g,
                                title: g,
                                accentColor: '#f59e0b',
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-black border border-amber-400/40 text-xs font-bold whitespace-nowrap shrink-0 transition"
                          >
                            {highlightMatchedText(g, hubSearchQuery)} →
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Beats & Instrumentales téléchargeables correspondants */}
                  {instantSearchResults.beats.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 px-1 block">
                        Beats &amp; Instrumentales ({instantSearchResults.beats.length})
                      </span>
                      {instantSearchResults.beats.map(
                        ({ track: t, albumIndex, trackIndex }) => {
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
                              className={`flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border cursor-pointer transition ${
                                currentTrack.id === t.id
                                  ? 'bg-cyan-500/15 border-cyan-400/60'
                                  : 'bg-white/[0.04] border-cyan-400/25 hover:bg-white/[0.08]'
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
                                    {isThisPlaying ? (
                                      <Pause className="w-4 h-4 fill-current" />
                                    ) : (
                                      <Play className="w-4 h-4 fill-current ml-0.5" />
                                    )}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs sm:text-sm font-bold text-white truncate">
                                      {highlightMatchedText(
                                        t.title,
                                        hubSearchQuery
                                      )}
                                    </p>
                                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[9px] font-mono font-bold">
                                      {t.bpm || 120} BPM
                                      {t.musicalKey ? ` · ${t.musicalKey}` : ''}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 truncate">
                                    Prod.{' '}
                                    {highlightMatchedText(
                                      t.beatmakerName || t.artist,
                                      hubSearchQuery
                                    )}
                                    {t.dropContentId && (
                                      <span className="ml-1.5 text-[9px] font-mono text-emerald-300">
                                        [{highlightMatchedText(t.dropContentId, hubSearchQuery)}]
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerBeatAudioDownload({
                                      title: t.title,
                                      artist: t.artist,
                                      bpm: t.bpm,
                                      duration: t.duration,
                                      audioUrl: t.audioUrl,
                                      dropContentId: t.dropContentId,
                                    });
                                    showToast(
                                      `Téléchargement du Beat « ${t.title} » lancé !`,
                                      'bg-cyan-400'
                                    );
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold border bg-cyan-500/20 hover:bg-cyan-500/35 border-cyan-400/50 text-cyan-200 transition"
                                >
                                  ⬇ Télécharger le Beat
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openUserTrackSheet(t.id);
                                  }}
                                  className="px-2 py-1.5 rounded-xl text-[10px] font-bold border bg-white/10 hover:bg-white/20 border-white/15 text-zinc-200 transition"
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

                  {/* Titres correspondants */}
                  {instantSearchResults.tracks.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-1 block">
                        Titres &amp; Featurings ({instantSearchResults.tracks.length})
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
                                    {isThisPlaying ? (
                                      <Pause className="w-4 h-4 fill-current" />
                                    ) : (
                                      <Play className="w-4 h-4 fill-current ml-0.5" />
                                    )}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs sm:text-sm font-bold text-white truncate">
                                      {highlightMatchedText(
                                        t.title,
                                        hubSearchQuery
                                      )}
                                    </p>
                                    <CertificationBadgeSvg
                                      cert={cert}
                                      compact
                                    />
                                  </div>
                                  <p className="text-[11px] text-zinc-400 truncate">
                                    {highlightMatchedText(
                                      t.artist,
                                      hubSearchQuery
                                    )}
                                    {t.featuringArtists &&
                                    t.featuringArtists.length > 0
                                      ? ` feat. ${t.featuringArtists.join(', ')}`
                                      : ''}{' '}
                                    ·{' '}
                                    {highlightMatchedText(
                                      t.category,
                                      hubSearchQuery
                                    )}
                                    {t.dropContentId && (
                                      <span className="ml-1.5 text-[9px] font-mono text-emerald-300/80">
                                        [{highlightMatchedText(t.dropContentId, hubSearchQuery)}]
                                      </span>
                                    )}
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
                        Artistes &amp; Talents Studio ({instantSearchResults.entities.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {instantSearchResults.entities.map((ent) => (
                          <button
                            key={ent.key}
                            type="button"
                            onClick={() =>
                              openUserEntitySheet(ent.name, ent.role)
                            }
                            className="group relative aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 text-left transition"
                          >
                            <CoverArtwork
                              artworkType={ent.artworkType}
                              coverUrl={ent.cover}
                              title={ent.name}
                              artist={ent.name}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                            <div className="absolute bottom-2.5 left-2.5 right-2.5">
                              <p className="text-xs sm:text-sm font-extrabold text-white truncate">
                                {highlightMatchedText(ent.name, hubSearchQuery)}
                              </p>
                              <span className="text-[10px] text-amber-300 font-semibold">
                                {ent.role === 'ARTIST'
                                  ? 'Artiste'
                                  : ent.role === 'BEATMAKER'
                                    ? 'Beatmaker'
                                    : ent.role === 'LYRICIST'
                                      ? 'Parolier'
                                      : ent.role === 'ENGINEER'
                                        ? 'Ingé Son'
                                        : 'Label'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* CAS C : Contenu des Onglets de l'écran Central */
                <>
                  {/* =============================================================== */}
                  {/* ONGLET 1 : EXPLORER — FLUX VISUEL ALTERNÉ (CARRÉS, RECTANGLES,  */}
                  {/* CERCLES, PLAYLISTS) & VUES PLEINE PAGE (« + / VOIR PLUS »)      */}
                  {/* =============================================================== */}
                  {hubTab === 'EXPLORER' && (
                    <div className="space-y-5 animate-fade-in">
                      {centralFullPageView ? (
                        /* VUE PLEINE PAGE D'UNE CATÉGORIE SÉLECTIONNÉE (« + / VOIR PLUS ») */
                        <div className="space-y-4 animate-fade-in">
                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                            <button
                              type="button"
                              onClick={() => setCentralFullPageView(null)}
                              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition"
                            >
                              <span>← Retour à Central</span>
                            </button>
                            <h3
                              className="text-sm sm:text-base font-extrabold tracking-tight truncate"
                              style={{ color: centralFullPageView.accentColor }}
                            >
                              {centralFullPageView.title}
                            </h3>
                          </div>

                          {/* PLEINE PAGE 1 : MÉTIERS STUDIO (Artistes & Feats, Beatmakers, Paroliers, Ingés Son, Labels) */}
                          {centralFullPageView.type === 'ROLE' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {decoupledStudioRankings
                                .filter(
                                  (ent) =>
                                    centralFullPageView.role === 'ALL' ||
                                    ent.role === centralFullPageView.role
                                )
                                .map((ent) => (
                                  <button
                                    key={ent.key}
                                    type="button"
                                    onClick={() =>
                                      openUserEntitySheet(ent.name, ent.role)
                                    }
                                    className="group relative aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 text-left transition-transform active:scale-[0.98]"
                                  >
                                    <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                                      <CoverArtwork
                                        artworkType={ent.artworkType}
                                        coverUrl={ent.cover}
                                        title={ent.name}
                                        artist={ent.name}
                                      />
                                    </div>
                                    <div
                                      className="absolute inset-0"
                                      style={{
                                        background: `linear-gradient(to top, rgba(0,0,0,0.92) 12%, ${centralFullPageView.accentColor}44 55%, rgba(0,0,0,0.18) 100%)`,
                                      }}
                                    />
                                    <div className="absolute top-2.5 right-2.5">
                                      {ent.careerCertification &&
                                        ent.careerCertification.level !==
                                          'NONE' && (
                                          <CertificationBadgeSvg
                                            cert={ent.careerCertification}
                                            compact
                                            entityTitle={ent.name}
                                          />
                                        )}
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3">
                                      <p className="text-sm sm:text-base font-extrabold text-white truncate drop-shadow">
                                        {ent.name}
                                      </p>
                                      <span className="text-[11px] text-white/80 font-medium block truncate">
                                        {ent.primaryMetricValue}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          )}

                          {/* PLEINE PAGE 2 : GENRE MUSICAL */}
                          {centralFullPageView.type === 'GENRE' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {allTracksFlat
                                .filter(
                                  ({ track }) =>
                                    !centralFullPageView.genre ||
                                    centralFullPageView.genre === 'ALL' ||
                                    track.category === centralFullPageView.genre
                                )
                                .map(({ track: t, albumIndex, trackIndex }) => {
                                  const isThisPlaying =
                                    currentTrack.id === t.id && isPlaying;
                                  const tCert = getTrackCertification(
                                    t.realPlays
                                  );
                                  return (
                                    <div
                                      key={t.id}
                                      onClick={() =>
                                        handlePlayOrToggleSpecificTrack(
                                          albumIndex,
                                          trackIndex
                                        )
                                      }
                                      className="group relative aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 cursor-pointer transition-transform active:scale-[0.98]"
                                    >
                                      <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                                        <CoverArtwork
                                          artworkType={t.artworkType}
                                          coverUrl={t.cover}
                                          title={t.title}
                                          artist={t.artist}
                                        />
                                      </div>
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15" />
                                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                                        <CertificationBadgeSvg
                                          cert={tCert}
                                          compact
                                          entityTitle={t.title}
                                          entityArtist={t.artist}
                                          playsCount={t.realPlays}
                                        />
                                        <span className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-lg">
                                          {isThisPlaying ? (
                                            <Pause className="w-4 h-4 fill-current" />
                                          ) : (
                                            <Play className="w-4 h-4 fill-current ml-0.5" />
                                          )}
                                        </span>
                                      </div>
                                      <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
                                        <div>
                                          <p className="text-sm font-extrabold text-white truncate drop-shadow">
                                            {t.title}
                                          </p>
                                          <p className="text-xs text-amber-300 font-semibold truncate">
                                            {t.artist}
                                          </p>
                                        </div>
                                        {(t.isInstrumental ||
                                          t.category ===
                                            'Beats & Instrumentales') && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              triggerBeatAudioDownload({
                                                title: t.title,
                                                artist: t.artist,
                                                bpm: t.bpm,
                                                duration: t.duration,
                                                audioUrl: t.audioUrl,
                                                dropContentId: t.dropContentId,
                                              });
                                              showToast(
                                                `Téléchargement du Beat « ${t.title} » lancé !`,
                                                'bg-cyan-400'
                                              );
                                            }}
                                            className="w-full py-1.5 px-2 rounded-xl bg-cyan-500/85 hover:bg-cyan-400 text-black font-extrabold text-[10px] flex items-center justify-center gap-1 shadow-lg transition"
                                          >
                                            <span>⬇</span>
                                            <span>Télécharger le Beat</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                          {/* PLEINE PAGE 3 : TOUS LES DROPS EN RECTANGLES PANORAMIQUES */}
                          {centralFullPageView.type === 'DROPS' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {allTracksFlat.map(
                                ({ track: t, albumIndex, trackIndex }) => {
                                  const isThisPlaying =
                                    currentTrack.id === t.id && isPlaying;
                                  const tCert = getTrackCertification(
                                    t.realPlays
                                  );
                                  return (
                                    <div
                                      key={t.id}
                                      onClick={() =>
                                        handlePlayOrToggleSpecificTrack(
                                          albumIndex,
                                          trackIndex
                                        )
                                      }
                                      className="group relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 cursor-pointer transition-transform active:scale-[0.99]"
                                    >
                                      <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                                        <CoverArtwork
                                          artworkType={t.artworkType}
                                          coverUrl={t.cover}
                                          title={t.title}
                                          artist={t.artist}
                                        />
                                      </div>
                                      <div
                                        className="absolute inset-0"
                                        style={{
                                          background: `linear-gradient(to top, rgba(0,0,0,0.92) 15%, ${
                                            t.ambientPrimary || '#e11d38'
                                          }55 60%, rgba(0,0,0,0.2) 100%)`,
                                        }}
                                      />
                                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                        <CertificationBadgeSvg
                                          cert={tCert}
                                          compact
                                          entityTitle={t.title}
                                          entityArtist={t.artist}
                                          playsCount={t.realPlays}
                                        />
                                        <span className="w-9 h-9 rounded-full bg-[#e11d38] text-white flex items-center justify-center font-bold text-xs shadow-lg">
                                          {isThisPlaying ? (
                                            <Pause className="w-4 h-4 fill-current" />
                                          ) : (
                                            <Play className="w-4 h-4 fill-current ml-0.5" />
                                          )}
                                        </span>
                                      </div>
                                      <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className="text-base font-extrabold text-white truncate drop-shadow">
                                            {t.title}
                                          </p>
                                          <p className="text-xs text-amber-300 font-bold truncate">
                                            {t.artist}
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openUserTrackSheet(t.id);
                                          }}
                                          className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 border border-white/20 text-[10px] font-bold text-white shrink-0"
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

                          {/* PLEINE PAGE 4 : TOUS LES ARTISTES EN CERCLES */}
                          {centralFullPageView.type === 'ARTISTS_CIRCLES' && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-2">
                              {decoupledStudioRankings
                                .filter((ent) => ent.role === 'ARTIST')
                                .map((ent) => (
                                  <button
                                    key={ent.key}
                                    type="button"
                                    onClick={() =>
                                      openUserEntitySheet(ent.name, 'ARTIST')
                                    }
                                    className="flex flex-col items-center gap-2 group"
                                  >
                                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] group-hover:scale-105 transition-transform">
                                      <CoverArtwork
                                        artworkType={ent.artworkType}
                                        coverUrl={ent.cover}
                                        title={ent.name}
                                        artist={ent.name}
                                      />
                                    </div>
                                    <span className="text-xs sm:text-sm font-extrabold text-white truncate max-w-full">
                                      {ent.name}
                                    </span>
                                  </button>
                                ))}
                            </div>
                          )}

                          {/* PLEINE PAGE 5 : PROJETS & ALBUMS */}
                          {centralFullPageView.type === 'ALBUMS' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {analyticsCatalogue.map((alb, aIdx) => {
                                const firstTrack = alb.tracks[0];
                                const albPlays = alb.tracks.reduce(
                                  (acc, t) => acc + t.realPlays,
                                  0
                                );
                                const albCert = getAlbumCertification(albPlays);
                                return (
                                  <div
                                    key={alb.id}
                                    onClick={() =>
                                      handlePlayOrToggleSpecificTrack(aIdx, 0)
                                    }
                                    className="group relative aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 cursor-pointer transition-transform active:scale-[0.98]"
                                  >
                                    <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                                      <CoverArtwork
                                        artworkType={firstTrack.artworkType}
                                        coverUrl={firstTrack.cover}
                                        title={alb.albumTitle}
                                        artist={alb.artist}
                                      />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                                      <CertificationBadgeSvg
                                        cert={albCert}
                                        compact
                                        entityTitle={alb.albumTitle}
                                        entityArtist={alb.artist}
                                        playsCount={albPlays}
                                      />
                                      <span className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-lg">
                                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                      </span>
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3">
                                      <p className="text-sm font-extrabold text-white truncate drop-shadow">
                                        {alb.albumTitle}
                                      </p>
                                      <p className="text-xs text-amber-300 font-semibold truncate">
                                        {alb.artist}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* =========================================================== */
                        /* FLUX PRINCIPAL AÉRÉ « CENTRAL » (GÉOMÉTRIES ALTERNÉES)      */
                        /* =========================================================== */
                        <>
                          {/* BANNIÈRE SLIDESHOW PUBLICITAIRE HAUT (IMAGE PURE, GÉRÉE DANS ADMIN) */}
                          <CentralAdSlideshowBanner
                            position="TOP"
                            slides={adBanners}
                            settings={adBannerSettings}
                            onSelectTrackId={(tId) => {
                              const found = allTracksFlat.find(
                                (m) => m.track.id === tId
                              );
                              if (found) {
                                handlePlayOrToggleSpecificTrack(
                                  found.albumIndex,
                                  found.trackIndex
                                );
                              }
                            }}
                            onSelectAlbumId={(albId) => {
                              const albIdx = analyticsCatalogue.findIndex(
                                (a) => a.id === albId
                              );
                              if (albIdx >= 0) {
                                onSelectAlbumIndex(albIdx, 0, false);
                                setActiveModal('NONE');
                              }
                            }}
                          />

                          {/* 1. RANGÉE CARRÉE DÉFILANTE : CATÉGORIES MÉTIERS & GENRES */}
                          <section className="space-y-2.5">
                            <div className="flex items-center justify-between px-0.5">
                              <h3 className="text-sm font-extrabold text-white tracking-tight">
                                Catégories &amp; Métiers
                              </h3>
                              <button
                                type="button"
                                onClick={() =>
                                  setCentralFullPageView({
                                    type: 'ROLE',
                                    role: 'ALL',
                                    title: 'Toutes les Catégories & Métiers',
                                    accentColor: '#f59e0b',
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-xs font-semibold text-zinc-300 hover:text-white transition"
                              >
                                <span>Tout voir</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3 overflow-x-auto pb-1.5 no-scrollbar">
                              {(
                                [
                                  {
                                    id: 'ARTIST' as StudioEntityRole,
                                    title: 'Artistes & Feats',
                                    color: '#f59e0b',
                                    cover:
                                      allTracksFlat[0]?.track.cover || '',
                                    artworkType:
                                      allTracksFlat[0]?.track.artworkType,
                                  },
                                  {
                                    id: 'BEATMAKER' as StudioEntityRole,
                                    title: 'Beatmakers',
                                    color: '#10b981',
                                    cover:
                                      allTracksFlat[1]?.track.cover ||
                                      allTracksFlat[0]?.track.cover ||
                                      '',
                                    artworkType:
                                      allTracksFlat[1]?.track.artworkType,
                                  },
                                  {
                                    id: 'LYRICIST' as StudioEntityRole,
                                    title: 'Paroliers',
                                    color: '#8b5cf6',
                                    cover:
                                      allTracksFlat[2]?.track.cover ||
                                      allTracksFlat[0]?.track.cover ||
                                      '',
                                    artworkType:
                                      allTracksFlat[2]?.track.artworkType,
                                  },
                                  {
                                    id: 'ENGINEER' as StudioEntityRole,
                                    title: 'Ingés du Son',
                                    color: '#06b6d4',
                                    cover:
                                      allTracksFlat[3]?.track.cover ||
                                      allTracksFlat[0]?.track.cover ||
                                      '',
                                    artworkType:
                                      allTracksFlat[3]?.track.artworkType,
                                  },
                                  {
                                    id: 'LABEL' as StudioEntityRole,
                                    title: 'Labels',
                                    color: '#e11d38',
                                    cover:
                                      allTracksFlat[4]?.track.cover ||
                                      allTracksFlat[0]?.track.cover ||
                                      '',
                                    artworkType:
                                      allTracksFlat[4]?.track.artworkType,
                                  },
                                ] as const
                              ).map((catCard) => (
                                <button
                                  key={catCard.id}
                                  type="button"
                                  onClick={() =>
                                    setCentralFullPageView({
                                      type: 'ROLE',
                                      role: catCard.id,
                                      title: catCard.title,
                                      accentColor: catCard.color,
                                    })
                                  }
                                  className="group relative w-32 h-32 sm:w-36 sm:h-36 aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-white/40 shrink-0 text-left transition-transform active:scale-95 shadow-lg"
                                >
                                  <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-300">
                                    <CoverArtwork
                                      artworkType={catCard.artworkType}
                                      coverUrl={catCard.cover}
                                      title={catCard.title}
                                      artist={catCard.title}
                                    />
                                  </div>
                                  <div
                                    className="absolute inset-0"
                                    style={{
                                      background: `linear-gradient(145deg, ${catCard.color}66 0%, rgba(0,0,0,0.88) 90%)`,
                                    }}
                                  />
                                  <span
                                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-black font-extrabold text-xs shadow"
                                    style={{ backgroundColor: catCard.color }}
                                  >
                                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </span>
                                  <div className="absolute bottom-3 left-3 right-3">
                                    <span className="text-sm sm:text-base font-extrabold text-white leading-tight block drop-shadow">
                                      {catCard.title}
                                    </span>
                                  </div>
                                </button>
                              ))}

                              {/* Cartes carrées des Genres musicaux à la suite dans le défilement */}
                              {availableGenres.map((genre, gIdx) => {
                                const genreTrack =
                                  allTracksFlat.find(
                                    (m) => m.track.category === genre
                                  )?.track || allTracksFlat[0]?.track;
                                const palette = [
                                  '#e11d38',
                                  '#f59e0b',
                                  '#10b981',
                                  '#8b5cf6',
                                  '#06b6d4',
                                ];
                                const gColor = palette[gIdx % palette.length];
                                return (
                                  <button
                                    key={genre}
                                    type="button"
                                    onClick={() =>
                                      setCentralFullPageView({
                                        type: 'GENRE',
                                        genre,
                                        title: genre,
                                        accentColor: gColor,
                                      })
                                    }
                                    className="group relative w-32 h-32 sm:w-36 sm:h-36 aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-white/40 shrink-0 text-left transition-transform active:scale-95 shadow-lg"
                                  >
                                    {genreTrack && (
                                      <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-300">
                                        <CoverArtwork
                                          artworkType={genreTrack.artworkType}
                                          coverUrl={genreTrack.cover}
                                          title={genre}
                                          artist={genreTrack.artist}
                                        />
                                      </div>
                                    )}
                                    <div
                                      className="absolute inset-0"
                                      style={{
                                        background: `linear-gradient(145deg, ${gColor}66 0%, rgba(0,0,0,0.9) 90%)`,
                                      }}
                                    />
                                    <span
                                      className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-black font-extrabold text-xs shadow"
                                      style={{ backgroundColor: gColor }}
                                    >
                                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </span>
                                    <div className="absolute bottom-3 left-3 right-3">
                                      <span className="text-sm sm:text-base font-extrabold text-white leading-tight block drop-shadow">
                                        {genre}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </section>

                          {/* 2. RANGÉE RECTANGULAIRE PANORAMIQUE (16:9) : DROPS EN VEDETTE */}
                          <section className="space-y-2.5">
                            <div className="flex items-center justify-between px-0.5">
                              <h3 className="text-sm font-extrabold text-white tracking-tight">
                                Drops en Vedette
                              </h3>
                              <button
                                type="button"
                                onClick={() =>
                                  setCentralFullPageView({
                                    type: 'DROPS',
                                    title: 'Tous les Drops en Vedette',
                                    accentColor: '#e11d38',
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-xs font-semibold text-zinc-300 hover:text-white transition"
                              >
                                <span>Tout voir</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3.5 overflow-x-auto pb-1.5 no-scrollbar">
                              {allTracksFlat.map(
                                ({ track: t, albumIndex, trackIndex }, idx) => {
                                  const isThisPlaying =
                                    currentTrack.id === t.id && isPlaying;
                                  const tCert = getTrackCertification(
                                    t.realPlays
                                  );
                                  const accentColors = [
                                    '#e11d38',
                                    '#f59e0b',
                                    '#8b5cf6',
                                    '#10b981',
                                    '#06b6d4',
                                  ];
                                  const cardColor =
                                    t.ambientPrimary ||
                                    accentColors[idx % accentColors.length];

                                  return (
                                    <div
                                      key={t.id}
                                      onClick={() =>
                                        handlePlayOrToggleSpecificTrack(
                                          albumIndex,
                                          trackIndex
                                        )
                                      }
                                      className="group relative w-64 sm:w-72 aspect-[16/9] rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 shrink-0 cursor-pointer transition-transform active:scale-[0.98] shadow-xl"
                                    >
                                      <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                                        <CoverArtwork
                                          artworkType={t.artworkType}
                                          coverUrl={t.cover}
                                          title={t.title}
                                          artist={t.artist}
                                        />
                                      </div>
                                      <div
                                        className="absolute inset-0"
                                        style={{
                                          background: `linear-gradient(to top, rgba(0,0,0,0.92) 12%, ${cardColor}55 58%, rgba(0,0,0,0.18) 100%)`,
                                        }}
                                      />

                                      <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between">
                                        <CertificationBadgeSvg
                                          cert={tCert}
                                          compact
                                          entityTitle={t.title}
                                          entityArtist={t.artist}
                                          playsCount={t.realPlays}
                                        />
                                        <span className="w-8 h-8 rounded-full bg-[#e11d38] text-white flex items-center justify-center font-bold text-xs shadow-lg">
                                          {isThisPlaying ? (
                                            <Pause className="w-4 h-4 fill-current" />
                                          ) : (
                                            <Play className="w-4 h-4 fill-current ml-0.5" />
                                          )}
                                        </span>
                                      </div>

                                      {/* Titre court directement sur la carte rectangulaire */}
                                      <div className="absolute bottom-3 left-3.5 right-3.5">
                                        <p className="text-sm sm:text-base font-extrabold text-white truncate drop-shadow">
                                          {t.title}
                                        </p>
                                        <p className="text-xs font-bold text-amber-300 truncate">
                                          {t.artist}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </section>

                          {/* 2-BIS. RANGÉE SPÉCIALE : BEATS & INSTRUMENTALES TÉLÉCHARGEABLES */}
                          {allTracksFlat.some(
                            ({ track }) =>
                              track.isInstrumental ||
                              track.category === 'Beats & Instrumentales'
                          ) && (
                            <section className="space-y-2.5">
                              <div className="flex items-center justify-between px-0.5">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-extrabold text-cyan-300 tracking-tight">
                                    Beats &amp; Instrumentales
                                  </h3>
                                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 text-[9px] font-mono font-bold">
                                    Téléchargement Direct
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCentralFullPageView({
                                      type: 'GENRE',
                                      genre: 'Beats & Instrumentales',
                                      title: 'Beats & Instrumentales',
                                      accentColor: '#06b6d4',
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-400 hover:text-black text-[11px] font-bold text-cyan-300 transition"
                                >
                                  + Voir tous les Beats
                                </button>
                              </div>

                              <div className="flex items-center gap-3.5 overflow-x-auto pb-1.5 no-scrollbar">
                                {allTracksFlat
                                  .filter(
                                    ({ track }) =>
                                      track.isInstrumental ||
                                      track.category ===
                                        'Beats & Instrumentales'
                                  )
                                  .map(({ track: t, albumIndex, trackIndex }) => {
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
                                        className="group relative w-64 sm:w-72 rounded-2xl overflow-hidden border border-cyan-400/35 hover:border-cyan-300 bg-zinc-900/90 p-3 shrink-0 cursor-pointer transition-transform active:scale-[0.98] shadow-xl flex flex-col justify-between gap-2.5"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/15 shrink-0">
                                            <CoverArtwork
                                              artworkType={t.artworkType}
                                              coverUrl={t.cover}
                                              title={t.title}
                                              artist={t.artist}
                                            />
                                            <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-white font-bold text-xs">
                                              {isThisPlaying ? (
                                                <Pause className="w-4 h-4 fill-current" />
                                              ) : (
                                                <Play className="w-4 h-4 fill-current ml-0.5" />
                                              )}
                                            </span>
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm font-extrabold text-white truncate">
                                              {t.title}
                                            </p>
                                            <p className="text-[11px] text-cyan-300 font-bold truncate">
                                              Prod. {t.beatmakerName || t.artist}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 text-[9px] font-mono font-bold">
                                                {t.bpm || 120} BPM
                                              </span>
                                              {t.musicalKey && (
                                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-200 text-[9px] font-mono font-bold">
                                                  {t.musicalKey}
                                                </span>
                                              )}
                                              <span className="text-[9px] font-mono text-emerald-300/90 truncate">
                                                {t.dropContentId}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              triggerBeatAudioDownload({
                                                title: t.title,
                                                artist: t.artist,
                                                bpm: t.bpm,
                                                duration: t.duration,
                                                audioUrl: t.audioUrl,
                                                dropContentId: t.dropContentId,
                                              });
                                              showToast(
                                                `Téléchargement du Beat « ${t.title} » lancé !`,
                                                'bg-cyan-400'
                                              );
                                            }}
                                            className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md transition"
                                          >
                                            <span>⬇</span>
                                            <span>Télécharger le Beat</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openUserTrackSheet(t.id);
                                            }}
                                            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition"
                                          >
                                            Fiche
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </section>
                          )}

                          {/* 3. RANGÉE CIRCULAIRE : ARTISTES & TALENTS */}
                          <section className="space-y-2.5">
                            <div className="flex items-center justify-between px-0.5">
                              <h3 className="text-sm font-extrabold text-white tracking-tight">
                                Artistes &amp; Talents
                              </h3>
                              <button
                                type="button"
                                onClick={() =>
                                  setCentralFullPageView({
                                    type: 'ARTISTS_CIRCLES',
                                    title: 'Tous les Artistes & Talents',
                                    accentColor: '#f59e0b',
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-xs font-semibold text-zinc-300 hover:text-white transition"
                              >
                                <span>Tout voir</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-4 overflow-x-auto pb-1.5 no-scrollbar">
                              {decoupledStudioRankings
                                .filter((ent) => ent.role === 'ARTIST')
                                .map((ent, idx) => {
                                  const ringColors = [
                                    'border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.3)]',
                                    'border-[#e11d38] shadow-[0_0_16px_rgba(225,29,56,0.3)]',
                                    'border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.3)]',
                                    'border-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.3)]',
                                    'border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.3)]',
                                  ];
                                  return (
                                    <button
                                      key={ent.key}
                                      type="button"
                                      onClick={() =>
                                        openUserEntitySheet(ent.name, 'ARTIST')
                                      }
                                      className="flex flex-col items-center gap-1.5 shrink-0 w-24 group"
                                    >
                                      <div
                                        className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 transition-transform group-hover:scale-105 ${
                                          ringColors[idx % ringColors.length]
                                        }`}
                                      >
                                        <CoverArtwork
                                          artworkType={ent.artworkType}
                                          coverUrl={ent.cover}
                                          title={ent.name}
                                          artist={ent.name}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                      </div>
                                      <span className="text-xs font-extrabold text-white truncate max-w-full">
                                        {ent.name}
                                      </span>
                                    </button>
                                  );
                                })}
                            </div>
                          </section>

                          {/* 4. RANGÉE CARRÉE COLORÉE : MES PLAYLISTS & FAVORIS */}
                          <section className="space-y-2.5">
                            <div className="flex items-center justify-between px-0.5">
                              <h3 className="text-sm font-extrabold text-white tracking-tight">
                                Mes Playlists &amp; Favoris
                              </h3>
                              <button
                                type="button"
                                onClick={() => setHubTab('PROFIL')}
                                className="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-emerald-400 hover:text-black text-[11px] font-bold text-emerald-300 transition"
                              >
                                + Gérer dans Mon Profil
                              </button>
                            </div>

                            <div className="flex items-center gap-3 overflow-x-auto pb-1.5 no-scrollbar">
                              {/* Carte Carrée Spéciale : Mes Likes ♥ */}
                              <button
                                type="button"
                                onClick={() => setHubTab('PROFIL')}
                                className="group relative w-32 h-32 sm:w-36 sm:h-36 aspect-square rounded-2xl overflow-hidden border border-rose-400/40 shrink-0 text-left transition-transform active:scale-95 shadow-lg"
                                style={{
                                  background:
                                    'linear-gradient(135deg, #e11d38 0%, #4c0519 100%)',
                                }}
                              >
                                <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">
                                  ♥
                                </span>
                                <div className="absolute bottom-3 left-3 right-3">
                                  <span className="text-sm sm:text-base font-extrabold text-white block leading-tight">
                                    Mes Likes
                                  </span>
                                  <span className="text-[11px] text-rose-100/90 font-mono">
                                    {
                                      Object.values(likedTrackIds).filter(
                                        Boolean
                                      ).length
                                    }{' '}
                                    titres
                                  </span>
                                </div>
                              </button>

                              {/* Cartes Carrées des Playlists de l'utilisateur */}
                              {playlists.map((pl) => {
                                const firstMatch = allTracksFlat.find((m) =>
                                  pl.trackIds.includes(m.track.id)
                                );
                                return (
                                  <button
                                    key={pl.id}
                                    type="button"
                                    onClick={() => {
                                      if (firstMatch) {
                                        handlePlayOrToggleSpecificTrack(
                                          firstMatch.albumIndex,
                                          firstMatch.trackIndex
                                        );
                                      } else {
                                        setHubTab('PROFIL');
                                      }
                                    }}
                                    className="group relative w-32 h-32 sm:w-36 sm:h-36 aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 shrink-0 text-left transition-transform active:scale-95 shadow-lg"
                                    style={{
                                      background: `linear-gradient(135deg, ${
                                        pl.colorTheme || '#f59e0b'
                                      } 0%, #090b10 95%)`,
                                    }}
                                  >
                                    {firstMatch && (
                                      <div className="absolute inset-0 opacity-65 group-hover:scale-110 transition-transform duration-300">
                                        <CoverArtwork
                                          artworkType={
                                            firstMatch.track.artworkType
                                          }
                                          coverUrl={firstMatch.track.cover}
                                          title={pl.name}
                                          artist={firstMatch.track.artist}
                                        />
                                      </div>
                                    )}
                                    <div
                                      className="absolute inset-0"
                                      style={{
                                        background: `linear-gradient(to top, rgba(0,0,0,0.9) 12%, ${
                                          pl.colorTheme || '#f59e0b'
                                        }55 55%, rgba(0,0,0,0.2) 100%)`,
                                      }}
                                    />
                                    <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center text-xs font-bold shadow">
                                      <Play className="w-3 h-3 fill-current ml-0.5" />
                                    </span>
                                    <div className="absolute bottom-3 left-3 right-3">
                                      <span className="text-sm font-extrabold text-white truncate block drop-shadow">
                                        {pl.name}
                                      </span>
                                      <span className="text-[10px] text-white/80 font-mono">
                                        {pl.trackIds.length} titre
                                        {pl.trackIds.length > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </section>

                          {/* 5. RANGÉE PROJETS & ALBUMS EN CARTES COLORÉES */}
                          <section className="space-y-2.5">
                            <div className="flex items-center justify-between px-0.5">
                              <h3 className="text-sm font-extrabold text-white tracking-tight">
                                Projets &amp; Albums
                              </h3>
                              <button
                                type="button"
                                onClick={() =>
                                  setCentralFullPageView({
                                    type: 'ALBUMS',
                                    title: 'Tous les Projets & Albums',
                                    accentColor: '#06b6d4',
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-xs font-semibold text-zinc-300 hover:text-white transition"
                              >
                                <span>Tout voir</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {analyticsCatalogue.map((alb, aIdx) => {
                                const firstTrack = alb.tracks[0];
                                const albPlays = alb.tracks.reduce(
                                  (acc, t) => acc + t.realPlays,
                                  0
                                );
                                const albCert = getAlbumCertification(albPlays);
                                return (
                                  <div
                                    key={alb.id}
                                    onClick={() =>
                                      handlePlayOrToggleSpecificTrack(aIdx, 0)
                                    }
                                    className="group relative aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 cursor-pointer transition-transform active:scale-[0.98] shadow-lg"
                                  >
                                    <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                                      <CoverArtwork
                                        artworkType={firstTrack.artworkType}
                                        coverUrl={firstTrack.cover}
                                        title={alb.albumTitle}
                                        artist={alb.artist}
                                      />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
                                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                                      <CertificationBadgeSvg
                                        cert={albCert}
                                        compact
                                        entityTitle={alb.albumTitle}
                                        entityArtist={alb.artist}
                                        playsCount={albPlays}
                                      />
                                      <span className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center text-xs font-bold shadow">
                                        <Play className="w-3 h-3 fill-current ml-0.5" />
                                      </span>
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3">
                                      <p className="text-sm font-extrabold text-white truncate drop-shadow">
                                        {alb.albumTitle}
                                      </p>
                                      <p className="text-xs text-amber-300 font-semibold truncate">
                                        {alb.artist}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </section>

                          {/* BANNIÈRE SLIDESHOW PUBLICITAIRE BAS (TOUT EN BAS APRÈS LES CONTENUS) */}
                          <CentralAdSlideshowBanner
                            position="BOTTOM"
                            slides={adBanners}
                            settings={adBannerSettings}
                            onSelectTrackId={(tId) => {
                              const found = allTracksFlat.find(
                                (m) => m.track.id === tId
                              );
                              if (found) {
                                handlePlayOrToggleSpecificTrack(
                                  found.albumIndex,
                                  found.trackIndex
                                );
                              }
                            }}
                            onSelectAlbumId={(albId) => {
                              const albIdx = analyticsCatalogue.findIndex(
                                (a) => a.id === albId
                              );
                              if (albIdx >= 0) {
                                onSelectAlbumIndex(albIdx, 0, false);
                                setActiveModal('NONE');
                              }
                            }}
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* ONGLET 2 : CLASSEMENTS ÉPURÉS (SANS JARGON TECHNIQUE) */}
                  {hubTab === 'RANGS' && (
                    <div className="space-y-3.5 animate-fade-in">
                      {/* Sélecteur de Période (7j / 30j / Annuel) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-2.5">
                        <span className="text-xs font-bold text-white px-1">
                          Classements Officiels
                        </span>
                        <div className="flex items-center gap-1">
                          {(
                            [
                              { id: 'WEEKLY_7D', label: '7 Jours' },
                              { id: 'MONTHLY_30D', label: '30 Jours' },
                              { id: 'ANNUAL_365D', label: 'Annuel' },
                            ] as { id: ChartTimeframe; label: string }[]
                          ).map((tf) => (
                            <button
                              key={tf.id}
                              type="button"
                              onClick={() => setChartTimeframe(tf.id)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition ${
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

                      {/* Onglets par catégorie de classement (libellés simples pour les utilisateurs) */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {(
                          [
                            { id: 'ALL', label: 'Top Chansons' },
                            { id: 'ARTIST', label: 'Top Artistes' },
                            { id: 'BEATMAKER', label: 'Top Beatmakers' },
                            { id: 'ENGINEER', label: 'Top Ingénieurs Son' },
                            { id: 'LYRICIST', label: 'Top Auteurs' },
                            { id: 'LABEL', label: 'Top Labels' },
                            { id: 'CATEGORY', label: 'Par Genre' },
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
                                          {isThisPlaying ? (
                                            <Pause className="w-3.5 h-3.5 fill-current" />
                                          ) : (
                                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                          )}
                                        </span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <p className="text-xs font-bold text-white truncate">
                                            {t.title}
                                          </p>
                                          <CertificationBadgeSvg
                                            cert={cert}
                                            compact
                                          />
                                          {explosion.decayPenaltyPct > 0 && (
                                            <span className="px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/35 text-rose-300 text-[9px] font-mono shrink-0">
                                              Usure : -{explosion.decayPenaltyPct}%
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-zinc-400 truncate">
                                          {t.artist}
                                          {t.featuringArtists &&
                                          t.featuringArtists.length > 0
                                            ? ` feat. ${t.featuringArtists.join(', ')}`
                                            : ''}{' '}
                                          • {formatCompactPlays(t.realPlays)} ECG
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
                                        {explosion.explosionScore} pts
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openUserTrackSheet(t.id);
                                        }}
                                        className="w-7 h-7 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-white/10 flex items-center justify-center transition"
                                        title="Ouvrir la fiche analytique"
                                        aria-label={`Ouvrir la fiche analytique de ${t.title}`}
                                      >
                                        <ChevronRight className="w-4 h-4" />
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
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-mono text-[10.5px]">
                                <span>Conflit d&apos;intérêts : 0 détecté</span>
                                <Check className="w-3.5 h-3.5" />
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
                                              <span className="font-mono text-white font-semibold inline-flex items-center gap-1.5">
                                                {isPlayingThis ? (
                                                  <Pause className="w-3.5 h-3.5 fill-current" />
                                                ) : (
                                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                                )}
                                                <span>{tp.slotLabel} ({tp.genre})</span>
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
                          <div className="flex items-center gap-2 mb-0.5">
                            <DropOfficialLogo className="h-[15px] w-auto max-w-[70px]" />
                            <h3 className="text-sm font-bold text-white">
                              Fil Commun des Recommandations
                            </h3>
                          </div>
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
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#e11d38] text-white text-[11px] font-bold shrink-0">
                                  <span>Écouter</span>
                                  <Play className="w-3 h-3 fill-current ml-0.5" />
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

                  {/* ONGLET 6 : MON PROFIL, BIBLIOTHÈQUE PERSONNELLE (PLAYLISTS, LIKES, FAVORIS, ÉCOUTES) & PASS MOBILE MONEY */}
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
                      userPlaylists={playlists}
                      onCreatePlaylist={handleCreatePlaylist}
                      onDeletePlaylist={handleDeletePlaylist}
                      onToggleTrackInPlaylist={handleToggleTrackInPlaylist}
                      likedTrackIds={likedTrackIds}
                      onToggleLike={onToggleLike}
                      subscribedArtists={subscribedArtists}
                      onToggleSubscribeArtist={onToggleSubscribeArtist}
                      onOpenEntityProfile={(name, role) =>
                        openUserEntitySheet(name, role)
                      }
                      onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
                      onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                    />
                  )}
                </>
              )}
            </div>

            {/* PILE FIXE EN BAS : BARRE DE RECHERCHE + MINI-LECTEUR EMPILÉS JUSTE AU-DESSUS DU MENU BAS MOBILE FIXE */}
            <div className="pt-2.5 space-y-2.5 shrink-0 border-t border-white/10 bg-zinc-950/98">
              {/* 1. Mini-Lecteur Synchronisé */}
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

              {/* 2. Barre de Recherche Instantanée */}
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-amber-400 absolute left-3.5 pointer-events-none stroke-[2.4]" />
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
                  placeholder="Rechercher un titre, artiste, genre, label, beatmaker..."
                  className="w-full pl-10 pr-20 py-2.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.1] focus:bg-zinc-900 border border-white/15 focus:border-amber-400 text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none shadow-lg transition"
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
                      className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
                      aria-label="Effacer la recherche"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* 3. MENU BAS MOBILE FIXE SUR CENTRAL (Awards masqué tant qu'il n'est pas activé par les Admins) */}
              <nav
                aria-label="Navigation principale Central"
                className={`grid ${
                  enableAwardsCeremony ? 'grid-cols-5' : 'grid-cols-4'
                } gap-1 pt-1.5 pb-0.5 border-t border-white/10`}
              >
                {(
                  [
                    {
                      id: 'EXPLORER',
                      label: 'Explorer',
                      icon: <Compass className="w-4 h-4 stroke-[2]" />,
                    },
                    {
                      id: 'RANGS',
                      label: 'Classements',
                      icon: <ChartNoAxesColumn className="w-4 h-4 stroke-[2]" />,
                    },
                    ...(enableAwardsCeremony
                      ? [
                          {
                            id: 'AWARDS' as const,
                            label: 'Awards',
                            icon: <Trophy className="w-4 h-4 stroke-[2]" />,
                          },
                        ]
                      : []),
                    {
                      id: 'RECOS',
                      label: 'Fil Recos',
                      icon: <MessageCircle className="w-4 h-4 stroke-[2]" />,
                    },
                    {
                      id: 'PROFIL',
                      label: 'Mon Profil',
                      icon: <UserRound className="w-4 h-4 stroke-[2]" />,
                    },
                  ] as const
                ).map((item) => {
                  const isActive =
                    hubTab === item.id &&
                    !instantSearchResults &&
                    !hasOpenAnalyticsSheet;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        closeAllAnalyticsSheets();
                        setCentralFullPageView(null);
                        setHubSearchQuery('');
                        setHubTab(item.id);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition ${
                        isActive
                          ? 'bg-[#e11d38] text-white font-bold shadow-[0_4px_12px_rgba(225,29,56,0.4)]'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      {item.icon}
                      <span className="text-[10px] leading-none truncate max-w-full">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* 6. OVERLAY ANALYTIQUE DIRECT DEPUIS LE LECTEUR 3D */}
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
                  userPlaylists={playlists}
                  onCreatePlaylist={handleCreatePlaylist}
                  onDeletePlaylist={handleDeletePlaylist}
                  onToggleTrackInPlaylist={handleToggleTrackInPlaylist}
                  likedTrackIds={likedTrackIds}
                  onToggleLike={onToggleLike}
                  subscribedArtists={subscribedArtists}
                  onToggleSubscribeArtist={onToggleSubscribeArtist}
                  onOpenEntityProfile={(name, role) =>
                    openUserEntitySheet(name, role)
                  }
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

      {/* STUDIO TREND VIDÉO 30S (AFFICHE DE MAGAZINE POP STAR) — ACCESSIBLE DEPUIS LE LECTEUR PRINCIPAL */}
      <DropTrendMagazineStudio
        track={{
          id: currentTrack.id,
          title: currentTrack.title,
          artist: currentTrack.artist,
          featuring: currentTrack.featuringArtists,
          featuringSplitMode: currentTrack.featuringSplitMode,
          album: currentTrack.album,
          category: currentTrack.category,
          labelName: currentTrack.labelName,
          copyrightText: currentTrack.copyrightText,
          beatmakerName: currentTrack.beatmakerName || 'Beatmaker',
          soundEngineerName:
            currentTrack.soundEngineerName || 'Ingénieur du son',
          lyricistName: currentTrack.lyricistName,
          isInstrumental: currentTrack.isInstrumental,
          audioCodec: currentTrack.audioCodec || 'OPUS',
          audioUrl: currentTrack.audioUrl,
          cover: currentTrack.cover,
          artworkType: currentTrack.artworkType,
          ambientPrimary: currentTrack.ambientPrimary || '#e11d38',
          ambientSecondary: currentTrack.ambientSecondary || '#f59e0b',
          duration: currentTrack.duration,
          dropStart: currentTrack.dropStart,
          dropDuration: currentTrack.dropDuration,
          bpm: currentTrack.bpm || 124,
          synthNotes: currentTrack.synthNotes || [110, 146.83, 164.81, 196, 220],
          realPlays: currentTrack.realPlays,
          lastActivityAgo: currentTrack.lastActivityAgo,
          totalListenSeconds: currentTrack.totalListenSeconds || 0,
          listenSessions: currentTrack.listenSessions || 0,
          avgRetentionPct: currentTrack.avgRetentionPct || 85,
          algoPoints: currentTrack.algoPoints || 0,
          likesCount: currentTrack.likesCount || 0,
          loopPlaysCount: currentTrack.loopPlaysCount || 0,
          longevityDays: currentTrack.longevityDays || 1,
          consecutiveLoops: currentTrack.consecutiveLoops || 0,
          baselineRank: currentTrack.baselineRank || 1,
        }}
        isOpen={showTrendStudioModal}
        onClose={() => setShowTrendStudioModal(false)}
        onPauseMainPlayer={() => {
          if (isPlaying) {
            onForceStopPlay ? onForceStopPlay() : onTogglePlay();
          }
        }}
      />
    </div>
  );
};
