import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Compass,
  Disc,
  Music,
  Shield,
  Users,
  Upload,
  Link2,
  LogOut,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  FolderOpen,
  Edit3,
  ArrowUp,
  ArrowDown,
  Flame,
  Zap,
  X,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Headphones,
  Building2,
  Clock,
  BarChart3,
  Layers,
  Filter,
  Check,
  Wifi,
  WifiOff,
  RefreshCw,
  CloudCheck,
  Database,
  Mic2,
} from 'lucide-react';
import {
  streamTracker,
  SyncStatusSnapshot,
  OfflineStreamEvent,
} from './services/offlineStreamTracker';

// --- Types ---
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  category: string;
  labelName: string;
  beatmakerName: string;
  soundEngineerName: string;
  cover: string;
  duration: number; // en secondes, affiché en MM:SS (ex: 02:42)
  dropStart: number;
  dropDuration: number;
  baseFreq: number;
  bpm: number;
  audioUrl?: string;
  externalStreamId?: string;
  // Métriques calculées silencieusement en arrière-plan
  realPlays: number;
  totalListenSeconds: number;
  listenSessions: number;
  avgRetentionPct: number;
  algoPoints: number;
  likesCount: number;
  loopPlaysCount: number;
  consecutiveLoops: number;
  baselineRank: number; // Rang précédent pour calculer l'évolution (+4, -1, -8...)
  autoDetectedChorus?: boolean;
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
  totalLoops: number;
  trackStats: Record<string, UserTrackStat>;
}

const DEFAULT_CATEGORIES = [
  'Synthwave',
  'Ambient',
  'Electronic',
  'Techno',
  'House',
  'Hip-Hop',
  'Afro-Futurism',
  'Expérimental',
];

// --- Initial Catalogue Data ---
// baselineRank permet d'afficher immédiatement les mouvements (+1, +4, -1, -8...) par rapport au classement actuel
const INITIAL_CATALOGUE: AlbumNode[] = [
  {
    id: 'alb-1',
    artist: 'Klang & Kosh',
    albumTitle: 'Architecture Infinie',
    category: 'Synthwave',
    year: '2025',
    tracks: [
      {
        id: 't-101',
        title: 'Néon Brutaliste',
        artist: 'Klang & Kosh',
        album: 'Architecture Infinie',
        category: 'Synthwave',
        labelName: 'Monolith Records',
        beatmakerName: 'Kosh Beats',
        soundEngineerName: 'Soren Vance',
        cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        duration: 194,
        dropStart: 52,
        dropDuration: 30,
        baseFreq: 110,
        bpm: 124,
        realPlays: 48,
        totalListenSeconds: 7850,
        listenSessions: 48,
        avgRetentionPct: 84,
        algoPoints: 18.5,
        likesCount: 19,
        loopPlaysCount: 14,
        consecutiveLoops: 0,
        baselineRank: 7, // Actuellement #3 -> +4 places
      },
      {
        id: 't-102',
        title: 'Béton Nocturne',
        artist: 'Klang & Kosh',
        album: 'Architecture Infinie',
        category: 'Synthwave',
        labelName: 'Monolith Records',
        beatmakerName: 'Kosh Beats',
        soundEngineerName: 'Soren Vance',
        cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        duration: 162, // 02:42
        dropStart: 42,
        dropDuration: 30,
        baseFreq: 98,
        bpm: 122,
        realPlays: 34,
        totalListenSeconds: 4320,
        listenSessions: 34,
        avgRetentionPct: 78,
        algoPoints: 13.25,
        likesCount: 12,
        loopPlaysCount: 9,
        consecutiveLoops: 0,
        baselineRank: 4, // Actuellement #5 -> -1 place
      },
      {
        id: 't-103',
        title: 'Verre Froid',
        artist: 'Klang & Kosh',
        album: 'Architecture Infinie',
        category: 'Synthwave',
        labelName: 'Monolith Records',
        beatmakerName: 'Klang Studio',
        soundEngineerName: 'Soren Vance',
        cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
        duration: 178,
        dropStart: 64,
        dropDuration: 30,
        baseFreq: 130.81,
        bpm: 126,
        realPlays: 19,
        totalListenSeconds: 1850,
        listenSessions: 19,
        avgRetentionPct: 55,
        algoPoints: 6.75,
        likesCount: 6,
        loopPlaysCount: 3,
        consecutiveLoops: 0,
        baselineRank: 9, // Actuellement #8 -> +1 place
      },
    ],
  },
  {
    id: 'alb-2',
    artist: 'Aether Pulse',
    albumTitle: 'Mémoire Magnétique',
    category: 'Ambient',
    year: '2024',
    tracks: [
      {
        id: 't-201',
        title: 'Onde Stationnaire',
        artist: 'Aether Pulse',
        album: 'Mémoire Magnétique',
        category: 'Ambient',
        labelName: 'SubZero Audio',
        beatmakerName: 'Aether Lab',
        soundEngineerName: 'Elena Rostova',
        cover: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&auto=format&fit=crop&q=80',
        duration: 205,
        dropStart: 48,
        dropDuration: 30,
        baseFreq: 146.83,
        bpm: 118,
        realPlays: 64,
        totalListenSeconds: 11920,
        listenSessions: 64,
        avgRetentionPct: 91,
        algoPoints: 26.75,
        likesCount: 28,
        loopPlaysCount: 22,
        consecutiveLoops: 0,
        baselineRank: 3, // Actuellement #2 -> +1 place
      },
      {
        id: 't-202',
        title: 'Spectre Solaire',
        artist: 'Aether Pulse',
        album: 'Mémoire Magnétique',
        category: 'Ambient',
        labelName: 'SubZero Audio',
        beatmakerName: 'Aether Lab',
        soundEngineerName: 'Elena Rostova',
        cover: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
        duration: 188,
        dropStart: 55,
        dropDuration: 30,
        baseFreq: 123.47,
        bpm: 120,
        realPlays: 27,
        totalListenSeconds: 3610,
        listenSessions: 27,
        avgRetentionPct: 71,
        algoPoints: 10.25,
        likesCount: 9,
        loopPlaysCount: 6,
        consecutiveLoops: 0,
        baselineRank: 6, // Actuellement #7 -> -1 place
      },
      {
        id: 't-203',
        title: 'Echo Abyssal',
        artist: 'Aether Pulse',
        album: 'Mémoire Magnétique',
        category: 'Ambient',
        labelName: 'SubZero Audio',
        beatmakerName: 'Nox_Wave',
        soundEngineerName: 'Elena Rostova',
        cover: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80',
        duration: 242,
        dropStart: 78,
        dropDuration: 30,
        baseFreq: 87.31,
        bpm: 115,
        realPlays: 15,
        totalListenSeconds: 980,
        listenSessions: 15,
        avgRetentionPct: 27,
        algoPoints: 3.5,
        likesCount: 4,
        loopPlaysCount: 2,
        consecutiveLoops: 0,
        baselineRank: 1, // Actuellement #9 -> -8 places
      },
    ],
  },
  {
    id: 'alb-3',
    artist: 'Sora V',
    albumTitle: 'Hyperbole Dynamique',
    category: 'Electronic',
    year: '2025',
    tracks: [
      {
        id: 't-301',
        title: 'Vitesse Lumière',
        artist: 'Sora V',
        album: 'Hyperbole Dynamique',
        category: 'Electronic',
        labelName: 'Kinetic Tokyo',
        beatmakerName: 'Sora V',
        soundEngineerName: 'Kenji Takahashi',
        cover: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80',
        duration: 175,
        dropStart: 36,
        dropDuration: 30,
        baseFreq: 164.81,
        bpm: 132,
        realPlays: 82,
        totalListenSeconds: 13680,
        listenSessions: 82,
        avgRetentionPct: 95,
        algoPoints: 34.5,
        likesCount: 37,
        loopPlaysCount: 31,
        consecutiveLoops: 0,
        baselineRank: 2, // Actuellement #1 -> +1 place
      },
      {
        id: 't-302',
        title: 'Horizon Digital',
        artist: 'Sora V',
        album: 'Hyperbole Dynamique',
        category: 'Electronic',
        labelName: 'Kinetic Tokyo',
        beatmakerName: 'Sora V',
        soundEngineerName: 'Kenji Takahashi',
        cover: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
        duration: 199,
        dropStart: 62,
        dropDuration: 30,
        baseFreq: 138.59,
        bpm: 128,
        realPlays: 41,
        totalListenSeconds: 6510,
        listenSessions: 41,
        avgRetentionPct: 80,
        algoPoints: 16.0,
        likesCount: 15,
        loopPlaysCount: 11,
        consecutiveLoops: 0,
        baselineRank: 8, // Actuellement #4 -> +4 places
      },
      {
        id: 't-303',
        title: 'Fragment Zéro',
        artist: 'Sora V',
        album: 'Hyperbole Dynamique',
        category: 'Electronic',
        labelName: 'Kinetic Tokyo',
        beatmakerName: 'Yuki Bass',
        soundEngineerName: 'Kenji Takahashi',
        cover: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=800&auto=format&fit=crop&q=80',
        duration: 168,
        dropStart: 45,
        dropDuration: 30,
        baseFreq: 116.54,
        bpm: 130,
        realPlays: 29,
        totalListenSeconds: 3890,
        listenSessions: 29,
        avgRetentionPct: 79,
        algoPoints: 11.25,
        likesCount: 11,
        loopPlaysCount: 7,
        consecutiveLoops: 0,
        baselineRank: 5, // Actuellement #6 -> -1 place
      },
    ],
  },
];

const INITIAL_USERS: AppUser[] = [
  {
    id: 'u-1',
    name: 'Camille Laurent',
    email: 'camille@aura2d.io',
    role: 'ADMIN',
    joinedAt: '12 Jan 2025',
    avatar: 'CL',
    totalLikes: 18,
    totalListenSeconds: 14820,
    totalValidatedPlays: 68,
    totalLoops: 27,
    trackStats: {
      't-301': {
        trackId: 't-301',
        listenSeconds: 6125,
        playsCount: 31,
        loopsCount: 15,
        maxConsecutiveLoops: 10,
        liked: true,
        pointsContributed: 12.25,
        lastListenedAt: 'Il y a 14 min',
      },
      't-201': {
        trackId: 't-201',
        listenSeconds: 5120,
        playsCount: 22,
        loopsCount: 8,
        maxConsecutiveLoops: 5,
        liked: true,
        pointsContributed: 7.75,
        lastListenedAt: 'Il y a 2 h',
      },
      't-101': {
        trackId: 't-101',
        listenSeconds: 3575,
        playsCount: 15,
        loopsCount: 4,
        maxConsecutiveLoops: 3,
        liked: true,
        pointsContributed: 5.0,
        lastListenedAt: 'Hier',
      },
    },
  },
  {
    id: 'u-2',
    name: 'Lucas Moreau',
    email: 'lucas.m@studio.fr',
    role: 'USER',
    joinedAt: '03 Fév 2025',
    avatar: 'LM',
    totalLikes: 24,
    totalListenSeconds: 21450,
    totalValidatedPlays: 96,
    totalLoops: 44,
    trackStats: {
      't-101': {
        trackId: 't-101',
        listenSeconds: 9700,
        playsCount: 44,
        loopsCount: 24,
        maxConsecutiveLoops: 12,
        liked: true,
        pointsContributed: 17.5,
        lastListenedAt: 'Il y a 5 min',
      },
      't-102': {
        trackId: 't-102',
        listenSeconds: 6480,
        playsCount: 32,
        loopsCount: 12,
        maxConsecutiveLoops: 8,
        liked: true,
        pointsContributed: 11.25,
        lastListenedAt: 'Il y a 1 h',
      },
      't-302': {
        trackId: 't-302',
        listenSeconds: 5270,
        playsCount: 20,
        loopsCount: 8,
        maxConsecutiveLoops: 4,
        liked: false,
        pointsContributed: 7.0,
        lastListenedAt: 'Hier',
      },
    },
  },
  {
    id: 'u-3',
    name: 'Inès Benali',
    email: 'ines.b@design.co',
    role: 'USER',
    joinedAt: '19 Fév 2025',
    avatar: 'IB',
    totalLikes: 31,
    totalListenSeconds: 18340,
    totalValidatedPlays: 81,
    totalLoops: 35,
    trackStats: {
      't-201': {
        trackId: 't-201',
        listenSeconds: 10250,
        playsCount: 42,
        loopsCount: 21,
        maxConsecutiveLoops: 11,
        liked: true,
        pointsContributed: 16.25,
        lastListenedAt: 'En écoute',
      },
      't-301': {
        trackId: 't-301',
        listenSeconds: 4900,
        playsCount: 24,
        loopsCount: 9,
        maxConsecutiveLoops: 6,
        liked: true,
        pointsContributed: 8.5,
        lastListenedAt: 'Il y a 3 h',
      },
      't-202': {
        trackId: 't-202',
        listenSeconds: 3190,
        playsCount: 15,
        loopsCount: 5,
        maxConsecutiveLoops: 3,
        liked: true,
        pointsContributed: 5.25,
        lastListenedAt: 'Il y a 2 j',
      },
    },
  },
  {
    id: 'u-4',
    name: 'Hugo Vasseur',
    email: 'hugo@synth.net',
    role: 'USER',
    joinedAt: '04 Mar 2025',
    avatar: 'HV',
    totalLikes: 9,
    totalListenSeconds: 6420,
    totalValidatedPlays: 34,
    totalLoops: 19,
    trackStats: {
      't-303': {
        trackId: 't-303',
        listenSeconds: 4200,
        playsCount: 21,
        loopsCount: 15,
        maxConsecutiveLoops: 14,
        liked: true,
        pointsContributed: 6.75,
        lastListenedAt: 'Il y a 45 min',
      },
      't-103': {
        trackId: 't-103',
        listenSeconds: 2220,
        playsCount: 13,
        loopsCount: 4,
        maxConsecutiveLoops: 2,
        liked: false,
        pointsContributed: 4.25,
        lastListenedAt: 'Il y a 4 j',
      },
    },
  },
];

