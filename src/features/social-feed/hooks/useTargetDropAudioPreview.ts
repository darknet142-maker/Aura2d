import { useState, useRef, useCallback, useEffect } from 'react';
import { getPersistentAudioBlobUrl } from '../../../services/musicService';
import { globalAudioCoordinator } from '../../../services/globalAudioCoordinator';
import type { SocialTargetSubject } from '../types/social-feed.types';

export interface TargetAudioLookupItem {
  id: string;
  audioUrl?: string;
  dropStart?: number;
  dropDuration?: number;
  bpm?: number;
}

/**
 * Moteur intelligent de pré-écoute acoustique du Drop (30s max).
 * Lit STRICTEMENT le fichier audio réel du morceau sélectionné.
 * Zéro son synthétique, zéro bruit de fond par défaut : silence strict si aucun binaire n'est chargé.
 */
export function useTargetDropAudioPreview(onPauseMainPlayer?: () => void) {
  const [previewingKey, setPreviewingKey] = useState<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopPreview = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = '';
      audioElRef.current = null;
    }
    globalAudioCoordinator.release('DROPDOWN_DROP_PREVIEW');
    setPreviewingKey(null);
  }, []);

  useEffect(() => {
    const unreg = globalAudioCoordinator.register('DROPDOWN_DROP_PREVIEW', () => stopPreview());
    return () => {
      unreg();
      stopPreview();
    };
  }, [stopPreview]);

  const togglePreview = useCallback(
    async (target: SocialTargetSubject, catalogueLookup: TargetAudioLookupItem[] = []): Promise<boolean> => {
      const tid = target.trackId || (target.kind === 'TRACK' ? target.id : '') || '';
      const targetKey = `${target.kind}:${tid || target.entityName}:${target.title}`;

      if (previewingKey === targetKey) {
        stopPreview();
        return false;
      }

      stopPreview();
      globalAudioCoordinator.claim('DROPDOWN_DROP_PREVIEW');
      onPauseMainPlayer?.();

      const lookup = catalogueLookup.find((c) => c.id === tid);
      const dropStart = lookup?.dropStart ?? target.dropStart ?? 0;
      const dropDuration = Math.min(30, Math.max(5, lookup?.dropDuration ?? target.dropDuration ?? 30));

      let resolvedUrl = target.audioUrl || lookup?.audioUrl;
      if (!resolvedUrl && tid) {
        try {
          const persisted = await getPersistentAudioBlobUrl(tid);
          if (persisted) resolvedUrl = persisted;
        } catch {
          resolvedUrl = undefined;
        }
      }

      // Si aucun fichier audio réel n'est associé à cette piste, zéro bruit artificiel
      if (!resolvedUrl) {
        stopPreview();
        return false;
      }

      try {
        const audio = new Audio();
        if (/^https?:\/\//i.test(resolvedUrl)) {
          audio.crossOrigin = 'anonymous';
        }
        audio.preload = 'auto';
        audio.src = resolvedUrl;
        audioElRef.current = audio;
        setPreviewingKey(targetKey);

        const playAtStart = () => {
          try {
            audio.currentTime = dropStart;
          } catch {
            // Attente du buffering
          }
          audio.play().catch(() => {
            stopPreview();
          });
        };

        if (audio.readyState >= 1) {
          playAtStart();
        } else {
          audio.addEventListener('loadedmetadata', playAtStart, { once: true });
        }

        audio.addEventListener('error', () => stopPreview(), { once: true });
        timerRef.current = window.setTimeout(() => stopPreview(), dropDuration * 1000);
        return true;
      } catch {
        stopPreview();
        return false;
      }
    },
    [previewingKey, onPauseMainPlayer, stopPreview]
  );

  return { previewingKey, togglePreview, stopPreview };
}
