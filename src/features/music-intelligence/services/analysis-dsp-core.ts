import type {
  AnalysisEngineMode,
  AnalysisHistoryEntry,
  TrackAnalysis,
} from '../types/music-analysis.types';
import {
  buildOctaveAndHarmonicCandidates,
  evaluateBpmConfidence,
} from '../utils/confidence-evaluation';
import { analyzeSegmentMultiBandBpm } from './bpm-analysis.service';
import {
  detectIntroAndOutroSections,
  extractBeatPositionsDynamicProgramming,
} from './beat-tracking.service';
import { detectMusicalKeyAndCamelot } from './key-detection.service';
import { computeCalibratedEnergyAndDanceability } from './energy-analysis.service';

export const MUSIC_INTELLIGENCE_ALGO_VERSION = 'essentia-multiband-v2.5-worker';

export interface SurgicalDspJobInput {
  segments: Float32Array[];
  sampleRate: number;
  offsetsSec: number[];
  durationSec: number;
  pcmMemoryMib: number;
  engineMode: AnalysisEngineMode;
  existingConfirmedBpm?: number | null;
  existingConfirmedKey?: string | null;
  previousHistory?: AnalysisHistoryEntry[];
  startedAtMs?: number;
}

/**
 * Noyau DSP pur et isomorphe (exécutable dans un Web Worker dédié ou côté Node/Test sans DOM).
 * Préserve systématiquement les validations humaines existantes et enrichit l'historique d'audit.
 */
export function runMultiSegmentSurgicalDsp(input: SurgicalDspJobInput): TrackAnalysis {
  const t0 = input.startedAtMs ?? Date.now();
  const { segments, sampleRate, offsetsSec, durationSec, pcmMemoryMib, engineMode } = input;

  const segmentResults = segments.map((seg) => analyzeSegmentMultiBandBpm(seg, sampleRate));
  const sortedByProminence = [...segmentResults].sort(
    (a, b) => b.primaryProminence - a.primaryProminence
  );
  const bestSeg = sortedByProminence[0];
  const bestSegIdx = Math.max(0, segmentResults.indexOf(bestSeg));
  const segmentBpms = segmentResults.map((r) => r.bestBpm);

  const beatTrack = extractBeatPositionsDynamicProgramming(
    bestSeg.onsetEnvelope,
    bestSeg.envelopeRateHz,
    bestSeg.bestBpm,
    offsetsSec[bestSegIdx] || 0,
    durationSec
  );

  const firstEnv = segmentResults[0]?.onsetEnvelope ?? bestSeg.onsetEnvelope;
  const lastEnv =
    segmentResults[segmentResults.length - 1]?.onsetEnvelope ?? bestSeg.onsetEnvelope;
  const { introEndSec, outroStartSec } = detectIntroAndOutroSections({
    firstSegmentEnvelope: firstEnv,
    lastSegmentEnvelope: lastEnv,
    envelopeRateHz: bestSeg.envelopeRateHz,
    durationSec,
    downbeatOffsetSec: beatTrack.downbeatOffsetSec,
    bpm: bestSeg.bestBpm,
  });

  const confEval = evaluateBpmConfidence({
    primaryProminence: bestSeg.primaryProminence,
    secondPeakRatio: bestSeg.secondPeakRatio,
    segmentBpms,
    pulseRegularity: beatTrack.pulseRegularity,
  });

  const keyInfo = detectMusicalKeyAndCamelot(segments[bestSegIdx], sampleRate);
  const energyInfo = computeCalibratedEnergyAndDanceability({
    samples: segments[bestSegIdx],
    onsetEnvelope: bestSeg.onsetEnvelope,
    pulseRegularity: beatTrack.pulseRegularity,
    bandSummary: bestSeg.bandSummary,
    detectedBpm: bestSeg.bestBpm,
  });

  const roundedDetectedBpm = Math.round(bestSeg.bestBpm);
  const candidates = buildOctaveAndHarmonicCandidates(bestSeg.bestBpm, confEval.confidence);
  const analyzedAt = new Date().toISOString();
  const processingTimeMs = Math.max(1, Math.round(Date.now() - t0));

  const historyEntry: AnalysisHistoryEntry = {
    analyzedAt,
    algorithmVersion: MUSIC_INTELLIGENCE_ALGO_VERSION,
    engineMode,
    detectedBpm: roundedDetectedBpm,
    bpmConfidence: confEval.confidence,
    detectedKey: keyInfo.detectedKey,
    processingTimeMs,
    pcmMemoryMib,
  };
  const analysisHistory = [...(input.previousHistory ?? []), historyEntry].slice(-8);

  return {
    detectedBpm: roundedDetectedBpm,
    exactDetectedBpm: bestSeg.bestBpm,
    confirmedBpm:
      input.existingConfirmedBpm ??
      (confEval.recommendedStatus === 'completed' ? roundedDetectedBpm : null),
    alternativeBpms: candidates,
    bpmConfidence: confEval.confidence,
    detectedKey: keyInfo.detectedKey,
    confirmedKey: input.existingConfirmedKey ?? keyInfo.detectedKey,
    camelotKey: keyInfo.camelotKey,
    mode: keyInfo.mode,
    energy: energyInfo.energy,
    danceability: energyInfo.danceability,
    beatPositions: beatTrack.beatPositions,
    downbeatOffsetSec: beatTrack.downbeatOffsetSec,
    introEndSec,
    outroStartSec,
    durationSec: Math.round(durationSec),
    multiBandSummary: bestSeg.bandSummary,
    segmentConsistencyPct: confEval.segmentConsistencyPct,
    pcmMemoryMib,
    processingTimeMs,
    analysisHistory,
    analysisStatus: confEval.recommendedStatus,
    failureReason: confEval.reviewReason || null,
    algorithmVersion: MUSIC_INTELLIGENCE_ALGO_VERSION,
    engineMode,
    analyzedAt,
  };
}

