import type { AudioValidationResult } from '../types/music-analysis.types';

const MAX_AUDIO_FILE_BYTES = 150 * 1024 * 1024; // 150 Mo max
const MIN_DURATION_SEC = 8;
const MAX_DURATION_SEC = 25 * 60; // 25 min max
const SUPPORTED_EXTENSIONS = new Set(['wav', 'mp3', 'flac', 'ogg', 'opus', 'm4a', 'aac', 'webm', 'mp4']);

/**
 * Vérifie l'intégrité du fichier avant tout décodage PCM lourd en mémoire.
 */
export function validateAudioFileHeader(file: File): AudioValidationResult {
  if (!file || file.size === 0) {
    return { valid: false, errorCode: 'EMPTY_FILE', errorMessage: 'Le fichier audio est vide (0 octet).', fileSizeBytes: 0 };
  }
  if (file.size > MAX_AUDIO_FILE_BYTES) {
    return {
      valid: false,
      errorCode: 'FILE_TOO_LARGE',
      errorMessage: `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo > 150 Mo max).`,
      fileSizeBytes: file.size,
    };
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase().trim();
  const mimeOk = !file.type || file.type.startsWith('audio/') || file.type === 'video/mp4' || file.type === 'video/webm';
  if (ext && !SUPPORTED_EXTENSIONS.has(ext) && !mimeOk) {
    return {
      valid: false,
      errorCode: 'UNSUPPORTED_FORMAT',
      errorMessage: `Format « .${ext} » non pris en charge par le moteur d'analyse studio.`,
      fileSizeBytes: file.size,
    };
  }
  return { valid: true, fileSizeBytes: file.size };
}

/**
 * Vérifie qu'un AudioBuffer décodé possède une durée valide et un signal acoustique non muet.
 * Empêche formellement d'attribuer 120 BPM par défaut à un fichier muet ou corrompu.
 */
export function validateDecodedAudioBuffer(buffer: AudioBuffer): AudioValidationResult {
  const duration = buffer.duration;
  if (!Number.isFinite(duration) || duration < MIN_DURATION_SEC) {
    return {
      valid: false,
      errorCode: 'DURATION_TOO_SHORT',
      errorMessage: `Durée audio insuffisante (${duration.toFixed(1)}s < ${MIN_DURATION_SEC}s minimum) pour une détection BPM fiable.`,
      fileSizeBytes: 0,
      estimatedDurationSec: duration,
    };
  }
  if (duration > MAX_DURATION_SEC) {
    return {
      valid: false,
      errorCode: 'DURATION_TOO_LONG',
      errorMessage: `Durée excessive (${Math.round(duration / 60)} min > 25 min max).`,
      fileSizeBytes: 0,
      estimatedDurationSec: duration,
    };
  }

  const ch0 = buffer.getChannelData(0);
  const stride = Math.max(1, Math.floor(ch0.length / 12000));
  let sumSq = 0, count = 0;
  for (let i = 0; i < ch0.length; i += stride) {
    const s = ch0[i] || 0;
    sumSq += s * s;
    count++;
  }
  const rms = Math.sqrt(sumSq / Math.max(1, count));
  const rmsDb = rms > 1e-6 ? 20 * Math.log10(rms) : -100;
  if (rmsDb < -58) {
    return {
      valid: false,
      errorCode: 'SILENT_OR_CORRUPTED',
      errorMessage: `Signal acoustique quasi muet (${rmsDb.toFixed(1)} dBFS). Impossible d'extraire un BPM sans inventer de résultat.`,
      fileSizeBytes: 0,
      estimatedDurationSec: duration,
      rmsLevelDb: rmsDb,
    };
  }

  return { valid: true, fileSizeBytes: 0, estimatedDurationSec: duration, rmsLevelDb: Math.round(rmsDb * 10) / 10 };
}

/**
 * Extrait 3 segments représentatifs (20%, 48%, 74%) sous-échantillonnés en mono 11025 Hz
 * pour libérer immédiatement ~80.75 Mio de RAM PCM tout en couvrant tout le morceau.
 */
export function extractRepresentativeMonoSegments(
  buffer: AudioBuffer,
  targetSampleRate = 11025,
  segmentDurationSec = 18
): { segments: Float32Array[]; sampleRate: number; offsetsSec: number[] } {
  const srcRate = buffer.sampleRate;
  const ratio = Math.max(1, srcRate / targetSampleRate);
  const effectiveRate = srcRate / ratio;
  const ch0 = buffer.getChannelData(0);
  const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
  const totalSec = buffer.duration;
  const anchorRatios = totalSec < 40 ? [0.15, 0.5] : [0.2, 0.48, 0.74];
  const segments: Float32Array[] = [];
  const offsetsSec: number[] = [];

  for (const r of anchorRatios) {
    const winSec = Math.min(segmentDurationSec, totalSec * 0.45);
    const startSec = Math.max(0, Math.min(totalSec - winSec, totalSec * r));
    const startSample = Math.floor(startSec * srcRate);
    const outLen = Math.max(256, Math.floor(winSec * effectiveRate));
    const mono = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const srcIdx = Math.min(ch0.length - 1, Math.floor(startSample + i * ratio));
      const left = ch0[srcIdx] || 0;
      mono[i] = (left + (ch1 ? ch1[srcIdx] || 0 : left)) * 0.5;
    }
    segments.push(mono);
    offsetsSec.push(Math.round(startSec * 100) / 100);
  }
  return { segments, sampleRate: effectiveRate, offsetsSec };
}
