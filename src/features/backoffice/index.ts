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
export { AdminSponsorCampaignsPanel } from './components/AdminSponsorCampaignsPanel';
export { AdminCreateCampaignModal } from './components/AdminCreateCampaignModal';
export * from './types/admin-spaces.types';
export { AdminStudio2Layout } from './components/layout/AdminStudio2Layout';
export { AdminSidebar } from './components/layout/AdminSidebar';
export { AdminHeader } from './components/layout/AdminHeader';
export { AdminBreadcrumb } from './components/layout/AdminBreadcrumb';
export { AdminOverviewDashboard } from './components/overview/AdminOverviewDashboard';
export { AdminClassicBackofficeView } from './components/layout/AdminClassicBackofficeView';
