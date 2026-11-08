import type { ArtworkType } from '../../components/CoverArtwork';
import type { LyricLine } from '../../components/Immersive3DPlayer';
import type { FeaturingSplitMode, CreditHandshakeRecord } from '../../utils/rankingEngine';
import type { TrackAnalysis } from '../../features/music-intelligence/types/music-analysis.types';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'PUBLISH' | 'DATABASE' | 'CERTIFICATION' | 'COMMUNITY';
  audience?: 'ADMIN' | 'USER' | 'ALL';
  createdAt: string;
  read: boolean;
  trackId?: string;
}

export interface EntityDatabase {
  artists: string[];
  labels: string[];
  beatmakers: string[];
  engineers: string[];
  lyricists: string[];
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  featuringArtists?: string[];
  featuringSplitMode?: FeaturingSplitMode;
  album: string;
  category: string;
  labelName: string;
  copyrightText?: string;
  beatmakerName: string;
  soundEngineerName: string;
  recordingEngineerName?: string;
  mixingEngineerName?: string;
  masteringEngineerName?: string;
  lyricistName: string;
  isExternalLyricist?: boolean;
  isInstrumental?: boolean;
  audioCodec?: 'OPUS' | 'AAC' | 'WAV';
  hasSynchronizedLyrics?: boolean;
  gabonTerritoryPct?: number;
  weeksInTop10?: number;
  isPreAlbumSingleOver6Months?: boolean;
  lufsMasterLevel?: number;
  acousticClippingDetected?: boolean;
  retention45sPct?: number;
  halfLifeRetentionJ90Pct?: number;
  creditHandshake?: CreditHandshakeRecord;
  cover: string;
  artworkType?: ArtworkType;
  ambientPrimary?: string;
  ambientSecondary?: string;
  notes?: number[];
  lyrics?: LyricLine[];
  duration: number;
  dropStart: number;
  dropDuration: number;
  baseFreq: number;
  bpm: number;
  audioUrl?: string;
  externalStreamId?: string;
  realPlays: number;
  displayPlaysFormatted?: string;
  lastActivityAgo: string;
  totalListenSeconds: number;
  listenSessions: number;
  avgRetentionPct: number;
  retention30sPct: number;
  algoPoints: number;
  likesCount: number;
  loopPlaysCount: number;
  recommendationsCount: number;
  lyricsOpensCount: number;
  lyricsSharesCount: number;
  longevityDays: number;
  consecutiveLoops: number;
  baselineRank: number;
  artistBaselinePlays?: number;
  downloadedOffline?: boolean;
  inPlaylist?: boolean;
  autoDetectedChorus?: boolean;
  dropContentId?: string;
  waveformPeaks?: number[];
  isBeatDownloadable?: boolean;
  musicalKey?: string;
  acousticEnergy?: number;
  grooveScore?: number;
  trackAnalysis?: TrackAnalysis;
}

export interface AlbumNode {
  id: string;
  artist: string;
  albumTitle: string;
  category: string;
  year: string;
  tracks: Track[];
}

export interface UserTrackStat {
  trackId: string;
  listenSeconds: number;
  playsCount: number;
  organicPlaysCount?: number;
  sponsoredPlaysCount?: number;
  loopsCount: number;
  maxConsecutiveLoops: number;
  liked: boolean;
  pointsContributed: number;
  lastListenedAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  joinedAt: string;
  avatar: string;
  totalLikes: number;
  totalListenSeconds: number;
  totalValidatedPlays: number;
  totalOrganicPlays?: number;
  totalSponsoredPlays?: number;
  totalLoops: number;
  trackStats: Record<string, UserTrackStat>;
}

export interface AdminDrmVaultRecord {
  key: CryptoKey | null;
  iv: Uint8Array;
  cipherBytes: Uint8Array;
  corrupted: boolean;
  timestamp: string;
}

