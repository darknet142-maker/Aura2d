import type { MultiBandEnergySummary } from '../types/music-analysis.types';

export interface SegmentBpmAnalysisResult {
  bestBpm: number;
  primaryProminence: number;
  secondPeakRatio: number;
  onsetEnvelope: Float32Array;
  envelopeRateHz: number;
  bandSummary: MultiBandEnergySummary;
}

function decomposeIntoFourBands(samples: Float32Array, sampleRate: number) {
  const n = samples.length;
  const subKick = new Float32Array(n);
  const lowMidGroove = new Float32Array(n);
  const midTransient = new Float32Array(n);
  const highPercussion = new Float32Array(n);
  const dt = 1 / sampleRate;
  const a140 = dt / (1 / (2 * Math.PI * 140) + dt);
  const a600 = dt / (1 / (2 * Math.PI * 600) + dt);
  const a3200 = dt / (1 / (2 * Math.PI * 3200) + dt);

  let lp140 = 0, lp600 = 0, lp3200 = 0;
  let eSub = 0, eLowMid = 0, eMid = 0, eHigh = 0;
  for (let i = 0; i < n; i++) {
    const x = samples[i];
    lp140 += a140 * (x - lp140);
    lp600 += a600 * (x - lp600);
    lp3200 += a3200 * (x - lp3200);
    const bSub = lp140, bLowMid = lp600 - lp140, bMid = lp3200 - lp600, bHigh = x - lp3200;
    subKick[i] = bSub; lowMidGroove[i] = bLowMid; midTransient[i] = bMid; highPercussion[i] = bHigh;
    eSub += bSub * bSub; eLowMid += bLowMid * bLowMid; eMid += bMid * bMid; eHigh += bHigh * bHigh;
  }
  const totalE = Math.max(1e-9, eSub + eLowMid + eMid + eHigh);
  return {
    subKick, lowMidGroove, midTransient, highPercussion,
    bandSummary: {
      subBassKickPct: Math.round((eSub / totalE) * 100),
      lowMidGroovePct: Math.round((eLowMid / totalE) * 100),
      midTransientPct: Math.round((eMid / totalE) * 100),
      highPercussionPct: Math.round((eHigh / totalE) * 100),
    },
  };
}

/**
 * Force d'attaque (Onset Strength) multibande logarithmique + Autocorrélation en peigne harmonique
 * avec levée d'ambiguïté d'octave (Ellis 2007 / McKinney-Moelants).
 */
export function analyzeSegmentMultiBandBpm(samples: Float32Array, sampleRate: number): SegmentBpmAnalysisResult {
  const { subKick, lowMidGroove, midTransient, highPercussion, bandSummary } = decomposeIntoFourBands(samples, sampleRate);
  const hopSize = Math.max(64, Math.round(sampleRate / 86.13));
  const framesCount = Math.floor(samples.length / hopSize);
  const envelopeRateHz = sampleRate / hopSize;
  const onsetEnvelope = new Float32Array(framesCount);

  const bands = [
    { data: subKick, weight: 0.30, gamma: 35 },
    { data: lowMidGroove, weight: 0.26, gamma: 45 },
    { data: midTransient, weight: 0.26, gamma: 55 },
    { data: highPercussion, weight: 0.18, gamma: 65 },
  ];

  for (const band of bands) {
    let prevLogE = 0, maxFlux = 1e-6;
    const flux = new Float32Array(framesCount);
    for (let f = 0; f < framesCount; f++) {
      const offset = f * hopSize;
      let sumSq = 0;
      for (let i = 0; i < hopSize; i++) {
        const v = band.data[offset + i] || 0;
        sumSq += v * v;
      }
      const logE = Math.log1p(band.gamma * Math.sqrt(sumSq / hopSize));
      const diff = Math.max(0, logE - prevLogE);
      prevLogE = logE;
      flux[f] = diff;
      if (diff > maxFlux) maxFlux = diff;
    }
    for (let f = 0; f < framesCount; f++) onsetEnvelope[f] += (flux[f] / maxFlux) * band.weight;
  }

  const minBpm = 48, maxBpm = 215, stepBpm = 0.25;
  const numCandidates = Math.floor((maxBpm - minBpm) / stepBpm) + 1;
  const scores = new Float32Array(numCandidates);
  let sumScore = 0;
  const harmonics = [
    { mult: 1, w: 1.0 }, { mult: 2, w: 0.52 }, { mult: 3, w: 0.30 },
    { mult: 4, w: 0.36 }, { mult: 6, w: 0.20 }, { mult: 8, w: 0.16 },
  ];

  for (let c = 0; c < numCandidates; c++) {
    const bpm = minBpm + c * stepBpm;
    const baseLag = (60 / bpm) * envelopeRateHz;
    let combEnergy = 0, weightSum = 0;
    for (const h of harmonics) {
      const lag = Math.round(baseLag * h.mult);
      if (lag >= 4 && lag < framesCount - 4) {
        let corr = 0;
        const count = framesCount - lag;
        for (let i = 0; i < count; i++) corr += onsetEnvelope[i] * onsetEnvelope[i + lag];
        combEnergy += (corr / count) * h.w;
        weightSum += h.w;
      }
    }
    const prior = 1 + 0.22 * Math.exp(-Math.pow(Math.log2(bpm / 114) / 0.62, 2));
    scores[c] = (weightSum > 0 ? combEnergy / weightSum : 0) * prior;
    sumScore += scores[c];
  }

  let bestIdx = 0, bestScore = -1;
  for (let c = 0; c < numCandidates; c++) {
    if (scores[c] > bestScore) { bestScore = scores[c]; bestIdx = c; }
  }
  let bestBpm = Math.round((minBpm + bestIdx * stepBpm) * 10) / 10;
  if (bestBpm < 76 && bestBpm * 2 <= 165) {
    const dblIdx = Math.round((bestBpm * 2 - minBpm) / stepBpm);
    if (dblIdx >= 0 && dblIdx < numCandidates && scores[dblIdx] >= bestScore * 0.84) {
      bestIdx = dblIdx; bestScore = scores[dblIdx];
      bestBpm = Math.round((minBpm + bestIdx * stepBpm) * 10) / 10;
    }
  }

  let secondBestScore = 0;
  for (let c = 0; c < numCandidates; c++) {
    const cand = minBpm + c * stepBpm;
    if (Math.abs(cand - bestBpm) >= 4 && Math.abs(cand - bestBpm * 2) >= 4 && Math.abs(cand * 2 - bestBpm) >= 4) {
      if (scores[c] > secondBestScore) secondBestScore = scores[c];
    }
  }

  return {
    bestBpm,
    primaryProminence: bestScore / Math.max(1e-6, sumScore / numCandidates),
    secondPeakRatio: bestScore > 0 ? secondBestScore / bestScore : 1,
    onsetEnvelope,
    envelopeRateHz,
    bandSummary,
  };
}
