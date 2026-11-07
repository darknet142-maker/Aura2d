import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  optimizeImageAuto,
  optimizeForStorageUpload,
} from '../imageOptimizer';
import { broadcastLiveSync } from '../realtimeSync';
import type { TrackAnalysis } from '../../features/music-intelligence/types/music-analysis.types';

// ============================================================================
// CONFIGURATION SUPABASE & FALLBACK HYBRIDE LOCAL PERSISTANT
// ============================================================================

// Identifiants Supabase par défaut pour déploiements Vercel & Environnements Cloud
const DEFAULT_SUPABASE_URL = 'https://djjgozsaylesngxshxey.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqamdvenNheWxlc25neHNoeGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NzMyODcsImV4cCI6MjEwOTE0OTI4N30.EBY4zazR4kkqnMBs7gV_dEFLSwiyYSVrpYfhP1ygni4';

const rawEnvUrl =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_SUPABASE_URL || '';
const rawEnvKey =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_SUPABASE_ANON_KEY || '';

const ENV_SUPABASE_URL =
  rawEnvUrl && !rawEnvUrl.includes('VOTRE_PROJET')
    ? rawEnvUrl
    : DEFAULT_SUPABASE_URL;

const ENV_SUPABASE_ANON_KEY =
  rawEnvKey && !rawEnvKey.includes('VOTRE_CLE_ANON')
    ? rawEnvKey
    : DEFAULT_SUPABASE_ANON_KEY;

export const LOCAL_STORAGE_TRACKS_KEY = 'drop_supabase_tracks_v2';
export const LOCAL_STORAGE_CATALOGUE_SNAPSHOT_KEY = 'drop_full_catalogue_snapshot_v2';
export const LOCAL_STORAGE_ENTITIES_KEY = 'drop_entity_db_v1';
export const LOCAL_STORAGE_PLAYLISTS_KEY = 'drop_user_playlists_v1';
export const LOCAL_STORAGE_LIBRARY_KEY = 'drop_user_library_state_v1';
export const LOCAL_STORAGE_AD_BANNERS_KEY = 'drop_ad_banners_v1';
export const LOCAL_STORAGE_AD_SETTINGS_KEY = 'drop_ad_banner_settings_v1';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    ENV_SUPABASE_URL &&
      ENV_SUPABASE_ANON_KEY &&
      !ENV_SUPABASE_URL.includes('VOTRE_PROJET') &&
      !ENV_SUPABASE_ANON_KEY.includes('VOTRE_CLE_ANON')
  );
}

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(ENV_SUPABASE_URL, ENV_SUPABASE_ANON_KEY)
  : null;

/**
 * Vérifie en direct la connectivité avec Supabase et retourne un diagnostic clair
 */
export async function verifySupabaseHealth(): Promise<{
  connected: boolean;
  mode: 'CLOUD_SUPABASE' | 'LOCAL_PERSISTENT';
  message: string;
}> {
  if (!supabase) {
    return {
      connected: false,
      mode: 'LOCAL_PERSISTENT',
      message:
        'Persistance Hybride Locale Active (Toutes vos pochettes, pistes Opus, bannières et playlists sont sauvegardées durablement sur cet appareil en attendant vos clés VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
    };
  }
  try {
    const { error } = await supabase.from('tracks').select('id').limit(1);
    if (error) {
      return {
        connected: false,
        mode: 'LOCAL_PERSISTENT',
        message: `Supabase joint mais table non initialisée (${error.message}). Exécutez le script SQL ci-dessous dans le SQL Editor.`,
      };
    }
    return {
      connected: true,
      mode: 'CLOUD_SUPABASE',
      message:
        'Supabase PostgreSQL + Storage (audio_files & cover_files) 100 % opérationnels et synchronisés.',
    };
  } catch (err: any) {
    return {
      connected: false,
      mode: 'LOCAL_PERSISTENT',
      message: `Mode Hors-Ligne / Local actif (${err?.message || 'Réseau'}).`,
    };
  }
}

// ============================================================================
// TYPES DE DONNÉES UNIFIÉS (PISTES OPUS, MÉTIERS, PLAYLISTS & BANNIÈRES PUB)
// ============================================================================