// Formatage strict en MM:SS (ex: 02:42)
function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
}

function formatLongDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) {
    return `${h}h${m.toString().padStart(2, '0')}`;
  }
  return `${m}m`;
}

function parseDurationInput(str: string): number {
  const clean = str.trim();
  if (clean.includes(':')) {
    const parts = clean.split(':');
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return Math.max(30, mins * 60 + secs);
  }
  const num = parseInt(clean, 10);
  return Number.isNaN(num) ? 162 : Math.max(30, num);
}

function extractExternalStreamId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) return match[2];
  if (url.trim().length === 11 && !url.includes('/')) return url.trim();
  return null;
}

// --- Composant Badge de Rang (#1👑, #2🥈, #3🥉) + Variation (+4 vert / -8 rouge) ---
function RankBadge({ rank, delta }: { rank: number; delta: number }) {
  const medal = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
  return (
    <div className="flex items-center gap-1.5 shrink-0 font-mono">
      <span
        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold border ${
          rank === 1
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : rank === 2
              ? 'bg-slate-300/15 text-slate-200 border-slate-300/35'
              : rank === 3
                ? 'bg-orange-500/15 text-orange-300 border-orange-500/35'
                : 'bg-white/[0.04] text-[#8E93A4] border-white/[0.08]'
        }`}
      >
        <span>#{rank}</span>
        {medal && <span>{medal}</span>}
      </span>

      {delta !== 0 && (
        <span
          className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
            delta > 0
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          }`}
        >
          {delta > 0 ? `+${delta}` : `${delta}`}
        </span>
      )}
    </div>
  );
}

