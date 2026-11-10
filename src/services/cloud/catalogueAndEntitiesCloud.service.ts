import {
  optimizeImageAuto,
  optimizeForStorageUpload,
} from '../imageOptimizer';
import { broadcastLiveSync } from '../realtimeSync';
import {
  supabase,
  LOCAL_STORAGE_TRACKS_KEY,
  LOCAL_STORAGE_CATALOGUE_SNAPSHOT_KEY,
  LOCAL_STORAGE_ENTITIES_KEY,
  LOCAL_STORAGE_PLAYLISTS_KEY,
  LOCAL_STORAGE_LIBRARY_KEY,
  fileToPersistentDataUrl,
  extractYoutubeId,
  sanitizeStorageFileName,
  purgeLegacyMockLocalStorage,
  type SupabaseTrackRow,
  type UploadTrackMetadataInput,
  type StudioEntityRecord,
  type UserLibraryStatePayload,
} from './supabaseCoreAndTypes';
import {
  convertAudioFileToOpus,
  saveAudioBlobToIndexedDb,
  deleteAudioBlobFromIndexedDb,
} from './audioIndexedDbAndOpus.service';
import { REAL_CATALOGUE_SEED } from './realCatalogueSeed';
export { REAL_CATALOGUE_SEED } from './realCatalogueSeed';

const MOCK_TRACK_ID_REGEX = /^(t-10[0-9]|t-20[0-9]|t-30[0-9]|t-main-|t-beat-|track-mock-)/;
const MOCK_ALBUM_ID_REGEX = /^(alb-[0-9]|alb-main|alb-beats-|album-mock-)/;
const MOCK_TITLES = new Set([
  'souverain du komo',
  "écho d'akanda",
  "echo d'akanda",
  'nuit à nzeng-ayong',
  'nuit a nzeng-ayong',
  'lumières du bord de mer',
  'lumieres du bord de mer',
  "pluie d'équateur",
  "pluie d'equateur",
  "traverse l'ogooué",
  "traverse l'ogooue",
]);

export function isMockTrack(track: any): boolean {
  if (!track) return true;
  if (track.id && MOCK_TRACK_ID_REGEX.test(track.id)) return true;
  if (track.title && MOCK_TITLES.has(String(track.title).toLowerCase().trim())) return true;
  return false;
}

export function isMockAlbum(album: any): boolean {
  if (!album) return true;
  if (album.id && MOCK_ALBUM_ID_REGEX.test(album.id)) return true;
  return false;
}

export function sanitizeRealCatalogue<T extends any[]>(cat: T): T {
  if (!Array.isArray(cat)) return [] as unknown as T;
  const filtered = cat
    .filter((a: any) => !isMockAlbum(a))
    .map((a: any) => ({
      ...a,
      tracks: Array.isArray(a.tracks) ? a.tracks.filter((t: any) => !isMockTrack(t)) : [],
    }))
    .filter((a: any) => a.tracks.length > 0);
  return filtered as unknown as T;
}

export function saveFullCatalogueSnapshot<T>(catalogue: T): void {
  try {
    const clean = Array.isArray(catalogue) ? sanitizeRealCatalogue(catalogue) : catalogue;
    localStorage.setItem(
      LOCAL_STORAGE_CATALOGUE_SNAPSHOT_KEY,
      JSON.stringify(clean)
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function loadFullCatalogueSnapshot<T>(): T | null {
  purgeLegacyMockLocalStorage();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CATALOGUE_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const clean = sanitizeRealCatalogue(parsed);
    return clean.length > 0 ? (clean as T) : null;
  } catch {
    return null;
  }
}

export async function getAllTracks(): Promise<SupabaseTrackRow[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      try {
        localStorage.setItem(LOCAL_STORAGE_TRACKS_KEY, JSON.stringify(data));
      } catch {
        // Ignore quota errors
      }
      return data as SupabaseTrackRow[];
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRACKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r) => !isMockTrack({ id: r.app_track_id || r.id, title: r.title })
    ) as SupabaseTrackRow[];
  } catch {
    return [];
  }
}

// ============================================================================
// 2. UPLOAD PERSISTANT D'UNE POCHETTE OU IMAGE DE BANNIÈRE ('cover_files')
// ============================================================================

