import React, { useState, useEffect, useMemo } from 'react';
import { Lock } from 'lucide-react';
import { ArtworkType } from '../CoverArtwork';
import {
  SyncStatusSnapshot,
  GabonSubscriptionPass,
  GabonNetworkOperator,
} from '../../services/offlineStreamTracker';
import {
  AdBannerSlide,
  AdBannerSettings,
  generateDropContentId,
  computeDeterministicWaveformPeaks,
} from '../../services/musicService';
import {
  AnalyticsTrackItem,
  AnalyticsAppUser,
} from '../ReusableAnalyticsSheets';
import {
  FeaturingSplitMode,
  TrackCreditHandshake,
  CommunityRecommendationItem,
} from '../../utils/rankingEngine';
import type { RoyaltySettings } from '../../features/economics/economicConfig';
import type { RightsLine } from '../../features/economics/rightsSplitEngine';
import type { PayoutStatement } from '../../features/economics/payoutEngine';

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
  eqBypassed?: boolean;
  preampDb?: number;
  eqQFactor?: number;
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
  onToggleEqBypass?: () => void;
  onChangePreampDb?: (db: number) => void;
  onChangeEqQFactor?: (q: number) => void;
  getAudioSpectrumData?: () => {
    bins: Uint8Array;
    rmsDb: number;
    peakDb: number;
  } | null;
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
  rightsLines?: RightsLine[];
  payoutStatements?: PayoutStatement[];
  royaltySettings?: RoyaltySettings;
}

export const CentralAdSlideshowBanner: React.FC<{
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
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#07090E]/45 backdrop-blur-sm z-10"
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

export function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? '0' : ''}${rem}`;
}

export function formatCompactPlays(realPlays: number, preset?: string): string {
  if (preset && realPlays <= 76000) return preset;
  if (realPlays >= 1000000) return `${(realPlays / 1000000).toFixed(2).replace(/\.00$/, '')}M`;
  if (realPlays >= 1000) return `${Math.round(realPlays / 1000)}K`;
  return String(realPlays);
}

export function getArtworkDominantColors(artworkType?: ArtworkType): {
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

export function normalizeSearchStr(str?: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function highlightMatchedText(
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

export function normalizeToAnalyticsTrack(t: PlayerTrackItem): AnalyticsTrackItem {
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

export function ProLockBadgeSvg() {
  return (
    <span
      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-900/95 border border-white/25 flex items-center justify-center text-amber-400 shadow"
      title="Réservé aux comptes DROP Pro"
    >
      <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
    </span>
  );
}

export function PlaylistVectorIcon({
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


