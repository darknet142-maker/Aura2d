import React, { useState } from 'react';
import { Immersive3DPlayer } from '../../components/Immersive3DPlayer';
import { streamTracker } from '../../services/offlineStreamTracker';
import { QrDownloadModal } from '../downloads';
import {
  SponsoredTrackBanner,
  SponsoredMissionsModal,
  UserTokenWalletModal,
  getSponsorCampaigns,
  hasUserCompletedCampaign,
} from '../tokens';
import type { ReturnTypeUseDropPlatformController } from './hooks/useDropPlatformController';

export const ImmersivePlayerScreen: React.FC<{ ctrl: ReturnTypeUseDropPlatformController }> = ({ ctrl }) => {
  const [isMissionsModalOpen, setIsMissionsModalOpen] = useState(false);
  const [isTokenWalletOpen, setIsTokenWalletOpen] = useState(false);
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

  const activeCampaigns = getSponsorCampaigns('ACTIVE');
  const currentCampaign = activeCampaigns.find(
    (c) =>
      c.targetTrackId === currentTrack.id ||
      (c.targetArtistName &&
        c.targetArtistName.toLowerCase() === currentTrack.artist.toLowerCase())
  ) || null;
  const isCompleted = currentCampaign
    ? hasUserCompletedCampaign(currentUser?.id || 'usr-default', currentCampaign.id)
    : false;

  return (
        <main className="relative z-10 h-full w-full flex items-center justify-center bg-[#080A0F] overflow-hidden">
          {currentCampaign && (
            <div className="absolute top-16 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-30">
              <SponsoredTrackBanner
                campaign={currentCampaign}
                listenedSec={Math.floor(currentTime)}
                isCompleted={isCompleted}
                onOpenMissionsModal={() => setIsMissionsModalOpen(true)}
                onOpenWalletModal={() => setIsTokenWalletOpen(true)}
              />
            </div>
          )}

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
            onApplySocialPoints={ctrl.handleApplySocialPointsDelta}
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

          <QrDownloadModal
            isOpen={ctrl.isQrDownloadModalOpen}
            onClose={() => ctrl.setIsQrDownloadModalOpen(false)}
            track={currentTrack}
            currentUserId={currentUser?.id || 'usr-default'}
            onDownloadConfirmed={(ticket) => {
              ctrl.handleDownloadConfirmedByQr(ticket);
              ctrl.setIsQrDownloadModalOpen(false);
            }}
            onToast={(msg, color) => {
              ctrl.pushNotification('Téléchargement QR', msg, color?.includes('rose') ? 'COMMUNITY' : 'CERTIFICATION');
            }}
          />

          <SponsoredMissionsModal
            isOpen={isMissionsModalOpen}
            userId={currentUser?.id || 'usr-default'}
            onClose={() => setIsMissionsModalOpen(false)}
            onPlayTrackById={(targetTrackId) => {
              if (!targetTrackId) return;
              for (let aIdx = 0; aIdx < catalogue.length; aIdx++) {
                const tIdx = catalogue[aIdx].tracks.findIndex((t) => t.id === targetTrackId);
                if (tIdx !== -1) {
                  handleSelectAlbumIndex(aIdx, tIdx);
                  break;
                }
              }
            }}
            onOpenWalletModal={() => setIsTokenWalletOpen(true)}
          />

          <UserTokenWalletModal
            isOpen={isTokenWalletOpen}
            userId={currentUser?.id || 'usr-default'}
            currentActivePass={subscriptionPass}
            onClose={() => setIsTokenWalletOpen(false)}
            onPassRedeemed={(pass) => setSubscriptionPass(pass)}
            onToast={(msg, color) => {
              ctrl.pushNotification('Portefeuille Jetons', msg, color?.includes('rose') ? 'COMMUNITY' : 'CERTIFICATION');
            }}
          />
        </main>
  );
};
