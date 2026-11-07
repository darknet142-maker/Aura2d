import { useState, useRef, useCallback, useEffect } from 'react';
import { getPersistentAudioBlobUrl } from '../../../services/musicService';
import { globalAudioCoordinator } from '../../../services/globalAudioCoordinator';
import type { SocialTargetSubject } from '../types/social-feed.types';

export interface TargetAudioLookupItem {
  id: string;
  audioUrl?: string;
  dropStart?: number;
  dropDuration?: number;
  notes?: number[];
  bpm?: number;
  baseFreq?: number;
}

export function useTargetDropAudioPreview(onPauseMainPlayer?: () => void) {
  const [previewingKey, setPreviewingKey] = useState<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const synthIntervalRef = useRef<number | null>(null);

  const stopPreview = useCallback(() => {
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    if (synthIntervalRef.current) { window.clearInterval(synthIntervalRef.current); synthIntervalRef.current = null; }
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.src = ''; audioElRef.current = null; }
    if (audioCtxRef.current) { try { void audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    globalAudioCoordinator.release('DROPDOWN_DROP_PREVIEW');
    setPreviewingKey(null);
  }, []);

  useEffect(() => {
    const unreg = globalAudioCoordinator.register('DROPDOWN_DROP_PREVIEW', () => stopPreview());
    return () => { unreg(); stopPreview(); };
  }, [stopPreview]);

  const togglePreview = useCallback(async (
    target: SocialTargetSubject,
    catalogueLookup: TargetAudioLookupItem[] = []
  ) => {
    const tid = target.trackId || (target.kind === 'TRACK' ? target.id : '') || '';
    const targetKey = `${target.kind}:${tid || target.entityName}:${target.title}`;

    if (previewingKey === targetKey) {
      stopPreview();
      return;
    }

    stopPreview();
    globalAudioCoordinator.claim('DROPDOWN_DROP_PREVIEW');
    onPauseMainPlayer?.();

    const lookup = catalogueLookup.find((c) => c.id === tid);
    const dropStart = lookup?.dropStart ?? 0;
    const dropDuration = Math.min(30, Math.max(8, lookup?.dropDuration ?? 30));

    let resolvedUrl = lookup?.audioUrl || target.audioUrl;
    if (!resolvedUrl && tid) {
      try {
        const persisted = await getPersistentAudioBlobUrl(tid);
        if (persisted) resolvedUrl = persisted;
      } catch {}
    }

    const startMelodicDrop = () => {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        if (ctx.state === 'suspended') void ctx.resume();
        setPreviewingKey(targetKey);

        const bpm = lookup?.bpm || target.bpm || 116;
        const notes = lookup?.notes || [220, 261.63, 329.63, 392.0];
        const baseFreq = lookup?.baseFreq || 110;
        const stepMs = Math.max(180, Math.min(450, Math.round((60 / Math.max(70, bpm)) * 500)));
        let step = 0;

        const playHarmonicStep = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const targetF = notes[step % notes.length] || baseFreq;
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(Math.max(90, Math.min(580, targetF)), now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.035);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (stepMs / 1000) * 0.92);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + (stepMs / 1000));
          step++;
        };

        playHarmonicStep();
        synthIntervalRef.current = window.setInterval(playHarmonicStep, stepMs);
        timerRef.current = window.setTimeout(() => stopPreview(), dropDuration * 1000);
      } catch {
        stopPreview();
      }
    };

    if (resolvedUrl) {
      try {
        const audio = new Audio();
        if (/^https?:\/\//i.test(resolvedUrl)) audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        audio.src = resolvedUrl;
        audioElRef.current = audio;
        setPreviewingKey(targetKey);

        const playAtStart = () => {
          try { audio.currentTime = dropStart; } catch {}
          audio.play().catch(() => startMelodicDrop());
        };

        if (audio.readyState >= 1) playAtStart();
        else audio.addEventListener('loadedmetadata', playAtStart, { once: true });
        audio.addEventListener('error', () => startMelodicDrop(), { once: true });
        timerRef.current = window.setTimeout(() => stopPreview(), dropDuration * 1000);
      } catch {
        startMelodicDrop();
      }
    } else {
      startMelodicDrop();
    }
  }, [previewingKey, onPauseMainPlayer, stopPreview]);

  return { previewingKey, togglePreview, stopPreview };
}

