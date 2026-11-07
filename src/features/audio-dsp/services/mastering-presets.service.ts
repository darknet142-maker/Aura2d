import type {
  EqBandSpec,
  PlaybackEnginePrefs,
  PrecisionEqPreset,
  SpatialAudioConfig,
  SpatialPresetSpec,
} from '../types/audio-dsp.types';

export const DSP_BANDS_SPEC: EqBandSpec[] = [
  { index: 0, freqHz: 60, freqLabel: '60 Hz', roleLabel: 'Sub-Bass', filterType: 'lowshelf', defaultQ: 0.75 },
  { index: 1, freqHz: 250, freqLabel: '250 Hz', roleLabel: 'Corps Grave', filterType: 'peaking', defaultQ: 1.15 },
  { index: 2, freqHz: 1000, freqLabel: '1 kHz', roleLabel: 'Médiums', filterType: 'peaking', defaultQ: 1.2 },
  { index: 3, freqHz: 4000, freqLabel: '4 kHz', roleLabel: 'Présence', filterType: 'peaking', defaultQ: 1.35 },
  { index: 4, freqHz: 12000, freqLabel: '12 kHz', roleLabel: 'Air Ruban', filterType: 'highshelf', defaultQ: 0.75 },
];

export const SPATIAL_AUDIO_PRESETS: SpatialPresetSpec[] = [
  { id: 'studio_nearfield', name: 'Monitor Studio', description: 'Écoute de proximité neutre et précise', stereoWidthPct: 100, roomAmbiencePct: 6 },
  { id: 'binaural_headphone', name: 'Casque 3D Binaural', description: 'Élargissement Mid/Side et recul anti-fatigue au casque', stereoWidthPct: 136, roomAmbiencePct: 26 },
  { id: 'live_libreville', name: 'Scène Live +241', description: 'Grande ouverture panoramique et réflexions chaudes de salle', stereoWidthPct: 158, roomAmbiencePct: 52 },
  { id: 'club_sub_focus', name: 'Club Sub-Focus', description: 'Sub-basses <180 Hz 100% mono tendues et percussions larges', stereoWidthPct: 128, roomAmbiencePct: 32 },
  { id: 'mono_check', name: 'Contrôle Mono', description: 'Sommation L+R stricte pour vérifier la phase club/radio', stereoWidthPct: 0, roomAmbiencePct: 0 },
];

