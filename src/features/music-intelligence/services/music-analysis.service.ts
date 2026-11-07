import type { AnalysisHistoryEntry, TrackAnalysis } from '../types/music-analysis.types';
import {
  extractRepresentativeMonoSegments,
  validateAudioFileHeader,
  validateDecodedAudioBuffer,
} from '../utils/audio-validation';
import { MUSIC_INTELLIGENCE_ALGO_VERSION } from './analysis-dsp-core';
import { enqueueSurgicalAnalysisJob } from './analysis-job-queue.service';

export { MUSIC_INTELLIGENCE_ALGO_VERSION };

function buildFailedAnalysis(
  reason: string | null | undefined,
  options?: {
    existingConfirmedBpm?: number | null;
    existingConfirmedKey?: string | null;
    previousHistory?: AnalysisHistoryEntry[];
  },
  durationSec = 0,
  pcmMemoryMib?: number
): TrackAnalysis {
  return {
    detectedBpm: null,
    confirmedBpm: options?.existingConfirmedBpm ?? null,
    alternativeBpms: [],
    bpmConfidence: durationSec > 0 ? 0 : null,
    detectedKey: null,
    confirmedKey: options?.existingConfirmedKey ?? null,
    mode: null,
    energy: null,
    danceability: null,
    beatPositions: [],
    durationSec: Math.round(durationSec),
    pcmMemoryMib,
    analysisHistory: options?.previousHistory ?? [],
    analysisStatus: 'failed',
    failureReason: reason ?? null,
    algorithmVersion: MUSIC_INTELLIGENCE_ALGO_VERSION,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Pipeline d'analyse musicale chirurgicale hors thread principal :
 * 1. Valide l'entête du fichier (taille, format, corruption).
 * 2. Décode en PCM, mesure l'empreinte RAM exacte (Mio), extrait 3 segments mono légers
 *    et ferme IMMÉDIATEMENT l'AudioContext dans try/finally (~80.75 Mio libérés avant le calcul DSP).
 * 3. Place le job dans la file asynchrone bornée (concurrence = 1) exécutée par un Web Worker dédié.
 * 4. N'invente jamais 120 BPM en cas d'échec et n'écrase jamais un confirmedBpm / confirmedKey humain.
 */
export async function analyzeAudioFileSurgically(
  file: File,
  options?: {
    signal?: AbortSignal;
    existingConfirmedBpm?: number | null;
    existingConfirmedKey?: string | null;
    previousHistory?: AnalysisHistoryEntry[];
    onStatusChange?: (status: TrackAnalysis['analysisStatus']) => void;
  }
): Promise<TrackAnalysis> {
  const startedAtMs = Date.now();
  const headerCheck = validateAudioFileHeader(file);
  if (!headerCheck.valid) return buildFailedAnalysis(headerCheck.errorMessage, options);

  options?.onStatusChange?.('pending');
  if (options?.signal?.aborted) throw new DOMException('Analyse audio annulée', 'AbortError');

  let segments: Float32Array[] = [];
  let sampleRate = 22050;
  let offsetsSec: number[] = [];
  let durationSec = 0;
  let pcmMemoryMib = 0;
  let decodeCtx: AudioContext | null = null;

  try {
    const arrayBuffer = await file.arrayBuffer();
    if (options?.signal?.aborted) throw new DOMException('Analyse audio annulée', 'AbortError');

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    decodeCtx = new AudioCtx();
    const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
    pcmMemoryMib = Math.round(((audioBuffer.length * audioBuffer.numberOfChannels * 4) / (1024 * 1024)) * 100) / 100;
    durationSec = audioBuffer.duration;

    const bufferCheck = validateDecodedAudioBuffer(audioBuffer);
    if (!bufferCheck.valid) {
      return buildFailedAnalysis(bufferCheck.errorMessage, options, durationSec, pcmMemoryMib);
    }
    const extracted = extractRepresentativeMonoSegments(audioBuffer);
    segments = extracted.segments;
    sampleRate = extracted.sampleRate;
    offsetsSec = extracted.offsetsSec;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    const msg = err instanceof Error ? `Décodage audio impossible (${err.message})` : 'Fichier audio illisible ou codec non supporté.';
    return buildFailedAnalysis(msg, options);
  } finally {
    if (decodeCtx && decodeCtx.state !== 'closed') {
      try { await decodeCtx.close(); } catch { /* ignore */ }
    }
  }

  options?.onStatusChange?.('processing');
  return enqueueSurgicalAnalysisJob({
    file,
    segments,
    sampleRate,
    offsetsSec,
    durationSec,
    pcmMemoryMib,
    existingConfirmedBpm: options?.existingConfirmedBpm,
    existingConfirmedKey: options?.existingConfirmedKey,
    previousHistory: options?.previousHistory,
    startedAtMs,
    signal: options?.signal,
  });
}
