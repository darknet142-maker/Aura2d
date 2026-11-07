import { useState, useMemo, useCallback, useEffect } from 'react';
import type { CommunityRecommendationItem } from '../../../utils/rankingEngine';
import type { FeedLensId, PostArchetype, SocialFeedPost, SocialTargetSubject, StudioAudioCaptureMode } from '../types/social-feed.types';
import { resolveFlagshipTrackIdForTarget, type MinimalCatalogueTrackRef } from '../services/social-points-ledger.service';
import { rankSocialFeedPosts, type RankableTrackContext } from '../services/viral-feed-ranking.service';
import {
  countUserActiveProfileItems, deleteSocialVideoBlob, loadPersistedSocialPosts,
  MAX_ACTIVE_ITEMS_PER_PROFILE, savePersistedSocialPosts, saveSocialVideoBlob,
} from '../services/status-video-storage.service';
import {
  createManualFeedPost, createStudioVideoArtifacts, mutatePostAddComment,
  mutatePostToggleLike, mutatePostToggleReDrop, type ActingSocialUser,
} from '../services/social-feed-mutations.service';
import { useStatusStoriesState } from './useStatusStoriesState';

export interface UseSocialFeedControllerParams {
  actor: ActingSocialUser; legacyRecommendations: CommunityRecommendationItem[]; likedTrackIds: Record<string, boolean>;
  catalogueTracks: (MinimalCatalogueTrackRef & RankableTrackContext)[];
  onApplySocialPoints?: (trackId: string, pointsDelta: number, meta?: { recommendationsDelta?: number; entityKey?: string }) => void;
  onToast: (msg: string, dotColor?: string) => void;
}

