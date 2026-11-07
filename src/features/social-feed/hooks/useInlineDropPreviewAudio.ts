import { useState, useRef, useCallback, useEffect } from 'react';
import { getPersistentAudioBlobUrl } from '../../../services/musicService';
import { globalAudioCoordinator } from '../../../services/globalAudioCoordinator';

export interface InlinePreviewTrackSource {
  id: string;
  audioUrl?: string;
  dropStart: number;
  dropDuration: number;
  bpm?: number;
}

export function useInlineDropPreviewAudio(onPauseMainPlayer: () => void) {
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [maxSec, setMaxSec] = useState<number>(30);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const dropStartRef = useRef<number>(0);
  const startWallMsRef = useRef<number>(0);
  const offsetSecRef = useRef<number>(0);

  const stopInlinePreview = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    globalAudioCoordinator.release('SOCIAL_INLINE_PREVIEW');
    setActivePostId(null);
    setElapsedSec(0);
  }, []);

  useEffect(() => {
    const unreg = globalAudioCoordinator.register('SOCIAL_INLINE_PREVIEW', () => stopInlinePreview());
    return () => { unreg(); stopInlinePreview(); };
  }, [stopInlinePreview]);

  const toggleInlinePreview = useCallback(
    async (postId: string, source: InlinePreviewTrackSource, onFirstPlay?: () => void) => {
      if (activePostId === postId) {
        stopInlinePreview();
        return;
      }
      stopInlinePreview();
      globalAudioCoordinator.claim('SOCIAL_INLINE_PREVIEW');
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

      let resolvedUrl: string = '';
      if (source.id) {
        resolvedUrl = (await getPersistentAudioBlobUrl(source.id).catch(() => null)) || '';
      }
      if (!resolvedUrl) resolvedUrl = source.audioUrl || '';
      if (resolvedUrl) {
        const audio = new Audio(resolvedUrl);
        audio.preload = 'auto';
        const seekAndPlay = () => {
          try { audio.currentTime = dStart; } catch { /* wait metadata */ }
          audio.play().catch(() => {});
        };
        if (audio.readyState >= 1) seekAndPlay();
        else audio.addEventListener('loadedmetadata', seekAndPlay, { once: true });
        audioRef.current = audio;
        timerRef.current = window.setInterval(() => {
          const rel = Math.max(0, audio.currentTime - dStart);
          if (rel >= clipLen || audio.ended) stopInlinePreview();
          else setElapsedSec(rel);
        }, 80);
        return;
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
