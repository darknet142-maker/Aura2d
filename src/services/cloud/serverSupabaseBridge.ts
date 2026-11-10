import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Track } from '../../shared/types/domain.types';

const SUPABASE_URL = 'https://djjgozsaylesngxshxey.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqamdvenNheWxlc25neHNoeGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NzMyODcsImV4cCI6MjEwOTE0OTI4N30.EBY4zazR4kkqnMBs7gV_dEFLSwiyYSVrpYfhP1ygni4';

let cachedClient: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient;
  if (typeof (globalThis as any).__filename === 'undefined') (globalThis as any).__filename = '';
  cachedClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    global: { fetch: globalThis.fetch },
  });
  return cachedClient;
}

export function mapSupabaseRowToTrack(r: any): Track {
  const trackId = String(r.app_track_id || r.id);
  const dur = Number(r.duration || 180);
  const dStart = Number(r.drop_start ?? 30);
  const dDuration = Number(r.drop_duration ?? 22);

  return {
    id: trackId,
    title: String(r.title || 'Titre inconnu'),
    artist: String(r.artist || 'Artiste inconnu'),
    featuringArtists: Array.isArray(r.featuring_artists) && r.featuring_artists.length > 0 ? r.featuring_artists : undefined,
    featuringSplitMode: r.featuring_split_mode || '70_30',
    album: String(r.album || 'Single'),
    category: String(r.category || 'Ntcham'),
    labelName: String(r.label_name || 'Indépendant'),
    copyrightText: String(r.copyright_text || `© 2026 ${r.label_name || 'DROP'}`),
    beatmakerName: String(r.beatmaker_name || r.artist || 'Beatmaker'),
    soundEngineerName: String(r.sound_engineer_name || 'Maître Boussengui (Studio K)'),
    recordingEngineerName: r.recording_engineer_name || undefined,
    mixingEngineerName: r.mixing_engineer_name || r.sound_engineer_name || undefined,
    masteringEngineerName: r.mastering_engineer_name || undefined,
    lyricistName: String(r.lyricist_name || r.artist || 'Parolier'),
    isExternalLyricist: Boolean(r.is_external_lyricist),
    isInstrumental: Boolean(r.is_instrumental),
    audioCodec: r.audio_codec || 'OPUS',
    lufsMasterLevel: Number(r.lufs_master_level ?? -14.0),
    cover: String(r.cover_url || ''),
    artworkType: 'creative_yellow',
    ambientPrimary: r.ambient_primary || '#f59e0b',
    ambientSecondary: r.ambient_secondary || '#ef4444',
    duration: dur,
    dropStart: Math.min(dStart, Math.max(0, dur - 10)),
    dropDuration: Math.min(dDuration, Math.max(5, dur - dStart)),
    baseFreq: 120,
    bpm: r.bpm != null ? Number(r.bpm) : 100,
    trackAnalysis: r.track_analysis ?? undefined,
    audioUrl: r.stream_url || undefined,
    externalStreamId: r.source_type === 'youtube' ? r.youtube_id || undefined : undefined,
    realPlays: Number(r.real_plays || 100000),
    lastActivityAgo: 'Synchronisé Supabase',
    totalListenSeconds: Number(r.total_listen_seconds || 180000),
    listenSessions: Number(r.listen_sessions || 1200),
    avgRetentionPct: Number(r.avg_retention_pct || 89),
    retention30sPct: 92,
    algoPoints: 14.5,
    likesCount: Number(r.likes_count || 1200),
    loopPlaysCount: Number(r.loop_plays_count || 300),
    recommendationsCount: 150,
    lyricsOpensCount: 900,
    lyricsSharesCount: 180,
    longevityDays: 15,
    consecutiveLoops: 0,
    baselineRank: 5,
    waveformPeaks: Array.isArray(r.waveform_peaks) && r.waveform_peaks.length > 0 ? r.waveform_peaks : [],
    dropContentId: `CID-${trackId}`,
    isBeatDownloadable: Boolean(r.is_instrumental),
    lyrics: Array.isArray(r.lyrics) ? r.lyrics : [],
  };
}

export async function fetchSupabaseTracks(): Promise<Track[]> {
  try {
    const sb = getServerSupabase();
    const { data, error } = await sb.from('tracks').select('*').order('created_at', { ascending: false });
    return (!error && data) ? data.map(mapSupabaseRowToTrack) : [];
  } catch {
    return [];
  }
}

export async function upsertTrackToSupabase(track: Track): Promise<boolean> {
  try {
    const sb = getServerSupabase();
    const payload = {
      app_track_id: track.id,
      title: track.title,
      artist: track.artist,
      featuring_artists: track.featuringArtists || [],
      featuring_split_mode: track.featuringSplitMode || '70_30',
      album: track.album || 'Single',
      category: track.category || 'Ntcham',
      label_name: track.labelName || 'Indépendant',
      copyright_text: track.copyrightText || `© 2026 ${track.labelName || 'DROP'}`,
      beatmaker_name: track.beatmakerName || track.artist,
      sound_engineer_name: track.soundEngineerName || 'Maître Boussengui (Studio K)',
      recording_engineer_name: track.recordingEngineerName || null,
      mixing_engineer_name: track.mixingEngineerName || null,
      mastering_engineer_name: track.masteringEngineerName || null,
      lyricist_name: track.lyricistName || track.artist,
      is_external_lyricist: Boolean(track.isExternalLyricist),
      is_instrumental: Boolean(track.isInstrumental),
      source_type: 'file',
      stream_url: track.audioUrl || '',
      cover_url: track.cover || null,
      duration: track.duration,
      drop_start: track.dropStart,
      drop_duration: track.dropDuration,
      bpm: track.bpm ?? null,
      waveform_peaks: track.waveformPeaks || [],
      lyrics: track.lyrics || [],
    };
    const { error } = await sb.from('tracks').upsert(payload, { onConflict: 'app_track_id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteTrackFromSupabase(trackId: string): Promise<boolean> {
  try {
    const sb = getServerSupabase();
    const { error } = await sb.from('tracks').delete().or(`app_track_id.eq.${trackId},id.eq.${trackId}`);
    return !error;
  } catch {
    return false;
  }
}

