import type { CommunityRecommendationItem } from '../../../utils/rankingEngine';
import type { SocialFeedPost, UserStatusStory } from '../types/social-feed.types';

export const STATUS_MAX_LIFESPAN_MS = 4 * 3_600_000;
export const MAX_ACTIVE_ITEMS_PER_PROFILE = 10;

export function toUserHandle(name: string): string {
  const clean = name.replace(/\s*\(\+241\)/gi, '').replace(/\+241/g, '').trim();
  const slug = clean
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .replace(/241$/, '')
    .slice(0, 16);
  return `@${slug || 'auditeur'}`;
}

export function buildSeedSocialPosts(legacyRecos: CommunityRecommendationItem[]): SocialFeedPost[] {
  const now = Date.now();
  const isoAgo = (mins: number) => new Date(now - mins * 60_000).toISOString();

  const curated: SocialFeedPost[] = [
    {
      id: 'post-seed-vinyl-1',
      archetype: 'TRACK_VINYL',
      authorId: 'u-3',
      authorName: 'Inès Mba-Mintsa',
      authorHandle: '@inesmba',
      authorAvatar: 'IM',
      caption:
        "C'est probablement le meilleur couplet rap gabonais que j'ai entendu cette année. Le grain vocal et les basses claquent fort au casque !",
      createdAtIso: isoAgo(4),
      createdAtLabel: '4 min',
      lastBoostedAtIso: isoAgo(2),
      target: {
        kind: 'TRACK', trackId: 't-301', entityName: "Ba'ponga",
        title: "Couronne d'Okoumé", subtitle: "Ba'ponga feat. Movaizhaleine, Kôba Building",
        genre: 'Rap Gabonais • Hip-Hop', cover: '', artworkType: 'pastel_heart',
        bpm: 94, camelotKey: '8A', lyricistName: 'Movaizhaleine & Edgar Nguema',
      },
      likedByUserIds: ['u-2', 'u-4', 'u-5'],
      reDroppedByUserIds: ['u-2', 'u-4'],
      reDropRelays: [{ userId: 'u-2', userName: 'Marc-Arthur Obiang', userAvatar: 'MO', relayedAtIso: isoAgo(2) }],
      comments: [{
        id: 'c-seed-1', authorId: 'u-2', authorName: 'Marc-Arthur Obiang', authorHandle: '@marcarthur',
        authorAvatar: 'MO', body: 'L’entrée de Movaizhaleine sur le refrain à 0:48 donne des frissons.',
        createdAtLabel: '2 min', awardedPoint: true,
      }],
      discoveriesCount: 14, discovererUserIds: ['u-2', 'u-4', 'u-5'], discovererInitials: ['MO', 'SN', 'AK'],
      totalPointsGenerated: 1.7,
    },
    {
      id: 'post-seed-spotlight-2',
      archetype: 'SPOTLIGHT_VISUAL',
      authorId: 'u-1',
      authorName: 'Camille Ndong',
      authorHandle: '@camillendong',
      authorAvatar: 'CN',
      caption: 'Cette voix va vous briser le cœur dès la première écoute nocturne sur le Bord de Mer.',
      createdAtIso: isoAgo(9),
      createdAtLabel: '9 min',
      lastBoostedAtIso: isoAgo(5),
      target: {
        kind: 'TRACK', trackId: 't-main-1', entityName: "Emma'a",
        title: 'Lumières du Bord de Mer', subtitle: "Emma'a feat. Eboloko • Libreville",
        genre: 'Afrobeats & Soul', cover: '', artworkType: 'creative_yellow', bpm: 102, camelotKey: '9B',
      },
      likedByUserIds: ['u-2', 'u-3', 'u-4', 'u-6'],
      reDroppedByUserIds: ['u-3', 'u-5', 'u-6', 'u-7', 'u-8'],
      reDropRelays: [{ userId: 'u-3', userName: 'Inès Mba-Mintsa', userAvatar: 'IM', relayedAtIso: isoAgo(5) }],
      comments: [],
      discoveriesCount: 18, discovererUserIds: ['u-3', 'u-4', 'u-5'], discovererInitials: ['IM', 'MO', 'JD'],
      totalPointsGenerated: 2.85,
    },
    {
      id: 'post-seed-opinion-3',
      archetype: 'VIDEO_OPINION',
      authorId: 'u-2',
      authorName: 'Marc-Arthur Obiang',
      authorHandle: '@marcarthur',
      authorAvatar: 'MO',
      caption: 'Mon avis à chaud (30s sans filtre) sur la direction artistique Ntcham de L’Oiseau Rare et le travail de Kvnz Beats sur cet EP !',
      createdAtIso: isoAgo(18),
      createdAtLabel: '18 min',
      lastBoostedAtIso: isoAgo(12),
      captureMode: 'VOICE_OPINION_NO_MUSIC',
      videoDurationSec: 26,
      target: {
        kind: 'ARTIST', trackId: 't-101', entityName: "L'Oiseau Rare",
        title: "L'Oiseau Rare", subtitle: 'Scène Ntcham • Souverain du Komo',
        genre: 'Ntcham', cover: '', artworkType: 'crimson_bloom', bpm: 126, camelotKey: '5A',
      },
      likedByUserIds: ['u-1', 'u-3'], reDroppedByUserIds: ['u-1'], reDropRelays: [], comments: [],
      discoveriesCount: 9, discovererUserIds: ['u-1', 'u-3'], discovererInitials: ['CN', 'IM'],
      totalPointsGenerated: 1.3,
    },
  ];

  const extra = legacyRecos
    .filter((r) => !curated.some((c) => c.target.trackId === r.trackId))
    .map((r, idx): SocialFeedPost => ({
      id: `post-legacy-${r.id}`,
      archetype: r.isLyricExcerpt ? 'LYRIC_EXCERPT' : 'TRACK_VINYL',
      authorId: r.userId || `u-leg-${idx}`,
      authorName: r.userName, authorHandle: toUserHandle(r.userName), authorAvatar: r.userAvatar || 'DR',
      caption: (r.commentOrLyricExcerpt || 'Recommandé à la communauté DROP').replace(/\s*[-•]?\s*-?14(?:\.0)?\s*LUFS\s*!?/gi, ''),
      createdAtIso: isoAgo(25 + idx * 8), createdAtLabel: r.createdAt.replace(/^il y a\s+/i, ''),
      lastBoostedAtIso: isoAgo(25 + idx * 8),
      target: {
        kind: 'TRACK', trackId: r.trackId, entityName: r.trackArtist.split(' feat.')[0].trim(),
        title: r.trackTitle, subtitle: r.trackArtist, genre: r.trackCategory,
        cover: r.cover, artworkType: r.artworkType, lyricistName: r.lyricistName,
      },
      likedByUserIds: [], reDroppedByUserIds: [], reDropRelays: [], comments: [],
      discoveriesCount: 3 + idx * 2, discovererUserIds: [], discovererInitials: ['DR', 'GA'],
      totalPointsGenerated: r.boostPoints,
    }));

  return [...curated, ...extra];
}

