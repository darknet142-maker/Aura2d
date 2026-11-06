import type { AlbumNode, AppUser, Track, UserTrackStat } from '../../../../shared/types/domain.types';

export interface SelectedTrackDetailData {
  album: AlbumNode;
  albumIndex: number;
  trackIndex: number;
  track: Track;
  rankInfo: { rank: number; delta: number };
}

export interface StudioTeamMemberSummary {
  name: string;
  role: 'LABEL' | 'BEATMAKER' | 'ENGINEER' | 'LYRICIST';
  tracksCount: number;
  plays: number;
  loops: number;
}

export interface SelectedArtistAnalyticsData {
  artistName: string;
  primaryCategory: string;
  cover?: string;
  artworkType: Track['artworkType'];
  tracks: Track[];
  totalPlays: number;
  totalLoops: number;
  totalLikes: number;
  totalListenSeconds: number;
  avgRetention: number;
  studioTeam: {
    labels: StudioTeamMemberSummary[];
    beatmakers: StudioTeamMemberSummary[];
    engineers: StudioTeamMemberSummary[];
    lyricists: StudioTeamMemberSummary[];
  };
  topListeners: {
    user: AppUser;
    listenSeconds: number;
    playsCount: number;
    loopsCount: number;
  }[];
}

export interface ConsumerAnalyticsData {
  byListenTime: { stat: UserTrackStat; track: Track }[];
  topLoopedItem: { stat: UserTrackStat; track: Track } | null;
  favoriteGenres: { category: string; seconds: number; plays: number; loops: number }[];
}
