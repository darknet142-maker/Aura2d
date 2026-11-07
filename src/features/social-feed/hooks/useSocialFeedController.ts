import { useState, useMemo, useCallback, useEffect } from 'react';
import type { CommunityRecommendationItem } from '../../../utils/rankingEngine';
import type {
  FeedLensId, PostArchetype, SocialFeedPost, SocialTargetSubject, StudioAudioCaptureMode,
} from '../types/social-feed.types';
import { resolveFlagshipTrackIdForTarget, type MinimalCatalogueTrackRef } from '../services/social-points-ledger.service';
import { rankSocialFeedPosts, type RankableTrackContext } from '../services/viral-feed-ranking.service';
import { loadPersistedSocialPosts, savePersistedSocialPosts, saveSocialVideoBlob } from '../services/status-video-storage.service';
import {
  createManualFeedPost, createStudioVideoArtifacts, mutatePostAddComment,
  mutatePostToggleLike, mutatePostToggleReDrop, type ActingSocialUser,
} from '../services/social-feed-mutations.service';
import { useStatusStoriesState } from './useStatusStoriesState';

export interface UseSocialFeedControllerParams {
  actor: ActingSocialUser;
  legacyRecommendations: CommunityRecommendationItem[];
  likedTrackIds: Record<string, boolean>;
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

  useEffect(() => savePersistedSocialPosts(posts), [posts]);

  const tracksById = useMemo(() => new Map(catalogueTracks.map((t) => [t.id, t])), [catalogueTracks]);

  const creditPointsToTarget = useCallback((target: SocialTargetSubject, delta: number, recommendationsDelta = 0) => {
    if (delta === 0 && recommendationsDelta === 0) return;
    const trackId = resolveFlagshipTrackIdForTarget(target, catalogueTracks);
    if (trackId) onApplySocialPoints?.(trackId, delta, { recommendationsDelta, entityKey: `${target.kind}:${target.entityName}` });
  }, [catalogueTracks, onApplySocialPoints]);

  const statusCtrl = useStatusStoriesState({ actorId: actor.id, creditPointsToTarget, onToast });

  const rankedPosts = useMemo(
    () => rankSocialFeedPosts(posts, { lens: activeLens, likedTrackIds, tracksById, randomSeed }),
    [posts, activeLens, likedTrackIds, tracksById, randomSeed]
  );

  const handleTogglePostLike = useCallback((postId: string) => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const res = mutatePostToggleLike(p, actor);
      creditPointsToTarget(p.target, res.pointsDelta);
      if (res.blockedSelfFarm && res.updated.likedByUserIds.includes(actor.id)) {
        onToast('Publication personnelle aimée (0 pt auto-attribution)', 'bg-slate-400');
      } else if (res.pointsDelta > 0) onToast(`+0,25 pt attribué à ${p.target.entityName} !`, 'bg-rose-500');
      return res.updated;
    }));
  }, [actor, creditPointsToTarget, onToast]);

  const handleTogglePostReDrop = useCallback((postId: string, quote?: string) => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const res = mutatePostToggleReDrop(p, actor, quote);
      creditPointsToTarget(p.target, res.pointsDelta, res.recommendationsDelta);
      if (res.nextReDropped) onToast(`Re-Drop actif : portée virale élargie (+${res.pointsDelta.toFixed(2)} pt)`, 'bg-emerald-400');
      return res.updated;
    }));
  }, [actor, creditPointsToTarget, onToast]);

  const handleAddComment = useCallback((postId: string, body: string) => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const res = mutatePostAddComment(p, actor, body);
      if (!res) return p;
      if (res.pointsDelta > 0) {
        creditPointsToTarget(p.target, res.pointsDelta);
        onToast(`Commentaire publié (+0,10 pt pour ${p.target.entityName})`, 'bg-amber-400');
      }
      return res.updated;
    }));
  }, [actor, creditPointsToTarget, onToast]);

  const handleRecordDiscovery = useCallback((postId: string) => {
    setPosts((prev) => prev.map((p) => (
      p.id !== postId || p.authorId === actor.id || p.discovererUserIds.includes(actor.id)
        ? p
        : { ...p, discoveriesCount: p.discoveriesCount + 1, discovererUserIds: [...p.discovererUserIds, actor.id], discovererInitials: [actor.avatar, ...p.discovererInitials.slice(0, 2)] }
    )));
  }, [actor]);

  const handleCreateFeedPost = useCallback((archetype: PostArchetype, target: SocialTargetSubject, caption: string) => {
    setPosts((prev) => [createManualFeedPost({ archetype, actor, caption, target, initialPoints: 0.35 }), ...prev]);
    creditPointsToTarget(target, 0.35, 1);
    onToast(`Recommandation publiée (+0,35 pt pour ${target.entityName})`, 'bg-amber-400');
  }, [actor, creditPointsToTarget, onToast]);

  const handlePublishStudioVideo = useCallback(async (payload: {
    blob: Blob; durationSec: number; captureMode: StudioAudioCaptureMode;
    target: SocialTargetSubject; caption: string; publishToStatus: boolean; publishToFeed: boolean;
  }) => {
    const videoIdbKey = `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await saveSocialVideoBlob(videoIdbKey, payload.blob);
    const { status, feedPost, pointsDelta } = createStudioVideoArtifacts({ actor, videoIdbKey, ...payload });
    if (status) statusCtrl.prependStatus(status);
    if (feedPost) setPosts((prev) => [feedPost, ...prev]);
    creditPointsToTarget(payload.target, pointsDelta, payload.publishToFeed ? 1 : 0);
    onToast(pointsDelta > 0 ? `Vidéo 1080×1920 publiée (+0,50 pt pour ${payload.target.entityName}) !` : 'Vidéo 1080×1920 publiée !', 'bg-emerald-400');
  }, [actor, creditPointsToTarget, onToast, statusCtrl]);

  return {
    posts, rankedPosts, activeLens, setActiveLens,
    shuffleDiscoveryFeed: () => setRandomSeed((s) => s + 1),
    activeCommentsPostId, setActiveCommentsPostId, isComposerOpen, setIsComposerOpen,
    handleTogglePostLike, handleTogglePostReDrop, handleAddComment,
    handleRecordDiscovery, handleCreateFeedPost, handlePublishStudioVideo,
    ...statusCtrl,
  };
}
