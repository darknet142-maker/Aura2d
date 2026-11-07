import {
  optimizeForStorageUpload,
} from '../imageOptimizer';
import { broadcastLiveSync } from '../realtimeSync';
import { getPersistentAudioBlobUrl } from './audioIndexedDbAndOpus.service';
import {
  supabase,
  LOCAL_STORAGE_AD_BANNERS_KEY,
  LOCAL_STORAGE_AD_SETTINGS_KEY,
  fileToPersistentDataUrl,
  sanitizeStorageFileName,
  type AdBannerPlacement,
  type AdBannerRedirectType,
  type AdBannerSlide,
  type AdBannerSettings,
} from './supabaseCoreAndTypes';

function createDefaultVisualBannerSvgDataUrl(
  bgStart: string,
  bgMiddle: string,
  bgEnd: string,
  accentA: string,
  accentB: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="50%" stop-color="${bgMiddle}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </linearGradient>
      <radialGradient id="r1" cx="25%" cy="35%" r="55%">
        <stop offset="0%" stop-color="${accentA}" stop-opacity="0.72" />
        <stop offset="100%" stop-color="${accentA}" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="r2" cx="78%" cy="68%" r="52%">
        <stop offset="0%" stop-color="${accentB}" stop-opacity="0.68" />
        <stop offset="100%" stop-color="${accentB}" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#g)" />
    <rect width="1920" height="1080" fill="url(#r1)" />
    <rect width="1920" height="1080" fill="url(#r2)" />
    <circle cx="420" cy="540" r="390" fill="none" stroke="${accentA}" stroke-opacity="0.28" stroke-width="3" />
    <circle cx="420" cy="540" r="275" fill="none" stroke="${accentB}" stroke-opacity="0.34" stroke-width="6" />
    <circle cx="1500" cy="540" r="340" fill="none" stroke="${accentB}" stroke-opacity="0.28" stroke-width="3" />
    <path d="M 0 820 Q 480 460 960 720 T 1920 560 L 1920 1080 L 0 1080 Z" fill="${accentA}" fill-opacity="0.18" />
    <path d="M 0 920 Q 640 610 1240 860 T 1920 680 L 1920 1080 L 0 1080 Z" fill="${accentB}" fill-opacity="0.22" />
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_AD_BANNERS: AdBannerSlide[] = [
  {
    id: 'ad-slide-1',
    imageUrl: createDefaultVisualBannerSvgDataUrl(
      '#1a050d',
      '#4c0519',
      '#090d16',
      '#e11d38',
      '#f59e0b'
    ),
    fileName: 'banniere-studio-gabon-1.jpg',
    placement: 'BOTH',
    redirectType: 'TRACK',
    targetTrackId: 't-main-1',
    active: true,
    orderIndex: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ad-slide-2',
    imageUrl: createDefaultVisualBannerSvgDataUrl(
      '#042f2e',
      '#064e3b',
      '#090d16',
      '#10b981',
      '#f59e0b'
    ),
    fileName: 'banniere-afro-ntcham-2.jpg',
    placement: 'TOP',
    redirectType: 'ALBUM',
    targetAlbumId: 'alb-2',
    active: true,
    orderIndex: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ad-slide-3',
    imageUrl: createDefaultVisualBannerSvgDataUrl(
      '#1e1b4b',
      '#3b0764',
      '#090d16',
      '#a855f7',
      '#38bdf8'
    ),
    fileName: 'banniere-festival-lbv-3.jpg',
    placement: 'BOTTOM',
    redirectType: 'TRACK',
    targetTrackId: 't-201',
    active: true,
    orderIndex: 2,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_AD_BANNER_SETTINGS: AdBannerSettings = {
  enableTopBanner: true,
  enableBottomBanner: true,
  slideIntervalSec: 5,
  transitionDurationMs: 500,
  pauseOnTouch: true,
};

export function loadAdBannersFromStorage(): AdBannerSlide[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AD_BANNERS_KEY);
    if (!raw) return DEFAULT_AD_BANNERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdBannerSlide[]) : DEFAULT_AD_BANNERS;
  } catch {
    return DEFAULT_AD_BANNERS;
  }
}