export async function uploadCoverFile(
  coverFile: File,
  maxWidth = 1080,
  maxHeight = 1080,
  quality = 0.84
): Promise<{
  coverUrl: string;
  coverStoragePath: string;
}> {
  // Compression et optimisation automatique en WebP haute fidélité
  const { fileToUpload, dataUrl } = await optimizeForStorageUpload(
    coverFile,
    maxWidth,
    maxHeight
  );

  const cleanName = sanitizeStorageFileName(fileToUpload.name);
  const coverPath = `covers/${Date.now()}_${cleanName}`;

  // On génère toujours une DataURL compressée WebP persistante en garantie immédiate
  const persistentDataUrl =
    dataUrl || (await fileToPersistentDataUrl(coverFile, maxWidth, maxHeight, quality));

  if (supabase) {
    try {
      const { error: uploadError } = await supabase.storage
        .from('cover_files')
        .upload(coverPath, fileToUpload, {
          cacheControl: '31536000',
          upsert: false,
          contentType: fileToUpload.type || 'image/webp',
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('cover_files')
          .getPublicUrl(coverPath);

        if (publicUrlData?.publicUrl) {
          return {
            coverUrl: publicUrlData.publicUrl,
            coverStoragePath: coverPath,
          };
        }
      }
    } catch {
      // Repli automatique sur la DataURL persistante si le bucket n'est pas encore créé
    }
  }

  return {
    coverUrl: persistentDataUrl,
    coverStoragePath: coverPath,
  };
}

// ============================================================================
// 3. ENREGISTRER UNE MUSIQUE EN DUR (Normalisation -14 LUFS + IndexedDB + BDD)
// ============================================================================

export async function uploadLocalTrack(
  audioFile: File,
  metadata: UploadTrackMetadataInput,
  coverFile?: File | null
): Promise<SupabaseTrackRow> {
  const { opusFile, durationSec, lufsMasterLevel } =
    await convertAudioFileToOpus(audioFile);

  const appTrackId = metadata.appTrackId || `t-${Date.now()}`;
  const cleanFileName = sanitizeStorageFileName(opusFile.name);
  const filePath = `tracks/${Date.now()}_${cleanFileName}`;

  // Sauvegarde immédiate du binaire audio dans IndexedDB pour lecture locale 100 % fiable
  const persistentBlobUrl = await saveAudioBlobToIndexedDb(
    appTrackId,
    opusFile
  );

  let finalCoverUrl = metadata.coverUrl || null;
  let finalCoverStoragePath: string | null = null;

  if (coverFile) {
    const uploadedCover = await uploadCoverFile(coverFile);
    finalCoverUrl = uploadedCover.coverUrl;
    finalCoverStoragePath = uploadedCover.coverStoragePath;
  }

  if (supabase) {
    try {
      const { error: uploadError } = await supabase.storage
        .from('audio_files')
        .upload(filePath, opusFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: opusFile.type || 'audio/mpeg',
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('audio_files')
          .getPublicUrl(filePath);

        const streamUrl = publicUrlData.publicUrl;

        const insertPayload = {
          app_track_id: appTrackId,
          title: metadata.title.trim(),
          artist: (metadata.artist || 'Artiste inconnu').trim(),
          featuring_artists: metadata.featuringArtists || [],
          featuring_split_mode: metadata.featuringSplitMode || '70_30',
          album: (metadata.album || 'Single').trim(),
          category: metadata.category || 'Ntcham',
          label_name: (metadata.labelName || 'Indépendant').trim(),
          copyright_text: (metadata.copyrightText || '© DROP Music').trim(),
          beatmaker_name: (
            metadata.beatmakerName || 'Beatmaker inconnu'
          ).trim(),
          sound_engineer_name: (
            metadata.soundEngineerName || 'Ingénieur du son'
          ).trim(),
          recording_engineer_name: metadata.recordingEngineerName || null,
          mixing_engineer_name: metadata.mixingEngineerName || null,
          mastering_engineer_name: metadata.masteringEngineerName || null,
          lyricist_name: metadata.isInstrumental
            ? 'Instrumental (Sans paroles)'
            : (metadata.lyricistName || metadata.artist || '').trim(),
          is_external_lyricist: Boolean(metadata.isExternalLyricist),
          is_instrumental: Boolean(metadata.isInstrumental),
          source_type: 'file' as const,
          stream_url: streamUrl,
          storage_path: filePath,
          audio_codec: 'OPUS' as const,
          lufs_master_level: lufsMasterLevel,
          cover_url: finalCoverUrl,
          cover_storage_path: finalCoverStoragePath,
          duration: metadata.duration || durationSec,
          drop_start: metadata.dropStart ?? 30,
          drop_duration: metadata.dropDuration ?? 22,
          bpm: metadata.bpm ?? null,
          track_analysis: metadata.trackAnalysis ?? null,
          lyrics: metadata.lyrics || [],
        };

        const { data, error: dbError } = await supabase
          .from('tracks')
          .insert([insertPayload])
          .select()
          .single();

        if (!dbError && data) {
          broadcastLiveSync({
            type: 'TRACKS_UPDATED',
            payload: {
              action: 'CREATE',
              trackId: appTrackId,
              trackTitle: metadata.title.trim(),
              artist: metadata.artist?.trim(),
              message: `Nouvelle piste publiée : « ${metadata.title.trim()} »`,
              timestamp: new Date().toISOString(),
            },
          }).catch(() => {});
          return data as SupabaseTrackRow;
        }
      }
    } catch {
      // Fallback local persistant ci-dessous
    }
  }

  const localRow: SupabaseTrackRow = {
    id: `uuid-${Date.now()}`,
    app_track_id: appTrackId,
    title: metadata.title.trim(),
    artist: (metadata.artist || 'Artiste inconnu').trim(),
    featuring_artists: metadata.featuringArtists || [],
    featuring_split_mode: metadata.featuringSplitMode || '70_30',
    album: (metadata.album || 'Single').trim(),
    category: metadata.category || 'Ntcham',
    label_name: (metadata.labelName || 'Indépendant').trim(),
    copyright_text: (metadata.copyrightText || '© DROP Music').trim(),
    beatmaker_name: (metadata.beatmakerName || 'Beatmaker inconnu').trim(),
    sound_engineer_name: (
      metadata.soundEngineerName || 'Ingénieur du son'
    ).trim(),
    recording_engineer_name: metadata.recordingEngineerName || null,
    mixing_engineer_name: metadata.mixingEngineerName || null,
    mastering_engineer_name: metadata.masteringEngineerName || null,
    lyricist_name: metadata.isInstrumental
      ? 'Instrumental (Sans paroles)'
      : (metadata.lyricistName || metadata.artist || '').trim(),
    is_external_lyricist: Boolean(metadata.isExternalLyricist),
    is_instrumental: Boolean(metadata.isInstrumental),
    source_type: 'file',
    stream_url: persistentBlobUrl,
    storage_path: filePath,
    audio_codec: 'OPUS',
    lufs_master_level: lufsMasterLevel,
    cover_url: finalCoverUrl,
    cover_storage_path: finalCoverStoragePath,
    duration: metadata.duration || durationSec,
    drop_start: metadata.dropStart ?? 30,
    drop_duration: metadata.dropDuration ?? 22,
    bpm: metadata.bpm ?? null,
    track_analysis: metadata.trackAnalysis ?? null,
    lyrics: metadata.lyrics || [],
    real_plays: 0,
    loop_plays_count: 0,
    likes_count: 0,
    total_listen_seconds: 0,
    listen_sessions: 0,
    avg_retention_pct: 0,
    created_at: new Date().toISOString(),
  };

  try {
    const existing = await getAllTracks();
    const filtered = existing.filter(
      (r) => r.app_track_id !== localRow.app_track_id
    );
    localStorage.setItem(
      LOCAL_STORAGE_TRACKS_KEY,
      JSON.stringify([localRow, ...filtered])
    );
  } catch {
    // Ignore
  }

  broadcastLiveSync({
    type: 'TRACKS_UPDATED',
    payload: {
      action: 'CREATE',
      trackId: appTrackId,
      trackTitle: metadata.title.trim(),
      artist: metadata.artist?.trim(),
      message: `Nouvelle piste disponible : « ${metadata.title.trim()} »`,
      timestamp: new Date().toISOString(),
    },
  }).catch(() => {});

  return localRow;
}

// ============================================================================
// 4. AJOUTER UN LIEN YOUTUBE (Extraction miniature HD + Sauvegarde en BDD)
// ============================================================================

export async function addYoutubeTrack(
  youtubeUrl: string,
  metadata: UploadTrackMetadataInput
): Promise<SupabaseTrackRow> {
  const videoId = extractYoutubeId(youtubeUrl);
  if (!videoId) {
    throw new Error('Lien YouTube invalide.');
  }

  const autoThumbnail =
    metadata.coverUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  const insertPayload = {
    app_track_id: metadata.appTrackId || `t-yt-${Date.now()}`,
    title: metadata.title.trim(),
    artist: (metadata.artist || 'YouTube').trim(),
    featuring_artists: metadata.featuringArtists || [],
    featuring_split_mode: metadata.featuringSplitMode || '70_30',
    album: (metadata.album || 'Single').trim(),
    category: metadata.category || 'Ntcham',
    label_name: (metadata.labelName || 'Indépendant').trim(),
    copyright_text: (metadata.copyrightText || '© DROP Music').trim(),
    beatmaker_name: (metadata.beatmakerName || 'Beatmaker inconnu').trim(),
    sound_engineer_name: (
      metadata.soundEngineerName || 'Ingénieur du son'
    ).trim(),
    lyricist_name: metadata.isInstrumental
      ? 'Instrumental (Sans paroles)'
      : (metadata.lyricistName || metadata.artist || '').trim(),
    is_external_lyricist: Boolean(metadata.isExternalLyricist),
    is_instrumental: Boolean(metadata.isInstrumental),
    source_type: 'youtube' as const,
    stream_url: youtubeUrl.trim(),
    youtube_id: videoId,
    audio_codec: 'OPUS' as const,
    lufs_master_level: -14.0,
    cover_url: autoThumbnail,
    duration: metadata.duration || 180,
    drop_start: metadata.dropStart ?? 30,
    drop_duration: metadata.dropDuration ?? 22,
    bpm: metadata.bpm ?? null,
    track_analysis: metadata.trackAnalysis ?? null,
    lyrics: metadata.lyrics || [],
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .insert([insertPayload])
        .select()
        .single();

      if (!error && data) {
        broadcastLiveSync({
          type: 'TRACKS_UPDATED',
          payload: {
            action: 'CREATE',
            trackId: insertPayload.app_track_id,
            trackTitle: metadata.title.trim(),
            artist: metadata.artist?.trim(),
            message: `Nouveau flux YouTube : « ${metadata.title.trim()} »`,
            timestamp: new Date().toISOString(),
          },
        }).catch(() => {});
        return data as SupabaseTrackRow;
      }
    } catch {
      // Fallback local
    }
  }

  const localRow: SupabaseTrackRow = {
    id: `uuid-yt-${Date.now()}`,
    ...insertPayload,
    real_plays: 0,
    loop_plays_count: 0,
    likes_count: 0,
    total_listen_seconds: 0,
    listen_sessions: 0,
    avg_retention_pct: 0,
    created_at: new Date().toISOString(),
  };

  try {
    const existing = await getAllTracks();
    localStorage.setItem(
      LOCAL_STORAGE_TRACKS_KEY,
      JSON.stringify([localRow, ...existing])
    );
  } catch {
    // Ignore
  }

  broadcastLiveSync({
    type: 'TRACKS_UPDATED',
    payload: {
      action: 'CREATE',
      trackId: insertPayload.app_track_id,
      trackTitle: metadata.title.trim(),
      artist: metadata.artist?.trim(),
      message: `Nouveau flux YouTube : « ${metadata.title.trim()} »`,
      timestamp: new Date().toISOString(),
    },
  }).catch(() => {});

  return localRow;
}

