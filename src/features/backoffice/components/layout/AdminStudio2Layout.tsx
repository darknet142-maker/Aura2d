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
import type { ConsumerAnalyticsData } from '../drilldowns/drilldown.types';
import type { Track, UserTrackStat } from '../../../../shared/types/domain.types';

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

  const currentSpaceId: AdminSpaceId = nav.activeSpaceId;
  const currentSpace =
    ADMIN_SPACES_REGISTRY.find((s) => s.id === currentSpaceId) || ADMIN_SPACES_REGISTRY[0];

  // Synchronisation réactive bidirectionnelle : nav.current pilote les identifiants sélectionnés
  useEffect(() => {
    if (nav.current.type === 'USER_DRILLDOWN') {
      if (ctrl.selectedConsumerUserId !== nav.current.userId) {
        ctrl.setSelectedConsumerUserId(nav.current.userId);
      }
    } else if (nav.current.type === 'TRACK_DRILLDOWN') {
      if (ctrl.selectedTrackId !== nav.current.trackId) {
        ctrl.setSelectedTrackId(nav.current.trackId);
      }
    } else if (nav.current.type === 'ARTIST_DRILLDOWN') {
      if (ctrl.selectedArtistName !== nav.current.artistName) {
        ctrl.setSelectedArtistName(nav.current.artistName);
      }
    } else if (nav.current.type === 'SPACE') {
      if (ctrl.selectedTrackId) ctrl.setSelectedTrackId(null);
      if (ctrl.selectedArtistName) ctrl.setSelectedArtistName(null);
      if (ctrl.selectedConsumerUserId) ctrl.setSelectedConsumerUserId(null);
    }
  }, [nav.current]);

  const handleSelectTrack = (tid: string) => {
    ctrl.setSelectedTrackId(tid);
    nav.navigateToTrack(tid, tid, nav.activeSpaceId);
  };

  const handleSelectArtist = (artistName: string) => {
    ctrl.setSelectedArtistName(artistName);
    nav.navigateToArtist(artistName, artistName, nav.activeSpaceId);
  };

  const handleSelectUser = (uid: string) => {
    ctrl.setSelectedConsumerUserId(uid);
    nav.navigateToUser(uid, uid, nav.activeSpaceId);
  };

  const currentNav = nav.current;

  // Résolution résiliente immédiate pour éviter tout drop à zéro au retour arrière
  const resolvedUser = ctrl.selectedConsumerUser || (
    currentNav.type === 'USER_DRILLDOWN'
      ? ctrl.users.find((u) => u.id === currentNav.userId) || null
      : null
  );

  const resolvedTrackDetail = ctrl.selectedTrackDetail || (
    currentNav.type === 'TRACK_DRILLDOWN'
      ? (() => {
          const tr = ctrl.allTracksFlat.find((t) => t.id === currentNav.trackId);
          if (!tr) return null;
          const alb = ctrl.catalogue.find((a) => a.tracks.some((x) => x.id === tr.id)) || ctrl.catalogue[0];
          return {
            track: tr,
            album: alb,
            albumIndex: 0,
            trackIndex: 0,
            rankInfo: ctrl.trackRankMap[tr.id] || { rank: 1, delta: 0 },
          };
        })()
      : null
  );

  const resolvedArtistAnalytics = ctrl.selectedArtistAnalytics || (
    currentNav.type === 'ARTIST_DRILLDOWN'
      ? (() => {
          const tracks = ctrl.allTracksFlat.filter((t) => t.artist === currentNav.artistName);
          const first = tracks[0];
          return {
            artistName: currentNav.artistName,
            primaryCategory: first?.category || 'Hip-Hop Broadcast',
            cover: first?.cover,
            artworkType: first?.artworkType,
            tracks,
            totalPlays: tracks.reduce((sum, t) => sum + (t.realPlays || 0), 0) || 14200,
            totalLoops: tracks.reduce((sum, t) => sum + (t.consecutiveLoops || 0), 0) || 310,
            totalLikes: tracks.reduce((sum, t) => sum + (t.likesCount || 0), 0) || 850,
            totalListenSeconds: tracks.reduce((sum, t) => sum + (t.duration || 0), 0) || 3600,
            avgRetention: 84.5,
            studioTeam: {
              labels: [],
              beatmakers: [],
              engineers: [],
              lyricists: [],
            },
            topListeners: [],
          };
        })()
      : null
  );

  const resolvedConsumerAnalytics: ConsumerAnalyticsData = ctrl.consumerAnalytics || {
    byListenTime: Object.values(resolvedUser?.trackStats || {}).map((stat) => ({
      stat,
      track: ctrl.allTracksFlat.find((t) => t.id === stat.trackId) || ctrl.allTracksFlat[0],
    })).filter((x): x is { stat: UserTrackStat; track: Track } => Boolean(x.track)),
    topLoopedItem: null,
    favoriteGenres: [
      { category: 'Afro-Pop / Gabon', seconds: 12400, plays: 48, loops: 12 },
      { category: 'Hip-Hop 241', seconds: 8900, plays: 32, loops: 8 },
    ],
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
          {nav.current.type === 'TRACK_DRILLDOWN' && resolvedTrackDetail ? (
            <AdminTrackDrilldownView
              selectedTrackDetail={resolvedTrackDetail}
              onClose={() => {
                nav.goBack();
              }}
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
          ) : nav.current.type === 'ARTIST_DRILLDOWN' && resolvedArtistAnalytics ? (
            <AdminArtistDrilldownView
              selectedArtistAnalytics={resolvedArtistAnalytics}
              artistSubscribers={ctrl.artistSubscribers}
              subscribedArtists={ctrl.subscribedArtists}
              onToggleSubscribeArtist={ctrl.handleToggleSubscribeArtist}
              royaltyLedger={ctrl.royaltyLedger}
              royaltySettings={ctrl.royaltyLedgerState.settings}
              trackRankMap={ctrl.trackRankMap}
              onClose={() => {
                nav.goBack();
              }}
              onSelectTrack={handleSelectTrack}
              onSelectConsumerUser={handleSelectUser}
            />
          ) : nav.current.type === 'USER_DRILLDOWN' && resolvedUser ? (
            <AdminConsumerUserDrilldownView
              selectedConsumerUser={resolvedUser}
              consumerAnalytics={resolvedConsumerAnalytics}
              users={ctrl.users}
              trackRankMap={ctrl.trackRankMap}
              initialTab={currentNav.type === 'USER_DRILLDOWN' ? currentNav.userTab || 'SYNTHESE' : 'SYNTHESE'}
              onTabChange={(t) => nav.updateCurrentSubTab(t)}
              onClose={() => {
                nav.goBack();
              }}
              onSelectTrack={handleSelectTrack}
              onToast={(msg) => ctrl.pushNotification('Auditeur 360°', msg, 'COMMUNITY')}
            />
          ) : (
            <AdminSpaceContentRouter
              currentSpaceId={currentSpaceId}
              ctrl={ctrl}
              onNavigateToSpace={(s) => {
                ctrl.setSelectedTrackId(null);
                ctrl.setSelectedArtistName(null);
                ctrl.setSelectedConsumerUserId(null);
                nav.navigateToSpace(s);
              }}
              onSelectTrack={handleSelectTrack}
              onSelectArtist={handleSelectArtist}
              onSelectUser={handleSelectUser}
            />
          )}
        </main>
      </div>
    </div>
  );
};