export async function getAdBannersFromCloud(): Promise<AdBannerSlide[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ad_banners')
        .select('*')
        .order('order_index', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped: AdBannerSlide[] = data.map((row: any, idx: number) => ({
          id: row.id,
          imageUrl: row.image_url,
          fileName: row.file_name || undefined,
          placement: (row.placement as AdBannerPlacement) || 'BOTH',
          redirectType: (row.redirect_type as AdBannerRedirectType) || 'NONE',
          targetTrackId: row.target_track_id || undefined,
          targetAlbumId: row.target_album_id || undefined,
          externalUrl: row.external_url || undefined,
          active: row.active ?? true,
          orderIndex: row.order_index ?? idx,
          createdAt: row.created_at || new Date().toISOString(),
        }));
        try {
          localStorage.setItem(LOCAL_STORAGE_AD_BANNERS_KEY, JSON.stringify(mapped));
        } catch {}
        return mapped;
      }
    } catch {
      // Fallback local
    }
  }
  return loadAdBannersFromStorage();
}

export function loadAdBannerSettingsFromStorage(): AdBannerSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AD_SETTINGS_KEY);
    if (!raw) return DEFAULT_AD_BANNER_SETTINGS;
    return { ...DEFAULT_AD_BANNER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AD_BANNER_SETTINGS;
  }
}

export async function getAdBannerSettingsFromCloud(): Promise<AdBannerSettings> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ad_banner_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        const mapped: AdBannerSettings = {
          enableTopBanner: data.enable_top_banner ?? true,
          enableBottomBanner: data.enable_bottom_banner ?? true,
          slideIntervalSec: data.slide_interval_sec ?? 5,
          transitionDurationMs: data.transition_duration_ms ?? 500,
          pauseOnTouch: data.pause_on_touch ?? true,
        };
        try {
          localStorage.setItem(LOCAL_STORAGE_AD_SETTINGS_KEY, JSON.stringify(mapped));
        } catch {}
        return mapped;
      }
    } catch {
      // Fallback local
    }
  }
  return loadAdBannerSettingsFromStorage();
}

export async function syncAdBannersToCloud(
  banners: AdBannerSlide[],
  settings: AdBannerSettings
): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_AD_BANNERS_KEY, JSON.stringify(banners));
    localStorage.setItem(
      LOCAL_STORAGE_AD_SETTINGS_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Ignore quota errors
  }

  if (!supabase) return;

  try {
    const rows = banners.map((b, idx) => ({
      id: b.id,
      image_url: b.imageUrl,
      file_name: b.fileName || null,
      placement: b.placement,
      redirect_type: b.redirectType,
      target_track_id: b.targetTrackId || null,
      target_album_id: b.targetAlbumId || null,
      external_url: b.externalUrl || null,
      active: b.active,
      order_index: idx,
      updated_at: new Date().toISOString(),
    }));

    if (rows.length > 0) {
      await supabase.from('ad_banners').upsert(rows, { onConflict: 'id' });
      const { data: existingBanners } = await supabase
        .from('ad_banners')
        .select('id');
      if (existingBanners && existingBanners.length > 0) {
        const activeIds = new Set(rows.map((r) => r.id));
        const idsToDelete = existingBanners
          .map((eb: { id: string }) => eb.id)
          .filter((id: string) => !activeIds.has(id));
        if (idsToDelete.length > 0) {
          await supabase.from('ad_banners').delete().in('id', idsToDelete);
        }
      }
    } else {
      await supabase.from('ad_banners').delete().neq('id', '');
    }

    await supabase.from('ad_banner_settings').upsert(
      [
        {
          id: 'global',
          enable_top_banner: settings.enableTopBanner,
          enable_bottom_banner: settings.enableBottomBanner,
          slide_interval_sec: settings.slideIntervalSec,
          transition_duration_ms: settings.transitionDurationMs,
          pause_on_touch: settings.pauseOnTouch,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'id' }
    );

    broadcastLiveSync({
      type: 'BANNERS_UPDATED',
      payload: {
        banners,
        settings,
        message: 'Bannières publicitaires et réglages synchronisés en direct',
        timestamp: new Date().toISOString(),
      },
    }).catch(() => {});
  } catch {
    // Ignore
  }
}

// ============================================================================
// 8. SCRIPT SQL SUPABASE COMPLET PRÊT À COPIER-COLLER (TABLES + STORAGE + RLS)
// ============================================================================

