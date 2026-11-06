/**
 * Lot 5 — Back-Office & Administration (`features/backoffice`)
 * Regroupe la barre de commande Cloud Sync, la régie publicitaire Slideshow,
 * la base de données réutilisable, l'annuaire auditeurs, les fiches analytiques et le studio Upload Wizard.
 */
export * from './backoffice.types';
export { AdminCommandHeader } from './components/AdminCommandHeader';
export { AdminCatalogueRepertoire } from './components/AdminCatalogueRepertoire';
export { AdminCatalogueAlgo } from './components/AdminCatalogueAlgo';
export { AdminBannersManager } from './components/AdminBannersManager';
export { AdminDatabaseManager } from './components/AdminDatabaseManager';
export { AdminUsersDirectory } from './components/AdminUsersDirectory';
export { AdminDrmOfflinePanel } from './components/AdminDrmOfflinePanel';
export { TrackEditModal } from './components/TrackEditModal';
export {
  AdminTrackDrilldownView,
  AdminArtistDrilldownView,
  AdminConsumerUserDrilldownView,
} from './components/AdminDrilldownViews';
export { AdminUploadWizard } from './components/AdminUploadWizard';
