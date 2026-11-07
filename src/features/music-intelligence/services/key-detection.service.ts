import type { DjTransitionCompatibility, MusicalMode } from '../types/music-analysis.types';

const PITCH_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const KS_MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KS_MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const CAMELOT_MAP: Record<string, string> = {
  'C Major': '8B', 'G Major': '9B', 'D Major': '10B', 'A Major': '11B',
  'E Major': '12B', 'B Major': '1B', 'F# Major': '2B', 'C# Major': '3B',
  'Ab Major': '4B', 'Eb Major': '5B', 'Bb Major': '6B', 'F Major': '7B',
  'A Minor': '8A', 'E Minor': '9A', 'B Minor': '10A', 'F# Minor': '11A',
  'C# Minor': '12A', 'Ab Minor': '1A', 'Eb Minor': '2A', 'Bb Minor': '3A',
  'F Minor': '4A', 'C Minor': '5A', 'G Minor': '6A', 'D Minor': '7A',
};

/**
 * Détecte la tonalité harmonique (Chromagramme 12 demi-tons via Goertzel + Krumhansl-Schmuckler).
 */
export function detectMusicalKeyAndCamelot(
  samples: Float32Array,
  sampleRate: number
): { detectedKey: string; mode: MusicalMode; camelotKey: string } {
  const chroma = new Float32Array(12);
  const windowLen = Math.min(samples.length, Math.floor(sampleRate * 6));
  const startOffset = Math.floor((samples.length - windowLen) * 0.5);

  for (let pc = 0; pc < 12; pc++) {
    let pcEnergy = 0;
    for (let octave = 2; octave <= 4; octave++) {
      const freq = 440 * Math.pow(2, (12 * (octave + 1) + pc - 69) / 12);
      const k = Math.round((windowLen * freq) / sampleRate);
      const coeff = 2 * Math.cos((2 * Math.PI * k) / windowLen);
      let s1 = 0, s2 = 0;
      for (let i = 0; i < windowLen; i += 2) {
        const s0 = (samples[startOffset + i] || 0) + coeff * s1 - s2;
        s2 = s1;
        s1 = s0;
      }
      pcEnergy += Math.max(0, s1 * s1 + s2 * s2 - coeff * s1 * s2);
    }
    chroma[pc] = Math.sqrt(pcEnergy);
  }

  let bestKeyIdx = 9;
  let bestMode: MusicalMode = 'Minor';
  let bestCorr = -Infinity;
  for (let shift = 0; shift < 12; shift++) {
    let majScore = 0, minScore = 0;
    for (let i = 0; i < 12; i++) {
      const cVal = chroma[(i + shift) % 12];
      majScore += cVal * KS_MAJOR_PROFILE[i];
      minScore += cVal * KS_MINOR_PROFILE[i];
    }
    if (majScore > bestCorr) { bestCorr = majScore; bestKeyIdx = shift; bestMode = 'Major'; }
    if (minScore > bestCorr) { bestCorr = minScore; bestKeyIdx = shift; bestMode = 'Minor'; }
  }

  const rootName = PITCH_NAMES[bestKeyIdx];
  return {
    detectedKey: `${rootName} ${bestMode.toLowerCase()}`,
    mode: bestMode,
    camelotKey: CAMELOT_MAP[`${rootName} ${bestMode}`] || '8A',
  };
}

/**
 * Calcule la compatibilité DJ B2B entre deux morceaux (Tempo, Phase, Carrure 4/8 mesures, Intro/Outro & Camelot).
 */
export function computeDjTransitionCompatibility(
  source: { bpm: number; camelotKey?: string | null; downbeatOffsetSec?: number; energy?: number | null; outroStartSec?: number },
  target: { id: string; title: string; artist: string; bpm: number; key: string; camelotKey?: string | null; downbeatOffsetSec?: number; energy?: number | null; introEndSec?: number }
): DjTransitionCompatibility {
  const directDelta = Math.abs(target.bpm - source.bpm);
  const halfTimeDelta = Math.min(Math.abs(target.bpm * 2 - source.bpm), Math.abs(target.bpm - source.bpm * 2));
  const bpmDeltaPct = Math.round((Math.min(directDelta, halfTimeDelta) / Math.max(1, source.bpm)) * 1000) / 10;
  const pitchShiftPct = Math.round(((source.bpm - target.bpm) / Math.max(1, target.bpm)) * 1000) / 10;

  const srcCam = source.camelotKey || '8A';
  const tgtCam = target.camelotKey || '8A';
  const srcNum = parseInt(srcCam.slice(0, -1), 10) || 8;
  const srcLet = srcCam.slice(-1);
  const tgtNum = parseInt(tgtCam.slice(0, -1), 10) || 8;
  const tgtLet = tgtCam.slice(-1);
  const ringDist = Math.min(Math.abs(srcNum - tgtNum), 12 - Math.abs(srcNum - tgtNum));

  let harmonicRelation: DjTransitionCompatibility['harmonicRelation'] = 'DISSONANT';
  let harmonicScore = 45;
  if (srcNum === tgtNum && srcLet === tgtLet) { harmonicRelation = 'PERFECT_MATCH'; harmonicScore = 100; }
  else if (srcNum === tgtNum && srcLet !== tgtLet) { harmonicRelation = 'RELATIVE_KEY'; harmonicScore = 92; }
  else if (ringDist === 1 && srcLet === tgtLet) { harmonicRelation = 'FIFTH_STEP'; harmonicScore = 88; }
  else if (ringDist === 2 && srcLet === tgtLet) { harmonicRelation = 'ENERGY_BOOST'; harmonicScore = 78; }

  const tempoScore = Math.max(0, 100 - bpmDeltaPct * 7.5);
  const rawEnergyDelta = Math.round(((target.energy ?? 0.78) - (source.energy ?? 0.78)) * 100) / 100;
  const energyScore = Math.max(38, 100 - (rawEnergyDelta < -0.18 ? Math.abs(rawEnergyDelta) * 115 : Math.abs(rawEnergyDelta) * 75));
  const compatibilityScore = Math.round(tempoScore * 0.46 + harmonicScore * 0.36 + energyScore * 0.18);
  const phaseOffsetMs = Math.round(Math.abs((target.downbeatOffsetSec ?? 0.12) - (source.downbeatOffsetSec ?? 0.12)) * 1000);
  const phraseBars: 4 | 8 = compatibilityScore >= 82 ? 8 : 4;
  const recommendedCrossfadeSec = Math.round((60 / Math.max(60, source.bpm)) * 4 * (phraseBars === 8 ? 4 : 2) * 10) / 10;

  return {
    targetTrackId: target.id,
    targetTitle: target.title,
    targetArtist: target.artist,
    targetBpm: target.bpm,
    targetKey: `${target.key} (${tgtCam})`,
    bpmDeltaPct,
    pitchShiftPct,
    harmonicRelation,
    phaseOffsetMs,
    compatibilityScore,
    recommendedCrossfadeSec,
    sourceOutroStartSec: source.outroStartSec,
    targetIntroEndSec: target.introEndSec,
    phraseBars,
    energyDelta: rawEnergyDelta,
  };
}
