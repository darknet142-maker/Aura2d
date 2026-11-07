export type AnalysisStatusType =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'needs_review'
  | 'failed';

export type MusicalMode = 'Major' | 'Minor';

export type AnalysisEngineMode =
  | 'ESSENTIA_MULTIBAND_DSP'
  | 'WEB_WORKER_MULTIBAND'
  | 'CLOUD_WORKER_HYBRID';

export interface BpmCandidate {
  bpm: number;
  exactBpm: number;
  relation: 'primary' | 'half_time' | 'double_time' | 'ternary_equiv';
  score: number;
  label: string;
}

export interface MultiBandEnergySummary {
  subBassKickPct: number; // 30 - 140 Hz
  lowMidGroovePct: number; // 140 - 600 Hz
  midTransientPct: number; // 600 - 3200 Hz
  highPercussionPct: number; // 3200 - 9000 Hz
}

export interface AnalysisHistoryEntry {
  analyzedAt: string;
  algorithmVersion: string;
  engineMode: AnalysisEngineMode;
  detectedBpm: number | null;
  bpmConfidence: number | null;
  detectedKey: string | null;
  processingTimeMs: number;
  pcmMemoryMib: number;
}

export interface TrackAnalysis {
  detectedBpm: number | null;
  exactDetectedBpm?: number | null;
  confirmedBpm: number | null;
  alternativeBpms: BpmCandidate[];
  bpmConfidence: number | null; // 0.00 -> 1.00
  detectedKey: string | null; // ex: "A minor"
  confirmedKey: string | null;
  camelotKey?: string | null; // ex: "8A"
  mode: MusicalMode | null;
  energy: number | null; // 0.00 -> 1.00
  danceability: number | null; // 0.00 -> 1.00
  beatPositions: number[]; // Secondes
  downbeatOffsetSec?: number;
  introEndSec?: number;
  outroStartSec?: number;
  durationSec: number;
  multiBandSummary?: MultiBandEnergySummary;
  segmentConsistencyPct?: number;
  pcmMemoryMib?: number;
  processingTimeMs?: number;
  analysisHistory?: AnalysisHistoryEntry[];
  analysisStatus: AnalysisStatusType;
  failureReason?: string | null;
  algorithmVersion: string;
  engineMode?: AnalysisEngineMode;
  analyzedAt: string | null;
  confirmedByHumanAt?: string | null;
}

export interface AudioValidationResult {
  valid: boolean;
  errorCode?:
    | 'EMPTY_FILE'
    | 'FILE_TOO_LARGE'
    | 'UNSUPPORTED_FORMAT'
    | 'DURATION_TOO_SHORT'
    | 'DURATION_TOO_LONG'
    | 'SILENT_OR_CORRUPTED';
  errorMessage?: string;
  fileSizeBytes: number;
  estimatedDurationSec?: number;
  rmsLevelDb?: number;
}

export interface DjTransitionCompatibility {
  targetTrackId: string;
  targetTitle: string;
  targetArtist: string;
  targetBpm: number;
  targetKey: string;
  bpmDeltaPct: number;
  pitchShiftPct: number;
  harmonicRelation: 'PERFECT_MATCH' | 'RELATIVE_KEY' | 'FIFTH_STEP' | 'ENERGY_BOOST' | 'DISSONANT';
  phaseOffsetMs: number;
  compatibilityScore: number; // 0 - 100
  recommendedCrossfadeSec: number;
  sourceOutroStartSec?: number;
  targetIntroEndSec?: number;
  phraseBars?: 4 | 8;
  energyDelta?: number;
}
