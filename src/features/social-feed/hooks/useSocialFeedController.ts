import { useState, useMemo, useCallback, useEffect } from 'react';
import type { CommunityRecommendationItem } from '../../../utils/rankingEngine';
import type { FeedLensId, PostArchetype, SocialFeedPost, SocialTargetSubject, StudioAudioCaptureMode } from '../types/social-feed.types';
import { resolveFlagshipTrackIdForTarget, type MinimalCatalogueTrackRef } from '../services/social-points-ledger.service';
import { rankSocialFeedPosts, type RankableTrackContext } from '../services/viral-feed-ranking.service';
import { countUserActiveProfileItems, deleteSocialVideoBlob, loadPersistedSocialPosts, MAX_ACTIVE_ITEMS_PER_PROFILE, savePersistedSocialPosts, saveSocialVideoBlob } from '../services/status-video-storage.service';
import { createManualFeedPost, createStudioVideoArtifacts, mutatePostAddComment, mutatePostToggleLike, mutatePostToggleReDrop, type ActingSocialUser } from '../services/social-feed-mutations.service';
import { useStatusStoriesState } from './useStatusStoriesState';

export interface UseSocialFeedControllerParams {
  actor: ActingSocialUser; legacyRecommendations: CommunityRecommendationItem[]; likedTrackIds: Record<string, boolean>;
  catalogueTracks: (MinimalCatalogueTrackRef & RankableTrackContext)[];
  onApplySocialPoints?: (trackId: string, pointsDelta: number, meta?: { recommendationsDelta?: number; entityKey?: string }) => void;
  onToast: (msg: string, dotColor?: string) => void;
}

