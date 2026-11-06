import React from 'react';
import { Columns2, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'motion/react';
import {
  SynchronizedMiniPlayer,
  ReusableTrackDetailSheet,
  ReusableArtistDetailSheet,
  ReusableUserProfileSheet,
} from './ReusableAnalyticsSheets';
import { DropTrendMagazineStudio } from './DropTrendMagazineStudio';
import { PlayerHeader } from './player/PlayerHeader';
import { PlayerCoverFlow } from './player/PlayerCoverFlow';
import { PlayerLyricsPanel } from './player/PlayerLyricsPanel';
import { PlayerMetadataBar } from './player/PlayerMetadataBar';
import { PlayerPlaybackDock } from './player/PlayerPlaybackDock';
import { EqualizerModal } from './player/modals/EqualizerModal';
import { PlaylistModal } from './player/modals/PlaylistModal';
import { QueueModal } from './player/modals/QueueModal';
import { OptionsMenuModal } from './player/modals/OptionsMenuModal';
import { RecommendModal } from './player/modals/RecommendModal';
import {
  formatTime,
  formatCompactPlays,
  type Immersive3DPlayerProps,
} from './player/playerEngineHelpers';
export {
  EQ_PRESETS,
  type LyricLine,
  type PlayerTrackItem,
  type PlayerAlbumNode,
  type EqPreset,
  type Immersive3DPlayerProps,
} from './player/playerEngineHelpers';
import { useImmersivePlayerState } from '../features/listener/hooks/useImmersivePlayerState';
import { CentralHubWorkspace } from '../features/listener/central/CentralHubWorkspace';
import { SPRING_SNAPPY } from '../shared/ui/springMotion';

export const Immersive3DPlayer: React.FC<Immersive3DPlayerProps> = (props) => {
  const state = useImmersivePlayerState(props);
  const {
    catalogue,
    albumIdx,
    trackIdx,
    currentTrack,
    currentTime,
    isPlaying,
    isDropMode,
    isShuffle,
    repeatMode,
    isCurrentLiked,
    likedTrackIds,
    recommendedTrackIds,
    subscribedArtists,
    artistSubscribers,
    communityRecommendations,
    trackRankMap,
    currentUser,
    masterVolume,
    eqGains,
    userPlan,
    onToggleUserPlan,
    onTogglePlay,
    onForceStopPlay,
    onNavigateAlbum,
    onSelectAlbumIndex,
    onNavigateTrack,
    onSelectTrackIndex,
    onSeek,
    onToggleShuffle,
    onCycleRepeat,
    onToggleLike,
    onRecommendTrack,
    onToggleSubscribeArtist,
    onRecordLyricsOpen,
    onToggleDownload,
    onChangeMasterVolume,
    onChangeEqBand,
    onApplyEqPreset,
    onResetEq,
    eqBypassed,
    preampDb,
    eqQFactor,
    onToggleEqBypass,
    onChangePreampDb,
    onChangeEqQFactor,
    getAudioSpectrumData,
    onOpenAdminStudio,
    subscriptionPass,
    onChangeSubscriptionPass,
    networkOperator,
    onChangeNetworkOperator,
    lastEcgValidationMsg,
    onConfirmCreditHandshake,
    onOpenCreditDispute,
    onResolveCreditDispute,
    unreadNotificationsCount,
    onOpenNotifications,
    rightsLines,
    payoutStatements,
    royaltySettings,
    safeRankInfo,
    isPro,
    fullBleed,
    setFullBleed,
    desktopSplitMode,
    setDesktopSplitMode,
    lyricsOpen,
    setLyricsOpen,
    activeModal,
    setActiveModal,
    showTrendStudioModal,
    setShowTrendStudioModal,
    setHubTab,
    toastMsg,
    toastDotColor,
    showToast,
    notifyProRequired,
    openUserTrackSheet,
    openUserEntitySheet,
    openUserListenerSheet,
    closeAllAnalyticsSheets,
    handlePlayOrToggleSpecificTrack,
    allTracksFlat,
    activeTrackSheetData,
    activeEntitySheetData,
    activeUserSheetData,
    playlists,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleToggleTrackInPlaylist,
    isEqCustomOrActive,
    currentAlbum,
    activeLyricIdx,
    hasOpenAnalyticsSheet,
    currentTrackCert,
    currentArtistSubscribed,
    currentArtistSubscribersCount,
    currentRecsCount,
    isCurrentRecommended,
    currentLyricist,
  } = state;

  return (
    <div className="relative h-[100dvh] w-screen bg-[#080A0F] flex items-center justify-center overflow-hidden">
      {/* Commutateur Architectural Bureau : Station Studio Split 2D vs Scène Focus */}
      <div className="hidden lg:flex fixed top-3.5 right-5 z-50 items-center gap-2">
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={SPRING_SNAPPY}
          onClick={() => {
            const nextSplit = !desktopSplitMode;
            setDesktopSplitMode(nextSplit);
            if (nextSplit && activeModal === 'MINI') {
              setActiveModal('NONE');
            }
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold border backdrop-blur-xl shadow-lg cursor-pointer ${
            desktopSplitMode
              ? 'bg-amber-400 text-[#080A0F] border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
              : 'bg-[#0C0F17]/90 hover:bg-[#131824] text-[#F8FAFC] border-white/15'
          }`}
          title="Basculer entre la Station Studio Split-Deck (Platine + Console Central) et la vue Platine seule"
        >
          <Columns2 className="w-3.5 h-3.5 shrink-0" />
          <span>{desktopSplitMode ? 'Station Studio 2D : Active' : 'Activer Station Studio 2D'}</span>
        </motion.button>

        {!desktopSplitMode && (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={SPRING_SNAPPY}
            onClick={() => setFullBleed(!fullBleed)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0C0F17]/90 hover:bg-[#131824] text-xs font-semibold text-[#CBD5E1] border border-white/15 backdrop-blur-xl shadow-lg cursor-pointer"
            title="Basculer l'affichage plein écran"
          >
            {fullBleed ? (
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{fullBleed ? 'Format Platine 9:16' : 'Scène Plein Écran'}</span>
          </motion.button>
        )}
      </div>

      {/* CONTENEUR ARCHITECTURAL ADAPTATIF : MOBILE 100dvh OU STATION STUDIO SPLIT-DECK SUR DESKTOP */}
      <div
        className={
          desktopSplitMode
            ? 'w-full h-full lg:max-w-[1460px] lg:h-[94dvh] lg:px-6 flex items-center justify-center lg:gap-5'
            : 'w-full h-full flex items-center justify-center'
        }
      >
        {/* DECK GAUCHE / PLATINE PRINCIPALE 3D DROP */}
        <main
          id="app-viewport"
          className={`${!desktopSplitMode && fullBleed ? 'full-bleed' : ''} ${
            desktopSplitMode ? 'lg:shrink-0 lg:w-[435px] xl:w-[450px] lg:h-full' : ''
          }`}
        >
          <div className="ambient-bg" />
          <div className="ambient-vignette" />

          {/* Notification Toast Interactive */}
          <div
            className={`pointer-events-none fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[#0C0F17]/95 border border-white/20 text-[#F8FAFC] text-xs font-medium shadow-2xl flex items-center gap-2.5 transition-all duration-200 backdrop-blur-xl whitespace-nowrap ${
              toastMsg ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
            }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${toastDotColor}`} />
            <span>{toastMsg || 'Action effectuée'}</span>
          </div>

          {/* 1. EN-TÊTE STUDIO & TÉLÉMÉTRIE MATÉRIELLE 2D */}
          <PlayerHeader
            onOpenCentral={() => setActiveModal('MINI')}
            onOpenQueue={() => setActiveModal('QUEUE')}
            onOpenOptions={() => setActiveModal('OPTIONS')}
            onOpenNotifications={onOpenNotifications}
            unreadNotificationsCount={unreadNotificationsCount}
            albumIdx={albumIdx}
            albumsTotal={catalogue.length}
            trackIdx={trackIdx}
            tracksTotal={currentAlbum?.tracks.length || 1}
            lufsLevel={currentTrack.lufsMasterLevel ?? -14.0}
          />

          {/* 2. CARROUSEL 3D COVERFLOW & PAROLES SYNCHRONISÉES */}
          <PlayerCoverFlow
            catalogue={catalogue}
            albumIdx={albumIdx}
            trackIdx={trackIdx}
            currentTrack={currentTrack}
            onNavigateAlbum={onNavigateAlbum}
            onSelectAlbumIndex={onSelectAlbumIndex}
            onNavigateTrack={onNavigateTrack}
            onSelectTrackIndex={onSelectTrackIndex}
            onOpenActiveTrackSheet={() => openUserTrackSheet(currentTrack.id)}
            onToast={showToast}
          >
            <PlayerLyricsPanel
              isOpen={lyricsOpen}
              isPro={isPro}
              currentTrack={currentTrack}
              currentTime={currentTime}
              activeLyricIdx={activeLyricIdx}
              currentLyricist={currentLyricist}
              onClose={() => setLyricsOpen(false)}
              onSeek={onSeek}
              onOpenLyricistProfile={(lyricist) => openUserEntitySheet(lyricist, 'LYRICIST')}
              onShareExcerpt={(cleanExcerpt) => {
                onRecommendTrack?.(currentTrack.id, cleanExcerpt, true);
                showToast(
                  `Extrait partagé dans le Fil DROP (+Score Parolier : ${currentLyricist})`,
                  'bg-sky-400'
                );
              }}
              formatTime={formatTime}
            />
          </PlayerCoverFlow>

          {/* 3. MÉTADONNÉES, BOUTON CUE [DROP] & SCRUBBER */}
          <PlayerMetadataBar
            currentTrack={currentTrack}
            currentTrackCert={currentTrackCert}
            isPro={isPro}
            currentArtistSubscribed={currentArtistSubscribed}
            currentArtistSubscribersCount={currentArtistSubscribersCount}
            onToggleSubscribeArtist={onToggleSubscribeArtist}
            isCurrentRecommended={isCurrentRecommended}
            currentRecsCount={currentRecsCount}
            onOpenRecommendModal={() => setActiveModal('RECOMMEND')}
            isCurrentLiked={isCurrentLiked}
            onToggleLike={(e) => onToggleLike(currentTrack.id, e)}
            onOpenTrackSheet={() => openUserTrackSheet(currentTrack.id)}
            onOpenArtistProfile={() => openUserEntitySheet(currentTrack.artist, 'ARTIST')}
            onOpenEntityProfile={(name, role) => openUserEntitySheet(name, role)}
            safeRankInfo={safeRankInfo}
            isDropMode={isDropMode}
            currentTime={currentTime}
            onSeek={onSeek}
            formatTime={formatTime}
            formatCompactPlays={formatCompactPlays}
            onToast={showToast}
          />

          {/* 4. DOCK DE CONTRÔLE GLASSMORPHIQUE & REC TREND 30S */}
          <PlayerPlaybackDock
            isPlaying={isPlaying}
            isDropMode={isDropMode}
            isShuffle={isShuffle}
            repeatMode={repeatMode}
            onTogglePlay={onTogglePlay}
            onNavigateTrack={onNavigateTrack}
            onToggleShuffle={onToggleShuffle}
            onCycleRepeat={onCycleRepeat}
            onToast={showToast}
            isPro={isPro}
            lyricsOpen={lyricsOpen}
            onToggleLyrics={() => {
              const nextOpen = !lyricsOpen;
              setLyricsOpen(nextOpen);
              if (nextOpen) {
                onRecordLyricsOpen?.(currentTrack.id);
              }
            }}
            onOpenPlaylistModal={() => setActiveModal('PLAYLIST')}
            onOpenTrendStudio={() => setShowTrendStudioModal(true)}
            isTrendStudioOpen={showTrendStudioModal}
            onOpenEqModal={() => setActiveModal('EQ')}
            isEqCustomOrActive={isEqCustomOrActive}
            isDownloadedOffline={Boolean(currentTrack.downloadedOffline)}
            onToggleDownload={() => onToggleDownload(currentTrack.id)}
            onNotifyProRequired={notifyProRequired}
          />

          {/* 5. PIED DE PAGE STUDIO */}
          <footer className="relative z-20 pb-2 pt-0.5 text-center shrink-0">
            <p className="text-[9px] font-mono text-[#A3A9BA]/70 tracking-tight truncate px-4">
              {currentTrack.copyrightText ||
                `© 2026 ${currentTrack.labelName} • Master Certifié BUGADA (+241)`}
            </p>
          </footer>

          {/* MODALES DÉCOUPLÉES */}
          <RecommendModal
            isOpen={activeModal === 'RECOMMEND'}
            currentTrack={currentTrack}
            currentTrackCert={currentTrackCert}
            currentRecsCount={currentRecsCount}
            communityRecommendationsCount={communityRecommendations.length}
            onClose={() => setActiveModal('NONE')}
            onOpenTrendStudio={() => {
              setActiveModal('NONE');
              setShowTrendStudioModal(true);
            }}
            onPublishRecommendation={(note) => {
              onRecommendTrack?.(currentTrack.id, note, false);
              if (!desktopSplitMode) setActiveModal('MINI');
              setHubTab('RECOS');
              showToast('Recommandation publiée dans le Fil Commun DROP !', 'bg-amber-400');
            }}
            onViewFeed={() => {
              if (!desktopSplitMode) setActiveModal('MINI');
              setHubTab('RECOS');
            }}
            onOpenTrackSheet={() => openUserTrackSheet(currentTrack.id)}
            onOpenArtistProfile={() => openUserEntitySheet(currentTrack.artist, 'ARTIST')}
          />

          <PlaylistModal
            isOpen={activeModal === 'PLAYLIST'}
            currentTrackId={currentTrack.id}
            playlists={playlists}
            onClose={() => setActiveModal('NONE')}
            onToggleTrackInPlaylist={handleToggleTrackInPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
          />

          <EqualizerModal
            isOpen={activeModal === 'EQ'}
            isPro={isPro}
            isPlaying={isPlaying}
            eqGains={eqGains}
            eqBypassed={eqBypassed}
            preampDb={preampDb}
            eqQFactor={eqQFactor}
            masterVolume={masterVolume}
            onClose={() => setActiveModal('NONE')}
            onResetEq={onResetEq}
            onApplyEqPreset={onApplyEqPreset}
            onChangeEqBand={onChangeEqBand}
            onToggleEqBypass={onToggleEqBypass}
            onChangePreampDb={onChangePreampDb}
            onChangeEqQFactor={onChangeEqQFactor}
            onChangeMasterVolume={onChangeMasterVolume}
            getAudioSpectrumData={getAudioSpectrumData}
            onToast={showToast}
          />

          <QueueModal
            isOpen={activeModal === 'QUEUE'}
            catalogue={catalogue}
            albumIdx={albumIdx}
            trackIdx={trackIdx}
            isPlaying={isPlaying}
            onClose={() => setActiveModal('NONE')}
            onSelectTrack={handlePlayOrToggleSpecificTrack}
            onOpenTrackSheet={openUserTrackSheet}
            onOpenArtistProfile={(art) => openUserEntitySheet(art, 'ARTIST')}
            formatCompactPlays={formatCompactPlays}
            formatTime={formatTime}
          />

          <OptionsMenuModal
            isOpen={activeModal === 'OPTIONS'}
            isPro={isPro}
            masterVolume={masterVolume}
            currentTrackId={currentTrack.id}
            currentArtist={currentTrack.artist}
            currentLyricist={currentLyricist}
            onClose={() => setActiveModal('NONE')}
            onToggleUserPlan={onToggleUserPlan}
            onChangeMasterVolume={onChangeMasterVolume}
            onOpenTrackSheet={openUserTrackSheet}
            onOpenArtistProfile={(art) => openUserEntitySheet(art, 'ARTIST')}
            onOpenLyricistProfile={(lyr) => openUserEntitySheet(lyr, 'LYRICIST')}
            onOpenAdminStudio={onOpenAdminStudio}
            onNotifyProRequired={notifyProRequired}
            onToast={showToast}
          />

          {/* TIROIR CENTRAL SUR MOBILE / TABLETTE (OU DESKTOP HORS MODE SPLIT) */}
          {activeModal === 'MINI' && (
            <div className={desktopSplitMode ? 'lg:hidden' : ''}>
              <CentralHubWorkspace state={state} isEmbeddedDesktopConsole={false} />
            </div>
          )}

          {/* OVERLAY ANALYTIQUE DIRECT (SUR MOBILE OU HORS SPLIT DESKTOP) */}
          {activeModal === 'NONE' && hasOpenAnalyticsSheet && (
            <div
              className={`absolute inset-0 z-40 bg-[#080A0F]/96 backdrop-blur-2xl flex flex-col justify-between p-3.5 sm:p-5 animate-fade-in overflow-hidden ${
                desktopSplitMode ? 'lg:hidden' : ''
              }`}
            >
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {activeTrackSheetData ? (
                  <ReusableTrackDetailSheet
                    track={activeTrackSheetData.track}
                    album={activeTrackSheetData.album}
                    albumIndex={activeTrackSheetData.albumIndex}
                    trackIndex={activeTrackSheetData.trackIndex}
                    rankInfo={activeTrackSheetData.rankInfo}
                    isCurrentTrack={activeTrackSheetData.track.id === currentTrack.id}
                    isPlaying={isPlaying}
                    isLiked={!!likedTrackIds[activeTrackSheetData.track.id]}
                    isRecommended={!!recommendedTrackIds[activeTrackSheetData.track.id]}
                    isArtistSubscribed={
                      !!subscribedArtists[activeTrackSheetData.track.artist] ||
                      !!subscribedArtists[activeTrackSheetData.track.artist.toLowerCase()]
                    }
                    artistSubscribersCount={
                      artistSubscribers[activeTrackSheetData.track.artist] ??
                      artistSubscribers[activeTrackSheetData.track.artist.toLowerCase()]
                    }
                    isAdminView={false}
                    onClose={closeAllAnalyticsSheets}
                    onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                    onToggleLike={onToggleLike}
                    onRecommendTrack={(tId) => {
                      onRecommendTrack?.(tId, 'Recommandé depuis la fiche analytique du titre', false);
                      showToast('Titre recommandé dans le Fil Commun DROP !');
                    }}
                    onToggleSubscribeArtist={(artName) => onToggleSubscribeArtist?.(artName)}
                    onOpenEntityProfile={(name, role) => openUserEntitySheet(name, role)}
                    onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
                    onOpenEqModal={() => {
                      closeAllAnalyticsSheets();
                      setActiveModal('EQ');
                    }}
                    onOpenTrendStudio={() => {
                      closeAllAnalyticsSheets();
                      setShowTrendStudioModal(true);
                    }}
                    onConfirmCreditHandshake={onConfirmCreditHandshake}
                    onOpenCreditDispute={onOpenCreditDispute}
                    onResolveCreditDispute={onResolveCreditDispute}
                  />
                ) : activeEntitySheetData ? (
                  <ReusableArtistDetailSheet
                    analytics={activeEntitySheetData}
                    trackRankMap={trackRankMap}
                    currentTrackId={currentTrack.id}
                    isPlaying={isPlaying}
                    rightsLines={rightsLines}
                    payoutStatement={payoutStatements.find(
                      (s) =>
                        s.holderName.trim().toLowerCase() ===
                        activeEntitySheetData.entityName.trim().toLowerCase()
                    )}
                    royaltySettings={royaltySettings}
                    onClose={closeAllAnalyticsSheets}
                    onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
                    onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                    onOpenEntityProfile={(name, role) => openUserEntitySheet(name, role)}
                    onOpenUserProfile={(uId) => openUserListenerSheet(uId)}
                    onToggleSubscribeArtist={(artName) => onToggleSubscribeArtist?.(artName)}
                  />
                ) : activeUserSheetData ? (
                  <ReusableUserProfileSheet
                    user={activeUserSheetData.user}
                    userRank={activeUserSheetData.rank}
                    isOwnProfile={currentUser?.id === activeUserSheetData.user.id}
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
                    onClose={closeAllAnalyticsSheets}
                    onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
                    onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                  />
                ) : null}
              </div>
              <div className="pt-2.5 shrink-0">
                <SynchronizedMiniPlayer
                  currentTrack={currentTrack}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  isDropMode={isDropMode}
                  rankInfo={safeRankInfo}
                  onTogglePlay={onTogglePlay}
                  onNavigateTrack={onNavigateTrack}
                  onExpandPlayer={closeAllAnalyticsSheets}
                  onOpenTrackSheet={() => openUserTrackSheet(currentTrack.id)}
                  onOpenArtistProfile={() => openUserEntitySheet(currentTrack.artist, 'ARTIST')}
                />
              </div>
            </div>
          )}
        </main>

        {/* DECK DROIT (STATION STUDIO DESKTOP >= 1024px) : CONSOLE CENTRAL EN DIRECT */}
        {desktopSplitMode && (
          <aside
            aria-label="Console Central Studio"
            className="hidden lg:flex flex-1 min-w-0 h-full"
          >
            <CentralHubWorkspace state={state} isEmbeddedDesktopConsole={true} />
          </aside>
        )}
      </div>

      {/* STUDIO TREND VIDÉO 30S (1080×1920 FULL HD) */}
      <DropTrendMagazineStudio
        track={{
          id: currentTrack.id,
          title: currentTrack.title,
          artist: currentTrack.artist,
          featuring: currentTrack.featuringArtists,
          featuringSplitMode: currentTrack.featuringSplitMode,
          album: currentTrack.album,
          category: currentTrack.category,
          labelName: currentTrack.labelName,
          copyrightText: currentTrack.copyrightText,
          beatmakerName: currentTrack.beatmakerName || 'Beatmaker',
          soundEngineerName: currentTrack.soundEngineerName || 'Ingénieur du son',
          lyricistName: currentTrack.lyricistName,
          isInstrumental: currentTrack.isInstrumental,
          audioCodec: currentTrack.audioCodec || 'OPUS',
          audioUrl: currentTrack.audioUrl,
          cover: currentTrack.cover,
          artworkType: currentTrack.artworkType,
          ambientPrimary: currentTrack.ambientPrimary || '#e11d38',
          ambientSecondary: currentTrack.ambientSecondary || '#f59e0b',
          duration: currentTrack.duration,
          dropStart: currentTrack.dropStart,
          dropDuration: currentTrack.dropDuration,
          bpm: currentTrack.bpm || 124,
          synthNotes: currentTrack.synthNotes || [110, 146.83, 164.81, 196, 220],
          realPlays: currentTrack.realPlays,
          lastActivityAgo: currentTrack.lastActivityAgo,
          totalListenSeconds: currentTrack.totalListenSeconds || 0,
          listenSessions: currentTrack.listenSessions || 0,
          avgRetentionPct: currentTrack.avgRetentionPct || 85,
          algoPoints: currentTrack.algoPoints || 0,
          likesCount: currentTrack.likesCount || 0,
          loopPlaysCount: currentTrack.loopPlaysCount || 0,
          longevityDays: currentTrack.longevityDays || 1,
          consecutiveLoops: currentTrack.consecutiveLoops || 0,
          baselineRank: currentTrack.baselineRank || 1,
        }}
        isOpen={showTrendStudioModal}
        onClose={() => setShowTrendStudioModal(false)}
        onPauseMainPlayer={() => {
          if (isPlaying) {
            onForceStopPlay ? onForceStopPlay() : onTogglePlay();
          }
        }}
      />
    </div>
  );
};
