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
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { hasData: false, catalogue: [] };
    }
    const data = await res.json();
    if (data && data.hasData && Array.isArray(data.catalogue)) {
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

export async function deleteTrackOnServer(trackId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/catalogue/track/${encodeURIComponent(trackId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function uploadMediaFileToServer(
  file: File,
  type: 'audio' | 'cover'
): Promise<string> {
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch('/api/media/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      base64Data,
      type,
    }),
  });

  if (!res.ok) {
    throw new Error('Échec du téléversement du média sur le serveur');
  }

  const data = await res.json();
  return data.url as string;
}
