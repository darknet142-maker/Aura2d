export type EqFilterKind = 'lowshelf' | 'peaking' | 'highshelf';

export interface EqBandSpec {
  index: number;
  freqHz: number;
  freqLabel: string;
  roleLabel: string;
  filterType: EqFilterKind;
  defaultQ: number;
}

export type SpatialPresetId =
  | 'studio_nearfield'
  | 'binaural_headphone'
  | 'live_libreville'
  | 'club_sub_focus'
  | 'mono_check';

export interface SpatialPresetSpec {
  id: SpatialPresetId;
  name: string;
  description: string;
  stereoWidthPct: number; // 0% (Mono) -> 100% (Natif) -> 180% (Panoramique 3D)
  roomAmbiencePct: number; // 0% (Sec) -> 100% (Scène acoustique)
}

export interface SpatialAudioConfig {
  enabled: boolean;
  presetId: SpatialPresetId | 'custom';
  stereoWidthPct: number;
  roomAmbiencePct: number;
}

export interface PrecisionEqPreset {
  id: string;
  name: string;
  description: string;
  gains: [number, number, number, number, number];
  qFactors: [number, number, number, number, number];
  recommendedPreampDb: number;
  spatialPresetId: SpatialPresetId;
}

export type DefaultPlaybackStartMode = 'DROP_30S' | 'FULL_NONSTOP';
export type PlaybackChainingMode = 'CATALOGUE_NONSTOP' | 'ALBUM_ONLY' | 'STOP_AT_END';

export interface PlaybackEnginePrefs {
  defaultStartMode: DefaultPlaybackStartMode;
  chainingMode: PlaybackChainingMode;
  crossfadeSec: 0 | 2 | 4 | 6 | 8;
  bpmSyncCrossfade: boolean;
  autoTrimSilence: boolean;
}

export interface AudioSpectrumSnapshot {
  bins: Uint8Array;
  floatDbBins?: Float32Array;
  rmsDb: number;
  peakDb: number;
  gainReductionDb?: number;
  sampleRate?: number;
  fftSize?: number;
}
