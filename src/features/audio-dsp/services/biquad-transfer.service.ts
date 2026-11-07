import type { EqBandSpec, EqFilterKind } from '../types/audio-dsp.types';

/**
 * Évaluation mathématique exacte de la fonction de transfert numérique Biquad H(e^jw)
 * conforme à la spécification W3C Web Audio API (Audio EQ Cookbook — R. Bristow-Johnson).
 */
function computeBiquadCoeffs(
  type: EqFilterKind,
  freqHz: number,
  sampleRate: number,
  gainDb: number,
  q: number
): [number, number, number, number, number] {
  const safeQ = Math.max(0.25, Math.min(12, q));
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * Math.min(freqHz, sampleRate * 0.48)) / sampleRate;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);

  let b0 = 1, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;

  if (type === 'peaking') {
    const alpha = sinW0 / (2 * safeQ);
    b0 = 1 + alpha * A;
    b1 = -2 * cosW0;
    b2 = 1 - alpha * A;
    a0 = 1 + alpha / A;
    a1 = -2 * cosW0;
    a2 = 1 - alpha / A;
  } else if (type === 'lowshelf') {
    const slope = Math.max(0.35, Math.min(2.2, safeQ / 0.85));
    const rad = Math.max(0, (A + 1 / A) * (1 / slope - 1) + 2);
    const beta = Math.sqrt(A) * Math.sqrt(rad);
    b0 = A * (A + 1 - (A - 1) * cosW0 + beta * sinW0);
    b1 = 2 * A * (A - 1 - (A + 1) * cosW0);
    b2 = A * (A + 1 - (A - 1) * cosW0 - beta * sinW0);
    a0 = A + 1 + (A - 1) * cosW0 + beta * sinW0;
    a1 = -2 * (A - 1 + (A + 1) * cosW0);
    a2 = A + 1 + (A - 1) * cosW0 - beta * sinW0;
  } else {
    const slope = Math.max(0.35, Math.min(2.2, safeQ / 0.85));
    const rad = Math.max(0, (A + 1 / A) * (1 / slope - 1) + 2);
    const beta = Math.sqrt(A) * Math.sqrt(rad);
    b0 = A * (A + 1 + (A - 1) * cosW0 + beta * sinW0);
    b1 = -2 * A * (A - 1 + (A + 1) * cosW0);
    b2 = A * (A + 1 + (A - 1) * cosW0 - beta * sinW0);
    a0 = A + 1 - (A - 1) * cosW0 + beta * sinW0;
    a1 = 2 * (A - 1 - (A + 1) * cosW0);
    a2 = A + 1 - (A - 1) * cosW0 - beta * sinW0;
  }

  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}

function evalBiquadMagDb(coeffs: [number, number, number, number, number], freqHz: number, sampleRate: number): number {
  const [b0, b1, b2, a1, a2] = coeffs;
  const w = (2 * Math.PI * freqHz) / sampleRate;
  const cos1 = Math.cos(w);
  const sin1 = Math.sin(w);
  const cos2 = Math.cos(2 * w);
  const sin2 = Math.sin(2 * w);

  const numRe = b0 + b1 * cos1 + b2 * cos2;
  const numIm = -(b1 * sin1 + b2 * sin2);
  const denRe = 1 + a1 * cos1 + a2 * cos2;
  const denIm = -(a1 * sin1 + a2 * sin2);

  const numMagSq = numRe * numRe + numIm * numIm;
  const denMagSq = Math.max(1e-12, denRe * denRe + denIm * denIm);
  return 10 * Math.log10(Math.max(1e-12, numMagSq / denMagSq));
}

export function buildLogFrequencyGrid(points = 128, minHz = 20, maxHz = 20000): number[] {
  const ratio = maxHz / minHz;
  return Array.from({ length: points }, (_, i) => minHz * Math.pow(ratio, i / (points - 1)));
}

export function freqToNormLogX(freqHz: number, minHz = 20, maxHz = 20000): number {
  return Math.log10(Math.max(minHz, Math.min(maxHz, freqHz)) / minHz) / Math.log10(maxHz / minHz);
}

export function computeTransferCurvesDb(params: {
  bands: EqBandSpec[];
  gains: number[];
  qFactors: number[];
  bypassed: boolean;
  effectivePreampDb: number;
  frequencies: number[];
  sampleRate?: number;
}): { compositeDb: number[]; perBandDb: number[][] } {
  const sr = params.sampleRate || 48000;
  if (params.bypassed) {
    return {
      compositeDb: params.frequencies.map(() => 0),
      perBandDb: params.bands.map(() => params.frequencies.map(() => 0)),
    };
  }

  const bandCoeffs = params.bands.map((b, idx) =>
    computeBiquadCoeffs(b.filterType, b.freqHz, sr, params.gains[idx] ?? 0, params.qFactors[idx] ?? b.defaultQ)
  );

  const perBandDb = bandCoeffs.map((c) => params.frequencies.map((f) => evalBiquadMagDb(c, f, sr)));
  const compositeDb = params.frequencies.map((_, fIdx) => {
    let sum = params.effectivePreampDb;
    for (let bIdx = 0; bIdx < perBandDb.length; bIdx++) {
      sum += perBandDb[bIdx][fIdx];
    }
    return sum;
  });

  return { compositeDb, perBandDb };
}

export function computeAutoHeadroomOffsetDb(bands: EqBandSpec[], gains: number[], qFactors: number[]): number {
  const grid = buildLogFrequencyGrid(72);
  const { compositeDb } = computeTransferCurvesDb({
    bands,
    gains,
    qFactors,
    bypassed: false,
    effectivePreampDb: 0,
    frequencies: grid,
  });
  const maxPeak = Math.max(0, ...compositeDb);
  return maxPeak > 0.4 ? -Math.round((maxPeak * 0.82) * 10) / 10 : 0;
}

export function computeOctaveBandwidth(q: number): number {
  const safeQ = Math.max(0.25, Math.min(12, q));
  const x = 1 / (2 * safeQ);
  const asinh = Math.log(x + Math.sqrt(x * x + 1));
  return Math.round(((2 / Math.LN2) * asinh) * 100) / 100;
}

export function describeQFactorCharacter(q: number): string {
  if (q <= 0.65) return 'Musical Très Large';
  if (q <= 1.15) return 'Console Analogique';
  if (q <= 2.2) return 'Mixage Précis';
  if (q <= 4.5) return 'Chirurgical Étroit';
  return 'Notch Anti-Résonance';
}

