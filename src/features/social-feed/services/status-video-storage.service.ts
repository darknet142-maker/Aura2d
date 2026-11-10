import type { CommunityRecommendationItem } from '../../../utils/rankingEngine';
import type { SocialFeedPost, UserStatusStory } from '../types/social-feed.types';
import {
  buildSeedSocialPosts,
  buildSeedUserStatuses,
  MAX_ACTIVE_ITEMS_PER_PROFILE,
  STATUS_MAX_LIFESPAN_MS,
} from './social-feed-seeds.service';
import { uploadSharedMediaBlob } from '../../../services/remoteServerSync';

export { MAX_ACTIVE_ITEMS_PER_PROFILE, STATUS_MAX_LIFESPAN_MS };

const SOCIAL_POSTS_LS_KEY = 'drop_social_feed_posts_v1';
const USER_STATUSES_LS_KEY = 'drop_user_statuses_v1';
const IDB_NAME = 'drop_social_videos_idb_v1';
const IDB_STORE = 'status_video_blobs';
const inMemoryBlobCache = new Map<string, Blob>();

function openVideoIdb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(IDB_STORE)) req.result.createObjectStore(IDB_STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

export function getCachedSocialVideoBlob(videoKey?: string): Blob | null {
  return videoKey ? inMemoryBlobCache.get(videoKey) ?? null : null;
}

export async function saveSocialVideoBlob(videoKey: string, blob: Blob): Promise<boolean> {
  inMemoryBlobCache.set(videoKey, blob);
  void uploadSharedMediaBlob(videoKey, blob);
  const db = await openVideoIdb();
  if (!db) return true;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(blob, videoKey);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(true);
    } catch { resolve(true); }
  });
}

export async function loadSocialVideoBlob(videoKey: string): Promise<Blob | null> {
  const cached = inMemoryBlobCache.get(videoKey);
  if (cached) return cached;
  const db = await openVideoIdb();
  if (db) {
    const fromIdb = await new Promise<Blob | null>((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(videoKey);
        req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
        req.onerror = () => resolve(null);
      } catch { resolve(null); }
    });
    if (fromIdb) {
      inMemoryBlobCache.set(videoKey, fromIdb);
      return fromIdb;
    }
  }
  try {
    const res = await fetch(`/api/media/${videoKey}`);
    if (res.ok) {
      const b = await res.blob();
      inMemoryBlobCache.set(videoKey, b);
      return b;
    }
  } catch {}
  return null;
}

export async function deleteSocialVideoBlob(videoKey?: string): Promise<boolean> {
  if (!videoKey) return false;
  inMemoryBlobCache.delete(videoKey);
  const db = await openVideoIdb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(videoKey);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch { resolve(false); }
  });
}

export function isStatusActive4h(st: UserStatusStory, nowMs = Date.now()): boolean {
  const expMs = Date.parse(st.expiresAtIso);
  const createdMs = Date.parse(st.createdAtIso);
  return Number.isFinite(expMs) && expMs > nowMs && (!Number.isFinite(createdMs) || nowMs - createdMs <= STATUS_MAX_LIFESPAN_MS);
}

export function purgeExpiredStatusesIrreversibly(statuses: UserStatusStory[], nowMs = Date.now()): { active: UserStatusStory[]; purgedIds: string[] } {
  const active: UserStatusStory[] = [];
  const purgedIds: string[] = [];
  for (const st of statuses) {
    if (isStatusActive4h(st, nowMs)) active.push(st);
    else { purgedIds.push(st.id); if (st.videoIdbKey) void deleteSocialVideoBlob(st.videoIdbKey); }
  }
  return { active, purgedIds };
}

export function countUserActiveProfileItems(userId: string, posts: SocialFeedPost[], statuses: UserStatusStory[], nowMs = Date.now()): number {
  return posts.filter((p) => p.authorId === userId).length + statuses.filter((s) => s.userId === userId && isStatusActive4h(s, nowMs)).length;
}

function sanitizePost(p: SocialFeedPost): SocialFeedPost {
  const cName = (p.authorName || '').replace(/\s*\(\+241\)/gi, '').replace(/\+241/g, '').trim();
  const cHandle = (p.authorHandle || '').replace(/\s*\(\+241\)/gi, '').replace(/\+241/g, '').replace(/241$/, '') || '@auditeur';
  return {
    ...p,
    authorName: cName || p.authorName,
    authorHandle: cHandle.startsWith('@') ? cHandle : `@${cHandle}`,
    target: { ...p.target, subtitle: (p.target?.subtitle || '').replace(/\s*\(\+241\)/gi, '').replace(/\+241/g, '').trim() },
  };
}

const MOCK_ID_REGEX = /^(t-10[0-9]|t-20[0-9]|t-30[0-9]|t-main-|t-beat-|track-mock-)/;

export function loadPersistedSocialPosts(legacyRecos: CommunityRecommendationItem[]): SocialFeedPost[] {
  if (typeof localStorage === 'undefined') return buildSeedSocialPosts(legacyRecos);
  try {
    const raw = localStorage.getItem(SOCIAL_POSTS_LS_KEY);
    if (raw === null) return buildSeedSocialPosts(legacyRecos);
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const clean = (parsed as SocialFeedPost[])
        .filter((p) => !p.target?.trackId || !MOCK_ID_REGEX.test(p.target.trackId))
        .map(sanitizePost);
      return clean.length > 0 ? clean : buildSeedSocialPosts(legacyRecos);
    }
  } catch { /* fallback */ }
  return buildSeedSocialPosts(legacyRecos);
}

export function savePersistedSocialPosts(posts: SocialFeedPost[]): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(SOCIAL_POSTS_LS_KEY, JSON.stringify(posts.slice(0, 100))); } catch { /* ignore */ }
}

export function loadPersistedUserStatuses(): UserStatusStory[] {
  if (typeof localStorage === 'undefined') return buildSeedUserStatuses();
  try {
    const raw = localStorage.getItem(USER_STATUSES_LS_KEY);
    if (raw === null) return buildSeedUserStatuses();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const clean = (parsed as UserStatusStory[]).filter(
        (s) => !s.target?.trackId || !MOCK_ID_REGEX.test(s.target.trackId)
      );
      const { active } = purgeExpiredStatusesIrreversibly(clean);
      return active.length > 0 ? active : buildSeedUserStatuses();
    }
  } catch { /* fallback */ }
  return buildSeedUserStatuses();
}

export function savePersistedUserStatuses(statuses: UserStatusStory[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const { active } = purgeExpiredStatusesIrreversibly(statuses);
    localStorage.setItem(USER_STATUSES_LS_KEY, JSON.stringify(active.slice(0, 60)));
  } catch { /* ignore */ }
}
