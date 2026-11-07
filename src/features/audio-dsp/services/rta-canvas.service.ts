import type { AudioSpectrumSnapshot } from '../types/audio-dsp.types';

/**
 * Rendu RTA Mastering 56 colonnes logarithmiques (20 Hz -> 20 kHz) :
 * - Exploite les bins flottants dBFS réels (FFT 4096 -> résolution 11.7 Hz dès 20 Hz)
 * - Interpolation linéaire fractionnaire dans le sous-grave (< 220 Hz) pour zéro escalier
 * - Ballistique Peak-Hold dorée à décroissance contrôlée
 */
export function renderLogSpectrumRta(params: {
  canvas: HTMLCanvasElement;
  snap: AudioSpectrumSnapshot | null;
  isPlaying: boolean;
  eqBypassed: boolean;
  peakHold: Float32Array;
  holdFrames: Uint8Array;
}): void {
  const { canvas, snap, isPlaying, eqBypassed, peakHold, holdFrames } = params;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const sampleRate = snap?.sampleRate || 48000;
  const fftSize = snap?.fftSize || (snap ? snap.bins.length * 2 : 4096);
  const cols = 56;
  const gap = 2;
  const colW = (w - gap * (cols - 1)) / cols;
  const minDb = -86;
  const maxDb = -6;

  for (let c = 0; c < cols; c++) {
    const fLow = 20 * Math.pow(1000, c / cols);
    const fHigh = 20 * Math.pow(1000, (c + 1) / cols);
    let mag = 0;

    if (snap && isPlaying) {
      if (snap.floatDbBins && snap.floatDbBins.length > 0) {
        const fBins = snap.floatDbBins;
        const maxBin = fBins.length - 1;
        const kLow = (fLow * fftSize) / sampleRate;
        const kHigh = (fHigh * fftSize) / sampleRate;
        let dbVal = minDb;
        if (kHigh - kLow < 1.25) {
          const kMid = Math.max(0, Math.min(maxBin, (kLow + kHigh) * 0.5));
          const kA = Math.floor(kMid);
          const kB = Math.min(maxBin, kA + 1);
          const frac = kMid - kA;
          dbVal = fBins[kA] * (1 - frac) + fBins[kB] * frac;
        } else {
          const k0 = Math.max(0, Math.min(maxBin, Math.floor(kLow)));
          const k1 = Math.max(k0, Math.min(maxBin, Math.ceil(kHigh)));
          for (let k = k0; k <= k1; k++) {
            if (fBins[k] > dbVal) dbVal = fBins[k];
          }
        }
        if (Number.isFinite(dbVal)) {
          mag = Math.max(0, Math.min(1, (dbVal - minDb) / (maxDb - minDb)));
        }
      } else if (snap.bins.length > 0) {
        const maxBin = snap.bins.length - 1;
        const k0 = Math.max(0, Math.min(maxBin, Math.floor((fLow * fftSize) / sampleRate)));
        const k1 = Math.max(k0, Math.min(maxBin, Math.ceil((fHigh * fftSize) / sampleRate)));
        let peakBin = 0;
        for (let k = k0; k <= k1; k++) {
          if (snap.bins[k] > peakBin) peakBin = snap.bins[k];
        }
        mag = peakBin / 255;
      }
    }

    if (mag >= peakHold[c]) {
      peakHold[c] = mag;
      holdFrames[c] = 24;
    } else if (holdFrames[c] > 0) {
      holdFrames[c]--;
    } else {
      peakHold[c] = Math.max(0, peakHold[c] - 0.012);
    }

    const x = c * (colW + gap);
    const barH = Math.max(1, mag * (h - 6));
    const grad = ctx.createLinearGradient(0, h - barH, 0, h);
    grad.addColorStop(0, eqBypassed ? 'rgba(163,169,186,0.42)' : 'rgba(245,158,11,0.74)');
    grad.addColorStop(0.55, eqBypassed ? 'rgba(100,116,139,0.22)' : 'rgba(222,27,52,0.42)');
    grad.addColorStop(1, 'rgba(16,185,129,0.08)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, h - barH, colW, barH);

    if (peakHold[c] > 0.02) {
      const py = h - peakHold[c] * (h - 6);
      ctx.fillStyle = eqBypassed ? 'rgba(203,213,225,0.5)' : 'rgba(251,191,36,0.92)';
      ctx.fillRect(x, Math.max(1, py - 1.5), colW, 1.5);
    }
  }
}