export const SUPABASE_SQL_SETUP_SCRIPT = `-- ============================================================================
-- DROP (+241) — SCRIPT SQL SUPABASE COMPLET (TABLES + STORAGE + BANNIÈRES + RLS)
-- Standard Audio : OPUS (-14.0 LUFS) | Buckets : audio_files & cover_files
-- ============================================================================

-- Extension pour la génération d'UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. TABLE PRINCIPALE : public.tracks (Pistes Audio Opus & Liens YouTube)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_track_id TEXT UNIQUE,                                  -- Identifiant applicatif stable (ex: t-1730...)
    title TEXT NOT NULL,
    artist TEXT NOT NULL DEFAULT 'Artiste inconnu',
    featuring_artists TEXT[] DEFAULT '{}',                     -- Liste des artistes en featuring
    featuring_split_mode TEXT DEFAULT '70_30' CHECK (featuring_split_mode IN ('70_30', '50_50')),
    album TEXT DEFAULT 'Single',
    category TEXT DEFAULT 'Ntcham',                            -- Genre musical (Ntcham, Rap Gabonais, Afro-Club...)
    
    -- Crédits Studio & Ayants Droit
    label_name TEXT DEFAULT 'Indépendant',
    copyright_text TEXT DEFAULT '© DROP Music',
    beatmaker_name TEXT DEFAULT 'Beatmaker inconnu',
    sound_engineer_name TEXT DEFAULT 'Ingénieur du son',
    recording_engineer_name TEXT,
    mixing_engineer_name TEXT,
    mastering_engineer_name TEXT,
    lyricist_name TEXT DEFAULT '',
    is_external_lyricist BOOLEAN DEFAULT false,
    is_instrumental BOOLEAN DEFAULT false,                     -- Si true, parolier non requis

    -- Source Audio, Stockage & Standard Opus (-14.0 LUFS)
    source_type TEXT NOT NULL DEFAULT 'file' CHECK (source_type IN ('file', 'youtube')),
    stream_url TEXT NOT NULL,                                  -- URL publique du fichier .opus ou lien YouTube
    storage_path TEXT,                                         -- Chemin interne dans le bucket 'audio_files'
    youtube_id TEXT,                                           -- ID vidéo YouTube (11 caractères)
    audio_codec TEXT NOT NULL DEFAULT 'OPUS' CHECK (audio_codec IN ('OPUS', 'AAC', 'WAV')),
    lufs_master_level NUMERIC(4,1) NOT NULL DEFAULT -14.0,     -- Niveau de volume unifié obligatoire (-14.0 LUFS)

    -- Pochette & Habillage Visuel
    cover_url TEXT,                                            -- URL publique de la pochette (bucket 'cover_files' ou DataURL)
    cover_storage_path TEXT,                                   -- Chemin interne dans le bucket 'cover_files'
    ambient_primary TEXT DEFAULT '#f59e0b',
    ambient_secondary TEXT DEFAULT '#ef4444',

    -- Paramètres du Lecteur & du Drop Automatique
    duration INTEGER NOT NULL DEFAULT 180,                     -- Durée totale en secondes
    drop_start INTEGER NOT NULL DEFAULT 30,                    -- Point de départ du Drop en secondes
    drop_duration INTEGER NOT NULL DEFAULT 22,                 -- Durée de la boucle Drop (15s à 30s)
    bpm INTEGER DEFAULT NULL,                                  -- BPM chirurgical confirmé ou détecté (jamais de 120 fictif)
    track_analysis JSONB DEFAULT NULL,                         -- Fiche Music Intelligence complète (confiance, Camelot, beats, historique)
    lyrics JSONB DEFAULT '[]'::jsonb,                          -- Paroles synchronisées [{time, text}]

    -- Métriques d'écoutes, Likes & Fidélité
    real_plays BIGINT NOT NULL DEFAULT 0,
    loop_plays_count BIGINT NOT NULL DEFAULT 0,
    likes_count BIGINT NOT NULL DEFAULT 0,
    total_listen_seconds BIGINT NOT NULL DEFAULT 0,
    listen_sessions BIGINT NOT NULL DEFAULT 0,
    avg_retention_pct INTEGER NOT NULL DEFAULT 85,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON public.tracks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_category ON public.tracks (category);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON public.tracks (artist);

-- Migration idempotente Music Intelligence (zéro BPM 120 fictif + stockage JSONB)
ALTER TABLE public.tracks ALTER COLUMN bpm DROP NOT NULL;
ALTER TABLE public.tracks ALTER COLUMN bpm DROP DEFAULT;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS track_analysis JSONB DEFAULT NULL;

-- ----------------------------------------------------------------------------
-- 2. TABLE DU RÉPERTOIRE DES MÉTIERS : public.studio_entities
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.studio_entities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('ARTIST', 'LABEL', 'BEATMAKER', 'ENGINEER', 'LYRICIST', 'GENRE')),
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_studio_entity_type_name UNIQUE (entity_type, name)
);

CREATE INDEX IF NOT EXISTS idx_studio_entities_type ON public.studio_entities (entity_type, name);

-- ----------------------------------------------------------------------------
-- 3. TABLE DES PLAYLISTS UTILISATEURS : public.user_playlists
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_playlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'usr-1',
    name TEXT NOT NULL,
    color_theme TEXT NOT NULL DEFAULT '#e11d38',
    icon_type TEXT NOT NULL DEFAULT 'DISC',
    track_ids TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_playlists_user_id ON public.user_playlists (user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. TABLE DES FAVORIS, ABONNEMENTS & HISTORIQUE : public.user_library_state
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_library_state (
    user_id TEXT PRIMARY KEY,
    liked_track_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
    subscribed_artists JSONB NOT NULL DEFAULT '{}'::jsonb,
    recommended_track_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
    listening_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 5. TABLES DES BANNIÈRES PUBLICITAIRES SLIDESHOW (HAUT & BAS DE CENTRAL)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ad_banners (
    id TEXT PRIMARY KEY,
    image_url TEXT NOT NULL,
    file_name TEXT,
    placement TEXT NOT NULL DEFAULT 'BOTH' CHECK (placement IN ('TOP', 'BOTTOM', 'BOTH')),
    redirect_type TEXT NOT NULL DEFAULT 'NONE' CHECK (redirect_type IN ('NONE', 'TRACK', 'ALBUM', 'EXTERNAL')),
    target_track_id TEXT,
    target_album_id TEXT,
    external_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ad_banner_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    enable_top_banner BOOLEAN NOT NULL DEFAULT true,
    enable_bottom_banner BOOLEAN NOT NULL DEFAULT true,
    slide_interval_sec INTEGER NOT NULL DEFAULT 5,
    transition_duration_ms INTEGER NOT NULL DEFAULT 500,
    pause_on_touch BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 6. TABLE DU FIL COMMUN DES RECOMMANDATIONS & EXTRAITS : public.community_recommendations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_recommendations (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL,
    track_title TEXT NOT NULL,
    track_artist TEXT NOT NULL,
    track_category TEXT NOT NULL DEFAULT 'Ntcham',
    cover TEXT,
    user_id TEXT NOT NULL DEFAULT 'usr-1',
    user_name TEXT NOT NULL DEFAULT 'Membre DROP',
    user_avatar TEXT DEFAULT '',
    comment_or_lyric_excerpt TEXT,
    is_lyric_excerpt BOOLEAN NOT NULL DEFAULT false,
    lyricist_name TEXT,
    boost_points NUMERIC(4,2) NOT NULL DEFAULT 0.35,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_recommendations_created_at 
ON public.community_recommendations (created_at DESC);

-- ----------------------------------------------------------------------------
-- 7. BUCKETS SUPABASE STORAGE : 'audio_files' (Opus) & 'cover_files' (Pochettes/Bannières)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'audio_files', 
        'audio_files', 
        true, 
        52428800, 
        ARRAY['audio/ogg', 'audio/opus', 'audio/webm', 'audio/mpeg', 'audio/wav', 'audio/flac']
    ),
    (
        'cover_files', 
        'cover_files', 
        true, 
        10485760, 
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    )
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- 8. SÉCURITÉ ROW LEVEL SECURITY (RLS) — TABLES & STORAGE
-- ----------------------------------------------------------------------------
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_banner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acces complet aux pistes" ON public.tracks;
DROP POLICY IF EXISTS "Acces complet au repertoire metiers" ON public.studio_entities;
DROP POLICY IF EXISTS "Acces complet aux playlists" ON public.user_playlists;
DROP POLICY IF EXISTS "Acces complet aux favoris et ecoutes" ON public.user_library_state;
DROP POLICY IF EXISTS "Acces complet aux bannieres pub" ON public.ad_banners;
DROP POLICY IF EXISTS "Acces complet aux reglages bannieres" ON public.ad_banner_settings;
DROP POLICY IF EXISTS "Acces complet aux recommandations" ON public.community_recommendations;

CREATE POLICY "Acces complet aux pistes" ON public.tracks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces complet au repertoire metiers" ON public.studio_entities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces complet aux playlists" ON public.user_playlists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces complet aux favoris et ecoutes" ON public.user_library_state FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces complet aux bannieres pub" ON public.ad_banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces complet aux reglages bannieres" ON public.ad_banner_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acces complet aux recommandations" ON public.community_recommendations FOR ALL USING (true) WITH CHECK (true);

-- Politiques Storage pour 'audio_files' et 'cover_files'
DROP POLICY IF EXISTS "Lecture publique audio et pochettes" ON storage.objects;
DROP POLICY IF EXISTS "Upload public audio et pochettes" ON storage.objects;
DROP POLICY IF EXISTS "Modification publique audio et pochettes" ON storage.objects;
DROP POLICY IF EXISTS "Suppression publique audio et pochettes" ON storage.objects;

CREATE POLICY "Lecture publique audio et pochettes"
ON storage.objects FOR SELECT USING (bucket_id IN ('audio_files', 'cover_files'));

CREATE POLICY "Upload public audio et pochettes"
ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('audio_files', 'cover_files'));

CREATE POLICY "Modification publique audio et pochettes"
ON storage.objects FOR UPDATE USING (bucket_id IN ('audio_files', 'cover_files'));

CREATE POLICY "Suppression publique audio et pochettes"
ON storage.objects FOR DELETE USING (bucket_id IN ('audio_files', 'cover_files'));

-- ----------------------------------------------------------------------------
-- 9. TRIGGERS TEMPS RÉEL : ACTUALISATION AUTOMATIQUE DE updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_tracks_updated ON public.tracks;
CREATE TRIGGER on_tracks_updated
    BEFORE UPDATE ON public.tracks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_user_playlists_updated ON public.user_playlists;
CREATE TRIGGER on_user_playlists_updated
    BEFORE UPDATE ON public.user_playlists
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_user_library_state_updated ON public.user_library_state;
CREATE TRIGGER on_user_library_state_updated
    BEFORE UPDATE ON public.user_library_state
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_ad_banners_updated ON public.ad_banners;
CREATE TRIGGER on_ad_banners_updated
    BEFORE UPDATE ON public.ad_banners
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_ad_banner_settings_updated ON public.ad_banner_settings;
CREATE TRIGGER on_ad_banner_settings_updated
    BEFORE UPDATE ON public.ad_banner_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 10. ACTIVATION DE LA RÉPLICATION TEMPS RÉEL (SUPABASE REALTIME CDC)
-- ----------------------------------------------------------------------------
ALTER TABLE public.tracks REPLICA IDENTITY FULL;
ALTER TABLE public.studio_entities REPLICA IDENTITY FULL;
ALTER TABLE public.user_playlists REPLICA IDENTITY FULL;
ALTER TABLE public.user_library_state REPLICA IDENTITY FULL;
ALTER TABLE public.ad_banners REPLICA IDENTITY FULL;
ALTER TABLE public.ad_banner_settings REPLICA IDENTITY FULL;
ALTER TABLE public.community_recommendations REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tracks;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.studio_entities;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_playlists;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_library_state;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_banners;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_banner_settings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_recommendations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
`;

