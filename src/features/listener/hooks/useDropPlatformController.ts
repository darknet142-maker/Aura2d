import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  streamTracker,
  SyncStatusSnapshot,
  OfflineStreamEvent,
  GabonSubscriptionPass,
  GabonNetworkOperator,
} from '../../../services/offlineStreamTracker';
import {
  ArtworkType,
} from '../../../components/CoverArtwork';
import { LyricLine } from '../../../components/Immersive3DPlayer';
import {
  StudioEntityRole,
} from '../../../components/ReusableAnalyticsSheets';
import { buildBreakUiWorstCaseCatalogue } from '../../../mocks/breakUiWorstCase.mock';
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
} from '../../../utils/rankingEngine';
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
} from '../../../services/musicService';
import {
  subscribeToLiveSync,
  broadcastLiveSync,
} from '../../../services/realtimeSync';
import { buildRoyaltyLedger } from '../../../features/royalties/royaltyLedger';
import {
  useRoyaltyLedgerState,
  type StatsBaseline,
} from '../../../features/royalties/royaltyLedgerStore';

// --- Architecture Modulaire par Domaine Métier (Feature-Based Architecture) ---
import type {
  AppNotification,
  EntityDatabase,
  Track,
  AlbumNode,
  UserTrackStat,
  AppUser,
} from '../../../shared/types/domain.types';
export type {
  AppNotification,
  EntityDatabase,
  Track,
  AlbumNode,
  UserTrackStat,
  AppUser,
};
import { DEFAULT_CATEGORIES, INITIAL_CATALOGUE } from '../../../mocks/catalogue.mock';
import { INITIAL_USERS } from '../../../mocks/users.mock';
import {
  INITIAL_ARTIST_SUBSCRIBERS,
  INITIAL_COMMUNITY_RECOMMENDATIONS,
  INITIAL_NOTIFICATIONS,
} from '../../../mocks/community.mock';
import { useAdminDrmSandbox } from '../../backoffice/hooks/useAdminDrmSandbox';
import { useAdminAnalytics } from '../../backoffice/hooks/useAdminAnalytics';
import { useAdminUploadController } from '../../backoffice/hooks/useAdminUploadController';

