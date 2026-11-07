import React from 'react';
import type {
  AppNotification,
  EntityDatabase,
  Track,
  AlbumNode,
  UserTrackStat,
  AppUser,
} from './shared/types/domain.types';
export type {
  AppNotification,
  EntityDatabase,
  Track,
  AlbumNode,
  UserTrackStat,
  AppUser,
};
import { AppTopNavigationHeader } from './shared/ui/AppTopNavigationHeader';
import { NotificationSystem } from './shared/ui/NotificationSystem';
import { AuthPortalView } from './features/listener/AuthPortalView';
import { ImmersivePlayerScreen } from './features/listener/ImmersivePlayerScreen';
import { useDropPlatformController } from './features/listener/hooks/useDropPlatformController';
import { AdminBackofficeScreen } from './features/backoffice/AdminBackofficeScreen';

/**
 * Orchestrateur Racine DROP (+241) — Architecture Modulaire par Domaine Métier.
 * Responsabilité unique : Structure globale, moteurs audio persistants et aiguillage entre les vues.
 */
export function App() {
  const ctrl = useDropPlatformController();

  return (
    <div className="relative h-[100dvh] w-full max-w-full bg-[#080A0F] text-[#F8FAFC] overflow-hidden select-none flex flex-col">
      {/* Persistent Background Audio Engines (Never Unmounted) */}
      <audio ref={ctrl.htmlAudioRef} crossOrigin="anonymous" className="hidden" preload="auto" />
      <audio ref={ctrl.uploadPreviewAudioRef} crossOrigin="anonymous" className="hidden" preload="auto" />
      <div
        id="hidden-external-audio-stream"
        className="fixed -top-[9999px] -left-[9999px] w-px h-px opacity-0 pointer-events-none"
      />

      {ctrl.appView === 'PLAYER' && <ImmersivePlayerScreen ctrl={ctrl} />}

      {ctrl.appView !== 'PLAYER' && (
        <AppTopNavigationHeader
          appView={ctrl.appView}
          setAppView={ctrl.setAppView}
          isPlaying={ctrl.isPlaying}
          currentTrack={ctrl.currentTrack}
          unreadNotificationsCount={ctrl.unreadNotificationsCount}
          onOpenNotifications={() => {
            ctrl.setShowNotificationsModal(true);
            ctrl.markAllNotificationsRead();
          }}
          syncSnapshot={ctrl.syncSnapshot}
          isRealtimeConnected={ctrl.isRealtimeConnected}
          isBreakUiMode={ctrl.isBreakUiMode}
          onToggleBreakUiMode={ctrl.handleToggleBreakUiMode}
        />
      )}

      {ctrl.appView === 'AUTH' && (
        <AuthPortalView
          authMode={ctrl.authMode}
          setAuthMode={ctrl.setAuthMode}
          authName={ctrl.authName}
          setAuthName={ctrl.setAuthName}
          authEmail={ctrl.authEmail}
          setAuthEmail={ctrl.setAuthEmail}
          setUserPlan={ctrl.setUserPlan}
          onQuickEnter={ctrl.handleQuickEnter}
        />
      )}

      {ctrl.appView === 'ADMIN' && <AdminBackofficeScreen ctrl={ctrl} />}

      <NotificationSystem
        activeToast={ctrl.activeToast}
        onDismissToast={() => ctrl.setActiveToast(null)}
        showNotificationsModal={ctrl.showNotificationsModal}
        onCloseNotificationsModal={() => ctrl.setShowNotificationsModal(false)}
        notifications={ctrl.visibleNotifications}
        onClearAllNotifications={() => ctrl.setNotifications([])}
        onSelectTrackFromNotification={(tid) => ctrl.setSelectedTrackId(tid)}
        isAdminViewer={ctrl.isAdminViewer}
        notificationPrefs={ctrl.notificationPrefs}
        onChangeNotificationPrefs={ctrl.handleChangeNotificationPrefs}
      />
    </div>
  );
}

export default App;