// ============================================================================
// 8. SYSTÈME DROP CONTENT ID (DROP-CID) & ANALYSE ACOUSTIQUE DES FORMES D'ONDE
// ============================================================================

/**
 * Génère une enveloppe d'onde déterministe de 64 bandes (normalisée entre 0.08 et 1.0)
 * pour chaque chanson existante du catalogue afin que toutes les pistes disposent d'une
 * empreinte acoustique de référence et d'un DROP-CID unique.
 */
export function computeDeterministicWaveformPeaks(
  seedStr: string,
  numBuckets = 64
): number[] {
  const cleanSeed = (seedStr || 'drop-241-default').trim().toLowerCase();
  let hash = 2166136261;
  for (let i = 0; i < cleanSeed.length; i++) {
    hash ^= cleanSeed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const peaks: number[] = [];
  for (let b = 0; b < numBuckets; b++) {
    const phase = (b / numBuckets) * Math.PI * 2;
    const h1 = Math.sin(phase * 2.5 + ((hash & 0xff) / 255) * 6.28);
    const h2 = Math.cos(phase * 5.0 + (((hash >> 8) & 0xff) / 255) * 6.28);
    const h3 = Math.sin(phase * 11.0 + (((hash >> 16) & 0xff) / 255) * 6.28);
    // Enveloppe énergétique typique d'un master avec montée sur le drop central
    const macroEnvelope =
      b < 6 ? 0.35 + (b / 6) * 0.45 : b > numBuckets - 6 ? 0.45 : 0.85;
    const raw =
      (0.5 + 0.25 * h1 + 0.15 * h2 + 0.1 * h3) * macroEnvelope;
    peaks.push(Number(Math.max(0.08, Math.min(1.0, raw)).toFixed(4)));
  }
  return peaks;
}

/**
 * Extrait les 64 bandes d'énergie RMS normalisées depuis un AudioBuffer décodé
 */
export function extractWaveformPeaksFromChannelData(
  channelData: Float32Array,
  numBuckets = 64
): number[] {
  if (!channelData || channelData.length === 0) {
    return computeDeterministicWaveformPeaks('empty-buffer', numBuckets);
  }
  const blockSize = Math.max(1, Math.floor(channelData.length / numBuckets));
  const rawRms: number[] = [];
  let maxVal = 0.0001;

  for (let b = 0; b < numBuckets; b++) {
    const start = b * blockSize;
    const end = Math.min(channelData.length, start + blockSize);
    const step = Math.max(1, Math.floor((end - start) / 512));
    let sumSq = 0;
    let count = 0;
    for (let i = start; i < end; i += step) {
      const sample = channelData[i];
      sumSq += sample * sample;
      count++;
    }
    const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
    rawRms.push(rms);
    if (rms > maxVal) maxVal = rms;
  }

  return rawRms.map((val) =>
    Number(Math.max(0.08, Math.min(1.0, val / maxVal)).toFixed(4))
  );
}

/**
 * Attribue un identifiant acoustique unique propre à DROP : DROP-CID-241-XXXXXXXX-XX
 * basé sur la signature de forme d'onde (64 points) et la durée.
 */
export function generateDropContentId(
  peaks: number[],
  durationSec: number,
  seedHint = ''
): string {
  const safePeaks =
    peaks && peaks.length > 0
      ? peaks
      : computeDeterministicWaveformPeaks(seedHint || 'drop-cid');
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;

  for (let i = 0; i < safePeaks.length; i++) {
    const quantized = Math.round(safePeaks[i] * 1000);
    h1 ^= quantized + i * 17;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= (quantized ^ (i * 31)) & 0xffff;
    h2 = Math.imul(h2, 0x01000193);
  }

  const durQuant = Math.round(Math.max(1, durationSec || 180));
  h1 ^= durQuant * 131;
  h1 = Math.imul(h1, 0x01000193);

  const hex1 = (h1 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const hex2 = ((h2 >>> 0) & 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `DROP-CID-241-${hex1}-${hex2}`;
}

export interface WaveformConcordanceResult {
  similarityPct: number;
  cosineSimilarityPct: number;
  envelopeCorrelationPct: number;
  durationProximityPct: number;
  metadataMatchBoost: number;
  isBlocked: boolean; // Bloqué dès >= 85% de concordance
}

/**
 * Vérification ultra-approfondie de la concordance entre deux formes d'onde sonores (64 bandes)
 * Combine :
 *  - Similarité Cosinus des vecteurs d'énergie (64 bandes)
 *  - Corrélation de profil dynamique (dérivée inter-bandes)
 *  - Proximité temporelle de durée
 *  - Identité exacte de titre/artiste ou de Content ID
 */
export function compareWaveformsConcordance(
  peaksA: number[],
  durA: number,
  peaksB: number[],
  durB: number,
  titleA = '',
  titleB = '',
  artistA = '',
  artistB = ''
): WaveformConcordanceResult {
  const len = Math.min(peaksA?.length || 0, peaksB?.length || 0);
  if (len === 0) {
    return {
      similarityPct: 0,
      cosineSimilarityPct: 0,
      envelopeCorrelationPct: 0,
      durationProximityPct: 0,
      metadataMatchBoost: 0,
      isBlocked: false,
    };
  }

  // 1. Similarité L1 / Distance moyenne par bande & Cosinus Centré
  let dot = 0;
  let normA = 0;
  let normB = 0;
  let sumAbsDiff = 0;

  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < len; i++) {
    meanA += peaksA[i];
    meanB += peaksB[i];
  }
  meanA /= len;
  meanB /= len;

  let covAB = 0;
  let varA = 0;
  let varB = 0;

  for (let i = 0; i < len; i++) {
    const a = peaksA[i];
    const b = peaksB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
    sumAbsDiff += Math.abs(a - b);

    const da = a - meanA;
    const db = b - meanB;
    covAB += da * db;
    varA += da * da;
    varB += db * db;
  }

  const rawCosine =
    normA > 0 && normB > 0 ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
  const meanAbsDiff = sumAbsDiff / len; // 0 = identique, ~0.35 = très différent
  const l1Similarity = Math.max(0, 1 - meanAbsDiff * 2.4);

  const pearsonR =
    varA > 0.00001 && varB > 0.00001
      ? covAB / (Math.sqrt(varA) * Math.sqrt(varB))
      : rawCosine;
  const normalizedPearson = Math.max(0, (pearsonR + 1) / 2);

  // Combinaison acoustique pure sur les 64 bandes d'onde
  const cosineSimilarityPct = Math.round(
    (l1Similarity * 0.65 + rawCosine * 0.35) * 100
  );
  const envelopeCorrelationPct = Math.round(
    (normalizedPearson * 0.7 + l1Similarity * 0.3) * 100
  );

  // 2. Proximité de durée
  const safeDurA = Math.max(1, durA || 180);
  const safeDurB = Math.max(1, durB || 180);
  const durDiffRatio =
    Math.abs(safeDurA - safeDurB) / Math.max(safeDurA, safeDurB);
  const durationProximityPct = Math.round(
    Math.max(0, 1 - durDiffRatio * 2.2) * 100
  );

  // 3. Vérification de doublon éditorial (Titre + Artiste identiques)
  const normText = (s: string) =>
    (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const cleanTitleA = normText(titleA);
  const cleanTitleB = normText(titleB);
  const cleanArtistA = normText(artistA);
  const cleanArtistB = normText(artistB);

  let metadataMatchBoost = 0;
  if (cleanTitleA.length >= 3 && cleanTitleA === cleanTitleB) {
    metadataMatchBoost =
      cleanArtistA && cleanArtistA === cleanArtistB ? 28 : 16;
  }

  // Score global de concordance d'onde
  const rawCombined =
    cosineSimilarityPct * 0.5 +
    envelopeCorrelationPct * 0.35 +
    durationProximityPct * 0.15 +
    metadataMatchBoost;

  const similarityPct = Math.min(
    100,
    Math.max(0, Math.round(meanAbsDiff < 0.005 && durDiffRatio < 0.02 ? 100 : rawCombined))
  );

  return {
    similarityPct,
    cosineSimilarityPct,
    envelopeCorrelationPct,
    durationProximityPct,
    metadataMatchBoost,
    isBlocked: similarityPct >= 85,
  };
}

// ============================================================================
// 9. GESTION ADMIN DE LA CÉRÉMONIE PÉRIODIQUE "AWARDS"
// ============================================================================

const AWARDS_CEREMONY_STORAGE_KEY = 'drop_241_awards_ceremony_enabled_v1';

export function loadAwardsCeremonyEnabledFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(AWARDS_CEREMONY_STORAGE_KEY);
    if (raw === null) return false; // Désactivé par défaut (activé uniquement périodiquement par l'Admin)
    return raw === 'true';
  } catch {
    return false;
  }
}

export function saveAwardsCeremonyEnabledToStorage(enabled: boolean): void {
  try {
    localStorage.setItem(AWARDS_CEREMONY_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage error
  }
}

// ============================================================================
// 10. TÉLÉCHARGEMENT DIRECT DES BEATS & INSTRUMENTALES (.WAV / .OPUS STUDIO)
// ============================================================================

/**
 * Synthétise un fichier WAV PCM 16-bit stéréo d'instrumentale studio (boucle rythmique + basse + accords)
 * lorsque le Beat du catalogue de démonstration n'a pas d'URL externe téléversée, ou télécharge
 * directement le fichier audio réel s'il a été importé dans l'application.
 */
export async function triggerBeatAudioDownload(track: {
  id?: string;
  title: string;
  artist: string;
  beatmakerName?: string;
  bpm?: number;
  audioUrl?: string;
  duration?: number;
  synthNotes?: number[];
  dropContentId?: string;
}): Promise<void> {
  const safeFileName = `${(track.title || 'Beat_Drop_241')
    .replace(/[^a-zA-Z0-9_-]/g, '_')}_${(
    track.beatmakerName ||
    track.artist ||
    'Prod'
  ).replace(/[^a-zA-Z0-9_-]/g, '_')}_${track.bpm || 120}BPM`;

  // 1. Si un fichier audio réel est attaché à la piste ou en cache local IndexedDB
  const resolvedUrl =
    track.audioUrl ||
    (track.id ? await getPersistentAudioBlobUrl(track.id) : null);
  if (resolvedUrl) {
    try {
      const response = await fetch(resolvedUrl);
      const blob = await response.blob();
      const ext =
        blob.type.includes('ogg') || blob.type.includes('opus')
          ? 'opus'
          : blob.type.includes('mpeg') || blob.type.includes('mp3')
            ? 'mp3'
            : 'wav';
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `${safeFileName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
      return;
    } catch {
      // Fallback sur la génération WAV studio ci-dessous
    }
  }

  // 2. Génération d'un master Beat WAV 44.1kHz 16-bit de 8 mesures calé sur le BPM de l'instrumentale
  const sampleRate = 44100;
  const bpm = Math.max(70, Math.min(180, track.bpm || 120));
  const beatDurSec = 60 / bpm;
  const totalSec = Math.min(16, Math.max(8, Math.round(beatDurSec * 16)));
  const numSamples = sampleRate * totalSec;
  const numChannels = 2;
  const bytesPerSample = 2;
  const dataSize = numSamples * numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beatPos = (t / beatDurSec) % 4;
    const stepInBeat = beatPos % 1;

    // Kick 808 profond sur les temps 1 et 2.5
    const isKick = beatPos < 0.45 || (beatPos >= 2.5 && beatPos < 2.95);
    const kickEnv = isKick ? Math.exp(-stepInBeat * 9.5) : 0;
    const kickFreq = 52 + 95 * Math.exp(-stepInBeat * 28);
    const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * 0.65;

    // Rimshot / Snare sur les temps 2 et 4
    const isSnare =
      (beatPos >= 1.0 && beatPos < 1.25) || (beatPos >= 3.0 && beatPos < 3.25);
    const snareEnv = isSnare ? Math.exp(-((beatPos % 1) * 18)) : 0;
    const noise = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const snare =
      (noise * 0.6 + Math.sin(2 * Math.PI * 210 * t) * 0.4) * snareEnv * 0.35;

    // Nappe mélodique Ntcham / Afro-Urbain
    const rootFreq = beatPos < 2 ? 110 : 98; // A2 -> G2
    const padL =
      (Math.sin(2 * Math.PI * rootFreq * t) +
        0.5 * Math.sin(2 * Math.PI * (rootFreq * 1.5) * t)) *
      0.18;
    const padR =
      (Math.sin(2 * Math.PI * (rootFreq * 1.003) * t) +
        0.5 * Math.sin(2 * Math.PI * (rootFreq * 1.25) * t)) *
      0.18;

    const sampleL = Math.max(-0.98, Math.min(0.98, kick + snare + padL));
    const sampleR = Math.max(-0.98, Math.min(0.98, kick + snare + padR));

    view.setInt16(offset, Math.round(sampleL * 32767), true);
    view.setInt16(offset + 2, Math.round(sampleR * 32767), true);
    offset += 4;
  }

  const wavBlob = new Blob([buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(wavBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFileName}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

