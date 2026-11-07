import type { AnalyticsAlbumNode, AnalyticsTrackItem } from '../../../components/ReusableAnalyticsSheets';
import type { SocialTargetSubject } from '../types/social-feed.types';

export interface FlatTrackEntry {
  track: AnalyticsTrackItem;
  album: AnalyticsAlbumNode;
  albumIndex: number;
  trackIndex: number;
}

/**
 * Résout de façon chirurgicale la chanson correspondant à une recommandation
 * pour éviter toute permutation involontaire lors du clic sur « Écouter ».
 */
export function resolveTargetTrackMatch(
  allTracksFlat: FlatTrackEntry[],
  target: SocialTargetSubject
): FlatTrackEntry | null {
  if (!target) return null;

  // 1. Priorité absolue : identifiant unique de chanson
  if (target.trackId) {
    const byId = allTracksFlat.find((item) => item.track.id === target.trackId);
    if (byId) return byId;
  }

  const cleanTitle = (target.title || '').trim().toLowerCase();
  const cleanArtist = (target.entityName || target.subtitle || '').trim().toLowerCase();

  // 2. Correspondance stricte Titre ET Artiste (indépendant de la casse)
  if (cleanTitle && cleanArtist) {
    const byTitleAndArtist = allTracksFlat.find(
      (item) =>
        item.track.title.trim().toLowerCase() === cleanTitle &&
        item.track.artist.trim().toLowerCase() === cleanArtist
    );
    if (byTitleAndArtist) return byTitleAndArtist;
  }

  // 3. Correspondance stricte par Titre seul
  if (cleanTitle) {
    const byTitle = allTracksFlat.find(
      (item) => item.track.title.trim().toLowerCase() === cleanTitle
    );
    if (byTitle) return byTitle;
  }

  // 4. Correspondance par sous-chaîne du titre (ex: version tronquée ou suffixée)
  if (cleanTitle.length >= 3) {
    const bySubstring = allTracksFlat.find((item) => {
      const t = item.track.title.trim().toLowerCase();
      return t.includes(cleanTitle) || cleanTitle.includes(t);
    });
    if (bySubstring) return bySubstring;
  }

  // 5. Cas d'un projet ou album recommandé
  if (target.kind === 'ALBUM') {
    const byAlbum = allTracksFlat.find(
      (item) =>
        (target.albumId && item.album.id === target.albumId) ||
        item.album.albumTitle.trim().toLowerCase() === cleanTitle
    );
    if (byAlbum) return byAlbum;
  }

  // 6. UNIQUEMENT si la cible est explicitement un artiste
  if (target.kind === 'ARTIST' && cleanArtist) {
    const byArtistOnly = allTracksFlat.find(
      (item) => item.track.artist.trim().toLowerCase() === cleanArtist
    );
    if (byArtistOnly) return byArtistOnly;
  }

  return null;
}

