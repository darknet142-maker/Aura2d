import type { SocialTargetSubject } from '../types/social-feed.types';

export interface VoiceMicSession {
  audioTrack: MediaStreamTrack | null;
  readLevel: () => number;
  stop: () => void;
}

/**
 * Acquiert une piste vocale microphone pure (sans musique de fond ni retour haut-parleur)
 * pour le Mode B « Avis / Critique Micro Sans Musique (30s) » en 1080×1920.
 */
export async function startVoiceOpinionMicrophone(): Promise<VoiceMicSession> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    return { audioTrack: null, readLevel: () => 0, stop: () => {} };
  }

  let micStream: MediaStream | null = null;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
  } catch {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      return { audioTrack: null, readLevel: () => 0, stop: () => {} };
    }
  }

  const rawTrack = micStream.getAudioTracks()[0] ?? null;
  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let pcmBuffer: Uint8Array<ArrayBuffer> | null = null;

  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) {
      audioCtx = new Ctor();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const source = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.72;
      // Connexion exclusive vers l'analyseur (JAMAIS vers destination pour éviter tout larsen)
      source.connect(analyser);
      pcmBuffer = new Uint8Array(new ArrayBuffer(analyser.fftSize));
    }
  } catch {
    // Repli : la piste audio brute reste enregistrée même sans analyseur VU
  }

  const readLevel = (): number => {
    if (!analyser || !pcmBuffer) return 0;
    analyser.getByteTimeDomainData(pcmBuffer);
    let sumSq = 0;
    for (let i = 0; i < pcmBuffer.length; i++) {
      const centered = (pcmBuffer[i] - 128) / 128;
      sumSq += centered * centered;
    }
    const rms = Math.sqrt(sumSq / pcmBuffer.length);
    return Math.min(1, rms * 3.8);
  };

  const stop = () => {
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
  };

  return { audioTrack: rawTrack, readLevel, stop };
}

export function buildDynamicTargetQrUrl(
  target: SocialTargetSubject | undefined,
  fallbackTrackId: string
): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://drop.music.ga';

  if (!target) {
    return `${origin}/?track=${encodeURIComponent(fallbackTrackId)}`;
  }
  if (target.kind === 'ALBUM' && target.albumId) {
    return `${origin}/?album=${encodeURIComponent(target.albumId)}`;
  }
  if (target.kind === 'ARTIST') {
    return `${origin}/?artist=${encodeURIComponent(target.entityName)}`;
  }
  return `${origin}/?track=${encodeURIComponent(target.trackId || fallbackTrackId)}`;
}
