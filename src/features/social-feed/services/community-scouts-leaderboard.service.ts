import type { AnalyticsTrackItem, AnalyticsUserProfileItem } from '../../../components/ReusableAnalyticsSheets';
import type { SocialFeedPost, UserStatusStory } from '../types/social-feed.types';
import { toUserHandle } from './social-feed-seeds.service';
import { isStatusActive4h } from './status-video-storage.service';

export type ScoutLeaderboardDimension =
  | 'SCOUTS'
  | 'LIKES'
  | 'COMMENTS'
  | 'PLAYS'
  | 'LOOPS'
  | 'DISCOVERIES';

export interface CommunityMemberCompleteStats {
  userId: string;
  user: AnalyticsUserProfileItem;
  handle: string;
  scoutBadgeLabel: string;
  totalPlays: number;
  totalListenSeconds: number;
  totalLoops: number;
  totalLikesGiven: number;
  recommendationsCount: number;
  publishedPostsCount: number;
  reDropsCount: number;
  commentsCount: number;
  discoveriesGenerated: number;
  activeStatuses: UserStatusStory[];
  publishedPosts: SocialFeedPost[];
  activeItemsCount: number;
  ranks: Record<ScoutLeaderboardDimension, number>;
}

function hashSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return Math.abs(h);
}

function synthesizeUserFromSocial(
  userId: string, name: string, avatar: string, catalogueTracks: AnalyticsTrackItem[]
): AnalyticsUserProfileItem {
  const h = hashSeed(userId + name);
  const plays = 28 + (h % 95);
  const loops = 9 + (h % 38);
  const likes = 14 + (h % 44);
  const secs = plays * 195;
  const trackStats: NonNullable<AnalyticsUserProfileItem['trackStats']> = {};
  catalogueTracks.slice(0, 4).forEach((t, idx) => {
    const tp = Math.max(3, Math.round(plays / (idx + 2)));
    trackStats[t.id] = {
      trackId: t.id, listenSeconds: tp * 185, playsCount: tp,
      loopsCount: Math.max(1, Math.round(loops / (idx + 2))), maxConsecutiveLoops: Math.max(1, Math.round(loops / (idx + 2))),
      liked: idx < 2, pointsContributed: tp * 2, lastListenedAt: 'Récemment',
    };
  });
  return {
    id: userId, name, email: `${toUserHandle(name).slice(1)}@drop.ga`, role: 'USER',
    joinedAt: '2025', avatar: avatar || name.slice(0, 2).toUpperCase(),
    totalLikes: likes, totalListenSeconds: secs, totalValidatedPlays: plays, totalLoops: loops, trackStats,
  };
}

