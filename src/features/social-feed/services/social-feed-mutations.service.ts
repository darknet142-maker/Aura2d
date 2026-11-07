import type { FeedCommentItem, PostArchetype, SocialFeedPost, SocialTargetSubject, StudioAudioCaptureMode, UserStatusStory } from '../types/social-feed.types';
import { computeCommentPointDelta, computePostLikePointDelta, computeReDropPointDelta, computeVideoPublishPointDelta, roundPoints2 } from './social-points-ledger.service';
import { toUserHandle } from './social-feed-seeds.service';

export interface ActingSocialUser { id: string; name: string; avatar: string; }

export function mutatePostToggleLike(
  post: SocialFeedPost,
  actor: ActingSocialUser
): { updated: SocialFeedPost; pointsDelta: number; blockedSelfFarm: boolean } {
  const { nextLiked, pointsDelta, blockedSelfFarm } = computePostLikePointDelta(post, actor.id);
  const likedByUserIds = nextLiked
    ? Array.from(new Set([...post.likedByUserIds, actor.id]))
    : post.likedByUserIds.filter((id) => id !== actor.id);
  return {
    updated: {
      ...post,
      likedByUserIds,
      totalPointsGenerated: Math.max(0, roundPoints2(post.totalPointsGenerated + pointsDelta)),
    },
    pointsDelta,
    blockedSelfFarm,
  };
}

export function mutatePostToggleReDrop(
  post: SocialFeedPost,
  actor: ActingSocialUser,
  quote?: string
): { updated: SocialFeedPost; pointsDelta: number; recommendationsDelta: number; nextReDropped: boolean } {
  const hasQuote = Boolean(quote && quote.trim().length > 0);
  const { nextReDropped, pointsDelta, recommendationsDelta } = computeReDropPointDelta(post, actor.id, hasQuote);
  const nowIso = new Date().toISOString();
  const reDroppedByUserIds = nextReDropped
    ? Array.from(new Set([...post.reDroppedByUserIds, actor.id]))
    : post.reDroppedByUserIds.filter((id) => id !== actor.id);
  const baseRelays = post.reDropRelays.filter((r) => r.userId !== actor.id);
  const reDropRelays = nextReDropped
    ? [{ userId: actor.id, userName: actor.name, userAvatar: actor.avatar, quote: quote?.trim() || undefined, relayedAtIso: nowIso }, ...baseRelays]
    : baseRelays;

  return {
    updated: {
      ...post,
      reDroppedByUserIds,
      reDropRelays,
      lastBoostedAtIso: nextReDropped ? nowIso : post.lastBoostedAtIso,
      totalPointsGenerated: Math.max(0, roundPoints2(post.totalPointsGenerated + pointsDelta)),
    },
    pointsDelta,
    recommendationsDelta,
    nextReDropped,
  };
}

export function mutatePostAddComment(
  post: SocialFeedPost,
  actor: ActingSocialUser,
  body: string
): { updated: SocialFeedPost; pointsDelta: number } | null {
  const clean = body.trim();
  if (!clean) return null;
  const pointsDelta = computeCommentPointDelta(post.authorId, post.comments, actor.id, clean);
  const nextComment: FeedCommentItem = {
    id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    authorId: actor.id,
    authorName: actor.name,
    authorHandle: toUserHandle(actor.name),
    authorAvatar: actor.avatar,
    body: clean,
    createdAtLabel: 'à l’instant',
    awardedPoint: pointsDelta > 0,
  };
  return {
    updated: {
      ...post,
      comments: [...post.comments, nextComment],
      totalPointsGenerated: roundPoints2(post.totalPointsGenerated + pointsDelta),
    },
    pointsDelta,
  };
}

export function createManualFeedPost(params: {
  archetype: PostArchetype;
  actor: ActingSocialUser;
  caption: string;
  target: SocialTargetSubject;
  initialPoints: number;
}): SocialFeedPost {
  const nowIso = new Date().toISOString();
  return {
    id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    archetype: params.archetype,
    authorId: params.actor.id,
    authorName: params.actor.name,
    authorHandle: toUserHandle(params.actor.name),
    authorAvatar: params.actor.avatar,
    caption: params.caption.trim() || `Découvrez « ${params.target.title} » sur DROP (+241) !`,
    createdAtIso: nowIso,
    createdAtLabel: 'à l’instant',
    lastBoostedAtIso: nowIso,
    target: params.target,
    likedByUserIds: [],
    reDroppedByUserIds: [],
    reDropRelays: [],
    comments: [],
    discoveriesCount: 0,
    discovererUserIds: [],
    discovererInitials: [],
    totalPointsGenerated: params.initialPoints,
  };
}

export function createStudioVideoArtifacts(params: {
  actor: ActingSocialUser; videoIdbKey: string; durationSec: number; captureMode: StudioAudioCaptureMode;
  target: SocialTargetSubject; caption: string; publishToStatus: boolean; publishToFeed: boolean;
}): { status?: UserStatusStory; feedPost?: SocialFeedPost; pointsDelta: number } {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const pointsDelta = computeVideoPublishPointDelta(params.durationSec);
  const dur = Math.min(30, Math.max(1, Math.round(params.durationSec)));
  const cleanCaption = params.caption.trim() || (params.captureMode === 'VOICE_OPINION_NO_MUSIC'
    ? `Mon avis vocal 30s sur ${params.target.title}` : `Statut Drop 30s sur « ${params.target.title} »`);
  const status: UserStatusStory | undefined = params.publishToStatus ? {
    id: `st-${now}`, userId: params.actor.id, userName: params.actor.name, userHandle: toUserHandle(params.actor.name),
    userAvatar: params.actor.avatar, captureMode: params.captureMode, videoIdbKey: params.videoIdbKey,
    caption: cleanCaption, durationSec: dur, target: params.target, createdAtIso: nowIso,
    expiresAtIso: new Date(now + 24 * 3_600_000).toISOString(), seenByUserIds: [params.actor.id], likedByUserIds: [], reDroppedByUserIds: [],
  } : undefined;
  const feedPost: SocialFeedPost | undefined = params.publishToFeed ? {
    ...createManualFeedPost({ archetype: 'VIDEO_OPINION', actor: params.actor, caption: cleanCaption, target: params.target, initialPoints: pointsDelta }),
    captureMode: params.captureMode, videoIdbKey: params.videoIdbKey, videoDurationSec: dur,
  } : undefined;
  return { status, feedPost, pointsDelta };
}
