import { useState, useCallback } from 'react';
import type { AdminSpaceId } from '../types/admin-spaces.types';

export type UserDrilldownTab =
  | 'SYNTHESE'
  | 'DEVICES'
  | 'DRM'
  | 'LEDGER'
  | 'TRACKS'
  | 'MISSIONS'
  | 'CONTESTATIONS'
  | 'ACTIONS';

export type AdminNavTarget =
  | {
      type: 'SPACE';
      spaceId: AdminSpaceId;
      subSection?: string;
      label?: string;
      subTab?: string;
      selectedEntityId?: string;
    }
  | {
      type: 'TRACK_DRILLDOWN';
      trackId: string;
      label?: string;
      originSpaceId?: AdminSpaceId;
      trackTab?: string;
    }
  | {
      type: 'ARTIST_DRILLDOWN';
      artistName: string;
      label?: string;
      originSpaceId?: AdminSpaceId;
      artistTab?: string;
    }
  | {
      type: 'USER_DRILLDOWN';
      userId: string;
      label?: string;
      originSpaceId?: AdminSpaceId;
      userTab?: UserDrilldownTab;
    };

function areTargetsEqual(a: AdminNavTarget, b: AdminNavTarget): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'SPACE' && b.type === 'SPACE') {
    return (
      a.spaceId === b.spaceId &&
      a.subTab === b.subTab &&
      a.selectedEntityId === b.selectedEntityId
    );
  }
  if (a.type === 'TRACK_DRILLDOWN' && b.type === 'TRACK_DRILLDOWN') {
    return a.trackId === b.trackId && a.trackTab === b.trackTab;
  }
  if (a.type === 'ARTIST_DRILLDOWN' && b.type === 'ARTIST_DRILLDOWN') {
    return a.artistName === b.artistName && a.artistTab === b.artistTab;
  }
  if (a.type === 'USER_DRILLDOWN' && b.type === 'USER_DRILLDOWN') {
    return a.userId === b.userId && a.userTab === b.userTab;
  }
  return false;
}

const SPACE_PRETTY_LABELS: Record<AdminSpaceId, string> = {
  '00_OVERVIEW': "Vue d'ensemble",
  '01_CATALOGUE': 'Catalogue musical',
  '02_STUDIO': 'Studio & Audio',
  '03_LISTENERS': 'Auditeurs',
  '04_PARTNERS': 'Labels & Partenaires',
  '05_FINANCE': 'Royalties & Finance',
  '06_ADS': 'Publicité',
  '07_INFRASTRUCTURE': 'Infrastructure',
  '08_SECURITY': 'Sécurité & DRM',
};

export interface UseAdminNavigationHistoryReturn {
  current: AdminNavTarget;
  historyStack: AdminNavTarget[];
  activeSpaceId: AdminSpaceId;
  canGoBack: boolean;
  previousLabel: string;
  navigate: (target: AdminNavTarget) => void;
  navigateToSpace: (spaceId: AdminSpaceId, label?: string, subTab?: string, selectedEntityId?: string) => void;
  navigateToUser: (userId: string, label?: string, originSpaceId?: AdminSpaceId, userTab?: UserDrilldownTab) => void;
  navigateToTrack: (trackId: string, label?: string, originSpaceId?: AdminSpaceId, trackTab?: string) => void;
  navigateToArtist: (artistName: string, label?: string, originSpaceId?: AdminSpaceId, artistTab?: string) => void;
  goBack: () => void;
  resetToSpace: (spaceId: AdminSpaceId) => void;
}

export function useAdminNavigationHistory(
  initialSpace: AdminSpaceId = '00_OVERVIEW'
): UseAdminNavigationHistoryReturn {
  const [current, setCurrent] = useState<AdminNavTarget>({
    type: 'SPACE',
    spaceId: initialSpace,
    label: SPACE_PRETTY_LABELS[initialSpace] || "Vue d'ensemble",
  });
  const [historyStack, setHistoryStack] = useState<AdminNavTarget[]>([]);

  const navigate = useCallback((target: AdminNavTarget) => {
    setCurrent((prev) => {
      if (areTargetsEqual(prev, target)) return prev;
      setHistoryStack((stack) => [...stack, prev]);
      return target;
    });
  }, []);

  const navigateToSpace = useCallback(
    (spaceId: AdminSpaceId, label?: string, subTab?: string, selectedEntityId?: string) => {
      navigate({
        type: 'SPACE',
        spaceId,
        label: label || SPACE_PRETTY_LABELS[spaceId] || spaceId,
        subTab,
        selectedEntityId,
      });
    },
    [navigate]
  );

  const navigateToUser = useCallback(
    (userId: string, label?: string, originSpaceId: AdminSpaceId = '03_LISTENERS', userTab?: UserDrilldownTab) => {
      navigate({
        type: 'USER_DRILLDOWN',
        userId,
        label: label || `Auditeur #${userId.slice(0, 6)}`,
        originSpaceId,
        userTab: userTab || 'SYNTHESE',
      });
    },
    [navigate]
  );

  const navigateToTrack = useCallback(
    (trackId: string, label?: string, originSpaceId: AdminSpaceId = '01_CATALOGUE', trackTab?: string) => {
      navigate({
        type: 'TRACK_DRILLDOWN',
        trackId,
        label: label || `Piste ${trackId}`,
        originSpaceId,
        trackTab,
      });
    },
    [navigate]
  );

  const navigateToArtist = useCallback(
    (artistName: string, label?: string, originSpaceId: AdminSpaceId = '01_CATALOGUE', artistTab?: string) => {
      navigate({
        type: 'ARTIST_DRILLDOWN',
        artistName,
        label: label || artistName,
        originSpaceId,
        artistTab,
      });
    },
    [navigate]
  );

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
    setCurrent({
      type: 'SPACE',
      spaceId,
      label: SPACE_PRETTY_LABELS[spaceId] || spaceId,
    });
  }, []);

  const canGoBack = historyStack.length > 0;
  const previous = canGoBack ? historyStack[historyStack.length - 1] : null;

  let previousLabel = 'Précédent';
  if (previous) {
    if (previous.type === 'SPACE') {
      previousLabel = SPACE_PRETTY_LABELS[previous.spaceId] || previous.label || previous.spaceId;
    } else if (previous.type === 'TRACK_DRILLDOWN') {
      previousLabel = previous.label ? `Piste: ${previous.label}` : 'Fiche Piste';
    } else if (previous.type === 'ARTIST_DRILLDOWN') {
      previousLabel = `Artiste: ${previous.artistName}`;
    } else if (previous.type === 'USER_DRILLDOWN') {
      previousLabel = previous.label ? `Auditeur: ${previous.label}` : 'Fiche Auditeur';
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
