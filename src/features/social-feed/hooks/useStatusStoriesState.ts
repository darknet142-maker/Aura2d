import { useState, useMemo, useCallback, useEffect } from 'react';
import type { SocialTargetSubject, UserStatusStory } from '../types/social-feed.types';
import { computePostLikePointDelta, computeReDropPointDelta } from '../services/social-points-ledger.service';
import {
  deleteSocialVideoBlob,
  loadPersistedUserStatuses,
  purgeExpiredStatusesIrreversibly,
  savePersistedUserStatuses,
} from '../services/status-video-storage.service';

export interface GroupedUserStatusRing {
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  statuses: UserStatusStory[];
  hasUnseen: boolean;
}

export function useStatusStoriesState(params: {
  actorId: string;
  creditPointsToTarget: (target: SocialTargetSubject, delta: number, recDelta?: number) => void;
  onToast: (msg: string, dotColor?: string) => void;
}) {
  const { actorId, creditPointsToTarget, onToast } = params;
  const [statuses, setStatuses] = useState<UserStatusStory[]>(() => loadPersistedUserStatuses());
  const [activeStatusUserId, setActiveStatusUserId] = useState<string | null>(null);

  useEffect(() => savePersistedUserStatuses(statuses), [statuses]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStatuses((prev) => {
        const { active, purgedIds } = purgeExpiredStatusesIrreversibly(prev);
        return purgedIds.length > 0 ? active : prev;
      });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeStatuses = useMemo(
    () => purgeExpiredStatusesIrreversibly(statuses).active,
    [statuses]
  );

  const groupedStatusRings = useMemo<GroupedUserStatusRing[]>(() => {
    const map = new Map<string, UserStatusStory[]>();
    for (const st of activeStatuses) {
      const list = map.get(st.userId) ?? [];
      list.push(st);
      map.set(st.userId, list);
    }
    return Array.from(map.entries()).map(([userId, userStatuses]) => {
      const ordered = [...userStatuses].sort((a, b) => Date.parse(a.createdAtIso) - Date.parse(b.createdAtIso));
      const latest = ordered[ordered.length - 1];
      return {
        userId,
        userName: latest.userName,
        userHandle: latest.userHandle,
        userAvatar: latest.userAvatar,
        statuses: ordered,
        hasUnseen: ordered.some((s) => !s.seenByUserIds.includes(actorId)),
      };
    });
  }, [activeStatuses, actorId]);

  const prependStatus = useCallback((story: UserStatusStory) => {
    setStatuses((prev) => [story, ...purgeExpiredStatusesIrreversibly(prev).active]);
  }, []);

  const handleDeleteStatus = useCallback((statusId: string) => {
    setStatuses((prev) => {
      const target = prev.find((st) => st.id === statusId && st.userId === actorId);
      if (!target) return prev;
      if (target.videoIdbKey) void deleteSocialVideoBlob(target.videoIdbKey);
      return prev.filter((st) => st.id !== statusId);
    });
    onToast('Statut supprimé pour libérer de la place', 'bg-amber-400');
  }, [actorId, onToast]);

  const handleMarkStatusSeen = useCallback((statusId: string) => {
    setStatuses((prev) => prev.map((st) => (
      st.id === statusId && !st.seenByUserIds.includes(actorId)
        ? { ...st, seenByUserIds: [...st.seenByUserIds, actorId] }
        : st
    )));
  }, [actorId]);

  const handleToggleStatusLike = useCallback((statusId: string) => {
    setStatuses((prev) => prev.map((st) => {
      if (st.id !== statusId) return st;
      const { nextLiked, pointsDelta } = computePostLikePointDelta(st, actorId);
      creditPointsToTarget(st.target, pointsDelta);
      return {
        ...st,
        likedByUserIds: nextLiked ? [...st.likedByUserIds, actorId] : st.likedByUserIds.filter((id) => id !== actorId),
      };
    }));
  }, [actorId, creditPointsToTarget]);

  const handleToggleStatusReDrop = useCallback((statusId: string) => {
    setStatuses((prev) => prev.map((st) => {
      if (st.id !== statusId) return st;
      const { nextReDropped, pointsDelta, recommendationsDelta } = computeReDropPointDelta(st, actorId);
      creditPointsToTarget(st.target, pointsDelta, recommendationsDelta);
      if (nextReDropped) onToast('Statut republié auprès de la communauté', 'bg-emerald-400');
      return {
        ...st,
        reDroppedByUserIds: nextReDropped ? [...st.reDroppedByUserIds, actorId] : st.reDroppedByUserIds.filter((id) => id !== actorId),
      };
    }));
  }, [actorId, creditPointsToTarget, onToast]);

  return {
    activeStatuses, groupedStatusRings, activeStatusUserId, setActiveStatusUserId,
    prependStatus, handleDeleteStatus, handleMarkStatusSeen, handleToggleStatusLike, handleToggleStatusReDrop,
  };
}
