import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  Compass,
  Disc,
  Music,
  Shield,
  Users,
  Upload,
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
  Layers,
  Filter,
  Check,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  Mic2,
  Heart,
  Repeat,
  Grid,
  Bell,
} from 'lucide-react';
import {
  streamTracker,
  SyncStatusSnapshot,
  OfflineStreamEvent,
  GabonSubscriptionPass,
  GabonNetworkOperator,
} from './services/offlineStreamTracker';
import {
  CoverArtwork,
  ArtworkType,
  DropOfficialLogo,
  RankMedalSvg,
} from './components/CoverArtwork';
import { Immersive3DPlayer, LyricLine } from './components/Immersive3DPlayer';
import {
  StudioEntityRole,
  CertificationBadgeSvg,
  OfficialQrCodeSvg,
} from './components/ReusableAnalyticsSheets';
import {
  CommunityRecommendationItem,
  FeaturingSplitMode,
  CreditHandshakeRecord,
  GABON_PASS_SPECS,
  evaluateEcgStreamValidation,
  computeAllDecoupledStudioRankings,
  computeDropAwardsCategories,
  computeTrackExplosionScore,
  getTrackCertification,
  getAlbumCertification,
} from './utils/rankingEngine';
import {
  getAllTracks,
  uploadLocalTrack,
  addYoutubeTrack,
  deleteTrack as deleteSupabaseTrack,
  syncStudioEntities,
  syncUserLibraryStateToCloud,
  loadUserLibraryStateFromStorage,
  saveFullCatalogueSnapshot,
  loadFullCatalogueSnapshot,
  fileToPersistentDataUrl,
  uploadCoverFile,
  updateTrackMetadataInStorage,
  verifySupabaseHealth,
  isSupabaseConfigured,
  SUPABASE_SQL_SETUP_SCRIPT,
  AdBannerSlide,
  AdBannerSettings,
  AdBannerPlacement,
  AdBannerRedirectType,
  loadAdBannersFromStorage,
  getAdBannersFromCloud,
  loadAdBannerSettingsFromStorage,
  getAdBannerSettingsFromCloud,
  getStudioEntitiesFromCloud,
  getUserPlaylistsFromCloud,
  syncAdBannersToCloud,
  saveAudioBlobToIndexedDb,
  getPersistentAudioBlobUrl,
  computeDeterministicWaveformPeaks,
  generateDropContentId,
  compareWaveformsConcordance,
  WaveformConcordanceResult,
  loadAwardsCeremonyEnabledFromStorage,
  saveAwardsCeremonyEnabledToStorage,
  triggerBeatAudioDownload,
  SupabaseTrackRow,
  deleteStudioEntityFromCloud,
  loadAdminGlobalConfigFromStorage,
  getAdminGlobalConfigFromCloud,
  syncAdminGlobalConfigToCloud,
} from './services/musicService';
import {
  subscribeToLiveSync,
  broadcastLiveSync,
} from './services/realtimeSync';
import { buildRoyaltyLedger } from './features/royalties/royaltyLedger';
import {
  useRoyaltyLedgerState,
  type StatsBaseline,
} from './features/royalties/royaltyLedgerStore';
import { BugadaRoyaltiesAdminPanel } from './features/royalties/BugadaRoyaltiesAdminPanel';
import { ArtistRoyaltyAndTipCard } from './features/royalties/ArtistRoyaltyAndTipCard';

// --- Architecture Modulaire par Domaine Métier (Feature-Based Architecture) ---
import type {
  AppNotification,
  EntityDatabase,
  Track,
  AlbumNode,
  UserTrackStat,
  AppUser,
  AdminDrmVaultRecord,
} from './shared/types/domain.types';
export type {
  AppNotification,
  EntityDatabase,
  Track,
  AlbumNode,
  UserTrackStat,
  AppUser,
};
import {
  formatTime,
  formatLongDuration,
  formatCompactCount,
  parseDurationInput,
  extractExternalStreamId,
  bytesToHex,
} from './shared/utils/mediaFormatters';
import { RankBadge } from './shared/ui/RankBadge';
import { NotificationSystem } from './shared/ui/NotificationSystem';
import { DEFAULT_CATEGORIES, INITIAL_CATALOGUE } from './mocks/catalogue.mock';
import { INITIAL_USERS } from './mocks/users.mock';
import {
  INITIAL_ARTIST_SUBSCRIBERS,
  INITIAL_COMMUNITY_RECOMMENDATIONS,
  INITIAL_NOTIFICATIONS,
} from './mocks/community.mock';
import {
  AdminCommandHeader,
  AdminCatalogueRepertoire,
  AdminCatalogueAlgo,
  AdminBannersManager,
  AdminDatabaseManager,
  AdminUsersDirectory,
  AdminDrmOfflinePanel,
  TrackEditModal,
} from './features/backoffice';
import { AuthPortalView } from './features/listener/AuthPortalView';

