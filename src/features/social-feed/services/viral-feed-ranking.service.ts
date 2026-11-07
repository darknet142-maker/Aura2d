import type { FeedLensId, SocialFeedPost } from '../types/social-feed.types';

export interface RankableTrackContext {
  id: string;
  category: string;
  bpm?: number;
  realPlays: number;
  camelotKey?: string;
}

export interface UserTasteProfileContext {
  selectedStyles?: string[];
  acousticEnergy?: 'CALM' | 'BALANCED' | 'EXPLOSIVE';
  blindDiscoveryBoost?: boolean;
}

export interface RankFeedOptions {
  lens: FeedLensId;
  likedTrackIds: Record<string, boolean>;
  tracksById: Map<string, RankableTrackContext>;
  randomSeed: number;
  nowMs?: number;
  tasteProfile?: UserTasteProfileContext;
}

function deterministicUnitHash(input: string, seed: number): number {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

function computeDspAffinity(
  post: SocialFeedPost,
  likedTrackIds: Record<string, boolean>,
  tracksById: Map<string, RankableTrackContext>,
  taste?: UserTasteProfileContext
): number {
  const targetTrack = post.target.trackId ? tracksById.get(post.target.trackId) : undefined;
  const postGenre = (targetTrack?.category || post.target.genre || '').toLowerCase();
  const postBpm = targetTrack?.bpm ?? post.target.bpm ?? 0;

  let tasteBonus = 0;
  if (taste?.selectedStyles?.length) {
    if (taste.selectedStyles.some((st) => postGenre.includes(st.toLowerCase().slice(0, 4)))) tasteBonus += 0.25;
  }
  if (taste?.acousticEnergy === 'CALM' && postBpm > 0 && postBpm <= 100) tasteBonus += 0.14;
  if (taste?.acousticEnergy === 'EXPLOSIVE' && postBpm >= 118) tasteBonus += 0.16;
  if (taste?.blindDiscoveryBoost && (targetTrack?.realPlays ?? 20_000) < 50_000) tasteBonus += 0.20;

  const likedEntries = Object.keys(likedTrackIds)
    .filter((id) => likedTrackIds[id])
    .map((id) => tracksById.get(id))
    .filter((t): t is RankableTrackContext => Boolean(t));

  if (likedEntries.length === 0) return Math.min(1.45, 1.0 + tasteBonus);
  let bestScore = 0.88 + tasteBonus;
  for (const liked of likedEntries) {
    let affinity = 0.92 + tasteBonus;
    if (postGenre && postGenre.includes(liked.category.toLowerCase().split('/')[0].trim())) affinity += 0.22;
    if (postBpm > 0 && liked.bpm && Math.abs(postBpm - liked.bpm) <= 12) affinity += 0.14;
    if (affinity > bestScore) bestScore = affinity;
  }
  return Math.min(1.5, bestScore);
}

export function computeSinglePostViralScore(post: SocialFeedPost, options: RankFeedOptions): number {
  const now = options.nowMs ?? Date.now();
  const boostTs = Date.parse(post.lastBoostedAtIso) || Date.parse(post.createdAtIso) || now;
  const ageHours = Math.max(0, (now - boostTs) / 3_600_000);
  const rCount = post.reDroppedByUserIds.length;
  const vBonus = post.archetype === 'VIDEO_OPINION' ? 1.5 : 0;
  const engagementCore = 1 + 0.45 * Math.log(1 + rCount + 0.8 * vBonus) + 0.22 * Math.log(1 + post.likedByUserIds.length + 0.6 * post.comments.length) + 0.08 * Math.log(1 + post.discoveriesCount);
  return engagementCore * computeDspAffinity(post, options.likedTrackIds, options.tracksById, options.tasteProfile) * Math.pow(1 + ageHours / 8, -0.8) + deterministicUnitHash(post.id, options.randomSeed) * 0.08;
}

export function rankSocialFeedPosts(posts: SocialFeedPost[], options: RankFeedOptions): SocialFeedPost[] {
  if (posts.length === 0) return [];
  if (options.lens === 'VIDEO_OPINIONS') {
    return posts
      .filter((p) => p.archetype === 'VIDEO_OPINION')
      .map((p) => ({ ...p, isRandomDiscoverySlot: false }))
      .sort((a, b) => computeSinglePostViralScore(b, options) - computeSinglePostViralScore(a, options));
  }
  if (options.lens === 'TRENDING_REDROPS') {
    return [...posts]
      .map((p) => ({ ...p, isRandomDiscoverySlot: false }))
      .sort((a, b) => {
        const diff =
          b.reDroppedByUserIds.length * 3 + b.discoveriesCount -
          (a.reDroppedByUserIds.length * 3 + a.discoveriesCount);
        return diff !== 0 ? diff : computeSinglePostViralScore(b, options) - computeSinglePostViralScore(a, options);
      });
  }
  if (options.lens === 'RANDOM_DISCOVERY') {
    return [...posts]
      .map((p) => ({
        post: { ...p, isRandomDiscoverySlot: true },
        weight:
          deterministicUnitHash(p.id, options.randomSeed + 97) *
          ((options.tracksById.get(p.target.trackId || '')?.realPlays ?? 12_000) < 50_000 ? 1.35 : 1.0),
      }))
      .sort((a, b) => b.weight - a.weight)
      .map((x) => x.post);
  }

  const scored = [...posts]
    .map((p) => ({ post: p, score: computeSinglePostViralScore(p, options) }))
    .sort((a, b) => b.score - a.score);
  if (scored.length < 3) return scored.map((s) => ({ ...s.post, isRandomDiscoverySlot: false }));

  const discovery = [...posts]
    .map((p) => ({
      post: p,
      randScore:
        deterministicUnitHash(p.id, options.randomSeed + 31) *
        ((options.tracksById.get(p.target.trackId || '')?.realPlays ?? 25_000) < 50_000 ? 1.45 : 1.0),
    }))
    .sort((a, b) => b.randScore - a.randScore);

  const used = new Set<string>();
  const finalFeed: SocialFeedPost[] = [];
  let mIdx = 0;
  let dIdx = 0;

  while (finalFeed.length < posts.length && (mIdx < scored.length || dIdx < discovery.length)) {
    const isExploreSlot = (finalFeed.length + 1) % 5 === 0 || (posts.length < 5 && finalFeed.length === posts.length - 1);
    if (isExploreSlot) {
      while (dIdx < discovery.length && used.has(discovery[dIdx].post.id)) dIdx++;
      if (dIdx < discovery.length) {
        const pick = discovery[dIdx++].post;
        used.add(pick.id);
        finalFeed.push({ ...pick, isRandomDiscoverySlot: true });
        continue;
      }
    }
    while (mIdx < scored.length && used.has(scored[mIdx].post.id)) mIdx++;
    if (mIdx < scored.length) {
      const pick = scored[mIdx++].post;
      used.add(pick.id);
      finalFeed.push({ ...pick, isRandomDiscoverySlot: false });
    }
  }
  return finalFeed;
}