export function buildSeedUserStatuses(): UserStatusStory[] {
  const now = Date.now();
  const c1 = now - 14 * 60_000;
  const c2 = now - 32 * 60_000;
  return [
    {
      id: 'st-seed-1', userId: 'u-3', userName: 'Inès Mba', userHandle: '@inesmba', userAvatar: 'IM',
      captureMode: 'DROP_MUSIC_30S', caption: 'Écoute nocturne sur Couronne d’Okoumé — ce refrain reste en tête !',
      durationSec: 22, createdAtIso: new Date(c1).toISOString(), expiresAtIso: new Date(c1 + STATUS_MAX_LIFESPAN_MS).toISOString(),
      target: { kind: 'TRACK', trackId: 't-301', entityName: "Ba'ponga", title: "Couronne d'Okoumé", subtitle: "Ba'ponga feat. Movaizhaleine", genre: 'Rap Gabonais', cover: '', artworkType: 'pastel_heart' },
      seenByUserIds: [], likedByUserIds: ['u-2'], reDroppedByUserIds: [],
    },
    {
      id: 'st-seed-2', userId: 'u-2', userName: 'Marc-Arthur', userHandle: '@marcarthur', userAvatar: 'MO',
      captureMode: 'VOICE_OPINION_NO_MUSIC', caption: 'Mon avis au micro : pourquoi cet EP Ntcham change la donne à Libreville.',
      durationSec: 28, createdAtIso: new Date(c2).toISOString(), expiresAtIso: new Date(c2 + STATUS_MAX_LIFESPAN_MS).toISOString(),
      target: { kind: 'ARTIST', trackId: 't-101', entityName: "L'Oiseau Rare", title: "L'Oiseau Rare", subtitle: 'Artiste • Scène Ntcham', genre: 'Ntcham', cover: '', artworkType: 'crimson_bloom' },
      seenByUserIds: [], likedByUserIds: ['u-1', 'u-3'], reDroppedByUserIds: ['u-3'],
    },
  ];
}