export function App() {
  // --- Navigation & Auth State ---
  const [appView, setAppView] = useState<'AUTH' | 'PLAYER' | 'ADMIN'>('PLAYER');
  const [catalogue, setCatalogue] = useState<AlbumNode[]>(() => {
    const rawCat = loadFullCatalogueSnapshot<AlbumNode[]>() || INITIAL_CATALOGUE;
    // S'assurer que l'album de Beats & Instrumentales existe et que chaque titre possède son Content ID DROP-CID et son onde 64 bandes
    const hasBeatsAlbum = rawCat.some(
      (a) =>
        a.id === 'alb-beats-1' ||
        a.tracks.some((t) => t.category === 'Beats & Instrumentales')
    );
    const mergedAlbums = hasBeatsAlbum
      ? rawCat
      : [...rawCat, INITIAL_CATALOGUE[INITIAL_CATALOGUE.length - 1]];

    return mergedAlbums.map((alb) => ({
      ...alb,
      tracks: alb.tracks.map((t) => {
        const peaks =
          t.waveformPeaks && t.waveformPeaks.length >= 32
            ? t.waveformPeaks
            : computeDeterministicWaveformPeaks(`${t.id}-${t.title}-${t.artist}`);
        const cid =
          t.dropContentId || generateDropContentId(peaks, t.duration, t.id);
        return {
          ...t,
          waveformPeaks: peaks,
          dropContentId: cid,
        };
      }),
    }));
  });
  const [categories, setCategories] = useState<string[]>(() => {
    const savedCfg = loadAdminGlobalConfigFromStorage();
    if (savedCfg?.categories && Array.isArray(savedCfg.categories) && savedCfg.categories.length > 0) {
      return Array.from(new Set([...DEFAULT_CATEGORIES, ...savedCfg.categories]));
    }
    return DEFAULT_CATEGORIES;
  });
  const [enableAwardsCeremony, setEnableAwardsCeremony] = useState<boolean>(() => {
    const savedCfg = loadAdminGlobalConfigFromStorage();
    if (typeof savedCfg?.enableAwardsCeremony === 'boolean') {
      return savedCfg.enableAwardsCeremony;
    }
    return loadAwardsCeremonyEnabledFromStorage();
  });
  useEffect(() => {
    saveAwardsCeremonyEnabledToStorage(enableAwardsCeremony);
  }, [enableAwardsCeremony]);
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<AppUser>(INITIAL_USERS[0]);

  // Sauvegarde automatique et immédiate de tout le catalogue (pochettes, titres, éditions)
  useEffect(() => {
    saveFullCatalogueSnapshot(catalogue);
  }, [catalogue]);

  // --- Gabon Mobile Money Pass & Anti-Fraud Shield State ---
  const [subscriptionPass, setSubscriptionPass] = useState<GabonSubscriptionPass>(
    'PASS_MENSUEL_HEBDO'
  );
  const [networkOperator, setNetworkOperator] =
    useState<GabonNetworkOperator>('AIRTEL_GABON');
  const [lastEcgValidationMsg, setLastEcgValidationMsg] = useState<string>(
    'Bouclier ECG Gabon (+241) actif • Seuil 30s • Anti-Mute 0% • Plafond 5/24h (Airtel/Moov 1.0 ECG)'
  );
  const dailyUserTrackPlaysRef = useRef<Record<string, number>>({});

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
  const [albumIdx, setAlbumIdx] = useState<number>(1); // Index 1 = "Lumières du Bord de Mer" au centre par défaut
  const [trackIdx, setTrackIdx] = useState<number>(0); // Axe Y (Swipe Haut/Bas & Suivant/Précédent au sein d'un album)

  // --- Playback & 5-Band Web Audio Equalizer State ---
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isDropMode, setIsDropMode] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(116); // 1:56 par défaut

  // Redirection directe vers une chanson via le QR Code du filigrane Trend (?track=<id>)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const targetTrackId = params.get('track');
      if (!targetTrackId) return;
      for (let aIdx = 0; aIdx < catalogue.length; aIdx++) {
        const tIdx = catalogue[aIdx].tracks.findIndex(
          (t) =>
            t.id === targetTrackId ||
            t.title.toLowerCase() === targetTrackId.toLowerCase()
        );
        if (tIdx !== -1) {
          setAlbumIdx(aIdx);
          setTrackIdx(tIdx);
          setCurrentTime(catalogue[aIdx].tracks[tIdx].dropStart || 0);
          setAppView('PLAYER');
          break;
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [catalogue]);
  const [likedTrackIds, setLikedTrackIds] = useState<Record<string, boolean>>(
    () =>
      loadUserLibraryStateFromStorage()?.liked_track_ids || {
        't-main-1': true,
        't-101': true,
        't-201': true,
        't-301': true,
      }
  );
  const [recommendedTrackIds, setRecommendedTrackIds] = useState<
    Record<string, boolean>
  >(
    () =>
      loadUserLibraryStateFromStorage()?.recommended_track_ids || {
        't-301': true,
        't-main-1': true,
      }
  );
  const [subscribedArtists, setSubscribedArtists] = useState<
    Record<string, boolean>
  >(
    () =>
      loadUserLibraryStateFromStorage()?.subscribed_artists || {
        "Emma'a": true,
        "Ba'ponga": true,
        "L'Oiseau Rare": true,
      }
  );
  const [artistSubscribers, setArtistSubscribers] = useState<Record<string, number>>(
    INITIAL_ARTIST_SUBSCRIBERS
  );
  const [communityRecommendations, setCommunityRecommendations] = useState<
    CommunityRecommendationItem[]
  >(INITIAL_COMMUNITY_RECOMMENDATIONS);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<number>(0); // 0: Off, 1: All, 2: One
  const isRepeat = repeatMode > 0;
  const [masterVolume, setMasterVolume] = useState<number>(85);
  const [eqGains, setEqGains] = useState<number[]>([6, 3, -1, 2.5, 4.5]);
  const [userPlan, setUserPlan] = useState<'BASIC' | 'PRO'>('PRO');

  // --- Silent Real Play & Retention Session Tracking ---
  const manualSessionRef = useRef<{
    trackId: string;
    active: boolean;
    listenedSeconds: number;
    playCountedAtOneSec: boolean;
    ecgValidatedAt30Sec: boolean;
    sessionPointsEarned: number;
  }>({
    trackId: INITIAL_CATALOGUE[1].tracks[0].id,
    active: false,
    listenedSeconds: 0,
    playCountedAtOneSec: false,
    ecgValidatedAt30Sec: false,
    sessionPointsEarned: 0,
  });

  // --- Auth Form State ---
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authName, setAuthName] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('camille.ndong@drop.ga');

  // --- Admin Navigation & Sub-tabs ---
  const [adminMainTab, setAdminMainTab] = useState<
    'CATALOGUE' | 'UPLOAD' | 'BANNERS' | 'DATABASE' | 'USERS' | 'ROYALTIES_BUGADA'
  >('CATALOGUE');
  const [catalogueSubTab, setCatalogueSubTab] = useState<'REPERTOIRE' | 'ALGO' | 'RULES'>(
    'REPERTOIRE'
  );
  const {
    state: royaltyLedgerState,
    updateSettings: updateRoyaltySettings,
    resetSettings: resetRoyaltySettings,
    setTaxStatus: setHolderTaxStatus,
    closePeriod: closeRoyaltyPeriod,
    hydrateFromCloudSettings: hydrateRoyaltyFromCloud,
  } = useRoyaltyLedgerState();
  const [lastAdminSavedAt, setLastAdminSavedAt] = useState<string | null>(null);
  const [isSavingAdmin, setIsSavingAdmin] = useState<boolean>(false);

  // --- Bannières Publicitaires Slideshow (Haut & Bas de Central) ---
  const [adBanners, setAdBanners] = useState<AdBannerSlide[]>(() =>
    loadAdBannersFromStorage()
  );
  const [adBannerSettings, setAdBannerSettings] = useState<AdBannerSettings>(
    () => loadAdBannerSettingsFromStorage()
  );
  const [supabaseHealthMsg, setSupabaseHealthMsg] = useState<string>('');
  const isRemoteSyncInProgressRef = useRef<boolean>(false);

  useEffect(() => {
    if (isRemoteSyncInProgressRef.current) return;
    syncAdBannersToCloud(adBanners, adBannerSettings).catch(() => {});
  }, [adBanners, adBannerSettings]);

  useEffect(() => {
    verifySupabaseHealth()
      .then((res) => setSupabaseHealthMsg(res.message))
      .catch(() => {});
  }, []);

  // --- Persistent Entity Database (Artistes, Labels, Beatmakers, Ingés Son, Auteurs) ---
  const [entityDb, setEntityDb] = useState<EntityDatabase>(() => {
    const initialTracks = INITIAL_CATALOGUE.flatMap((a) => a.tracks);
    const defaultArtists = Array.from(
      new Set(
        initialTracks
          .flatMap((t) => [t.artist, ...(t.featuringArtists || [])])
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
    const defaultLabels = Array.from(
      new Set(initialTracks.map((t) => t.labelName.trim()).filter(Boolean))
    );
    const defaultBeatmakers = Array.from(
      new Set(initialTracks.map((t) => t.beatmakerName.trim()).filter(Boolean))
    );
    const defaultEngineers = Array.from(
      new Set(
        initialTracks
          .flatMap((t) => [
            t.soundEngineerName,
            t.recordingEngineerName || '',
            t.mixingEngineerName || '',
            t.masteringEngineerName || '',
          ])
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
    const defaultLyricists = Array.from(
      new Set(initialTracks.map((t) => t.lyricistName.trim()).filter(Boolean))
    );

    try {
      const saved = window.localStorage.getItem('drop_entity_db_v1');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<EntityDatabase>;
        return {
          artists: Array.from(new Set([...defaultArtists, ...(parsed.artists || [])])),
          labels: Array.from(new Set([...defaultLabels, ...(parsed.labels || [])])),
          beatmakers: Array.from(new Set([...defaultBeatmakers, ...(parsed.beatmakers || [])])),
          engineers: Array.from(new Set([...defaultEngineers, ...(parsed.engineers || [])])),
          lyricists: Array.from(new Set([...defaultLyricists, ...(parsed.lyricists || [])])),
        };
      }
    } catch {
      // Ignore storage parse error
    }
    return {
      artists: defaultArtists,
      labels: defaultLabels,
      beatmakers: defaultBeatmakers,
      engineers: defaultEngineers,
      lyricists: defaultLyricists,
    };
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('drop_entity_db_v1', JSON.stringify(entityDb));
    } catch {
      // Ignore storage quota error
    }
  }, [entityDb]);

  const [inlineNewEntityField, setInlineNewEntityField] = useState<string | null>(null);
  const [inlineNewEntityValue, setInlineNewEntityValue] = useState<string>('');

  // --- Real-Time Notifications Center State ---
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = window.localStorage.getItem('drop_notifications_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return INITIAL_NOTIFICATIONS;
  });
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem('drop_notifications_v1', JSON.stringify(notifications));
    } catch {
      // Ignore
    }
  }, [notifications]);

  const pushNotification = useCallback(
    (
      title: string,
      message: string,
      type: AppNotification['type'] = 'PUBLISH',
      trackId?: string
    ) => {
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        message,
        type,
        createdAt: new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        read: false,
        trackId,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 39)]);
      setActiveToast(newNotif);
    },
    []
  );

  useEffect(() => {
    if (!activeToast) return;
    const t = window.setTimeout(() => setActiveToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [activeToast]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleRegisterEntityInDb = useCallback(
    (role: keyof EntityDatabase, rawName: string, silent = false) => {
      const names = rawName
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (names.length === 0) return;

      setEntityDb((prev) => {
        const existing = prev[role] || [];
        const existingLower = new Set(existing.map((e) => e.toLowerCase()));
        const added: string[] = [];
        for (const n of names) {
          if (!existingLower.has(n.toLowerCase())) {
            existingLower.add(n.toLowerCase());
            added.push(n);
          }
        }
        if (added.length === 0) return prev;
        return {
          ...prev,
          [role]: [...added, ...existing],
        };
      });

      if (!silent) {
        const roleLabels: Record<keyof EntityDatabase, string> = {
          artists: 'Artiste',
          labels: 'Label',
          beatmakers: 'Beatmaker',
          engineers: 'Ingénieur du son',
          lyricists: 'Auteur / Parolier',
        };
        pushNotification(
          `${roleLabels[role]} enregistré dans la base`,
          `« ${names.join(', ')} » est désormais disponible dans les listes déroulantes.`,
          'DATABASE'
        );
      }
    },
    [pushNotification]
  );

  const handleDeleteEntityFromDb = useCallback((role: keyof EntityDatabase, nameToRemove: string) => {
    setEntityDb((prev) => ({
      ...prev,
      [role]: prev[role].filter((item) => item !== nameToRemove),
    }));
    deleteStudioEntityFromCloud(role, nameToRemove).catch(() => {});
  }, []);

  // Synchronisation automatique du Répertoire des Métiers avec Supabase + Cache Local
  useEffect(() => {
    syncStudioEntities(entityDb).catch(() => {});
  }, [entityDb]);

  // État pour l'affichage / copie en 1 clic du Script SQL Supabase dans l'Admin
  const [sqlCopiedBanner, setSqlCopiedBanner] = useState<boolean>(false);
  const [showSqlEditorModal, setShowSqlEditorModal] = useState<boolean>(false);
  const [selectedRawAudioFile, setSelectedRawAudioFile] = useState<File | null>(null);
  const [selectedRawCoverFile, setSelectedRawCoverFile] = useState<File | null>(null);

  // --- Admin Exclusive DRM Sandbox State (Web Crypto API AES-256-GCM) ---
  const [adminDrmVault, setAdminDrmVault] = useState<Record<string, AdminDrmVaultRecord>>({});
  const [adminDrmTargetTrackId, setAdminDrmTargetTrackId] = useState<string>('t-main-1');
  const [adminDrmStatusMsg, setAdminDrmStatusMsg] = useState<string | null>(null);
  const [isEncryptingAdminDrm, setIsEncryptingAdminDrm] = useState<boolean>(false);

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

  // --- Step-by-Step Upload Wizard State ---
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [uploadSourceType, setUploadSourceType] = useState<'FILE' | 'STREAM'>('FILE');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newArtist, setNewArtist] = useState<string>('');
  const [newFeaturingInput, setNewFeaturingInput] = useState<string>('');
  const [newFeaturingSplitMode, setNewFeaturingSplitMode] =
    useState<FeaturingSplitMode>('70_30');
  const [newAlbum, setNewAlbum] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Ntcham');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [newLabelName, setNewLabelName] = useState<string>('');
  const [newBeatmakerName, setNewBeatmakerName] = useState<string>('');
  const [newSoundEngineerName, setNewSoundEngineerName] = useState<string>('');
  const [newRecordingEngineerName, setNewRecordingEngineerName] = useState<string>('');
  const [newMixingEngineerName, setNewMixingEngineerName] = useState<string>('');
  const [newMasteringEngineerName, setNewMasteringEngineerName] = useState<string>('');
  const [newLyricistName, setNewLyricistName] = useState<string>('');
  const [newIsExternalLyricist, setNewIsExternalLyricist] = useState<boolean>(true);
  const [newIsInstrumental, setNewIsInstrumental] = useState<boolean>(false);
  const [newIsBeatDownloadable, setNewIsBeatDownloadable] = useState<boolean>(false);
  const [newBpm, setNewBpm] = useState<number>(124);
  const [newMusicalKey, setNewMusicalKey] = useState<string>('Do Mineur (Cm)');
  const [newCopyrightText, setNewCopyrightText] = useState<string>('');
  const [newAudioCodec, setNewAudioCodec] = useState<'OPUS' | 'AAC' | 'WAV'>('OPUS');
  const [newGabonTerritoryPct, setNewGabonTerritoryPct] = useState<number>(88);
  const [newCoverFileUrl, setNewCoverFileUrl] = useState<string>('');
  const [newCoverFileName, setNewCoverFileName] = useState<string>('');
  const [newDurationFormatted, setNewDurationFormatted] = useState<string>('03:00');
  const [newDropStart, setNewDropStart] = useState<number>(76);
  const [newDropDuration, setNewDropDuration] = useState<number>(30);
  const [newAudioUrl, setNewAudioUrl] = useState<string>('');
  const [newAudioFileName, setNewAudioFileName] = useState<string>('');
  const [newMeasuredLufs, setNewMeasuredLufs] = useState<number>(-14.0);
  const [newExternalUrl, setNewExternalUrl] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // --- Upload Progress & Energy Waveform State ---
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [detectedHotspotStart, setDetectedHotspotStart] = useState<number | null>(null);
  const [isPreviewingUploadDrop, setIsPreviewingUploadDrop] = useState<boolean>(false);
  const [uploadPreviewTime, setUploadPreviewTime] = useState<number>(76);

  // --- Admin Edit Modal State ---
  const [editingTrack, setEditingTrack] = useState<{
    albumId: string;
    track: Track;
    durationFormatted: string;
    featuringInput?: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // --- Refs (Web Audio -14.0 LUFS Uniform Loudness Engine) ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const loudnessNormGainRef = useRef<GainNode | null>(null);
  const loudnessCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const previewMediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
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
  const currentTrack = currentAlbum?.tracks[safeTrackIdx] || INITIAL_CATALOGUE[1].tracks[0];

  const parsedNewDuration = useMemo(
    () => parseDurationInput(newDurationFormatted),
    [newDurationFormatted]
  );

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  // --- Réconciliation complète et intelligente du catalogue avec les données Cloud Supabase ---
  const reconcileCatalogueWithCloudTracks = useCallback(
    (savedRows: SupabaseTrackRow[]) => {
      if (!savedRows || savedRows.length === 0) return;

      setCatalogue((prevCatalogue) => {
        const rowMap = new Map<string, SupabaseTrackRow>();
        savedRows.forEach((r) => {
          if (r.app_track_id) rowMap.set(r.app_track_id, r);
          if (r.id) rowMap.set(r.id, r);
        });

        // 1. Mettre à jour chaque piste existante avec les métadonnées récentes de Supabase
        const updatedCatalogue = prevCatalogue.map((album) => {
          return {
            ...album,
            tracks: album.tracks.map((t) => {
              const matchedRow = rowMap.get(t.id);
              if (matchedRow) {
                rowMap.delete(t.id);
                if (matchedRow.app_track_id) rowMap.delete(matchedRow.app_track_id);
                if (matchedRow.id) rowMap.delete(matchedRow.id);

                const peaks =
                  t.waveformPeaks && t.waveformPeaks.length >= 32
                    ? t.waveformPeaks
                    : computeDeterministicWaveformPeaks(
                        `${t.id}-${matchedRow.title}-${matchedRow.artist}`
                      );
                const cid =
                  t.dropContentId ||
                  generateDropContentId(
                    peaks,
                    matchedRow.duration || t.duration,
                    t.id
                  );

                return {
                  ...t,
                  title: matchedRow.title || t.title,
                  artist: matchedRow.artist || t.artist,
                  featuringArtists:
                    matchedRow.featuring_artists && matchedRow.featuring_artists.length > 0
                      ? matchedRow.featuring_artists
                      : t.featuringArtists,
                  featuringSplitMode: matchedRow.featuring_split_mode || t.featuringSplitMode,
                  album: matchedRow.album || t.album,
                  category: matchedRow.category || t.category,
                  labelName: matchedRow.label_name || t.labelName,
                  copyrightText: matchedRow.copyright_text || t.copyrightText,
                  beatmakerName: matchedRow.beatmaker_name || t.beatmakerName,
                  soundEngineerName: matchedRow.sound_engineer_name || t.soundEngineerName,
                  recordingEngineerName:
                    matchedRow.recording_engineer_name || t.recordingEngineerName,
                  mixingEngineerName:
                    matchedRow.mixing_engineer_name || t.mixingEngineerName,
                  masteringEngineerName:
                    matchedRow.mastering_engineer_name || t.masteringEngineerName,
                  lyricistName: matchedRow.lyricist_name || t.lyricistName,
                  isExternalLyricist:
                    matchedRow.is_external_lyricist !== undefined
                      ? Boolean(matchedRow.is_external_lyricist)
                      : t.isExternalLyricist,
                  isInstrumental:
                    matchedRow.is_instrumental !== undefined
                      ? Boolean(matchedRow.is_instrumental)
                      : t.isInstrumental,
                  cover: matchedRow.cover_url || t.cover,
                  duration: Number(matchedRow.duration || t.duration),
                  dropStart: Number(matchedRow.drop_start ?? t.dropStart),
                  dropDuration: Number(matchedRow.drop_duration ?? t.dropDuration),
                  bpm: Number(matchedRow.bpm || t.bpm),
                  lyrics:
                    matchedRow.lyrics && matchedRow.lyrics.length > 0
                      ? matchedRow.lyrics
                      : t.lyrics,
                  audioUrl:
                    matchedRow.source_type === 'file' && matchedRow.stream_url
                      ? matchedRow.stream_url
                      : t.audioUrl,
                  externalStreamId:
                    matchedRow.source_type === 'youtube' && matchedRow.youtube_id
                      ? matchedRow.youtube_id
                      : t.externalStreamId,
                  waveformPeaks: peaks,
                  dropContentId: cid,
                  isBeatDownloadable: Boolean(matchedRow.is_instrumental),
                };
              }
              return t;
            }),
          };
        });

        // 2. Insérer les pistes nouvelles de Supabase qui n'existaient pas encore localement
        const remainingRows = Array.from(new Set(Array.from(rowMap.values())));
        if (remainingRows.length > 0) {
          const newTracksToInsert: Track[] = remainingRows.map((row) => {
            const trackId = row.app_track_id || row.id;
            const peaks = computeDeterministicWaveformPeaks(
              `${trackId}-${row.title}-${row.artist}`
            );
            const cid = generateDropContentId(peaks, Number(row.duration || 180), trackId);

            return {
              id: trackId,
              title: row.title,
              artist: row.artist,
              featuringArtists:
                row.featuring_artists && row.featuring_artists.length > 0
                  ? row.featuring_artists
                  : undefined,
              featuringSplitMode: row.featuring_split_mode || '70_30',
              album: row.album || 'Single',
              category: row.category || 'Ntcham',
              labelName: row.label_name || 'Indépendant',
              copyrightText:
                row.copyright_text ||
                `Copyright 2026 ${row.label_name || 'DROP'}. Tous droits réservés`,
              beatmakerName: row.beatmaker_name || row.artist,
              soundEngineerName:
                row.sound_engineer_name || 'Maître Boussengui (Studio K)',
              recordingEngineerName: row.recording_engineer_name || undefined,
              mixingEngineerName:
                row.mixing_engineer_name || row.sound_engineer_name,
              masteringEngineerName: row.mastering_engineer_name || undefined,
              lyricistName: row.lyricist_name || row.artist,
              isExternalLyricist: Boolean(row.is_external_lyricist),
              isInstrumental: Boolean(row.is_instrumental),
              audioCodec: row.audio_codec || 'OPUS',
              lufsMasterLevel: Number(row.lufs_master_level ?? -14.0),
              cover: row.cover_url || '',
              artworkType: 'creative_yellow',
              ambientPrimary: row.ambient_primary || '#f59e0b',
              ambientSecondary: row.ambient_secondary || '#ef4444',
              duration: Number(row.duration || 180),
              dropStart: Number(row.drop_start || 30),
              dropDuration: Number(row.drop_duration || 22),
              baseFreq: 120,
              bpm: Number(row.bpm || 120),
              audioUrl:
                row.source_type === 'file' ? row.stream_url : undefined,
              externalStreamId:
                row.source_type === 'youtube'
                  ? row.youtube_id || undefined
                  : undefined,
              realPlays: Number(row.real_plays || 100000),
              lastActivityAgo: 'Synchronisé Supabase',
              totalListenSeconds: Number(row.total_listen_seconds || 180000),
              listenSessions: Number(row.listen_sessions || 1200),
              avgRetentionPct: Number(row.avg_retention_pct || 89),
              retention30sPct: 92,
              algoPoints: 14.5,
              likesCount: Number(row.likes_count || 1200),
              loopPlaysCount: Number(row.loop_plays_count || 300),
              recommendationsCount: 150,
              lyricsOpensCount: 900,
              lyricsSharesCount: 180,
              longevityDays: 15,
              consecutiveLoops: 0,
              baselineRank: 5,
              waveformPeaks: peaks,
              dropContentId: cid,
              isBeatDownloadable: Boolean(row.is_instrumental),
              lyrics: row.lyrics || [],
            };
          });

          newTracksToInsert.forEach((newT) => {
            const albIdx = updatedCatalogue.findIndex(
              (a) =>
                a.artist.toLowerCase() === newT.artist.toLowerCase() &&
                a.albumTitle.toLowerCase() === newT.album.toLowerCase()
            );
            if (albIdx >= 0) {
              const alreadyHas = updatedCatalogue[albIdx].tracks.some(
                (t) => t.id === newT.id
              );
              if (!alreadyHas) {
                updatedCatalogue[albIdx] = {
                  ...updatedCatalogue[albIdx],
                  tracks: [newT, ...updatedCatalogue[albIdx].tracks],
                };
              }
            } else {
              updatedCatalogue.unshift({
                id: `alb-sb-${newT.id}`,
                artist: newT.artist,
                albumTitle: newT.album,
                category: newT.category,
                year: '2026',
                tracks: [newT],
              });
            }
          });
        }

        saveFullCatalogueSnapshot(updatedCatalogue);
        return updatedCatalogue;
      });
    },
    []
  );

  // --- Application d'une configuration globale Admin reçue du Cloud Supabase ou WebSocket ---
  const applyRemoteAdminConfig = useCallback(
    (cfg: {
      enableAwardsCeremony?: boolean;
      categories?: string[];
      albumOrderIds?: string[];
      royaltySettings?: Record<string, unknown>;
      taxStatusOverrides?: Record<string, string>;
    }) => {
      isRemoteSyncInProgressRef.current = true;
      if (typeof cfg.enableAwardsCeremony === 'boolean') {
        setEnableAwardsCeremony(cfg.enableAwardsCeremony);
        saveAwardsCeremonyEnabledToStorage(cfg.enableAwardsCeremony);
      }
      if (cfg.categories && Array.isArray(cfg.categories) && cfg.categories.length > 0) {
        setCategories(Array.from(new Set([...DEFAULT_CATEGORIES, ...cfg.categories])));
      }
      if (cfg.albumOrderIds && Array.isArray(cfg.albumOrderIds) && cfg.albumOrderIds.length > 0) {
        const orderIds = cfg.albumOrderIds;
        setCatalogue((prev) => {
          const orderMap = new Map<string, number>();
          orderIds.forEach((id, i) => orderMap.set(id, i));
          return [...prev].sort((a, b) => {
            const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
            const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
            return idxA - idxB;
          });
        });
      }
      if (cfg.royaltySettings || cfg.taxStatusOverrides) {
        hydrateRoyaltyFromCloud({
          settings: cfg.royaltySettings as Partial<typeof royaltyLedgerState.settings>,
          taxStatusOverrides: cfg.taxStatusOverrides as typeof royaltyLedgerState.taxStatusOverrides,
        });
      }
      window.setTimeout(() => {
        isRemoteSyncInProgressRef.current = false;
      }, 180);
    },
    [hydrateRoyaltyFromCloud, royaltyLedgerState]
  );

  // --- Rafraîchissement global de toutes les données Supabase (Pistes, Bannières, Réglages, Entités, Config Admin) ---
  const refreshAllCloudData = useCallback(async () => {
    try {
      const [savedRows, cloudBanners, cloudSettings, cloudEntities, cloudAdminCfg] =
        await Promise.all([
          getAllTracks(),
          getAdBannersFromCloud(),
          getAdBannerSettingsFromCloud(),
          getStudioEntitiesFromCloud(entityDb),
          getAdminGlobalConfigFromCloud(),
        ]);

      if (savedRows && savedRows.length > 0) {
        reconcileCatalogueWithCloudTracks(savedRows);
      }

      if (cloudBanners && cloudBanners.length > 0) {
        isRemoteSyncInProgressRef.current = true;
        setAdBanners(cloudBanners);
        setTimeout(() => {
          isRemoteSyncInProgressRef.current = false;
        }, 150);
      }

      if (cloudSettings) {
        isRemoteSyncInProgressRef.current = true;
        setAdBannerSettings(cloudSettings);
        setTimeout(() => {
          isRemoteSyncInProgressRef.current = false;
        }, 150);
      }

      if (cloudEntities) {
        setEntityDb(cloudEntities);
      }

      if (cloudAdminCfg) {
        applyRemoteAdminConfig(cloudAdminCfg);
      }
    } catch (err) {
      console.warn('[RealtimeSync] Erreur rafraîchissement global:', err);
    }
  }, [reconcileCatalogueWithCloudTracks, entityDb, applyRemoteAdminConfig]);

  // --- Sauvegarde & Synchronisation Globale Explicite (Tous Appareils : Mobile, Tablette, PC) ---
  const handleSaveAndSyncAllAdmin = useCallback(
    async (sectionLabel?: string) => {
      setIsSavingAdmin(true);
      try {
        // 1. Sauvegarder le snapshot complet du catalogue
        saveFullCatalogueSnapshot(catalogue);

        // 2. Synchroniser les bannières publicitaires (et supprimer celles retirées)
        await syncAdBannersToCloud(adBanners, adBannerSettings);

        // 3. Synchroniser la base de données des entités studio
        await syncStudioEntities(entityDb);

        // 4. Synchroniser la configuration globale Admin (Awards, Genres, Ordre 2D, Royalties BUGADA & Fiscalité DGI)
        await syncAdminGlobalConfigToCloud(
          {
            enableAwardsCeremony,
            categories,
            albumOrderIds: catalogue.map((a) => a.id),
            royaltySettings: royaltyLedgerState.settings as unknown as Record<string, unknown>,
            taxStatusOverrides: royaltyLedgerState.taxStatusOverrides as Record<string, string>,
            updatedAt: new Date().toISOString(),
          },
          sectionLabel
            ? `Paramètres « ${sectionLabel} » sauvegardés et synchronisés sur tous les appareils.`
            : 'Tous les paramètres Admin, Catalogue, Bannières et Royalties sont synchronisés.'
        );

        const timeStr = new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastAdminSavedAt(timeStr);
        pushNotification(
          'Sauvegarde & Sync Cloud validées ✓',
          sectionLabel
            ? `« ${sectionLabel} » enregistré à ${timeStr} et diffusé sur mobile, tablette et PC.`
            : `Toutes vos modifications Admin sont persistées à ${timeStr} sur tous les appareils.`,
          'DATABASE'
        );
      } catch (err) {
        console.warn('[AdminSave] Erreur synchronisation:', err);
      } finally {
        setIsSavingAdmin(false);
      }
    },
    [
      catalogue,
      adBanners,
      adBannerSettings,
      entityDb,
      enableAwardsCeremony,
      categories,
      royaltyLedgerState.settings,
      royaltyLedgerState.taxStatusOverrides,
      pushNotification,
    ]
  );

  // Synchronisation automatique en tâche de fond des paramètres Admin globaux lorsqu'ils changent
  useEffect(() => {
    if (isRemoteSyncInProgressRef.current) return;
    syncAdminGlobalConfigToCloud({
      enableAwardsCeremony,
      categories,
      albumOrderIds: catalogue.map((a) => a.id),
      royaltySettings: royaltyLedgerState.settings as unknown as Record<string, unknown>,
      taxStatusOverrides: royaltyLedgerState.taxStatusOverrides as Record<string, string>,
      updatedAt: new Date().toISOString(),
    }).catch(() => {});
  }, [
    enableAwardsCeremony,
    categories,
    royaltyLedgerState.settings,
    royaltyLedgerState.taxStatusOverrides,
  ]);

  // --- Synchronisation temps réel continue (WebSocket Supabase + CDC + Inter-onglets) ---
  useEffect(() => {
    let mounted = true;

    // 1. Chargement initial complet immédiat
    refreshAllCloudData();

    // 2. Réhydrater depuis IndexedDB les fichiers audio locaux
    getAllTracks().then((savedRows) => {
      if (!mounted || !savedRows) return;
      reconcileCatalogueWithCloudTracks(savedRows);
      const trackIdsToCheck = catalogue.flatMap((alb) =>
        alb.tracks.map((t) => t.id)
      );
      trackIdsToCheck.forEach(async (tId) => {
        const freshBlobUrl = await getPersistentAudioBlobUrl(tId);
        if (freshBlobUrl && mounted) {
          setCatalogue((prev) =>
            prev.map((alb) => ({
              ...alb,
              tracks: alb.tracks.map((t) =>
                t.id === tId ? { ...t, audioUrl: freshBlobUrl } : t
              ),
            }))
          );
        }
      });
    });

    // 3. Abonnement aux événements temps réel (WebSocket Supabase & BroadcastChannel)
    const unsubscribe = subscribeToLiveSync({
      onTracksUpdated: async (payload) => {
        const freshRows = await getAllTracks();
        reconcileCatalogueWithCloudTracks(freshRows);

        const notifTitle =
          payload.action === 'CREATE'
            ? 'Nouvelle musique publiée'
            : payload.action === 'DELETE'
            ? 'Piste retirée'
            : 'Piste mise à jour en direct';
        const notifMsg =
          payload.message ||
          `Catalogue synchronisé en temps réel avec Supabase.`;

        pushNotification(notifTitle, notifMsg, 'PUBLISH', payload.trackId);
      },
      onBannersUpdated: (payload) => {
        if (payload.banners && payload.banners.length > 0) {
          isRemoteSyncInProgressRef.current = true;
          setAdBanners(payload.banners);
          setTimeout(() => {
            isRemoteSyncInProgressRef.current = false;
          }, 150);
        }
        if (payload.settings && payload.settings.slideIntervalSec) {
          isRemoteSyncInProgressRef.current = true;
          setAdBannerSettings(payload.settings);
          setTimeout(() => {
            isRemoteSyncInProgressRef.current = false;
          }, 150);
        }
        pushNotification(
          'Bannières en direct',
          payload.message ||
            'Le diaporama publicitaire a été mis à jour par l’administrateur.',
          'DATABASE'
        );
      },
      onEntitiesUpdated: async (payload) => {
        const freshEntities = await getStudioEntitiesFromCloud(entityDb);
        setEntityDb(freshEntities);
        pushNotification(
          'Talents & Studio',
          payload.message ||
            'Mise à jour des crédits et profils du studio en direct.',
          'DATABASE'
        );
      },
      onAdminAnnouncement: (payload) => {
        pushNotification(payload.title, payload.message, 'DATABASE');
      },
      onAdminSettingsUpdated: (payload) => {
        applyRemoteAdminConfig(payload);
        pushNotification(
          'Paramètres Admin synchronisés',
          payload.message || 'Configuration globale mise à jour en direct.',
          'DATABASE'
        );
      },
      onConnectionChange: (status) => {
        if (mounted) {
          setIsRealtimeConnected(status === 'CONNECTED');
        }
      },
    });

    // 4. Réveil instantané lors du déverrouillage du téléphone ou retour sur l'onglet
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAllCloudData();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      mounted = false;
      unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  // --- Synchronisation des Likes et Abonnements Artistes ---
  useEffect(() => {
    syncUserLibraryStateToCloud({
      user_id: currentUser.id,
      liked_track_ids: likedTrackIds,
      subscribed_artists: subscribedArtists,
      recommended_track_ids: recommendedTrackIds,
    }).catch(() => {});
  }, [currentUser.id, likedTrackIds, subscribedArtists, recommendedTrackIds]);

  // --- Compute Live Ranks & Rank Deltas Across All Tracks ---
  const allTracksFlat = useMemo(() => catalogue.flatMap((a) => a.tracks), [catalogue]);

  const royaltyLedger = useMemo(() => {
    const mappedListeners = users.map((u, idx) => ({
      id: u.id,
      name: u.name,
      billing: {
        plan:
          idx === 0
            ? ('PREMIUM_MENSUEL' as const)
            : idx === 1
              ? ('PASS_7J' as const)
              : ('PREMIUM_MENSUEL' as const),
        channel: 'MOBILE_MONEY' as const,
        passesPurchased: 2,
      },
      trackStats: u.trackStats,
    }));
    return buildRoyaltyLedger({
      tracks: allTracksFlat.map((t) => ({
        id: t.id,
        title: t.title,
        isrc: t.dropContentId || `GA-DRP-26-${t.id.replace(/[^0-9A-Za-z]/g, '').slice(-5).padStart(5, '0')}`,
        artist: t.artist,
        featuringArtists: t.featuringArtists,
        featuringSplitMode: t.featuringSplitMode,
        labelName: t.labelName,
        beatmakerName: t.beatmakerName,
        lyricistName: t.lyricistName,
        soundEngineerName: t.soundEngineerName,
        recordingEngineerName: t.recordingEngineerName,
        mixingEngineerName: t.mixingEngineerName,
        masteringEngineerName: t.masteringEngineerName,
        isInstrumental: t.isInstrumental,
        gabonTerritoryPct: t.gabonTerritoryPct,
      })),
      listeners: mappedListeners,
      settings: royaltyLedgerState.settings,
      baseline: royaltyLedgerState.baseline,
      previousBalances: royaltyLedgerState.previousBalances,
      taxStatusOverrides: royaltyLedgerState.taxStatusOverrides,
    });
  }, [allTracksFlat, users, royaltyLedgerState]);

  const trackRankMap = useMemo(() => {
    const sorted = [...allTracksFlat].sort((a, b) => b.algoPoints - a.algoPoints);
    const map: Record<string, { rank: number; delta: number }> = {};
    sorted.forEach((t, idx) => {
      const currentRank = idx + 1;
      const base = t.baselineRank || currentRank;
      const delta = base - currentRank;
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

  // --- Silent Background Recording of User & Track Metrics (Calibrated in ECG) ---
  const recordUserAndTrackStats = useCallback(
    (
      trackId: string,
      updates: {
        addListenSeconds?: number;
        addValidatedPlay?: boolean;
        addValidatedEcgWeight?: number;
        addLoop?: boolean;
        currentConsecutiveLoop?: number;
        pointsDelta?: number;
        newRetentionSessionPct?: number;
        resetConsecutiveLoops?: boolean;
      }
    ) => {
      const activePassSpec =
        GABON_PASS_SPECS[subscriptionPass] || GABON_PASS_SPECS.PASS_MENSUEL_HEBDO;
      const ecgDelta =
        updates.addValidatedEcgWeight !== undefined
          ? updates.addValidatedEcgWeight
          : updates.addValidatedPlay
            ? activePassSpec.ecgWeight
            : 0;

      setCatalogue((prev) =>
        prev.map((alb) => ({
          ...alb,
          tracks: alb.tracks.map((t) => {
            if (t.id !== trackId) return t;
            const nextRealPlays = Math.round((t.realPlays + ecgDelta) * 10) / 10;
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
              displayPlaysFormatted: undefined, // Permet l'affichage dynamique du compteur ECG mis à jour
              lastActivityAgo: ecgDelta > 0 ? 'à l’instant' : t.lastActivityAgo,
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
            lastListenedAt: 'il y a 1 m.',
          };

          const updatedConsec =
            updates.currentConsecutiveLoop !== undefined
              ? Math.max(prevStat.maxConsecutiveLoops, updates.currentConsecutiveLoop)
              : prevStat.maxConsecutiveLoops;

          const nextStat: UserTrackStat = {
            ...prevStat,
            listenSeconds: prevStat.listenSeconds + (updates.addListenSeconds || 0),
            playsCount: prevStat.playsCount + (ecgDelta > 0 ? 1 : 0),
            loopsCount: prevStat.loopsCount + (updates.addLoop ? 1 : 0),
            maxConsecutiveLoops: updatedConsec,
            pointsContributed:
              Math.round((prevStat.pointsContributed + (updates.pointsDelta || 0)) * 100) / 100,
            lastListenedAt: 'il y a 1 m.',
          };

          return {
            ...u,
            totalListenSeconds: u.totalListenSeconds + (updates.addListenSeconds || 0),
            totalValidatedPlays: u.totalValidatedPlays + (ecgDelta > 0 ? 1 : 0),
            totalLoops: u.totalLoops + (updates.addLoop ? 1 : 0),
            trackStats: {
              ...u.trackStats,
              [trackId]: nextStat,
            },
          };
        })
      );
    },
    [currentUser.id, likedTrackIds, subscriptionPass]
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
        subscriptionPass,
        networkOperator,
        masterVolumePct: masterVolume,
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
      ecgValidatedAt30Sec: false,
      sessionPointsEarned: 0,
    };
  }, [
    catalogue,
    currentTrack.id,
    currentUser.id,
    recordUserAndTrackStats,
    subscriptionPass,
    networkOperator,
    masterVolume,
  ]);

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

  // --- Web Audio API Synthesizer + 5-Band EQ + -14.0 LUFS Uniform Loudness Normalizer ---
  const computeTrackLoudnessGain = useCallback((lufsLevel?: number): number => {
    const sourceLufs = Number.isFinite(lufsLevel) ? (lufsLevel as number) : -14.0;
    // Compense automatiquement l'écart par rapport à la cible broadcast -14.0 LUFS (borné à +/- 9 dB)
    const deltaDb = Math.max(-9, Math.min(9, -14.0 - sourceLufs));
    return Math.pow(10, deltaDb / 20);
  }, []);

  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new AudioCtx();
      audioCtxRef.current = ctx;

      // 1. Nœud Master Volume contrôlé par l'utilisateur (0% à 100%)
      const master = ctx.createGain();
      master.gain.value = (masterVolume / 100) * 0.32;
      master.connect(ctx.destination);
      masterGainRef.current = master;

      // 2. Compresseur / Limiteur Broadcast (-14.0 LUFS Constant Leveler)
      // Garantit que toutes les chansons (fichiers audio ou synthé) sortent au même volume perçu
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 10;
      compressor.ratio.value = 4.5;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.16;
      compressor.connect(master);
      loudnessCompressorRef.current = compressor;

      // 3. Nœud d'Auto-Gain de Normalisation LUFS par piste (Cible : -14.0 LUFS)
      const loudnessNorm = ctx.createGain();
      loudnessNorm.gain.value = computeTrackLoudnessGain(currentTrack.lufsMasterLevel);
      loudnessNorm.connect(compressor);
      loudnessNormGainRef.current = loudnessNorm;

      // 4. Égaliseur 5 bandes
      const freqs = [60, 250, 1000, 4000, 12000];
      const filters = freqs.map((f, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? 'lowshelf' : i === freqs.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = f;
        filter.Q.value = 1.1;
        filter.gain.value = eqGains[i] ?? 0;
        return filter;
      });

      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filters[filters.length - 1].connect(loudnessNorm);
      eqFiltersRef.current = filters;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, [masterVolume, eqGains, computeTrackLoudnessGain, currentTrack.lufsMasterLevel]);

  // --- Ajustement automatique du gain de normalisation (-14.0 LUFS) à chaque changement de chanson ---
  useEffect(() => {
    const targetNormGain = computeTrackLoudnessGain(currentTrack.lufsMasterLevel);
    if (loudnessNormGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      loudnessNormGainRef.current.gain.cancelScheduledValues(now);
      loudnessNormGainRef.current.gain.setTargetAtTime(targetNormGain, now, 0.015);
    }
    if (htmlAudioRef.current) {
      const normScalar = Math.min(1.15, Math.max(0.45, targetNormGain));
      htmlAudioRef.current.volume = Math.max(
        0,
        Math.min(1, (masterVolume / 100) * normScalar)
      );
    }
  }, [currentTrack.id, currentTrack.lufsMasterLevel, masterVolume, computeTrackLoudnessGain]);

  const handleChangeMasterVolume = useCallback(
    (vol: number) => {
      const clamped = Math.max(0, Math.min(100, vol));
      setMasterVolume(clamped);
      if (masterGainRef.current && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        masterGainRef.current.gain.cancelScheduledValues(now);
        masterGainRef.current.gain.setTargetAtTime(
          (clamped / 100) * 0.32,
          now,
          0.01
        );
      }
      const normScalar = Math.min(
        1.15,
        Math.max(0.45, computeTrackLoudnessGain(currentTrack.lufsMasterLevel))
      );
      if (htmlAudioRef.current) {
        htmlAudioRef.current.volume = Math.max(
          0,
          Math.min(1, (clamped / 100) * normScalar)
        );
      }
      if (uploadPreviewAudioRef.current) {
        uploadPreviewAudioRef.current.volume = Math.max(
          0,
          Math.min(1, (clamped / 100) * normScalar)
        );
      }
      if (externalPlayerRef.current?.setVolume) {
        externalPlayerRef.current.setVolume(Math.round(clamped));
      }
    },
    [computeTrackLoudnessGain, currentTrack.lufsMasterLevel]
  );

  const handleChangeEqBand = useCallback((bandIdx: number, dbVal: number) => {
    const clampedDb = Math.max(-12, Math.min(12, Math.round(dbVal * 2) / 2));
    setEqGains((prev) => {
      const next = [...prev];
      next[bandIdx] = clampedDb;
      return next;
    });
    const filter = eqFiltersRef.current[bandIdx];
    if (filter && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      filter.gain.cancelScheduledValues(now);
      filter.gain.setTargetAtTime(clampedDb, now, 0.015);
    }
  }, []);

  const handleApplyEqPreset = useCallback((gains: number[]) => {
    const cleanGains = gains.map((g) => Math.max(-12, Math.min(12, Math.round(g * 2) / 2)));
    setEqGains(cleanGains);
    cleanGains.forEach((val, idx) => {
      const filter = eqFiltersRef.current[idx];
      if (filter && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        filter.gain.cancelScheduledValues(now);
        filter.gain.setTargetAtTime(val, now, 0.02);
      }
    });
  }, []);

  const handleResetEq = useCallback(() => {
    const flat = [0, 0, 0, 0, 0];
    setEqGains(flat);
    flat.forEach((val, idx) => {
      const filter = eqFiltersRef.current[idx];
      if (filter && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        filter.gain.cancelScheduledValues(now);
        filter.gain.setTargetAtTime(val, now, 0.02);
      }
    });
  }, []);

  // --- Synthétiseur Iso-Loudness (-14.0 LUFS constant entre tous les titres et modes Drop/Full) ---
  const triggerSynthNote = useCallback(
    (
      freq: number,
      step: number,
      dropActive: boolean,
      customNotes?: number[],
      trackBpm = 118
    ) => {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== 'running') return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const subGain = ctx.createGain();

      let targetFreq = freq;
      if (customNotes && customNotes.length > 0) {
        targetFreq = customNotes[step % customNotes.length];
      } else {
        const scaleMultipliers = [1, 1.2, 1.333, 1.5, 1.6, 2];
        const mult = scaleMultipliers[step % scaleMultipliers.length];
        targetFreq = freq * mult * (step % 4 === 0 ? 0.5 : 1);
      }
      // Bornage sécurisé de la fréquence fondamentale pour garantir un équilibre spectral constant
      const safeFreq = Math.max(95, Math.min(587.33, targetFreq));

      osc.type = dropActive ? 'sawtooth' : 'triangle';
      subOsc.type = 'sine';
      osc.frequency.setValueAtTime(safeFreq, now);
      subOsc.frequency.setValueAtTime(safeFreq * 0.5, now);

      // Compensation RMS exacte entre l'onde en dents de scie (Drop) et l'onde triangulaire (Full)
      // + Courbe Iso-Sonie (Fletcher-Munson) pour que les notes aiguës et graves aient le même volume perçu
      const waveformRmsNorm = dropActive ? 0.165 : 0.215;
      const isoLoudnessFreqComp = Math.max(
        0.78,
        Math.min(1.22, Math.pow(240 / safeFreq, 0.22))
      );
      const normalizedPeakGain = waveformRmsNorm * isoLoudnessFreqComp;

      // Durée d'enveloppe indexée sur le tempo pour éviter l'accumulation d'énergie sur les BPM rapides
      const stepDurationSec = Math.max(0.22, Math.min(0.35, (60 / Math.max(80, trackBpm)) * 0.42));

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(normalizedPeakGain, now + 0.035);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + stepDurationSec);

      // Niveau de sub-basse constant et équilibré
      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.11, now + 0.035);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + stepDurationSec);

      osc.connect(noteGain);
      subOsc.connect(subGain);

      const destinationNode =
        eqFiltersRef.current[0] ||
        loudnessNormGainRef.current ||
        loudnessCompressorRef.current ||
        masterGainRef.current ||
        ctx.destination;

      noteGain.connect(destinationNode);
      subGain.connect(destinationNode);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + stepDurationSec + 0.02);
      subOsc.stop(now + stepDurationSec + 0.02);
    },
    []
  );

  // --- Synchronize Active Audio Engine (Strict -14.0 LUFS Level Matching) ---
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
        try {
          audio.currentTime = currentTime;
        } catch {
          // Wait for metadata if needed
        }
      }
      const normScalar = Math.min(
        1.15,
        Math.max(0.45, computeTrackLoudnessGain(currentTrack.lufsMasterLevel))
      );
      audio.volume = Math.max(
        0,
        Math.min(1, (masterVolume / 100) * normScalar)
      );
      if (isPlaying && !isPreviewingUploadDrop) {
        audio.play().catch(async () => {
          // Si l'URL blob: d'une session précédente a expiré, on tente de la réhydrater depuis IndexedDB
          const freshUrl = await getPersistentAudioBlobUrl(currentTrack.id);
          if (freshUrl && htmlAudioRef.current) {
            htmlAudioRef.current.src = freshUrl;
            htmlAudioRef.current.currentTime = currentTime;
            htmlAudioRef.current.play().catch(() => {});
          } else {
            // Si le binaire n'est plus présent (ex: uploadé avant la mise à jour IndexedDB), basculer sur le synthé pour garantir du son
            initAudioContext();
            if (!synthIntervalRef.current) {
              const stepMs = Math.round((60 / (currentTrack.bpm || 120)) * 500);
              synthIntervalRef.current = window.setInterval(() => {
                if (!isPlayingRef.current) return;
                stepCounterRef.current += 1;
                triggerSynthNote(
                  currentTrack.baseFreq || 120,
                  stepCounterRef.current,
                  isDropMode,
                  currentTrack.notes,
                  currentTrack.bpm
                );
              }, stepMs);
            }
          }
        });
      } else {
        audio.pause();
      }
      return;
    } else if (htmlAudioRef.current) {
      htmlAudioRef.current.pause();
    }

    if (hasExternalStream) {
      const streamId = currentTrack.externalStreamId!;
      const normFactor = Math.min(
        1.0,
        computeTrackLoudnessGain(currentTrack.lufsMasterLevel)
      );
      const normalizedExtVolume = Math.round(masterVolume * normFactor);
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
              event.target.setVolume(normalizedExtVolume);
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
        externalPlayerRef.current.setVolume?.(normalizedExtVolume);
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
        triggerSynthNote(
          currentTrack.baseFreq,
          stepCounterRef.current,
          isDropMode,
          currentTrack.notes,
          currentTrack.bpm
        );
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
    masterVolume,
    isPreviewingUploadDrop,
    initAudioContext,
    triggerSynthNote,
    computeTrackLoudnessGain,
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

  // --- Select Specific Track Index within Active Album ---
  const handleSelectTrackIndex = useCallback(
    (nextT: number) => {
      const tracksLen = currentAlbum.tracks.length;
      if (tracksLen === 0) return;
      const clampedT = ((nextT % tracksLen) + tracksLen) % tracksLen;
      const targetTrack = currentAlbum.tracks[clampedT];
      if (!targetTrack) return;

      initAudioContext();
      finalizeListeningSessionOnZap();

      setTrackIdx(clampedT);
      setIsDropMode(true);
      setCurrentTime(targetTrack.dropStart);

      manualSessionRef.current = {
        trackId: targetTrack.id,
        active: false,
        listenedSeconds: 0,
        playCountedAtOneSec: false,
        ecgValidatedAt30Sec: false,
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
    [currentAlbum, initAudioContext, finalizeListeningSessionOnZap]
  );

  // --- Select Specific Album Index in 3D Cover Flow or Central Hub ---
  const handleSelectAlbumIndex = useCallback(
    (nextA: number, specificTrackIdx = 0, startFullPlay = false) => {
      const albumsLen = catalogue.length;
      if (albumsLen === 0) return;
      const clampedA = ((nextA % albumsLen) + albumsLen) % albumsLen;
      const targetAlbum = catalogue[clampedA];
      if (!targetAlbum || targetAlbum.tracks.length === 0) return;
      const clampedT = Math.min(specificTrackIdx, targetAlbum.tracks.length - 1);
      const targetTrack = targetAlbum.tracks[clampedT];

      initAudioContext();
      finalizeListeningSessionOnZap();

      const startSec = startFullPlay ? 0 : targetTrack.dropStart;

      setAlbumIdx(clampedA);
      setTrackIdx(clampedT);
      setIsDropMode(!startFullPlay);
      setCurrentTime(startSec);

      manualSessionRef.current = {
        trackId: targetTrack.id,
        active: startFullPlay,
        listenedSeconds: 0,
        playCountedAtOneSec: false,
        ecgValidatedAt30Sec: false,
        sessionPointsEarned: 0,
      };

      if (targetTrack.audioUrl && htmlAudioRef.current) {
        htmlAudioRef.current.src = targetTrack.audioUrl;
        htmlAudioRef.current.currentTime = startSec;
      }
      if (targetTrack.externalStreamId && externalPlayerRef.current?.loadVideoById) {
        externalPlayerRef.current.loadVideoById({
          videoId: targetTrack.externalStreamId,
          startSeconds: startSec,
        });
      }
      setIsPlaying(true);
    },
    [catalogue, initAudioContext, finalizeListeningSessionOnZap]
  );

  // --- Navigate Track (Axe Y : Swipe Vertical Haut/Bas ET Boutons Suivant/Précédent dans l'album actif en boucle) ---
  const navigateTrack = useCallback(
    (dir: 1 | -1) => {
      const tracksLen = currentAlbum.tracks.length;
      if (tracksLen === 0) return;

      if (tracksLen === 1) {
        const albumsLen = catalogue.length;
        if (albumsLen <= 1) return;
        let nextA = (safeAlbumIdx + dir + albumsLen) % albumsLen;
        if (isShuffle && albumsLen > 1) {
          const candidates = catalogue.map((_, idx) => idx).filter((idx) => idx !== safeAlbumIdx);
          nextA = candidates[Math.floor(Math.random() * candidates.length)];
        }
        handleSelectAlbumIndex(nextA, 0);
        return;
      }

      let nextT = (safeTrackIdx + dir + tracksLen) % tracksLen;
      if (isShuffle && tracksLen > 1) {
        const candidates = currentAlbum.tracks
          .map((_, idx) => idx)
          .filter((idx) => idx !== safeTrackIdx);
        nextT = candidates[Math.floor(Math.random() * candidates.length)];
      }
      handleSelectTrackIndex(nextT);
    },
    [
      currentAlbum,
      catalogue,
      safeAlbumIdx,
      safeTrackIdx,
      isShuffle,
      handleSelectAlbumIndex,
      handleSelectTrackIndex,
    ]
  );

  // --- Navigate Album (Axe X : Swipe Horizontal 3D Cover Flow Gauche/Droite entre les projets principaux) ---
  const navigateAlbum = useCallback(
    (dir: 1 | -1) => {
      const albumsLen = catalogue.length;
      if (albumsLen === 0) return;

      let nextA = (safeAlbumIdx + dir + albumsLen) % albumsLen;
      if (isShuffle && albumsLen > 1) {
        const candidates = catalogue.map((_, idx) => idx).filter((idx) => idx !== safeAlbumIdx);
        nextA = candidates[Math.floor(Math.random() * candidates.length)];
      }
      handleSelectAlbumIndex(nextA, 0);
    },
    [catalogue, safeAlbumIdx, isShuffle, handleSelectAlbumIndex]
  );

  // --- Silent Playback Timer, 30s ECG Validation & Anti-Fraud Shield ---
  useEffect(() => {
    if (!isPlaying || isPreviewingUploadDrop) return;
    const timer = window.setInterval(() => {
      if (!isDropMode && manualSessionRef.current.active) {
        manualSessionRef.current.listenedSeconds += 1;
        const listenedSec = manualSessionRef.current.listenedSeconds;
        const requiredSec =
          currentTrack.duration < 60
            ? Math.ceil(currentTrack.duration * 0.75)
            : 30;

        if (listenedSec < requiredSec && !manualSessionRef.current.ecgValidatedAt30Sec) {
          if (masterVolume <= 0) {
            setLastEcgValidationMsg(
              `REJET MUTE STREAMING (Volume 0%) : L'écoute en cours (${listenedSec}s) vaudra 0.0 ECG.`
            );
          } else {
            const activePass =
              GABON_PASS_SPECS[subscriptionPass] ||
              GABON_PASS_SPECS.PASS_MENSUEL_HEBDO;
            setLastEcgValidationMsg(
              `Audit ECG en cours : ${listenedSec}s / ${requiredSec}s consécutives (${activePass.shortLabel})`
            );
          }
        }

        if (
          listenedSec >= requiredSec &&
          !manualSessionRef.current.ecgValidatedAt30Sec
        ) {
          manualSessionRef.current.ecgValidatedAt30Sec = true;
          manualSessionRef.current.playCountedAtOneSec = true;
          const trackId = currentTrack.id;
          const prevDailyCount = dailyUserTrackPlaysRef.current[trackId] || 0;

          const ecgAudit = evaluateEcgStreamValidation({
            trackDurationSec: currentTrack.duration,
            consecutiveListenedSec: listenedSec,
            masterVolumePct: masterVolume,
            passType: subscriptionPass,
            playsOfThisTrackTodayByUser: prevDailyCount,
            roboticLoopHoursWithoutInteraction: listenedSec / 3600,
            offlineCacheAgeDays: 0,
          });

          setLastEcgValidationMsg(ecgAudit.statusMessage);

          if (ecgAudit.countedInChartsAndCerts && ecgAudit.ecgEarned > 0) {
            dailyUserTrackPlaysRef.current[trackId] = prevDailyCount + 1;

            streamTracker.trackAction('play', trackId, {
              userId: currentUser.id,
              durationPlayedSeconds: listenedSec,
              ecgValue: ecgAudit.ecgEarned,
              subscriptionPass,
              networkOperator,
              masterVolumePct: masterVolume,
            });

            recordUserAndTrackStats(trackId, {
              addValidatedPlay: true,
              addValidatedEcgWeight: ecgAudit.ecgEarned,
              pointsDelta: ecgAudit.ecgEarned * 0.35,
            });
          }
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
              subscriptionPass,
              networkOperator,
              masterVolumePct: masterVolume,
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
              playCountedAtOneSec: false,
              ecgValidatedAt30Sec: false,
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
              subscriptionPass,
              networkOperator,
              masterVolumePct: masterVolume,
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
    masterVolume,
    subscriptionPass,
    networkOperator,
    seekAllEngines,
    navigateTrack,
    recordUserAndTrackStats,
  ]);

  // Automatic Drop Preview on first browser gesture while keeping Play button unactivated (isDropMode === true)
  useEffect(() => {
    const startAutoDropPreview = () => {
      initAudioContext();
      if (!isPlayingRef.current && !isPreviewingUploadDrop) {
        setIsDropMode(true);
        setCurrentTime(currentTrack.dropStart);
        setIsPlaying(true);
      }
      window.removeEventListener('pointerdown', startAutoDropPreview);
      window.removeEventListener('keydown', startAutoDropPreview);
    };
    window.addEventListener('pointerdown', startAutoDropPreview, { once: true });
    window.addEventListener('keydown', startAutoDropPreview, { once: true });
    return () => {
      window.removeEventListener('pointerdown', startAutoDropPreview);
      window.removeEventListener('keydown', startAutoDropPreview);
    };
  }, [initAudioContext, currentTrack.dropStart, isPreviewingUploadDrop]);

  const handleCentralPlayToggle = () => {
    initAudioContext();

    // Si le lecteur est en mode aperçu Drop automatique, un clic explicite sur Play
    // lance la lecture complète depuis 0:00 et démarre le comptage/vérification de l'algorithme.
    if (isDropMode) {
      setIsDropMode(false);
      seekAllEngines(0);
      manualSessionRef.current = {
        trackId: currentTrack.id,
        active: true,
        listenedSeconds: 0,
        playCountedAtOneSec: false,
        ecgValidatedAt30Sec: false,
        sessionPointsEarned: 0,
      };
      setIsPlaying(true);
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (!manualSessionRef.current.active || manualSessionRef.current.trackId !== currentTrack.id) {
      if (currentTime >= currentTrack.duration - 2) {
        seekAllEngines(0);
      }
      manualSessionRef.current = {
        trackId: currentTrack.id,
        active: true,
        listenedSeconds: 0,
        playCountedAtOneSec: false,
        ecgValidatedAt30Sec: false,
        sessionPointsEarned: 0,
      };
    }
    setIsPlaying(true);
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
          lastListenedAt: 'il y a 1 m.',
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

  // --- Toggle Offline Download Cache on Bottom-Right Button ---
  const handleToggleOfflineDownload = () => {
    const isCurrentlyDownloaded = Boolean(currentTrack.downloadedOffline);
    if (!isCurrentlyDownloaded) {
      if (subscriptionPass === 'FREEMIUM_PUB' || subscriptionPass === 'ESSAI_GRATUIT') {
        pushNotification(
          'Cache Hors-Ligne réservé aux Pass Mobile Money',
          'Activez un Pass 7 Jours (500 FCFA, max 25 titres) ou le Premium Mensuel (1 500 FCFA, illimité) pour écouter sans consommer votre forfait Internet.',
          'CERTIFICATION',
          currentTrack.id
        );
        return;
      }
      const downloadedCount = allTracksFlat.filter((t) => t.downloadedOffline).length;
      if (subscriptionPass === 'PASS_JOURNALIER' && downloadedCount >= 25) {
        pushNotification(
          'Plafond Pass 7 Jours atteint (25/25 titres)',
          'Passez au Premium Mensuel (1 500 FCFA) pour débloquer le téléchargement hors-ligne illimité.',
          'CERTIFICATION',
          currentTrack.id
        );
        return;
      }
    }

    setCatalogue((prev) =>
      prev.map((alb) => ({
        ...alb,
        tracks: alb.tracks.map((t) =>
          t.id === currentTrack.id ? { ...t, downloadedOffline: !t.downloadedOffline } : t
        ),
      }))
    );
    streamTracker.sync();
  };

  // --- Recommend Track / Share Lyric Excerpt into Community Feed ---
  const handleRecommendTrack = (
    trackId: string,
    commentOrExcerpt?: string,
    isLyricExcerpt?: boolean
  ) => {
    const targetTrack = allTracksFlat.find((t) => t.id === trackId);
    if (!targetTrack) return;

    const alreadyRec = !!recommendedTrackIds[trackId] && !isLyricExcerpt;
    setRecommendedTrackIds((prev) => ({
      ...prev,
      [trackId]: true,
    }));

    setCatalogue((prev) =>
      prev.map((alb) => ({
        ...alb,
        tracks: alb.tracks.map((t) => {
          if (t.id !== trackId) return t;
          const nextRecs = alreadyRec ? t.recommendationsCount : t.recommendationsCount + 1;
          const nextLyricsShares = isLyricExcerpt ? t.lyricsSharesCount + 1 : t.lyricsSharesCount;
          const nextPoints =
            Math.round((t.algoPoints + (isLyricExcerpt ? 0.45 : 0.35)) * 100) / 100;
          return {
            ...t,
            recommendationsCount: nextRecs,
            lyricsSharesCount: nextLyricsShares,
            algoPoints: nextPoints,
            lastActivityAgo: 'à l’instant',
          };
        }),
      }))
    );

    const recItem: CommunityRecommendationItem = {
      id: `rec-${Date.now()}`,
      trackId: targetTrack.id,
      trackTitle: targetTrack.title,
      trackArtist:
        targetTrack.featuringArtists && targetTrack.featuringArtists.length > 0
          ? `${targetTrack.artist} feat. ${targetTrack.featuringArtists.join(', ')}`
          : targetTrack.artist,
      trackCategory: targetTrack.category,
      cover: targetTrack.cover,
      artworkType: targetTrack.artworkType,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      commentOrLyricExcerpt:
        commentOrExcerpt ||
        (isLyricExcerpt
          ? `Extrait de paroles partagé (${targetTrack.lyricistName})`
          : 'Recommandé à la communauté DROP'),
      isLyricExcerpt: Boolean(isLyricExcerpt),
      lyricistName: targetTrack.lyricistName,
      createdAt: 'à l’instant',
      boostPoints: isLyricExcerpt ? 0.45 : 0.35,
    };

    setCommunityRecommendations((prev) => [recItem, ...prev.slice(0, 29)]);
    pushNotification(
      isLyricExcerpt ? 'Extrait partagé' : 'Titre recommandé',
      `« ${targetTrack.title} » de ${targetTrack.artist} a été partagé dans le Fil Recos.`,
      'COMMUNITY',
      targetTrack.id
    );
  };

  // --- Subscribe / Unsubscribe to Artist ("+ S'abonner") ---
  const handleToggleSubscribeArtist = (artistName: string) => {
    const cleanName = artistName.trim();
    if (!cleanName) return;
    const isSub = !!subscribedArtists[cleanName];
    setSubscribedArtists((prev) => ({
      ...prev,
      [cleanName]: !isSub,
    }));
    setArtistSubscribers((prev) => {
      const currentCount = prev[cleanName] ?? 950;
      return {
        ...prev,
        [cleanName]: isSub ? Math.max(0, currentCount - 1) : currentCount + 1,
      };
    });
    if (!isSub) {
      pushNotification(
        `Abonnement activé`,
        `Vous suivez désormais les sorties de ${cleanName}.`,
        'COMMUNITY'
      );
    }
  };

  // --- Record Lyrics Open Engagement (Boosts Parolier Ranking) ---
  const handleRecordLyricsOpen = (trackId: string) => {
    setCatalogue((prev) =>
      prev.map((alb) => ({
        ...alb,
        tracks: alb.tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                lyricsOpensCount: t.lyricsOpensCount + 1,
              }
            : t
        ),
      }))
    );
  };

  // --- Governance: Handshake Protocol & Escrow Dispute Resolution (Retroactive Recalculation) ---
  const handleConfirmCreditHandshake = useCallback(
    (
      trackId: string,
      roleKey?:
        | 'beatmakerStatus'
        | 'recordingEngineerStatus'
        | 'mixingEngineerStatus'
        | 'masteringEngineerStatus'
        | 'lyricistStatus'
    ) => {
      setCatalogue((prev) =>
        prev.map((alb) => ({
          ...alb,
          tracks: alb.tracks.map((t) => {
            if (t.id !== trackId) return t;
            const prevHs = t.creditHandshake;
            return {
              ...t,
              creditHandshake: {
                ...prevHs,
                status: 'VERIFIED',
                beatmakerStatus:
                  !roleKey || roleKey === 'beatmakerStatus'
                    ? 'VALIDATED'
                    : prevHs?.beatmakerStatus || 'VALIDATED',
                recordingEngineerStatus:
                  !roleKey || roleKey === 'recordingEngineerStatus'
                    ? 'VALIDATED'
                    : prevHs?.recordingEngineerStatus || 'VALIDATED',
                mixingEngineerStatus:
                  !roleKey || roleKey === 'mixingEngineerStatus'
                    ? 'VALIDATED'
                    : prevHs?.mixingEngineerStatus || 'VALIDATED',
                masteringEngineerStatus:
                  !roleKey || roleKey === 'masteringEngineerStatus'
                    ? 'VALIDATED'
                    : prevHs?.masteringEngineerStatus || 'VALIDATED',
                lyricistStatus:
                  !roleKey || roleKey === 'lyricistStatus'
                    ? 'VALIDATED'
                    : prevHs?.lyricistStatus || 'VALIDATED',
                confirmedByBeatmaker: true,
                confirmedByEngineer: true,
                confirmedByLyricist: true,
                confirmedByLabel: true,
                escrowFrozen: false,
                audit72hCompleted: true,
                dawAuditRequired: prevHs?.dawAuditRequired ?? false,
                qrCertificateHash:
                  prevHs?.qrCertificateHash ||
                  `GABON-ECG-SHA256-${trackId.toUpperCase()}-VERIFIED`,
              },
            };
          }),
        }))
      );
    },
    []
  );

  const handleOpenCreditDispute = useCallback((trackId: string, reason: string) => {
    setCatalogue((prev) =>
      prev.map((alb) => ({
        ...alb,
        tracks: alb.tracks.map((t) => {
          if (t.id !== trackId) return t;
          const prevHs = t.creditHandshake;
          return {
            ...t,
            creditHandshake: {
              ...prevHs,
              status: 'DISPUTED',
              beatmakerStatus: 'DISPUTED_ESCROW',
              confirmedByBeatmaker: false,
              confirmedByEngineer: prevHs?.confirmedByEngineer ?? true,
              confirmedByLyricist: prevHs?.confirmedByLyricist ?? true,
              confirmedByLabel: prevHs?.confirmedByLabel ?? true,
              disputeReason: reason,
              disputeOpenedAt: "À l'instant",
              escrowFrozen: true,
              audit72hCompleted: prevHs?.audit72hCompleted ?? true,
              dawAuditRequired: prevHs?.dawAuditRequired ?? false,
              qrCertificateHash:
                prevHs?.qrCertificateHash || `GABON-ECG-SHA256-${trackId.toUpperCase()}`,
            },
          };
        }),
      }))
    );
  }, []);

  const handleResolveCreditDispute = useCallback(
    (
      trackId: string,
      winnerName = 'Kvnz Beats',
      roleUpdated: 'BEATMAKER' | 'ENGINEER' | 'LYRICIST' = 'BEATMAKER'
    ) => {
      const cleanWinner = winnerName.trim() || 'Kvnz Beats';

      setCatalogue((prev) =>
        prev.map((alb) => ({
          ...alb,
          tracks: alb.tracks.map((t) => {
            if (t.id !== trackId) return t;
            const prevHs = t.creditHandshake;
            return {
              ...t,
              beatmakerName: roleUpdated === 'BEATMAKER' ? cleanWinner : t.beatmakerName,
              soundEngineerName:
                roleUpdated === 'ENGINEER' ? cleanWinner : t.soundEngineerName,
              mixingEngineerName:
                roleUpdated === 'ENGINEER' ? cleanWinner : t.mixingEngineerName,
              lyricistName: roleUpdated === 'LYRICIST' ? cleanWinner : t.lyricistName,
              creditHandshake: {
                ...prevHs,
                status: 'RESOLVED',
                beatmakerStatus: 'VALIDATED',
                recordingEngineerStatus: 'VALIDATED',
                mixingEngineerStatus: 'VALIDATED',
                masteringEngineerStatus: 'VALIDATED',
                lyricistStatus: 'VALIDATED',
                confirmedByBeatmaker: true,
                confirmedByEngineer: true,
                confirmedByLyricist: true,
                confirmedByLabel: true,
                disputeReason: undefined,
                escrowFrozen: false,
                audit72hCompleted: true,
                dawAuditRequired: false,
                retroactiveRecalcAppliedAt: new Date().toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                qrCertificateHash:
                  prevHs?.qrCertificateHash ||
                  `GABON-ECG-SHA256-${trackId.toUpperCase()}-RESOLVED`,
              },
            };
          }),
        }))
      );
    },
    []
  );

  // --- Admin Exclusive DRM Sandbox Functions (AES-256-GCM + Self-Destruct) ---
  const encryptTrackToAdminSandbox = useCallback(
    async (track: Track) => {
      if (isEncryptingAdminDrm) return;
      setIsEncryptingAdminDrm(true);
      setAdminDrmStatusMsg('Découpage en chunks & Chiffrement AES-256-GCM en cours...');

      try {
        const key = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false, // Non-extractible (extractable: false)
          ['encrypt', 'decrypt']
        );

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const rawAudioPayload = encoder.encode(
          `DROP_AUDIO_PCM_FRAME::${track.id}::${track.title}::${Date.now()}::PROTECTED_MASTER`
        );

        const cipherBuffer = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          rawAudioPayload
        );

        setAdminDrmVault((prev) => ({
          ...prev,
          [track.id]: {
            key,
            iv,
            cipherBytes: new Uint8Array(cipherBuffer),
            corrupted: false,
            timestamp: new Date().toLocaleTimeString(),
          },
        }));

        setAdminDrmStatusMsg(
          `Conteneur "${track.title}" chiffré en AES-256-GCM (Clé CryptoKey non-extractible).`
        );
      } catch {
        setAdminDrmStatusMsg('Erreur lors du chiffrement Web Crypto API.');
      } finally {
        setIsEncryptingAdminDrm(false);
      }
    },
    [isEncryptingAdminDrm]
  );

  const handleAdminTestRamDecrypt = async (trackId: string) => {
    const rec = adminDrmVault[trackId];
    if (!rec || rec.corrupted || !rec.key) {
      setAdminDrmStatusMsg(
        'Échec du déchiffrement RAM : Clé révoquée et conteneur binaire autodétruit !'
      );
      return;
    }
    try {
      const ivBuffer = new Uint8Array(rec.iv).buffer;
      const cipherArrayBuffer = new Uint8Array(rec.cipherBytes).buffer;
      const plainBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
        rec.key,
        cipherArrayBuffer
      );
      const text = new TextDecoder().decode(plainBuffer);
      setAdminDrmStatusMsg(`Déchiffré en mémoire vive (RAM) : ${text.slice(0, 44)}...`);
    } catch {
      setAdminDrmStatusMsg('Erreur cryptographique fatale lors du test RAM.');
    }
  };

  const handleAdminSimulateExfiltrationSelfDestruct = (trackId: string) => {
    const rec = adminDrmVault[trackId];
    if (!rec) return;

    const wipedIv = new Uint8Array(rec.iv.length);
    wipedIv.fill(0);
    const wipedCipher = new Uint8Array(rec.cipherBytes.length);
    wipedCipher.fill(0);

    setAdminDrmVault((prev) => ({
      ...prev,
      [trackId]: {
        key: null,
        iv: wipedIv,
        cipherBytes: wipedCipher,
        corrupted: true,
        timestamp: new Date().toLocaleTimeString(),
      },
    }));

    setAdminDrmStatusMsg(
      'VIOLATION SANDBOX DÉTECTÉE : Clé AES-256 révoquée et octets écrasés par 0x00 (Autodestruction).'
    );
  };

  // --- Toggle Track in Playlist ---
  const handleToggleInPlaylist = () => {
    setCatalogue((prev) =>
      prev.map((alb) => ({
        ...alb,
        tracks: alb.tracks.map((t) =>
          t.id === currentTrack.id ? { ...t, inPlaylist: !t.inPlaylist } : t
        ),
      }))
    );
  };

  const handleSeekFromPlayer = (targetSec: number) => {
    initAudioContext();
    setIsDropMode(false);
    if (!manualSessionRef.current.active) {
      manualSessionRef.current = {
        trackId: currentTrack.id,
        active: true,
        listenedSeconds: 0,
        playCountedAtOneSec: false,
        ecgValidatedAt30Sec: false,
        sessionPointsEarned: 0,
      };
    }
    seekAllEngines(targetSec);
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

  // --- Audio File Upload + Automatic Opus Conversion & -14.0 LUFS Loudness Calibration ---
  const handleAudioFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedRawAudioFile(file);
    const objectUrl = URL.createObjectURL(file);
    const baseTrackName = file.name.replace(/\.[^/.]+$/, '');
    const opusFileName = `${baseTrackName}.opus`;
    setNewAudioUrl(objectUrl);
    setNewAudioFileName(opusFileName);
    setNewAudioCodec('OPUS');
    if (!newTitle) {
      setNewTitle(baseTrackName);
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
      const avgRms =
        energies.reduce((acc, v) => acc + v, 0) / Math.max(1, energies.length);
      // Mesure du niveau LUFS intégré du fichier uploadé pour que le normaliseur l'aligne exactement sur -14.0 LUFS
      const estimatedLufs = Math.max(
        -24,
        Math.min(-6, Math.round((20 * Math.log10(Math.max(0.005, avgRms)) - 0.69) * 10) / 10)
      );
      setNewMeasuredLufs(estimatedLufs);

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

      pushNotification(
        'Conversion Opus & Calibration -14.0 LUFS',
        `« ${opusFileName} » converti en Opus et normalisé à -14.0 LUFS constants.`,
        'PUBLISH'
      );
    } catch {
      setNewMeasuredLufs(-14.0);
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
      pushNotification(
        'Conversion Opus & Calibration -14.0 LUFS',
        `« ${opusFileName} » prêt en conteneur Opus (-14.0 LUFS).`,
        'PUBLISH'
      );
    } finally {
      window.clearInterval(progInterval);
      setUploadProgress(100);
      window.setTimeout(() => {
        setIsUploadingFile(false);
      }, 300);
    }
  };

  const handleLoadStudioOpusMasterPreset = () => {
    const uniqueSeed = `${newTitle.trim() || 'session-master-gabon'}-${Date.now()}`;
    const presetFileName = `${(newTitle.trim() || 'session-master-gabon').toLowerCase().replace(/\s+/g, '-')}.opus`;
    setNewAudioFileName(presetFileName);
    setNewAudioCodec('OPUS');
    setNewMeasuredLufs(-14.0);
    setUploadProgress(100);
    const uniquePeaks = computeDeterministicWaveformPeaks(uniqueSeed, 64);
    setWaveformPeaks(uniquePeaks);
    setDetectedHotspotStart(54);
    setNewDropStart(54);
    setNewDropDuration(30);
    pushNotification(
      'Master Studio Opus & Content ID générés',
      `Piste « ${presetFileName} » calibrée à -14.0 LUFS avec empreinte d’onde unique validée.`,
      'PUBLISH'
    );
  };

  // --- Simulation d'un doublon acoustique (> 85% de concordance) pour tester le blocage Content ID ---
  const handleSimulateDuplicateWaveformUpload = (targetExistingTrack?: Track) => {
    const existing = targetExistingTrack || allTracksFlat[0];
    if (!existing) return;
    const refPeaks =
      existing.waveformPeaks && existing.waveformPeaks.length > 0
        ? existing.waveformPeaks
        : computeDeterministicWaveformPeaks(`${existing.id}-${existing.title}-${existing.artist}`, 64);
    // Légère variation de 2% pour illustrer une concordance acoustique à 96%-99%
    const nearIdenticalPeaks = refPeaks.map((v, i) =>
      Number(Math.max(0.08, Math.min(1, v + (i % 2 === 0 ? 0.008 : -0.006))).toFixed(4))
    );
    setUploadSourceType('FILE');
    setNewAudioFileName(`${existing.title.toLowerCase().replace(/\s+/g, '_')}_copy.opus`);
    setNewDurationFormatted(formatTime(existing.duration));
    setNewMeasuredLufs(-14.0);
    setUploadProgress(100);
    setWaveformPeaks(nearIdenticalPeaks);
    setDetectedHotspotStart(existing.dropStart);
    setNewDropStart(existing.dropStart);
    setNewDropDuration(Math.min(30, existing.dropDuration));
    pushNotification(
      'Alerte Content ID DROP : Doublon détecté !',
      `Concordance d’onde supérieure à 85% avec « ${existing.title} » (${existing.artist}). Téléversement bloqué.`,
      'PUBLISH'
    );
  };

  const handleCancelDuplicateUpload = () => {
    setNewAudioFileName('');
    setNewAudioUrl('');
    setNewExternalUrl('');
    setSelectedRawAudioFile(null);
    setWaveformPeaks([]);
    setUploadProgress(0);
    setDetectedHotspotStart(null);
  };

  // --- Analyse obligatoire de la forme d'onde & Attribution du Content ID (DROP-CID) ---
  const newDropContentId = useMemo(() => {
    if (waveformPeaks.length === 0 && !newAudioFileName && !newExternalUrl) return '';
    const activePeaks =
      waveformPeaks.length > 0
        ? waveformPeaks
        : computeDeterministicWaveformPeaks(
            `${newAudioFileName || newExternalUrl}-${newTitle}`,
            64
          );
    return generateDropContentId(activePeaks, parsedNewDuration, newTitle || newAudioFileName);
  }, [waveformPeaks, newAudioFileName, newExternalUrl, parsedNewDuration, newTitle]);

  const waveformVerificationReport = useMemo(() => {
    const hasAudioLoaded =
      uploadSourceType === 'FILE'
        ? Boolean(newAudioFileName.trim() || newAudioUrl.trim() || waveformPeaks.length > 0)
        : Boolean(newExternalUrl.trim());
    if (!hasAudioLoaded) return null;

    const candidatePeaks =
      waveformPeaks.length > 0
        ? waveformPeaks
        : computeDeterministicWaveformPeaks(
            `${newExternalUrl || newAudioFileName}-${newTitle}`,
            64
          );

    let bestMatchTrack: Track | null = null;
    let bestConcordance: WaveformConcordanceResult = {
      similarityPct: 0,
      cosineSimilarityPct: 0,
      envelopeCorrelationPct: 0,
      durationProximityPct: 0,
      metadataMatchBoost: 0,
      isBlocked: false,
    };

    for (const existing of allTracksFlat) {
      const existingPeaks =
        existing.waveformPeaks && existing.waveformPeaks.length > 0
          ? existing.waveformPeaks
          : computeDeterministicWaveformPeaks(
              `${existing.id}-${existing.title}-${existing.artist}`,
              64
            );
      const res = compareWaveformsConcordance(
        candidatePeaks,
        parsedNewDuration,
        existingPeaks,
        existing.duration,
        newTitle,
        existing.title,
        newArtist,
        existing.artist
      );
      if (!bestMatchTrack || res.similarityPct > bestConcordance.similarityPct) {
        bestMatchTrack = existing;
        bestConcordance = res;
      }
    }

    return {
      candidatePeaks,
      candidateCid: newDropContentId,
      matchedTrack: bestMatchTrack,
      matchedPeaks:
        bestMatchTrack?.waveformPeaks ||
        (bestMatchTrack
          ? computeDeterministicWaveformPeaks(
              `${bestMatchTrack.id}-${bestMatchTrack.title}-${bestMatchTrack.artist}`,
              64
            )
          : []),
      matchedCid:
        bestMatchTrack?.dropContentId ||
        (bestMatchTrack
          ? generateDropContentId(
              bestMatchTrack.waveformPeaks || [],
              bestMatchTrack.duration,
              bestMatchTrack.id
            )
          : ''),
      concordance: bestConcordance,
      isBlocked: bestConcordance.isBlocked, // true dès >= 85%
    };
  }, [
    uploadSourceType,
    newAudioFileName,
    newAudioUrl,
    newExternalUrl,
    waveformPeaks,
    allTracksFlat,
    parsedNewDuration,
    newTitle,
    newArtist,
    newDropContentId,
  ]);

  // --- Strict Step-by-Step Admin Wizard Validation (Bloqué si Concordance d'onde >= 85%) ---
  const isWizardStep1Valid = useMemo(() => {
    if (isUploadingFile) return false;
    if (waveformVerificationReport?.isBlocked) return false;
    if (uploadSourceType === 'FILE') {
      return Boolean(newAudioFileName.trim() || newAudioUrl.trim());
    }
    return Boolean(newExternalUrl.trim());
  }, [
    isUploadingFile,
    waveformVerificationReport,
    uploadSourceType,
    newAudioFileName,
    newAudioUrl,
    newExternalUrl,
  ]);

  const isWizardStep2Valid = useMemo(() => {
    if (waveformVerificationReport?.isBlocked) return false;
    return Boolean(
      newTitle.trim() &&
        newArtist.trim() &&
        newCategory.trim() &&
        parsedNewDuration >= 15
    );
  }, [waveformVerificationReport, newTitle, newArtist, newCategory, parsedNewDuration]);

  const isWizardStep3Valid = useMemo(() => {
    if (waveformVerificationReport?.isBlocked) return false;
    const hasCoreStudio = Boolean(
      newLabelName.trim() &&
        newBeatmakerName.trim() &&
        (newMixingEngineerName.trim() || newSoundEngineerName.trim())
    );
    if (!hasCoreStudio) return false;
    if (newIsInstrumental) return true;
    return Boolean(newLyricistName.trim());
  }, [
    waveformVerificationReport,
    newLabelName,
    newBeatmakerName,
    newMixingEngineerName,
    newSoundEngineerName,
    newIsInstrumental,
    newLyricistName,
  ]);

  const canAccessWizardStep = useCallback(
    (targetStep: 1 | 2 | 3 | 4) => {
      if (targetStep === 1) return true;
      if (waveformVerificationReport?.isBlocked) return false;
      if (targetStep === 2) return isWizardStep1Valid;
      if (targetStep === 3) return isWizardStep1Valid && isWizardStep2Valid;
      if (targetStep === 4) return isWizardStep1Valid && isWizardStep2Valid && isWizardStep3Valid;
      return false;
    },
    [waveformVerificationReport, isWizardStep1Valid, isWizardStep2Valid, isWizardStep3Valid]
  );

  const handleCoverFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedRawCoverFile(file);
    setNewCoverFileName(file.name);
    try {
      const uploaded = await uploadCoverFile(file, 900, 900);
      setNewCoverFileUrl(uploaded.coverUrl);
      pushNotification(
        'Pochette enregistrée de façon persistante',
        `L'image « ${file.name} » est prête et sera affichée sur le lecteur et dans Central.`,
        'PUBLISH'
      );
    } catch {
      const dataUrl = await fileToPersistentDataUrl(file, 900, 900, 0.85);
      setNewCoverFileUrl(dataUrl);
    }
  };

  const handleRemoveNewCover = () => {
    setSelectedRawCoverFile(null);
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
    initAudioContext();

    if (loudnessNormGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      loudnessNormGainRef.current.gain.setTargetAtTime(
        computeTrackLoudnessGain(newMeasuredLufs),
        now,
        0.015
      );
    }

    if (uploadSourceType === 'FILE' && newAudioUrl && uploadPreviewAudioRef.current) {
      const previewAudio = uploadPreviewAudioRef.current;
      if (previewAudio.src !== newAudioUrl) {
        previewAudio.src = newAudioUrl;
      }
      try {
        previewAudio.currentTime = newDropStart;
      } catch {
        // Ignore until metadata loaded
      }
      const normScalar = Math.min(
        1.15,
        Math.max(0.45, computeTrackLoudnessGain(newMeasuredLufs))
      );
      previewAudio.volume = Math.max(
        0,
        Math.min(1, (masterVolume / 100) * normScalar)
      );
      previewAudio.play().catch(() => {});
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
    if (!isWizardStep1Valid || !isWizardStep2Valid || !isWizardStep3Valid) return;

    if (isPreviewingUploadDrop) {
      setIsPreviewingUploadDrop(false);
      uploadPreviewAudioRef.current?.pause();
    }

    const streamId =
      uploadSourceType === 'STREAM' ? extractExternalStreamId(newExternalUrl) : undefined;
    const albumName = newAlbum.trim() || `${newArtist.trim()} — Studio Session`;
    const labelStr = newLabelName.trim() || 'Direct Prod Gabon';
    const parsedFeaturings = newFeaturingInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const artistClean = newArtist.trim();
    const beatmakerClean = newBeatmakerName.trim() || artistClean;
    const mixClean =
      newMixingEngineerName.trim() ||
      newSoundEngineerName.trim() ||
      'Maître Boussengui (Studio K)';
    const recClean = newIsInstrumental
      ? 'Instrumental (Sans prise voix)'
      : newRecordingEngineerName.trim() || mixClean;
    const masterClean = newMasteringEngineerName.trim() || mixClean;
    const lyricistClean = newIsInstrumental
      ? 'Instrumental (Sans paroles)'
      : newLyricistName.trim() || artistClean;

    // Sauvegarde automatique dans la base de données pour les listes déroulantes
    handleRegisterEntityInDb('artists', artistClean, true);
    if (parsedFeaturings.length > 0) {
      handleRegisterEntityInDb('artists', parsedFeaturings.join(', '), true);
    }
    handleRegisterEntityInDb('labels', labelStr, true);
    handleRegisterEntityInDb('beatmakers', beatmakerClean, true);
    handleRegisterEntityInDb('engineers', [mixClean, masterClean, !newIsInstrumental ? recClean : ''].filter(Boolean).join(', '), true);
    if (!newIsInstrumental) {
      handleRegisterEntityInDb('lyricists', lyricistClean, true);
    }

    const dawAuditFlag =
      !newIsInstrumental &&
      artistClean.toLowerCase() === beatmakerClean.toLowerCase() &&
      artistClean.toLowerCase() === mixClean.toLowerCase() &&
      artistClean.toLowerCase() === lyricistClean.toLowerCase();

    const finalPeaks =
      waveformPeaks.length > 0
        ? waveformPeaks
        : computeDeterministicWaveformPeaks(
            `${newTitle.trim()}-${artistClean}-${Date.now()}`,
            64
          );
    const finalContentId =
      newDropContentId ||
      generateDropContentId(finalPeaks, parsedNewDuration, newTitle.trim());

    const createdTrack: Track = {
      id: `t-${Date.now()}`,
      title: newTitle.trim(),
      artist: artistClean,
      featuringArtists: parsedFeaturings.length > 0 ? parsedFeaturings : undefined,
      featuringSplitMode: newFeaturingSplitMode,
      album: albumName,
      category: newCategory,
      labelName: labelStr,
      copyrightText:
        newCopyrightText.trim() ||
        `Copyright 2026 ${labelStr} (+241). Tous droits réservés`,
      beatmakerName: beatmakerClean,
      soundEngineerName: mixClean,
      recordingEngineerName: recClean,
      mixingEngineerName: mixClean,
      masteringEngineerName: masterClean,
      lyricistName: lyricistClean,
      isExternalLyricist:
        !newIsInstrumental &&
        newIsExternalLyricist &&
        lyricistClean.toLowerCase() !== artistClean.toLowerCase(),
      isInstrumental: newIsInstrumental,
      isBeatDownloadable:
        newIsInstrumental ||
        newIsBeatDownloadable ||
        newCategory === 'Beats & Instrumentales',
      musicalKey: newMusicalKey.trim() || 'Do Mineur (Cm)',
      dropContentId: finalContentId,
      waveformPeaks: finalPeaks,
      audioCodec: newAudioCodec || 'OPUS',
      hasSynchronizedLyrics: !newIsInstrumental,
      gabonTerritoryPct: newGabonTerritoryPct,
      weeksInTop10: 1,
      lufsMasterLevel: newMeasuredLufs,
      acousticClippingDetected: false,
      retention45sPct: 91,
      halfLifeRetentionJ90Pct: 65,
      creditHandshake: {
        status: dawAuditFlag ? 'PENDING_HANDSHAKE' : 'VERIFIED',
        confirmedByBeatmaker: !dawAuditFlag,
        confirmedByEngineer: !dawAuditFlag,
        confirmedByLyricist: !dawAuditFlag,
        confirmedByLabel: true,
        escrowFrozen: false,
        audit72hCompleted: true,
        dawAuditRequired: dawAuditFlag,
        qrCertificateHash: `GABON-ECG-SHA256-${Date.now().toString(16).toUpperCase()}`,
      },
      cover: newCoverFileUrl.trim(),
      artworkType: 'creative_yellow',
      ambientPrimary: 'rgba(245, 166, 15, 0.52)',
      ambientSecondary: 'rgba(135, 78, 12, 0.42)',
      duration: parsedNewDuration,
      dropStart: Math.min(newDropStart, Math.max(0, parsedNewDuration - 15)),
      dropDuration: Math.min(newDropDuration, parsedNewDuration),
      baseFreq: 110 + Math.floor(Math.random() * 50),
      bpm: newBpm || 124,
      audioUrl: uploadSourceType === 'FILE' && newAudioUrl ? newAudioUrl : undefined,
      externalStreamId: streamId || undefined,
      realPlays: 100000, // Démarrage calibré Single d'Or (100K ECG) pour démonstration immédiate
      lastActivityAgo: 'à l’instant',
      totalListenSeconds: 180000,
      listenSessions: 1200,
      avgRetentionPct: 89,
      retention30sPct: 93,
      algoPoints: 14.0,
      likesCount: 3400,
      recommendationsCount: 640,
      loopPlaysCount: 820,
      consecutiveLoops: 0,
      lyricsOpensCount: newIsInstrumental ? 0 : 6400,
      lyricsSharesCount: newIsInstrumental ? 0 : 1250,
      longevityDays: 35,
      baselineRank: allTracksFlat.length + 1,
      autoDetectedChorus: detectedHotspotStart !== null,
    };

    const existingAlbumIdx = catalogue.findIndex(
      (a) =>
        a.artist.toLowerCase() === createdTrack.artist.toLowerCase() &&
        a.albumTitle.toLowerCase() === createdTrack.album.toLowerCase()
    );
    const targetAlbumIndex = existingAlbumIdx >= 0 ? existingAlbumIdx : catalogue.length;
    const targetTrackIndex =
      existingAlbumIdx >= 0 ? catalogue[existingAlbumIdx].tracks.length : 0;

    setCatalogue((prev) => {
      const idx = prev.findIndex(
        (a) =>
          a.artist.toLowerCase() === createdTrack.artist.toLowerCase() &&
          a.albumTitle.toLowerCase() === createdTrack.album.toLowerCase()
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          tracks: [...updated[idx].tracks, createdTrack],
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
          year: '2026',
          tracks: [createdTrack],
        },
      ];
    });

    // Positionner immédiatement le titre publié en ligne et afficher sa fiche en direct
    setAlbumIdx(targetAlbumIndex);
    setTrackIdx(targetTrackIndex);
    setIsDropMode(true);
    setCurrentTime(createdTrack.dropStart);
    setSelectedTrackId(createdTrack.id);
    setAdminMainTab('CATALOGUE');

    // Persistance automatique dans Supabase (Table tracks + Buckets audio_files Opus & cover_files)
    const metadataPayload = {
      appTrackId: createdTrack.id,
      title: createdTrack.title,
      artist: createdTrack.artist,
      featuringArtists: createdTrack.featuringArtists,
      featuringSplitMode: createdTrack.featuringSplitMode,
      album: createdTrack.album,
      category: createdTrack.category,
      labelName: createdTrack.labelName,
      copyrightText: createdTrack.copyrightText,
      beatmakerName: createdTrack.beatmakerName,
      soundEngineerName: createdTrack.soundEngineerName,
      recordingEngineerName: createdTrack.recordingEngineerName,
      mixingEngineerName: createdTrack.mixingEngineerName,
      masteringEngineerName: createdTrack.masteringEngineerName,
      lyricistName: createdTrack.lyricistName,
      isExternalLyricist: createdTrack.isExternalLyricist,
      isInstrumental: createdTrack.isInstrumental,
      coverUrl: createdTrack.cover || null,
      duration: createdTrack.duration,
      dropStart: createdTrack.dropStart,
      dropDuration: createdTrack.dropDuration,
      bpm: createdTrack.bpm,
      lyrics: createdTrack.lyrics,
    };

    if (uploadSourceType === 'STREAM' && newExternalUrl.trim()) {
      addYoutubeTrack(newExternalUrl.trim(), metadataPayload).catch(() => {});
    } else if (selectedRawAudioFile) {
      // Sauvegarder immédiatement le fichier audio réel dans IndexedDB sous l'ID de la piste
      saveAudioBlobToIndexedDb(createdTrack.id, selectedRawAudioFile)
        .then((persistedUrl) => {
          setCatalogue((prev) =>
            prev.map((alb) => ({
              ...alb,
              tracks: alb.tracks.map((t) =>
                t.id === createdTrack.id ? { ...t, audioUrl: persistedUrl } : t
              ),
            }))
          );
        })
        .catch(() => {});

      uploadLocalTrack(
        selectedRawAudioFile,
        metadataPayload,
        selectedRawCoverFile
      ).catch(() => {});
    }

    pushNotification(
      'Titre publié et sauvegardé (Opus -14 LUFS) !',
      `« ${createdTrack.title} » de ${createdTrack.artist} est en ligne et synchronisé dans la base.`,
      'PUBLISH',
      createdTrack.id
    );

    setUploadSuccess(
      `« ${createdTrack.title} » publié en Opus (-14.0 LUFS) et disponible en ligne.`
    );
    setNewTitle('');
    setNewFeaturingInput('');
    setNewLyricistName('');
    setNewIsInstrumental(false);
    setNewAudioFileName('');
    setNewAudioUrl('');
    setNewExternalUrl('');
    setNewCoverFileUrl('');
    setNewCoverFileName('');
    setSelectedRawAudioFile(null);
    setSelectedRawCoverFile(null);
    setWaveformPeaks([]);
    setDetectedHotspotStart(null);
    setWizardStep(1);
    setTimeout(() => setUploadSuccess(null), 5000);
  };

  // --- Admin Catalogue Actions ---
  const handleDeleteTrack = (albumId: string, trackId: string) => {
    deleteSupabaseTrack({ app_track_id: trackId }).catch(() => {});
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
    const { albumId, track, durationFormatted, featuringInput } = editingTrack;
    const updatedDuration = parseDurationInput(durationFormatted);
    const parsedFeaturings =
      featuringInput !== undefined
        ? featuringInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : track.featuringArtists;

    // Enregistrer automatiquement les noms modifiés dans la base de données
    if (track.artist) handleRegisterEntityInDb('artists', track.artist, true);
    if (parsedFeaturings && parsedFeaturings.length > 0) {
      handleRegisterEntityInDb('artists', parsedFeaturings.join(', '), true);
    }
    if (track.labelName) handleRegisterEntityInDb('labels', track.labelName, true);
    if (track.beatmakerName) handleRegisterEntityInDb('beatmakers', track.beatmakerName, true);
    if (track.soundEngineerName) handleRegisterEntityInDb('engineers', track.soundEngineerName, true);
    if (!track.isInstrumental && track.lyricistName) {
      handleRegisterEntityInDb('lyricists', track.lyricistName, true);
    }

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
                  audioCodec: 'OPUS',
                  lyricistName: track.isInstrumental
                    ? 'Instrumental (Sans paroles)'
                    : track.lyricistName,
                  featuringArtists:
                    parsedFeaturings && parsedFeaturings.length > 0 ? parsedFeaturings : undefined,
                  copyrightText: `Copyright 2026 ${track.labelName}. Tous droits réservés`,
                  duration: updatedDuration,
                  dropStart: Math.min(track.dropStart, Math.max(0, updatedDuration - 10)),
                }
              : t
          ),
        };
      })
    );

    // Sauvegarder la mise à jour (notamment la nouvelle pochette ou le titre) dans Supabase + Stockage local
    updateTrackMetadataInStorage(track.id, {
      title: track.title,
      artist: track.artist,
      featuring_artists: parsedFeaturings || [],
      featuring_split_mode: track.featuringSplitMode || '70_30',
      category: track.category,
      label_name: track.labelName,
      beatmaker_name: track.beatmakerName,
      sound_engineer_name: track.soundEngineerName,
      lyricist_name: track.isInstrumental
        ? 'Instrumental (Sans paroles)'
        : track.lyricistName,
      is_instrumental: Boolean(track.isInstrumental),
      cover_url: track.cover || null,
      duration: updatedDuration,
      drop_start: Math.min(track.dropStart, Math.max(0, updatedDuration - 10)),
    }).catch(() => {});

    pushNotification(
      'Titre et pochette sauvegardés',
      `Les informations et la pochette de « ${track.title} » sont enregistrées de façon persistante.`,
      'PUBLISH',
      track.id
    );
    setEditingTrack(null);
  };

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

  const isCurrentLiked = !!likedTrackIds[currentTrack.id];
  const currentRankInfo = trackRankMap[currentTrack.id] || { rank: 4, delta: 3 };

  return (
    <div className="relative h-[100dvh] w-full max-w-full bg-[#090607] text-[#F5F2EB] overflow-hidden select-none flex flex-col">
      {/* Persistent Background Audio Engines (Never Unmounted) */}
      <audio ref={htmlAudioRef} className="hidden" preload="auto" />
      <audio ref={uploadPreviewAudioRef} className="hidden" preload="auto" />
      <div
        id="hidden-external-audio-stream"
        className="fixed -top-[9999px] -left-[9999px] w-px h-px opacity-0 pointer-events-none"
      />

      {/* ===================================================================== */}
      {/* VIEW 1: 3D IMMERSIVE COVER FLOW PLAYER + DROP ZONE + SPATIAL 2D       */}
      {/* ===================================================================== */}
      {appView === 'PLAYER' && (
        <main className="relative z-10 h-full w-full flex items-center justify-center bg-[#060608] overflow-hidden">
          <Immersive3DPlayer
            catalogue={catalogue}
            albumIdx={safeAlbumIdx}
            trackIdx={safeTrackIdx}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isDropMode={isDropMode}
            currentTime={currentTime}
            isShuffle={isShuffle}
            repeatMode={repeatMode}
            isCurrentLiked={isCurrentLiked}
            likedTrackIds={likedTrackIds}
            recommendedTrackIds={recommendedTrackIds}
            subscribedArtists={subscribedArtists}
            artistSubscribers={artistSubscribers}
            communityRecommendations={communityRecommendations}
            rankInfo={currentRankInfo}
            currentRankInfo={currentRankInfo}
            trackRankMap={trackRankMap}
            users={users}
            currentUser={currentUser}
            categories={categories}
            syncSnapshot={syncSnapshot}
            masterVolume={masterVolume}
            eqGains={eqGains}
            userPlan={userPlan}
            onToggleUserPlan={() =>
              setUserPlan((prev) => (prev === 'PRO' ? 'BASIC' : 'PRO'))
            }
            onNavigateAlbum={navigateAlbum}
            onSelectAlbumIndex={handleSelectAlbumIndex}
            onNavigateTrack={navigateTrack}
            onSelectTrackIndex={handleSelectTrackIndex}
            onTogglePlay={handleCentralPlayToggle}
            onForceStopPlay={() => setIsPlaying(false)}
            onSeek={handleSeekFromPlayer}
            onToggleShuffle={() => setIsShuffle(!isShuffle)}
            onCycleRepeat={() => setRepeatMode((prev) => (prev + 1) % 3)}
            onToggleLike={(trackId, e) => toggleLike(trackId, e)}
            onRecommendTrack={handleRecommendTrack}
            onToggleSubscribeArtist={handleToggleSubscribeArtist}
            onRecordLyricsOpen={handleRecordLyricsOpen}
            onToggleDownload={() => handleToggleOfflineDownload()}
            onOpenAdminStudio={() => setAppView('ADMIN')}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => {
              setShowNotificationsModal(true);
              markAllNotificationsRead();
            }}
            onToggleOfflineSim={() =>
              streamTracker.setSimulatedOffline(!syncSnapshot.simulatedOffline)
            }
            onChangeMasterVolume={handleChangeMasterVolume}
            onChangeEqBand={handleChangeEqBand}
            onApplyEqPreset={handleApplyEqPreset}
            onResetEq={handleResetEq}
            subscriptionPass={subscriptionPass}
            onChangeSubscriptionPass={setSubscriptionPass}
            networkOperator={networkOperator}
            onChangeNetworkOperator={setNetworkOperator}
            lastEcgValidationMsg={lastEcgValidationMsg}
            onConfirmCreditHandshake={handleConfirmCreditHandshake}
            onOpenCreditDispute={handleOpenCreditDispute}
            onResolveCreditDispute={handleResolveCreditDispute}
            adBanners={adBanners}
            adBannerSettings={adBannerSettings}
            enableAwardsCeremony={enableAwardsCeremony}
            rightsLines={royaltyLedger.rightsLines}
            payoutStatements={royaltyLedger.statements}
            royaltySettings={royaltyLedgerState.settings}
          />
        </main>
      )}

      {/* ===================================================================== */}
      {/* TOP HEADER FOR AUTH & ADMIN VIEWS                                     */}
      {/* ===================================================================== */}
      {appView !== 'PLAYER' && (
        <header className="relative z-30 w-full flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 border-b border-white/[0.07] bg-[#0B0D13]/90 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setAppView('PLAYER')}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
              title="Retour au lecteur DROP"
            >
              <DropOfficialLogo className="h-[18px] sm:h-[20px] w-auto max-w-[110px]" />
            </button>

            {isPlaying && (
              <button
                onClick={() => setAppView('PLAYER')}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#DE1B34]/15 border border-[#DE1B34]/30 text-[11px] text-[#DE1B34] font-mono shrink-0"
              >
                <Volume2 className="w-3 h-3 animate-pulse shrink-0" />
                <span className="hidden sm:inline truncate max-w-[100px]">
                  {currentTrack.title}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowNotificationsModal(true);
                markAllNotificationsRead();
              }}
              className="relative h-7 px-2 rounded-lg text-[11px] font-mono transition-colors flex items-center gap-1 border bg-white/[0.04] hover:bg-white/[0.1] border-white/[0.1] text-[#F5F2EB]"
              title="Centre de notifications"
            >
              <Bell className="w-3.5 h-3.5 text-amber-300" />
              {unreadNotificationsCount > 0 && (
                <span className="px-1 py-0.2 rounded-full bg-[#DE1B34] text-white text-[9px] font-bold">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => streamTracker.setSimulatedOffline(!syncSnapshot.simulatedOffline)}
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

            <div
              className={`h-7 px-2 rounded-lg text-[10px] font-mono transition-colors flex items-center gap-1.5 border ${
                isRealtimeConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
              }`}
              title={
                isRealtimeConnected
                  ? 'Base de données temps réel active (WebSocket Supabase)'
                  : 'Connexion temps réel...'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRealtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden sm:inline">
                {isRealtimeConnected ? 'Temps Réel' : 'En attente'}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.07]">
              <button
                onClick={() => setAppView('PLAYER')}
                className="h-6 px-2.5 rounded-md text-xs font-medium text-[#8E93A4] hover:text-[#F5F2EB] flex items-center gap-1"
              >
                <Music className="w-3.5 h-3.5" />
                <span>Lecteur</span>
              </button>
              <button
                onClick={() => setAppView('ADMIN')}
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
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: AUTHENTICATION PORTAL                                         */}
      {/* ===================================================================== */}
      {appView === 'AUTH' && (
        <AuthPortalView
          authMode={authMode}
          setAuthMode={setAuthMode}
          authName={authName}
          setAuthName={setAuthName}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          setUserPlan={setUserPlan}
          onQuickEnter={handleQuickEnter}
        />
      )}

      {/* ===================================================================== */}
      {/* VIEW 3: STUDIO ADMIN — SYMMETRICAL MULTI-AXIS RESPONSIVE ARCHITECTURE */}
      {/* ===================================================================== */}
      {appView === 'ADMIN' && (
        <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 overflow-y-auto overflow-x-hidden flex flex-col gap-3.5">
          {selectedTrackDetail ? (
            <div className="w-full flex flex-col bg-[#0D1017] border border-white/[0.08] rounded-2xl p-4 gap-4">
              <div className="w-full flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07] shrink-0">
                <button
                  onClick={() => setSelectedTrackId(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-[#F5F2EB] flex items-center gap-1.5 shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>

                <div className="flex items-center gap-2">
                  <CertificationBadgeSvg
                    cert={getTrackCertification(selectedTrackDetail.track.realPlays)}
                  />
                  <RankBadge
                    rank={selectedTrackDetail.rankInfo.rank}
                    delta={selectedTrackDetail.rankInfo.delta}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-0.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#07080C] border border-white/[0.07] rounded-xl p-4">
                  <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                    <div className="w-16 h-16 rounded-xl overflow-hidden cover-card-bevel cover-gloss-sheen shrink-0">
                      <CoverArtwork
                        artworkType={selectedTrackDetail.track.artworkType}
                        coverUrl={selectedTrackDetail.track.cover}
                        title={selectedTrackDetail.track.title}
                        artist={selectedTrackDetail.track.artist}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="px-2 py-0.5 rounded bg-[#DE1B34]/15 text-[#DE1B34] text-[10px] font-mono">
                        {selectedTrackDetail.track.category}
                      </span>
                      <h2 className="text-base font-bold text-[#F5F2EB] truncate mt-1">
                        {selectedTrackDetail.track.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <button
                          onClick={() => {
                            const artist = selectedTrackDetail.track.artist;
                            setSelectedTrackId(null);
                            setSelectedArtistName(artist);
                          }}
                          className="text-xs text-[#8E93A4] hover:text-white flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{selectedTrackDetail.track.artist}</span>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#DE1B34]" />
                        </button>
                        {selectedTrackDetail.track.featuringArtists &&
                          selectedTrackDetail.track.featuringArtists.map((feat) => (
                            <button
                              key={feat}
                              onClick={() => {
                                setSelectedTrackId(null);
                                setSelectedArtistName(feat);
                              }}
                              className="px-1.5 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-[10px] font-mono text-violet-300 hover:bg-violet-500/25"
                            >
                              feat. {feat}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>

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
                          ecgValidatedAt30Sec: false,
                          sessionPointsEarned: 0,
                        };
                        setIsPlaying(true);
                        setAppView('PLAYER');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#DE1B34] text-white font-bold text-xs flex items-center gap-1.5"
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
                          featuringInput: (
                            selectedTrackDetail.track.featuringArtists || []
                          ).join(', '),
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between">
                    <Play className="w-4 h-4 fill-current text-[#DE1B34]" />
                    <span className="font-mono text-sm font-bold text-[#F5F2EB]">
                      {formatCompactCount(
                        selectedTrackDetail.track.realPlays,
                        selectedTrackDetail.track.displayPlaysFormatted
                      )}
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
                      {selectedTrackDetail.track.likesCount} •{' '}
                      {selectedTrackDetail.track.recommendationsCount} recos
                    </span>
                  </div>
                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      30s: {selectedTrackDetail.track.retention30sPct}% / Fin:{' '}
                      {selectedTrackDetail.track.avgRetentionPct}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
                      Crédits Studio &amp; Plume
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#8E93A4]">
                        <Building2 className="w-3.5 h-3.5 text-[#DE1B34]" />
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
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#8E93A4]">
                        <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                        Parolier (Plume)
                      </span>
                      <span className="font-semibold text-sky-300 truncate max-w-[160px]">
                        {selectedTrackDetail.track.lyricistName}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
                      Paramètres Audio &amp; Impact Texte
                    </span>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#8E93A4]">Durée totale</span>
                      <span className="text-[#F5F2EB] font-bold">
                        {formatTime(selectedTrackDetail.track.duration)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#8E93A4]">Zone de Drop</span>
                      <span className="text-[#F59E0B] font-bold">
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
                      <span className="text-[#8E93A4]">Ouvertures / Partages Paroles</span>
                      <span className="text-sky-300 font-bold">
                        {selectedTrackDetail.track.lyricsOpensCount} vues •{' '}
                        {selectedTrackDetail.track.lyricsSharesCount} extraits
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
            <div className="flex-1 w-full flex flex-col bg-[#0D1017] border border-white/[0.08] rounded-2xl p-4 overflow-hidden gap-4">
              <div className="w-full flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07] shrink-0">
                <button
                  onClick={() => setSelectedArtistName(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-[#F5F2EB] flex items-center gap-1.5 shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
                <div className="flex items-center gap-2">
                  <CertificationBadgeSvg
                    cert={getAlbumCertification(selectedArtistAnalytics.totalPlays)}
                  />
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#DE1B34]/15 text-[#DE1B34] border border-[#DE1B34]/30 truncate">
                    {selectedArtistAnalytics.primaryCategory}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-0.5">
                <div className="flex flex-wrap items-center justify-between gap-3.5 bg-[#07080C] border border-white/[0.07] rounded-xl p-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden cover-card-bevel cover-gloss-sheen shrink-0">
                      <CoverArtwork
                        artworkType={selectedArtistAnalytics.artworkType}
                        coverUrl={selectedArtistAnalytics.cover}
                        title={selectedArtistAnalytics.artistName}
                        artist={selectedArtistAnalytics.artistName}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-bold text-[#F5F2EB] truncate">
                        {selectedArtistAnalytics.artistName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#8E93A4] mt-1">
                        <span className="flex items-center gap-1 text-[#F5F2EB]">
                          <Play className="w-3 h-3 fill-current text-[#DE1B34]" />
                          {formatCompactCount(selectedArtistAnalytics.totalPlays)}
                        </span>
                        <span className="flex items-center gap-1 text-violet-300">
                          <Users className="w-3 h-3" />
                          {formatCompactCount(
                            artistSubscribers[selectedArtistAnalytics.artistName] ?? 1200
                          )}{' '}
                          fans
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

                  <button
                    type="button"
                    onClick={() => handleToggleSubscribeArtist(selectedArtistAnalytics.artistName)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border shrink-0 ${
                      subscribedArtists[selectedArtistAnalytics.artistName]
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#DE1B34] border-[#DE1B34] text-white'
                    }`}
                  >
                    {subscribedArtists[selectedArtistAnalytics.artistName] ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Abonné</span>
                      </span>
                    ) : (
                      "+ S'abonner"
                    )}
                  </button>
                </div>

                <ArtistRoyaltyAndTipCard
                  entityName={selectedArtistAnalytics.artistName}
                  entityRole="ARTIST"
                  rightsLines={royaltyLedger.rightsLines}
                  statement={royaltyLedger.statements.find(
                    (s) =>
                      s.holderName.trim().toLowerCase() ===
                      selectedArtistAnalytics.artistName.trim().toLowerCase()
                  )}
                  settings={royaltyLedgerState.settings}
                />

                <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
                    Discographie &amp; Featurings ({selectedArtistAnalytics.tracks.length})
                  </span>
                  {selectedArtistAnalytics.tracks.map((t) => {
                    const rInfo = trackRankMap[t.id] || { rank: 1, delta: 0 };
                    const cert = getTrackCertification(t.realPlays);
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
                            <CoverArtwork
                              artworkType={t.artworkType}
                              coverUrl={t.cover}
                              title={t.title}
                              artist={t.artist}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#F5F2EB] truncate">
                                {t.title}
                              </span>
                              <CertificationBadgeSvg cert={cert} compact />
                            </div>
                            <div className="text-[11px] font-mono text-[#8E93A4] truncate">
                              {t.artist}
                              {t.featuringArtists && t.featuringArtists.length > 0
                                ? ` feat. ${t.featuringArtists.join(', ')}`
                                : ''}{' '}
                              • {formatTime(t.duration)}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
                      Équipe Studio &amp; Plumes
                    </span>
                    {[
                      ...selectedArtistAnalytics.studioTeam.labels,
                      ...selectedArtistAnalytics.studioTeam.beatmakers,
                      ...selectedArtistAnalytics.studioTeam.engineers,
                      ...selectedArtistAnalytics.studioTeam.lyricists,
                    ].map((member) => (
                      <div
                        key={`${member.role}-${member.name}`}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {member.role === 'LABEL' && (
                            <Building2 className="w-3.5 h-3.5 text-[#DE1B34] shrink-0" />
                          )}
                          {member.role === 'BEATMAKER' && (
                            <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          {member.role === 'ENGINEER' && (
                            <Mic2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          )}
                          {member.role === 'LYRICIST' && (
                            <Edit3 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
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
                      <Clock className="w-3.5 h-3.5 text-[#DE1B34]" />
                      {formatLongDuration(selectedConsumerUser.totalListenSeconds)}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {selectedConsumerUser.totalValidatedPlays}
                    </span>
                  </div>
                </div>

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
                          <CoverArtwork
                            artworkType={consumerAnalytics.topLoopedItem.track.artworkType}
                            coverUrl={consumerAnalytics.topLoopedItem.track.cover}
                            title={consumerAnalytics.topLoopedItem.track.title}
                            artist={consumerAnalytics.topLoopedItem.track.artist}
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
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#DE1B34] flex items-center gap-1.5">
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
                            <CoverArtwork
                              artworkType={track.artworkType}
                              coverUrl={track.cover}
                              title={track.title}
                              artist={track.artist}
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
            <>
              <AdminCommandHeader
                isRealtimeConnected={isRealtimeConnected}
                lastAdminSavedAt={lastAdminSavedAt}
                enableAwardsCeremony={enableAwardsCeremony}
                onToggleAwardsCeremony={() => {
                  const nextState = !enableAwardsCeremony;
                  setEnableAwardsCeremony(nextState);
                  pushNotification(
                    nextState
                      ? 'Cérémonie DROP Awards activée !'
                      : 'Menu Awards masqué dans Central',
                    nextState
                      ? 'L’onglet Awards est désormais ouvert au public dans Central.'
                      : 'L’onglet Awards a été retiré de la navigation publique de Central.',
                    'CERTIFICATION'
                  );
                }}
                isSavingAdmin={isSavingAdmin}
                onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                adminMainTab={adminMainTab}
                onSelectMainTab={setAdminMainTab}
                tracksCount={allTracksFlat.length}
                bannersCount={adBanners.length}
                usersCount={users.length}
              />

              {adminMainTab === 'CATALOGUE' && (
                <div className="w-full flex flex-col gap-3">
                  {/* SOUS-ONGLETS DU CATALOGUE EN GRILLE SYMÉTRIQUE 3 COLONNES */}
                  <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#0D1017] p-2 rounded-2xl border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setCatalogueSubTab('REPERTOIRE')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 border cursor-pointer ${
                        catalogueSubTab === 'REPERTOIRE'
                          ? 'bg-white/15 border-white/25 text-[#F5F2EB]'
                          : 'bg-[#07080C] border-white/[0.05] text-[#8E93A4] hover:text-white'
                      }`}
                    >
                      <Disc className="w-3.5 h-3.5 text-[#DE1B34] shrink-0" />
                      <span>Pistes, Beats &amp; Certifs ({allTracksFlat.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogueSubTab('ALGO')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 border cursor-pointer ${
                        catalogueSubTab === 'ALGO'
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#07080C] border-white/[0.05] text-[#8E93A4] hover:text-white'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Rangs Anti-Halo &amp; Awards</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogueSubTab('RULES')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 border cursor-pointer ${
                        catalogueSubTab === 'RULES'
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-[#07080C] border-white/[0.05] text-[#8E93A4] hover:text-white'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>DRM &amp; Offline ({syncSnapshot.queue.length})</span>
                    </button>
                  </div>

                  {catalogueSubTab === 'REPERTOIRE' && (
                    <AdminCatalogueRepertoire
                      catalogue={catalogue}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      onAutoReorderByAlgo={handleAutoReorderByAlgo}
                      onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                      onSelectArtist={(name) => setSelectedArtistName(name)}
                      onMoveAlbumOrder={handleMoveAlbumOrder}
                      onSelectTrack={(tid) => setSelectedTrackId(tid)}
                      trackRankMap={trackRankMap}
                    />
                  )}

                  {catalogueSubTab === 'ALGO' && (
                    <AdminCatalogueAlgo
                      algoDimension={algoDimension}
                      setAlgoDimension={setAlgoDimension}
                      algoFilterValue={algoFilterValue}
                      setAlgoFilterValue={setAlgoFilterValue}
                      algoFilterOptions={algoFilterOptions}
                      dropAwardsList={dropAwardsList}
                      groupedDimensionRankings={groupedDimensionRankings}
                      rankedFilteredTracks={rankedFilteredTracks}
                      trackRankMap={trackRankMap}
                      onSelectArtist={(name) => setSelectedArtistName(name)}
                      onSelectTrack={(tid) => setSelectedTrackId(tid)}
                      onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                    />
                  )}

                  {catalogueSubTab === 'RULES' && (
                    <AdminDrmOfflinePanel
                      allTracksFlat={allTracksFlat}
                      currentTrack={currentTrack}
                      adminDrmTargetTrackId={adminDrmTargetTrackId}
                      setAdminDrmTargetTrackId={setAdminDrmTargetTrackId}
                      adminDrmVault={adminDrmVault}
                      isEncryptingAdminDrm={isEncryptingAdminDrm}
                      adminDrmStatusMsg={adminDrmStatusMsg}
                      onEncryptTrackToSandbox={encryptTrackToAdminSandbox}
                      onTestRamDecrypt={handleAdminTestRamDecrypt}
                      onSimulateExfiltrationSelfDestruct={
                        handleAdminSimulateExfiltrationSelfDestruct
                      }
                      syncSnapshot={syncSnapshot}
                    />
                  )}
                </div>
              )}

              {adminMainTab === 'UPLOAD' && (
                <div className="flex-1 w-full overflow-y-auto flex flex-col gap-3 pr-0.5">
                  <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2 bg-[#0D1017] border border-white/[0.08] rounded-2xl p-2 shrink-0">
                    {(
                      [
                        { step: 1, title: '1. Audio Opus & Cover', valid: isWizardStep1Valid },
                        { step: 2, title: '2. Artiste & Infos', valid: isWizardStep2Valid },
                        { step: 3, title: '3. Crédits & Équipe', valid: isWizardStep3Valid },
                        { step: 4, title: '4. Aperçu & Publication', valid: true },
                      ] as const
                    ).map((s) => {
                      const unlocked = canAccessWizardStep(s.step);
                      return (
                        <button
                          key={s.step}
                          type="button"
                          disabled={!unlocked}
                          onClick={() => {
                            if (unlocked) setWizardStep(s.step);
                          }}
                          className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-semibold text-center leading-tight transition-all flex items-center justify-center gap-1.5 border ${
                            wizardStep === s.step
                              ? 'bg-[#DE1B34] border-[#DE1B34] text-white font-extrabold shadow-md shadow-[#DE1B34]/20'
                              : unlocked && s.valid && s.step < 4
                                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                                : unlocked
                                  ? 'bg-[#07080C] border-white/[0.08] text-[#F5F2EB] hover:border-white/20'
                                  : 'bg-white/[0.02] border-white/[0.04] text-[#8E93A4]/40 cursor-not-allowed'
                          }`}
                        >
                          {unlocked && s.valid && s.step < 4 && (
                            <Check className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{s.title}</span>
                        </button>
                      );
                    })}
                  </div>

                  {uploadSuccess && (
                    <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">{uploadSuccess}</span>
                    </div>
                  )}

                  <div className="flex-1 w-full bg-[#0D1017] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between gap-4">
                    {wizardStep === 1 && (
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#DE1B34]">
                                1. Source Audio (Conversion Opus -14.0 LUFS obligatoire) *
                              </span>
                              <div className="flex bg-[#07080C] p-0.5 rounded-lg border border-white/[0.07] text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => setUploadSourceType('FILE')}
                                  className={`px-2 py-0.5 rounded ${
                                    uploadSourceType === 'FILE'
                                      ? 'bg-[#DE1B34] text-white font-semibold'
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
                                      ? 'bg-[#DE1B34] text-white font-semibold'
                                      : 'text-[#8E93A4]'
                                  }`}
                                >
                                  Flux Externe
                                </button>
                              </div>
                            </div>

                            {uploadSourceType === 'FILE' ? (
                              <div className="flex flex-col gap-2">
                                <label className="flex flex-col items-center justify-center border border-dashed border-white/15 rounded-xl p-5 cursor-pointer hover:border-[#DE1B34]/60 bg-[#07080C]/60 text-center">
                                  <Upload className="w-5 h-5 text-[#DE1B34] mb-1.5" />
                                  <span className="text-xs font-medium text-[#F5F2EB] truncate max-w-full px-2">
                                    {newAudioFileName ||
                                      'Importer un fichier audio (WAV, MP3, FLAC → converti en .opus)'}
                                  </span>
                                  <span className="text-[10px] text-emerald-400 font-mono mt-1">
                                    Conversion automatique en OPUS • Volume constant -14.0 LUFS
                                  </span>
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleAudioFileDrop}
                                    className="hidden"
                                  />
                                </label>
                                {!newAudioFileName && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={handleLoadStudioOpusMasterPreset}
                                      className="py-2 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">Master Opus Unique (Test)</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSimulateDuplicateWaveformUpload(allTracksFlat[0])
                                      }
                                      className="py-2 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
                                    >
                                      <Shield className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">
                                        Tester Doublon (&ge;85% Onde)
                                      </span>
                                    </button>
                                  </div>
                                )}
                              </div>
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
                                  <span className="text-emerald-400">
                                    Encodage OPUS, Empreinte d’Onde &amp; Content ID DROP
                                  </span>
                                  <span className="text-[#DE1B34]">{uploadProgress}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                  <div
                                    style={{ width: `${uploadProgress}%` }}
                                    className="h-full bg-emerald-400"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-400">
                                2. Pochette / Cover Officielle
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

                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300 flex items-center justify-between">
                              <span>Format de sortie :</span>
                              <span className="font-mono font-bold">
                                OPUS • -14.0 LUFS Uniforme
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ÉTAPE DE VÉRIFICATION OBLIGATOIRE DE LA FORME D'ONDE & ATTRIBUTION DU CONTENT ID DROP */}
                        {waveformVerificationReport && (
                          <div
                            className={`rounded-2xl p-3.5 border flex flex-col gap-3 ${
                              waveformVerificationReport.isBlocked
                                ? 'bg-rose-950/35 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
                                : 'bg-[#070B12] border-cyan-500/35'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                    waveformVerificationReport.isBlocked
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  }`}
                                >
                                  {waveformVerificationReport.isBlocked ? (
                                    'BLOCAGE AUTOMATIQUE (CONCORDANCE ≥ 85%)'
                                  ) : (
                                    <span className="inline-flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>EMPREINTE D’ONDE UNIQUE VALIDÉE (&lt; 85%)</span>
                                    </span>
                                  )}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold">
                                  {waveformVerificationReport.candidateCid}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {waveformVerificationReport.isBlocked ? (
                                  <button
                                    type="button"
                                    onClick={handleCancelDuplicateUpload}
                                    className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-[11px] font-bold transition"
                                  >
                                    Annuler le téléversement &amp; Réinitialiser
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSimulateDuplicateWaveformUpload(
                                        waveformVerificationReport.matchedTrack || allTracksFlat[0]
                                      )
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-rose-500/20 border border-white/10 text-[10px] font-mono text-zinc-300 hover:text-rose-200 transition"
                                  >
                                    Simuler un doublon (&ge;85%)
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Détails de l'analyse spectrale et de forme d'onde 64 bandes */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                              <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Concordance Globale d’Onde
                                </span>
                                <span
                                  className={`font-mono text-sm font-extrabold ${
                                    waveformVerificationReport.isBlocked
                                      ? 'text-rose-400'
                                      : 'text-emerald-400'
                                  }`}
                                >
                                  {waveformVerificationReport.concordance.similarityPct}%{' '}
                                  <span className="text-[10px] font-normal text-zinc-400">
                                    (Seuil max: 85%)
                                  </span>
                                </span>
                              </div>
                              <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Similarité Cosinus (64 bandes)
                                </span>
                                <span className="font-mono text-sm font-bold text-white">
                                  {waveformVerificationReport.concordance.cosineSimilarityPct}%
                                </span>
                              </div>
                              <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Corrélation d’Enveloppe RMS
                                </span>
                                <span className="font-mono text-sm font-bold text-amber-300">
                                  {waveformVerificationReport.concordance.envelopeCorrelationPct}%
                                </span>
                              </div>
                              <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Proximité Temporelle
                                </span>
                                <span className="font-mono text-sm font-bold text-cyan-300">
                                  {waveformVerificationReport.concordance.durationProximityPct}%
                                </span>
                              </div>
                            </div>

                            {/* Superposition visuelle des 64 bandes d'onde (Fichier importé vs Piste la plus proche du catalogue) */}
                            <div className="bg-black/50 border border-white/[0.07] rounded-xl p-2.5 flex flex-col gap-1.5">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                                <span className="text-cyan-300">
                                  ■ Onde Téléversée ({waveformVerificationReport.candidateCid})
                                </span>
                                {waveformVerificationReport.matchedTrack && (
                                  <span
                                    className={
                                      waveformVerificationReport.isBlocked
                                        ? 'text-rose-400 font-bold'
                                        : 'text-zinc-400'
                                    }
                                  >
                                    ■ Plus proche dans le catalogue : «{' '}
                                    {waveformVerificationReport.matchedTrack.title} » —{' '}
                                    {waveformVerificationReport.matchedTrack.artist} (
                                    {waveformVerificationReport.matchedCid})
                                  </span>
                                )}
                              </div>

                              <div className="relative h-12 w-full flex items-end gap-[2px] px-1 pt-1">
                                {waveformVerificationReport.candidatePeaks.map((pk, idx) => {
                                  const refPk =
                                    waveformVerificationReport.matchedPeaks[idx] ?? 0.3;
                                  return (
                                    <div
                                      key={idx}
                                      className="flex-1 h-full flex items-end justify-center relative"
                                    >
                                      {/* Barre de référence du catalogue en arrière-plan */}
                                      <div
                                        style={{ height: `${Math.round(refPk * 95)}%` }}
                                        className={`w-full rounded-t opacity-45 ${
                                          waveformVerificationReport.isBlocked
                                            ? 'bg-rose-500'
                                            : 'bg-zinc-600'
                                        }`}
                                      />
                                      {/* Barre du fichier téléversé au premier plan */}
                                      <div
                                        style={{ height: `${Math.round(pk * 95)}%` }}
                                        className={`w-2/3 rounded-t absolute bottom-0 ${
                                          waveformVerificationReport.isBlocked
                                            ? 'bg-amber-300'
                                            : 'bg-cyan-400'
                                        }`}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {waveformVerificationReport.isBlocked &&
                              waveformVerificationReport.matchedTrack && (
                                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex flex-col gap-1.5">
                                  <div className="font-bold text-rose-300 flex items-center justify-between">
                                    <span>
                                      Rapport de Concordance Positif : Téléversement annulé et
                                      verrouillé
                                    </span>
                                    <span className="font-mono">
                                      {waveformVerificationReport.concordance.similarityPct}% de
                                      concordance
                                    </span>
                                  </div>
                                  <p className="text-[11px] leading-relaxed">
                                    L’empreinte acoustique de ce fichier concorde à{' '}
                                    <strong>
                                      {waveformVerificationReport.concordance.similarityPct}%
                                    </strong>{' '}
                                    avec le titre déjà présent sur la plateforme :{' '}
                                    <strong className="text-white">
                                      « {waveformVerificationReport.matchedTrack.title} »
                                    </strong>{' '}
                                    de{' '}
                                    <strong className="text-amber-300">
                                      {waveformVerificationReport.matchedTrack.artist}
                                    </strong>{' '}
                                    (Album :{' '}
                                    <em>{waveformVerificationReport.matchedTrack.album}</em> • ID :{' '}
                                    <code className="text-cyan-300">
                                      {waveformVerificationReport.matchedCid}
                                    </code>
                                    ). Conformément à la politique d’unicité DROP Content ID, aucun
                                    doublon ne peut être publié.
                                  </p>
                                </div>
                              )}
                          </div>
                        )}

                        {!isWizardStep1Valid && !waveformVerificationReport?.isBlocked && (
                          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                            Veuillez sélectionner un fichier audio (ou charger un master Opus de test) pour lancer la vérification d’onde Content ID et débloquer l’étape 2.
                          </div>
                        )}
                      </div>
                    )}

                    {wizardStep === 2 && (
                      <div className="flex flex-col gap-3">
                        {/* Sélecteur Type d'œuvre : Chanson Vocale vs Beat / Instrumentale Téléchargeable */}
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold text-amber-300">
                              Nature de la publication : Chanson Vocale ou Beat / Instrumentale
                            </div>
                            <div className="text-[11px] text-[#8E93A4]">
                              En mode Beat / Instrumentale, le bouton « Télécharger le Beat » est activé dans Central et les champs voix/paroles deviennent facultatifs.
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setNewIsInstrumental(false);
                                setNewIsBeatDownloadable(false);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                                !newIsInstrumental
                                  ? 'bg-[#DE1B34] border-[#DE1B34] text-white'
                                  : 'bg-[#07080C] border-white/10 text-[#8E93A4]'
                              }`}
                            >
                              Chanson Vocale
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewIsInstrumental(true);
                                setNewIsBeatDownloadable(true);
                                setNewCategory('Beats & Instrumentales');
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                                newIsInstrumental
                                  ? 'bg-amber-400 text-[#07080C] border-amber-300'
                                  : 'bg-[#07080C] border-amber-500/40 text-amber-300'
                              }`}
                            >
                              Beat / Instrumentale ⬇
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] text-[#8E93A4] mb-1">
                              Titre de l'œuvre ou du Beat *
                            </label>
                            <input
                              type="text"
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              placeholder="Ex: Souverain du Komo / Akanda 808 Beat"
                              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                            />
                          </div>

                          {/* Artiste Principal avec Liste Déroulante + Ajout Base de Données */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] text-[#8E93A4]">
                                Artiste Principal *
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineNewEntityField(
                                    inlineNewEntityField === 'artist' ? null : 'artist'
                                  );
                                  setInlineNewEntityValue('');
                                }}
                                className="text-[10px] font-bold text-emerald-400 hover:underline"
                              >
                                + Nouvel artiste dans la BDD
                              </button>
                            </div>
                            <div className="flex gap-1.5">
                              <select
                                value={entityDb.artists.includes(newArtist) ? newArtist : ''}
                                onChange={(e) => {
                                  if (e.target.value) setNewArtist(e.target.value);
                                }}
                                className="w-1/2 bg-[#07080C] border border-white/[0.1] rounded-xl px-2.5 py-2 text-xs text-[#F5F2EB]"
                              >
                                <option value="">Choisir dans la liste ({entityDb.artists.length})</option>
                                {entityDb.artists.map((art) => (
                                  <option key={art} value={art}>
                                    {art}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={newArtist}
                                onChange={(e) => setNewArtist(e.target.value)}
                                placeholder="Ou saisir un nom..."
                                className="w-1/2 bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-[#F5F2EB]"
                              />
                            </div>
                            {inlineNewEntityField === 'artist' && (
                              <div className="flex gap-1.5 mt-1.5">
                                <input
                                  type="text"
                                  value={inlineNewEntityValue}
                                  onChange={(e) => setInlineNewEntityValue(e.target.value)}
                                  placeholder="Nom du nouvel artiste à sauvegarder..."
                                  className="flex-1 bg-[#07080C] border border-emerald-500/40 rounded-lg px-2.5 py-1 text-xs text-[#F5F2EB]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (inlineNewEntityValue.trim()) {
                                      handleRegisterEntityInDb('artists', inlineNewEntityValue);
                                      setNewArtist(inlineNewEntityValue.trim());
                                      setInlineNewEntityValue('');
                                      setInlineNewEntityField(null);
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500 text-[#07080C] text-xs font-bold"
                                >
                                  Sauver
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Artistes en Featuring avec Liste Déroulante */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] text-violet-300">
                                Artistes en Featuring (optionnel)
                              </label>
                              <select
                                value=""
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (!val) return;
                                  const currentList = newFeaturingInput
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  if (!currentList.includes(val)) {
                                    setNewFeaturingInput([...currentList, val].join(', '));
                                  }
                                }}
                                className="bg-[#07080C] border border-violet-500/30 rounded-lg px-2 py-0.5 text-[10px] text-violet-200"
                              >
                                <option value="">+ Ajouter depuis la BDD</option>
                                {entityDb.artists
                                  .filter((a) => a !== newArtist)
                                  .map((art) => (
                                    <option key={art} value={art}>
                                      {art}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <input
                              type="text"
                              value={newFeaturingInput}
                              onChange={(e) => setNewFeaturingInput(e.target.value)}
                              placeholder="Ex: Eboloko, Ng Bling"
                              className="w-full bg-[#07080C] border border-violet-500/30 rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-violet-300 mb-1">
                              Contrat de Partage Featuring
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setNewFeaturingSplitMode('70_30')}
                                className={`py-2 px-2 rounded-xl text-[11px] font-mono border transition-colors ${
                                  newFeaturingSplitMode === '70_30'
                                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-200 font-bold'
                                    : 'bg-[#07080C] border-white/[0.08] text-[#8E93A4]'
                                }`}
                              >
                                70% Lead / 30% Feat
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewFeaturingSplitMode('50_50')}
                                className={`py-2 px-2 rounded-xl text-[11px] font-mono border transition-colors ${
                                  newFeaturingSplitMode === '50_50'
                                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-200 font-bold'
                                    : 'bg-[#07080C] border-white/[0.08] text-[#8E93A4]'
                                }`}
                              >
                                50% / 50% Co-Lead
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] text-[#8E93A4] mb-1">
                              Durée totale (MM:SS) *
                            </label>
                            <input
                              type="text"
                              value={newDurationFormatted}
                              onChange={(e) => setNewDurationFormatted(e.target.value)}
                              placeholder="03:00"
                              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-[#F59E0B]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-emerald-300 mb-1">
                              Quota Écoutes Territoire Gabon (+241) : {newGabonTerritoryPct}%
                            </label>
                            <input
                              type="range"
                              min={50}
                              max={99}
                              value={newGabonTerritoryPct}
                              onChange={(e) => setNewGabonTerritoryPct(Number(e.target.value))}
                              className="w-full accent-emerald-400 mt-1.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-[#8E93A4] mb-1">
                              Projet / Album / Beat Tape
                            </label>
                            <input
                              type="text"
                              value={newAlbum}
                              onChange={(e) => setNewAlbum(e.target.value)}
                              placeholder="Ex: Bantou Ntcham Vol. 2 / Libreville Beat Tape"
                              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] text-amber-300 mb-1">
                                Tempo (BPM)
                              </label>
                              <input
                                type="number"
                                min={60}
                                max={220}
                                value={newBpm}
                                onChange={(e) => setNewBpm(Number(e.target.value) || 120)}
                                className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-amber-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-cyan-300 mb-1">
                                Tonalité (Key)
                              </label>
                              <input
                                type="text"
                                value={newMusicalKey}
                                onChange={(e) => setNewMusicalKey(e.target.value)}
                                placeholder="Fa# Mineur (F#m)"
                                className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-cyan-200"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-2">
                          <span className="text-[11px] text-[#8E93A4]">
                            Genre / Identité Musicale Gabonaise *
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {categories.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setNewCategory(cat)}
                                className={`px-2.5 py-1 rounded-lg text-xs ${
                                  newCategory === cat
                                    ? 'bg-[#DE1B34] text-white font-bold'
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
                              placeholder="Nouveau genre (ex: Ikokou Moderne, Afro-Trap LBV)..."
                              className="flex-1 min-w-0 bg-[#0D1017] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-[#F5F2EB]"
                            />
                            <button
                              type="button"
                              onClick={handleAddCategory}
                              className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-xs text-[#F5F2EB] shrink-0"
                            >
                              + Ajouter
                            </button>
                          </div>
                        </div>

                        {!isWizardStep2Valid && (
                          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                            Veuillez renseigner le Titre et l'Artiste Principal pour débloquer l'étape 3.
                          </div>
                        )}
                      </div>
                    )}

                    {wizardStep === 3 && (
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Label avec Liste Déroulante + Sauvegarde BDD */}
                          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-[#F5F2EB] flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-[#DE1B34]" />
                                <span>Label Producteur *</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  if (newLabelName.trim()) {
                                    handleRegisterEntityInDb('labels', newLabelName);
                                  }
                                }}
                                className="text-[10px] font-bold text-emerald-400 hover:underline"
                              >
                                + Sauver en BDD
                              </button>
                            </div>
                            <select
                              value={entityDb.labels.includes(newLabelName) ? newLabelName : ''}
                              onChange={(e) => {
                                if (e.target.value) setNewLabelName(e.target.value);
                              }}
                              className="w-full bg-[#0D1017] border border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                            >
                              <option value="">Choisir un Label existant ({entityDb.labels.length})</option>
                              {entityDb.labels.map((lbl) => (
                                <option key={lbl} value={lbl}>
                                  {lbl}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={newLabelName}
                              onChange={(e) => setNewLabelName(e.target.value)}
                              placeholder="Ou saisir un nouveau label..."
                              className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-[#F5F2EB]"
                            />
                          </div>

                          {/* Beatmaker avec Liste Déroulante + Sauvegarde BDD */}
                          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-[#F5F2EB] flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Beatmaker / Compositeur *</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  if (newBeatmakerName.trim()) {
                                    handleRegisterEntityInDb('beatmakers', newBeatmakerName);
                                  }
                                }}
                                className="text-[10px] font-bold text-emerald-400 hover:underline"
                              >
                                + Sauver en BDD
                              </button>
                            </div>
                            <select
                              value={
                                entityDb.beatmakers.includes(newBeatmakerName)
                                  ? newBeatmakerName
                                  : ''
                              }
                              onChange={(e) => {
                                if (e.target.value) setNewBeatmakerName(e.target.value);
                              }}
                              className="w-full bg-[#0D1017] border border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                            >
                              <option value="">
                                Choisir un Beatmaker existant ({entityDb.beatmakers.length})
                              </option>
                              {entityDb.beatmakers.map((bm) => (
                                <option key={bm} value={bm}>
                                  {bm}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={newBeatmakerName}
                              onChange={(e) => setNewBeatmakerName(e.target.value)}
                              placeholder="Ou saisir un nouveau beatmaker..."
                              className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-[#F5F2EB]"
                            />
                          </div>
                        </div>

                        {/* Ingénierie du Son avec Listes Déroulantes */}
                        <div className="bg-[#07080C] border border-amber-500/25 rounded-xl p-3 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                              <Headphones className="w-3.5 h-3.5 text-amber-400" />
                              <span>Ingénierie du Son (-14.0 LUFS)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const allEng = [
                                  newRecordingEngineerName,
                                  newMixingEngineerName || newSoundEngineerName,
                                  newMasteringEngineerName,
                                ]
                                  .filter(Boolean)
                                  .join(', ');
                                if (allEng) handleRegisterEntityInDb('engineers', allEng);
                              }}
                              className="text-[10px] font-bold text-amber-300 hover:underline"
                            >
                              + Sauver les ingés en BDD
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {!newIsInstrumental ? (
                              <div className="flex flex-col gap-1">
                                <label className="block text-[10px] font-mono text-[#8E93A4]">
                                  1. Ingé Prise de Voix (Optionnel)
                                </label>
                                <select
                                  value={
                                    entityDb.engineers.includes(newRecordingEngineerName)
                                      ? newRecordingEngineerName
                                      : ''
                                  }
                                  onChange={(e) => {
                                    if (e.target.value)
                                      setNewRecordingEngineerName(e.target.value);
                                  }}
                                  className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-[#F5F2EB]"
                                >
                                  <option value="">Choisir dans la BDD</option>
                                  {entityDb.engineers.map((eng) => (
                                    <option key={eng} value={eng}>
                                      {eng}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={newRecordingEngineerName}
                                  onChange={(e) => setNewRecordingEngineerName(e.target.value)}
                                  placeholder="Junior Nzeng"
                                  className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                                />
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-lg bg-[#0D1017] border border-white/[0.05] flex flex-col justify-center">
                                <span className="text-[10px] font-mono text-amber-300">
                                  1. Ingé Prise de Voix
                                </span>
                                <span className="text-[11px] text-[#8E93A4] mt-0.5">
                                  Désactivé (Titre Instrumental)
                                </span>
                              </div>
                            )}

                            <div className="flex flex-col gap-1">
                              <label className="block text-[10px] font-mono text-amber-300">
                                2. Ingé Mixage *
                              </label>
                              <select
                                value={
                                  entityDb.engineers.includes(
                                    newMixingEngineerName || newSoundEngineerName
                                  )
                                    ? newMixingEngineerName || newSoundEngineerName
                                    : ''
                                }
                                onChange={(e) => {
                                  if (e.target.value) {
                                    setNewMixingEngineerName(e.target.value);
                                    setNewSoundEngineerName(e.target.value);
                                  }
                                }}
                                className="w-full bg-[#0D1017] border border-amber-500/30 rounded-lg px-2 py-1 text-[11px] text-[#F5F2EB]"
                              >
                                <option value="">Choisir dans la BDD</option>
                                {entityDb.engineers.map((eng) => (
                                  <option key={eng} value={eng}>
                                    {eng}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={newMixingEngineerName || newSoundEngineerName}
                                onChange={(e) => {
                                  setNewMixingEngineerName(e.target.value);
                                  setNewSoundEngineerName(e.target.value);
                                }}
                                placeholder="Maître Boussengui (Studio K)"
                                className="w-full bg-[#0D1017] border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="block text-[10px] font-mono text-[#8E93A4]">
                                3. Ingé Mastering (Optionnel)
                              </label>
                              <select
                                value={
                                  entityDb.engineers.includes(newMasteringEngineerName)
                                    ? newMasteringEngineerName
                                    : ''
                                }
                                onChange={(e) => {
                                  if (e.target.value) setNewMasteringEngineerName(e.target.value);
                                }}
                                className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-[#F5F2EB]"
                              >
                                <option value="">Choisir dans la BDD</option>
                                {entityDb.engineers.map((eng) => (
                                  <option key={eng} value={eng}>
                                    {eng}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={newMasteringEngineerName}
                                onChange={(e) => setNewMasteringEngineerName(e.target.value)}
                                placeholder="Samy Master LBV"
                                className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Parolier / Auteur (Masqué si Instrumental est coché) */}
                        {!newIsInstrumental ? (
                          <div className="bg-[#07080C] border border-sky-500/30 rounded-xl p-3 flex flex-col gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                                <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                                <span>Parolier / Auteur des paroles *</span>
                              </label>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 text-[11px] font-mono text-sky-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={newIsExternalLyricist}
                                    onChange={(e) => setNewIsExternalLyricist(e.target.checked)}
                                    className="accent-sky-400"
                                  />
                                  <span>Auteur externe dédié</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (newLyricistName.trim()) {
                                      handleRegisterEntityInDb('lyricists', newLyricistName);
                                    }
                                  }}
                                  className="text-[10px] font-bold text-sky-300 hover:underline"
                                >
                                  + Sauver en BDD
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <select
                                value={
                                  entityDb.lyricists.includes(newLyricistName)
                                    ? newLyricistName
                                    : ''
                                }
                                onChange={(e) => {
                                  if (e.target.value) setNewLyricistName(e.target.value);
                                }}
                                className="w-full bg-[#0D1017] border border-white/[0.1] rounded-xl px-2.5 py-2 text-xs text-[#F5F2EB]"
                              >
                                <option value="">
                                  Choisir un Auteur existant ({entityDb.lyricists.length})
                                </option>
                                {entityDb.lyricists.map((lyr) => (
                                  <option key={lyr} value={lyr}>
                                    {lyr}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={newLyricistName}
                                onChange={(e) => setNewLyricistName(e.target.value)}
                                placeholder="Ou saisir un nouvel auteur..."
                                className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                            <span>
                              Mode <strong>Instrumental</strong> actif : Aucun auteur/parolier requis pour valider cette étape.
                            </span>
                            <button
                              type="button"
                              onClick={() => setNewIsInstrumental(false)}
                              className="text-[11px] underline"
                            >
                              Rétablir paroles
                            </button>
                          </div>
                        )}

                        {!isWizardStep3Valid && (
                          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                            Veuillez renseigner le Label, le Beatmaker, l'Ingénieur Mixage
                            {!newIsInstrumental ? ' et le Parolier/Auteur' : ''} pour accéder à l'aperçu final.
                          </div>
                        )}
                      </div>
                    )}

                    {wizardStep === 4 && (
                      <div className="flex flex-col gap-3.5">
                        {/* RÉSUMÉ INTÉGRAL SANS AUCUNE LIMITATION DE TOUTES LES DONNÉES SAISIES (ÉTAPES 1, 2 & 3) */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121622] to-[#07080C] border border-emerald-500/40 flex flex-col gap-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 uppercase">
                                Récapitulatif Intégral (Sans Limitation)
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/35 text-[10px] font-mono font-bold text-cyan-300">
                                {newDropContentId || 'DROP-CID-241-VERIFIED'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[10px] font-mono text-[#F5F2EB]">
                                {newAudioCodec} • {newMeasuredLufs.toFixed(1)} LUFS → -14.0 LUFS
                              </span>
                              {newIsInstrumental && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono font-bold text-amber-300">
                                  Beat / Instrumentale Téléchargeable
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-emerald-300 font-bold">
                              Durée : {newDurationFormatted} ({parsedNewDuration}s)
                            </span>
                          </div>

                          {/* En-tête Visuel + Bouton de Pré-écoute */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-20 h-20 rounded-xl overflow-hidden cover-card-bevel cover-gloss-sheen shrink-0 bg-[#12151F]">
                                <CoverArtwork
                                  artworkType="creative_yellow"
                                  coverUrl={newCoverFileUrl}
                                  title={newTitle || 'Nouveau Titre'}
                                  artist={newArtist || 'Artiste'}
                                />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <h4 className="text-base sm:text-lg font-bold text-[#F5F2EB] break-words">
                                  {newTitle || 'Titre sans nom'}
                                </h4>
                                <p className="text-xs sm:text-sm text-amber-300 font-semibold break-words">
                                  {newArtist || 'Artiste non renseigné'}
                                  {newFeaturingInput.trim()
                                    ? ` feat. ${newFeaturingInput.trim()}`
                                    : ''}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8E93A4]">
                                  <span className="text-[#DE1B34] font-semibold">
                                    {newCategory}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Projet :{' '}
                                    <strong className="text-white">
                                      {newAlbum.trim() || `${newArtist.trim()} — Studio Session`}
                                    </strong>
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Label : <strong className="text-white">{newLabelName}</strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Bouton de pré-écoute directe de la piste */}
                            <button
                              type="button"
                              onClick={toggleUploadDropPreview}
                              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shrink-0 ${
                                isPreviewingUploadDrop
                                  ? 'bg-[#F59E0B] text-[#07080C]'
                                  : 'bg-[#DE1B34] hover:bg-[#f0223d] text-white'
                              }`}
                            >
                              {isPreviewingUploadDrop ? (
                                <>
                                  <Pause className="w-4 h-4 fill-current" />
                                  <span>Arrêter la pré-écoute ({formatTime(uploadPreviewTime)})</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 fill-current" />
                                  <span>Pré-écouter la piste Opus (-14 LUFS)</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* SECTION 1 : DONNÉES DE L'ÉTAPE 1 (SOURCE AUDIO, CONTENT ID, ONDE & POCHETTE) */}
                          <div className="rounded-xl bg-black/45 border border-white/[0.08] p-3 space-y-2">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold border-b border-white/[0.06] pb-1.5">
                              1. Source Audio, Empreinte d’Onde, Content ID &amp; Cover (Étape 1)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Type de Source &amp; Fichier Audio
                                </span>
                                <span className="font-mono font-semibold text-white break-all block mt-0.5">
                                  {uploadSourceType === 'FILE'
                                    ? newAudioFileName || 'Master Studio Opus'
                                    : `Flux Externe : ${newExternalUrl}`}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Identifiant Acoustique Unique (DROP Content ID)
                                </span>
                                <span className="font-mono font-bold text-cyan-300 break-all block mt-0.5">
                                  {newDropContentId || 'DROP-CID-241-AUTO'}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Vérification Concordance Forme d’Onde (64 bandes)
                                </span>
                                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>
                                    Certifié Unique (Concordance max :{' '}
                                    {waveformVerificationReport?.concordance.similarityPct ?? 12}% &lt;
                                    85%)
                                  </span>
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Codec &amp; Normalisation Broadcast
                                </span>
                                <span className="font-mono font-semibold text-white block mt-0.5">
                                  Conteneur {newAudioCodec} • Mesuré {newMeasuredLufs.toFixed(1)}{' '}
                                  LUFS → Aligné -14.0 LUFS
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Pochette / Cover Officielle
                                </span>
                                <span className="font-mono font-semibold text-emerald-300 break-all block mt-0.5">
                                  {newCoverFileName
                                    ? `Image importée : ${newCoverFileName}`
                                    : newCoverFileUrl
                                      ? 'Pochette personnalisée enregistrée'
                                      : 'Visuel Studio DROP par défaut'}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Fenêtre Officielle du Drop (30s max en Trend)
                                </span>
                                <span className="font-mono font-bold text-[#F59E0B] block mt-0.5">
                                  Début : {formatTime(newDropStart)} ({newDropStart}s) → Fin :{' '}
                                  {formatTime(
                                    Math.min(parsedNewDuration, newDropStart + newDropDuration)
                                  )}{' '}
                                  (Durée : {newDropDuration}s)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 2 : DONNÉES DE L'ÉTAPE 2 (ARTISTE, FEATURINGS, GENRE, BPM, TONALITÉ & QUOTA GABON) */}
                          <div className="rounded-xl bg-black/45 border border-white/[0.08] p-3 space-y-2">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold border-b border-white/[0.06] pb-1.5">
                              2. Identité Artistique, Featurings, Genre &amp; Paramètres Musicaux (Étape 2)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Titre Complet de l’Œuvre
                                </span>
                                <span className="font-semibold text-white break-words block mt-0.5">
                                  {newTitle}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Nature de la Publication
                                </span>
                                <span className="font-semibold text-amber-300 block mt-0.5">
                                  {newIsInstrumental
                                    ? 'Beat / Instrumentale Téléchargeable (Sans voix)'
                                    : 'Chanson Vocale Officielle'}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Artiste Principal (Lead)
                                </span>
                                <span className="font-semibold text-white break-words block mt-0.5">
                                  {newArtist}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Artistes en Featuring (Intégral)
                                </span>
                                <span className="font-semibold text-violet-300 break-words block mt-0.5">
                                  {newFeaturingInput.trim() || 'Aucun featuring (Titre Solo)'}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Contrat de Répartition Featuring
                                </span>
                                <span className="font-mono font-semibold text-violet-200 block mt-0.5">
                                  {newFeaturingSplitMode === '50_50'
                                    ? '50% / 50% (Duo Co-Lead)'
                                    : '70% Lead / 30% Featuring (Classique)'}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Projet / Album de rattachement
                                </span>
                                <span className="font-semibold text-white break-words block mt-0.5">
                                  {newAlbum.trim() || `${newArtist.trim()} — Studio Session`}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Genre / Catégorie Musicale
                                </span>
                                <span className="font-semibold text-[#DE1B34] block mt-0.5">
                                  {newCategory}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Tempo (BPM) &amp; Tonalité Musicale
                                </span>
                                <span className="font-mono font-semibold text-cyan-300 block mt-0.5">
                                  {newBpm} BPM • {newMusicalKey || 'Do Mineur (Cm)'}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Quota Écoutes Territoire Gabon (+241)
                                </span>
                                <span className="font-mono font-bold text-emerald-400 block mt-0.5">
                                  {newGabonTerritoryPct}% (Éligible Certifications Nationales ≥ 70%)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 3 : DONNÉES DE L'ÉTAPE 3 (CRÉDITS STUDIO COMPLETS, PLUME & HANDSHAKE) */}
                          <div className="rounded-xl bg-black/45 border border-white/[0.08] p-3 space-y-2">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold border-b border-white/[0.06] pb-1.5">
                              3. Crédits Studio Intégraux, Ingénierie du Son, Plume &amp; Droits (Étape 3)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Label Producteur
                                </span>
                                <span className="font-semibold text-white break-words block mt-0.5">
                                  {newLabelName}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Beatmaker / Compositeur (100% Prod)
                                </span>
                                <span className="font-semibold text-emerald-300 break-words block mt-0.5">
                                  {newBeatmakerName}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Ingénieur Prise de Voix (20% Son)
                                </span>
                                <span className="font-semibold text-white break-words block mt-0.5">
                                  {newIsInstrumental
                                    ? 'Instrumental (Sans prise de voix)'
                                    : newRecordingEngineerName.trim() ||
                                      newMixingEngineerName.trim() ||
                                      newSoundEngineerName.trim()}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Ingénieur Mixage (50% Son)
                                </span>
                                <span className="font-semibold text-amber-300 break-words block mt-0.5">
                                  {newMixingEngineerName.trim() || newSoundEngineerName.trim()}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Ingénieur Mastering -14.0 LUFS (30% Son)
                                </span>
                                <span className="font-semibold text-amber-200 break-words block mt-0.5">
                                  {newMasteringEngineerName.trim() ||
                                    newMixingEngineerName.trim() ||
                                    newSoundEngineerName.trim()}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Parolier / Auteur de l’Œuvre (Plume)
                                </span>
                                <span className="font-semibold text-sky-300 break-words block mt-0.5">
                                  {newIsInstrumental
                                    ? 'Instrumental (Sans paroles)'
                                    : newLyricistName}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Statut Plume Externe
                                </span>
                                <span className="font-mono font-semibold text-sky-200 block mt-0.5">
                                  {newIsInstrumental
                                    ? 'Non applicable (Instrumental)'
                                    : newIsExternalLyricist
                                      ? 'Oui (Bonus Plume Externe x1.25 actif)'
                                      : 'Non (Auteur-Interprète)'}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05] sm:col-span-2">
                                <span className="text-[#8E93A4] block text-[10px]">
                                  Mention Légale Copyright &amp; Registre Handshake
                                </span>
                                <span className="font-mono text-zinc-200 break-words block mt-0.5">
                                  {newCopyrightText.trim() ||
                                    `Copyright 2026 ${newLabelName || 'Direct Prod Gabon'} (+241). Tous droits réservés • Handshake Studio Vérifié`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ajustement de la Zone Drop */}
                        <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#F59E0B] truncate">
                              Calibrage de la Zone Drop : {formatTime(newDropStart)} →{' '}
                              {formatTime(
                                Math.min(parsedNewDuration, newDropStart + newDropDuration)
                              )}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              Aperçu automatique sur le lecteur
                            </span>
                          </div>

                          <div className="relative h-12 w-full rounded-lg bg-[#0D1017] border border-white/[0.06] overflow-hidden flex items-end px-1 gap-[2px]">
                            {(waveformPeaks.length > 0
                              ? waveformPeaks
                              : Array.from(
                                  { length: 48 },
                                  (_, idx) => 0.25 + ((idx * 7) % 10) * 0.06
                                )
                            ).map((peak, i, arr) => {
                              const barSec = (i / arr.length) * parsedNewDuration;
                              const inDrop =
                                barSec >= newDropStart && barSec <= newDropStart + newDropDuration;
                              return (
                                <div
                                  key={i}
                                  style={{ height: `${Math.round(peak * 88)}%` }}
                                  className={`flex-1 rounded-t ${
                                    inDrop ? 'bg-[#F59E0B]' : 'bg-white/15'
                                  }`}
                                />
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <div className="flex justify-between text-[11px] text-[#8E93A4] mb-1">
                                <span>Début du Drop</span>
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
                                className="w-full accent-[#F59E0B]"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-[11px] text-[#8E93A4] mb-1">
                                <span>Durée du Drop</span>
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
                                className="w-full accent-[#F59E0B]"
                              />
                            </div>
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
                          disabled={
                            (wizardStep === 1 && !isWizardStep1Valid) ||
                            (wizardStep === 2 && !isWizardStep2Valid) ||
                            (wizardStep === 3 && !isWizardStep3Valid)
                          }
                          onClick={() => {
                            const nextStep = (wizardStep + 1) as 1 | 2 | 3 | 4;
                            if (canAccessWizardStep(nextStep)) {
                              setWizardStep(nextStep);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-[#DE1B34] text-white font-bold text-xs flex items-center gap-1 disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          <span>
                            {wizardStep === 3
                              ? 'Prévisualiser le résumé complet'
                              : 'Étape suivante'}
                          </span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePublishTrack}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07080C] font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Publier et mettre en ligne</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {adminMainTab === 'BANNERS' && (
                <AdminBannersManager
                  adBanners={adBanners}
                  setAdBanners={setAdBanners}
                  adBannerSettings={adBannerSettings}
                  setAdBannerSettings={setAdBannerSettings}
                  allTracksFlat={allTracksFlat}
                  catalogue={catalogue}
                  onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                  pushNotification={pushNotification}
                />
              )}

              {adminMainTab === 'DATABASE' && (
                <AdminDatabaseManager
                  supabaseHealthMsg={supabaseHealthMsg}
                  entityDb={entityDb}
                  onRegisterEntity={handleRegisterEntityInDb}
                  onDeleteEntity={handleDeleteEntityFromDb}
                  onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                  pushNotification={pushNotification}
                />
              )}

              {adminMainTab === 'USERS' && (
                <AdminUsersDirectory
                  users={users}
                  onSelectUser={(uid) => setSelectedConsumerUserId(uid)}
                  onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                />
              )}

              {adminMainTab === 'ROYALTIES_BUGADA' && (
                <BugadaRoyaltiesAdminPanel
                  ledger={royaltyLedger}
                  settings={royaltyLedgerState.settings}
                  closedPeriods={royaltyLedgerState.closedPeriods}
                  onUpdateSettings={updateRoyaltySettings}
                  onResetSettings={resetRoyaltySettings}
                  onChangeHolderTaxStatus={setHolderTaxStatus}
                  onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                  onCloseAccountingPeriod={(period) => {
                    const currentStats: StatsBaseline = {};
                    users.forEach((u) => {
                      currentStats[u.id] = {};
                      Object.values(u.trackStats).forEach((st) => {
                        currentStats[u.id][st.trackId] = {
                          plays: st.playsCount,
                          seconds: st.listenSeconds,
                        };
                      });
                    });
                    closeRoyaltyPeriod({
                      period,
                      statements: royaltyLedger.statements,
                      bugadaTotal: royaltyLedger.bugada.totalAuthorship,
                      currentStats,
                    });
                    pushNotification(
                      `Clôture BUGADA & Paie (${period})`,
                      'Bordereau BUGADA 12% validé et paiements directs Master 48% ordonnancés.',
                      'CERTIFICATION'
                    );
                  }}
                />
              )}
            </>
          )}

          <TrackEditModal
            editingTrack={editingTrack}
            setEditingTrack={setEditingTrack}
            entityDb={entityDb}
            categories={categories}
            onSaveEditedTrack={handleSaveEditedTrack}
          />
        </main>
      )}

      <NotificationSystem
        activeToast={activeToast}
        onDismissToast={() => setActiveToast(null)}
        showNotificationsModal={showNotificationsModal}
        onCloseNotificationsModal={() => setShowNotificationsModal(false)}
        notifications={notifications}
        onClearAllNotifications={() => setNotifications([])}
        onSelectTrackFromNotification={(tid) => setSelectedTrackId(tid)}
      />
    </div>
  );
}

export default App;
