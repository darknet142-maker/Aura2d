/**
 * Lot 1 — Domaine Auditeur (`features/listener`)
 * Regroupe le lecteur immersif 2D/3D, le gestionnaire de file d'attente,
 * l'égaliseur 5 bandes, les paroles synchronisées et le tracker hors ligne.
 */
export { Immersive3DPlayer } from '../../components/Immersive3DPlayer';
export type { LyricLine } from '../../components/Immersive3DPlayer';
export {
  CoverArtwork,
  DropOfficialLogo,
  RankMedalSvg,
} from '../../components/CoverArtwork';
export type { ArtworkType } from '../../components/CoverArtwork';
export {
  streamTracker,
  type OfflineStreamEvent,
  type SyncStatusSnapshot,
} from '../../services/offlineStreamTracker';
