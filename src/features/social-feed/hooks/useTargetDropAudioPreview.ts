import { useState, useRef, useCallback, useEffect } from 'react';
import { getPersistentAudioBlobUrl } from '../../../services/musicService';
import { globalAudioCoordinator } from '../../../services/globalAudioCoordinator';
import type { SocialTargetSubject } from '../types/social-feed.types';

export interface TargetAudioLookupItem {
  id: string; audioUrl?: string; dropStart?: number; dropDuration?: number; bpm?: number;
  notes?: number[]; baseFreq?: number; title?: string; artist?: string;
}

export function getSocialTargetUniqueKey(t: SocialTargetSubject): string {
  return `${t.kind}:${t.trackId || t.albumId || t.id || t.entityName}:${t.title}`;
}

export function useTargetDropAudioPreview(onPauseMainPlayer?: () => void) {
  const [previewingKey, setPreviewingKey] = useState<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopPreview = useCallback(() => {
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.removeAttribute('src');
      audioElRef.current.load();
      audioElRef.current = null;
    }
    globalAudioCoordinator.release('DROPDOWN_DROP_PREVIEW');
    setPreviewingKey(null);
  }, []);

  useEffect(() => {
    const unreg = globalAudioCoordinator.register('DROPDOWN_DROP_PREVIEW', () => stopPreview());
    return () => { unreg(); stopPreview(); };
  }, [stopPreview]);

  const togglePreview = useCallback(async (target: SocialTargetSubject, catalogueLookup: TargetAudioLookupItem[] = []): Promise<boolean> => {
    const targetKey = getSocialTargetUniqueKey(target);
    if (previewingKey === targetKey) { stopPreview(); return false; }
    stopPreview();
    globalAudioCoordinator.claim('DROPDOWN_DROP_PREVIEW');
    onPauseMainPlayer?.();

    const tid = target.trackId || (target.kind === 'TRACK' ? target.id : '') || '';
    const cleanTitle = (target.title || '').trim().toLowerCase();
    const cleanArtist = (target.entityName || target.subtitle || '').trim().toLowerCase();
    const lookup = catalogueLookup.find((c) =>
      (tid && c.id === tid) ||
      (cleanTitle && c.title && c.title.trim().toLowerCase() === cleanTitle) ||
      (cleanArtist && c.artist && c.artist.trim().toLowerCase() === cleanArtist && target.kind === 'ARTIST')
    );
    const dropStart = lookup?.dropStart ?? target.dropStart ?? 0;
    const dropDuration = Math.min(30, Math.max(5, lookup?.dropDuration ?? target.dropDuration ?? 30));
    const searchId = tid || lookup?.id;

    // Résolution prioritaire du binaire audio réel (IndexedDB Blob frais > audioUrl)
    let resolvedUrl: string | null = null;
    if (searchId) {
      try { resolvedUrl = await getPersistentAudioBlobUrl(searchId); } catch {}
    }
    if (!resolvedUrl) {
      const candidate = target.audioUrl || lookup?.audioUrl;
      if (candidate && (!candidate.startsWith('blob:') || !searchId)) resolvedUrl = candidate;
    }
    if (!resolvedUrl && searchId) {
      try { resolvedUrl = await getPersistentAudioBlobUrl(searchId); } catch {}
    }

    if (!resolvedUrl) {
      stopPreview();
      return false;
    }

    setPreviewingKey(targetKey);
    try {
      const audio = new Audio();
      if (/^https?:\/\//i.test(resolvedUrl)) audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.src = resolvedUrl;
      audioElRef.current = audio;

      let started = false;
      const onReady = () => {
        if (started || audioElRef.current !== audio) return;
        started = true;
        try {
          if (dropStart > 0 && Number.isFinite(dropStart) && (!audio.duration || audio.duration > dropStart)) {
            audio.currentTime = dropStart;
          }
        } catch {}
        audio.play().catch(() => {
          try {
            audio.currentTime = 0;
            audio.play().catch(() => stopPreview());
          } catch {
            stopPreview();
          }
        });
      };

      if (audio.readyState >= 1) {
        onReady();
      } else {
        audio.addEventListener('loadedmetadata', onReady, { once: true });
        audio.addEventListener('canplay', onReady, { once: true });
        setTimeout(() => { if (!started && audioElRef.current === audio) onReady(); }, 2500);
      }

      audio.addEventListener('error', async () => {
        if (searchId) {
          try {
            const fresh = await getPersistentAudioBlobUrl(searchId);
            if (fresh && audioElRef.current === audio) {
              audio.src = fresh;
              void audio.play().catch(() => stopPreview());
              return;
            }
          } catch {}
        }
        stopPreview();
      }, { once: true });

      timerRef.current = window.setTimeout(() => stopPreview(), dropDuration * 1000);
      return true;
    } catch {
      stopPreview();
      return false;
    }
  }, [previewingKey, onPauseMainPlayer, stopPreview]);

  return { previewingKey, togglePreview, stopPreview };
}
