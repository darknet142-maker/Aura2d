import React, { useEffect, useRef } from 'react';
import {
  AdminStudio2Layout,
  TrackEditModal,
} from './index';
import { useAdminNavigationHistory } from './hooks/useAdminNavigationHistory';
import type { ReturnTypeUseDropPlatformController } from '../listener/hooks/useDropPlatformController';

export const AdminBackofficeScreen: React.FC<{ ctrl: ReturnTypeUseDropPlatformController }> = ({ ctrl }) => {
  const nav = useAdminNavigationHistory('00_OVERVIEW');
  const isNavigatingRef = useRef(false);

  // Synchronisation descendante : l'historique dicte l'état actif sur le contrôleur
  useEffect(() => {
    isNavigatingRef.current = true;
    if (nav.current.type === 'SPACE') {
      ctrl.setSelectedTrackId(null);
      ctrl.setSelectedArtistName(null);
      ctrl.setSelectedConsumerUserId(null);
    } else if (nav.current.type === 'TRACK_DRILLDOWN') {
      if (ctrl.selectedTrackDetail?.track.id !== nav.current.trackId) {
        ctrl.setSelectedTrackId(nav.current.trackId);
      }
    } else if (nav.current.type === 'ARTIST_DRILLDOWN') {
      if (ctrl.selectedArtistAnalytics?.artistName !== nav.current.artistName) {
        ctrl.setSelectedArtistName(nav.current.artistName);
      }
    } else if (nav.current.type === 'USER_DRILLDOWN') {
      if (ctrl.selectedConsumerUser?.id !== nav.current.userId) {
        ctrl.setSelectedConsumerUserId(nav.current.userId);
      }
    }
    const timer = setTimeout(() => {
      isNavigatingRef.current = false;
    }, 50);
    return () => clearTimeout(timer);
  }, [nav.current]);

  // Synchronisation ascendante sécurisée : protégée contre les rebonds
  useEffect(() => {
    if (isNavigatingRef.current) return;
    if (ctrl.selectedTrackDetail && nav.current.type !== 'TRACK_DRILLDOWN') {
      nav.navigateToTrack(
        ctrl.selectedTrackDetail.track.id,
        ctrl.selectedTrackDetail.track.title,
        nav.activeSpaceId
      );
    }
  }, [ctrl.selectedTrackDetail]);

  useEffect(() => {
    if (isNavigatingRef.current) return;
    if (ctrl.selectedArtistAnalytics && nav.current.type !== 'ARTIST_DRILLDOWN') {
      nav.navigateToArtist(
        ctrl.selectedArtistAnalytics.artistName,
        ctrl.selectedArtistAnalytics.artistName,
        nav.activeSpaceId
      );
    }
  }, [ctrl.selectedArtistAnalytics]);

  useEffect(() => {
    if (isNavigatingRef.current) return;
    if (ctrl.selectedConsumerUser && nav.current.type !== 'USER_DRILLDOWN') {
      nav.navigateToUser(
        ctrl.selectedConsumerUser.id,
        ctrl.selectedConsumerUser.name,
        nav.activeSpaceId
      );
    }
  }, [ctrl.selectedConsumerUser]);

  return (
    <>
      <AdminStudio2Layout
        ctrl={ctrl}
        nav={nav}
      />

      <TrackEditModal
        editingTrack={ctrl.editingTrack}
        setEditingTrack={ctrl.setEditingTrack}
        entityDb={ctrl.entityDb}
        categories={ctrl.categories}
        onSaveEditedTrack={ctrl.handleSaveEditedTrack}
      />
    </>
  );
};