/**
 * Met à jour une piste existante (notamment sa pochette, son titre ou ses crédits)
 * dans Supabase et en cache local.
 */
export async function updateTrackMetadataInStorage(
  appTrackId: string,
  updates: Partial<SupabaseTrackRow>
): Promise<void> {
  if (supabase) {
    try {
      const upsertRow = {
        app_track_id: appTrackId,
        title: updates.title || 'Titre DROP',
        artist: updates.artist || 'Artiste Gabon',
        stream_url: updates.stream_url || 'synth://drop-gabon',
        source_type: updates.source_type || 'file',
        audio_codec: 'OPUS',
        lufs_master_level: -14.0,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      await supabase
        .from('tracks')
        .upsert([upsertRow], { onConflict: 'app_track_id' });
    } catch {
      // Ignore
    }
  }

  try {
    const existing = await getAllTracks();
    const hasExisting = existing.some(
      (row) => row.app_track_id === appTrackId || row.id === appTrackId
    );
    const updated = hasExisting
      ? existing.map((row) =>
          row.app_track_id === appTrackId || row.id === appTrackId
            ? { ...row, ...updates }
            : row
        )
      : [
          {
            id: `uuid-edit-${Date.now()}`,
            app_track_id: appTrackId,
            title: updates.title || 'Titre DROP',
            artist: updates.artist || 'Artiste Gabon',
            source_type: 'file' as const,
            stream_url: updates.stream_url || 'synth://drop-gabon',
            audio_codec: 'OPUS' as const,
            lufs_master_level: -14.0,
            duration: updates.duration || 180,
            drop_start: updates.drop_start ?? 30,
            drop_duration: updates.drop_duration ?? 22,
            bpm: updates.bpm ?? null,
            real_plays: 0,
            loop_plays_count: 0,
            likes_count: 0,
            total_listen_seconds: 0,
            listen_sessions: 0,
            avg_retention_pct: 0,
            created_at: new Date().toISOString(),
            ...updates,
          } as SupabaseTrackRow,
          ...existing,
        ];
    localStorage.setItem(LOCAL_STORAGE_TRACKS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }

  broadcastLiveSync({
    type: 'TRACKS_UPDATED',
    payload: {
      action: 'UPDATE',
      trackId: appTrackId,
      trackTitle: updates.title,
      artist: updates.artist,
      message: `Piste « ${updates.title || appTrackId} » sauvegardée et synchronisée sur tous les appareils`,
      timestamp: new Date().toISOString(),
    },
  }).catch(() => {});
}

// ============================================================================
// 5. SUPPRIMER UNE MUSIQUE (Supprime de la BDD + des Buckets audio_files/cover_files)
// ============================================================================

export async function deleteTrack(track: {
  id?: string;
  app_track_id?: string;
  source_type?: 'file' | 'youtube';
  storage_path?: string | null;
  cover_storage_path?: string | null;
}): Promise<boolean> {
  if (supabase) {
    try {
      if (track.source_type === 'file' && track.storage_path) {
        await supabase.storage.from('audio_files').remove([track.storage_path]);
      }
      if (track.cover_storage_path) {
        await supabase.storage
          .from('cover_files')
          .remove([track.cover_storage_path]);
      }
      if (track.id) {
        await supabase.from('tracks').delete().eq('id', track.id);
      } else if (track.app_track_id) {
        await supabase
          .from('tracks')
          .delete()
          .eq('app_track_id', track.app_track_id);
      }
    } catch {
      // Ignore
    }
  }

  try {
    if (track.app_track_id) {
      await deleteAudioBlobFromIndexedDb(track.app_track_id);
    }
    if (track.id) {
      await deleteAudioBlobFromIndexedDb(track.id);
    }
    const existing = await getAllTracks();
    const filtered = existing.filter(
      (item) =>
        item.id !== track.id && item.app_track_id !== track.app_track_id
    );
    localStorage.setItem(LOCAL_STORAGE_TRACKS_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore
  }

  broadcastLiveSync({
    type: 'TRACKS_UPDATED',
    payload: {
      action: 'DELETE',
      trackId: track.app_track_id || track.id,
      message: 'Piste supprimée du catalogue',
      timestamp: new Date().toISOString(),
    },
  }).catch(() => {});

  return true;
}

// ============================================================================
// 6. SYNCHRONISATION DU RÉPERTOIRE DES MÉTIERS, PLAYLISTS & FAVORIS
// ============================================================================

export function loadStudioEntitiesFromStorage<T>(fallback: T): T {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ENTITIES_KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getStudioEntitiesFromCloud<T extends {
  artists: string[];
  labels: string[];
  beatmakers: string[];
  engineers: string[];
  lyricists: string[];
}>(fallback: T): Promise<T> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('studio_entities')
        .select('entity_type, name');
      if (!error && data && data.length > 0) {
        const artists: string[] = [];
        const labels: string[] = [];
        const beatmakers: string[] = [];
        const engineers: string[] = [];
        const lyricists: string[] = [];

        data.forEach((row: { entity_type: string; name: string }) => {
          if (row.entity_type === 'ARTIST') artists.push(row.name);
          else if (row.entity_type === 'LABEL') labels.push(row.name);
          else if (row.entity_type === 'BEATMAKER') beatmakers.push(row.name);
          else if (row.entity_type === 'ENGINEER') engineers.push(row.name);
          else if (row.entity_type === 'LYRICIST') lyricists.push(row.name);
        });

        const merged: T = {
          artists: Array.from(new Set([...fallback.artists, ...artists])),
          labels: Array.from(new Set([...fallback.labels, ...labels])),
          beatmakers: Array.from(new Set([...fallback.beatmakers, ...beatmakers])),
          engineers: Array.from(new Set([...fallback.engineers, ...engineers])),
          lyricists: Array.from(new Set([...fallback.lyricists, ...lyricists])),
        } as T;

        try {
          localStorage.setItem(LOCAL_STORAGE_ENTITIES_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      }
    } catch {
      // Fallback local
    }
  }
  return loadStudioEntitiesFromStorage(fallback);
}

export async function syncStudioEntities(entities: {
  artists: string[];
  labels: string[];
  beatmakers: string[];
  engineers: string[];
  lyricists: string[];
}): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_ENTITIES_KEY, JSON.stringify(entities));
  } catch {
    // Ignore
  }

  if (!supabase) return;

  const rows: StudioEntityRecord[] = [
    ...entities.artists.map((name) => ({
      entity_type: 'ARTIST' as const,
      name,
    })),
    ...entities.labels.map((name) => ({
      entity_type: 'LABEL' as const,
      name,
    })),
    ...entities.beatmakers.map((name) => ({
      entity_type: 'BEATMAKER' as const,
      name,
    })),
    ...entities.engineers.map((name) => ({
      entity_type: 'ENGINEER' as const,
      name,
    })),
    ...entities.lyricists.map((name) => ({
      entity_type: 'LYRICIST' as const,
      name,
    })),
  ];

  if (rows.length === 0) return;

  try {
    await supabase.from('studio_entities').upsert(rows, {
      onConflict: 'entity_type,name',
      ignoreDuplicates: true,
    });
    broadcastLiveSync({
      type: 'ENTITIES_UPDATED',
      payload: {
        message: 'Répertoire et crédits studio synchronisés',
        timestamp: new Date().toISOString(),
      },
    }).catch(() => {});
  } catch {
    // Ignore
  }
}

