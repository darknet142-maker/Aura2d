import React from 'react';
import {
  CoverArtwork,
} from '../../../components/CoverArtwork';
import {
  ReusableUserProfileSheet,
} from '../../../components/ReusableAnalyticsSheets';
import { SocialRecommendationsFeedView } from '../../social-feed';
import type { ReturnTypeUseImmersivePlayerState } from '../hooks/useImmersivePlayerState';

export const CentralRecosAndArtistsTabs: React.FC<{ state: ReturnTypeUseImmersivePlayerState }> = ({ state }) => {
  const {
    currentTrack, currentTime, isPlaying,
    likedTrackIds, subscribedArtists,
    trackRankMap, users, currentUser,
    userPlan, subscriptionPass, onChangeSubscriptionPass, networkOperator,
    onChangeNetworkOperator, lastEcgValidationMsg,
    onToggleUserPlan, onTogglePlay, onForceStopPlay,
    onToggleLike, onToggleSubscribeArtist,
    hubTab, hubTeamRoleFilter, setHubTeamRoleFilter,
    showToast, openUserTrackSheet, openUserEntitySheet, openUserListenerSheet,
    handlePlayOrToggleSpecificTrack, allTracksFlat, decoupledStudioRankings,
    playlists, handleCreatePlaylist, handleDeletePlaylist, handleToggleTrackInPlaylist,
    socialFeedCtrl, openTrendStudioWithConfig,
  } = state;

  return (
    <>
      {hubTab === 'RECOS' && (
        <SocialRecommendationsFeedView
          feedCtrl={socialFeedCtrl}
          currentUser={{
            id: currentUser?.id || 'u-guest',
            name: currentUser?.name || 'Auditeur DROP (+241)',
            avatar: currentUser?.avatar || 'DR',
          }}
          currentTrack={{
            id: currentTrack.id,
            title: currentTrack.title,
            artist: currentTrack.artist,
            category: currentTrack.category,
            cover: currentTrack.cover,
            artworkType: currentTrack.artworkType,
            bpm: currentTrack.bpm,
          }}
          allTracksFlat={allTracksFlat}
          trackRankMap={trackRankMap}
          onPauseMainPlayer={() => {
            if (isPlaying) {
              if (onForceStopPlay) onForceStopPlay();
              else onTogglePlay();
            }
          }}
          onPlaySpecificTrack={handlePlayOrToggleSpecificTrack}
          onOpenTrackSheet={openUserTrackSheet}
          onOpenEntitySheet={openUserEntitySheet}
          onOpenUserProfile={openUserListenerSheet}
          onOpenCameraStudio={(mode, target) => openTrendStudioWithConfig(mode, target)}
          onToast={showToast}
        />
      )}

      {/* ONGLET 5 : ARTISTES, PAROLIERS & ÉQUIPES STUDIO */}
      {hubTab === 'ARTISTES' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(
              [
                { id: 'ALL', label: 'Tous les Métiers Studio' },
                { id: 'ARTIST', label: 'Artistes & Featurings' },
                { id: 'LYRICIST', label: 'Paroliers (Plumes)' },
                { id: 'BEATMAKER', label: 'Beatmakers' },
                { id: 'ENGINEER', label: 'Ingénieurs du Son' },
                { id: 'LABEL', label: 'Labels' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setHubTeamRoleFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                  hubTeamRoleFilter === f.id
                    ? 'bg-amber-400 text-[#080A0F] font-bold'
                    : 'bg-white/[0.06] text-zinc-300 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {decoupledStudioRankings
              .filter((ent) => hubTeamRoleFilter === 'ALL' || ent.role === hubTeamRoleFilter)
              .map((ent) => (
                <button
                  key={ent.key}
                  type="button"
                  onClick={() => openUserEntitySheet(ent.name, ent.role)}
                  className="relative flex items-center justify-between p-3 rounded-2xl border bg-[#07090E]/90 hover:bg-white/[0.08] border-white/10 text-left transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10">
                      <CoverArtwork
                        artworkType={ent.artworkType}
                        coverUrl={ent.cover}
                        title={ent.name}
                        artist={ent.name}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{ent.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                            ent.role === 'ARTIST'
                              ? 'bg-amber-400/20 text-amber-300'
                              : ent.role === 'LABEL'
                                ? 'bg-[#e11d38]/20 text-rose-300'
                                : ent.role === 'BEATMAKER'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-sky-500/20 text-sky-300'
                          }`}
                        >
                          {ent.role === 'ARTIST'
                            ? 'ARTISTE'
                            : ent.role === 'LABEL'
                              ? 'LABEL'
                              : ent.role === 'BEATMAKER'
                                ? 'BEATMAKER'
                                : ent.role === 'LYRICIST'
                                  ? 'PAROLIER'
                                  : 'INGÉ SON'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A3A9BA] truncate mt-0.5 tabular-nums">
                        {ent.primaryMetricLabel} : {ent.primaryMetricValue} • Score : {ent.decoupledScore} pts
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-300 shrink-0 ml-2">Ouvrir →</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* ONGLET 6 : MON PROFIL & BIBLIOTHÈQUE PERSONNELLE */}
      {hubTab === 'PROFIL' && currentUser && (
        <ReusableUserProfileSheet
          user={currentUser}
          userRank={Math.max(
            1,
            [...users]
              .sort((a, b) => b.totalListenSeconds - a.totalListenSeconds)
              .findIndex((u) => u.id === currentUser.id) + 1
          )}
          isOwnProfile={true}
          userPlan={userPlan}
          onToggleUserPlan={onToggleUserPlan}
          subscriptionPass={subscriptionPass}
          onChangeSubscriptionPass={onChangeSubscriptionPass}
          networkOperator={networkOperator}
          onChangeNetworkOperator={onChangeNetworkOperator}
          lastEcgValidationMsg={lastEcgValidationMsg}
          allTracksFlat={allTracksFlat}
          trackRankMap={trackRankMap}
          currentTrackId={currentTrack.id}
          isPlaying={isPlaying}
          userPlaylists={playlists}
          onCreatePlaylist={handleCreatePlaylist}
          onDeletePlaylist={handleDeletePlaylist}
          onToggleTrackInPlaylist={handleToggleTrackInPlaylist}
          likedTrackIds={likedTrackIds}
          onToggleLike={onToggleLike}
          subscribedArtists={subscribedArtists}
          onToggleSubscribeArtist={onToggleSubscribeArtist}
          onOpenEntityProfile={(name, role) => openUserEntitySheet(name, role)}
          onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
          onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
        />
      )}
    </>
  );
};
