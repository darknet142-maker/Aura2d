import type { SocialFeedPost, UserStatusStory } from '../features/social-feed/types/social-feed.types';
import type { SponsorCampaign } from '../features/tokens/types/token-economy.types';

export interface RemoteSyncEvent {
  type:
    | 'POST_CREATED'
    | 'STATUS_CREATED'
    | 'CAMPAIGN_CREATED'
    | 'CATALOGUE_UPDATED'
    | 'TRACK_SAVED'
    | 'PING'
    | 'CONNECTED';
  payload?: any;
}

export async function fetchSharedFeedPosts(): Promise<SocialFeedPost[]> {
  try {
    const res = await fetch(`/api/feed/posts?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.posts) ? data.posts : [];
  } catch {
    return [];
  }
}

export async function publishSharedFeedPost(post: SocialFeedPost): Promise<boolean> {
  try {
    const res = await fetch('/api/feed/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchSharedStatuses(): Promise<UserStatusStory[]> {
  try {
    const res = await fetch(`/api/feed/statuses?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.statuses) ? data.statuses : [];
  } catch {
    return [];
  }
}

export async function publishSharedStatus(status: UserStatusStory): Promise<boolean> {
  try {
    const res = await fetch('/api/feed/statuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function uploadSharedMediaBlob(mediaId: string, blob: Blob): Promise<string | null> {
  try {
    const buffer = await blob.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = window.btoa(binary);

    const res = await fetch('/api/feed/media-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId, base64Data, mimeType: blob.type }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.url || `/api/media/${mediaId}`;
  } catch (err) {
    console.warn('Media upload error:', err);
    return null;
  }
}

export async function fetchActiveCampaigns(): Promise<SponsorCampaign[]> {
  try {
    const res = await fetch(`/api/campaigns?status=ACTIVE&_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.campaigns) ? data.campaigns : [];
  } catch {
    return [];
  }
}

export function subscribeToRemoteLiveEvents(onEvent: (event: RemoteSyncEvent) => void): () => void {
  if (typeof window === 'undefined' || !('EventSource' in window)) {
    return () => {};
  }

  let es: EventSource | null = null;
  let retryTimer: number | null = null;

  function connect() {
    try {
      es = new EventSource('/api/live-events');
      es.onmessage = (msg) => {
        try {
          const parsed = JSON.parse(msg.data) as RemoteSyncEvent;
          onEvent(parsed);
        } catch {}
      };
      es.onerror = () => {
        es?.close();
        retryTimer = window.setTimeout(connect, 4000);
      };
    } catch {
      retryTimer = window.setTimeout(connect, 4000);
    }
  }

  connect();

  return () => {
    if (retryTimer) clearTimeout(retryTimer);
    es?.close();
  };
}