export async function deleteStudioEntityFromCloud(
  roleKey: 'artists' | 'labels' | 'beatmakers' | 'engineers' | 'lyricists',
  name: string
): Promise<void> {
  if (!supabase) return;
  const roleMap: Record<typeof roleKey, 'ARTIST' | 'LABEL' | 'BEATMAKER' | 'ENGINEER' | 'LYRICIST'> = {
    artists: 'ARTIST',
    labels: 'LABEL',
    beatmakers: 'BEATMAKER',
    engineers: 'ENGINEER',
    lyricists: 'LYRICIST',
  };
  try {
    await supabase
      .from('studio_entities')
      .delete()
      .eq('entity_type', roleMap[roleKey])
      .eq('name', name);
    broadcastLiveSync({
      type: 'ENTITIES_UPDATED',
      payload: {
        entityType: roleMap[roleKey],
        name,
        message: `« ${name} » retiré de la base de données`,
        timestamp: new Date().toISOString(),
      },
    }).catch(() => {});
  } catch {
    // Ignore
  }
}

export interface AdminGlobalConfigSnapshot {
  enableAwardsCeremony: boolean;
  categories: string[];
  albumOrderIds: string[];
  royaltySettings?: Record<string, unknown>;
  taxStatusOverrides?: Record<string, string>;
  updatedAt: string;
}

