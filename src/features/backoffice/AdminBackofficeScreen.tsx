import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SUBTLE_ENTRANCE_VARIANTS } from '../../shared/ui/springMotion';
import {
  AdminStudio2Layout,
  AdminClassicBackofficeView,
  TrackEditModal,
  AdminTrackDrilldownView,
  AdminArtistDrilldownView,
  AdminConsumerUserDrilldownView,
} from './index';
import type { ReturnTypeUseDropPlatformController } from '../listener/hooks/useDropPlatformController';

export const AdminBackofficeScreen: React.FC<{ ctrl: ReturnTypeUseDropPlatformController }> = ({ ctrl }) => {
  const [adminLayoutMode, setAdminLayoutMode] = useState<'SAAS_2' | 'CLASSIC'>('SAAS_2');

  const {
    selectedTrackDetail, setSelectedTrackId, setSelectedArtistName, finalizeListeningSessionOnZap,
    setAlbumIdx, setTrackIdx, setIsDropMode, seekAllEngines, manualSessionRef, setIsPlaying,
    setAppView, setEditingTrack, handleDeleteTrack, selectedArtistAnalytics, artistSubscribers,
    subscribedArtists, handleToggleSubscribeArtist, royaltyLedger, royaltyLedgerState,
    trackRankMap, setSelectedConsumerUserId, selectedConsumerUser, consumerAnalytics, users,
    editingTrack, handleSaveEditedTrack, entityDb, categories,
  } = ctrl;

  if (selectedTrackDetail) {
    return (
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 overflow-y-auto">
        <AdminTrackDrilldownView
          selectedTrackDetail={selectedTrackDetail}
          onClose={() => setSelectedTrackId(null)}
          onSelectArtist={(artist) => {
            setSelectedTrackId(null);
            setSelectedArtistName(artist);
          }}
          onPlayTrackInPlayer={(detail) => {
            finalizeListeningSessionOnZap();
            setAlbumIdx(detail.albumIndex);
            setTrackIdx(detail.trackIndex);
            setIsDropMode(false);
            seekAllEngines(0);
            manualSessionRef.current = {
              trackId: detail.track.id,
              active: true,
              listenedSeconds: 0,
              playCountedAtOneSec: false,
              ecgValidatedAt30Sec: false,
              sessionPointsEarned: 0,
            };
            setIsPlaying(true);
            setAppView('PLAYER');
          }}
          onEditTrack={(editing) => setEditingTrack(editing)}
          onDeleteTrack={handleDeleteTrack}
        />
        <TrackEditModal
          editingTrack={editingTrack}
          setEditingTrack={setEditingTrack}
          entityDb={entityDb}
          categories={categories}
          onSaveEditedTrack={handleSaveEditedTrack}
        />
      </div>
    );
  }

  if (selectedArtistAnalytics) {
    return (
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 overflow-y-auto">
        <AdminArtistDrilldownView
          selectedArtistAnalytics={selectedArtistAnalytics}
          artistSubscribers={artistSubscribers}
          subscribedArtists={subscribedArtists}
          onToggleSubscribeArtist={handleToggleSubscribeArtist}
          royaltyLedger={royaltyLedger}
          royaltySettings={royaltyLedgerState.settings}
          trackRankMap={trackRankMap}
          onClose={() => setSelectedArtistName(null)}
          onSelectTrack={(tid) => {
            setSelectedArtistName(null);
            setSelectedTrackId(tid);
          }}
          onSelectConsumerUser={(uid) => {
            setSelectedArtistName(null);
            setSelectedConsumerUserId(uid);
          }}
        />
        <TrackEditModal
          editingTrack={editingTrack}
          setEditingTrack={setEditingTrack}
          entityDb={entityDb}
          categories={categories}
          onSaveEditedTrack={handleSaveEditedTrack}
        />
      </div>
    );
  }

  if (selectedConsumerUser && consumerAnalytics) {
    return (
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 overflow-y-auto">
        <AdminConsumerUserDrilldownView
          selectedConsumerUser={selectedConsumerUser}
          consumerAnalytics={consumerAnalytics}
          users={users}
          trackRankMap={trackRankMap}
          onClose={() => setSelectedConsumerUserId(null)}
          onSelectTrack={(tid) => {
            setSelectedConsumerUserId(null);
            setSelectedTrackId(tid);
          }}
        />
        <TrackEditModal
          editingTrack={editingTrack}
          setEditingTrack={setEditingTrack}
          entityDb={entityDb}
          categories={categories}
          onSaveEditedTrack={handleSaveEditedTrack}
        />
      </div>
    );
  }

  return (
    <>
      {adminLayoutMode === 'SAAS_2' ? (
        <AdminStudio2Layout
          ctrl={ctrl}
          adminLayoutMode={adminLayoutMode}
          onToggleLayoutMode={() => setAdminLayoutMode('CLASSIC')}
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
        editingTrack={editingTrack}
        setEditingTrack={setEditingTrack}
        entityDb={entityDb}
        categories={categories}
        onSaveEditedTrack={handleSaveEditedTrack}
      />
    </>
  );
};