export function buildCommunityLeaderboardAndProfiles(params: {
  users: AnalyticsUserProfileItem[];
  currentUser?: AnalyticsUserProfileItem | null;
  posts: SocialFeedPost[];
  statuses: UserStatusStory[];
  likedTrackIds?: Record<string, boolean>;
  catalogueTracks: AnalyticsTrackItem[];
  nowMs?: number;
}): CommunityMemberCompleteStats[] {
  const { users, currentUser, posts, statuses, likedTrackIds = {}, catalogueTracks, nowMs = Date.now() } = params;
  const userMap = new Map<string, AnalyticsUserProfileItem>();
  for (const u of users) userMap.set(u.id, u);
  if (currentUser) userMap.set(currentUser.id, currentUser);

  for (const p of posts) {
    if (!userMap.has(p.authorId)) userMap.set(p.authorId, synthesizeUserFromSocial(p.authorId, p.authorName, p.authorAvatar, catalogueTracks));
    for (const c of p.comments) {
      if (!userMap.has(c.authorId)) userMap.set(c.authorId, synthesizeUserFromSocial(c.authorId, c.authorName, c.authorAvatar, catalogueTracks));
    }
    for (const r of p.reDropRelays) {
      if (!userMap.has(r.userId)) userMap.set(r.userId, synthesizeUserFromSocial(r.userId, r.userName, r.userAvatar, catalogueTracks));
    }
  }
  for (const st of statuses) {
    if (!userMap.has(st.userId)) userMap.set(st.userId, synthesizeUserFromSocial(st.userId, st.userName, st.userAvatar, catalogueTracks));
  }

  const activeStatusesAll = statuses.filter((s) => isStatusActive4h(s, nowMs));

  const entries: CommunityMemberCompleteStats[] = Array.from(userMap.values()).map((u) => {
    const publishedPosts = posts.filter((p) => p.authorId === u.id);
    const activeStatuses = activeStatusesAll.filter((s) => s.userId === u.id);
    const reDropsCount =
      posts.filter((p) => p.reDroppedByUserIds.includes(u.id)).length +
      activeStatusesAll.filter((s) => s.reDroppedByUserIds.includes(u.id)).length;
    const socialLikes =
      posts.filter((p) => p.likedByUserIds.includes(u.id)).length +
      activeStatusesAll.filter((s) => s.likedByUserIds.includes(u.id)).length;
    const commentsCount = posts.reduce((acc, p) => acc + p.comments.filter((c) => c.authorId === u.id).length, 0);
    const discoveriesGenerated = publishedPosts.reduce((acc, p) => acc + (p.discoveriesCount || 0), 0);
    const ownCatLikes = currentUser?.id === u.id ? Object.values(likedTrackIds).filter(Boolean).length : 0;
    const totalLikesGiven = Math.max(u.totalLikes || 0, ownCatLikes) + socialLikes;
    const recommendationsCount = publishedPosts.length + activeStatuses.length + reDropsCount;
    const scoutBadgeLabel =
      recommendationsCount >= 5 ? 'Grand Éclaireur' : recommendationsCount >= 2 ? 'Éclaireur Or' : recommendationsCount >= 1 ? 'Éclaireur Actif' : 'Mélomane';

    return {
      userId: u.id, user: u, handle: toUserHandle(u.name), scoutBadgeLabel,
      totalPlays: u.totalValidatedPlays || 0, totalListenSeconds: u.totalListenSeconds || 0,
      totalLoops: u.totalLoops || 0, totalLikesGiven, recommendationsCount,
      publishedPostsCount: publishedPosts.length, reDropsCount, commentsCount, discoveriesGenerated,
      activeStatuses, publishedPosts, activeItemsCount: publishedPosts.length + activeStatuses.length,
      ranks: { SCOUTS: 1, LIKES: 1, COMMENTS: 1, PLAYS: 1, LOOPS: 1, DISCOVERIES: 1 },
    };
  });

  const metricOf = (m: CommunityMemberCompleteStats, dim: ScoutLeaderboardDimension): number => {
    if (dim === 'SCOUTS') return m.recommendationsCount * 100 + m.discoveriesGenerated;
    if (dim === 'LIKES') return m.totalLikesGiven * 100 + m.totalPlays;
    if (dim === 'COMMENTS') return m.commentsCount * 100 + m.recommendationsCount;
    if (dim === 'PLAYS') return m.totalPlays * 100 + m.totalListenSeconds / 60;
    if (dim === 'LOOPS') return m.totalLoops * 100 + m.totalPlays;
    return m.discoveriesGenerated * 100 + m.recommendationsCount;
  };

  (['SCOUTS', 'LIKES', 'COMMENTS', 'PLAYS', 'LOOPS', 'DISCOVERIES'] as ScoutLeaderboardDimension[]).forEach((dim) => {
    [...entries]
      .sort((a, b) => metricOf(b, dim) - metricOf(a, dim))
      .forEach((entry, idx) => { entry.ranks[dim] = idx + 1; });
  });

  return entries.sort((a, b) => a.ranks.SCOUTS - b.ranks.SCOUTS);
}