export function useDropPlatformController() {
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

  // --- Protocole `break-ui` (Crash-Test Visuel : titres 80+ caractères & images manquantes) ---
  const [isBreakUiMode, setIsBreakUiMode] = useState<boolean>(false);
  const normalCatalogueSnapshotRef = useRef<AlbumNode[] | null>(null);

  // Sauvegarde automatique et immédiate de tout le catalogue (uniquement hors mode Crash-Test break-ui)
  useEffect(() => {
    if (!isBreakUiMode) {
      saveFullCatalogueSnapshot(catalogue);
    }
  }, [catalogue, isBreakUiMode]);

  const handleToggleBreakUiMode = useCallback(() => {
    setIsBreakUiMode((prev) => {
      const next = !prev;
      if (next) {
        normalCatalogueSnapshotRef.current = catalogue;
        setCatalogue(buildBreakUiWorstCaseCatalogue(catalogue));
      } else if (normalCatalogueSnapshotRef.current) {
        setCatalogue(normalCatalogueSnapshotRef.current);
      }
      return next;
    });
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
  const [eqBypassed, setEqBypassed] = useState<boolean>(false);
  const [preampDb, setPreampDb] = useState<number>(0);
  const [eqQFactor, setEqQFactor] = useState<number>(1.1);
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

  // --- Refs (Web Audio -14.0 LUFS Uniform Loudness & Parametric 5-Band DSP Engine) ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const preampGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const loudnessNormGainRef = useRef<GainNode | null>(null);
  const loudnessCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const previewMediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const fftBinsRef = useRef<Uint8Array | null>(null);
  const timeDomainBinsRef = useRef<Uint8Array | null>(null);
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


  const isPreviewingUploadDropRef = useRef<boolean>(false);
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

      // 0. Analyseur Spectral Temps Réel (FFT 256 bins, 60 FPS) en sortie Master
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;
      analyser.connect(ctx.destination);
      analyserNodeRef.current = analyser;
      fftBinsRef.current = new Uint8Array(analyser.frequencyBinCount);
      timeDomainBinsRef.current = new Uint8Array(analyser.fftSize);

      // 1. Nœud Master Volume contrôlé par l'utilisateur (0% à 100%)
      const master = ctx.createGain();
      master.gain.value = masterVolume / 100;
      master.connect(analyser);
      masterGainRef.current = master;

      // 2. Compresseur / Limiteur Broadcast (-14.0 LUFS Constant Leveler)
      // Garantit que toutes les chansons (fichiers audio ou synthé) sortent au même volume perçu sans écrêtage
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 10;
      compressor.ratio.value = 4.2;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.16;
      compressor.connect(master);
      loudnessCompressorRef.current = compressor;

      // 3. Nœud d'Auto-Gain de Normalisation LUFS par piste (Cible : -14.0 LUFS)
      const loudnessNorm = ctx.createGain();
      loudnessNorm.gain.value = computeTrackLoudnessGain(currentTrack.lufsMasterLevel);
      loudnessNorm.connect(compressor);
      loudnessNormGainRef.current = loudnessNorm;

      // 4. Égaliseur Paramétrique Studio 5 bandes (60Hz, 250Hz, 1kHz, 4kHz, 12kHz)
      const freqs = [60, 250, 1000, 4000, 12000];
      const filters = freqs.map((f, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? 'lowshelf' : i === freqs.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = f;
        filter.Q.value = eqQFactor;
        filter.gain.value = eqBypassed ? 0 : (eqGains[i] ?? 0);
        return filter;
      });

      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filters[filters.length - 1].connect(loudnessNorm);
      eqFiltersRef.current = filters;

      // 5. Pré-amplificateur d'entrée (Preamp -12 dB à +12 dB avec compensation anti-clipping)
      const preamp = ctx.createGain();
      preamp.gain.value = Math.pow(10, preampDb / 20);
      preamp.connect(filters[0]);
      preampGainRef.current = preamp;
    }

    // 6. Routage universel des lecteurs HTML5 <audio> à travers la chaîne DSP 5 bandes
    const ctx = audioCtxRef.current;
    const entryNode =
      preampGainRef.current ||
      eqFiltersRef.current[0] ||
      loudnessNormGainRef.current ||
      masterGainRef.current;

    if (ctx && entryNode && htmlAudioRef.current && !mediaSourceRef.current) {
      try {
        htmlAudioRef.current.crossOrigin = 'anonymous';
        const srcNode = ctx.createMediaElementSource(htmlAudioRef.current);
        srcNode.connect(entryNode);
        mediaSourceRef.current = srcNode;
      } catch {
        // Ignore if already connected or restricted
      }
    }

    if (ctx && entryNode && uploadPreviewAudioRef.current && !previewMediaSourceRef.current) {
      try {
        uploadPreviewAudioRef.current.crossOrigin = 'anonymous';
        const prevNode = ctx.createMediaElementSource(uploadPreviewAudioRef.current);
        prevNode.connect(entryNode);
        previewMediaSourceRef.current = prevNode;
      } catch {
        // Ignore
      }
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, [
    masterVolume,
    eqGains,
    eqBypassed,
    preampDb,
    eqQFactor,
    computeTrackLoudnessGain,
    currentTrack.lufsMasterLevel,
  ]);

  // --- Ajustement automatique du gain de normalisation (-14.0 LUFS) à chaque changement de chanson ---
  useEffect(() => {
    const targetNormGain = computeTrackLoudnessGain(currentTrack.lufsMasterLevel);
    if (loudnessNormGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      loudnessNormGainRef.current.gain.cancelScheduledValues(now);
      loudnessNormGainRef.current.gain.setTargetAtTime(targetNormGain, now, 0.015);
    }
    if (htmlAudioRef.current) {
      if (mediaSourceRef.current) {
        htmlAudioRef.current.volume = 1;
      } else {
        const normScalar = Math.min(1.15, Math.max(0.45, targetNormGain));
        htmlAudioRef.current.volume = Math.max(
          0,
          Math.min(1, (masterVolume / 100) * normScalar)
        );
      }
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
          clamped / 100,
          now,
          0.01
        );
      }
      const normScalar = Math.min(
        1.15,
        Math.max(0.45, computeTrackLoudnessGain(currentTrack.lufsMasterLevel))
      );
      if (htmlAudioRef.current) {
        htmlAudioRef.current.volume = mediaSourceRef.current
          ? 1
          : Math.max(0, Math.min(1, (clamped / 100) * normScalar));
      }
      if (uploadPreviewAudioRef.current) {
        uploadPreviewAudioRef.current.volume = previewMediaSourceRef.current
          ? 1
          : Math.max(0, Math.min(1, (clamped / 100) * normScalar));
      }
      if (externalPlayerRef.current?.setVolume) {
        externalPlayerRef.current.setVolume(Math.round(clamped));
      }
    },
    [computeTrackLoudnessGain, currentTrack.lufsMasterLevel]
  );

  const handleChangeEqBand = useCallback(
    (bandIdx: number, dbVal: number) => {
      initAudioContext();
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
        filter.gain.setTargetAtTime(eqBypassed ? 0 : clampedDb, now, 0.015);
      }
    },
    [eqBypassed, initAudioContext]
  );

  const handleApplyEqPreset = useCallback(
    (gains: number[]) => {
      initAudioContext();
      const cleanGains = gains.map((g) => Math.max(-12, Math.min(12, Math.round(g * 2) / 2)));
      setEqGains(cleanGains);
      setEqBypassed(false);
      cleanGains.forEach((val, idx) => {
        const filter = eqFiltersRef.current[idx];
        if (filter && audioCtxRef.current) {
          const now = audioCtxRef.current.currentTime;
          filter.gain.cancelScheduledValues(now);
          filter.gain.setTargetAtTime(val, now, 0.02);
        }
      });
    },
    [initAudioContext]
  );

  const handleResetEq = useCallback(() => {
    initAudioContext();
    const flat = [0, 0, 0, 0, 0];
    setEqGains(flat);
    setPreampDb(0);
    setEqQFactor(1.1);
    setEqBypassed(false);
    flat.forEach((val, idx) => {
      const filter = eqFiltersRef.current[idx];
      if (filter && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        filter.gain.cancelScheduledValues(now);
        filter.gain.setTargetAtTime(val, now, 0.02);
        filter.Q.setTargetAtTime(1.1, now, 0.02);
      }
    });
    if (preampGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      preampGainRef.current.gain.cancelScheduledValues(now);
      preampGainRef.current.gain.setTargetAtTime(1.0, now, 0.02);
    }
  }, [initAudioContext]);

  const handleToggleEqBypass = useCallback(() => {
    initAudioContext();
    setEqBypassed((prev) => {
      const nextBypass = !prev;
      eqFiltersRef.current.forEach((filter, idx) => {
        if (filter && audioCtxRef.current) {
          const now = audioCtxRef.current.currentTime;
          filter.gain.cancelScheduledValues(now);
          filter.gain.setTargetAtTime(
            nextBypass ? 0 : (eqGains[idx] ?? 0),
            now,
            0.015
          );
        }
      });
      return nextBypass;
    });
  }, [eqGains, initAudioContext]);

  const handleChangePreampDb = useCallback(
    (nextDb: number) => {
      initAudioContext();
      const clamped = Math.max(-12, Math.min(12, Math.round(nextDb * 2) / 2));
      setPreampDb(clamped);
      if (preampGainRef.current && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        preampGainRef.current.gain.cancelScheduledValues(now);
        preampGainRef.current.gain.setTargetAtTime(
          Math.pow(10, clamped / 20),
          now,
          0.015
        );
      }
    },
    [initAudioContext]
  );

  const handleChangeEqQFactor = useCallback(
    (nextQ: number) => {
      initAudioContext();
      const clampedQ = Math.max(0.5, Math.min(3.5, Math.round(nextQ * 10) / 10));
      setEqQFactor(clampedQ);
      eqFiltersRef.current.forEach((filter) => {
        if (filter && audioCtxRef.current) {
          const now = audioCtxRef.current.currentTime;
          filter.Q.cancelScheduledValues(now);
          filter.Q.setTargetAtTime(clampedQ, now, 0.015);
        }
      });
    },
    [initAudioContext]
  );

  const getAudioSpectrumData = useCallback(() => {
    const analyser = analyserNodeRef.current;
    const fftBins = fftBinsRef.current;
    const timeBins = timeDomainBinsRef.current;
    if (!analyser || !fftBins || !timeBins) return null;
    analyser.getByteFrequencyData(fftBins as Uint8Array<ArrayBuffer>);
    analyser.getByteTimeDomainData(timeBins as Uint8Array<ArrayBuffer>);
    let sumSq = 0;
    let peak = 0;
    for (let i = 0; i < timeBins.length; i++) {
      const centered = (timeBins[i] - 128) / 128;
      const abs = Math.abs(centered);
      if (abs > peak) peak = abs;
      sumSq += centered * centered;
    }
    const rms = Math.sqrt(sumSq / timeBins.length);
    const rmsDb = rms > 0.0001 ? Math.max(-60, 20 * Math.log10(rms)) : -60;
    const peakDb = peak > 0.0001 ? Math.max(-60, 20 * Math.log10(peak)) : -60;
    return { bins: fftBins, rmsDb, peakDb };
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
      const synthHeadroomScalar = 0.32;
      const waveformRmsNorm = (dropActive ? 0.165 : 0.215) * synthHeadroomScalar;
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
      subGain.gain.linearRampToValueAtTime(0.11 * synthHeadroomScalar, now + 0.035);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + stepDurationSec);

      osc.connect(noteGain);
      subOsc.connect(subGain);

      const destinationNode =
        preampGainRef.current ||
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

  // --- Synchronize Active Audio Engine (Strict -14.0 LUFS Level Matching & 5-Band EQ Routing) ---
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
      if (isPlaying && !isPreviewingUploadDropRef.current) {
        initAudioContext();
        audio.volume = mediaSourceRef.current
          ? 1
          : Math.max(
              0,
              Math.min(
                1,
                (masterVolume / 100) *
                  Math.min(
                    1.15,
                    Math.max(0.45, computeTrackLoudnessGain(currentTrack.lufsMasterLevel))
                  )
              )
            );
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
        if (isPlaying && !isPreviewingUploadDropRef.current) {
          externalPlayerRef.current.playVideo?.();
        } else {
          externalPlayerRef.current.pauseVideo?.();
        }
      }
      return;
    } else if (externalPlayerRef.current?.pauseVideo) {
      externalPlayerRef.current.pauseVideo();
    }

    if (isPlaying && !isPreviewingUploadDropRef.current) {
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
    isPreviewingUploadDropRef.current,
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
    if (!isPlaying || isPreviewingUploadDropRef.current) return;
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
    isPreviewingUploadDropRef.current,
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
      if (!isPlayingRef.current && !isPreviewingUploadDropRef.current) {
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
  }, [initAudioContext, currentTrack.dropStart, isPreviewingUploadDropRef.current]);

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



  const drm = useAdminDrmSandbox();
  const analytics = useAdminAnalytics({
    allTracksFlat,
    artistSubscribers,
    categories,
    catalogue,
    trackRankMap,
    users,
  });
  const upload = useAdminUploadController({
    allTracksFlat,
    catalogue,
    categories,
    setCategories,
    setCatalogue,
    setAlbumIdx,
    setTrackIdx,
    setIsDropMode,
    setCurrentTime,
    setAdminMainTab,
    selectedTrackId: analytics.selectedTrackId,
    setSelectedTrackId: analytics.setSelectedTrackId,
    pushNotification,
    handleRegisterEntityInDb,
    setIsPlaying,
    initAudioContext,
    loudnessNormGainRef,
    audioCtxRef,
    computeTrackLoudnessGain,
    uploadPreviewAudioRef,
    masterVolume,
    stepCounterRef,
    triggerSynthNote,
  });

  useEffect(() => {
    isPreviewingUploadDropRef.current = upload.isPreviewingUploadDrop;
  }, [upload.isPreviewingUploadDrop]);

  const isCurrentLiked = !!likedTrackIds[currentTrack.id];
  const currentRankInfo = trackRankMap[currentTrack.id] || { rank: 4, delta: 3 };

  return {
    appView, setAppView, catalogue, setCatalogue, categories, setCategories,
    enableAwardsCeremony, setEnableAwardsCeremony, users, setUsers, currentUser, setCurrentUser,
    subscriptionPass, setSubscriptionPass, networkOperator, setNetworkOperator,
    lastEcgValidationMsg, syncSnapshot, albumIdx, setAlbumIdx, trackIdx, setTrackIdx,
    isPlaying, setIsPlaying, isDropMode, setIsDropMode, currentTime, setCurrentTime,
    likedTrackIds, recommendedTrackIds, subscribedArtists, artistSubscribers,
    communityRecommendations, isShuffle, setIsShuffle, repeatMode, setRepeatMode,
    masterVolume, eqGains, eqBypassed, preampDb, eqQFactor, userPlan, setUserPlan, manualSessionRef,
    authMode, setAuthMode, authName, setAuthName, authEmail, setAuthEmail,
    adminMainTab, setAdminMainTab, catalogueSubTab, setCatalogueSubTab,
    royaltyLedgerState, updateRoyaltySettings, resetRoyaltySettings, setHolderTaxStatus,
    closeRoyaltyPeriod, lastAdminSavedAt, isSavingAdmin, adBanners, setAdBanners,
    adBannerSettings, setAdBannerSettings, supabaseHealthMsg, entityDb,
    inlineNewEntityField, setInlineNewEntityField, inlineNewEntityValue, setInlineNewEntityValue,
    notifications, setNotifications, showNotificationsModal, setShowNotificationsModal,
    activeToast, setActiveToast, pushNotification, unreadNotificationsCount,
    markAllNotificationsRead, handleRegisterEntityInDb, handleDeleteEntityFromDb,
    sqlCopiedBanner, setSqlCopiedBanner, showSqlEditorModal, setShowSqlEditorModal,
    htmlAudioRef, uploadPreviewAudioRef, safeAlbumIdx, currentAlbum, safeTrackIdx, currentTrack,
    isRealtimeConnected, handleSaveAndSyncAllAdmin, allTracksFlat, royaltyLedger,
    trackRankMap, finalizeListeningSessionOnZap, handleChangeMasterVolume,
    handleChangeEqBand, handleApplyEqPreset, handleResetEq,
    handleToggleEqBypass, handleChangePreampDb, handleChangeEqQFactor, getAudioSpectrumData,
    seekAllEngines,
    handleSelectTrackIndex, handleSelectAlbumIndex, navigateTrack, navigateAlbum,
    handleCentralPlayToggle, toggleLike, handleToggleOfflineDownload,
    handleRecommendTrack, handleToggleSubscribeArtist, handleRecordLyricsOpen,
    handleConfirmCreditHandshake, handleOpenCreditDispute, handleResolveCreditDispute,
    handleToggleInPlaylist, handleSeekFromPlayer, handleQuickEnter,
    isCurrentLiked, currentRankInfo,
    isBreakUiMode, handleToggleBreakUiMode,
    ...drm,
    ...analytics,
    ...upload,
  };
}

export type ReturnTypeUseDropPlatformController = ReturnType<typeof useDropPlatformController>;
