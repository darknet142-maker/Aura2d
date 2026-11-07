import React from 'react';
import { Immersive3DPlayer } from '../../components/Immersive3DPlayer';
import { streamTracker } from '../../services/offlineStreamTracker';
import type { ReturnTypeUseDropPlatformController } from './hooks/useDropPlatformController';

export const ImmersivePlayerScreen: React.FC<{ ctrl: ReturnTypeUseDropPlatformController }> = ({ ctrl }) => {
  const {
    catalogue, safeAlbumIdx, safeTrackIdx, currentTrack, isPlaying, isDropMode, currentTime,
    isShuffle, repeatMode, isCurrentLiked, likedTrackIds, recommendedTrackIds, subscribedArtists,
    artistSubscribers, communityRecommendations, currentRankInfo, trackRankMap, users, currentUser,
    categories, syncSnapshot, masterVolume, eqGains, eqQFactors, eqBypassed, preampDb, effectivePreampDb, eqQFactor,
    autoHeadroom, phaseInvert, spatialConfig, playbackPrefs,
    userPlan, setUserPlan, navigateAlbum,
    handleSelectAlbumIndex, navigateTrack, handleSelectTrackIndex, handleCentralPlayToggle,
    setIsPlaying, handleSeekFromPlayer, setIsShuffle, setRepeatMode, toggleLike,
    handleRecommendTrack, handleToggleSubscribeArtist, handleRecordLyricsOpen,
    handleToggleOfflineDownload, setAppView, unreadNotificationsCount, setShowNotificationsModal,
    markAllNotificationsRead, handleChangeMasterVolume, handleChangeEqBand, handleChangeBandQ,
    handleApplyEqPreset, handleApplyPrecisionPreset,
    handleResetEq, handleToggleEqBypass, handleChangePreampDb, handleChangeEqQFactor,
    handleToggleAutoHeadroom, handleTogglePhaseInvert, handleChangeSpatialConfig, handleChangePlaybackPrefs,
    getAudioSpectrumData, subscriptionPass, setSubscriptionPass, networkOperator, setNetworkOperator,
    lastEcgValidationMsg, handleConfirmCreditHandshake, handleOpenCreditDispute,
    handleResolveCreditDispute, adBanners, adBannerSettings, enableAwardsCeremony,
    royaltyLedger, royaltyLedgerState,
  } = ctrl;

  return (
        <main className="relative z-10 h-full w-full flex items-center justify-center bg-[#080A0F] overflow-hidden">
          <Immersive3DPlayer
            catalogue={catalogue}
            albumIdx={safeAlbumIdx}
            trackIdx={safeTrackIdx}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isDropMode={isDropMode}
            currentTime={currentTime}
            isShuffle={isShuffle}
            repeatMode={repeatMode}
            isCurrentLiked={isCurrentLiked}
            likedTrackIds={likedTrackIds}
            recommendedTrackIds={recommendedTrackIds}
            subscribedArtists={subscribedArtists}
            artistSubscribers={artistSubscribers}
            communityRecommendations={communityRecommendations}
            rankInfo={currentRankInfo}
            currentRankInfo={currentRankInfo}
            trackRankMap={trackRankMap}
            users={users}
            currentUser={currentUser}
            categories={categories}
            syncSnapshot={syncSnapshot}
            masterVolume={masterVolume}
            eqGains={eqGains}
            userPlan={userPlan}
            onToggleUserPlan={() =>
              setUserPlan((prev) => (prev === 'PRO' ? 'BASIC' : 'PRO'))
            }
            onNavigateAlbum={navigateAlbum}
            onSelectAlbumIndex={handleSelectAlbumIndex}
            onNavigateTrack={navigateTrack}
            onSelectTrackIndex={handleSelectTrackIndex}
            onTogglePlay={handleCentralPlayToggle}
            onForceStopPlay={() => setIsPlaying(false)}
            onSeek={handleSeekFromPlayer}
            onToggleShuffle={() => setIsShuffle(!isShuffle)}
            onCycleRepeat={() => setRepeatMode((prev) => (prev + 1) % 3)}
            onToggleLike={(trackId, e) => toggleLike(trackId, e)}
            onRecommendTrack={handleRecommendTrack}
            onToggleSubscribeArtist={handleToggleSubscribeArtist}
            onRecordLyricsOpen={handleRecordLyricsOpen}
            onToggleDownload={() => handleToggleOfflineDownload()}
            onOpenAdminStudio={() => setAppView('ADMIN')}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => {
              setShowNotificationsModal(true);
              markAllNotificationsRead();
            }}
            onToggleOfflineSim={() =>
              streamTracker.setSimulatedOffline(!syncSnapshot.simulatedOffline)
            }
            onChangeMasterVolume={handleChangeMasterVolume}
            onChangeEqBand={handleChangeEqBand}
            onChangeBandQ={handleChangeBandQ}
            onApplyEqPreset={handleApplyEqPreset}
            onApplyPrecisionPreset={handleApplyPrecisionPreset}
            onResetEq={handleResetEq}
            eqQFactors={eqQFactors}
            eqBypassed={eqBypassed}
            preampDb={preampDb}
            effectivePreampDb={effectivePreampDb}
            eqQFactor={eqQFactor}
            autoHeadroom={autoHeadroom}
            phaseInvert={phaseInvert}
            spatialConfig={spatialConfig}
            playbackPrefs={playbackPrefs}
            onToggleEqBypass={handleToggleEqBypass}
            onChangePreampDb={handleChangePreampDb}
            onChangeEqQFactor={handleChangeEqQFactor}
            onToggleAutoHeadroom={handleToggleAutoHeadroom}
            onTogglePhaseInvert={handleTogglePhaseInvert}
            onChangeSpatialConfig={handleChangeSpatialConfig}
            onChangePlaybackPrefs={handleChangePlaybackPrefs}
            getAudioSpectrumData={getAudioSpectrumData}
            subscriptionPass={subscriptionPass}
            onChangeSubscriptionPass={setSubscriptionPass}
            networkOperator={networkOperator}
            onChangeNetworkOperator={setNetworkOperator}
            lastEcgValidationMsg={lastEcgValidationMsg}
            onConfirmCreditHandshake={handleConfirmCreditHandshake}
            onOpenCreditDispute={handleOpenCreditDispute}
            onResolveCreditDispute={handleResolveCreditDispute}
            adBanners={adBanners}
            adBannerSettings={adBannerSettings}
            enableAwardsCeremony={enableAwardsCeremony}
            rightsLines={royaltyLedger.rightsLines}
            payoutStatements={royaltyLedger.statements}
            royaltySettings={royaltyLedgerState.settings}
          />
        </main>
  );
};
