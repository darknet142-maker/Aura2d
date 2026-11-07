import { useState, useRef, useCallback, useEffect } from 'react';
import { getPersistentAudioBlobUrl } from '../../../services/musicService';

export interface InlinePreviewTrackSource {
  id: string;
  audioUrl?: string;
  dropStart: number;
  dropDuration: number;
  bpm?: number;
  synthNotes?: number[];
}

export function useInlineDropPreviewAudio(onPauseMainPlayer: () => void) {
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [maxSec, setMaxSec] = useState<number>(30);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const synthNoteTimerRef = useRef<number | null>(null);
  const dropStartRef = useRef<number>(0);
  const startWallMsRef = useRef<number>(0);
  const offsetSecRef = useRef<number>(0);

  const stopInlinePreview = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (synthNoteTimerRef.current) window.clearInterval(synthNoteTimerRef.current);
    timerRef.current = null;
    synthNoteTimerRef.current = null;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; audioRef.current = null; }
    if (synthCtxRef.current) { synthCtxRef.current.close().catch(() => {}); synthCtxRef.current = null; }
    setActivePostId(null);
    setElapsedSec(0);
  }, []);

  useEffect(() => () => stopInlinePreview(), [stopInlinePreview]);

  const toggleInlinePreview = useCallback(
    async (postId: string, source: InlinePreviewTrackSource, onFirstPlay?: () => void) => {
      if (activePostId === postId) {
        stopInlinePreview();
        return;
      }
      stopInlinePreview();
      onPauseMainPlayer();
      onFirstPlay?.();

      const clipLen = Math.min(30, Math.max(8, source.dropDuration || 30));
      const dStart = Math.max(0, source.dropStart || 0);
      dropStartRef.current = dStart;
      offsetSecRef.current = 0;
      startWallMsRef.current = performance.now();
      setMaxSec(clipLen);
      setElapsedSec(0);
      setActivePostId(postId);

      const resolvedUrl = source.audioUrl || (await getPersistentAudioBlobUrl(source.id).catch(() => null)) || '';
      if (resolvedUrl) {
        const audio = new Audio(resolvedUrl);
        audio.crossOrigin = 'anonymous';
        audio.currentTime = dStart;
        audioRef.current = audio;
        audio.play().catch(() => {});
        timerRef.current = window.setInterval(() => {
          const rel = Math.max(0, audio.currentTime - dStart);
          if (rel >= clipLen || audio.ended) stopInlinePreview();
          else setElapsedSec(rel);
        }, 80);
        return;
      }

      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) {
        const ctx = new Ctor();
        synthCtxRef.current = ctx;
        const notes = source.synthNotes?.length ? source.synthNotes : [110, 146.83, 164.81, 220];
        let step = 0;
        const beatMs = Math.round(60_000 / Math.max(75, Math.min(160, source.bpm || 108)));
        const pulse = () => {
          if (ctx.state === 'closed') return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = notes[step++ % notes.length] * 2;
          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
          osc.connect(gain).connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        };
        pulse();
        synthNoteTimerRef.current = window.setInterval(pulse, beatMs);
      }

      timerRef.current = window.setInterval(() => {
        const rel = offsetSecRef.current + (performance.now() - startWallMsRef.current) / 1000;
        if (rel >= clipLen) stopInlinePreview();
        else setElapsedSec(rel);
      }, 80);
    },
    [activePostId, onPauseMainPlayer, stopInlinePreview]
  );

  const seekInlinePreview = useCallback((postId: string, ratio01: number) => {
    if (activePostId !== postId) return;
    const targetRel = Math.max(0, Math.min(0.99, ratio01)) * maxSec;
    setElapsedSec(targetRel);
    if (audioRef.current) audioRef.current.currentTime = dropStartRef.current + targetRel;
    else { offsetSecRef.current = targetRel; startWallMsRef.current = performance.now(); }
  }, [activePostId, maxSec]);

  return { activePostId, elapsedSec, maxSec, toggleInlinePreview, seekInlinePreview, stopInlinePreview };
}