const LOCAL_ADMIN_GLOBAL_CONFIG_KEY = 'drop_admin_global_config_v1';

export function loadAdminGlobalConfigFromStorage(): AdminGlobalConfigSnapshot | null {
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_GLOBAL_CONFIG_KEY);
    return raw ? (JSON.parse(raw) as AdminGlobalConfigSnapshot) : null;
  } catch {
    return null;
  }
}

export async function getAdminGlobalConfigFromCloud(): Promise<AdminGlobalConfigSnapshot | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_library_state')
        .select('liked_track_ids, updated_at')
        .eq('user_id', 'GLOBAL_ADMIN_CONFIG_V1')
        .maybeSingle();
      if (!error && data && data.liked_track_ids && typeof data.liked_track_ids === 'object') {
        const snapshot = data.liked_track_ids as AdminGlobalConfigSnapshot;
        try {
          localStorage.setItem(LOCAL_ADMIN_GLOBAL_CONFIG_KEY, JSON.stringify(snapshot));
        } catch {}
        return snapshot;
      }
    } catch {
      // Fallback local
    }
  }
  return loadAdminGlobalConfigFromStorage();
}

export async function syncAdminGlobalConfigToCloud(
  snapshot: AdminGlobalConfigSnapshot,
  customMessage?: string
): Promise<void> {
  try {
    localStorage.setItem(LOCAL_ADMIN_GLOBAL_CONFIG_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore
  }

  if (supabase) {
    try {
      await supabase.from('user_library_state').upsert(
        [
          {
            user_id: 'GLOBAL_ADMIN_CONFIG_V1',
            liked_track_ids: snapshot,
            subscribed_artists: {},
            recommended_track_ids: {},
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id' }
      );
    } catch {
      // Ignore
    }
  }

  broadcastLiveSync({
    type: 'ADMIN_SETTINGS_UPDATED',
    payload: {
      enableAwardsCeremony: snapshot.enableAwardsCeremony,
      categories: snapshot.categories,
      albumOrderIds: snapshot.albumOrderIds,
      royaltySettings: snapshot.royaltySettings,
      taxStatusOverrides: snapshot.taxStatusOverrides,
      message:
        customMessage ||
        'Paramètres et configuration Admin sauvegardés et synchronisés sur tous les appareils.',
      timestamp: snapshot.updatedAt,
    },
  }).catch(() => {});
}

export async function getUserPlaylistsFromCloud(userId = 'usr-1') {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_playlists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map((pl: any) => ({
          id: pl.id,
          name: pl.name,
          colorTheme: pl.color_theme,
          iconType: pl.icon_type,
          trackIds: Array.isArray(pl.track_ids) ? pl.track_ids : [],
          createdAt: pl.created_at,
        }));
        try {
          localStorage.setItem(LOCAL_STORAGE_PLAYLISTS_KEY, JSON.stringify(mapped));
        } catch {}
        return mapped;
      }
    } catch {}
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLAYLISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function syncUserPlaylistsToCloud(
  playlists: {
    id: string;
    name: string;
    colorTheme: string;
    iconType?: string;
    trackIds: string[];
    createdAt?: string;
  }[],
  userId = 'usr-1'
): Promise<void> {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_PLAYLISTS_KEY,
      JSON.stringify(playlists)
    );
  } catch {
    // Ignore
  }

  if (!supabase) return;

  const rows = playlists.map((pl) => ({
    id: pl.id,
    user_id: userId,
    name: pl.name,
    color_theme: pl.colorTheme,
    icon_type: pl.iconType || 'DISC',
    track_ids: pl.trackIds,
    updated_at: new Date().toISOString(),
  }));

  if (rows.length > 0) {
    try {
      await supabase.from('user_playlists').upsert(rows, { onConflict: 'id' });
      broadcastLiveSync({
        type: 'PLAYLISTS_UPDATED',
        payload: {
          userId,
          message: 'Playlists synchronisées en direct',
          timestamp: new Date().toISOString(),
        },
      }).catch(() => {});
    } catch {
      // Ignore
    }
  }
}

export async function syncUserLibraryStateToCloud(
  state: UserLibraryStatePayload
): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_LIBRARY_KEY, JSON.stringify(state));
  } catch {
    // Ignore
  }

  if (!supabase) return;

  try {
    await supabase.from('user_library_state').upsert(
      [
        {
          user_id: state.user_id,
          liked_track_ids: state.liked_track_ids,
          subscribed_artists: state.subscribed_artists,
          recommended_track_ids: state.recommended_track_ids,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'user_id' }
    );
  } catch {
    // Ignore
  }
}

export function loadUserLibraryStateFromStorage(): UserLibraryStatePayload | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LIBRARY_KEY);
    return raw ? (JSON.parse(raw) as UserLibraryStatePayload) : null;
  } catch {
    return null;
  }
}

// ============================================================================
// 7. GESTION & PERSISTANCE DES BANNIÈRES PUBLICITAIRES SLIDESHOW (HAUT & BAS)
// ============================================================================