export function useSocialFeedController({
  actor, legacyRecommendations, likedTrackIds, catalogueTracks, onApplySocialPoints, onToast,
}: UseSocialFeedControllerParams) {
  const [posts, setPosts] = useState<SocialFeedPost[]>(() => loadPersistedSocialPosts(legacyRecommendations));
  const [activeLens, setActiveLens] = useState<FeedLensId>('FOR_YOU_VIRAL');
  const [randomSeed, setRandomSeed] = useState<number>(1);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);
  const [isQuotaCleanupOpen, setIsQuotaCleanupOpen] = useState<boolean>(false);

  useEffect(() => savePersistedSocialPosts(posts), [posts]);

  const tracksById = useMemo(() => new Map(catalogueTracks.map((t) => [t.id, t])), [catalogueTracks]);
  const creditPointsToTarget = useCallback((target: SocialTargetSubject, delta: number, recommendationsDelta = 0) => {
    if (delta === 0 && recommendationsDelta === 0) return;
    const trackId = resolveFlagshipTrackIdForTarget(target, catalogueTracks);
    if (trackId) onApplySocialPoints?.(trackId, delta, { recommendationsDelta, entityKey: `${target.kind}:${target.entityName}` });
  }, [catalogueTracks, onApplySocialPoints]);

  const statusCtrl = useStatusStoriesState({ actorId: actor.id, creditPointsToTarget, onToast });
  const ownActiveItemsCount = useMemo(() => countUserActiveProfileItems(actor.id, posts, statusCtrl.activeStatuses), [actor.id, posts, statusCtrl.activeStatuses]);
  const rankedPosts = useMemo(() => rankSocialFeedPosts(posts, { lens: activeLens, likedTrackIds, tracksById, randomSeed }), [posts, activeLens, likedTrackIds, tracksById, randomSeed]);

  const handleTogglePostLike = useCallback((postId: string) => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const res = mutatePostToggleLike(p, actor);
      creditPointsToTarget(p.target, res.pointsDelta);
      return res.updated;
    }));
  }, [actor, creditPointsToTarget]);

  const handleTogglePostReDrop = useCallback((postId: string, quote?: string) => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const res = mutatePostToggleReDrop(p, actor, quote);
      creditPointsToTarget(p.target, res.pointsDelta, res.recommendationsDelta);
      if (res.nextReDropped) onToast('Recommandation republiée', 'bg-emerald-400');
      return res.updated;
    }));
  }, [actor, creditPointsToTarget, onToast]);

  const handleAddComment = useCallback((postId: string, body: string) => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const res = mutatePostAddComment(p, actor, body);
      if (!res) return p;
      if (res.pointsDelta > 0) creditPointsToTarget(p.target, res.pointsDelta);
      onToast('Commentaire publié', 'bg-amber-400');
      return res.updated;
    }));
  }, [actor, creditPointsToTarget, onToast]);

  const handleRecordDiscovery = useCallback((postId: string) => {
    setPosts((prev) => prev.map((p) => (p.id !== postId || p.authorId === actor.id || p.discovererUserIds.includes(actor.id) ? p : { ...p, discoveriesCount: p.discoveriesCount + 1, discovererUserIds: [...p.discovererUserIds, actor.id], discovererInitials: [actor.avatar, ...p.discovererInitials.slice(0, 2)] })));
  }, [actor]);

  const handleDeletePost = useCallback((postId: string) => {
    setPosts((prev) => {
      const target = prev.find((p) => p.id === postId && p.authorId === actor.id);
      if (target?.videoIdbKey) void deleteSocialVideoBlob(target.videoIdbKey);
      return target ? prev.filter((p) => p.id !== postId) : prev;
    });
    onToast('Recommandation supprimée', 'bg-amber-400');
  }, [actor.id, onToast]);

  const handleCreateFeedPost = useCallback((archetype: PostArchetype, target: SocialTargetSubject, caption: string): boolean => {
    if (countUserActiveProfileItems(actor.id, posts, statusCtrl.activeStatuses) >= MAX_ACTIVE_ITEMS_PER_PROFILE) {
      setIsQuotaCleanupOpen(true);
      onToast('Maximum de 10 publications atteint : supprimez un statut pour faire de la place.', 'bg-rose-500');
      return false;
    }
    setPosts((prev) => [createManualFeedPost({ archetype, actor, caption, target, initialPoints: 0.35 }), ...prev]);
    creditPointsToTarget(target, 0.35, 1);
    onToast('Recommandation publiée', 'bg-amber-400');
    return true;
  }, [actor, posts, statusCtrl.activeStatuses, creditPointsToTarget, onToast]);

  const handlePublishStudioVideo = useCallback(async (payload: { blob: Blob; durationSec: number; captureMode: StudioAudioCaptureMode; target: SocialTargetSubject; caption: string; publishToStatus: boolean; publishToFeed: boolean }): Promise<boolean> => {
    const needed = (payload.publishToStatus ? 1 : 0) + (payload.publishToFeed ? 1 : 0);
    if (countUserActiveProfileItems(actor.id, posts, statusCtrl.activeStatuses) + needed > MAX_ACTIVE_ITEMS_PER_PROFILE) {
      setIsQuotaCleanupOpen(true);
      onToast('Maximum de 10 publications atteint : supprimez un statut pour faire de la place.', 'bg-rose-500');
      return false;
    }
    const videoIdbKey = `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await saveSocialVideoBlob(videoIdbKey, payload.blob);
    const { status, feedPost, pointsDelta } = createStudioVideoArtifacts({ actor, videoIdbKey, ...payload });
    if (status) statusCtrl.prependStatus(status);
    if (feedPost) setPosts((prev) => [feedPost, ...prev]);
    creditPointsToTarget(payload.target, pointsDelta, payload.publishToFeed ? 1 : 0);
    onToast('Vidéo publiée avec succès', 'bg-emerald-400');
    return true;
  }, [actor, posts, statusCtrl, creditPointsToTarget, onToast]);

  return { posts, rankedPosts, activeLens, setActiveLens, ownActiveItemsCount, maxProfileItems: MAX_ACTIVE_ITEMS_PER_PROFILE, isQuotaCleanupOpen, setIsQuotaCleanupOpen, shuffleDiscoveryFeed: () => setRandomSeed((s) => s + 1), activeCommentsPostId, setActiveCommentsPostId, isComposerOpen, setIsComposerOpen, handleTogglePostLike, handleTogglePostReDrop, handleAddComment, handleRecordDiscovery, handleDeletePost, handleCreateFeedPost, handlePublishStudioVideo, ...statusCtrl };
}
