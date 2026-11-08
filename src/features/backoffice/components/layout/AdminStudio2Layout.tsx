import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminSpaceContentRouter } from './AdminSpaceContentRouter';
import { AdminTrackDrilldownView } from '../drilldowns/AdminTrackDrilldownView';
import { AdminArtistDrilldownView } from '../drilldowns/AdminArtistDrilldownView';
import { AdminConsumerUserDrilldownView } from '../drilldowns/AdminConsumerUserDrilldownView';
import { ADMIN_SPACES_REGISTRY, type AdminSpaceId } from '../../types/admin-spaces.types';
import type { UseAdminNavigationHistoryReturn } from '../../hooks/useAdminNavigationHistory';
import type { ReturnTypeUseDropPlatformController } from '../../../listener/hooks/useDropPlatformController';

export interface AdminStudio2LayoutProps {
  ctrl: ReturnTypeUseDropPlatformController;
  adminLayoutMode: 'SAAS_2' | 'CLASSIC';
  onToggleLayoutMode: () => void;
  nav: UseAdminNavigationHistoryReturn;
}

export const AdminStudio2Layout: React.FC<AdminStudio2LayoutProps> = ({
  ctrl, adminLayoutMode, onToggleLayoutMode, nav,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const currentSpaceId: AdminSpaceId =
    nav.current.type === 'SPACE' ? nav.current.spaceId : '01_CATALOGUE';
  const currentSpace =
    ADMIN_SPACES_REGISTRY.find((s) => s.id === currentSpaceId) || ADMIN_SPACES_REGISTRY[0];

  const handleSelectTrack = (tid: string) => {
    ctrl.setSelectedArtistName(null);
    ctrl.setSelectedConsumerUserId(null);
    ctrl.setSelectedTrackId(tid);
    nav.navigate({ type: 'TRACK_DRILLDOWN', trackId: tid, label: tid });
  };

  const handleSelectArtist = (artistName: string) => {
    ctrl.setSelectedTrackId(null);
    ctrl.setSelectedConsumerUserId(null);
    ctrl.setSelectedArtistName(artistName);
    nav.navigate({ type: 'ARTIST_DRILLDOWN', artistName, label: artistName });
  };

  const handleSelectUser = (uid: string) => {
    ctrl.setSelectedTrackId(null);
    ctrl.setSelectedArtistName(null);
    ctrl.setSelectedConsumerUserId(uid);
    nav.navigate({ type: 'USER_DRILLDOWN', userId: uid, label: uid });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080A0F] text-[#F8FAFC]">
      <AdminSidebar
        currentSpaceId={currentSpaceId}
        onSelectSpace={(s) => {
          ctrl.setSelectedTrackId(null);
          ctrl.setSelectedArtistName(null);
          ctrl.setSelectedConsumerUserId(null);
          nav.navigate({ type: 'SPACE', spaceId: s });
        }}
        isRealtimeConnected={ctrl.isRealtimeConnected}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <AdminHeader
          currentSpace={currentSpace}
          subSection={nav.current.type !== 'SPACE' ? nav.current.label : undefined}
          isRealtimeConnected={ctrl.isRealtimeConnected}
          lastAdminSavedAt={ctrl.lastAdminSavedAt}
          isSavingAdmin={ctrl.isSavingAdmin}
          onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
          adminLayoutMode={adminLayoutMode}
          onToggleLayoutMode={onToggleLayoutMode}
          onExitToPlayer={() => ctrl.setAppView('PLAYER')}
          canGoBack={nav.canGoBack}
          previousLabel={nav.previousLabel}
          onGoBack={() => {
            nav.goBack();
          }}
        />

        <main className="flex-1 p-3.5 sm:p-5 overflow-y-auto min-w-0">
          {nav.current.type === 'TRACK_DRILLDOWN' && ctrl.selectedTrackDetail ? (
            <AdminTrackDrilldownView
              selectedTrackDetail={ctrl.selectedTrackDetail}
              onClose={nav.goBack}
              onSelectArtist={handleSelectArtist}
              onPlayTrackInPlayer={(detail) => {
                ctrl.finalizeListeningSessionOnZap();
                ctrl.setAlbumIdx(detail.albumIndex);
                ctrl.setTrackIdx(detail.trackIndex);
                ctrl.setIsDropMode(false);
                ctrl.seekAllEngines(0);
                ctrl.setIsPlaying(true);
                ctrl.setAppView('PLAYER');
              }}
              onEditTrack={(editing) => ctrl.setEditingTrack(editing)}
              onDeleteTrack={ctrl.handleDeleteTrack}
            />
          ) : nav.current.type === 'ARTIST_DRILLDOWN' && ctrl.selectedArtistAnalytics ? (
            <AdminArtistDrilldownView
              selectedArtistAnalytics={ctrl.selectedArtistAnalytics}
              artistSubscribers={ctrl.artistSubscribers}
              subscribedArtists={ctrl.subscribedArtists}
              onToggleSubscribeArtist={ctrl.handleToggleSubscribeArtist}
              royaltyLedger={ctrl.royaltyLedger}
              royaltySettings={ctrl.royaltyLedgerState.settings}
              trackRankMap={ctrl.trackRankMap}
              onClose={nav.goBack}
              onSelectTrack={handleSelectTrack}
              onSelectConsumerUser={handleSelectUser}
            />
          ) : nav.current.type === 'USER_DRILLDOWN' && ctrl.selectedConsumerUser && ctrl.consumerAnalytics ? (
            <AdminConsumerUserDrilldownView
              selectedConsumerUser={ctrl.selectedConsumerUser}
              consumerAnalytics={ctrl.consumerAnalytics}
              users={ctrl.users}
              trackRankMap={ctrl.trackRankMap}
              onClose={nav.goBack}
              onSelectTrack={handleSelectTrack}
            />
          ) : (
            <AdminSpaceContentRouter
              currentSpaceId={currentSpaceId}
              ctrl={ctrl}
              onNavigateToSpace={(s) => {
                ctrl.setSelectedTrackId(null);
                ctrl.setSelectedArtistName(null);
                ctrl.setSelectedConsumerUserId(null);
                nav.navigate({ type: 'SPACE', spaceId: s });
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};
