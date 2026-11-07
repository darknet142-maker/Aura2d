import type { CommunityRecommendationItem } from '../../../utils/rankingEngine';
import type { SocialFeedPost, UserStatusStory } from '../types/social-feed.types';
import {
  buildSeedSocialPosts,
  buildSeedUserStatuses,
  MAX_ACTIVE_ITEMS_PER_PROFILE,
  STATUS_MAX_LIFESPAN_MS,
} from './social-feed-seeds.service';

export { MAX_ACTIVE_ITEMS_PER_PROFILE, STATUS_MAX_LIFESPAN_MS };

const SOCIAL_POSTS_LS_KEY = 'drop_social_feed_posts_v1';
const USER_STATUSES_LS_KEY = 'drop_user_statuses_v1';
const IDB_NAME = 'drop_social_videos_idb_v1';
const IDB_STORE = 'status_video_blobs';

function openVideoIdb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveSocialVideoBlob(videoKey: string, blob: Blob): Promise<boolean> {
  const db = await openVideoIdb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(blob, videoKey);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function loadSocialVideoBlob(videoKey: string): Promise<Blob | null> {
  const db = await openVideoIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(videoKey);
      req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function deleteSocialVideoBlob(videoKey?: string): Promise<boolean> {
  if (!videoKey) return false;
  const db = await openVideoIdb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(videoKey);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export function isStatusActive4h(st: UserStatusStory, nowMs = Date.now()): boolean {
  const createdMs = Date.parse(st.createdAtIso);
  const expMs = Date.parse(st.expiresAtIso);
  if (!Number.isFinite(expMs) || expMs <= nowMs) return false;
  if (Number.isFinite(createdMs) && nowMs - createdMs > STATUS_MAX_LIFESPAN_MS) return false;
  return true;
}

export function purgeExpiredStatusesIrreversibly(
  statuses: UserStatusStory[],
  nowMs = Date.now()
): { active: UserStatusStory[]; purgedIds: string[] } {
  const active: UserStatusStory[] = [];
  const purgedIds: string[] = [];
  for (const st of statuses) {
    if (isStatusActive4h(st, nowMs)) active.push(st);
    else {
      purgedIds.push(st.id);
      if (st.videoIdbKey) void deleteSocialVideoBlob(st.videoIdbKey);
    }
  }
  return { active, purgedIds };
}

export function countUserActiveProfileItems(
  userId: string,
  posts: SocialFeedPost[],
  statuses: UserStatusStory[],
  nowMs = Date.now()
): number {
  const ownPosts = posts.filter((p) => p.authorId === userId).length;
  const ownStatuses = statuses.filter((s) => s.userId === userId && isStatusActive4h(s, nowMs)).length;
  return ownPosts + ownStatuses;
}

export function loadPersistedSocialPosts(legacyRecos: CommunityRecommendationItem[]): SocialFeedPost[] {
  if (typeof localStorage === 'undefined') return buildSeedSocialPosts(legacyRecos);
  try {
    const raw = localStorage.getItem(SOCIAL_POSTS_LS_KEY);
    if (raw === null) return buildSeedSocialPosts(legacyRecos);
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as SocialFeedPost[];
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
    if (Array.isArray(parsed)) return purgeExpiredStatusesIrreversibly(parsed as UserStatusStory[]).active;
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
