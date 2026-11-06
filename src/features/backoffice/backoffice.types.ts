import type { Track } from '../../shared/types/domain.types';

export type AdminMainTabId =
  | 'CATALOGUE'
  | 'UPLOAD'
  | 'BANNERS'
  | 'DATABASE'
  | 'USERS'
  | 'ROYALTIES_BUGADA';

export type CatalogueSubTabId = 'REPERTOIRE' | 'ALGO' | 'RULES';

export interface EditingTrackState {
  albumId: string;
  track: Track;
  durationFormatted: string;
  dropStartFormatted?: string;
  featuringInput?: string;
}
