import type {
  FeedCommentItem,
  SocialFeedPost,
  SocialTargetSubject,
  UserStatusStory,
  ViralCohortTier,
} from '../types/social-feed.types';

export const LIKE_RECO_QUARTER_POINT = 0.25;
export const REDROP_VIRAL_POINT = 0.30;
export const VIDEO_STATUS_OPINION_POINT = 0.50;
export const COMMENT_CONSTRUCTIVE_POINT = 0.10;
export const MIN_VIDEO_SECONDS_FOR_POINTS = 4;
export const MIN_COMMENT_CHARS_FOR_POINTS = 6;

export interface MinimalCatalogueTrackRef {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumId?: string;
  realPlays: number;
  featuringArtists?: string[];
  beatmakerName?: string;
  soundEngineerName?: string;
  lyricistName?: string;
}

export function roundPoints2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computePostLikePointDelta(
  item: Pick<SocialFeedPost, 'authorId' | 'likedByUserIds'> | Pick<UserStatusStory, 'userId' | 'likedByUserIds'>,
  actingUserId: string
): { nextLiked: boolean; pointsDelta: number; blockedSelfFarm: boolean } {
  const ownerId = 'authorId' in item ? item.authorId : item.userId;
  const alreadyLiked = item.likedByUserIds.includes(actingUserId);
  const nextLiked = !alreadyLiked;
  if (ownerId === actingUserId) {
    return { nextLiked, pointsDelta: 0, blockedSelfFarm: true };
  }
  return {
    nextLiked,
    pointsDelta: nextLiked ? LIKE_RECO_QUARTER_POINT : -LIKE_RECO_QUARTER_POINT,
    blockedSelfFarm: false,
  };
}

export function computeReDropPointDelta(
  item: Pick<SocialFeedPost, 'authorId' | 'reDroppedByUserIds'> | Pick<UserStatusStory, 'userId' | 'reDroppedByUserIds'>,
  actingUserId: string,
  forceKeepReDrop = false
): { nextReDropped: boolean; pointsDelta: number; recommendationsDelta: number } {
  const ownerId = 'authorId' in item ? item.authorId : item.userId;
  const alreadyReDropped = item.reDroppedByUserIds.includes(actingUserId);
  if (alreadyReDropped && forceKeepReDrop) {
    return { nextReDropped: true, pointsDelta: 0, recommendationsDelta: 0 };
  }
  const nextReDropped = !alreadyReDropped;
  if (ownerId === actingUserId) {
    return { nextReDropped, pointsDelta: 0, recommendationsDelta: 0 };
  }
  return {
    nextReDropped,
    pointsDelta: nextReDropped ? REDROP_VIRAL_POINT : -REDROP_VIRAL_POINT,
    recommendationsDelta: nextReDropped ? 1 : -1,
  };
}

export function computeVideoPublishPointDelta(durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec < MIN_VIDEO_SECONDS_FOR_POINTS) {
    return 0;
  }
  return VIDEO_STATUS_OPINION_POINT;
}

export function computeCommentPointDelta(
  postAuthorId: string,
  existingComments: FeedCommentItem[],
  actingUserId: string,
  bodyText: string
): number {
  const trimmed = bodyText.trim();
  if (trimmed.length < MIN_COMMENT_CHARS_FOR_POINTS) return 0;
  if (postAuthorId === actingUserId) return 0;
  const alreadyAwarded = existingComments.some(
    (c) => c.authorId === actingUserId && c.awardedPoint
  );
  return alreadyAwarded ? 0 : COMMENT_CONSTRUCTIVE_POINT;
}

export function computeCohortTierFromEngagement(
  reDropsCount: number,
  isVideoOpinion: boolean
): { tier: ViralCohortTier; reachMultiplier: number; label: string } {
  const effectiveScore = reDropsCount + (isVideoOpinion ? 2 : 0);
  if (effectiveScore >= 5) {
    return { tier: 3, reachMultiplier: 3.2, label: 'Onde Virale +241' };
  }
  if (effectiveScore >= 1) {
    return { tier: 2, reachMultiplier: 1.8, label: 'Relais Communautaire' };
  }
  return { tier: 1, reachMultiplier: 1.0, label: 'Cercle Initial' };
}

export function resolveFlagshipTrackIdForTarget(
  target: SocialTargetSubject,
  tracks: MinimalCatalogueTrackRef[]
): string | null {
  if (tracks.length === 0) return null;
  if (target.trackId) {
    const exact = tracks.find((t) => t.id === target.trackId);
    if (exact) return exact.id;
  }
  const needle = target.entityName.trim().toLowerCase();
  const titleNeedle = target.title.trim().toLowerCase();
  const candidates = tracks.filter((t) => {
    if (target.kind === 'ALBUM') {
      return (
        t.albumId === target.albumId ||
        t.album.trim().toLowerCase() === titleNeedle
      );
    }
    return (
      t.artist.toLowerCase().includes(needle) ||
      (t.featuringArtists?.some((f) => f.toLowerCase().includes(needle)) ?? false) ||
      t.beatmakerName?.toLowerCase() === needle ||
      t.soundEngineerName?.toLowerCase() === needle ||
      t.lyricistName?.toLowerCase() === needle
    );
  });
  if (candidates.length === 0) return tracks[0].id;
  return [...candidates].sort((a, b) => b.realPlays - a.realPlays)[0].id;
}

