import { useState, useCallback } from 'react';
import type { AdminSpaceId } from '../types/admin-spaces.types';

export type AdminNavTarget =
  | { type: 'SPACE'; spaceId: AdminSpaceId; subSection?: string; label?: string }
  | { type: 'TRACK_DRILLDOWN'; trackId: string; label?: string; originSpaceId?: AdminSpaceId }
  | { type: 'ARTIST_DRILLDOWN'; artistName: string; label?: string; originSpaceId?: AdminSpaceId }
  | { type: 'USER_DRILLDOWN'; userId: string; label?: string; originSpaceId?: AdminSpaceId };

export interface UseAdminNavigationHistoryReturn {
  current: AdminNavTarget;
  historyStack: AdminNavTarget[];
  activeSpaceId: AdminSpaceId;
  canGoBack: boolean;
  previousLabel: string;
  navigate: (target: AdminNavTarget) => void;
  navigateToSpace: (spaceId: AdminSpaceId, label?: string) => void;
  navigateToUser: (userId: string, label?: string, originSpaceId?: AdminSpaceId) => void;
  navigateToTrack: (trackId: string, label?: string, originSpaceId?: AdminSpaceId) => void;
  navigateToArtist: (artistName: string, label?: string, originSpaceId?: AdminSpaceId) => void;
  goBack: () => void;
  resetToSpace: (spaceId: AdminSpaceId) => void;
}

export function useAdminNavigationHistory(
  initialSpace: AdminSpaceId = '00_OVERVIEW'
): UseAdminNavigationHistoryReturn {
  const [current, setCurrent] = useState<AdminNavTarget>({
    type: 'SPACE',
    spaceId: initialSpace,
    label: "Vue d'ensemble",
  });
  const [historyStack, setHistoryStack] = useState<AdminNavTarget[]>([]);

  const navigate = useCallback((target: AdminNavTarget) => {
    setCurrent((prev) => {
      const isSame =
        prev.type === target.type &&
        (prev.type === 'SPACE'
          ? (prev as any).spaceId === (target as any).spaceId
          : (prev as any)[Object.keys(prev)[1]] === (target as any)[Object.keys(target)[1]]);
      if (isSame) return prev;
      setHistoryStack((stack) => [...stack, prev]);
      return target;
    });
  }, []);

  const navigateToSpace = useCallback((spaceId: AdminSpaceId, label?: string) => {
    navigate({ type: 'SPACE', spaceId, label });
  }, [navigate]);

  const navigateToUser = useCallback((userId: string, label?: string, originSpaceId: AdminSpaceId = '03_LISTENERS') => {
    navigate({ type: 'USER_DRILLDOWN', userId, label, originSpaceId });
  }, [navigate]);

  const navigateToTrack = useCallback((trackId: string, label?: string, originSpaceId: AdminSpaceId = '01_CATALOGUE') => {
    navigate({ type: 'TRACK_DRILLDOWN', trackId, label, originSpaceId });
  }, [navigate]);

  const navigateToArtist = useCallback((artistName: string, label?: string, originSpaceId: AdminSpaceId = '01_CATALOGUE') => {
    navigate({ type: 'ARTIST_DRILLDOWN', artistName, label, originSpaceId });
  }, [navigate]);

  const goBack = useCallback(() => {
    setHistoryStack((stack) => {
      if (stack.length === 0) return stack;
      const nextStack = [...stack];
      const previous = nextStack.pop()!;
      setCurrent(previous);
      return nextStack;
    });
  }, []);

  const resetToSpace = useCallback((spaceId: AdminSpaceId) => {
    setHistoryStack([]);
    setCurrent({ type: 'SPACE', spaceId, label: spaceId });
  }, []);

  const canGoBack = historyStack.length > 0;
  const previous = canGoBack ? historyStack[historyStack.length - 1] : null;

  let previousLabel = 'Précédent';
  if (previous) {
    if (previous.type === 'SPACE') {
      previousLabel = previous.label || previous.spaceId.replace(/^[0-9]+_/, '');
    } else if (previous.type === 'TRACK_DRILLDOWN') {
      previousLabel = previous.label ? `Piste: ${previous.label}` : 'Piste';
    } else if (previous.type === 'ARTIST_DRILLDOWN') {
      previousLabel = `Artiste: ${previous.artistName}`;
    } else if (previous.type === 'USER_DRILLDOWN') {
      previousLabel = previous.label ? `Auditeur: ${previous.label}` : 'Auditeur';
    }
  }

  const activeSpaceId: AdminSpaceId =
    current.type === 'SPACE'
      ? current.spaceId
      : current.originSpaceId || (current.type === 'USER_DRILLDOWN' ? '03_LISTENERS' : '01_CATALOGUE');

  return {
    current,
    historyStack,
    activeSpaceId,
    canGoBack,
    previousLabel,
    navigate,
    navigateToSpace,
    navigateToUser,
    navigateToTrack,
    navigateToArtist,
    goBack,
    resetToSpace,
  };
}
