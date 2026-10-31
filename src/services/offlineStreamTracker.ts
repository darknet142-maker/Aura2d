export type StreamActionType = 'play' | 'like' | 'unlike' | 'loop' | 'complete' | 'skip';

export interface OfflineStreamEvent {
  eventId: string;
  action: StreamActionType;
  trackId: string;
  userId?: string;
  timestamp: string;
  durationPlayedSeconds?: number;
  loopCount?: number;
  pointsDelta?: number;
  retentionPct?: number;
}

export interface SyncStatusSnapshot {
  queue: OfflineStreamEvent[];
  isOnline: boolean;
  simulatedOffline: boolean;
  isSyncing: boolean;
  totalSyncedCount: number;
  lastSyncedAt: string | null;
  lastSyncedBatchSize: number;
  syncedHistory: OfflineStreamEvent[];
}

const IDB_NAME = 'Aura2dOfflineDB';
const IDB_STORE = 'streaming_offline_queue';

function generateEventUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'evt-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
}

export class OfflineStreamTracker {
  private apiEndpoint: string;
  private storageKey = 'streaming_offline_queue';
  private historyKey = 'streaming_synced_history';
  private isSyncing = false;
  private simulatedOffline = false;
  private totalSyncedCount = 0;
  private lastSyncedAt: string | null = null;
  private lastSyncedBatchSize = 0;
  private listeners = new Set<(snapshot: SyncStatusSnapshot) => void>();

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint;

    if (typeof window !== 'undefined') {
      // Écoute le retour de la connexion internet automatiquement
      window.addEventListener('online', () => {
        this.notify();
        if (!this.simulatedOffline) {
          this.sync();
        }
      });

      window.addEventListener('offline', () => {
        this.notify();
      });

      // Hydratation initiale depuis IndexedDB si disponible
      this.hydrateFromIndexedDB();
    }
  }

  private openIDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(IDB_NAME, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE, { keyPath: 'eventId' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private async hydrateFromIndexedDB() {
    const db = await this.openIDB();
    if (!db) return;
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const idbEvents = (req.result || []) as OfflineStreamEvent[];
        const localEvents = this.getQueue();
        if (idbEvents.length > localEvents.length) {
          localStorage.setItem(this.storageKey, JSON.stringify(idbEvents));
          this.notify();
        }
      };
    } catch {
      // Fallback silencieux sur localStorage
    }
  }

  private async persistToIndexedDB(queue: OfflineStreamEvent[]) {
    const db = await this.openIDB();
    if (!db) return;
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.clear();
      for (const evt of queue) {
        store.put(evt);
      }
    } catch {
      // Fallback sur localStorage déjà assuré
    }
  }

  // 1. Récupérer la file d'attente locale
  public getQueue(): OfflineStreamEvent[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // 2. Sauvegarder la file d'attente localement (localStorage + IndexedDB)
  public saveQueue(queue: OfflineStreamEvent[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(queue));
    } catch {
      // Ignore quota error
    }
    this.persistToIndexedDB(queue);
    this.notify();
  }

  public getSyncedHistory(): OfflineStreamEvent[] {
    try {
      const data = localStorage.getItem(this.historyKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private appendSyncedHistory(syncedEvents: OfflineStreamEvent[]) {
    try {
      const existing = this.getSyncedHistory();
      const combined = [...syncedEvents, ...existing].slice(0, 40);
      localStorage.setItem(this.historyKey, JSON.stringify(combined));
    } catch {
      // Ignore
    }
  }

  public isEffectivelyOnline(): boolean {
    if (this.simulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public setSimulatedOffline(offline: boolean): void {
    this.simulatedOffline = offline;
    this.notify();
    if (!offline && this.isEffectivelyOnline()) {
      this.sync();
    }
  }

  // 3. Enregistrer une action (play, like, unlike, loop, complete, skip)
  public trackAction(
    actionType: StreamActionType,
    trackId: string,
    extraData: Partial<Omit<OfflineStreamEvent, 'eventId' | 'action' | 'trackId' | 'timestamp'>> = {}
  ): OfflineStreamEvent {
    const queue = this.getQueue();

    const event: OfflineStreamEvent = {
      eventId: generateEventUUID(), // Empêche les doublons côté serveur (Idempotence)
      action: actionType,
      trackId,
      timestamp: new Date().toISOString(),
      ...extraData,
    };

    queue.push(event);
    this.saveQueue(queue);

    // Si on est en ligne (et non en mode avion simulé), on tente de synchroniser immédiatement
    if (this.isEffectivelyOnline()) {
      this.sync();
    }

    return event;
  }

  // 4. Synchroniser par lot (Batching) avec le serveur
  public async sync(): Promise<boolean> {
    if (this.isSyncing || !this.isEffectivelyOnline()) return false;

    const queue = this.getQueue();
    if (queue.length === 0) return true;

    this.isSyncing = true;
    this.notify();

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: queue }),
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        // Supprime uniquement les événements qui viennent d'être envoyés et confirmés avec succès
        const syncedIds = new Set<string>(
          Array.isArray(result.processedIds) ? result.processedIds : queue.map((e) => e.eventId)
        );
        const currentQueue = this.getQueue();
        const syncedItems = currentQueue.filter((e) => syncedIds.has(e.eventId));
        const remainingQueue = currentQueue.filter((e) => !syncedIds.has(e.eventId));

        this.totalSyncedCount += syncedItems.length;
        this.lastSyncedBatchSize = syncedItems.length;
        this.lastSyncedAt = new Date().toISOString();
        this.appendSyncedHistory(syncedItems);
        this.saveQueue(remainingQueue);
        return true;
      }
      return false;
    } catch {
      // Échec réseau : les données restent intégralement en tampon local
      return false;
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  public getSnapshot(): SyncStatusSnapshot {
    return {
      queue: this.getQueue(),
      isOnline: this.isEffectivelyOnline(),
      simulatedOffline: this.simulatedOffline,
      isSyncing: this.isSyncing,
      totalSyncedCount: this.totalSyncedCount,
      lastSyncedAt: this.lastSyncedAt,
      lastSyncedBatchSize: this.lastSyncedBatchSize,
      syncedHistory: this.getSyncedHistory(),
    };
  }

  public subscribe(listener: (snapshot: SyncStatusSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }
}

export const streamTracker = new OfflineStreamTracker('/api/sync-metrics');
