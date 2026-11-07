export interface BeatTrackingResult {
  beatPositions: number[]; // Secondes sur la durée du morceau
  downbeatOffsetSec: number;
  pulseRegularity: number; // 0..1
}

/**
 * Programmation dynamique de suivi des battements (formulation Ellis 2007 / Librosa beat_track).
 * Maximise la force d'attaque O[n] tout en pénalisant les écarts à la période T0 :
 * C[n] = O[n] + max_{tau} ( C[n - tau] - alpha * (ln(tau / T0))^2 )
 */
export function extractBeatPositionsDynamicProgramming(
  onsetEnvelope: Float32Array,
  envelopeRateHz: number,
  detectedBpm: number,
  segmentOffsetSec: number,
  fullTrackDurationSec: number
): BeatTrackingResult {
  const nFrames = onsetEnvelope.length;
  if (nFrames < 8 || detectedBpm <= 0 || envelopeRateHz <= 0) {
    return { beatPositions: [], downbeatOffsetSec: 0, pulseRegularity: 0 };
  }

  const targetPeriodFrames = (60 / detectedBpm) * envelopeRateHz;
  const minLag = Math.max(2, Math.floor(targetPeriodFrames * 0.65));
  const maxLag = Math.max(minLag + 2, Math.ceil(targetPeriodFrames * 1.45));
  const tightnessAlpha = 180;

  const cumScore = new Float32Array(nFrames);
  const backlink = new Int32Array(nFrames).fill(-1);

  for (let i = 0; i < nFrames; i++) {
    let bestPrevScore = 0;
    let bestPrevIdx = -1;
    for (let lag = minLag; lag <= maxLag; lag++) {
      const prevIdx = i - lag;
      if (prevIdx < 0) break;
      const logDev = Math.log(lag / targetPeriodFrames);
      const candidate = cumScore[prevIdx] - tightnessAlpha * logDev * logDev;
      if (bestPrevIdx === -1 || candidate > bestPrevScore) {
        bestPrevScore = candidate;
        bestPrevIdx = prevIdx;
      }
    }
    cumScore[i] = onsetEnvelope[i] + (bestPrevIdx >= 0 ? bestPrevScore : 0);
    backlink[i] = bestPrevIdx;
  }

  let curIdx = nFrames - 1;
  let maxEndScore = -Infinity;
  for (let i = Math.max(0, nFrames - maxLag); i < nFrames; i++) {
    if (cumScore[i] > maxEndScore) {
      maxEndScore = cumScore[i];
      curIdx = i;
    }
  }

  const localBeatFrames: number[] = [];
  while (curIdx >= 0) {
    localBeatFrames.push(curIdx);
    curIdx = backlink[curIdx];
  }
  localBeatFrames.reverse();

  let intervalVarianceSum = 0;
  let intervalsCount = 0;
  for (let i = 1; i < localBeatFrames.length; i++) {
    const diff = localBeatFrames[i] - localBeatFrames[i - 1];
    intervalVarianceSum += Math.abs(diff - targetPeriodFrames) / targetPeriodFrames;
    intervalsCount++;
  }

  const meanRelErr = intervalsCount > 0 ? intervalVarianceSum / intervalsCount : 0.35;
  const pulseRegularity = Math.max(0.1, Math.min(0.99, 1 - meanRelErr * 2.2));

  const beatPeriodSec = 60 / detectedBpm;
  const firstLocalSec = localBeatFrames.length > 0 ? localBeatFrames[0] / envelopeRateHz : 0;
  const absoluteFirstBeat = segmentOffsetSec + firstLocalSec;
  const downbeatOffsetSec =
    Math.round((((absoluteFirstBeat % beatPeriodSec) + beatPeriodSec) % beatPeriodSec) * 1000) / 1000;

  const beatPositions: number[] = [];
  const maxBeats = Math.min(480, Math.floor(fullTrackDurationSec / beatPeriodSec));
  for (let b = 0; b < maxBeats; b++) {
    const pos = Math.round((downbeatOffsetSec + b * beatPeriodSec) * 1000) / 1000;
    if (pos <= fullTrackDurationSec) beatPositions.push(pos);
  }

  return { beatPositions, downbeatOffsetSec, pulseRegularity };
}

/**
 * Détecte les frontières de phrases musicales Intro / Outro (recalées sur des carrure de 4 mesures)
 * pour le Mode DJ B2B (enchaînements sans coupure vocale).
 */
export function detectIntroAndOutroSections(params: {
  firstSegmentEnvelope: Float32Array;
  lastSegmentEnvelope: Float32Array;
  envelopeRateHz: number;
  durationSec: number;
  downbeatOffsetSec: number;
  bpm: number;
}): { introEndSec: number; outroStartSec: number } {
  const { firstSegmentEnvelope, lastSegmentEnvelope, durationSec, downbeatOffsetSec, bpm } = params;
  const safeBpm = Math.max(60, Math.min(200, bpm || 118));
  const fourBarsSec = (60 / safeBpm) * 16;

  let firstPeakMean = 0.001;
  for (let i = 0; i < firstSegmentEnvelope.length; i++) firstPeakMean += firstSegmentEnvelope[i];
  firstPeakMean /= Math.max(1, firstSegmentEnvelope.length);

  let introRatio = 1;
  if (firstSegmentEnvelope.length >= 16) {
    let earlyMean = 0;
    const quarter = Math.floor(firstSegmentEnvelope.length * 0.3);
    for (let i = 0; i < quarter; i++) earlyMean += firstSegmentEnvelope[i];
    earlyMean /= Math.max(1, quarter);
    introRatio = earlyMean < firstPeakMean * 0.78 ? 2 : 1;
  }

  let outroRatio = 2;
  if (lastSegmentEnvelope.length >= 16) {
    let tailMean = 0;
    const startTail = Math.floor(lastSegmentEnvelope.length * 0.7);
    for (let i = startTail; i < lastSegmentEnvelope.length; i++) tailMean += lastSegmentEnvelope[i];
    tailMean /= Math.max(1, lastSegmentEnvelope.length - startTail);
    outroRatio = tailMean < firstPeakMean * 0.72 ? 3 : 2;
  }

  const rawIntro = downbeatOffsetSec + fourBarsSec * introRatio;
  const introEndSec = Math.round(Math.min(durationSec * 0.25, Math.max(fourBarsSec * 0.5, rawIntro)) * 10) / 10;
  const rawOutro = durationSec - fourBarsSec * outroRatio;
  const outroStartSec = Math.round(Math.max(durationSec * 0.68, Math.min(durationSec - fourBarsSec * 0.5, rawOutro)) * 10) / 10;

  return { introEndSec, outroStartSec };
}
