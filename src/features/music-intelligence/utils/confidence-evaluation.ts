import type { AnalysisStatusType, BpmCandidate } from '../types/music-analysis.types';

export interface ConfidenceEvaluationInput {
  primaryProminence: number;
  secondPeakRatio: number;
  segmentBpms: number[];
  pulseRegularity: number;
}

export interface ConfidenceEvaluationOutput {
  confidence: number;
  segmentConsistencyPct: number;
  recommendedStatus: AnalysisStatusType;
  requiresHumanReview: boolean;
  reviewReason?: string;
}

/**
 * Évalue mathématiquement la fiabilité d'une détection BPM (inspiré d'Essentia RhythmExtractor2013 multifeature).
 * Bascule automatiquement en "needs_review" si la confiance est < 0.68 ou si les segments divergent.
 */
export function evaluateBpmConfidence(input: ConfidenceEvaluationInput): ConfidenceEvaluationOutput {
  const { primaryProminence, secondPeakRatio, segmentBpms, pulseRegularity } = input;
  const prominenceScore = Math.max(0, Math.min(1, (primaryProminence - 1.15) / 2.6));
  const separationScore = Math.max(0, Math.min(1, 1 - Math.max(0, secondPeakRatio - 0.55) * 1.4));

  let consistentPairs = 0, totalPairs = 0;
  for (let i = 0; i < segmentBpms.length; i++) {
    for (let j = i + 1; j < segmentBpms.length; j++) {
      totalPairs++;
      const a = segmentBpms[i], b = segmentBpms[j];
      const directDiff = Math.abs(a - b);
      const halfDiff = Math.min(Math.abs(a * 2 - b), Math.abs(a - b * 2));
      if (directDiff <= 2.2) consistentPairs += 1;
      else if (halfDiff <= 2.5) consistentPairs += 0.72;
    }
  }
  const segmentConsistency = totalPairs > 0 ? consistentPairs / totalPairs : 0.75;
  const segmentConsistencyPct = Math.round(segmentConsistency * 100);

  const rawConfidence =
    prominenceScore * 0.36 +
    separationScore * 0.2 +
    segmentConsistency * 0.26 +
    Math.max(0, Math.min(1, pulseRegularity)) * 0.18;
  const confidence = Math.round(Math.max(0.05, Math.min(0.99, rawConfidence)) * 100) / 100;

  if (confidence < 0.42) {
    return {
      confidence,
      segmentConsistencyPct,
      recommendedStatus: 'needs_review',
      requiresHumanReview: true,
      reviewReason: 'Rythme très libre, syncopé ou tempo variable : validation manuelle indispensable.',
    };
  }
  if (confidence < 0.68 || segmentConsistencyPct < 65) {
    return {
      confidence,
      segmentConsistencyPct,
      recommendedStatus: 'needs_review',
      requiresHumanReview: true,
      reviewReason: 'Ambiguïté possible demi-temps / double-temps (octave) : vérifiez les candidats proposés.',
    };
  }
  return { confidence, segmentConsistencyPct, recommendedStatus: 'completed', requiresHumanReview: false };
}

/**
 * Construit la liste des candidats BPM (Principal, Demi-temps, Double-temps, Subdivision 3:2)
 * sans jamais forcer aveuglément le BPM dans une plage rigide 70-170.
 */
export function buildOctaveAndHarmonicCandidates(primaryExactBpm: number, primaryScore: number): BpmCandidate[] {
  const cleanPrimary = Math.round(primaryExactBpm * 10) / 10;
  const roundedPrimary = Math.round(cleanPrimary);
  const candidates: BpmCandidate[] = [
    {
      bpm: roundedPrimary,
      exactBpm: cleanPrimary,
      relation: 'primary',
      score: Math.round(primaryScore * 100) / 100,
      label: `${roundedPrimary} BPM (Principal détecté)`,
    },
  ];

  const halfExact = Math.round(cleanPrimary * 0.5 * 10) / 10;
  if (halfExact >= 42) {
    candidates.push({
      bpm: Math.round(halfExact),
      exactBpm: halfExact,
      relation: 'half_time',
      score: Math.round(primaryScore * 0.78 * 100) / 100,
      label: `${Math.round(halfExact)} BPM (Half-Time ÷2)`,
    });
  }

  const doubleExact = Math.round(cleanPrimary * 2 * 10) / 10;
  if (doubleExact <= 240) {
    candidates.push({
      bpm: Math.round(doubleExact),
      exactBpm: doubleExact,
      relation: 'double_time',
      score: Math.round(primaryScore * 0.74 * 100) / 100,
      label: `${Math.round(doubleExact)} BPM (Double-Time ×2)`,
    });
  }

  const ternaryExact = cleanPrimary > 115 ? Math.round(((cleanPrimary * 2) / 3) * 10) / 10 : Math.round(((cleanPrimary * 3) / 2) * 10) / 10;
  if (ternaryExact >= 55 && ternaryExact <= 210) {
    candidates.push({
      bpm: Math.round(ternaryExact),
      exactBpm: ternaryExact,
      relation: 'ternary_equiv',
      score: Math.round(primaryScore * 0.62 * 100) / 100,
      label: `${Math.round(ternaryExact)} BPM (Subdivision 3:2 Polyrythmique)`,
    });
  }
  return candidates;
}
