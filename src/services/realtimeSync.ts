import { supabase, isSupabaseConfigured } from './musicService';
import type { AdBannerSlide, AdBannerSettings } from './musicService';

// ============================================================================
// TYPES D'ÉVÉNEMENTS TEMPS RÉEL MULTI-APPAREILS (DROP LIVE REALTIME SYNC)
// ============================================================================

export type LiveSyncEventType =
  | 'TRACKS_UPDATED'
  | 'BANNERS_UPDATED'
  | 'ENTITIES_UPDATED'
  | 'PLAYLISTS_UPDATED'
  | 'ADMIN_ANNOUNCEMENT';

export interface TracksUpdatedPayload {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'FULL_SYNC';
  trackId?: string;
  trackTitle?: string;
  artist?: string;
  message?: string;
  timestamp: string;
}

export interface BannersUpdatedPayload {
  banners: AdBannerSlide[];
  settings: AdBannerSettings;
  message?: string;
  timestamp: string;
}

export interface EntitiesUpdatedPayload {
  entityType?: 'ARTIST' | 'LABEL' | 'BEATMAKER' | 'ENGINEER' | 'LYRICIST';
  name?: string;
  message?: string;
  timestamp: string;
}

export interface PlaylistsUpdatedPayload {
  userId: string;
  playlistId?: string;
  playlistName?: string;
  message?: string;
  timestamp: string;
}

export interface AdminAnnouncementPayload {
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING';
  timestamp: string;
}

export type LiveSyncPayload =
  | { type: 'TRACKS_UPDATED'; payload: TracksUpdatedPayload }
  | { type: 'BANNERS_UPDATED'; payload: BannersUpdatedPayload }
  | { type: 'ENTITIES_UPDATED'; payload: EntitiesUpdatedPayload }
  | { type: 'PLAYLISTS_UPDATED'; payload: PlaylistsUpdatedPayload }
  | { type: 'ADMIN_ANNOUNCEMENT'; payload: AdminAnnouncementPayload };

export interface LiveSyncCallbacks {
  onTracksUpdated?: (payload: TracksUpdatedPayload) => void;
  onBannersUpdated?: (payload: BannersUpdatedPayload) => void;
  onEntitiesUpdated?: (payload: EntitiesUpdatedPayload) => void;
  onPlaylistsUpdated?: (payload: PlaylistsUpdatedPayload) => void;
  onAdminAnnouncement?: (payload: AdminAnnouncementPayload) => void;
  onConnectionChange?: (status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED') => void;
}

// Canal WebSocket Supabase dédié
const SUPABASE_CHANNEL_NAME = 'drop-live-sync-v1';
// Canal local inter-onglets du navigateur
const LOCAL_CHANNEL_NAME = 'drop_cross_tab_live_sync';

let activeSupabaseChannel: any = null;
let activeLocalChannel: BroadcastChannel | null = null;
const subscribers = new Set<LiveSyncCallbacks>();

function getLocalBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    if (!activeLocalChannel) {
      activeLocalChannel = new BroadcastChannel(LOCAL_CHANNEL_NAME);
      activeLocalChannel.onmessage = (event) => {
        const data = event.data as LiveSyncPayload;
        dispatchToSubscribers(data);
      };
    }
    return activeLocalChannel;
  }
  return null;
}

function dispatchToSubscribers(event: LiveSyncPayload) {
  subscribers.forEach((cb) => {
    try {
      if (event.type === 'TRACKS_UPDATED' && cb.onTracksUpdated) {
        cb.onTracksUpdated(event.payload);
      } else if (event.type === 'BANNERS_UPDATED' && cb.onBannersUpdated) {
        cb.onBannersUpdated(event.payload);
      } else if (event.type === 'ENTITIES_UPDATED' && cb.onEntitiesUpdated) {
        cb.onEntitiesUpdated(event.payload);
      } else if (event.type === 'PLAYLISTS_UPDATED' && cb.onPlaylistsUpdated) {
        cb.onPlaylistsUpdated(event.payload);
      } else if (event.type === 'ADMIN_ANNOUNCEMENT' && cb.onAdminAnnouncement) {
        cb.onAdminAnnouncement(event.payload);
      }
    } catch (err) {
      console.warn('[DropRealtime] Erreur dispatch callback:', err);
    }
  });
}

/**
 * Initialise le canal WebSocket Supabase Realtime et configure l'écoute bidirectionnelle
 */
