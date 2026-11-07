import type { CommunityRecommendationItem } from '../../../utils/rankingEngine';
import type { SocialFeedPost, UserStatusStory } from '../types/social-feed.types';
import { buildSeedSocialPosts, buildSeedUserStatuses } from './social-feed-seeds.service';

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
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
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

export function loadPersistedSocialPosts(
  legacyRecos: CommunityRecommendationItem[]
): SocialFeedPost[] {
  if (typeof localStorage === 'undefined') {
    return buildSeedSocialPosts(legacyRecos);
  }
  try {
    const raw = localStorage.getItem(SOCIAL_POSTS_LS_KEY);
    if (!raw) return buildSeedSocialPosts(legacyRecos);
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as SocialFeedPost[];
    }
  } catch {
    // Repli sur les données initiales
  }
  return buildSeedSocialPosts(legacyRecos);
}

export function savePersistedSocialPosts(posts: SocialFeedPost[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SOCIAL_POSTS_LS_KEY, JSON.stringify(posts.slice(0, 80)));
  } catch {
    // Quota plein : conserver les plus récents
  }
}

export function filterActive24hStatuses(
  statuses: UserStatusStory[],
  nowMs = Date.now()
): UserStatusStory[] {
  return statuses.filter((st) => {
    const exp = Date.parse(st.expiresAtIso);
    return Number.isFinite(exp) && exp > nowMs;
  });
}

export function loadPersistedUserStatuses(): UserStatusStory[] {
  if (typeof localStorage === 'undefined') {
    return buildSeedUserStatuses();
  }
  try {
    const raw = localStorage.getItem(USER_STATUSES_LS_KEY);
    if (!raw) return buildSeedUserStatuses();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const active = filterActive24hStatuses(parsed as UserStatusStory[]);
      return active.length > 0 ? active : buildSeedUserStatuses();
    }
  } catch {
    // Repli
  }
  return buildSeedUserStatuses();
}

export function savePersistedUserStatuses(statuses: UserStatusStory[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const active = filterActive24hStatuses(statuses);
    localStorage.setItem(USER_STATUSES_LS_KEY, JSON.stringify(active.slice(0, 60)));
  } catch {
    // Ignore
  }
}