export function App() {
  // --- Navigation & Auth State ---
  const [appView, setAppView] = useState<'AUTH' | 'PLAYER' | 'ADMIN'>('AUTH');
  const [catalogue, setCatalogue] = useState<AlbumNode[]>(INITIAL_CATALOGUE);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<AppUser>(INITIAL_USERS[0]);

  // --- Offline-First Stream Tracker Snapshot ---
  const [syncSnapshot, setSyncSnapshot] = useState<SyncStatusSnapshot>(() =>
    streamTracker.getSnapshot()
  );

  useEffect(() => {
    return streamTracker.subscribe((snap) => {
      setSyncSnapshot(snap);
    });
  }, []);

  // --- Player 2D Coordinates ---
  const [albumIdx, setAlbumIdx] = useState<number>(0); // Axe X
  const [trackIdx, setTrackIdx] = useState<number>(0); // Axe Y

  // --- Playback State ---
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isDropMode, setIsDropMode] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(
    INITIAL_CATALOGUE[0].tracks[0].dropStart
  );
  const [likedTrackIds, setLikedTrackIds] = useState<Record<string, boolean>>({
    't-101': true,
    't-201': true,
    't-301': true,
  });
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [axisLock, setAxisLock] = useState<'NONE' | 'X' | 'Y'>('NONE');
  const [gestureDelta, setGestureDelta] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // --- Silent Real Play & Retention Session Tracking ---
  const manualSessionRef = useRef<{
    trackId: string;
    active: boolean;
    listenedSeconds: number;
    playCountedAtOneSec: boolean;
    sessionPointsEarned: number;
  }>({
    trackId: INITIAL_CATALOGUE[0].tracks[0].id,
    active: false,
    listenedSeconds: 0,
    playCountedAtOneSec: false,
    sessionPointsEarned: 0,
  });

  // --- Auth Form State ---
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authName, setAuthName] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('camille@aura2d.io');

  // --- Admin Navigation & Sub-tabs ---
  const [adminMainTab, setAdminMainTab] = useState<'CATALOGUE' | 'UPLOAD' | 'USERS'>('CATALOGUE');
  const [catalogueSubTab, setCatalogueSubTab] = useState<'REPERTOIRE' | 'ALGO' | 'RULES'>(
    'REPERTOIRE'
  );

  // --- Full-Screen Detail Sheets (Track, Artist, Consumer User) ---
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);
  const [selectedConsumerUserId, setSelectedConsumerUserId] = useState<string | null>(null);

  // --- Algorithm Filter Dimension ---
  const [algoDimension, setAlgoDimension] = useState<
    'GENERAL' | 'CATEGORY' | 'ARTIST' | 'LABEL' | 'BEATMAKER' | 'ENGINEER'
  >('GENERAL');
  const [algoFilterValue, setAlgoFilterValue] = useState<string>('ALL');

  // --- Step-by-Step Upload Wizard State ---
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [uploadSourceType, setUploadSourceType] = useState<'FILE' | 'STREAM'>('FILE');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newArtist, setNewArtist] = useState<string>('');
  const [newAlbum, setNewAlbum] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Synthwave');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [newLabelName, setNewLabelName] = useState<string>('');
  const [newBeatmakerName, setNewBeatmakerName] = useState<string>('');
  const [newSoundEngineerName, setNewSoundEngineerName] = useState<string>('');
  const [newCoverFileUrl, setNewCoverFileUrl] = useState<string>('');
  const [newCoverFileName, setNewCoverFileName] = useState<string>('');
  const [newDurationFormatted, setNewDurationFormatted] = useState<string>('02:42');
  const [newDropStart, setNewDropStart] = useState<number>(42);
  const [newDropDuration, setNewDropDuration] = useState<number>(30);
  const [newAudioUrl, setNewAudioUrl] = useState<string>('');
  const [newAudioFileName, setNewAudioFileName] = useState<string>('');
  const [newExternalUrl, setNewExternalUrl] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // --- Upload Progress & Energy Waveform State ---
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [detectedHotspotStart, setDetectedHotspotStart] = useState<number | null>(null);
  const [isPreviewingUploadDrop, setIsPreviewingUploadDrop] = useState<boolean>(false);
  const [uploadPreviewTime, setUploadPreviewTime] = useState<number>(42);

  // --- Admin Edit ModalState ---
  const [editingTrack, setEditingTrack] = useState<{
    albumId: string;
    track: Track;
    durationFormatted: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // --- Refs ---
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const stepCounterRef = useRef<number>(0);
  const synthIntervalRef = useRef<number | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const uploadPreviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const externalPlayerRef = useRef<any>(null);
  const externalApiReadyRef = useRef<boolean>(false);

  const safeAlbumIdx = Math.min(albumIdx, Math.max(0, catalogue.length - 1));
  const currentAlbum = catalogue[safeAlbumIdx] || catalogue[0];
  const safeTrackIdx = Math.min(trackIdx, Math.max(0, (currentAlbum?.tracks.length || 1) - 1));
  const currentTrack = currentAlbum?.tracks[safeTrackIdx] || INITIAL_CATALOGUE[0].tracks[0];
  const parsedNewDuration = useMemo(
    () => parseDurationInput(newDurationFormatted),
    [newDurationFormatted]
  );

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // --- Compute Live Ranks & Rank Deltas Across All Tracks ---
  const allTracksFlat = useMemo(() => catalogue.flatMap((a) => a.tracks), [catalogue]);

  const trackRankMap = useMemo(() => {
    const sorted = [...allTracksFlat].sort((a, b) => b.algoPoints - a.algoPoints);
    const map: Record<string, { rank: number; delta: number }> = {};
    sorted.forEach((t, idx) => {
      const currentRank = idx + 1;
      const base = t.baselineRank || currentRank;
      const delta = base - currentRank; // ex: était #7, maintenant #3 => +4
      map[t.id] = { rank: currentRank, delta };
    });
    return map;
  }, [allTracksFlat]);

  // --- MediaSession API for Native Background Audio Continuity ---
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: `${currentTrack.artist} • ${currentTrack.labelName}`,
        album: currentTrack.album,
        artwork: currentTrack.cover
          ? [{ src: currentTrack.cover, sizes: '512x512', type: 'image/jpeg' }]
          : [],
      });
      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
    }
  }, [currentTrack]);

  // --- Helper: Silent Background Recording of User & Track Metrics ---
  const recordUserAndTrackStats = useCallback(
    (
      trackId: string,
      updates: {
        addListenSeconds?: number;
        addValidatedPlay?: boolean;
        addLoop?: boolean;
        currentConsecutiveLoop?: number;
        pointsDelta?: number;
        newRetentionSessionPct?: number;
        resetConsecutiveLoops?: boolean;
      }
    ) => {
      setCatalogue((prev) =>
        prev.map((alb) => ({
          ...alb,
          tracks: alb.tracks.map((t) => {
            if (t.id !== trackId) return t;
            const nextRealPlays = t.realPlays + (updates.addValidatedPlay ? 1 : 0);
            const nextListenSeconds = t.totalListenSeconds + (updates.addListenSeconds || 0);
            const nextLoopPlays = t.loopPlaysCount + (updates.addLoop ? 1 : 0);
            const nextConsecutiveLoops = updates.resetConsecutiveLoops
              ? 0
              : updates.currentConsecutiveLoop !== undefined
                ? updates.currentConsecutiveLoop
                : t.consecutiveLoops;

            let nextListenSessions = t.listenSessions;
            let nextAvgRetention = t.avgRetentionPct;
            if (updates.newRetentionSessionPct !== undefined) {
              nextListenSessions = t.listenSessions + 1;
              nextAvgRetention = Math.round(
                (t.avgRetentionPct * t.listenSessions + updates.newRetentionSessionPct) /
                  nextListenSessions
              );
            }

            const rawPoints = t.algoPoints + (updates.pointsDelta || 0);
            const nextPoints = Math.max(0, Math.round(rawPoints * 100) / 100);

            return {
              ...t,
              realPlays: nextRealPlays,
              totalListenSeconds: nextListenSeconds,
              loopPlaysCount: nextLoopPlays,
              consecutiveLoops: nextConsecutiveLoops,
              listenSessions: nextListenSessions,
              avgRetentionPct: nextAvgRetention,
              algoPoints: nextPoints,
            };
          }),
        }))
      );

      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id !== currentUser.id) return u;
          const prevStat: UserTrackStat = u.trackStats[trackId] || {
            trackId,
            listenSeconds: 0,
            playsCount: 0,
            loopsCount: 0,
            maxConsecutiveLoops: 0,
            liked: !!likedTrackIds[trackId],
            pointsContributed: 0,
            lastListenedAt: 'À l’instant',
          };

          const updatedConsec =
            updates.currentConsecutiveLoop !== undefined
              ? Math.max(prevStat.maxConsecutiveLoops, updates.currentConsecutiveLoop)
              : prevStat.maxConsecutiveLoops;

          const nextStat: UserTrackStat = {
            ...prevStat,
            listenSeconds: prevStat.listenSeconds + (updates.addListenSeconds || 0),
            playsCount: prevStat.playsCount + (updates.addValidatedPlay ? 1 : 0),
            loopsCount: prevStat.loopsCount + (updates.addLoop ? 1 : 0),
            maxConsecutiveLoops: updatedConsec,
            pointsContributed:
              Math.round((prevStat.pointsContributed + (updates.pointsDelta || 0)) * 100) / 100,
            lastListenedAt: 'À l’instant',
          };

          return {
            ...u,
            totalListenSeconds: u.totalListenSeconds + (updates.addListenSeconds || 0),
            totalValidatedPlays: u.totalValidatedPlays + (updates.addValidatedPlay ? 1 : 0),
            totalLoops: u.totalLoops + (updates.addLoop ? 1 : 0),
            trackStats: {
              ...u.trackStats,
              [trackId]: nextStat,
            },
          };
        })
      );
    },
    [currentUser.id, likedTrackIds]
  );

  // --- Silent Session Finalization on Track Switch (Zapping) ---
  const finalizeListeningSessionOnZap = useCallback(() => {
    const session = manualSessionRef.current;
    const prevTrackId = session.trackId;

    let foundTrack: Track | null = null;
    for (const alb of catalogue) {
      for (const t of alb.tracks) {
        if (t.id === prevTrackId) {
          foundTrack = t;
          break;
        }
      }
    }

    if (session.active && session.listenedSeconds > 0 && foundTrack) {
      const listened = session.listenedSeconds;
      const retentionPct = Math.min(100, Math.round((listened / foundTrack.duration) * 100));

      let deltaPoints = 0;
      if (retentionPct >= 85) {
        if (session.sessionPointsEarned < 4) {
          deltaPoints = Math.min(0.25, 4 - session.sessionPointsEarned);
        }
      } else if (retentionPct < 15) {
        deltaPoints = -0.25;
      }

      streamTracker.trackAction(retentionPct >= 85 ? 'complete' : 'skip', prevTrackId, {
        userId: currentUser.id,
        durationPlayedSeconds: listened,
        pointsDelta: deltaPoints,
        retentionPct,
      });

      recordUserAndTrackStats(prevTrackId, {
        addListenSeconds: listened,
        pointsDelta: deltaPoints,
        newRetentionSessionPct: retentionPct,
        resetConsecutiveLoops: true,
      });
    } else if (foundTrack && foundTrack.consecutiveLoops > 0) {
      recordUserAndTrackStats(prevTrackId, {
        resetConsecutiveLoops: true,
      });
    }

    manualSessionRef.current = {
      trackId: currentTrack.id,
      active: false,
      listenedSeconds: 0,
      playCountedAtOneSec: false,
      sessionPointsEarned: 0,
    };
  }, [catalogue, currentTrack.id, currentUser.id, recordUserAndTrackStats]);

  // --- Load External Audio Stream API ---
  useEffect(() => {
    if ((window as any).YT && (window as any).YT.Player) {
      externalApiReadyRef.current = true;
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      externalApiReadyRef.current = true;
    };
  }, []);

  // --- Web Audio API Synthesizer Fallback ---
  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const triggerSynthNote = useCallback((freq: number, step: number, dropActive: boolean) => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    const scaleMultipliers = [1, 1.2, 1.333, 1.5, 1.6, 2];
    const mult = scaleMultipliers[step % scaleMultipliers.length];
    osc.type = dropActive ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq * mult * (step % 4 === 0 ? 0.5 : 1), now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(dropActive ? 1650 : 850, now);
    filter.Q.setValueAtTime(dropActive ? 5 : 2, now);

    const peakGain = 0.08;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }, []);

  // --- Synchronize Active Audio Engine (Maintained in Background Across All Views) ---
  useEffect(() => {
    const hasAudioFile = Boolean(currentTrack.audioUrl);
    const hasExternalStream = Boolean(currentTrack.externalStreamId);

    if (synthIntervalRef.current) {
      window.clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }

    if (hasAudioFile && htmlAudioRef.current) {
      if (externalPlayerRef.current?.pauseVideo) {
        externalPlayerRef.current.pauseVideo();
      }
      const audio = htmlAudioRef.current;
      if (audio.src !== currentTrack.audioUrl) {
        audio.src = currentTrack.audioUrl!;
        audio.currentTime = currentTime;
      }
      audio.volume = 0.85;
      if (isPlaying && !isPreviewingUploadDrop) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
      return;
    } else if (htmlAudioRef.current) {
      htmlAudioRef.current.pause();
    }

    if (hasExternalStream) {
      const streamId = currentTrack.externalStreamId!;
      if (!externalPlayerRef.current && (window as any).YT && (window as any).YT.Player) {
        externalPlayerRef.current = new (window as any).YT.Player('hidden-external-audio-stream', {
          height: '1',
          width: '1',
          videoId: streamId,
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            start: Math.floor(currentTime),
          },
          events: {
            onReady: (event: any) => {
              event.target.setVolume(85);
              event.target.seekTo(currentTime, true);
              if (isPlayingRef.current) {
                event.target.playVideo();
              }
            },
          },
        });
      } else if (externalPlayerRef.current && externalPlayerRef.current.loadVideoById) {
        const loadedUrl = externalPlayerRef.current.getVideoUrl?.() || '';
        if (!loadedUrl.includes(streamId)) {
          externalPlayerRef.current.loadVideoById({
            videoId: streamId,
            startSeconds: Math.floor(currentTime),
          });
        }
        externalPlayerRef.current.setVolume?.(85);
        if (isPlaying && !isPreviewingUploadDrop) {
          externalPlayerRef.current.playVideo?.();
        } else {
          externalPlayerRef.current.pauseVideo?.();
        }
      }
      return;
    } else if (externalPlayerRef.current?.pauseVideo) {
      externalPlayerRef.current.pauseVideo();
    }

    if (isPlaying && !isPreviewingUploadDrop) {
      initAudioContext();
      const stepMs = Math.round((60 / currentTrack.bpm) * 500);
      synthIntervalRef.current = window.setInterval(() => {
        if (!isPlayingRef.current) return;
        stepCounterRef.current += 1;
        triggerSynthNote(currentTrack.baseFreq, stepCounterRef.current, isDropMode);
      }, stepMs);
    }

    return () => {
      if (synthIntervalRef.current) {
        window.clearInterval(synthIntervalRef.current);
      }
    };
  }, [
    isPlaying,
    currentTrack,
    isDropMode,
    isPreviewingUploadDrop,
    initAudioContext,
    triggerSynthNote,
  ]);

  const seekAllEngines = useCallback(
    (targetTime: number) => {
      setCurrentTime(targetTime);
      if (currentTrack.audioUrl && htmlAudioRef.current) {
        htmlAudioRef.current.currentTime = targetTime;
      }
      if (currentTrack.externalStreamId && externalPlayerRef.current?.seekTo) {
        externalPlayerRef.current.seekTo(targetTime, true);
      }
    },
    [currentTrack]
  );

  // --- Navigate Track (Axe Y) ---
  const navigateTrack = useCallback(
    (dir: 1 | -1) => {
      finalizeListeningSessionOnZap();

      const tracksLen = currentAlbum.tracks.length;
      const nextT = isShuffle
        ? Math.floor(Math.random() * tracksLen)
        : (safeTrackIdx + dir + tracksLen) % tracksLen;
      const targetTrack = currentAlbum.tracks[nextT];

      setTrackIdx(nextT);
      setIsDropMode(true);
      setCurrentTime(targetTrack.dropStart);

      manualSessionRef.current = {
        trackId: targetTrack.id,
        active: false,
        listenedSeconds: 0,
        playCountedAtOneSec: false,
        sessionPointsEarned: 0,
      };

      if (targetTrack.audioUrl && htmlAudioRef.current) {
        htmlAudioRef.current.src = targetTrack.audioUrl;
        htmlAudioRef.current.currentTime = targetTrack.dropStart;
      }
      if (targetTrack.externalStreamId && externalPlayerRef.current?.loadVideoById) {
        externalPlayerRef.current.loadVideoById({
          videoId: targetTrack.externalStreamId,
          startSeconds: targetTrack.dropStart,
        });
      }
      setIsPlaying(true);
    },
    [currentAlbum, safeTrackIdx, isShuffle, finalizeListeningSessionOnZap]
  );

  // --- Navigate Album (Axe X) ---
  const navigateAlbum = useCallback(
    (dir: 1 | -1) => {
      finalizeListeningSessionOnZap();

      const albumsLen = catalogue.length;
      const nextA = isShuffle
        ? Math.floor(Math.random() * albumsLen)
        : (safeAlbumIdx + dir + albumsLen) % albumsLen;
      const targetTrack = catalogue[nextA].tracks[0];

      setAlbumIdx(nextA);
      setTrackIdx(0);
      setIsDropMode(true);
      setCurrentTime(targetTrack.dropStart);

      manualSessionRef.current = {
        trackId: targetTrack.id,
        active: false,
        listenedSeconds: 0,
        playCountedAtOneSec: false,
        sessionPointsEarned: 0,
      };

      if (targetTrack.audioUrl && htmlAudioRef.current) {
        htmlAudioRef.current.src = targetTrack.audioUrl;
        htmlAudioRef.current.currentTime = targetTrack.dropStart;
      }
      if (targetTrack.externalStreamId && externalPlayerRef.current?.loadVideoById) {
        externalPlayerRef.current.loadVideoById({
          videoId: targetTrack.externalStreamId,
          startSeconds: targetTrack.dropStart,
        });
      }
      setIsPlaying(true);
    },
    [catalogue, safeAlbumIdx, isShuffle, finalizeListeningSessionOnZap]
  );

  // --- Silent Playback Timer, 0:01 Real Play Validation & Exact Loop Rules ---
  useEffect(() => {
    if (!isPlaying || isPreviewingUploadDrop) return;
    const timer = window.setInterval(() => {
      if (!isDropMode && manualSessionRef.current.active) {
        manualSessionRef.current.listenedSeconds += 1;

        if (
          manualSessionRef.current.listenedSeconds >= 1 &&
          !manualSessionRef.current.playCountedAtOneSec
        ) {
          manualSessionRef.current.playCountedAtOneSec = true;
          const trackId = currentTrack.id;

          streamTracker.trackAction('play', trackId, {
            userId: currentUser.id,
            durationPlayedSeconds: 1,
          });

          recordUserAndTrackStats(trackId, {
            addValidatedPlay: true,
          });
        }
      }

      setCurrentTime((prev) => {
        const dropEnd = Math.min(
          currentTrack.duration,
          currentTrack.dropStart + currentTrack.dropDuration
        );
        if (isDropMode && prev + 1 >= dropEnd) {
          seekAllEngines(currentTrack.dropStart);
          return currentTrack.dropStart;
        }

        if (prev + 1 >= currentTrack.duration) {
          const trackId = currentTrack.id;
          const session = manualSessionRef.current;

          if (isRepeat) {
            const loopNum = currentTrack.consecutiveLoops + 1;
            let loopPointsDelta = 0;

            if (loopNum === 13) {
              loopPointsDelta = -0.5;
            } else if (loopNum > 13) {
              loopPointsDelta = 0;
            } else {
              let rawEarned = 0.25 + 0.25;
              if (loopNum === 10) {
                rawEarned += 0.25;
              }
              const remainingCap = Math.max(0, 4 - session.sessionPointsEarned);
              loopPointsDelta = Math.min(rawEarned, remainingCap);
              session.sessionPointsEarned += loopPointsDelta;
            }

            streamTracker.trackAction('loop', trackId, {
              userId: currentUser.id,
              loopCount: 1,
              durationPlayedSeconds: currentTrack.duration,
              pointsDelta: loopPointsDelta,
              retentionPct: 100,
            });

            recordUserAndTrackStats(trackId, {
              addListenSeconds: currentTrack.duration,
              addLoop: true,
              currentConsecutiveLoop: loopNum,
              pointsDelta: loopPointsDelta,
              newRetentionSessionPct: 100,
            });

            manualSessionRef.current = {
              trackId,
              active: true,
              listenedSeconds: 0,
              playCountedAtOneSec: true,
              sessionPointsEarned: session.sessionPointsEarned,
            };
            seekAllEngines(0);
            return 0;
          }

          if (!isDropMode && session.active) {
            const remainingCap = Math.max(0, 4 - session.sessionPointsEarned);
            const earn = Math.min(0.25, remainingCap);
            session.sessionPointsEarned += earn;

            streamTracker.trackAction('complete', trackId, {
              userId: currentUser.id,
              durationPlayedSeconds: currentTrack.duration,
              pointsDelta: earn,
              retentionPct: 100,
            });

            recordUserAndTrackStats(trackId, {
              addListenSeconds: currentTrack.duration,
              pointsDelta: earn,
              newRetentionSessionPct: 100,
            });
            manualSessionRef.current.active = false;
            manualSessionRef.current.listenedSeconds = 0;
          }

          navigateTrack(1);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [
    isPlaying,
    isDropMode,
    isRepeat,
    currentTrack,
    currentUser.id,
    isPreviewingUploadDrop,
    seekAllEngines,
    navigateTrack,
    recordUserAndTrackStats,
  ]);

  const handleCentralPlayToggle = () => {
    initAudioContext();

    if (isDropMode) {
      setIsDropMode(false);
      seekAllEngines(0);
      manualSessionRef.current = {
        trackId: currentTrack.id,
        active: true,
        listenedSeconds: 0,
        playCountedAtOneSec: false,
        sessionPointsEarned: 0,
      };
      setIsPlaying(true);
      return;
    }

    if (!isPlaying) {
      if (!manualSessionRef.current.active) {
        if (currentTime > 5) {
          seekAllEngines(0);
        }
        manualSessionRef.current = {
          trackId: currentTrack.id,
          active: true,
          listenedSeconds: 0,
          playCountedAtOneSec: false,
          sessionPointsEarned: 0,
        };
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  // --- Silent Like Toggle (+0.25 pt counted silently in background + Offline-First) ---
  const toggleLike = (trackId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentlyLiked = !!likedTrackIds[trackId];
    const nextLiked = !currentlyLiked;

    setLikedTrackIds((prev) => ({
      ...prev,
      [trackId]: nextLiked,
    }));

    const pointsDelta = nextLiked ? 0.25 : -0.25;

    if (nextLiked && manualSessionRef.current.trackId === trackId) {
      manualSessionRef.current.sessionPointsEarned = Math.min(
        4,
        manualSessionRef.current.sessionPointsEarned + 0.25
      );
    }

    streamTracker.trackAction(nextLiked ? 'like' : 'unlike', trackId, {
      userId: currentUser.id,
      pointsDelta: nextLiked ? 0.25 : 0,
    });

    setCatalogue((prev) =>
      prev.map((alb) => ({
        ...alb,
        tracks: alb.tracks.map((t) => {
          if (t.id !== trackId) return t;
          return {
            ...t,
            likesCount: Math.max(0, t.likesCount + (nextLiked ? 1 : -1)),
            algoPoints: Math.max(0, Math.round((t.algoPoints + pointsDelta) * 100) / 100),
          };
        }),
      }))
    );

    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id !== currentUser.id) return u;
        const prevStat: UserTrackStat = u.trackStats[trackId] || {
          trackId,
          listenSeconds: 0,
          playsCount: 0,
          loopsCount: 0,
          maxConsecutiveLoops: 0,
          liked: false,
          pointsContributed: 0,
          lastListenedAt: 'À l’instant',
        };
        return {
          ...u,
          totalLikes: Math.max(0, u.totalLikes + (nextLiked ? 1 : -1)),
          trackStats: {
            ...u.trackStats,
            [trackId]: {
              ...prevStat,
              liked: nextLiked,
              pointsContributed: Math.max(
                0,
                Math.round((prevStat.pointsContributed + pointsDelta) * 100) / 100
              ),
            },
          },
        };
      })
    );
  };

  // --- 2D Pointer Gesture Handlers ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    setAxisLock('NONE');
    setGestureDelta({ x: 0, y: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    let currentLock = axisLock;
    if (currentLock === 'NONE') {
      if (Math.abs(dx) > 14 || Math.abs(dy) > 14) {
        currentLock = Math.abs(dx) >= Math.abs(dy) ? 'X' : 'Y';
        setAxisLock(currentLock);
      }
    }

    if (currentLock === 'X') {
      setGestureDelta({ x: Math.max(-90, Math.min(90, dx)), y: 0 });
    } else if (currentLock === 'Y') {
      setGestureDelta({ x: 0, y: Math.max(-90, Math.min(90, dy)) });
    }
  };

  const handlePointerUp = () => {
    if (!pointerStartRef.current) return;
    const THRESHOLD = 44;

    if (axisLock === 'X') {
      if (gestureDelta.x <= -THRESHOLD) navigateAlbum(1);
      else if (gestureDelta.x >= THRESHOLD) navigateAlbum(-1);
    } else if (axisLock === 'Y') {
      if (gestureDelta.y <= -THRESHOLD) navigateTrack(1);
      else if (gestureDelta.y >= THRESHOLD) navigateTrack(-1);
    }

    pointerStartRef.current = null;
    setAxisLock('NONE');
    setGestureDelta({ x: 0, y: 0 });
  };

  // --- Auth Handlers ---
  const handleQuickEnter = (targetView: 'PLAYER' | 'ADMIN', role: 'USER' | 'ADMIN') => {
    if (authMode === 'REGISTER' && authName.trim() && authEmail.trim()) {
      const newUser: AppUser = {
        id: `u-${Date.now()}`,
        name: authName.trim(),
        email: authEmail.trim(),
        role,
        joinedAt: 'Aujourd’hui',
        avatar: authName
          .trim()
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        totalLikes: 0,
        totalListenSeconds: 0,
        totalValidatedPlays: 0,
        totalLoops: 0,
        trackStats: {},
      };
      setUsers((prev) => [newUser, ...prev]);
      setCurrentUser(newUser);
    }
    setAppView(targetView);
  };

  // --- Audio File Upload + Automatic Chorus Detection ---
  const handleAudioFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setNewAudioUrl(objectUrl);
    setNewAudioFileName(file.name);
    if (!newTitle) {
      setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    setIsUploadingFile(true);
    setUploadProgress(8);
    const progInterval = window.setInterval(() => {
      setUploadProgress((p) => (p < 92 ? p + 14 : p));
    }, 90);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const tempCtx = new AudioCtx();
      const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);

      const durSec = Math.max(30, Math.round(audioBuffer.duration));
      setNewDurationFormatted(formatTime(durSec));

      const rawData = audioBuffer.getChannelData(0);
      const bucketsCount = 64;
      const samplesPerBucket = Math.floor(rawData.length / bucketsCount);
      const energies: number[] = [];

      for (let i = 0; i < bucketsCount; i++) {
        let sumSq = 0;
        const startSample = i * samplesPerBucket;
        const stride = Math.max(1, Math.floor(samplesPerBucket / 400));
        let count = 0;
        for (let j = 0; j < samplesPerBucket; j += stride) {
          const sample = rawData[startSample + j] || 0;
          sumSq += sample * sample;
          count++;
        }
        energies.push(Math.sqrt(sumSq / Math.max(1, count)));
      }

      const maxE = Math.max(...energies, 0.001);
      const normalizedPeaks = energies.map((eVal) => Math.max(0.12, Math.min(1, eVal / maxE)));
      setWaveformPeaks(normalizedPeaks);

      const windowBuckets = Math.max(4, Math.round((30 / durSec) * bucketsCount));
      let bestStartBucket = Math.floor(bucketsCount * 0.25);
      let bestWindowEnergy = -1;

      for (let i = 2; i <= bucketsCount - windowBuckets - 1; i++) {
        let winSum = 0;
        for (let w = 0; w < windowBuckets; w++) {
          winSum += normalizedPeaks[i + w];
        }
        if (winSum > bestWindowEnergy) {
          bestWindowEnergy = winSum;
          bestStartBucket = i;
        }
      }

      const detectedStartSec = Math.min(
        Math.max(0, durSec - 30),
        Math.round((bestStartBucket / bucketsCount) * durSec)
      );
      setNewDropStart(detectedStartSec);
      setNewDropDuration(Math.min(30, durSec - detectedStartSec));
      setDetectedHotspotStart(detectedStartSec);
      setUploadPreviewTime(detectedStartSec);
      tempCtx.close();
    } catch {
      const tempAudio = new Audio(objectUrl);
      tempAudio.addEventListener('loadedmetadata', () => {
        if (tempAudio.duration && Number.isFinite(tempAudio.duration)) {
          const d = Math.round(tempAudio.duration);
          setNewDurationFormatted(formatTime(d));
          const autoStart = Math.floor(d * 0.28);
          setNewDropStart(autoStart);
          setDetectedHotspotStart(autoStart);
        }
      });
      const fallbackPeaks = Array.from({ length: 64 }, (_, idx) => {
        const isHot = idx >= 18 && idx <= 34;
        return isHot ? 0.72 + (idx % 5) * 0.06 : 0.22 + (idx % 4) * 0.09;
      });
      setWaveformPeaks(fallbackPeaks);
    } finally {
      window.clearInterval(progInterval);
      setUploadProgress(100);
      window.setTimeout(() => {
        setIsUploadingFile(false);
      }, 300);
    }
  };

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setNewCoverFileUrl(url);
    setNewCoverFileName(file.name);
  };

  const handleRemoveNewCover = () => {
    setNewCoverFileUrl('');
    setNewCoverFileName('');
  };

  const toggleUploadDropPreview = () => {
    if (isPreviewingUploadDrop) {
      setIsPreviewingUploadDrop(false);
      if (uploadPreviewAudioRef.current) {
        uploadPreviewAudioRef.current.pause();
      }
      return;
    }

    setIsPlaying(false);
    setIsPreviewingUploadDrop(true);
    setUploadPreviewTime(newDropStart);

    if (uploadSourceType === 'FILE' && newAudioUrl && uploadPreviewAudioRef.current) {
      const previewAudio = uploadPreviewAudioRef.current;
      if (previewAudio.src !== newAudioUrl) {
        previewAudio.src = newAudioUrl;
      }
      previewAudio.currentTime = newDropStart;
      previewAudio.volume = 0.85;
      previewAudio.play().catch(() => {});
    } else {
      initAudioContext();
    }
  };

  useEffect(() => {
    if (!isPreviewingUploadDrop) return;
    const interval = window.setInterval(() => {
      if (!newAudioUrl) {
        stepCounterRef.current += 1;
        triggerSynthNote(128, stepCounterRef.current, true);
      }
      setUploadPreviewTime((prev) => {
        const end = Math.min(parsedNewDuration, newDropStart + newDropDuration);
        if (prev + 1 >= end) {
          if (uploadPreviewAudioRef.current && newAudioUrl) {
            uploadPreviewAudioRef.current.currentTime = newDropStart;
          }
          return newDropStart;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [
    isPreviewingUploadDrop,
    newDropStart,
    newDropDuration,
    parsedNewDuration,
    newAudioUrl,
    triggerSynthNote,
  ]);

  const handleAddCategory = () => {
    const clean = customCategoryInput.trim();
    if (!clean) return;
    if (!categories.includes(clean)) {
      setCategories((prev) => [...prev, clean]);
    }
    setNewCategory(clean);
    setCustomCategoryInput('');
  };

  const handlePublishTrack = () => {
    if (!newTitle.trim() || !newArtist.trim()) return;

    if (isPreviewingUploadDrop) {
      setIsPreviewingUploadDrop(false);
      uploadPreviewAudioRef.current?.pause();
    }

    const streamId =
      uploadSourceType === 'STREAM' ? extractExternalStreamId(newExternalUrl) : undefined;
    const albumName = newAlbum.trim() || `${newArtist.trim()} — Studio Session`;

    const createdTrack: Track = {
      id: `t-${Date.now()}`,
      title: newTitle.trim(),
      artist: newArtist.trim(),
      album: albumName,
      category: newCategory,
      labelName: newLabelName.trim() || 'Indépendant',
      beatmakerName: newBeatmakerName.trim() || newArtist.trim(),
      soundEngineerName: newSoundEngineerName.trim() || 'Mastering Studio',
      cover: newCoverFileUrl.trim(),
      duration: parsedNewDuration,
      dropStart: Math.min(newDropStart, Math.max(0, parsedNewDuration - 15)),
      dropDuration: Math.min(newDropDuration, parsedNewDuration),
      baseFreq: 110 + Math.floor(Math.random() * 50),
      bpm: 120 + Math.floor(Math.random() * 14),
      audioUrl: uploadSourceType === 'FILE' && newAudioUrl ? newAudioUrl : undefined,
      externalStreamId: streamId || undefined,
      realPlays: 0,
      totalListenSeconds: 0,
      listenSessions: 0,
      avgRetentionPct: 75,
      algoPoints: 2.0,
      likesCount: 0,
      loopPlaysCount: 0,
      consecutiveLoops: 0,
      baselineRank: allTracksFlat.length + 1,
      autoDetectedChorus: detectedHotspotStart !== null,
    };

    setCatalogue((prev) => {
      const existingAlbumIdx = prev.findIndex(
        (a) =>
          a.artist.toLowerCase() === createdTrack.artist.toLowerCase() &&
          a.albumTitle.toLowerCase() === createdTrack.album.toLowerCase()
      );
      if (existingAlbumIdx >= 0) {
        const updated = [...prev];
        updated[existingAlbumIdx] = {
          ...updated[existingAlbumIdx],
          tracks: [...updated[existingAlbumIdx].tracks, createdTrack],
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: `alb-${Date.now()}`,
          artist: createdTrack.artist,
          albumTitle: createdTrack.album,
          category: createdTrack.category,
          year: '2025',
          tracks: [createdTrack],
        },
      ];
    });

    setUploadSuccess(`« ${createdTrack.title} » publié.`);
    setNewTitle('');
    setNewAudioFileName('');
    setNewAudioUrl('');
    setNewExternalUrl('');
    setNewCoverFileUrl('');
    setNewCoverFileName('');
    setWaveformPeaks([]);
    setDetectedHotspotStart(null);
    setWizardStep(1);
    setTimeout(() => setUploadSuccess(null), 4000);
  };

  // --- Admin Catalogue Actions ---
  const handleDeleteTrack = (albumId: string, trackId: string) => {
    setCatalogue((prev) =>
      prev
        .map((alb) =>
          alb.id === albumId
            ? { ...alb, tracks: alb.tracks.filter((t) => t.id !== trackId) }
            : alb
        )
        .filter((alb) => alb.tracks.length > 0)
    );
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
    }
  };

  const handleMoveAlbumOrder = (idx: number, dir: -1 | 1) => {
    setCatalogue((prev) => {
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      next.splice(targetIdx, 0, removed);
      return next;
    });
  };

  const handleAutoReorderByAlgo = () => {
    // Capture current ranks as new baseline before sorting
    setCatalogue((prev) => {
      const sortedAlbums = prev.map((alb) => {
        const sortedTracks = [...alb.tracks].sort((a, b) => b.algoPoints - a.algoPoints);
        return { ...alb, tracks: sortedTracks };
      });
      sortedAlbums.sort((a, b) => {
        const maxA = Math.max(...a.tracks.map((t) => t.algoPoints), 0);
        const maxB = Math.max(...b.tracks.map((t) => t.algoPoints), 0);
        return maxB - maxA;
      });
      return sortedAlbums;
    });
    setAlbumIdx(0);
    setTrackIdx(0);
  };

  const handleSaveEditedTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;
    const { albumId, track, durationFormatted } = editingTrack;
    const updatedDuration = parseDurationInput(durationFormatted);

    setCatalogue((prev) =>
      prev.map((alb) => {
        if (alb.id !== albumId) return alb;
        return {
          ...alb,
          category: track.category,
          tracks: alb.tracks.map((t) =>
            t.id === track.id
              ? {
                  ...track,
                  duration: updatedDuration,
                  dropStart: Math.min(track.dropStart, Math.max(0, updatedDuration - 10)),
                }
              : t
          ),
        };
      })
    );
    setEditingTrack(null);
  };

  // --- Computed Analytics & Rankings ---
  const algoFilterOptions = useMemo(() => {
    if (algoDimension === 'CATEGORY') {
      return Array.from(new Set(allTracksFlat.map((t) => t.category)));
    }
    if (algoDimension === 'ARTIST') {
      return Array.from(new Set(allTracksFlat.map((t) => t.artist)));
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
    return [];
  }, [algoDimension, allTracksFlat]);

  const rankedFilteredTracks = useMemo(() => {
    let list = [...allTracksFlat];
    if (algoDimension !== 'GENERAL' && algoFilterValue !== 'ALL') {
      list = list.filter((t) => {
        if (algoDimension === 'CATEGORY') return t.category === algoFilterValue;
        if (algoDimension === 'ARTIST') return t.artist === algoFilterValue;
        if (algoDimension === 'LABEL') return t.labelName === algoFilterValue;
        if (algoDimension === 'BEATMAKER') return t.beatmakerName === algoFilterValue;
        if (algoDimension === 'ENGINEER') return t.soundEngineerName === algoFilterValue;
        return true;
      });
    }
    return list.sort((a, b) => b.algoPoints - a.algoPoints);
  }, [allTracksFlat, algoDimension, algoFilterValue]);

  const groupedDimensionRankings = useMemo(() => {
    const groups: Record<
      string,
      {
        name: string;
        tracksCount: number;
        totalPoints: number;
      }
    > = {};

    for (const t of allTracksFlat) {
      let key = t.category;
      if (algoDimension === 'ARTIST') key = t.artist;
      else if (algoDimension === 'LABEL') key = t.labelName;
      else if (algoDimension === 'BEATMAKER') key = t.beatmakerName;
      else if (algoDimension === 'ENGINEER') key = t.soundEngineerName;
      else if (algoDimension === 'CATEGORY') key = t.category;

      if (!groups[key]) {
        groups[key] = {
          name: key,
          tracksCount: 0,
          totalPoints: 0,
        };
      }
      groups[key].tracksCount += 1;
      groups[key].totalPoints = Math.round((groups[key].totalPoints + t.algoPoints) * 100) / 100;
    }

    return Object.values(groups).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [allTracksFlat, algoDimension]);

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

  // Selected Full-Screen Artist Detail
  const selectedArtistAnalytics = useMemo(() => {
    if (!selectedArtistName) return null;
    const artistTracks = allTracksFlat
      .filter((t) => t.artist.toLowerCase() === selectedArtistName.toLowerCase())
      .sort((a, b) => b.algoPoints - a.algoPoints);

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
      artistName: artistTracks[0].artist,
      primaryCategory: artistTracks[0].category,
      cover: artistTracks[0].cover,
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
      },
      topListeners,
    };
  }, [selectedArtistName, allTracksFlat, users]);

  const dropStartPct = (currentTrack.dropStart / currentTrack.duration) * 100;
  const dropWidthPct = (currentTrack.dropDuration / currentTrack.duration) * 100;
  const playheadPct = Math.min(100, (currentTime / currentTrack.duration) * 100);
  const isCurrentLiked = !!likedTrackIds[currentTrack.id];
  const currentRankInfo = trackRankMap[currentTrack.id] || { rank: 1, delta: 0 };

  return (
    <div className="relative h-[100dvh] w-full max-w-full bg-[#07080C] text-[#F5F2EB] overflow-hidden select-none flex flex-col">
      {/* Persistent Background Audio Engines (Never Unmounted) */}
      <audio ref={htmlAudioRef} className="hidden" preload="auto" />
      <audio ref={uploadPreviewAudioRef} className="hidden" preload="auto" />
      <div
        id="hidden-external-audio-stream"
        className="fixed -top-[9999px] -left-[9999px] w-px h-px opacity-0 pointer-events-none"
      />

      {/* Ambient Atmospheric Tint */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20 transition-all duration-700"
        style={{
          background:
            appView === 'ADMIN'
              ? 'radial-gradient(circle at 80% 15%, rgba(16, 185, 129, 0.14), transparent 60%)'
              : 'radial-gradient(circle at 50% 28%, rgba(255, 85, 0, 0.18), transparent 62%)',
        }}
      />

      {/* Global Top Bar — Strictly Contained Within Mobile Safe Zone */}
      <header className="relative z-30 w-full flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 border-b border-white/[0.07] bg-[#0B0D13]/90 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#FF5500]/15 border border-[#FF5500]/40 flex items-center justify-center shrink-0">
            <Compass className="w-3.5 h-3.5 text-[#FF5500]" />
          </div>
          <span className="font-bold tracking-tight text-sm text-[#F5F2EB] truncate">Aura2d</span>

          {appView !== 'PLAYER' && isPlaying && (
            <button
              onClick={() => setAppView('PLAYER')}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#FF5500]/15 border border-[#FF5500]/30 text-[11px] text-[#FF5500] font-mono shrink-0"
              title="Retourner au lecteur"
            >
              <Volume2 className="w-3 h-3 animate-pulse shrink-0" />
              <span className="hidden sm:inline truncate max-w-[100px]">{currentTrack.title}</span>
            </button>
          )}
        </div>

        {/* Right Controls — Compact Icon-First Safe Zone */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => streamTracker.setSimulatedOffline(!syncSnapshot.simulatedOffline)}
            title={
              syncSnapshot.isOnline
                ? 'En ligne — Simuler Hors-Ligne'
                : 'Mode Avion actif — Reconnecter'
            }
            className={`h-7 px-2 rounded-lg text-[11px] font-mono transition-colors flex items-center gap-1 border ${
              syncSnapshot.isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
            }`}
          >
            {syncSnapshot.isOnline ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            {syncSnapshot.queue.length > 0 && (
              <span className="text-[10px] font-bold">{syncSnapshot.queue.length}</span>
            )}
          </button>

          <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.07]">
            <button
              onClick={() => setAppView('PLAYER')}
              title="Lecteur"
              className={`h-6 px-2.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                appView === 'PLAYER'
                  ? 'bg-[#FF5500] text-[#07080C] font-semibold'
                  : 'text-[#8E93A4] hover:text-[#F5F2EB]'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lecteur</span>
            </button>
            <button
              onClick={() => setAppView('ADMIN')}
              title="Admin"
              className={`h-6 px-2.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                appView === 'ADMIN'
                  ? 'bg-emerald-500 text-[#07080C] font-semibold'
                  : 'text-[#8E93A4] hover:text-[#F5F2EB]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>
            <button
              onClick={() => setAppView('AUTH')}
              title="Connexion"
              className={`h-6 px-2 rounded-md text-xs font-medium transition-colors flex items-center ${
                appView === 'AUTH'
                  ? 'bg-white/15 text-[#F5F2EB]'
                  : 'text-[#8E93A4] hover:text-[#F5F2EB]'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* VIEW 1: AUTHENTICATION PORTAL                                         */}
      {/* ===================================================================== */}
      {appView === 'AUTH' && (
        <main className="relative z-10 flex-1 w-full flex items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-sm bg-[#0E1118] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF5500] block truncate">
                  Aura2d
                </span>
                <h1 className="text-lg font-bold tracking-tight truncate">
                  {authMode === 'LOGIN' ? 'Connexion' : 'Inscription'}
                </h1>
              </div>
              <div className="flex bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.07] text-xs shrink-0">
                <button
                  onClick={() => setAuthMode('LOGIN')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    authMode === 'LOGIN' ? 'bg-white/10 text-[#F5F2EB]' : 'text-[#8E93A4]'
                  }`}
                >
                  Accès
                </button>
                <button
                  onClick={() => setAuthMode('REGISTER')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    authMode === 'REGISTER' ? 'bg-white/10 text-[#F5F2EB]' : 'text-[#8E93A4]'
                  }`}
                >
                  Créer
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {authMode === 'REGISTER' && (
                <div>
                  <label className="block text-[11px] text-[#8E93A4] mb-1">Nom</label>
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-[#FF5500]"
                  />
                </div>
              )}
              <div>
                <label className="block text-[11px] text-[#8E93A4] mb-1">E-mail</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="nom@aura2d.io"
                  className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-[#FF5500]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => handleQuickEnter('PLAYER', 'USER')}
                className="flex flex-col items-start justify-between p-3.5 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 hover:bg-[#FF5500]/20 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FF5500] text-[#07080C] flex items-center justify-center mb-2">
                  <Music className="w-4 h-4" />
                </div>
                <div className="min-w-0 w-full">
                  <div className="text-sm font-semibold text-[#F5F2EB] truncate">Lecteur 2D</div>
                  <div className="text-[11px] text-[#8E93A4] truncate">Interface joueur</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickEnter('ADMIN', 'ADMIN')}
                className="flex flex-col items-start justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-[#07080C] flex items-center justify-center mb-2">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0 w-full">
                  <div className="text-sm font-semibold text-[#F5F2EB] truncate">Studio Admin</div>
                  <div className="text-[11px] text-[#8E93A4] truncate">Gestion & Rangs</div>
                </div>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: NATIVE 2D PLAYER — ULTRA-CLEAN MOBILE SAFE ZONE               */}
      {/* ONLY RANK (#1👑, #2🥈, #3🥉) + DELTA (+4 / -1), ZERO POINTS VISIBLE    */}
      {/* ===================================================================== */}
      {appView === 'PLAYER' && (
        <main className="relative z-10 flex-1 w-full max-w-sm mx-auto px-4 py-3 flex flex-col justify-between overflow-hidden">
          {/* Top Bar Inside Safe Zone: Rank Badge + Drop/Play Mode Pill */}
          <div className="w-full flex items-center justify-between gap-2 shrink-0">
            <RankBadge rank={currentRankInfo.rank} delta={currentRankInfo.delta} />

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-[11px] text-[#8E93A4] truncate max-w-[110px]">
                {currentTrack.category}
              </span>
              <button
                onClick={() => {
                  const nextDrop = !isDropMode;
                  setIsDropMode(nextDrop);
                  if (nextDrop) {
                    seekAllEngines(currentTrack.dropStart);
                  }
                }}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono border transition-colors shrink-0 ${
                  isDropMode
                    ? 'bg-[#FF5500]/15 text-[#FF5500] border-[#FF5500]/40'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                }`}
              >
                {isDropMode ? 'DROP' : 'PLAY'}
              </button>
            </div>
          </div>

          {/* Center 2D Interactive Cover — Strictly Contained */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative my-auto w-full flex flex-col items-center justify-center touch-none cursor-grab active:cursor-grabbing py-1"
          >
            {/* Cover Card with Beveled 3D Borders, Glossy Sheen & Cover-Only Drop Shadow */}
            <div
              style={{
                transform: `translate3d(${gestureDelta.x * 0.3}px, ${gestureDelta.y * 0.3}px, 0)`,
              }}
              className="cover-card-bevel cover-gloss-sheen relative w-full max-w-[268px] sm:max-w-[284px] aspect-square rounded-2xl overflow-hidden bg-[#12151F] transition-transform duration-150"
            >
              {currentTrack.cover ? (
                <img
                  src={currentTrack.cover}
                  alt={currentTrack.title}
                  draggable={false}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#181C29] to-[#0B0D14] text-[#8E93A4]">
                  <Disc className="w-12 h-12 text-[#FF5500]/60 mb-2" />
                  <span className="text-xs font-mono uppercase tracking-widest px-3 truncate">
                    {currentTrack.artist}
                  </span>
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

              {/* Top-left Compact Time/Drop Indicator */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-md border border-white/15 text-[10px] font-mono">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPlaying
                      ? isDropMode
                        ? 'bg-[#FF5500] animate-pulse'
                        : 'bg-emerald-400 animate-pulse'
                      : 'bg-white/40'
                  }`}
                />
                <span>
                  {isDropMode
                    ? `DROP ${formatTime(currentTrack.dropStart)}`
                    : formatTime(currentTrack.duration)}
                </span>
              </div>

              {/* Bottom Inside Cover: Track Title, Artist & Small Like Heart at Bottom-Right */}
              <div className="absolute bottom-3 inset-x-3 z-20 flex items-end justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-[#F5F2EB] truncate leading-tight">
                    {currentTrack.title}
                  </h2>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedArtistName(currentTrack.artist);
                      setAppView('ADMIN');
                    }}
                    className="text-xs text-[#D5D8E2] hover:text-[#FF5500] transition-colors truncate flex items-center gap-0.5 max-w-full"
                  >
                    <span className="truncate">{currentTrack.artist}</span>
                    <ChevronRight className="w-3 h-3 shrink-0 opacity-75" />
                  </button>
                </div>

                {/* Small Like Button on Cover Bottom-Right (No counter displayed) */}
                <button
                  onClick={(e) => toggleLike(currentTrack.id, e)}
                  aria-label="Aimer ce titre"
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                    isCurrentLiked
                      ? 'bg-[#FF5500] border-[#FF5500] text-[#07080C]'
                      : 'bg-black/60 border-white/20 text-[#F5F2EB] hover:border-white/40'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isCurrentLiked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Track Depth Dots (Axe Y) */}
            <div className="flex items-center justify-center gap-1.5 mt-3 max-w-full overflow-hidden px-2">
              {currentAlbum.tracks.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => {
                    finalizeListeningSessionOnZap();
                    setTrackIdx(idx);
                    setIsDropMode(true);
                    seekAllEngines(t.dropStart);
                    setIsPlaying(true);
                  }}
                  className={`h-1.5 rounded-full transition-all shrink-0 ${
                    idx === safeTrackIdx ? 'w-5 bg-[#FF5500]' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Scrubber & Clean Time Labels */}
          <div className="w-full flex flex-col gap-1.5 shrink-0">
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const nextSec = Math.floor(ratio * currentTrack.duration);
                setIsDropMode(false);
                if (!manualSessionRef.current.active) {
                  manualSessionRef.current = {
                    trackId: currentTrack.id,
                    active: true,
                    listenedSeconds: 0,
                    playCountedAtOneSec: false,
                    sessionPointsEarned: 0,
                  };
                }
                seekAllEngines(nextSec);
              }}
              className="relative h-2 w-full rounded-full bg-white/[0.08] cursor-pointer overflow-hidden"
            >
              <div
                style={{ left: `${dropStartPct}%`, width: `${dropWidthPct}%` }}
                className="absolute inset-y-0 bg-[#FF5500]/30 border-x border-[#FF5500]/70"
              />
              <div
                style={{ width: `${playheadPct}%` }}
                className="absolute inset-y-0 left-0 bg-[#F5F2EB] transition-all duration-150"
              />
            </div>

            <div className="w-full flex items-center justify-between text-[11px] font-mono text-[#8E93A4]">
              <span>{formatTime(currentTime)}</span>
              <span className="text-[10px] text-[#FF5500]">
                DROP {formatTime(currentTrack.dropStart)}
              </span>
              <span>{formatTime(currentTrack.duration)}</span>
            </div>
          </div>

          {/* Spotify-Proportioned Transport Bar */}
          <div className="w-full flex items-center justify-between px-1 pt-2 pb-1 shrink-0">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isShuffle ? 'text-[#FF5500]' : 'text-[#8E93A4] hover:text-[#F5F2EB]'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-5">
              <button
                onClick={() => navigateTrack(-1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#F5F2EB] hover:text-[#FF5500] transition-colors"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={handleCentralPlayToggle}
                className="w-10 h-10 rounded-full bg-[#F5F2EB] text-[#07080C] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                {isPlaying && !isDropMode ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={() => navigateTrack(1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#F5F2EB] hover:text-[#FF5500] transition-colors"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </div>

            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isRepeat
                  ? 'text-[#FF5500] bg-[#FF5500]/10 border border-[#FF5500]/30'
                  : 'text-[#8E93A4] hover:text-[#F5F2EB]'
              }`}
            >
              <Repeat className="w-4 h-4" />
              {isRepeat && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF5500]" />
              )}
            </button>
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* VIEW 3: STUDIO ADMIN — STRICT SAFE ZONE + CLICKABLE FULL-PAGE SHEETS  */}
      {/* ===================================================================== */}
      {appView === 'ADMIN' && (
        <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-3 sm:px-5 py-3 flex flex-col overflow-hidden gap-3">
          {/* ================================================================= */}
          {/* SHEET A: FULL-SCREEN TRACK DETAIL (FICHE TITRE PLEINE PAGE)       */}
          {/* ================================================================= */}
          {selectedTrackDetail ? (
            <div className="flex-1 w-full flex flex-col bg-[#0D1017] border border-white/[0.08] rounded-2xl p-4 overflow-hidden gap-4">
              {/* Top Navigation Bar */}
              <div className="w-full flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07] shrink-0">
                <button
                  onClick={() => setSelectedTrackId(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-[#F5F2EB] flex items-center gap-1.5 shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>

                <RankBadge
                  rank={selectedTrackDetail.rankInfo.rank}
                  delta={selectedTrackDetail.rankInfo.delta}
                />
              </div>

              {/* Scrollable Track Full Details */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-0.5">
                {/* Track Identity Card */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#07080C] border border-white/[0.07] rounded-xl p-4">
                  <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                    <div className="w-16 h-16 rounded-xl overflow-hidden cover-card-bevel cover-gloss-sheen shrink-0">
                      {selectedTrackDetail.track.cover ? (
                        <img
                          src={selectedTrackDetail.track.cover}
                          alt={selectedTrackDetail.track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#151926] flex items-center justify-center">
                          <Disc className="w-6 h-6 text-[#FF5500]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="px-2 py-0.5 rounded bg-[#FF5500]/15 text-[#FF5500] text-[10px] font-mono">
                        {selectedTrackDetail.track.category}
                      </span>
                      <h2 className="text-base font-bold text-[#F5F2EB] truncate mt-1">
                        {selectedTrackDetail.track.title}
                      </h2>
                      <button
                        onClick={() => {
                          const artist = selectedTrackDetail.track.artist;
                          setSelectedTrackId(null);
                          setSelectedArtistName(artist);
                        }}
                        className="text-xs text-[#8E93A4] hover:text-[#FF5500] flex items-center gap-1 truncate mt-0.5"
                      >
                        <span className="truncate">{selectedTrackDetail.track.artist}</span>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#FF5500]" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions on Track */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                    <button
                      onClick={() => {
                        finalizeListeningSessionOnZap();
                        setAlbumIdx(selectedTrackDetail.albumIndex);
                        setTrackIdx(selectedTrackDetail.trackIndex);
                        setIsDropMode(false);
                        seekAllEngines(0);
                        manualSessionRef.current = {
                          trackId: selectedTrackDetail.track.id,
                          active: true,
                          listenedSeconds: 0,
                          playCountedAtOneSec: false,
                          sessionPointsEarned: 0,
                        };
                        setIsPlaying(true);
                        setAppView('PLAYER');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#FF5500] text-[#07080C] font-bold text-xs flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Lire</span>
                    </button>
                    <button
                      onClick={() =>
                        setEditingTrack({
                          albumId: selectedTrackDetail.album.id,
                          track: { ...selectedTrackDetail.track },
                          durationFormatted: formatTime(selectedTrackDetail.track.duration),
                        })
                      }
                      className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[#F5F2EB]"
                      title="Modifier"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteTrack(
                          selectedTrackDetail.album.id,
                          selectedTrackDetail.track.id
                        )
                      }
                      className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Deep Metrics Grid (Icon-First) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between">
                    <Play className="w-4 h-4 fill-current text-[#FF5500]" />
                    <span className="font-mono text-sm font-bold text-[#F5F2EB]">
                      {selectedTrackDetail.track.realPlays}
                    </span>
                  </div>
                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between">
                    <Repeat className="w-4 h-4 text-amber-300" />
                    <span className="font-mono text-sm font-bold text-amber-300">
                      {selectedTrackDetail.track.loopPlaysCount}
                    </span>
                  </div>
                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between">
                    <Heart className="w-4 h-4 fill-current text-rose-400" />
                    <span className="font-mono text-sm font-bold text-rose-400">
                      {selectedTrackDetail.track.likesCount}
                    </span>
                  </div>
                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      {selectedTrackDetail.track.avgRetentionPct}%
                    </span>
                  </div>
                </div>

                {/* Studio Credits & Timing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
                      Crédits Studio
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#8E93A4]">
                        <Building2 className="w-3.5 h-3.5 text-[#FF5500]" />
                        Label
                      </span>
                      <span className="font-semibold text-[#F5F2EB] truncate max-w-[160px]">
                        {selectedTrackDetail.track.labelName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#8E93A4]">
                        <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                        Beatmaker
                      </span>
                      <span className="font-semibold text-[#F5F2EB] truncate max-w-[160px]">
                        {selectedTrackDetail.track.beatmakerName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#8E93A4]">
                        <Headphones className="w-3.5 h-3.5 text-amber-300" />
                        Ingé Son
                      </span>
                      <span className="font-semibold text-[#F5F2EB] truncate max-w-[160px]">
                        {selectedTrackDetail.track.soundEngineerName}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
                      Paramètres Audio
                    </span>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#8E93A4]">Durée totale</span>
                      <span className="text-[#F5F2EB] font-bold">
                        {formatTime(selectedTrackDetail.track.duration)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#8E93A4]">Zone de Drop</span>
                      <span className="text-[#FF5500] font-bold">
                        {formatTime(selectedTrackDetail.track.dropStart)} →{' '}
                        {formatTime(
                          Math.min(
                            selectedTrackDetail.track.duration,
                            selectedTrackDetail.track.dropStart +
                              selectedTrackDetail.track.dropDuration
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#8E93A4]">Temps d'écoute cumulé</span>
                      <span className="text-emerald-400 font-bold">
                        {formatLongDuration(selectedTrackDetail.track.totalListenSeconds)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedArtistAnalytics ? (
            /* ================================================================= */
            /* SHEET B: FULL-SCREEN ARTIST PROFILE (FICHE ARTISTE PLEINE PAGE)   */
            /* ================================================================= */
            <div className="flex-1 w-full flex flex-col bg-[#0D1017] border border-white/[0.08] rounded-2xl p-4 overflow-hidden gap-4">
              <div className="w-full flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07] shrink-0">
                <button
                  onClick={() => setSelectedArtistName(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-[#F5F2EB] flex items-center gap-1.5 shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 truncate">
                  {selectedArtistAnalytics.primaryCategory}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-0.5">
                {/* Artist Header */}
                <div className="flex items-center gap-3.5 bg-[#07080C] border border-white/[0.07] rounded-xl p-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden cover-card-bevel cover-gloss-sheen shrink-0">
                    {selectedArtistAnalytics.cover ? (
                      <img
                        src={selectedArtistAnalytics.cover}
                        alt={selectedArtistAnalytics.artistName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#151926] flex items-center justify-center">
                        <Disc className="w-5 h-5 text-[#FF5500]" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-[#F5F2EB] truncate">
                      {selectedArtistAnalytics.artistName}
                    </h2>
                    <div className="flex items-center gap-3 text-xs font-mono text-[#8E93A4] mt-1">
                      <span className="flex items-center gap-1 text-[#F5F2EB]">
                        <Play className="w-3 h-3 fill-current text-[#FF5500]" />
                        {selectedArtistAnalytics.totalPlays}
                      </span>
                      <span className="flex items-center gap-1 text-amber-300">
                        <Repeat className="w-3 h-3" />
                        {selectedArtistAnalytics.totalLoops}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Zap className="w-3 h-3" />
                        {selectedArtistAnalytics.avgRetention}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Discography List (Clean Rank + Title + Click for Track Sheet) */}
                <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
                    Discographie ({selectedArtistAnalytics.tracks.length})
                  </span>
                  {selectedArtistAnalytics.tracks.map((t) => {
                    const rInfo = trackRankMap[t.id] || { rank: 1, delta: 0 };
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedArtistName(null);
                          setSelectedTrackId(t.id);
                        }}
                        className="w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06] hover:border-white/20 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg overflow-hidden cover-card-bevel shrink-0">
                            {t.cover ? (
                              <img
                                src={t.cover}
                                alt={t.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#151926] flex items-center justify-center">
                                <Disc className="w-4 h-4 text-[#FF5500]" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#F5F2EB] truncate">
                              {t.title}
                            </div>
                            <div className="text-[11px] font-mono text-[#8E93A4] truncate">
                              {formatTime(t.duration)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <RankBadge rank={rInfo.rank} delta={rInfo.delta} />
                          <ChevronRight className="w-4 h-4 text-[#8E93A4]" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Studio Team & Top Listeners */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
                      Équipe Studio
                    </span>
                    {[
                      ...selectedArtistAnalytics.studioTeam.labels,
                      ...selectedArtistAnalytics.studioTeam.beatmakers,
                      ...selectedArtistAnalytics.studioTeam.engineers,
                    ].map((member) => (
                      <div
                        key={`${member.role}-${member.name}`}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {member.role === 'LABEL' && (
                            <Building2 className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                          )}
                          {member.role === 'BEATMAKER' && (
                            <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          {member.role === 'ENGINEER' && (
                            <Mic2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          )}
                          <span className="font-semibold text-[#F5F2EB] truncate">
                            {member.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8E93A4] shrink-0">
                          {member.tracksCount} titre(s)
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
                      Top Auditeurs Fidèles
                    </span>
                    {selectedArtistAnalytics.topListeners.map((listener, idx) => (
                      <div
                        key={listener.user.id}
                        onClick={() => {
                          setSelectedArtistName(null);
                          setSelectedConsumerUserId(listener.user.id);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] hover:border-emerald-500/40 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <RankBadge rank={idx + 1} delta={0} />
                          <span className="font-semibold text-[#F5F2EB] truncate">
                            {listener.user.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#8E93A4] shrink-0">
                          <span>{formatLongDuration(listener.listenSeconds)}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : selectedConsumerUser && consumerAnalytics ? (
            /* ================================================================= */
            /* SHEET C: FULL-SCREEN CONSUMER USER PROFILE                        */
            /* ================================================================= */
            <div className="flex-1 w-full flex flex-col bg-[#0D1017] border border-white/[0.08] rounded-2xl p-4 overflow-hidden gap-4">
              <div className="w-full flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07] shrink-0">
                <button
                  onClick={() => setSelectedConsumerUserId(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-[#F5F2EB] flex items-center gap-1.5 shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
                <RankBadge
                  rank={
                    [...users]
                      .sort((a, b) => b.totalListenSeconds - a.totalListenSeconds)
                      .findIndex((u) => u.id === selectedConsumerUser.id) + 1
                  }
                  delta={0}
                />
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-0.5">
                {/* User Identity */}
                <div className="flex items-center justify-between gap-3 bg-[#07080C] border border-white/[0.07] rounded-xl p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center font-bold text-sm text-emerald-300 shrink-0">
                      {selectedConsumerUser.avatar}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-[#F5F2EB] truncate">
                        {selectedConsumerUser.name}
                      </h2>
                      <div className="text-xs text-[#8E93A4] font-mono truncate">
                        {selectedConsumerUser.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs shrink-0">
                    <span className="flex items-center gap-1 text-[#F5F2EB]">
                      <Clock className="w-3.5 h-3.5 text-[#FF5500]" />
                      {formatLongDuration(selectedConsumerUser.totalListenSeconds)}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {selectedConsumerUser.totalValidatedPlays}
                    </span>
                  </div>
                </div>

                {/* Top Looped Track & Genres */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#07080C] border border-amber-500/30 rounded-xl p-3.5 flex flex-col gap-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5" />
                      Titre le plus écouté en boucle
                    </span>
                    {consumerAnalytics.topLoopedItem ? (
                      <div
                        onClick={() => {
                          const tId = consumerAnalytics.topLoopedItem!.track.id;
                          setSelectedConsumerUserId(null);
                          setSelectedTrackId(tId);
                        }}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden cover-card-bevel shrink-0">
                          <img
                            src={consumerAnalytics.topLoopedItem.track.cover}
                            alt={consumerAnalytics.topLoopedItem.track.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#F5F2EB] truncate">
                            {consumerAnalytics.topLoopedItem.track.title}
                          </div>
                          <div className="text-[11px] text-[#8E93A4] truncate">
                            {consumerAnalytics.topLoopedItem.track.artist}
                          </div>
                          <div className="text-[11px] font-mono text-amber-300 mt-0.5">
                            {consumerAnalytics.topLoopedItem.stat.loopsCount}x boucles (Max:{' '}
                            {consumerAnalytics.topLoopedItem.stat.maxConsecutiveLoops}x)
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#8E93A4]">Aucune boucle.</div>
                    )}
                  </div>

                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF5500] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      Genres favoris
                    </span>
                    {consumerAnalytics.favoriteGenres.map((g, i) => (
                      <div
                        key={g.category}
                        className="flex items-center justify-between text-xs font-mono"
                      >
                        <span className="text-[#F5F2EB] truncate">
                          #{i + 1} {g.category}
                        </span>
                        <span className="text-[#8E93A4]">{formatLongDuration(g.seconds)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Listened Tracks */}
                <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E93A4]">
                    Historique par titre
                  </span>
                  {consumerAnalytics.byListenTime.map(({ stat, track }) => {
                    const rInfo = trackRankMap[track.id] || { rank: 1, delta: 0 };
                    return (
                      <div
                        key={track.id}
                        onClick={() => {
                          setSelectedConsumerUserId(null);
                          setSelectedTrackId(track.id);
                        }}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.05] hover:border-white/20 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-lg overflow-hidden cover-card-bevel shrink-0">
                            <img
                              src={track.cover}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#F5F2EB] truncate">
                              {track.title}
                            </div>
                            <div className="text-[11px] font-mono text-[#8E93A4] truncate">
                              {formatTime(stat.listenSeconds)} • {stat.loopsCount}x ↻
                            </div>
                          </div>
                        </div>
                        <RankBadge rank={rInfo.rank} delta={rInfo.delta} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* STANDARD ADMIN INTERFACE — STRICT MOBILE SAFE ZONE                */
            /* ================================================================= */
            <>
              {/* Main Admin Navigation Bar — 3 Clean Tabs, Zero Overflow */}
              <div className="w-full grid grid-cols-3 gap-1.5 bg-[#0E1118] p-1 rounded-xl border border-white/[0.07] shrink-0">
                <button
                  onClick={() => setAdminMainTab('CATALOGUE')}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 truncate ${
                    adminMainTab === 'CATALOGUE'
                      ? 'bg-[#FF5500] text-[#07080C] font-bold'
                      : 'text-[#8E93A4] hover:text-[#F5F2EB]'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Catalogue</span>
                </button>
                <button
                  onClick={() => setAdminMainTab('UPLOAD')}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 truncate ${
                    adminMainTab === 'UPLOAD'
                      ? 'bg-[#FF5500] text-[#07080C] font-bold'
                      : 'text-[#8E93A4] hover:text-[#F5F2EB]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Ajout</span>
                </button>
                <button
                  onClick={() => setAdminMainTab('USERS')}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 truncate ${
                    adminMainTab === 'USERS'
                      ? 'bg-[#FF5500] text-[#07080C] font-bold'
                      : 'text-[#8E93A4] hover:text-[#F5F2EB]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Auditeurs</span>
                </button>
              </div>

              {/* =============================================================== */}
              {/* MAIN TAB 1: CATALOGUE (RÉPERTOIRE | CLASSEMENTS | OFFLINE)      */}
              {/* =============================================================== */}
              {adminMainTab === 'CATALOGUE' && (
                <div className="flex-1 w-full flex flex-col overflow-hidden gap-2.5">
                  {/* Sub-Navigation Inside Catalogue */}
                  <div className="w-full grid grid-cols-3 gap-1 bg-[#0D1017] p-1 rounded-xl border border-white/[0.07] shrink-0">
                    <button
                      onClick={() => setCatalogueSubTab('REPERTOIRE')}
                      className={`py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 truncate ${
                        catalogueSubTab === 'REPERTOIRE'
                          ? 'bg-white/15 text-[#F5F2EB] font-semibold'
                          : 'text-[#8E93A4]'
                      }`}
                    >
                      <Disc className="w-3 h-3 text-[#FF5500] shrink-0" />
                      <span className="truncate">Pistes</span>
                    </button>
                    <button
                      onClick={() => setCatalogueSubTab('ALGO')}
                      className={`py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 truncate ${
                        catalogueSubTab === 'ALGO'
                          ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                          : 'text-[#8E93A4]'
                      }`}
                    >
                      <Flame className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">Rangs</span>
                    </button>
                    <button
                      onClick={() => setCatalogueSubTab('RULES')}
                      className={`py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 truncate ${
                        catalogueSubTab === 'RULES'
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-[#8E93A4]'
                      }`}
                    >
                      <Database className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">Offline ({syncSnapshot.queue.length})</span>
                    </button>
                  </div>

                  {/* SUB-TAB 1.1: PISTES — ULTRA-CLEAN CARDS (ONLY RANK #1👑 + DELTA + CLICK FOR FULL SHEET) */}
                  {catalogueSubTab === 'REPERTOIRE' && (
                    <div className="flex-1 w-full overflow-y-auto flex flex-col gap-2.5 pr-0.5">
                      <div className="w-full flex items-center gap-2">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Rechercher un titre ou artiste..."
                          className="flex-1 min-w-0 bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#FF5500]"
                        />
                        <button
                          onClick={handleAutoReorderByAlgo}
                          className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-semibold shrink-0"
                          title="Trier le flux 2D par rang"
                        >
                          Trier 2D
                        </button>
                      </div>

                      {catalogue.map((alb, aIdx) => {
                        const filteredTracks = alb.tracks.filter((t) => {
                          if (!searchQuery.trim()) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            t.title.toLowerCase().includes(q) ||
                            t.artist.toLowerCase().includes(q) ||
                            t.category.toLowerCase().includes(q)
                          );
                        });
                        if (filteredTracks.length === 0) return null;

                        return (
                          <div
                            key={alb.id}
                            className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl p-3 flex flex-col gap-2"
                          >
                            {/* Clean Artist / Album Header */}
                            <div className="w-full flex items-center justify-between gap-2 pb-1.5 border-b border-white/[0.06]">
                              <button
                                onClick={() => setSelectedArtistName(alb.artist)}
                                className="min-w-0 flex-1 flex items-center gap-2 text-left group"
                              >
                                <span className="px-1.5 py-0.5 rounded bg-[#FF5500]/15 text-[#FF5500] font-mono text-[10px] shrink-0">
                                  X:{aIdx + 1}
                                </span>
                                <span className="text-xs font-bold text-[#F5F2EB] group-hover:text-[#FF5500] truncate">
                                  {alb.artist}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-[#8E93A4] shrink-0" />
                              </button>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleMoveAlbumOrder(aIdx, -1)}
                                  disabled={aIdx === 0}
                                  className="p-1 rounded bg-white/[0.04] text-[#8E93A4] disabled:opacity-30"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMoveAlbumOrder(aIdx, 1)}
                                  disabled={aIdx === catalogue.length - 1}
                                  className="p-1 rounded bg-white/[0.04] text-[#8E93A4] disabled:opacity-30"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Track Rows: Cover + Title/Artist + Rank Badge (#1👑 / #2🥈 / #3🥉 + Delta) ONLY */}
                            <div className="w-full flex flex-col gap-1.5">
                              {filteredTracks.map((t) => {
                                const rInfo = trackRankMap[t.id] || { rank: 1, delta: 0 };
                                return (
                                  <div
                                    key={t.id}
                                    onClick={() => setSelectedTrackId(t.id)}
                                    className="w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#07080C] border border-white/[0.06] hover:border-[#FF5500]/40 cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <div className="w-10 h-10 rounded-lg overflow-hidden cover-card-bevel cover-gloss-sheen shrink-0">
                                        {t.cover ? (
                                          <img
                                            src={t.cover}
                                            alt={t.title}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-[#161A26] flex items-center justify-center">
                                            <Disc className="w-4 h-4 text-[#FF5500]" />
                                          </div>
                                        )}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-bold text-[#F5F2EB] truncate">
                                          {t.title}
                                        </div>
                                        <div className="text-[11px] text-[#8E93A4] truncate">
                                          {t.artist} • {formatTime(t.duration)}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <RankBadge rank={rInfo.rank} delta={rInfo.delta} />
                                      <ChevronRight className="w-4 h-4 text-[#8E93A4]" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SUB-TAB 1.2: CLASSEMENTS PAR RANG (#1👑, #2🥈, #3🥉 + VARIATION +4 / -8) */}
                  {catalogueSubTab === 'ALGO' && (
                    <div className="flex-1 w-full overflow-y-auto flex flex-col gap-2.5 pr-0.5">
                      {/* Dimension Filter Bar */}
                      <div className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl p-2.5 flex flex-col gap-2">
                        <div className="w-full grid grid-cols-3 sm:grid-cols-6 gap-1">
                          {(
                            [
                              { id: 'GENERAL', label: 'Général' },
                              { id: 'CATEGORY', label: 'Genre' },
                              { id: 'ARTIST', label: 'Artiste' },
                              { id: 'LABEL', label: 'Label' },
                              { id: 'BEATMAKER', label: 'Beatmaker' },
                              { id: 'ENGINEER', label: 'Ingé Son' },
                            ] as const
                          ).map((dim) => (
                            <button
                              key={dim.id}
                              onClick={() => {
                                setAlgoDimension(dim.id);
                                setAlgoFilterValue('ALL');
                              }}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-colors truncate ${
                                algoDimension === dim.id
                                  ? 'bg-[#FF5500] text-[#07080C] font-bold'
                                  : 'bg-[#07080C] text-[#8E93A4]'
                              }`}
                            >
                              {dim.label}
                            </button>
                          ))}
                        </div>

                        {algoDimension !== 'GENERAL' && (
                          <div className="w-full flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-[#8E93A4] shrink-0" />
                            <select
                              value={algoFilterValue}
                              onChange={(e) => setAlgoFilterValue(e.target.value)}
                              className="flex-1 min-w-0 bg-[#07080C] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F2EB] focus:outline-none"
                            >
                              <option value="ALL">Tout afficher ({algoFilterOptions.length})</option>
                              {algoFilterOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Group Ranking Cards when Dimension != GENERAL */}
                      {algoDimension !== 'GENERAL' && (
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {groupedDimensionRankings.map((grp, idx) => (
                            <div
                              key={grp.name}
                              onClick={() => {
                                if (algoDimension === 'ARTIST') {
                                  setSelectedArtistName(grp.name);
                                } else {
                                  setAlgoFilterValue(
                                    algoFilterValue === grp.name ? 'ALL' : grp.name
                                  );
                                }
                              }}
                              className="w-full flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0D1017] border border-white/[0.08] hover:border-[#FF5500]/40 cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <RankBadge rank={idx + 1} delta={0} />
                                <span className="text-xs font-bold text-[#F5F2EB] truncate">
                                  {grp.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8E93A4] shrink-0">
                                <span>{grp.tracksCount} titres</span>
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ranked Tracks List — ONLY Rank (#1👑, #2🥈, #3🥉) + Delta (+4 / -8), Clickable for Full Details */}
                      <div className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl p-2.5 flex flex-col gap-1.5">
                        {rankedFilteredTracks.map((t, index) => {
                          const globalRank = trackRankMap[t.id] || { rank: index + 1, delta: 0 };
                          const displayRank =
                            algoDimension === 'GENERAL' && algoFilterValue === 'ALL'
                              ? globalRank.rank
                              : index + 1;
                          return (
                            <div
                              key={t.id}
                              onClick={() => setSelectedTrackId(t.id)}
                              className="w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#07080C] border border-white/[0.06] hover:border-[#FF5500]/40 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-lg overflow-hidden cover-card-bevel shrink-0">
                                  {t.cover ? (
                                    <img
                                      src={t.cover}
                                      alt={t.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-[#151824] flex items-center justify-center">
                                      <Disc className="w-4 h-4 text-[#FF5500]" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-[#F5F2EB] truncate">
                                    {t.title}
                                  </div>
                                  <div className="text-[11px] text-[#8E93A4] truncate">
                                    {t.artist} • {t.category}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <RankBadge rank={displayRank} delta={globalRank.delta} />
                                <ChevronRight className="w-4 h-4 text-[#8E93A4]" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 1.3: OFFLINE-FIRST QUEUE & SYNC */}
                  {catalogueSubTab === 'RULES' && (
                    <div className="flex-1 w-full overflow-y-auto flex flex-col gap-3 pr-0.5">
                      <div className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl p-3.5 flex flex-col gap-3">
                        <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.07]">
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-[#F5F2EB] truncate">
                              Synchronisation Offline-First (/api/sync-metrics)
                            </h3>
                            <p className="text-[11px] text-[#8E93A4] truncate">
                              Comptage silencieux en tâche de fond + Idempotence UUID
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() =>
                                streamTracker.setSimulatedOffline(!syncSnapshot.simulatedOffline)
                              }
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                                syncSnapshot.isOnline
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              }`}
                            >
                              {syncSnapshot.isOnline ? (
                                <>
                                  <Wifi className="w-3.5 h-3.5" />
                                  <span>En ligne</span>
                                </>
                              ) : (
                                <>
                                  <WifiOff className="w-3.5 h-3.5" />
                                  <span>Mode Avion</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => streamTracker.sync()}
                              disabled={!syncSnapshot.isOnline || syncSnapshot.queue.length === 0}
                              className="px-2.5 py-1.5 rounded-lg bg-[#FF5500] text-[#07080C] text-xs font-bold disabled:opacity-40 flex items-center gap-1"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${
                                  syncSnapshot.isSyncing ? 'animate-spin' : ''
                                }`}
                              />
                              <span>Sync ({syncSnapshot.queue.length})</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="bg-[#07080C] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-2">
                            <span className="font-mono text-xs text-amber-300 font-semibold">
                              En attente ({syncSnapshot.queue.length})
                            </span>
                            {syncSnapshot.queue.length === 0 ? (
                              <div className="py-4 text-center text-[11px] font-mono text-[#8E93A4]">
                                File locale vide.
                              </div>
                            ) : (
                              <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5">
                                {syncSnapshot.queue.map((evt: OfflineStreamEvent) => (
                                  <div
                                    key={evt.eventId}
                                    className="flex items-center justify-between px-2 py-1.5 rounded bg-[#0D1017] border border-amber-500/25 font-mono text-[11px]"
                                  >
                                    <span className="text-amber-300 uppercase">{evt.action}</span>
                                    <span className="text-[#F5F2EB] truncate mx-2">
                                      {evt.trackId}
                                    </span>
                                    <span className="text-[#8E93A4] text-[10px] shrink-0">
                                      {evt.eventId.slice(0, 6)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="bg-[#07080C] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-2">
                            <span className="font-mono text-xs text-emerald-400 font-semibold">
                              Synchronisés ({syncSnapshot.totalSyncedCount})
                            </span>
                            {syncSnapshot.syncedHistory.length === 0 ? (
                              <div className="py-4 text-center text-[11px] font-mono text-[#8E93A4]">
                                Aucun lot envoyé.
                              </div>
                            ) : (
                              <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5">
                                {syncSnapshot.syncedHistory.slice(0, 10).map((evt) => (
                                  <div
                                    key={evt.eventId}
                                    className="flex items-center justify-between px-2 py-1.5 rounded bg-[#0D1017] border border-emerald-500/20 font-mono text-[11px]"
                                  >
                                    <span className="text-emerald-300 uppercase">{evt.action}</span>
                                    <span className="text-[#F5F2EB] truncate mx-2">
                                      {evt.trackId}
                                    </span>
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =============================================================== */}
              {/* MAIN TAB 2: 4-STEP ASSISTED UPLOAD WIZARD                       */}
              {/* =============================================================== */}
              {adminMainTab === 'UPLOAD' && (
                <div className="flex-1 w-full overflow-y-auto flex flex-col gap-2.5 pr-0.5">
                  {/* Compact 4-Step Indicator Fitting Mobile Safe Zone */}
                  <div className="w-full grid grid-cols-4 gap-1 bg-[#0D1017] border border-white/[0.08] rounded-xl p-1.5 shrink-0">
                    {(
                      [
                        { step: 1, title: '1. Fichiers' },
                        { step: 2, title: '2. Infos' },
                        { step: 3, title: '3. Crédits' },
                        { step: 4, title: '4. Drop' },
                      ] as const
                    ).map((s) => (
                      <button
                        key={s.step}
                        onClick={() => setWizardStep(s.step)}
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-medium transition-colors truncate ${
                          wizardStep === s.step
                            ? 'bg-[#FF5500] text-[#07080C] font-bold'
                            : wizardStep > s.step
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-white/[0.03] text-[#8E93A4]'
                        }`}
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>

                  {uploadSuccess && (
                    <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">{uploadSuccess}</span>
                    </div>
                  )}

                  <div className="flex-1 w-full bg-[#0D1017] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between gap-4">
                    {wizardStep === 1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#FF5500]">Source Audio</span>
                            <div className="flex bg-[#07080C] p-0.5 rounded-lg border border-white/[0.07] text-[11px]">
                              <button
                                type="button"
                                onClick={() => setUploadSourceType('FILE')}
                                className={`px-2 py-0.5 rounded ${
                                  uploadSourceType === 'FILE'
                                    ? 'bg-[#FF5500] text-[#07080C] font-semibold'
                                    : 'text-[#8E93A4]'
                                }`}
                              >
                                Fichier
                              </button>
                              <button
                                type="button"
                                onClick={() => setUploadSourceType('STREAM')}
                                className={`px-2 py-0.5 rounded ${
                                  uploadSourceType === 'STREAM'
                                    ? 'bg-[#FF5500] text-[#07080C] font-semibold'
                                    : 'text-[#8E93A4]'
                                }`}
                              >
                                Flux Externe
                              </button>
                            </div>
                          </div>

                          {uploadSourceType === 'FILE' ? (
                            <label className="flex flex-col items-center justify-center border border-dashed border-white/15 rounded-xl p-5 cursor-pointer hover:border-[#FF5500]/60 bg-[#07080C]/60 text-center">
                              <Upload className="w-5 h-5 text-[#FF5500] mb-1.5" />
                              <span className="text-xs font-medium text-[#F5F2EB] truncate max-w-full px-2">
                                {newAudioFileName || 'Sélectionner un fichier audio'}
                              </span>
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={handleAudioFileDrop}
                                className="hidden"
                              />
                            </label>
                          ) : (
                            <input
                              type="text"
                              value={newExternalUrl}
                              onChange={(e) => setNewExternalUrl(e.target.value)}
                              placeholder="Lien ou ID du flux audio externe..."
                              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-[#F5F2EB]"
                            />
                          )}

                          {(isUploadingFile || uploadProgress > 0) && (
                            <div className="bg-[#07080C] border border-white/[0.08] rounded-xl p-2.5">
                              <div className="flex justify-between text-[11px] font-mono mb-1">
                                <span className="text-[#8E93A4]">Progression</span>
                                <span className="text-[#FF5500]">{uploadProgress}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                <div
                                  style={{ width: `${uploadProgress}%` }}
                                  className="h-full bg-[#FF5500]"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-400">
                              Cover (Upload Manuel)
                            </span>
                            {newCoverFileUrl && (
                              <button
                                type="button"
                                onClick={handleRemoveNewCover}
                                className="text-[11px] text-rose-400 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Supprimer</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-3 bg-[#07080C] border border-white/[0.07] rounded-xl p-3">
                            <div className="w-16 h-16 rounded-xl overflow-hidden cover-card-bevel cover-gloss-sheen bg-[#12151F] shrink-0 flex items-center justify-center">
                              {newCoverFileUrl ? (
                                <img
                                  src={newCoverFileUrl}
                                  alt="Cover"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Disc className="w-6 h-6 text-[#8E93A4]/40" />
                              )}
                            </div>

                            <label className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs font-semibold text-[#F5F2EB] cursor-pointer text-center truncate">
                              {newCoverFileName || 'Importer Cover'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverFileSelect}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {wizardStep === 2 && (
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] text-[#8E93A4] mb-1">Titre *</label>
                            <input
                              type="text"
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              placeholder="Titre"
                              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-[#8E93A4] mb-1">
                              Artiste *
                            </label>
                            <input
                              type="text"
                              value={newArtist}
                              onChange={(e) => setNewArtist(e.target.value)}
                              placeholder="Artiste"
                              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-[#8E93A4] mb-1">
                              Durée totale (MM:SS)
                            </label>
                            <input
                              type="text"
                              value={newDurationFormatted}
                              onChange={(e) => setNewDurationFormatted(e.target.value)}
                              placeholder="02:42"
                              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-[#FF5500]"
                            />
                          </div>
                        </div>

                        <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-2">
                          <span className="text-[11px] text-[#8E93A4]">Catégorie</span>
                          <div className="flex flex-wrap gap-1.5">
                            {categories.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setNewCategory(cat)}
                                className={`px-2.5 py-1 rounded-lg text-xs ${
                                  newCategory === cat
                                    ? 'bg-[#FF5500] text-[#07080C] font-bold'
                                    : 'bg-[#0D1017] text-[#8E93A4]'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={customCategoryInput}
                              onChange={(e) => setCustomCategoryInput(e.target.value)}
                              placeholder="Nouvelle catégorie..."
                              className="flex-1 min-w-0 bg-[#0D1017] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-[#F5F2EB]"
                            />
                            <button
                              type="button"
                              onClick={handleAddCategory}
                              className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-xs text-[#F5F2EB] shrink-0"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {wizardStep === 3 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-[#F5F2EB] flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#FF5500]" />
                            <span>Label</span>
                          </label>
                          <input
                            type="text"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            placeholder="Monolith Records"
                            className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                          />
                        </div>
                        <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-[#F5F2EB] flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Beatmaker</span>
                          </label>
                          <input
                            type="text"
                            value={newBeatmakerName}
                            onChange={(e) => setNewBeatmakerName(e.target.value)}
                            placeholder="Kosh Beats"
                            className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                          />
                        </div>
                        <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-[#F5F2EB] flex items-center gap-1.5">
                            <Headphones className="w-3.5 h-3.5 text-amber-300" />
                            <span>Ingé Son</span>
                          </label>
                          <input
                            type="text"
                            value={newSoundEngineerName}
                            onChange={(e) => setNewSoundEngineerName(e.target.value)}
                            placeholder="Soren Vance"
                            className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                          />
                        </div>
                      </div>
                    )}

                    {wizardStep === 4 && (
                      <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#FF5500] truncate">
                            Drop : {formatTime(newDropStart)} →{' '}
                            {formatTime(Math.min(parsedNewDuration, newDropStart + newDropDuration))}
                          </span>
                          <button
                            type="button"
                            onClick={toggleUploadDropPreview}
                            className="px-3 py-1 rounded-lg bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 text-xs font-semibold flex items-center gap-1 shrink-0"
                          >
                            {isPreviewingUploadDrop ? (
                              <>
                                <Pause className="w-3 h-3 fill-current" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current" />
                                <span>Pré-écouter</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="relative h-12 w-full rounded-lg bg-[#0D1017] border border-white/[0.06] overflow-hidden flex items-end px-1 gap-[2px]">
                          {(waveformPeaks.length > 0
                            ? waveformPeaks
                            : Array.from({ length: 48 }, (_, idx) => 0.25 + ((idx * 7) % 10) * 0.06)
                          ).map((peak, i, arr) => {
                            const barSec = (i / arr.length) * parsedNewDuration;
                            const inDrop =
                              barSec >= newDropStart && barSec <= newDropStart + newDropDuration;
                            return (
                              <div
                                key={i}
                                style={{ height: `${Math.round(peak * 88)}%` }}
                                className={`flex-1 rounded-t ${
                                  inDrop ? 'bg-[#FF5500]' : 'bg-white/15'
                                }`}
                              />
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-[11px] text-[#8E93A4] mb-1">
                              <span>Début</span>
                              <span className="font-mono text-[#F5F2EB]">
                                {formatTime(newDropStart)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={Math.max(10, parsedNewDuration - newDropDuration)}
                              value={newDropStart}
                              onChange={(e) => setNewDropStart(Number(e.target.value))}
                              className="w-full accent-[#FF5500]"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-[11px] text-[#8E93A4] mb-1">
                              <span>Durée</span>
                              <span className="font-mono text-[#F5F2EB]">
                                {formatTime(newDropDuration)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={15}
                              max={60}
                              value={newDropDuration}
                              onChange={(e) => setNewDropDuration(Number(e.target.value))}
                              className="w-full accent-[#FF5500]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.07]">
                      <button
                        type="button"
                        onClick={() =>
                          setWizardStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev))
                        }
                        disabled={wizardStep === 1}
                        className="px-3.5 py-2 rounded-xl bg-white/[0.05] text-xs text-[#F5F2EB] disabled:opacity-30 flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Précédent</span>
                      </button>

                      {wizardStep < 4 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setWizardStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev))
                          }
                          className="px-4 py-2 rounded-xl bg-[#FF5500] text-[#07080C] font-bold text-xs flex items-center gap-1"
                        >
                          <span>Suivant</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePublishTrack}
                          className="px-5 py-2 rounded-xl bg-emerald-500 text-[#07080C] font-bold text-xs flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Publier</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* =============================================================== */}
              {/* MAIN TAB 3: AUDITEURS — CLEAN CARDS WITH RANK (#1👑, #2🥈, #3🥉) */}
              {/* =============================================================== */}
              {adminMainTab === 'USERS' && (
                <div className="flex-1 w-full bg-[#0D1017] border border-white/[0.08] rounded-2xl p-3 overflow-y-auto flex flex-col gap-2">
                  {[...users]
                    .sort((a, b) => b.totalListenSeconds - a.totalListenSeconds)
                    .map((u, idx) => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedConsumerUserId(u.id)}
                        className="w-full flex items-center justify-between gap-2.5 p-3 rounded-xl bg-[#07080C] border border-white/[0.06] hover:border-[#FF5500]/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center font-bold text-xs text-[#F5F2EB] shrink-0">
                            {u.avatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#F5F2EB] truncate">
                              {u.name}
                            </div>
                            <div className="text-[11px] font-mono text-[#8E93A4] truncate">
                              {formatLongDuration(u.totalListenSeconds)} d'écoute
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <RankBadge rank={idx + 1} delta={0} />
                          <ChevronRight className="w-4 h-4 text-[#8E93A4]" />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {/* =================================================================== */}
          {/* COMPLETE TRACK EDIT MODAL                                           */}
          {/* =================================================================== */}
          {editingTrack && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveEditedTrack}
                className="w-full max-w-md bg-[#0E1118] border border-white/15 rounded-2xl p-4 flex flex-col gap-3 max-h-[90dvh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                  <h3 className="text-sm font-bold text-[#F5F2EB] truncate">
                    Modifier — {editingTrack.track.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingTrack(null)}
                    className="p-1 text-[#8E93A4]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-[#8E93A4] mb-1">Titre</label>
                    <input
                      type="text"
                      value={editingTrack.track.title}
                      onChange={(e) =>
                        setEditingTrack({
                          ...editingTrack,
                          track: { ...editingTrack.track, title: e.target.value },
                        })
                      }
                      className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#8E93A4] mb-1">Artiste</label>
                    <input
                      type="text"
                      value={editingTrack.track.artist}
                      onChange={(e) =>
                        setEditingTrack({
                          ...editingTrack,
                          track: { ...editingTrack.track, artist: e.target.value },
                        })
                      }
                      className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#8E93A4] mb-1">Catégorie</label>
                    <select
                      value={editingTrack.track.category}
                      onChange={(e) =>
                        setEditingTrack({
                          ...editingTrack,
                          track: { ...editingTrack.track, category: e.target.value },
                        })
                      }
                      className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#8E93A4] mb-1">Durée (MM:SS)</label>
                    <input
                      type="text"
                      value={editingTrack.durationFormatted}
                      onChange={(e) =>
                        setEditingTrack({
                          ...editingTrack,
                          durationFormatted: e.target.value,
                        })
                      }
                      className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#FF5500]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#8E93A4] mb-1">Label</label>
                    <input
                      type="text"
                      value={editingTrack.track.labelName}
                      onChange={(e) =>
                        setEditingTrack({
                          ...editingTrack,
                          track: { ...editingTrack.track, labelName: e.target.value },
                        })
                      }
                      className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#8E93A4] mb-1">Beatmaker</label>
                    <input
                      type="text"
                      value={editingTrack.track.beatmakerName}
                      onChange={(e) =>
                        setEditingTrack({
                          ...editingTrack,
                          track: { ...editingTrack.track, beatmakerName: e.target.value },
                        })
                      }
                      className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] text-[#8E93A4] mb-1">Ingé Son</label>
                    <input
                      type="text"
                      value={editingTrack.track.soundEngineerName}
                      onChange={(e) =>
                        setEditingTrack({
                          ...editingTrack,
                          track: { ...editingTrack.track, soundEngineerName: e.target.value },
                        })
                      }
                      className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 bg-[#07080C] p-2.5 rounded-xl border border-white/[0.07]">
                  <label className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs font-medium text-[#F5F2EB] cursor-pointer">
                    Changer le cover
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = URL.createObjectURL(file);
                        setEditingTrack({
                          ...editingTrack,
                          track: { ...editingTrack.track, cover: url },
                        });
                      }}
                      className="hidden"
                    />
                  </label>
                  {editingTrack.track.cover && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTrack({
                          ...editingTrack,
                          track: { ...editingTrack.track, cover: '' },
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 text-xs"
                    >
                      Supprimer cover
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingTrack(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] text-xs text-[#8E93A4]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#FF5500] text-[#07080C] font-bold text-xs"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
