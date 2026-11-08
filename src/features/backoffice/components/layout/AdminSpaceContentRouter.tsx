import React from 'react';
import { AdminOverviewDashboard } from '../overview/AdminOverviewDashboard';
import { AdminCatalogWorkspace } from '../spaces/catalog/AdminCatalogWorkspace';
import { AdminStudioWorkspace } from '../spaces/studio/AdminStudioWorkspace';
import { AdminListenersWorkspace } from '../spaces/listeners/AdminListenersWorkspace';
import { AdminPartnersWorkspace } from '../spaces/partners/AdminPartnersWorkspace';
import { AdminFinanceWorkspace } from '../spaces/finance/AdminFinanceWorkspace';
import { AdminAdsWorkspace } from '../spaces/ads/AdminAdsWorkspace';
import { AdminInfrastructureWorkspace } from '../spaces/infrastructure/AdminInfrastructureWorkspace';
import { AdminSecurityWorkspace } from '../spaces/security/AdminSecurityWorkspace';
import type { AdminSpaceId } from '../../types/admin-spaces.types';
import type { ReturnTypeUseDropPlatformController } from '../../../listener/hooks/useDropPlatformController';

export interface AdminSpaceContentRouterProps {
  currentSpaceId: AdminSpaceId;
  ctrl: ReturnTypeUseDropPlatformController;
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
  onSelectTrack?: (trackId: string) => void;
  onSelectArtist?: (artistName: string) => void;
  onSelectUser?: (userId: string) => void;
}

export const AdminSpaceContentRouter: React.FC<AdminSpaceContentRouterProps> = ({
  currentSpaceId,
  ctrl,
  onNavigateToSpace,
  onSelectTrack,
  onSelectArtist,
  onSelectUser,
}) => {
  switch (currentSpaceId) {
    case '00_OVERVIEW':
      return (
        <AdminOverviewDashboard
          users={ctrl.users}
          tracks={ctrl.allTracksFlat}
          syncSnapshot={ctrl.syncSnapshot}
          onNavigateToSpace={onNavigateToSpace}
        />
      );

    case '01_CATALOGUE':
      return (
        <AdminCatalogWorkspace
          ctrl={ctrl}
          onNavigateToSpace={onNavigateToSpace}
          onSelectTrack={onSelectTrack}
          onSelectArtist={onSelectArtist}
        />
      );

    case '02_STUDIO':
      return <AdminStudioWorkspace ctrl={ctrl} />;

    case '03_LISTENERS':
      return <AdminListenersWorkspace ctrl={ctrl} onSelectUser={onSelectUser} />;

    case '04_PARTNERS':
      return <AdminPartnersWorkspace ctrl={ctrl} />;

    case '05_FINANCE':
      return <AdminFinanceWorkspace ctrl={ctrl} onSelectTrack={onSelectTrack} />;

    case '06_ADS':
      return <AdminAdsWorkspace ctrl={ctrl} />;

    case '07_INFRASTRUCTURE':
      return <AdminInfrastructureWorkspace ctrl={ctrl} />;

    case '08_SECURITY':
      return <AdminSecurityWorkspace ctrl={ctrl} />;

    default:
      return null;
  }
};
