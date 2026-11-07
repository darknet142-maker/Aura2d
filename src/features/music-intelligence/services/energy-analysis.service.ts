import type { MultiBandEnergySummary } from '../types/music-analysis.types';

export interface EnergyAndDanceabilityResult {
  energy: number; // 0.00 -> 1.00
  danceability: number; // 0.00 -> 1.00
}

/**
 * Calibre l'Énergie et la Danceability indépendamment du seul BPM :
 * Un morceau à 90 BPM à forte densité de transitoires et de sub-bass peut être plus énergique
 * qu'un morceau acoustique à 130 BPM.
 */
export function computeCalibratedEnergyAndDanceability(params: {
  samples: Float32Array;
  onsetEnvelope: Float32Array;
  pulseRegularity: number;
  bandSummary: MultiBandEnergySummary;
  detectedBpm: number;
}): EnergyAndDanceabilityResult {
  const { samples, onsetEnvelope, pulseRegularity, bandSummary, detectedBpm } = params;

  // 1. Calcul du RMS et de la densité dynamique du signal
  let sumSq = 0;
  let peak = 1e-6;
  const stride = Math.max(1, Math.floor(samples.length / 8000));
  let count = 0;
  for (let i = 0; i < samples.length; i += stride) {
    const v = Math.abs(samples[i] || 0);
    sumSq += v * v;
    if (v > peak) peak = v;
    count++;
  }
  const rms = Math.sqrt(sumSq / Math.max(1, count));
  const normalizedRms = Math.min(1, rms / Math.max(0.08, peak * 0.55));

  // 2. Densité d'attaques percussives (Onset Flux Density)
  let onsetSum = 0;
  for (let i = 0; i < onsetEnvelope.length; i++) {
    onsetSum += onsetEnvelope[i];
  }
  const meanOnset = onsetEnvelope.length > 0 ? onsetSum / onsetEnvelope.length : 0.25;
  const onsetActivity = Math.min(1, meanOnset * 2.35);

  // 3. Poids des transitoires médiums/aigus et de l'assise grave
  const spectralDrive =
    (bandSummary.subBassKickPct * 0.42 +
      bandSummary.midTransientPct * 0.36 +
      bandSummary.highPercussionPct * 0.22) /
    38;

  const rawEnergy =
    normalizedRms * 0.44 +
    onsetActivity * 0.34 +
    Math.min(1, spectralDrive) * 0.22;

  const energy = Math.round(Math.max(0.12, Math.min(0.99, rawEnergy)) * 100) / 100;

  // 4. Danceability : régularité du groove, ancrage grave/bas-médium et zone de confort corporel (88-132 BPM)
  const grooveFoundation = Math.min(
    1,
    (bandSummary.subBassKickPct + bandSummary.lowMidGroovePct) / 68
  );
  const tempoGrooveFactor =
    detectedBpm >= 84 && detectedBpm <= 136
      ? 0.94
      : detectedBpm >= 68 && detectedBpm <= 160
        ? 0.82
        : 0.68;

  const rawDanceability =
    pulseRegularity * 0.46 +
    grooveFoundation * 0.30 +
    tempoGrooveFactor * 0.24;

  const danceability =
    Math.round(Math.max(0.18, Math.min(0.98, rawDanceability)) * 100) / 100;

  return { energy, danceability };
}

