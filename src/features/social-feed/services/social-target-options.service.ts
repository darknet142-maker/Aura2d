import type { AnalyticsAlbumNode, AnalyticsTrackItem } from '../../../components/ReusableAnalyticsSheets';
import type { SocialTargetSubject } from '../types/social-feed.types';
import type { ComposerSelectableOption } from '../components/PublishRecoAndStatusModal';

export function buildComposerOptionsFromCatalogue(
  allTracksFlat: { track: AnalyticsTrackItem; album: AnalyticsAlbumNode }[]
): {
  trackOpts: ComposerSelectableOption[];
  albumOpts: ComposerSelectableOption[];
  artistOpts: ComposerSelectableOption[];
  studioTargets: SocialTargetSubject[];
} {
  const trackOpts: ComposerSelectableOption[] = [];
  const albumOpts: ComposerSelectableOption[] = [];
  const artistOpts: ComposerSelectableOption[] = [];
  const seenAlb = new Set<string>();
  const seenArt = new Set<string>();

  for (const { track, album } of allTracksFlat) {
    trackOpts.push({
      key: `t:${track.id}`,
      target: {
        kind: 'TRACK', trackId: track.id, entityName: track.artist,
        title: track.title, subtitle: track.artist, genre: track.category,
        cover: track.cover, artworkType: track.artworkType, bpm: track.bpm,
      },
    });
    if (!seenAlb.has(album.id)) {
      seenAlb.add(album.id);
      albumOpts.push({
        key: `alb:${album.id}`,
        target: {
          kind: 'ALBUM', albumId: album.id, trackId: track.id, entityName: album.artist,
          title: album.albumTitle, subtitle: album.artist, genre: album.category,
          cover: track.cover, artworkType: track.artworkType,
        },
      });
    }
    if (!seenArt.has(track.artist)) {
      seenArt.add(track.artist);
      artistOpts.push({
        key: `art:${track.artist}`,
        target: {
          kind: 'ARTIST', trackId: track.id, entityName: track.artist,
          title: track.artist, subtitle: `Catalogue ${track.category}`, genre: track.category,
          cover: track.cover, artworkType: track.artworkType,
        },
      });
    }
  }

  return {
    trackOpts,
    albumOpts,
    artistOpts,
    studioTargets: [...trackOpts, ...albumOpts, ...artistOpts].map((o) => o.target),
  };
}

