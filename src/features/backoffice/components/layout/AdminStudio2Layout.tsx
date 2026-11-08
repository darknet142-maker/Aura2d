import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminSpaceContentRouter } from './AdminSpaceContentRouter';
import { ADMIN_SPACES_REGISTRY, type AdminSpaceId } from '../../types/admin-spaces.types';
import type { ReturnTypeUseDropPlatformController } from '../../../listener/hooks/useDropPlatformController';

export interface AdminStudio2LayoutProps {
  ctrl: ReturnTypeUseDropPlatformController;
  adminLayoutMode: 'SAAS_2' | 'CLASSIC';
  onToggleLayoutMode: () => void;
}

export const AdminStudio2Layout: React.FC<AdminStudio2LayoutProps> = ({
  ctrl, adminLayoutMode, onToggleLayoutMode,
}) => {
  const [currentSpaceId, setCurrentSpaceId] = useState<AdminSpaceId>('00_OVERVIEW');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const currentSpace = ADMIN_SPACES_REGISTRY.find((s) => s.id === currentSpaceId) || ADMIN_SPACES_REGISTRY[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080A0F] text-[#F8FAFC]">
      <AdminSidebar
        currentSpaceId={currentSpaceId}
        onSelectSpace={(s) => setCurrentSpaceId(s)}
        isRealtimeConnected={ctrl.isRealtimeConnected}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <AdminHeader
          currentSpace={currentSpace}
          isRealtimeConnected={ctrl.isRealtimeConnected}
          lastAdminSavedAt={ctrl.lastAdminSavedAt}
          isSavingAdmin={ctrl.isSavingAdmin}
          onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
          adminLayoutMode={adminLayoutMode}
          onToggleLayoutMode={onToggleLayoutMode}
          onExitToPlayer={() => ctrl.setAppView('PLAYER')}
        />

        <main className="flex-1 p-3.5 sm:p-5 overflow-y-auto min-w-0">
          <AdminSpaceContentRouter
            currentSpaceId={currentSpaceId}
            ctrl={ctrl}
            onNavigateToSpace={(s) => setCurrentSpaceId(s)}
          />
        </main>
      </div>
    </div>
  );
};