export function initRealtimeSync(): void {
  getLocalBroadcastChannel();

  if (!isSupabaseConfigured() || !supabase) {
    notifyConnectionStatus('DISCONNECTED');
    return;
  }

  if (activeSupabaseChannel) return;

  notifyConnectionStatus('CONNECTING');

  activeSupabaseChannel = supabase.channel(SUPABASE_CHANNEL_NAME, {
    config: {
      broadcast: { self: false }, // Les autres appareils reçoivent l'événement
    },
  });

  // 1. ÉCOUTE DES DIFFUSIONS TEMPS RÉEL (BROADCAST EN DIRECT < 20ms)
  activeSupabaseChannel
    .on('broadcast', { event: 'TRACKS_UPDATED' }, (payload: { payload: TracksUpdatedPayload }) => {
      dispatchToSubscribers({ type: 'TRACKS_UPDATED', payload: payload.payload });
    })
    .on('broadcast', { event: 'BANNERS_UPDATED' }, (payload: { payload: BannersUpdatedPayload }) => {
      dispatchToSubscribers({ type: 'BANNERS_UPDATED', payload: payload.payload });
    })
    .on('broadcast', { event: 'ENTITIES_UPDATED' }, (payload: { payload: EntitiesUpdatedPayload }) => {
      dispatchToSubscribers({ type: 'ENTITIES_UPDATED', payload: payload.payload });
    })
    .on('broadcast', { event: 'PLAYLISTS_UPDATED' }, (payload: { payload: PlaylistsUpdatedPayload }) => {
      dispatchToSubscribers({ type: 'PLAYLISTS_UPDATED', payload: payload.payload });
    })
    .on('broadcast', { event: 'ADMIN_ANNOUNCEMENT' }, (payload: { payload: AdminAnnouncementPayload }) => {
      dispatchToSubscribers({ type: 'ADMIN_ANNOUNCEMENT', payload: payload.payload });
    });

  // 2. ÉCOUTE DES MODIFICATIONS POSTGRESQL DIRECTES (CDC / REPLICATION)
  try {
    activeSupabaseChannel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tracks' },
        (change: any) => {
          const action =
            change.eventType === 'INSERT'
              ? 'CREATE'
              : change.eventType === 'DELETE'
              ? 'DELETE'
              : 'UPDATE';
          const trackRow = change.new || change.old || {};
          dispatchToSubscribers({
            type: 'TRACKS_UPDATED',
            payload: {
              action,
              trackId: trackRow.app_track_id || trackRow.id,
              trackTitle: trackRow.title,
              artist: trackRow.artist,
              message: `Mise à jour en direct de « ${trackRow.title || 'Piste'} »`,
              timestamp: new Date().toISOString(),
            },
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ad_banners' },
        () => {
          // Re-synchronisation automatique des bannières
          dispatchToSubscribers({
            type: 'BANNERS_UPDATED',
            payload: {
              banners: [],
              settings: {} as any,
              message: 'Bannières publicitaires synchronisées depuis Supabase',
              timestamp: new Date().toISOString(),
            },
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ad_banner_settings' },
        () => {
          dispatchToSubscribers({
            type: 'BANNERS_UPDATED',
            payload: {
              banners: [],
              settings: {} as any,
              message: 'Paramètres publicitaires synchronisés',
              timestamp: new Date().toISOString(),
            },
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'studio_entities' },
        () => {
          dispatchToSubscribers({
            type: 'ENTITIES_UPDATED',
            payload: {
              message: 'Talents et métiers du studio mis à jour',
              timestamp: new Date().toISOString(),
            },
          });
        }
      );
  } catch (err) {
    console.warn('[DropRealtime] CDC Postgres non activé, bascule sur Realtime Broadcast WebSocket:', err);
  }

  activeSupabaseChannel.subscribe((status: string, err: any) => {
    if (status === 'SUBSCRIBED') {
      notifyConnectionStatus('CONNECTED');
    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      notifyConnectionStatus('DISCONNECTED');
      if (err) console.warn('[DropRealtime] Erreur WebSocket:', err);
    }
  });
}

function notifyConnectionStatus(status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED') {
  subscribers.forEach((cb) => {
    cb.onConnectionChange?.(status);
  });
}

/**
 * Envoie un événement de synchronisation en temps réel à TOUS les appareils connectés
 * (ordinateur, iPhone, Android, tablettes, autres navigateurs).
 */
export async function broadcastLiveSync(event: LiveSyncPayload): Promise<void> {
  // 1. Diffusion locale inter-onglets
  try {
    const local = getLocalBroadcastChannel();
    local?.postMessage(event);
  } catch (err) {
    console.warn('[DropRealtime] Erreur diffusion locale:', err);
  }

  // 2. Diffusion Cloud Supabase Realtime WebSocket
  if (!isSupabaseConfigured() || !supabase) return;

  try {
    if (!activeSupabaseChannel) {
      initRealtimeSync();
    }

    if (activeSupabaseChannel) {
      await activeSupabaseChannel.send({
        type: 'broadcast',
        event: event.type,
        payload: event.payload,
      });
    }
  } catch (err) {
    console.warn('[DropRealtime] Erreur envoi broadcast Supabase:', err);
  }
}

/**
 * Abonnement à la synchronisation temps réel
 */
export function subscribeToLiveSync(callbacks: LiveSyncCallbacks): () => void {
  subscribers.add(callbacks);
  initRealtimeSync();

  return () => {
    subscribers.delete(callbacks);
  };
}
