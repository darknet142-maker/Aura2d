import {
  TrackCreditHandshake,
  CommunityRecommendationItem,
  FeaturingSplitMode,
  CertificationInfo,
} from '../../utils/rankingEngine';
import {
  AnalyticsAppUser,
  StudioEntityRole,
} from '../ReusableAnalyticsSheets';
import { ArtworkType } from '../CoverArtwork';
import {
  SyncStatusSnapshot,
  GabonSubscriptionPass,
  GabonNetworkOperator,
} from '../../services/offlineStreamTracker';
import {
  AdBannerSlide,
  AdBannerSettings,
} from '../../services/musicService';

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

export const EQ_BANDS_META = [
  { freq: '60Hz', label: 'Sub-Bass' },
  { freq: '250Hz', label: 'Graves' },
  { freq: '1kHz', label: 'Médiums' },
  { freq: '4kHz', label: 'Présence' },
  { freq: '12kHz', label: 'Air / Aigus' },
];

export type ActivePlayerModal =
  | 'NONE'
  | 'OPTIONS'
  | 'QUEUE'
  | 'PLAYLIST'
  | 'EQ'
  | 'MINI'
  | 'RECOMMEND';

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
