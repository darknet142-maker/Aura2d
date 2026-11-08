import React from 'react';
import { FortanixKeyInsightCard } from './FortanixKeyInsightCard';
import { AdminDrmOfflinePanel } from '../../AdminDrmOfflinePanel';
import type { ReturnTypeUseDropPlatformController } from '../../../../listener/hooks/useDropPlatformController';

export interface AdminSecurityWorkspaceProps {
  ctrl: ReturnTypeUseDropPlatformController;
}

export const AdminSecurityWorkspace: React.FC<AdminSecurityWorkspaceProps> = ({ ctrl }) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <FortanixKeyInsightCard
        totalTracks={ctrl.allTracksFlat.length}
        encryptedCount={ctrl.allTracksFlat.length}
      />

      <AdminDrmOfflinePanel
        allTracksFlat={ctrl.allTracksFlat}
        currentTrack={ctrl.currentTrack}
        adminDrmTargetTrackId={ctrl.adminDrmTargetTrackId}
        setAdminDrmTargetTrackId={ctrl.setAdminDrmTargetTrackId}
        adminDrmVault={ctrl.adminDrmVault}
        isEncryptingAdminDrm={ctrl.isEncryptingAdminDrm}
        adminDrmStatusMsg={ctrl.adminDrmStatusMsg}
        onEncryptTrackToSandbox={ctrl.encryptTrackToAdminSandbox}
        onTestRamDecrypt={ctrl.handleAdminTestRamDecrypt}
        onSimulateExfiltrationSelfDestruct={ctrl.handleAdminSimulateExfiltrationSelfDestruct}
        syncSnapshot={ctrl.syncSnapshot}
      />
    </div>
  );
};
