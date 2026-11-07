import type { AnalysisHistoryEntry, TrackAnalysis } from '../types/music-analysis.types';
import { runMultiSegmentSurgicalDsp } from './analysis-dsp-core';
import type {
  WorkerAnalysisRequestMessage,
  WorkerAnalysisResponseMessage,
} from '../workers/music-analysis.worker';

interface QueuedAnalysisJob {
  id: string;
  file?: File;
  segments: Float32Array[];
  sampleRate: number;
  offsetsSec: number[];
  durationSec: number;
  pcmMemoryMib: number;
  existingConfirmedBpm?: number | null;
  existingConfirmedKey?: string | null;
  previousHistory?: AnalysisHistoryEntry[];
  startedAtMs: number;
  signal?: AbortSignal;
  resolve: (res: TrackAnalysis) => void;
  reject: (err: Error) => void;
}

const MAX_CONCURRENCY = 1;
const pendingQueue: QueuedAnalysisJob[] = [];
let activeCount = 0;

export function getAnalysisQueueStatus(): { activeCount: number; pendingCount: number } {
  return { activeCount, pendingCount: pendingQueue.length };
}

async function tryRemoteCloudWorker(
  file: File | undefined,
  signal?: AbortSignal
): Promise<Partial<TrackAnalysis> | null> {
  const endpoint = (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_MUSIC_INTELLIGENCE_WORKER_URL;
  if (!endpoint || !file) return null;
  const form = new FormData();
  form.append('audio', file);
  const resp = await fetch(endpoint, { method: 'POST', body: form, signal });
  if (!resp.ok) return null;
  return (await resp.json()) as Partial<TrackAnalysis>;
}

function executeInDedicatedWebWorker(job: QueuedAnalysisJob): Promise<TrackAnalysis> {
  return new Promise<TrackAnalysis>((resolve, reject) => {
    if (typeof Worker === 'undefined') {
      resolve(
        runMultiSegmentSurgicalDsp({
          ...job,
          engineMode: 'ESSENTIA_MULTIBAND_DSP',
        })
      );
      return;
    }

    const worker = new Worker(
      new URL('../workers/music-analysis.worker.ts', import.meta.url),
      { type: 'module' }
    );

    const onAbort = () => {
      worker.terminate();
      reject(new DOMException('Analyse audio annulée', 'AbortError'));
    };
    job.signal?.addEventListener('abort', onAbort, { once: true });

    worker.onmessage = (ev: MessageEvent<WorkerAnalysisResponseMessage>) => {
      job.signal?.removeEventListener('abort', onAbort);
      worker.terminate();
      if (ev.data.ok) resolve(ev.data.result);
      else reject(new Error(ev.data.errorMessage));
    };

    worker.onerror = () => {
      job.signal?.removeEventListener('abort', onAbort);
      worker.terminate();
      resolve(
        runMultiSegmentSurgicalDsp({
          ...job,
          engineMode: 'ESSENTIA_MULTIBAND_DSP',
        })
      );
    };

    const segmentBuffers = job.segments.map((s) => s.slice().buffer);
    const req: WorkerAnalysisRequestMessage = {
      id: job.id,
      segmentBuffers,
      sampleRate: job.sampleRate,
      offsetsSec: job.offsetsSec,
      durationSec: job.durationSec,
      pcmMemoryMib: job.pcmMemoryMib,
      existingConfirmedBpm: job.existingConfirmedBpm,
      existingConfirmedKey: job.existingConfirmedKey,
      previousHistory: job.previousHistory,
      startedAtMs: job.startedAtMs,
    };
    worker.postMessage(req, segmentBuffers);
  });
}

async function pumpQueue(): Promise<void> {
  if (activeCount >= MAX_CONCURRENCY || pendingQueue.length === 0) return;
  const job = pendingQueue.shift()!;
  if (job.signal?.aborted) {
    job.reject(new DOMException('Analyse audio annulée', 'AbortError'));
    void pumpQueue();
    return;
  }

  activeCount++;
  try {
    const cloudPartial = await tryRemoteCloudWorker(job.file, job.signal).catch(() => null);
    const localResult = await executeInDedicatedWebWorker(job);
    job.resolve(
      cloudPartial && cloudPartial.detectedBpm
        ? { ...localResult, ...cloudPartial, engineMode: 'CLOUD_WORKER_HYBRID' }
        : localResult
    );
  } catch (err) {
    job.reject(err instanceof Error ? err : new Error('Échec file analyse'));
  } finally {
    activeCount--;
    void pumpQueue();
  }
}

export function enqueueSurgicalAnalysisJob(
  params: Omit<QueuedAnalysisJob, 'id' | 'resolve' | 'reject'>
): Promise<TrackAnalysis> {
  return new Promise<TrackAnalysis>((resolve, reject) => {
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    pendingQueue.push({ ...params, id, resolve, reject });
    void pumpQueue();
  });
}