export function useSocialFeedController({ actor, legacyRecommendations, likedTrackIds, catalogueTracks, onApplySocialPoints, onToast }: UseSocialFeedControllerParams) {
  const [posts, setPosts] = useState<SocialFeedPost[]>(() => loadPersistedSocialPosts(legacyRecommendations));
  const [activeLens, setActiveLens] = useState<FeedLensId>('FOR_YOU_VIRAL');
  const [randomSeed, setRandomSeed] = useState(1);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isQuotaCleanupOpen, setIsQuotaCleanupOpen] = useState(false);
  const [reportingPost, setReportingPost] = useState<SocialFeedPost | null>(null);
  const [reportedIds, setReportedIds] = useState<string[]>(() => {
    try { const s = window.localStorage.getItem('drop_reported_posts_v1'); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  useEffect(() => savePersistedSocialPosts(posts), [posts]);
  const tracksById = useMemo(() => new Map(catalogueTracks.map((t) => [t.id, t])), [catalogueTracks]);
  const creditPointsToTarget = useCallback((target: SocialTargetSubject, delta: number, recDelta = 0) => {
    if (delta === 0 && recDelta === 0) return;
    const trackId = resolveFlagshipTrackIdForTarget(target, catalogueTracks);
    if (trackId) onApplySocialPoints?.(trackId, delta, { recommendationsDelta: recDelta, entityKey: `${target.kind}:${target.entityName}` });
  }, [catalogueTracks, onApplySocialPoints]);

  const statusCtrl = useStatusStoriesState({ actorId: actor.id, creditPointsToTarget, onToast });
  const ownActiveItemsCount = useMemo(() => countUserActiveProfileItems(actor.id, posts, statusCtrl.activeStatuses), [actor.id, posts, statusCtrl.activeStatuses]);
  const visiblePosts = useMemo(() => posts.filter((p) => !reportedIds.includes(p.id)), [posts, reportedIds]);
  const rankedPosts = useMemo(() => {
    const raw = rankSocialFeedPosts(visiblePosts, { lens: activeLens, likedTrackIds, tracksById, randomSeed });
    const now = Date.now();
    const fresh = visiblePosts.filter((p) => {
      const match = p.authorId === actor.id || (now - Date.parse(p.createdAtIso)) < 24 * 3600_000;
      return activeLens === 'VIDEO_OPINIONS' ? match && p.archetype === 'VIDEO_OPINION' : match;
    }).sort((a, b) => Date.parse(b.createdAtIso) - Date.parse(a.createdAtIso));
    const freshIds = new Set(fresh.map((p) => p.id));
    return [...fresh, ...raw.filter((p) => !freshIds.has(p.id))];
  }, [visiblePosts, activeLens, likedTrackIds, tracksById, randomSeed, actor.id]);

  const handleTogglePostLike = useCallback((pId: string) => {
    setPosts((prev) => prev.map((p) => { if (p.id !== pId) return p; const r = mutatePostToggleLike(p, actor); creditPointsToTarget(p.target, r.pointsDelta); return r.updated; }));
  }, [actor, creditPointsToTarget]);

  const handleTogglePostReDrop = useCallback((pId: string, q?: string) => {
    setPosts((prev) => prev.map((p) => { if (p.id !== pId) return p; const r = mutatePostToggleReDrop(p, actor, q); creditPointsToTarget(p.target, r.pointsDelta, r.recommendationsDelta); if (r.nextReDropped) onToast('Recommandation republiée', 'bg-emerald-400'); return r.updated; }));
  }, [actor, creditPointsToTarget, onToast]);

  const handleAddComment = useCallback((pId: string, body: string) => {
    setPosts((prev) => prev.map((p) => { if (p.id !== pId) return p; const r = mutatePostAddComment(p, actor, body); if (!r) return p; creditPointsToTarget(p.target, r.pointsDelta); onToast('Commentaire publié', 'bg-amber-400'); return r.updated; }));
  }, [actor, creditPointsToTarget, onToast]);

  const handleRecordDiscovery = useCallback((pId: string) => {
    setPosts((prev) => prev.map((p) => (p.id !== pId || p.authorId === actor.id || p.discovererUserIds.includes(actor.id) ? p : { ...p, discoveriesCount: p.discoveriesCount + 1, discovererUserIds: [...p.discovererUserIds, actor.id], discovererInitials: [actor.avatar, ...p.discovererInitials.slice(0, 2)] })));
  }, [actor]);

  const handleDeletePost = useCallback((pId: string) => {
    setPosts((prev) => {
      const target = prev.find((p) => p.id === pId && p.authorId === actor.id);
      if (target?.videoIdbKey) void deleteSocialVideoBlob(target.videoIdbKey);
      return target ? prev.filter((p) => p.id !== pId) : prev;
    });
    onToast('Recommandation supprimée', 'bg-amber-400');
  }, [actor.id, onToast]);

  const handleConfirmReport = useCallback((pId: string) => {
    setReportedIds((prev) => { const n = [...prev, pId]; try { window.localStorage.setItem('drop_reported_posts_v1', JSON.stringify(n)); } catch {} return n; });
    setReportingPost(null);
    onToast('Publication signalée et masquée', 'bg-amber-400');
  }, [onToast]);

  const handleCreateFeedPost = useCallback((archetype: PostArchetype, target: SocialTargetSubject, caption: string): boolean => {
    if (countUserActiveProfileItems(actor.id, posts, statusCtrl.activeStatuses) >= MAX_ACTIVE_ITEMS_PER_PROFILE) {
      setIsQuotaCleanupOpen(true);
      onToast('Quota 10 items atteint : supprimez un statut pour faire de la place.', 'bg-rose-500');
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
      onToast('Quota 10 items atteint : supprimez un statut pour faire de la place.', 'bg-rose-500');
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

  return {
    posts, rankedPosts, activeLens, setActiveLens, ownActiveItemsCount, maxProfileItems: MAX_ACTIVE_ITEMS_PER_PROFILE,
    isQuotaCleanupOpen, setIsQuotaCleanupOpen, shuffleDiscoveryFeed: () => setRandomSeed((s) => s + 1),
    activeCommentsPostId, setActiveCommentsPostId, isComposerOpen, setIsComposerOpen, reportingPost, setReportingPost,
    handleConfirmReport, handleTogglePostLike, handleTogglePostReDrop, handleAddComment, handleRecordDiscovery,
    handleDeletePost, handleCreateFeedPost, handlePublishStudioVideo, ...statusCtrl,
  };
}
