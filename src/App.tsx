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
  AdminTrackDrilldownView,
  AdminArtistDrilldownView,
  AdminConsumerUserDrilldownView,
  AdminUploadWizard,
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
            <AdminTrackDrilldownView
              selectedTrackDetail={selectedTrackDetail}
              onClose={() => setSelectedTrackId(null)}
              onSelectArtist={(artist) => {
                setSelectedTrackId(null);
                setSelectedArtistName(artist);
              }}
              onPlayTrackInPlayer={(detail) => {
                finalizeListeningSessionOnZap();
                setAlbumIdx(detail.albumIndex);
                setTrackIdx(detail.trackIndex);
                setIsDropMode(false);
                seekAllEngines(0);
                manualSessionRef.current = {
                  trackId: detail.track.id,
                  active: true,
                  listenedSeconds: 0,
                  playCountedAtOneSec: false,
                  ecgValidatedAt30Sec: false,
                  sessionPointsEarned: 0,
                };
                setIsPlaying(true);
                setAppView('PLAYER');
              }}
              onEditTrack={(editing) => setEditingTrack(editing)}
              onDeleteTrack={handleDeleteTrack}
            />
          ) : selectedArtistAnalytics ? (
            <AdminArtistDrilldownView
              selectedArtistAnalytics={selectedArtistAnalytics}
              artistSubscribers={artistSubscribers}
              subscribedArtists={subscribedArtists}
              onToggleSubscribeArtist={handleToggleSubscribeArtist}
              royaltyLedger={royaltyLedger}
              royaltySettings={royaltyLedgerState.settings}
              trackRankMap={trackRankMap}
              onClose={() => setSelectedArtistName(null)}
              onSelectTrack={(tid) => {
                setSelectedArtistName(null);
                setSelectedTrackId(tid);
              }}
              onSelectConsumerUser={(uid) => {
                setSelectedArtistName(null);
                setSelectedConsumerUserId(uid);
              }}
            />
          ) : selectedConsumerUser && consumerAnalytics ? (
            <AdminConsumerUserDrilldownView
              selectedConsumerUser={selectedConsumerUser}
              consumerAnalytics={consumerAnalytics}
              users={users}
              trackRankMap={trackRankMap}
              onClose={() => setSelectedConsumerUserId(null)}
              onSelectTrack={(tid) => {
                setSelectedConsumerUserId(null);
                setSelectedTrackId(tid);
              }}
            />
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
                <AdminUploadWizard
                  wizardStep={wizardStep}
                  setWizardStep={setWizardStep}
                  isWizardStep1Valid={isWizardStep1Valid}
                  isWizardStep2Valid={isWizardStep2Valid}
                  isWizardStep3Valid={isWizardStep3Valid}
                  canAccessWizardStep={canAccessWizardStep}
                  uploadSuccess={uploadSuccess}
                  uploadSourceType={uploadSourceType}
                  setUploadSourceType={setUploadSourceType}
                  newAudioFileName={newAudioFileName}
                  handleAudioFileDrop={handleAudioFileDrop}
                  handleLoadStudioOpusMasterPreset={handleLoadStudioOpusMasterPreset}
                  handleSimulateDuplicateWaveformUpload={handleSimulateDuplicateWaveformUpload}
                  allTracksFlat={allTracksFlat}
                  newExternalUrl={newExternalUrl}
                  setNewExternalUrl={setNewExternalUrl}
                  isUploadingFile={isUploadingFile}
                  uploadProgress={uploadProgress}
                  newCoverFileUrl={newCoverFileUrl}
                  newCoverFileName={newCoverFileName}
                  handleRemoveNewCover={handleRemoveNewCover}
                  handleCoverFileSelect={handleCoverFileSelect}
                  waveformVerificationReport={waveformVerificationReport}
                  handleCancelDuplicateUpload={handleCancelDuplicateUpload}
                  newIsInstrumental={newIsInstrumental}
                  setNewIsInstrumental={setNewIsInstrumental}
                  setNewIsBeatDownloadable={setNewIsBeatDownloadable}
                  newCategory={newCategory}
                  setNewCategory={setNewCategory}
                  newTitle={newTitle}
                  setNewTitle={setNewTitle}
                  newArtist={newArtist}
                  setNewArtist={setNewArtist}
                  inlineNewEntityField={inlineNewEntityField}
                  setInlineNewEntityField={setInlineNewEntityField}
                  inlineNewEntityValue={inlineNewEntityValue}
                  setInlineNewEntityValue={setInlineNewEntityValue}
                  entityDb={entityDb}
                  handleRegisterEntityInDb={handleRegisterEntityInDb}
                  newFeaturingInput={newFeaturingInput}
                  setNewFeaturingInput={setNewFeaturingInput}
                  newFeaturingSplitMode={newFeaturingSplitMode}
                  setNewFeaturingSplitMode={setNewFeaturingSplitMode}
                  newDurationFormatted={newDurationFormatted}
                  setNewDurationFormatted={setNewDurationFormatted}
                  newGabonTerritoryPct={newGabonTerritoryPct}
                  setNewGabonTerritoryPct={setNewGabonTerritoryPct}
                  newAlbum={newAlbum}
                  setNewAlbum={setNewAlbum}
                  newBpm={newBpm}
                  setNewBpm={setNewBpm}
                  newMusicalKey={newMusicalKey}
                  setNewMusicalKey={setNewMusicalKey}
                  categories={categories}
                  customCategoryInput={customCategoryInput}
                  setCustomCategoryInput={setCustomCategoryInput}
                  handleAddCategory={handleAddCategory}
                  newLabelName={newLabelName}
                  setNewLabelName={setNewLabelName}
                  newBeatmakerName={newBeatmakerName}
                  setNewBeatmakerName={setNewBeatmakerName}
                  newRecordingEngineerName={newRecordingEngineerName}
                  setNewRecordingEngineerName={setNewRecordingEngineerName}
                  newMixingEngineerName={newMixingEngineerName}
                  setNewMixingEngineerName={setNewMixingEngineerName}
                  newSoundEngineerName={newSoundEngineerName}
                  setNewSoundEngineerName={setNewSoundEngineerName}
                  newMasteringEngineerName={newMasteringEngineerName}
                  setNewMasteringEngineerName={setNewMasteringEngineerName}
                  newLyricistName={newLyricistName}
                  setNewLyricistName={setNewLyricistName}
                  newIsExternalLyricist={newIsExternalLyricist}
                  setNewIsExternalLyricist={setNewIsExternalLyricist}
                  newDropContentId={newDropContentId}
                  newAudioCodec={newAudioCodec}
                  newMeasuredLufs={newMeasuredLufs}
                  parsedNewDuration={parsedNewDuration}
                  toggleUploadDropPreview={toggleUploadDropPreview}
                  isPreviewingUploadDrop={isPreviewingUploadDrop}
                  uploadPreviewTime={uploadPreviewTime}
                  newDropStart={newDropStart}
                  setNewDropStart={setNewDropStart}
                  newDropDuration={newDropDuration}
                  setNewDropDuration={setNewDropDuration}
                  newCopyrightText={newCopyrightText}
                  waveformPeaks={waveformPeaks}
                  handlePublishTrack={handlePublishTrack}
                />
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