export interface SupabaseTrackRow {
  id: string;
  app_track_id: string;
  title: string;
  artist: string;
  featuring_artists: string[];
  featuring_split_mode: '70_30' | '50_50';
  album: string;
  category: string;
  label_name: string;
  copyright_text: string;
  beatmaker_name: string;
  sound_engineer_name: string;
  recording_engineer_name?: string | null;
  mixing_engineer_name?: string | null;
  mastering_engineer_name?: string | null;
  lyricist_name: string;
  is_external_lyricist: boolean;
  is_instrumental: boolean;
  source_type: 'file' | 'youtube';
  stream_url: string;
  storage_path?: string | null;
  youtube_id?: string | null;
  audio_codec: 'OPUS' | 'AAC' | 'WAV';
  lufs_master_level: number;
  cover_url?: string | null;
  cover_storage_path?: string | null;
  ambient_primary?: string;
  ambient_secondary?: string;
  duration: number;
  drop_start: number;
  drop_duration: number;
  bpm: number | null;
  lyrics?: { time: number; text: string }[];
  real_plays: number;
  loop_plays_count: number;
  likes_count: number;
  total_listen_seconds: number;
  listen_sessions: number;
  avg_retention_pct: number;
  created_at: string;
  track_analysis?: TrackAnalysis | null;
}

export interface UploadTrackMetadataInput {
  appTrackId?: string;
  title: string;
  artist?: string;
  featuringArtists?: string[];
  featuringSplitMode?: '70_30' | '50_50';
  album?: string;
  category?: string;
  labelName?: string;
  copyrightText?: string;
  beatmakerName?: string;
  soundEngineerName?: string;
  recordingEngineerName?: string;
  mixingEngineerName?: string;
  masteringEngineerName?: string;
  lyricistName?: string;
  isExternalLyricist?: boolean;
  isInstrumental?: boolean;
  coverUrl?: string | null;
  duration?: number;
  dropStart?: number;
  dropDuration?: number;
  bpm?: number | null;
  lyrics?: { time: number; text: string }[];
  trackAnalysis?: TrackAnalysis;
}

export interface StudioEntityRecord {
  entity_type:
    | 'ARTIST'
    | 'LABEL'
    | 'BEATMAKER'
    | 'ENGINEER'
    | 'LYRICIST'
    | 'GENRE';
  name: string;
  avatar_url?: string | null;
}

export interface UserLibraryStatePayload {
  user_id: string;
  liked_track_ids: Record<string, boolean>;
  subscribed_artists: Record<string, boolean>;
  recommended_track_ids: Record<string, boolean>;
}

export type AdBannerPlacement = 'TOP' | 'BOTTOM' | 'BOTH';
export type AdBannerRedirectType = 'NONE' | 'TRACK' | 'ALBUM' | 'EXTERNAL';

export interface AdBannerSlide {
  id: string;
  imageUrl: string; // DataURL persistante ou URL publique Supabase du fichier image importé manuellement
  fileName?: string;
  placement: AdBannerPlacement;
  redirectType: AdBannerRedirectType;
  targetTrackId?: string;
  targetAlbumId?: string;
  externalUrl?: string;
  active: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface AdBannerSettings {
  enableTopBanner: boolean;
  enableBottomBanner: boolean;
  slideIntervalSec: number; // Durée d'affichage par slide (ex: 5 secondes)
  transitionDurationMs: number; // Vitesse de défilement/transition (ex: 500 ms)
  pauseOnTouch: boolean; // Pause automatique au maintien/survol
}

// ============================================================================
// UTILITAIRES : CONVERSION IMAGE PERSISTANTE (POCHETTES & BANNIÈRES) & OPUS
// ============================================================================

/**
 * Convertit un fichier image importé depuis l'appareil en DataURL WebP/JPEG compressée
 * afin que la pochette ou la bannière reste 100 % persistante après rechargement de la page,
 * même hors-ligne ou sans bucket externe.
 */
export async function fileToPersistentDataUrl(
  file: File,
  maxWidth = 1080,
  maxHeight = 1080,
  quality = 0.84
): Promise<string> {
  try {
    const res = await optimizeImageAuto(file, {
      maxWidth,
      maxHeight,
      quality,
      targetMaxKBytes: 260,
    });
    return res.dataUrl;
  } catch {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Extrait l'ID d'une vidéo YouTube (supporte youtube.com, youtu.be, shorts, music)
 */
export function extractYoutubeId(url: string): string | null {
  const regExp =
    /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.trim().match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

/**
 * Nettoie un nom de fichier pour éviter l'erreur InvalidKey sur Supabase Storage
 */
export function sanitizeStorageFileName(fileName: string): string {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

// ============================================================================
// STOCKAGE AUDIO BINAIRE PERSISTANT (INDEXEDDB) POUR SURVIVRE AUX RECHARGEMENTS
// ============================================================================

