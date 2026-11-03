import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  X,
  RefreshCw,
  Check,
  Plus,
  MoreHorizontal,
  Camera,
  Play,
  Pause,
} from 'lucide-react';
import QRCode from 'qrcode';
import { ArtworkType } from './CoverArtwork';
import { FeaturingSplitMode } from '../utils/rankingEngine';
import { getPersistentAudioBlobUrl } from '../services/musicService';

export interface StudioTrackProp {
  id: string;
  title: string;
  artist: string;
  featuring?: string[];
  featuringSplitMode?: FeaturingSplitMode;
  album: string;
  category: string;
  labelName: string;
  copyrightText?: string;
  beatmakerName: string;
  soundEngineerName: string;
  lyricistName?: string;
  isInstrumental?: boolean;
  audioCodec?: 'OPUS' | 'AAC' | 'WAV';
  audioUrl?: string;
  cover?: string;
  artworkType?: ArtworkType;
  ambientPrimary: string;
  ambientSecondary: string;
  duration: number;
  dropStart: number;
  dropDuration: number;
  bpm: number;
  synthNotes: number[];
  realPlays: number;
  lastActivityAgo: string;
  totalListenSeconds: number;
  listenSessions: number;
  avgRetentionPct: number;
  algoPoints: number;
  likesCount: number;
  loopPlaysCount: number;
  longevityDays: number;
  consecutiveLoops: number;
  baselineRank: number;
}

export interface DropTrendMagazineStudioProps {
  track: StudioTrackProp;
  isOpen: boolean;
  onClose: () => void;
  onPauseMainPlayer: () => void;
}

type FullscreenStep = 'CAMERA_CAPTURE' | 'INSTANT_PREVIEW';

// ============================================================================
// GÉOMÉTRIE DU FILIGRANE DROP ÉPURÉ (1080 × 1920 FULL HD)
// - Uniquement le logo officiel DROP (ci-joint) + le QR Code dynamique
// - Aucun cadre, aucun texte de titre/artiste, aucune icône rouge séparée
// ============================================================================
const CANVAS_W = 1080;
const CANVAS_H = 1920;

const OFFICIAL_DROP_LOGO_SRC = '/assets/aistudio/Drop-logo-officiel_3a364bf8.png';

// Dimensions réduites du logo officiel DROP sur le canvas 1080×1920 (plus discret + opacité à 31%)
const DROP_LOGO_W = 188;
const DROP_LOGO_H = 44;
const DROP_LOGO_OPACITY = 0.31;

// Dimensions et position du QR Code dynamique permettant de scanner vers la chanson sur Drop
const QR_SIZE = 164;
const QR_LEFT_X = Math.round((CANVAS_W - QR_SIZE) / 2); // 458
const QR_TOP_Y = CANVAS_H - QR_SIZE - 180; // 1576

// Cycle temporel exact du logo DROP :
// Visible durant 2 secondes (2000 ms), puis disparaît 1/8 de seconde (125 ms)
// pour réapparaître ailleurs sur l'écran aléatoirement.
const LOGO_VISIBLE_MS = 2000;
const LOGO_HIDDEN_MS = 125; // 1/8 de seconde = 125 ms
const LOGO_CYCLE_MS = LOGO_VISIBLE_MS + LOGO_HIDDEN_MS; // 2125 ms

interface LogoPosition {
  x: number;
  y: number;
}

/**
 * Calcule une position aléatoire (x, y) sur l'écran 1080×1920 pour le logo officiel DROP
 * sans jamais se superposer au QR Code dynamique ni sortir des marges de sécurité.
 */
function pickRandomDropLogoPosition(prev?: LogoPosition): LogoPosition {
  const marginX = 64;
  const marginTop = 96;
  const marginBottom = 96;

  const minX = marginX;
  const maxX = CANVAS_W - DROP_LOGO_W - marginX;
  const minY = marginTop;
  const maxY = CANVAS_H - DROP_LOGO_H - marginBottom;

  // Zone de sécurité autour du QR Code
  const qrSafePad = 36;
  const qrBoxLeft = QR_LEFT_X - qrSafePad;
  const qrBoxRight = QR_LEFT_X + QR_SIZE + qrSafePad;
  const qrBoxTop = QR_TOP_Y - qrSafePad;
  const qrBoxBottom = QR_TOP_Y + QR_SIZE + qrSafePad;

  for (let attempt = 0; attempt < 30; attempt++) {
    const x = Math.round(minX + Math.random() * (maxX - minX));
    const y = Math.round(minY + Math.random() * (maxY - minY));

    const logoRight = x + DROP_LOGO_W;
    const logoBottom = y + DROP_LOGO_H;

    const overlapsQr =
      x < qrBoxRight &&
      logoRight > qrBoxLeft &&
      y < qrBoxBottom &&
      logoBottom > qrBoxTop;

    if (overlapsQr) continue;

    if (!prev) {
      return { x, y };
    }

    const dist = Math.hypot(x - prev.x, y - prev.y);
    if (dist >= 220) {
      return { x, y };
    }
  }

  return {
    x: Math.round(minX + Math.random() * (maxX - minX)),
    y: Math.round(minY + Math.random() * (QR_TOP_Y - DROP_LOGO_H - 60 - minY)),
  };
}

/**
 * Dessin vectoriel de secours fidèle au logo officiel blanc "DROP"
 * au cas où l'image PNG n'est pas encore décodée à la toute première frame.
 */
function drawFallbackOfficialDropLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#FFFFFF';

  const scaleX = w / 440;
  const scaleY = h / 100;
  ctx.scale(scaleX, scaleY);

  // Lettre D avec fente diagonale et triangle Play
  const dW = 108;
  const dH = 100;
  const r = dH / 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(dW - r, 0);
  ctx.arc(dW - r, r, r, -Math.PI / 2, Math.PI / 2, false);
  ctx.lineTo(0, dH);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(-2, 52);
  ctx.lineTo(36, 18);
  ctx.lineTo(80, 50);
  ctx.lineTo(36, 82);
  ctx.lineTo(24, 82);
  ctx.lineTo(24, 48);
  ctx.lineTo(-2, 70);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(35, 30);
  ctx.lineTo(68, 50);
  ctx.lineTo(35, 70);
  ctx.closePath();
  ctx.fill();

  const strokeT = 20;

  // Lettre R
  const rx = 124;
  const rw = 92;
  const bowlH = 58;
  ctx.fillRect(rx, 0, strokeT, dH);
  ctx.fillRect(rx, 0, rw - 28, strokeT);
  ctx.fillRect(rx, bowlH - strokeT, rw - 28, strokeT);
  ctx.beginPath();
  ctx.arc(rx + rw - 28, bowlH / 2, bowlH / 2, -Math.PI / 2, Math.PI / 2, false);
  ctx.arc(rx + rw - 28, bowlH / 2, bowlH / 2 - strokeT, Math.PI / 2, -Math.PI / 2, true);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(rx + rw - 48, bowlH - 2);
  ctx.lineTo(rx + rw - 24, bowlH - 2);
  ctx.lineTo(rx + rw, dH);
  ctx.lineTo(rx + rw - 24, dH);
  ctx.closePath();
  ctx.fill();

  // Lettre O
  const ox = 230;
  const ow = 104;
  ctx.beginPath();
  ctx.ellipse(ox + ow / 2, dH / 2, ow / 2, dH / 2, 0, 0, Math.PI * 2);
  ctx.ellipse(
    ox + ow / 2,
    dH / 2,
    ow / 2 - strokeT - 2,
    dH / 2 - strokeT,
    0,
    0,
    Math.PI * 2,
    true
  );
  ctx.fill('evenodd');

  // Lettre P
  const px = 350;
  const pw = 90;
  const pBowlH = 60;
  ctx.fillRect(px, 0, strokeT, dH);
  ctx.fillRect(px, 0, pw - 28, strokeT);
  ctx.fillRect(px, pBowlH - strokeT, pw - 28, strokeT);
  ctx.beginPath();
  ctx.arc(px + pw - 28, pBowlH / 2, pBowlH / 2, -Math.PI / 2, Math.PI / 2, false);
  ctx.arc(px + pw - 28, pBowlH / 2, pBowlH / 2 - strokeT, Math.PI / 2, -Math.PI / 2, true);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export const DropTrendMagazineStudio: React.FC<DropTrendMagazineStudioProps> = ({
  track,
  isOpen,
  onClose,
  onPauseMainPlayer,
}) => {
  // Verrouillage strict sur les 30 secondes max du Drop de la chanson
  const maxAllowedDropDuration = Math.min(30, Math.max(5, track.dropDuration || 30));
  const dropStartSec = Math.max(0, track.dropStart || 0);
  const dropEndSec = dropStartSec + maxAllowedDropDuration;

  const [step, setStep] = useState<FullscreenStep>('CAMERA_CAPTURE');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState<number>(0);

  // État d'enregistrement
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedSeconds, setRecordedSeconds] = useState<number>(0);
  const [finalRecordedDuration, setFinalRecordedDuration] = useState<number>(0);

  // État de lecture / pause et barre de progression manipulable sur la prévisualisation
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState<number>(0);
  const [previewDuration, setPreviewDuration] = useState<number>(0);

  // URL de la vidéo brute (pour l'aperçu avec le filigrane superposé sans double incrustation)
  const [rawPreviewVideoUrl, setRawPreviewVideoUrl] = useState<string | null>(null);
  // URL & Blob de la vidéo 1080×1920 avec le filigrane DROP gravé dedans (pour téléchargement & partage)
  const [watermarkedVideoUrl, setWatermarkedVideoUrl] = useState<string | null>(null);
  const [watermarkedVideoBlob, setWatermarkedVideoBlob] = useState<Blob | null>(null);
  const [recordedMimeExtension, setRecordedMimeExtension] = useState<'mp4' | 'webm'>('webm');

  // Confirmation visuelle discrète sur les boutons d'actions rapides
  const [savedToGalleryDone, setSavedToGalleryDone] = useState<boolean>(false);
  const [activeSocialShareId, setActiveSocialShareId] = useState<string | null>(null);

  // Position et cycle du logo officiel DROP (2s visible / 1/8s masqué / aléatoire)
  const logoPosRef = useRef<LogoPosition>(pickRandomDropLogoPosition());
  const logoCycleIndexRef = useRef<number>(0);
  const logoCycleStartRef = useRef<number>(performance.now());
  const officialLogoImgRef = useRef<HTMLImageElement | null>(null);

  // Références vidéo, canvas et audio
  const liveViewfinderVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const blurredPreviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraOffscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const nativeFileInputRef = useRef<HTMLInputElement | null>(null);
  const onPauseMainPlayerRef = useRef(onPauseMainPlayer);
  onPauseMainPlayerRef.current = onPauseMainPlayer;

  const exportWatermarkedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportRawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewWatermarkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const watermarkedRecorderRef = useRef<MediaRecorder | null>(null);
  const rawRecorderRef = useRef<MediaRecorder | null>(null);
  const watermarkedChunksRef = useRef<Blob[]>([]);
  const rawChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const synthTimerRef = useRef<number | null>(null);

  // Préchargement du logo officiel DROP ci-joint (Drop-logo-officiel.png)
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = OFFICIAL_DROP_LOGO_SRC;
    img.onload = () => {
      officialLogoImgRef.current = img;
    };
  }, []);

  // Lien direct vers la chanson dans le lecteur DROP pour le QR Code dynamique
  const songDirectUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://drop.music.ga';
    return `${origin}/?track=${encodeURIComponent(track.id)}`;
  }, [track.id]);

  // Génération du QR code dynamique dès le chargement du titre
  useEffect(() => {
    const offscreenQr = document.createElement('canvas');
    offscreenQr.width = QR_SIZE;
    offscreenQr.height = QR_SIZE;

    QRCode.toCanvas(
      offscreenQr,
      songDirectUrl,
      {
        width: QR_SIZE,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      },
      (err) => {
        if (!err) {
          qrCanvasRef.current = offscreenQr;
        }
      }
    );
  }, [songDirectUrl]);

  // Nettoyage flux caméra
  const stopCameraStream = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (cameraOffscreenVideoRef.current) {
      cameraOffscreenVideoRef.current.srcObject = null;
      cameraOffscreenVideoRef.current = null;
    }
    if (liveViewfinderVideoRef.current) {
      liveViewfinderVideoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  // Nettoyage immédiat de l'audio du Drop
  const stopDropAudioPlayback = useCallback(() => {
    if (synthTimerRef.current) {
      window.clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (htmlAudioRef.current) {
      try {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.src = '';
      } catch {
        // Ignore
      }
      htmlAudioRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        // Ignore
      }
      audioCtxRef.current = null;
    }
  }, []);

  // Connexion robuste à la caméra native ou web (mobile, tablette, PC) avec paliers de repli
  const startLiveCamera = useCallback(
    async (
      facing: 'user' | 'environment' = 'user',
      preferredDeviceId?: string
    ) => {
      stopCameraStream();
      setCameraError(false);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(true);
        setCameraReady(false);
        return;
      }

      const constraintAttempts: MediaStreamConstraints[] = [];

      if (preferredDeviceId) {
        constraintAttempts.push({
          video: {
            deviceId: { exact: preferredDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        constraintAttempts.push({
          video: { deviceId: { exact: preferredDeviceId } },
          audio: false,
        });
      }

      // Palier 1 : caméra avant/arrière idéale HD
      constraintAttempts.push({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      // Palier 2 : caméra avant/arrière simple
      constraintAttempts.push({
        video: { facingMode: facing },
        audio: false,
      });

      // Palier 3 : toute caméra disponible sur l'appareil (PC / Mac / Tablette / Mobile)
      constraintAttempts.push({
        video: true,
        audio: false,
      });

      let acquiredStream: MediaStream | null = null;

      for (const constraints of constraintAttempts) {
        try {
          acquiredStream = await navigator.mediaDevices.getUserMedia(constraints);
          if (acquiredStream && acquiredStream.getVideoTracks().length > 0) {
            break;
          }
        } catch {
          // Essayer le palier suivant
        }
      }

      // Palier 4 : énumération directe des périphériques vidéo si les contraintes standard ont échoué
      if (!acquiredStream) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cams = devices.filter((d) => d.kind === 'videoinput');
          for (const cam of cams) {
            if (!cam.deviceId) continue;
            try {
              acquiredStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: cam.deviceId } },
                audio: false,
              });
              if (acquiredStream) break;
            } catch {
              // Continuer
            }
          }
        } catch {
          // Ignore
        }
      }

      if (!acquiredStream) {
        setCameraError(true);
        setCameraReady(false);
        return;
      }

      cameraStreamRef.current = acquiredStream;

      // Mettre à jour la liste des caméras disponibles (utile sur PC multi-webcam ou mobile multi-capteur)
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const cams = allDevices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(cams);
      } catch {
        // Ignore
      }

      // Élément vidéo offscreen pour le dessin Canvas 1080×1920
      const vid = document.createElement('video');
      vid.srcObject = acquiredStream;
      vid.muted = true;
      vid.playsInline = true;
      vid.setAttribute('playsinline', 'true');
      vid.setAttribute('webkit-playsinline', 'true');
      try {
        await vid.play();
      } catch {
        // Ignore
      }
      cameraOffscreenVideoRef.current = vid;

      // Attacher immédiatement au viseur plein écran
      if (liveViewfinderVideoRef.current) {
        liveViewfinderVideoRef.current.srcObject = acquiredStream;
        liveViewfinderVideoRef.current.play().catch(() => {});
      }

      setCameraFacing(facing);
      setCameraReady(true);
      setCameraError(false);
    },
    [stopCameraStream]
  );

  // S'assurer que le viseur vidéo plein écran reçoit toujours le MediaStream actif
  useEffect(() => {
    if (
      isOpen &&
      step === 'CAMERA_CAPTURE' &&
      cameraStreamRef.current &&
      liveViewfinderVideoRef.current
    ) {
      if (liveViewfinderVideoRef.current.srcObject !== cameraStreamRef.current) {
        liveViewfinderVideoRef.current.srcObject = cameraStreamRef.current;
      }
      liveViewfinderVideoRef.current.play().catch(() => {});
    }
  }, [isOpen, step, cameraReady]);

  // Initialisation à l'ouverture de l'interface Trend (sans dépendance instable qui couperait la caméra)
  useEffect(() => {
    if (isOpen) {
      onPauseMainPlayerRef.current();
      setStep('CAMERA_CAPTURE');
      setIsRecording(false);
      setIsPreviewPlaying(false);
      setRecordedSeconds(0);
      setSavedToGalleryDone(false);
      logoCycleStartRef.current = performance.now();
      logoCycleIndexRef.current = 0;
      logoPosRef.current = pickRandomDropLogoPosition();
      startLiveCamera('user');
    } else {
      stopDropAudioPlayback();
      stopCameraStream();
      setIsRecording(false);
      setIsPreviewPlaying(false);
    }
    return () => {
      stopDropAudioPlayback();
      stopCameraStream();
    };
  }, [isOpen, track.id, startLiveCamera, stopDropAudioPlayback, stopCameraStream]);

  // ==========================================================================
  // MOTEUR AUDIO VERROUILLÉ SUR LES 30 SECONDES DU DROP (UNIQUEMENT PENDANT L'ENREGISTREMENT)
  // ==========================================================================
  const startDropAudioStrict = useCallback(async (): Promise<MediaStreamTrack | null> => {
    stopDropAudioPlayback();

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const streamDest = ctx.createMediaStreamDestination();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.92;
    masterGain.connect(streamDest);

    const speakerGain = ctx.createGain();
    speakerGain.gain.value = 0.88;
    masterGain.connect(speakerGain);
    speakerGain.connect(ctx.destination);

    let resolvedUrl = track.audioUrl || '';
    try {
      const persistedBlobUrl = await getPersistentAudioBlobUrl(track.id);
      if (persistedBlobUrl) {
        resolvedUrl = persistedBlobUrl;
      }
    } catch {
      // Ignore
    }

    let realAudioStarted = false;
    if (resolvedUrl) {
      try {
        const audioEl = new Audio();
        audioEl.crossOrigin = 'anonymous';
        audioEl.src = resolvedUrl;
        audioEl.preload = 'auto';
        audioEl.currentTime = dropStartSec;

        const mediaSource = ctx.createMediaElementSource(audioEl);
        mediaSource.connect(masterGain);

        audioEl.ontimeupdate = () => {
          if (
            audioEl.currentTime >= dropEndSec ||
            audioEl.currentTime < dropStartSec - 0.5
          ) {
            audioEl.currentTime = dropStartSec;
          }
        };

        await audioEl.play();
        htmlAudioRef.current = audioEl;
        realAudioStarted = true;
      } catch {
        realAudioStarted = false;
      }
    }

    if (!realAudioStarted) {
      const notes =
        track.synthNotes && track.synthNotes.length > 0
          ? track.synthNotes
          : [110, 146.83, 164.81, 196.0, 220.0];
      const bpm = Math.max(85, Math.min(165, track.bpm || 124));
      const stepMs = Math.round((60 / bpm / 2) * 1000);
      let stepCount = 0;

      const playStep = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          return;
        }
        const now = ctx.currentTime;

        if (stepCount % 2 === 0) {
          const kickOsc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(135, now);
          kickOsc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
          kickGain.gain.setValueAtTime(0.65, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          kickOsc.connect(kickGain);
          kickGain.connect(masterGain);
          kickOsc.start(now);
          kickOsc.stop(now + 0.21);
        }

        const noteFreq = notes[stepCount % notes.length];
        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        leadOsc.type = stepCount % 4 === 0 ? 'sawtooth' : 'triangle';
        leadOsc.frequency.setValueAtTime(
          noteFreq * (stepCount % 8 === 0 ? 2 : 1),
          now
        );
        leadGain.gain.setValueAtTime(0.2, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        leadOsc.connect(leadGain);
        leadGain.connect(masterGain);
        leadOsc.start(now);
        leadOsc.stop(now + 0.25);

        stepCount++;
      };

      playStep();
      synthTimerRef.current = window.setInterval(playStep, stepMs);
    }

    const audioTracks = streamDest.stream.getAudioTracks();
    return audioTracks.length > 0 ? audioTracks[0] : null;
  }, [
    track.id,
    track.audioUrl,
    track.synthNotes,
    track.bpm,
    dropStartSec,
    dropEndSec,
    stopDropAudioPlayback,
  ]);

  // ==========================================================================
  // DESSIN DU NOUVEAU FILIGRANE DROP (1080×1920)
  // - UNIQUEMENT le logo officiel DROP (visible 2s / masqué 1/8s / aléatoire)
  // - ET le QR Code dynamique pointant vers la chanson sur le lecteur Drop
  // ==========================================================================
  const drawMandatoryDropWatermarkLayer = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      currentLogoState: { visible: boolean; x: number; y: number }
    ) => {
      ctx.save();

      // 1. Logo officiel "DROP" animé (opacité 31%, plus petit, visible 2s, disparaît 1/8s, réapparaît ailleurs aléatoirement)
      if (currentLogoState.visible) {
        ctx.save();
        ctx.globalAlpha = DROP_LOGO_OPACITY; // Opacité abaissée à 31%
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 2;

        const logoImg = officialLogoImgRef.current;
        if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
          const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
          const drawW = DROP_LOGO_W;
          const drawH = Math.round(drawW / aspect);
          ctx.drawImage(
            logoImg,
            currentLogoState.x,
            currentLogoState.y,
            drawW,
            drawH
          );
        } else {
          drawFallbackOfficialDropLogo(
            ctx,
            currentLogoState.x,
            currentLogoState.y,
            DROP_LOGO_W,
            DROP_LOGO_H
          );
        }
        ctx.restore();
      }

      // 2. QR Code dynamique permettant de scanner et d'être redirigé vers la chanson sur le lecteur Drop
      if (qrCanvasRef.current) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(QR_LEFT_X - 4, QR_TOP_Y - 4, QR_SIZE + 8, QR_SIZE + 8);
        ctx.drawImage(
          qrCanvasRef.current,
          QR_LEFT_X,
          QR_TOP_Y,
          QR_SIZE,
          QR_SIZE
        );
        ctx.restore();
      }

      ctx.restore();
    },
    []
  );

  // ==========================================================================
  // BOUCLE DE RENDU TEMPS RÉEL (POUR L'EXPORT VIDÉO + L'APERÇU INSTANTANÉ)
  // ==========================================================================
  useEffect(() => {
    if (!isOpen) return;

    const renderFrame = (now: number) => {
      // Cycle exact : 2 secondes visible (2000 ms) / 1/8 de seconde masqué (125 ms)
      const cycleElapsedMs = now - logoCycleStartRef.current;
      const currentCycleIdx = Math.floor(cycleElapsedMs / LOGO_CYCLE_MS);
      const msInCurrentCycle = cycleElapsedMs % LOGO_CYCLE_MS;

      if (currentCycleIdx !== logoCycleIndexRef.current) {
        logoCycleIndexRef.current = currentCycleIdx;
        logoPosRef.current = pickRandomDropLogoPosition(logoPosRef.current);
      }

      const isVisibleNow = msInCurrentCycle < LOGO_VISIBLE_MS;
      const logoStateNow = {
        visible: isVisibleNow,
        x: logoPosRef.current.x,
        y: logoPosRef.current.y,
      };

      // Dessin du flux caméra actif sur un canvas 1080×1920 avec fond vidéo flou (zéro bordure noire)
      const drawCameraBase = (ctx: CanvasRenderingContext2D) => {
        const sourceVideo =
          cameraOffscreenVideoRef.current &&
          cameraOffscreenVideoRef.current.readyState >= 2
            ? cameraOffscreenVideoRef.current
            : liveViewfinderVideoRef.current &&
              liveViewfinderVideoRef.current.readyState >= 2
            ? liveViewfinderVideoRef.current
            : null;

        if (sourceVideo) {
          const vw = sourceVideo.videoWidth || 1080;
          const vh = sourceVideo.videoHeight || 1920;

          // Couche 1 : Fond vidéo en mode flou (remplace toute bordure noire)
          const coverScale = Math.max(CANVAS_W / vw, CANVAS_H / vh) * 1.12;
          const bgW = vw * coverScale;
          const bgH = vh * coverScale;
          const bgX = (CANVAS_W - bgW) / 2;
          const bgY = (CANVAS_H - bgH) / 2;

          ctx.save();
          ctx.filter = 'blur(32px) brightness(0.82)';
          if (cameraFacing === 'user') {
            ctx.translate(CANVAS_W, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(sourceVideo, CANVAS_W - bgX - bgW, bgY, bgW, bgH);
          } else {
            ctx.drawImage(sourceVideo, bgX, bgY, bgW, bgH);
          }
          ctx.restore();

          // Couche 2 : Vidéo principale plein format
          const scale = Math.max(CANVAS_W / vw, CANVAS_H / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          const dx = (CANVAS_W - dw) / 2;
          const dy = (CANVAS_H - dh) / 2;

          ctx.save();
          if (cameraFacing === 'user') {
            ctx.translate(CANVAS_W, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(sourceVideo, CANVAS_W - dx - dw, dy, dw, dh);
          } else {
            ctx.drawImage(sourceVideo, dx, dy, dw, dh);
          }
          ctx.restore();
        }
      };

      // 1. Mise à jour des canvas d'enregistrement pendant la prise de vue
      if (step === 'CAMERA_CAPTURE') {
        const wmCanvas = exportWatermarkedCanvasRef.current;
        if (wmCanvas) {
          const wmCtx = wmCanvas.getContext('2d');
          if (wmCtx) {
            drawCameraBase(wmCtx);
            drawMandatoryDropWatermarkLayer(wmCtx, logoStateNow);
          }
        }

        const rawCanvas = exportRawCanvasRef.current;
        if (rawCanvas) {
          const rawCtx = rawCanvas.getContext('2d');
          if (rawCtx) {
            drawCameraBase(rawCtx);
          }
        }
      }

      // 2. Mise à jour du filigrane DROP en direct sur l'écran de prévisualisation instantanée
      if (step === 'INSTANT_PREVIEW') {
        const prevCanvas = previewWatermarkCanvasRef.current;
        if (prevCanvas) {
          const prevCtx = prevCanvas.getContext('2d');
          if (prevCtx) {
            prevCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
            drawMandatoryDropWatermarkLayer(prevCtx, logoStateNow);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animFrameRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    isOpen,
    step,
    cameraReady,
    cameraFacing,
    drawMandatoryDropWatermarkLayer,
  ]);

  // ==========================================================================
  // DÉMARRAGE & ARRÊT DE L'ENREGISTREMENT PLEIN ÉCRAN
  // (COUPURE IMMÉDIATE DE L'AUDIO DU DROP DÈS QUE L'ENREGISTREMENT EST COUPÉ)
  // ==========================================================================
  const stopTrendRecording = useCallback(() => {
    // 1. Couper immédiatement l'audio du Drop dès que l'enregistrement est coupé
    stopDropAudioPlayback();
    setIsRecording(false);

    // 2. Arrêter les enregistreurs vidéo
    if (
      watermarkedRecorderRef.current &&
      watermarkedRecorderRef.current.state !== 'inactive'
    ) {
      try {
        watermarkedRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
    if (
      rawRecorderRef.current &&
      rawRecorderRef.current.state !== 'inactive'
    ) {
      try {
        rawRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
  }, [stopDropAudioPlayback]);

  const startTrendRecording = async () => {
    const wmCanvas = exportWatermarkedCanvasRef.current;
    const rawCanvas = exportRawCanvasRef.current;
    if (!wmCanvas) return;

    if (watermarkedVideoUrl) {
      URL.revokeObjectURL(watermarkedVideoUrl);
      setWatermarkedVideoUrl(null);
      setWatermarkedVideoBlob(null);
    }
    if (rawPreviewVideoUrl) {
      URL.revokeObjectURL(rawPreviewVideoUrl);
      setRawPreviewVideoUrl(null);
    }

    watermarkedChunksRef.current = [];
    rawChunksRef.current = [];
    setRecordedSeconds(0);
    setSavedToGalleryDone(false);
    setIsPreviewPlaying(false);
    setIsRecording(true);
    recordingStartTimeRef.current = performance.now();

    // Réinitialiser le cycle 2s / 1/8s du logo DROP au début de la prise
    logoCycleStartRef.current = performance.now();
    logoCycleIndexRef.current = 0;
    logoPosRef.current = pickRandomDropLogoPosition();

    // Lancement de l'audio verrouillé sur les 30s du Drop uniquement pendant l'enregistrement
    const audioTrack = await startDropAudioStrict();

    let chosenMime = 'video/webm;codecs=vp9,opus';
    let ext: 'mp4' | 'webm' = 'webm';
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        chosenMime = 'video/mp4';
        ext = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        chosenMime = 'video/webm;codecs=vp9,opus';
        ext = 'webm';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        chosenMime = 'video/webm';
        ext = 'webm';
      }
    }
    setRecordedMimeExtension(ext);

    try {
      // Flux 1 : Vidéo 1080×1920 avec filigrane DROP gravé + audio du Drop
      const wmStream = wmCanvas.captureStream(30);
      if (audioTrack) {
        wmStream.addTrack(audioTrack);
      }

      const wmRecorder = new MediaRecorder(wmStream, {
        mimeType: chosenMime,
        videoBitsPerSecond: 6000000,
      });

      wmRecorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          watermarkedChunksRef.current.push(ev.data);
        }
      };

      wmRecorder.onstop = () => {
        // S'assurer que l'audio du Drop est bien coupé dès la fin de l'enregistrement
        stopDropAudioPlayback();

        const elapsed = Math.min(
          30,
          Math.max(
            1,
            Math.round(
              (performance.now() - recordingStartTimeRef.current) / 1000
            )
          )
        );
        setFinalRecordedDuration(elapsed);
        setPreviewCurrentTime(0);
        setPreviewDuration(elapsed);
        const wmBlob = new Blob(watermarkedChunksRef.current, {
          type: chosenMime,
        });
        const wmUrl = URL.createObjectURL(wmBlob);
        setWatermarkedVideoBlob(wmBlob);
        setWatermarkedVideoUrl(wmUrl);
        setIsRecording(false);
        setIsPreviewPlaying(false);
        // Bascule automatique et instantanée vers la prévisualisation avec filigrane DROP
        setStep('INSTANT_PREVIEW');
      };

      watermarkedRecorderRef.current = wmRecorder;
      wmRecorder.start(150);

      // Flux 2 : Vidéo caméra nue + piste audio enregistrée pour l'aperçu avec bouton Play/Pause
      if (rawCanvas) {
        try {
          const rawStream = rawCanvas.captureStream(30);
          if (audioTrack) {
            try {
              rawStream.addTrack(audioTrack.clone());
            } catch {
              // Ignore si le clonage n'est pas supporté
            }
          }
          const rawRecorder = new MediaRecorder(rawStream, {
            mimeType: chosenMime,
            videoBitsPerSecond: 5000000,
          });
          rawRecorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) {
              rawChunksRef.current.push(ev.data);
            }
          };
          rawRecorder.onstop = () => {
            if (rawChunksRef.current.length > 0) {
              const rawBlob = new Blob(rawChunksRef.current, {
                type: chosenMime,
              });
              setRawPreviewVideoUrl(URL.createObjectURL(rawBlob));
            }
          };
          rawRecorderRef.current = rawRecorder;
          rawRecorder.start(150);
        } catch {
          rawRecorderRef.current = null;
        }
      }
    } catch {
      setIsRecording(false);
      stopDropAudioPlayback();
    }
  };

  // Arrêt automatique à 30 secondes max (ou fin du Drop)
  useEffect(() => {
    if (!isRecording) return;
    const hardCapSec = Math.min(30, maxAllowedDropDuration);
    const interval = window.setInterval(() => {
      const elapsed =
        (performance.now() - recordingStartTimeRef.current) / 1000;
      if (elapsed >= hardCapSec) {
        setRecordedSeconds(hardCapSec);
        stopTrendRecording();
      } else {
        setRecordedSeconds(Number(elapsed.toFixed(1)));
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [isRecording, maxAllowedDropDuration, stopTrendRecording]);

  // ==========================================================================
  // LECTURE / PAUSE & BARRE DE LECTURE MANIPULABLE SUR LA PRÉVISUALISATION
  // ==========================================================================
  const handleTogglePreviewPlayPause = useCallback(() => {
    const vid = previewVideoRef.current;
    const blurVid = blurredPreviewVideoRef.current;
    if (!vid) return;

    if (vid.paused || vid.ended) {
      vid.muted = false;
      vid
        .play()
        .then(() => {
          setIsPreviewPlaying(true);
          if (blurVid) {
            blurVid.currentTime = vid.currentTime;
            blurVid.play().catch(() => {});
          }
        })
        .catch(() => {
          // Repli muet si le navigateur bloque l'audio
          vid.muted = true;
          vid
            .play()
            .then(() => {
              setIsPreviewPlaying(true);
              if (blurVid) {
                blurVid.currentTime = vid.currentTime;
                blurVid.play().catch(() => {});
              }
            })
            .catch(() => {});
        });
    } else {
      vid.pause();
      if (blurVid) {
        blurVid.pause();
      }
      setIsPreviewPlaying(false);
    }
  }, []);

  const handleSeekPreviewVideo = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextTime = parseFloat(e.target.value);
      if (!Number.isFinite(nextTime)) return;
      setPreviewCurrentTime(nextTime);
      if (previewVideoRef.current) {
        previewVideoRef.current.currentTime = nextTime;
      }
      if (blurredPreviewVideoRef.current) {
        blurredPreviewVideoRef.current.currentTime = nextTime;
      }
    },
    []
  );

  const formatPreviewTime = (sec: number): string => {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const totalSec = Math.floor(sec);
    const mins = Math.floor(totalSec / 60);
    const remSec = totalSec % 60;
    return `${mins}:${remSec.toString().padStart(2, '0')}`;
  };

  // ==========================================================================
  // BASCULE CAMÉRA FACECAM / CAMÉRA ARRIÈRE (MOBILE, TABLETTE, PC)
  // ==========================================================================
  const handleToggleCameraFacing = () => {
    if (isRecording) return;
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    if (videoDevices.length > 1) {
      const nextIdx = (activeDeviceIndex + 1) % videoDevices.length;
      setActiveDeviceIndex(nextIdx);
      startLiveCamera(nextFacing, videoDevices[nextIdx]?.deviceId);
    } else {
      startLiveCamera(nextFacing);
    }
  };

  // Prise en charge de la caméra native du système si l'utilisateur l'ouvre via le capteur natif
  const handleNativeCameraFileCapture = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopDropAudioPlayback();
    const url = URL.createObjectURL(file);
    setRawPreviewVideoUrl(url);
    setWatermarkedVideoBlob(file);
    setWatermarkedVideoUrl(url);
    setFinalRecordedDuration(15);
    setIsPreviewPlaying(false);
    setStep('INSTANT_PREVIEW');
  };

  // ==========================================================================
  // ACTIONS RAPIDES : SAUVEGARDER DANS LA GALERIE, PARTAGER RÉSEAUX, RECOMMENCER
  // ==========================================================================
  const triggerSaveToGallery = useCallback(() => {
    const targetUrl = watermarkedVideoUrl || rawPreviewVideoUrl;
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    const safeTitle = track.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `DROP_Trend_${safeTitle}_${finalRecordedDuration || Math.max(1, Math.round(recordedSeconds))}s.${recordedMimeExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setSavedToGalleryDone(true);
    setTimeout(() => setSavedToGalleryDone(false), 2500);
  }, [
    watermarkedVideoUrl,
    rawPreviewVideoUrl,
    track.title,
    finalRecordedDuration,
    recordedSeconds,
    recordedMimeExtension,
  ]);

  const handleSocialQuickPublish = async (networkId: string) => {
    setActiveSocialShareId(networkId);
    setTimeout(() => setActiveSocialShareId(null), 2000);

    if (navigator.share) {
      try {
        if (watermarkedVideoBlob && navigator.canShare) {
          const safeTitle = track.title.replace(/[^a-zA-Z0-9_-]/g, '_');
          const file = new File(
            [watermarkedVideoBlob],
            `DROP_Trend_${safeTitle}.${recordedMimeExtension}`,
            { type: watermarkedVideoBlob.type }
          );
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
            });
            return;
          }
        }
        await navigator.share({
          title: `${track.title} — ${track.artist}`,
          url: songDirectUrl,
        });
        return;
      } catch {
        // Repli sur sauvegarde galerie
      }
    }

    triggerSaveToGallery();
  };

  const handleRestartTrend = () => {
    stopDropAudioPlayback();
    if (previewVideoRef.current) {
      previewVideoRef.current.pause();
    }
    setIsPreviewPlaying(false);
    if (watermarkedVideoUrl) {
      URL.revokeObjectURL(watermarkedVideoUrl);
      setWatermarkedVideoUrl(null);
      setWatermarkedVideoBlob(null);
    }
    if (rawPreviewVideoUrl) {
      URL.revokeObjectURL(rawPreviewVideoUrl);
      setRawPreviewVideoUrl(null);
    }
    setRecordedSeconds(0);
    setSavedToGalleryDone(false);
    setStep('CAMERA_CAPTURE');
    if (!cameraReady || !cameraStreamRef.current) {
      startLiveCamera(cameraFacing);
    }
  };

  if (!isOpen) return null;

  const hardLimitSec = Math.min(30, maxAllowedDropDuration);
  const progressPct = Math.min(100, (recordedSeconds / hardLimitSec) * 100);

  return (
    <div className="fixed inset-0 z-[150] w-screen h-screen bg-black overflow-hidden select-none">
      {/* Canvas haute définition 1080×1920 invisibles servant à l'enregistrement temps réel */}
      <canvas
        ref={exportWatermarkedCanvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="hidden"
      />
      <canvas
        ref={exportRawCanvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="hidden"
      />

      {/* Capteur caméra natif mobile/tablette en secours direct */}
      <input
        ref={nativeFileInputRef}
        type="file"
        accept="video/*"
        capture={cameraFacing === 'user' ? 'user' : 'environment'}
        onChange={handleNativeCameraFileCapture}
        className="hidden"
      />

      {/* ====================================================================
          ÉTAPE 1 : CAMÉRA EN PLEIN ÉCRAN (FACECAM OU ARRIÈRE) AVEC LE SEUL BOUTON ROUGE
          ==================================================================== */}
      {step === 'CAMERA_CAPTURE' && (
        <div className="relative w-full h-full bg-black overflow-hidden">
          {/* Flux vidéo caméra plein écran TOUJOURS monté dans le DOM */}
          <video
            ref={liveViewfinderVideoRef}
            autoPlay
            muted
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${
              cameraFacing === 'user' ? '-scale-x-100' : ''
            }`}
          />

          {/* Si le navigateur demande une action manuelle pour autoriser la caméra web ou native */}
          {cameraError && !cameraReady && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
              <button
                type="button"
                onClick={() => startLiveCamera(cameraFacing)}
                className="px-5 py-3 rounded-full bg-white text-black font-semibold text-sm flex items-center gap-2 shadow-xl active:scale-95 transition"
              >
                <Camera className="w-4 h-4" />
                <span>Activer la caméra en direct</span>
              </button>
              <button
                type="button"
                onClick={() => nativeFileInputRef.current?.click()}
                className="px-4 py-2 rounded-full bg-zinc-800/90 border border-white/15 text-white/90 text-xs font-medium active:scale-95 transition"
              >
                Ouvrir l&apos;appareil photo natif
              </button>
            </div>
          )}

          {/* Grille de cadrage 3×3 plein écran */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-white/20" />
            <div className="border-r border-white/20" />
            <div />
          </div>

          {/* Barre de progression fine en haut de l'écran pendant l'enregistrement */}
          {isRecording && (
            <div className="absolute top-0 inset-x-0 h-1.5 bg-white/15 z-30">
              <div
                className="h-full bg-[#ff3b30] transition-all duration-100"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          {/* En-tête épuré : uniquement le bouton Fermer et le chronomètre pendant l'enregistrement */}
          <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 flex items-center justify-between z-30">
            <button
              type="button"
              onClick={() => {
                stopTrendRecording();
                onClose();
              }}
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 hover:text-white active:scale-95 transition"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>

            {isRecording && (
              <div className="px-3 py-1 sm:px-3.5 rounded-full bg-[#ff3b30] text-white font-mono text-[11px] sm:text-xs font-bold tracking-wider flex items-center gap-1.5 sm:gap-2 shadow-lg">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-ping" />
                <span>
                  00:{Math.floor(recordedSeconds).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            <div className="w-7 h-7 sm:w-10 sm:h-10" />
          </div>

          {/* Zone basse de la caméra plein écran : uniquement le bouton rouge d'enregistrement et la bascule caméra */}
          <div className="absolute bottom-8 inset-x-0 flex items-center justify-center z-30">
            <div className="w-full max-w-md px-8 flex items-center justify-between">
              <div className="w-12 h-12" />

              {/* BOUTON D'ENREGISTREMENT ROUGE UNIQUE (Clic 1 = Enregistrer, Clic 2 = Couper l'enregistrement) */}
              <button
                type="button"
                onClick={() => {
                  if (isRecording) {
                    stopTrendRecording();
                  } else {
                    startTrendRecording();
                  }
                }}
                className="relative w-20 h-20 rounded-full border-[4px] border-white/85 bg-black/30 flex items-center justify-center active:scale-95 transition-transform shadow-[0_0_30px_rgba(0,0,0,0.7)]"
                aria-label={
                  isRecording
                    ? "Couper l'enregistrement"
                    : "Lancer l'enregistrement"
                }
              >
                <span
                  className={`bg-[#ff3b30] transition-all duration-200 ${
                    isRecording
                      ? 'w-8 h-8 rounded-md shadow-[0_0_20px_rgba(255,59,48,0.9)]'
                      : 'w-[64px] h-[64px] rounded-full'
                  }`}
                />
              </button>

              {/* Bascule Caméra Facecam (Avant) / Caméra Arrière */}
              <button
                type="button"
                onClick={handleToggleCameraFacing}
                disabled={isRecording}
                className="w-12 h-12 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 hover:text-white active:scale-95 transition disabled:opacity-30"
                aria-label="Basculer la caméra avant ou arrière"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          ÉTAPE 2 : PRÉVISUALISATION & ACTIONS RAPIDES
          - FOND EN VIDÉO FLOU (AUCUNE BORDURE NOIRE)
          - BARRE DE LECTURE INTERACTIVE (REVENIR EN ARRIÈRE / AVANCER) + BOUTON PLAY/PAUSE
          - FILIGRANE DROP ÉPURÉ (LOGO OFFICIEL 31% OPACITÉ, PLUS PETIT, 2S / 1/8S + QR CODE)
          - BOUTONS EN COULEURS VIVES (STORIES GRISÉ)
          ==================================================================== */}
      {step === 'INSTANT_PREVIEW' && (() => {
        const effectivePreviewDuration =
          previewDuration > 0 && Number.isFinite(previewDuration)
            ? previewDuration
            : finalRecordedDuration > 0
            ? finalRecordedDuration
            : Math.max(1, Math.round(recordedSeconds) || 15);

        const activeVideoSrc = rawPreviewVideoUrl || watermarkedVideoUrl || undefined;

        return (
          <div className="relative w-full h-full flex flex-col overflow-hidden">
            {/* FOND GLOBAL EN MODE VIDÉO FLOU (REMPLACE TOUTE BORDURE NOIRE) */}
            {activeVideoSrc && (
              <video
                ref={blurredPreviewVideoRef}
                src={activeVideoSrc}
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-85 pointer-events-none select-none z-0"
              />
            )}
            <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-2xl pointer-events-none z-0" />

            {/* ZONE 1 (PRIORITAIRE) : ESPACE DÉDIÉ À LA VIDÉO EN GRAND SANS BORDURE NOIRE */}
            <div className="relative flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-3 overflow-hidden z-10">
              {/* Bouton Fermer dans le coin supérieur droit (plus compact sur mobile) */}
              <button
                type="button"
                onClick={() => {
                  stopDropAudioPlayback();
                  if (previewVideoRef.current) {
                    previewVideoRef.current.pause();
                  }
                  if (blurredPreviewVideoRef.current) {
                    blurredPreviewVideoRef.current.pause();
                  }
                  onClose();
                }}
                className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-30 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/60 backdrop-blur-xl border border-white/25 flex items-center justify-center text-white shadow-lg active:scale-95 transition"
                aria-label="Fermer"
              >
                <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>

              {/* Conteneur 9:16 grand format avec fond vidéo flou intégré (aucune bordure noire) */}
              <div
                onClick={handleTogglePreviewPlayPause}
                className="relative h-full aspect-[9/16] max-w-full rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/25 flex items-center justify-center cursor-pointer group"
              >
                {/* Sous-couche vidéo floue interne pour éviter toute bande noire si le ratio caméra diffère */}
                {activeVideoSrc && (
                  <video
                    src={activeVideoSrc}
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-90 pointer-events-none"
                  />
                )}

                {/* Vidéo principale */}
                {activeVideoSrc && (
                  <video
                    ref={previewVideoRef}
                    src={activeVideoSrc}
                    loop
                    playsInline
                    onLoadedMetadata={(e) => {
                      const d = e.currentTarget.duration;
                      if (Number.isFinite(d) && d > 0) {
                        setPreviewDuration(d);
                      }
                    }}
                    onTimeUpdate={(e) => {
                      const ct = e.currentTarget.currentTime;
                      setPreviewCurrentTime(ct);
                      const d = e.currentTarget.duration;
                      if (Number.isFinite(d) && d > 0 && d !== previewDuration) {
                        setPreviewDuration(d);
                      }
                      if (
                        blurredPreviewVideoRef.current &&
                        Math.abs(blurredPreviewVideoRef.current.currentTime - ct) > 0.25
                      ) {
                        blurredPreviewVideoRef.current.currentTime = ct;
                      }
                    }}
                    onPlay={() => {
                      setIsPreviewPlaying(true);
                      blurredPreviewVideoRef.current?.play().catch(() => {});
                    }}
                    onPause={() => {
                      setIsPreviewPlaying(false);
                      blurredPreviewVideoRef.current?.pause();
                    }}
                    onEnded={() => {
                      setIsPreviewPlaying(false);
                      blurredPreviewVideoRef.current?.pause();
                    }}
                    className="relative z-[1] w-full h-full object-cover"
                  />
                )}

                {/* FILIGRANE OBLIGATOIRE DROP (LOGO OFFICIEL 31% OPACITÉ + QR CODE) POSÉ SUR LA VIDÉO */}
                <canvas
                  ref={previewWatermarkCanvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className={`absolute inset-0 w-full h-full object-contain pointer-events-none z-10 ${
                    !rawPreviewVideoUrl && watermarkedVideoUrl ? 'hidden' : 'block'
                  }`}
                />

                {/* BOUTON PLAY CENTRAL QUAND LA VIDÉO EST EN PAUSE */}
                {!isPreviewPlaying && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePreviewPlayPause();
                    }}
                    aria-label="Lire la vidéo"
                    className="absolute z-20 w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#ff3b30] to-pink-500 text-white border border-white/40 shadow-[0_10px_35px_rgba(255,59,48,0.55)] hover:scale-105 active:scale-95 transition-all"
                  >
                    <Play className="w-7 h-7 fill-white ml-0.5" />
                  </button>
                )}

                {/* BARRE DE LECTURE INTERACTIVE (PLAY/PAUSE + CURSEUR POUR REVENIR EN ARRIÈRE / AVANCER) */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-2 inset-x-2 sm:bottom-2.5 sm:inset-x-2.5 z-20 flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-black/45 backdrop-blur-xl border border-white/25 shadow-lg overflow-hidden max-w-full"
                >
                  <button
                    type="button"
                    onClick={handleTogglePreviewPlayPause}
                    aria-label={
                      isPreviewPlaying
                        ? 'Mettre la vidéo en pause'
                        : 'Lire la vidéo'
                    }
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#ff3b30] to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md active:scale-90 transition"
                  >
                    {isPreviewPlaying ? (
                      <Pause className="w-3 h-3 sm:w-4 sm:h-4 fill-white" />
                    ) : (
                      <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-white ml-0.5" />
                    )}
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={effectivePreviewDuration}
                    step={0.05}
                    value={Math.min(previewCurrentTime, effectivePreviewDuration)}
                    onChange={handleSeekPreviewVideo}
                    aria-label="Barre de lecture vidéo"
                    className="min-w-0 w-0 flex-1 h-1 sm:h-1.5 rounded-full accent-[#ff3b30] bg-white/30 cursor-pointer"
                  />

                  <span className="text-[9px] sm:text-[11px] font-mono font-semibold text-white drop-shadow shrink-0 whitespace-nowrap tabular-nums leading-none">
                    {formatPreviewTime(previewCurrentTime)}/{formatPreviewTime(effectivePreviewDuration)}
                  </span>
                </div>
              </div>
            </div>

            {/* ZONE 2 (SÉPARÉE) : ESPACE DÉDIÉ AUX BOUTONS EN COULEURS DE PUBLICATION & ACTIONS RAPIDES */}
            <div className="relative shrink-0 w-full bg-white/10 backdrop-blur-2xl border-t border-white/20 px-4 py-3 z-20">
              <div className="max-w-md mx-auto space-y-2.5">
                {/* Barre de publication rapide sur les réseaux sociaux en couleurs */}
                <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-3 py-2.5 shadow-lg">
                  <div className="grid grid-cols-5 gap-1">
                    {/* WhatsApp (Vert officiel) */}
                    <button
                      type="button"
                      onClick={() => handleSocialQuickPublish('WHATSAPP')}
                      className="flex flex-col items-center gap-1 group active:scale-95 transition"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition ${
                          activeSocialShareId === 'WHATSAPP'
                            ? 'bg-emerald-400 scale-105 shadow-emerald-400/40'
                            : 'bg-[#25D366] shadow-[#25D366]/35 group-hover:scale-105'
                        }`}
                      >
                        {activeSocialShareId === 'WHATSAPP' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5 fill-current"
                          >
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 14C16.31 13.86 15.09 13.26 14.87 13.18C14.64 13.1 14.5 13.06 14.31 13.3C14.15 13.55 13.67 14.11 13.53 14.27C13.38 14.44 13.24 14.46 13 14.34C12.74 14.21 11.94 13.95 11 13.11C10.26 12.45 9.77 11.64 9.62 11.39C9.5 11.15 9.61 11 9.73 10.89C9.84 10.78 10 10.6 10.1 10.45C10.23 10.31 10.27 10.2 10.35 10.04C10.43 9.87 10.39 9.73 10.33 9.61C10.27 9.5 9.77 8.26 9.56 7.77C9.36 7.29 9.16 7.35 9 7.34C8.86 7.34 8.7 7.33 8.53 7.33Z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[11px] text-white font-semibold drop-shadow">
                        WhatsApp
                      </span>
                    </button>

                    {/* Facebook (Bleu officiel) */}
                    <button
                      type="button"
                      onClick={() => handleSocialQuickPublish('FACEBOOK')}
                      className="flex flex-col items-center gap-1 group active:scale-95 transition"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition ${
                          activeSocialShareId === 'FACEBOOK'
                            ? 'bg-emerald-500 scale-105 shadow-emerald-500/40'
                            : 'bg-[#1877F2] shadow-[#1877F2]/35 group-hover:scale-105'
                        }`}
                      >
                        {activeSocialShareId === 'FACEBOOK' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5 fill-current"
                          >
                            <path d="M14 13.5H16.5L17.5 9.5H14V7.5C14 6.47 14 5.5 16 5.5H17.5V2.14C17.174 2.097 15.943 2 14.643 2C11.928 2 10 3.657 10 6.7V9.5H7V13.5H10V22H14V13.5Z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[11px] text-white font-semibold drop-shadow">
                        Facebook
                      </span>
                    </button>

                    {/* Instagram (Dégradé officiel orange/rose/violet) */}
                    <button
                      type="button"
                      onClick={() => handleSocialQuickPublish('INSTAGRAM')}
                      className="flex flex-col items-center gap-1 group active:scale-95 transition"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition ${
                          activeSocialShareId === 'INSTAGRAM'
                            ? 'bg-emerald-500 scale-105 shadow-emerald-500/40'
                            : 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-[#dc2743]/35 group-hover:scale-105'
                        }`}
                      >
                        {activeSocialShareId === 'INSTAGRAM' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5 fill-current"
                          >
                            <path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[11px] text-white font-semibold drop-shadow">
                        Instagram
                      </span>
                    </button>

                    {/* Stories (Grisé — Fonctionnalité future) */}
                    <button
                      type="button"
                      disabled
                      title="Fonctionnalité bientôt disponible"
                      className="relative flex flex-col items-center gap-1 opacity-40 cursor-not-allowed select-none"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-dashed border-white/40 bg-white/10 text-white/60">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] text-white/60 font-medium">
                        Stories
                      </span>
                    </button>

                    {/* Autre (Dégradé Violet / Indigo) */}
                    <button
                      type="button"
                      onClick={() => handleSocialQuickPublish('AUTRE')}
                      className="flex flex-col items-center gap-1 group active:scale-95 transition"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition ${
                          activeSocialShareId === 'AUTRE'
                            ? 'bg-emerald-500 scale-105 shadow-emerald-500/40'
                            : 'bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-violet-600/35 group-hover:scale-105'
                        }`}
                      >
                        {activeSocialShareId === 'AUTRE' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <MoreHorizontal className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-[11px] text-white font-semibold drop-shadow">
                        Autre
                      </span>
                    </button>
                  </div>
                </div>

                {/* Boutons d'actions rapides en couleurs : Sauvegarder dans la galerie + Recommencer la Trend */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={triggerSaveToGallery}
                    className="flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border border-white/25 shadow-lg shadow-emerald-600/30 active:scale-95 transition"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/20 border border-white/40 flex items-center justify-center text-white shrink-0">
                      {savedToGalleryDone ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-white leading-tight text-left drop-shadow-sm">
                      {savedToGalleryDone
                        ? 'Sauvegardé !'
                        : 'Sauvegarder dans la galerie'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestartTrend}
                    className="flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-2xl bg-gradient-to-r from-[#ff3b30] to-rose-600 hover:from-[#ff5247] hover:to-rose-500 text-white border border-white/25 shadow-lg shadow-[#ff3b30]/30 active:scale-95 transition"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/20 border border-white/40 flex items-center justify-center text-white shrink-0">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white leading-tight text-left drop-shadow-sm">
                      Recommencer la Trend
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

