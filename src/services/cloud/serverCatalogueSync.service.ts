import type { AlbumNode, Track } from '../../shared/types/domain.types';

let debounceSyncTimer: number | null = null;

export async function fetchServerCatalogue(): Promise<{
  hasData: boolean;
  catalogue: AlbumNode[];
}> {
  try {
    const res = await fetch(`/api/catalogue?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { Pragma: 'no-cache' },
    });
    if (!res.ok) return { hasData: false, catalogue: [] };
    const data = await res.json();
    if (data.hasData && Array.isArray(data.catalogue)) {
      return { hasData: true, catalogue: data.catalogue as AlbumNode[] };
    }
    return { hasData: false, catalogue: [] };
  } catch {
    return { hasData: false, catalogue: [] };
  }
}

export async function syncCatalogueToServer(
  catalogue: AlbumNode[],
  immediate = false
): Promise<boolean> {
  return new Promise((resolve) => {
    if (debounceSyncTimer) {
      window.clearTimeout(debounceSyncTimer);
      debounceSyncTimer = null;
    }

    const execute = async () => {
      try {
        const res = await fetch('/api/catalogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ catalogue }),
        });
        resolve(res.ok);
      } catch {
        resolve(false);
      }
    };

    if (immediate) {
      execute();
    } else {
      debounceSyncTimer = window.setTimeout(execute, 300);
    }
  });
}

export async function syncTrackToServer(track: Track): Promise<boolean> {
  try {
    const res = await fetch('/api/catalogue/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
