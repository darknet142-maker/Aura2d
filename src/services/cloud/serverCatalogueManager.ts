import fs from 'fs';
import path from 'path';
import type { AlbumNode, Track } from '../../shared/types/domain.types';
import { INITIAL_CATALOGUE } from '../../mocks/catalogue.mock';
import { fetchSupabaseTracks } from './serverSupabaseBridge';

export function mergeCatalogueWithTracks(baseCatalogue: AlbumNode[], tracks: Track[]): AlbumNode[] {
  const result: AlbumNode[] = JSON.parse(JSON.stringify(baseCatalogue));
  for (const track of tracks) {
    const albumIdx = result.findIndex(
      (a) => a.artist.toLowerCase() === track.artist.toLowerCase() && a.albumTitle.toLowerCase() === track.album.toLowerCase()
    );
    if (albumIdx >= 0) {
      const trkIdx = result[albumIdx].tracks.findIndex((t) => t.id === track.id);
      if (trkIdx >= 0) result[albumIdx].tracks[trkIdx] = { ...result[albumIdx].tracks[trkIdx], ...track };
      else result[albumIdx].tracks.unshift(track);
    } else {
      result.unshift({
        id: `alb-sb-${track.artist.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
        artist: track.artist,
        albumTitle: track.album,
        category: track.category,
        year: '2026',
        tracks: [track],
      });
    }
  }
  return result;
}

export async function initServerCatalogue(filePath: string): Promise<AlbumNode[]> {
  let diskCatalogue: AlbumNode[] | null = null;
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) diskCatalogue = parsed;
    }
  } catch {
    diskCatalogue = null;
  }
  const base = diskCatalogue && diskCatalogue.length > 0 ? diskCatalogue : INITIAL_CATALOGUE;
  const supabaseTracks = await fetchSupabaseTracks();
  const hydrated = mergeCatalogueWithTracks(base, supabaseTracks);
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(hydrated, null, 2), 'utf-8');
    console.log(`[ServerCatalogueManager] Catalogue hydrated: ${hydrated.length} albums, ${supabaseTracks.length} Supabase tracks.`);
  } catch (err) {
    console.warn('[ServerCatalogueManager] Could not write catalogue.json:', err);
  }
  return hydrated;
}
