import type { AnalysisHistoryEntry, TrackAnalysis } from '../types/music-analysis.types';
import { runMultiSegmentSurgicalDsp } from '../services/analysis-dsp-core';

export interface WorkerAnalysisRequestMessage {
  id: string;
  segmentBuffers: ArrayBuffer[];
  sampleRate: number;
  offsetsSec: number[];
  durationSec: number;
  pcmMemoryMib: number;
  existingConfirmedBpm?: number | null;
  existingConfirmedKey?: string | null;
  previousHistory?: AnalysisHistoryEntry[];
  startedAtMs: number;
}

export type WorkerAnalysisResponseMessage =
  | { id: string; ok: true; result: TrackAnalysis }
  | { id: string; ok: false; errorMessage: string };

const workerScope = self as unknown as {
  onmessage: ((ev: MessageEvent<WorkerAnalysisRequestMessage>) => void) | null;
  postMessage: (msg: WorkerAnalysisResponseMessage) => void;
};

workerScope.onmessage = (event: MessageEvent<WorkerAnalysisRequestMessage>) => {
  const payload = event.data;
  try {
    const segments = payload.segmentBuffers.map((buf) => new Float32Array(buf));
    const result = runMultiSegmentSurgicalDsp({
      segments,
      sampleRate: payload.sampleRate,
      offsetsSec: payload.offsetsSec,
      durationSec: payload.durationSec,
      pcmMemoryMib: payload.pcmMemoryMib,
      engineMode: 'WEB_WORKER_MULTIBAND',
      existingConfirmedBpm: payload.existingConfirmedBpm,
      existingConfirmedKey: payload.existingConfirmedKey,
      previousHistory: payload.previousHistory,
      startedAtMs: payload.startedAtMs,
    });
    workerScope.postMessage({ id: payload.id, ok: true, result });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur Worker DSP';
    workerScope.postMessage({ id: payload.id, ok: false, errorMessage });
  }
};
