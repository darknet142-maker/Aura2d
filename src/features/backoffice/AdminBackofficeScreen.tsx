import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { SUBTLE_ENTRANCE_VARIANTS } from '../../shared/ui/springMotion';
import {
  AdminStudio2Layout,
  AdminClassicBackofficeView,
  TrackEditModal,
} from './index';
import { useAdminNavigationHistory } from './hooks/useAdminNavigationHistory';
import type { ReturnTypeUseDropPlatformController } from '../listener/hooks/useDropPlatformController';

export const AdminBackofficeScreen: React.FC<{ ctrl: ReturnTypeUseDropPlatformController }> = ({ ctrl }) => {
  const [adminLayoutMode, setAdminLayoutMode] = useState<'SAAS_2' | 'CLASSIC'>('SAAS_2');
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
      {adminLayoutMode === 'SAAS_2' ? (
        <AdminStudio2Layout
          ctrl={ctrl}
          adminLayoutMode={adminLayoutMode}
          onToggleLayoutMode={() => setAdminLayoutMode('CLASSIC')}
          nav={nav}
        />
      ) : (
        <motion.main
          variants={SUBTLE_ENTRANCE_VARIANTS}
          initial="initial"
          animate="animate"
          className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 overflow-y-auto overflow-x-hidden flex flex-col gap-3.5"
        >
          <AdminClassicBackofficeView
            ctrl={ctrl}
            onSwitchToSaaSMode={() => setAdminLayoutMode('SAAS_2')}
          />
        </motion.main>
      )}

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