export const PRECISION_EQ_PRESETS: PrecisionEqPreset[] = [
  { id: 'flat', name: 'Neutre Mastering', description: 'Référence bit-transparente 0.0 dB fidèle au master -14 LUFS', gains: [0, 0, 0, 0, 0], qFactors: [0.71, 1.0, 1.0, 1.0, 0.71], recommendedPreampDb: 0, spatialPresetId: 'studio_nearfield' },
  { id: 'drop-signature', name: 'DROP Signature', description: 'Assise sub 60 Hz contrôlée, creux anti-boue 1 kHz et air 12 kHz', gains: [4.6, 1.4, -1.5, 2.4, 3.8], qFactors: [0.82, 1.4, 1.85, 1.3, 0.78], recommendedPreampDb: -2.4, spatialPresetId: 'binaural_headphone' },
  { id: 'afro-ntcham-241', name: 'Afro-Ntcham +241', description: 'Impact kick 60 Hz tendu, attaque percussions 4 kHz & brillance', gains: [5.4, 1.8, -1.8, 3.2, 4.0], qFactors: [0.88, 1.55, 2.1, 1.45, 0.76], recommendedPreampDb: -3.0, spatialPresetId: 'club_sub_focus' },
  { id: 'amapiano-logdrum', name: 'Log-Drum & Sub', description: 'Fondamentale 60 Hz profonde + harmonique 250 Hz articulée', gains: [6.6, 3.2, -2.4, 1.6, 2.8], qFactors: [0.92, 1.7, 2.35, 1.3, 0.75], recommendedPreampDb: -3.8, spatialPresetId: 'club_sub_focus' },
  { id: 'ndombolo-sebene', name: 'Sebene Cristal', description: 'Guitares ciselées 1–4 kHz, caisse claire vive et grave dégraissé', gains: [2.2, -1.4, 2.0, 4.2, 3.4], qFactors: [0.75, 1.9, 1.35, 1.6, 0.82], recommendedPreampDb: -2.2, spatialPresetId: 'live_libreville' },
  { id: 'vocal-ribbon', name: 'Voix Studio Ruban', description: 'Présence vocale soyeuse, grave nettoyé et sibilances maîtrisées', gains: [-1.8, 0.8, 3.0, 3.6, 2.0], qFactors: [0.71, 1.35, 1.15, 1.25, 0.74], recommendedPreampDb: -1.8, spatialPresetId: 'studio_nearfield' },
  { id: 'hifi-harman', name: 'Hi-Fi Audiophile', description: 'Courbe cible Harman équilibrée haute résolution', gains: [3.2, 0.6, -0.8, 2.0, 3.4], qFactors: [0.71, 1.1, 1.6, 1.15, 0.71], recommendedPreampDb: -1.6, spatialPresetId: 'binaural_headphone' },
  { id: 'surgical-debox', name: 'Anti-Résonance Q', description: 'Encoches Q étroites à 250 Hz / 1 kHz supprimant l’effet boîte', gains: [1.8, -3.8, -2.2, 1.8, 2.2], qFactors: [0.78, 4.4, 3.6, 1.4, 0.75], recommendedPreampDb: -0.6, spatialPresetId: 'studio_nearfield' },
  { id: 'late-night-lounge', name: 'Écoute Nocturne', description: 'Contour physiologique doux à bas volume sans agressivité', gains: [2.8, 1.2, -2.0, -1.2, 1.6], qFactors: [0.71, 1.0, 1.25, 1.5, 0.71], recommendedPreampDb: -1.2, spatialPresetId: 'binaural_headphone' },
];

const PLAYBACK_PREFS_KEY = 'drop_playback_engine_prefs_v1';
const SPATIAL_PREFS_KEY = 'drop_spatial_dsp_prefs_v1';

export const DEFAULT_PLAYBACK_PREFS: PlaybackEnginePrefs = {
  defaultStartMode: 'DROP_30S',
  chainingMode: 'CATALOGUE_NONSTOP',
  crossfadeSec: 0,
  bpmSyncCrossfade: true,
  autoTrimSilence: true,
};

export const DEFAULT_SPATIAL_CONFIG: SpatialAudioConfig = {
  enabled: true,
  presetId: 'studio_nearfield',
  stereoWidthPct: 100,
  roomAmbiencePct: 6,
};

export function loadSavedPlaybackPrefs(): PlaybackEnginePrefs {
  try {
    const raw = window.localStorage.getItem(PLAYBACK_PREFS_KEY);
    return raw ? { ...DEFAULT_PLAYBACK_PREFS, ...(JSON.parse(raw) as Partial<PlaybackEnginePrefs>) } : DEFAULT_PLAYBACK_PREFS;
  } catch {
    return DEFAULT_PLAYBACK_PREFS;
  }
}

export function savePlaybackPrefs(prefs: PlaybackEnginePrefs): void {
  try {
    window.localStorage.setItem(PLAYBACK_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore
  }
}

export function loadSavedSpatialConfig(): SpatialAudioConfig {
  try {
    const raw = window.localStorage.getItem(SPATIAL_PREFS_KEY);
    return raw ? { ...DEFAULT_SPATIAL_CONFIG, ...(JSON.parse(raw) as Partial<SpatialAudioConfig>) } : DEFAULT_SPATIAL_CONFIG;
  } catch {
    return DEFAULT_SPATIAL_CONFIG;
  }
}

export function saveSpatialConfig(cfg: SpatialAudioConfig): void {
  try {
    window.localStorage.setItem(SPATIAL_PREFS_KEY, JSON.stringify(cfg));
  } catch {
    // Ignore
  }
}
