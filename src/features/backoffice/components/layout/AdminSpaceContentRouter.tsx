import React from 'react';
import { AdminOverviewDashboard } from '../overview/AdminOverviewDashboard';
import {
  AdminCatalogueRepertoire, AdminCatalogueAlgo, AdminBannersManager,
  AdminDatabaseManager, AdminUsersDirectory, AdminDrmOfflinePanel,
  AdminSponsorCampaignsPanel, AdminUploadWizard,
} from '../../index';
import { BugadaRoyaltiesAdminPanel } from '../../../royalties/BugadaRoyaltiesAdminPanel';
import { CatalogueMusicAnalyticsPanel } from '../../../music-intelligence';
import type { AdminSpaceId } from '../../types/admin-spaces.types';
import type { ReturnTypeUseDropPlatformController } from '../../../listener/hooks/useDropPlatformController';

export interface AdminSpaceContentRouterProps {
  currentSpaceId: AdminSpaceId;
  ctrl: ReturnTypeUseDropPlatformController;
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
}

export const AdminSpaceContentRouter: React.FC<AdminSpaceContentRouterProps> = ({
  currentSpaceId, ctrl, onNavigateToSpace,
}) => {
  if (currentSpaceId === '00_OVERVIEW') {
    return <AdminOverviewDashboard users={ctrl.users} tracks={ctrl.allTracksFlat} syncSnapshot={ctrl.syncSnapshot} onNavigateToSpace={onNavigateToSpace} />;
  }

  if (currentSpaceId === '01_CATALOGUE') {
    return (
      <div className="space-y-3">
        <div className="flex gap-2 p-1 rounded-xl bg-[#0D1017] border border-white/10 w-fit text-xs">
          {(['REPERTOIRE', 'ALGO', 'MUSIC_INTEL'] as const).map((tab) => (
            <button
              key={tab} type="button" onClick={() => ctrl.setCatalogueSubTab(tab)}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${ctrl.catalogueSubTab === tab ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'}`}
            >
              {tab === 'REPERTOIRE' ? 'Répertoire 37 Titres' : tab === 'ALGO' ? 'Rangs & Awards' : 'Intelligence Musicale'}
            </button>
          ))}
        </div>
        {ctrl.catalogueSubTab === 'REPERTOIRE' && (
          <AdminCatalogueRepertoire
            catalogue={ctrl.catalogue} searchQuery={ctrl.searchQuery} setSearchQuery={ctrl.setSearchQuery}
            onAutoReorderByAlgo={ctrl.handleAutoReorderByAlgo} onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
            onSelectArtist={(n: string) => ctrl.setSelectedArtistName(n)} onMoveAlbumOrder={ctrl.handleMoveAlbumOrder}
            onSelectTrack={(tid: string) => ctrl.setSelectedTrackId(tid)} trackRankMap={ctrl.trackRankMap}
          />
        )}
        {ctrl.catalogueSubTab === 'ALGO' && (
          <AdminCatalogueAlgo
            algoDimension={ctrl.algoDimension} setAlgoDimension={ctrl.setAlgoDimension}
            algoFilterValue={ctrl.algoFilterValue} setAlgoFilterValue={ctrl.setAlgoFilterValue}
            algoFilterOptions={ctrl.algoFilterOptions} dropAwardsList={ctrl.dropAwardsList}
            groupedDimensionRankings={ctrl.groupedDimensionRankings} rankedFilteredTracks={ctrl.rankedFilteredTracks}
            trackRankMap={ctrl.trackRankMap} onSelectArtist={(n: string) => ctrl.setSelectedArtistName(n)}
            onSelectTrack={(tid: string) => ctrl.setSelectedTrackId(tid)} onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
          />
        )}
        {ctrl.catalogueSubTab === 'MUSIC_INTEL' && (
          <CatalogueMusicAnalyticsPanel tracks={ctrl.allTracksFlat} onSelectTrack={(tid: string) => ctrl.setSelectedTrackId(tid)} onSelectArtist={(n: string) => ctrl.setSelectedArtistName(n)} />
        )}
      </div>
    );
  }

  if (currentSpaceId === '02_STUDIO') {
    return (
      <AdminUploadWizard
        wizardStep={ctrl.wizardStep} setWizardStep={ctrl.setWizardStep}
        isWizardStep1Valid={ctrl.isWizardStep1Valid} isWizardStep2Valid={ctrl.isWizardStep2Valid}
        isWizardStep3Valid={ctrl.isWizardStep3Valid} canAccessWizardStep={ctrl.canAccessWizardStep}
        uploadSuccess={ctrl.uploadSuccess} uploadSourceType={ctrl.uploadSourceType}
        setUploadSourceType={ctrl.setUploadSourceType} newAudioFileName={ctrl.newAudioFileName}
        handleAudioFileDrop={ctrl.handleAudioFileDrop} handleLoadStudioOpusMasterPreset={ctrl.handleLoadStudioOpusMasterPreset}
        handleSimulateDuplicateWaveformUpload={ctrl.handleSimulateDuplicateWaveformUpload}
        allTracksFlat={ctrl.allTracksFlat}
        newExternalUrl={ctrl.newExternalUrl} setNewExternalUrl={ctrl.setNewExternalUrl}
        isUploadingFile={ctrl.isUploadingFile} uploadProgress={ctrl.uploadProgress}
        newCoverFileUrl={ctrl.newCoverFileUrl} newCoverFileName={ctrl.newCoverFileName}
        handleRemoveNewCover={ctrl.handleRemoveNewCover} handleCoverFileSelect={ctrl.handleCoverFileSelect}
        waveformVerificationReport={ctrl.waveformVerificationReport} handleCancelDuplicateUpload={ctrl.handleCancelDuplicateUpload}
        newIsInstrumental={ctrl.newIsInstrumental} setNewIsInstrumental={ctrl.setNewIsInstrumental}
        setNewIsBeatDownloadable={ctrl.setNewIsBeatDownloadable}
        newCategory={ctrl.newCategory} setNewCategory={ctrl.setNewCategory}
        newTitle={ctrl.newTitle} setNewTitle={ctrl.setNewTitle}
        newArtist={ctrl.newArtist} setNewArtist={ctrl.setNewArtist}
        inlineNewEntityField={ctrl.inlineNewEntityField} setInlineNewEntityField={ctrl.setInlineNewEntityField}
        inlineNewEntityValue={ctrl.inlineNewEntityValue} setInlineNewEntityValue={ctrl.setInlineNewEntityValue}
        entityDb={ctrl.entityDb} handleRegisterEntityInDb={ctrl.handleRegisterEntityInDb}
        newFeaturingInput={ctrl.newFeaturingInput} setNewFeaturingInput={ctrl.setNewFeaturingInput}
        newFeaturingSplitMode={ctrl.newFeaturingSplitMode} setNewFeaturingSplitMode={ctrl.setNewFeaturingSplitMode}
        newDurationFormatted={ctrl.newDurationFormatted} setNewDurationFormatted={ctrl.setNewDurationFormatted}
        newGabonTerritoryPct={ctrl.newGabonTerritoryPct} setNewGabonTerritoryPct={ctrl.setNewGabonTerritoryPct}
        newAlbum={ctrl.newAlbum} setNewAlbum={ctrl.setNewAlbum}
        newBpm={ctrl.newBpm} setNewBpm={ctrl.setNewBpm}
        newMusicalKey={ctrl.newMusicalKey} setNewMusicalKey={ctrl.setNewMusicalKey}
        newAcousticEnergy={ctrl.newAcousticEnergy} setNewAcousticEnergy={ctrl.setNewAcousticEnergy}
        newGroove={ctrl.newGroove} setNewGroove={ctrl.setNewGroove}
        categories={ctrl.categories} customCategoryInput={ctrl.customCategoryInput}
        setCustomCategoryInput={ctrl.setCustomCategoryInput} handleAddCategory={ctrl.handleAddCategory}
        newLabelName={ctrl.newLabelName} setNewLabelName={ctrl.setNewLabelName}
        newBeatmakerName={ctrl.newBeatmakerName} setNewBeatmakerName={ctrl.setNewBeatmakerName}
        newRecordingEngineerName={ctrl.newRecordingEngineerName} setNewRecordingEngineerName={ctrl.setNewRecordingEngineerName}
        newMixingEngineerName={ctrl.newMixingEngineerName} setNewMixingEngineerName={ctrl.setNewMixingEngineerName}
        newSoundEngineerName={ctrl.newSoundEngineerName} setNewSoundEngineerName={ctrl.setNewSoundEngineerName}
        newMasteringEngineerName={ctrl.newMasteringEngineerName} setNewMasteringEngineerName={ctrl.setNewMasteringEngineerName}
        newLyricistName={ctrl.newLyricistName} setNewLyricistName={ctrl.setNewLyricistName}
        newLyricsText={ctrl.newLyricsText} setNewLyricsText={ctrl.setNewLyricsText}
        newIsExternalLyricist={ctrl.newIsExternalLyricist} setNewIsExternalLyricist={ctrl.setNewIsExternalLyricist}
        newDropContentId={ctrl.newDropContentId} newAudioCodec={ctrl.newAudioCodec}
        newMeasuredLufs={ctrl.newMeasuredLufs} parsedNewDuration={ctrl.parsedNewDuration}
        toggleUploadDropPreview={ctrl.toggleUploadDropPreview} isPreviewingUploadDrop={ctrl.isPreviewingUploadDrop}
        uploadPreviewTime={ctrl.uploadPreviewTime} newDropStart={ctrl.newDropStart}
        setNewDropStart={ctrl.setNewDropStart} newDropDuration={ctrl.newDropDuration}
        setNewDropDuration={ctrl.setNewDropDuration} newCopyrightText={ctrl.newCopyrightText}
        waveformPeaks={ctrl.waveformPeaks} currentTrackAnalysis={ctrl.currentTrackAnalysis}
        isAnalyzingAudio={ctrl.isAnalyzingAudio} handleConfirmBpm={ctrl.handleConfirmBpm}
        handleConfirmKey={ctrl.handleConfirmKey} handleReanalyzeAudio={ctrl.handleReanalyzeAudio}
        handleCancelAudioAnalysis={ctrl.handleCancelAudioAnalysis} handlePublishTrack={ctrl.handlePublishTrack}
      />
    );
  }

  if (currentSpaceId === '03_LISTENERS') {
    return <AdminUsersDirectory users={ctrl.users} onSelectUser={(uid: string) => ctrl.setSelectedConsumerUserId(uid)} onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin} />;
  }

  if (currentSpaceId === '04_PARTNERS') {
    return <AdminSponsorCampaignsPanel allTracksFlat={ctrl.allTracksFlat} onToast={(m: string, c?: string) => ctrl.pushNotification('Sponsors & Jetons', m, c?.includes('rose') ? 'COMMUNITY' : 'DATABASE')} />;
  }

  if (currentSpaceId === '05_FINANCE') {
    return (
      <BugadaRoyaltiesAdminPanel
        ledger={ctrl.royaltyLedger} settings={ctrl.royaltyLedgerState.settings} closedPeriods={ctrl.royaltyLedgerState.closedPeriods}
        onUpdateSettings={ctrl.updateRoyaltySettings} onResetSettings={ctrl.resetRoyaltySettings}
        onChangeHolderTaxStatus={ctrl.setHolderTaxStatus} onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
        tracks={ctrl.allTracksFlat}
        onCloseAccountingPeriod={(period: string) => {
          ctrl.closeRoyaltyPeriod({ period, statements: ctrl.royaltyLedger.statements, bugadaTotal: ctrl.royaltyLedger.bugada.totalAuthorship, currentStats: {} });
        }}
      />
    );
  }

  if (currentSpaceId === '06_ADS') {
    return (
      <AdminBannersManager
        adBanners={ctrl.adBanners} setAdBanners={ctrl.setAdBanners} adBannerSettings={ctrl.adBannerSettings}
        setAdBannerSettings={ctrl.setAdBannerSettings} allTracksFlat={ctrl.allTracksFlat} catalogue={ctrl.catalogue}
        onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin} pushNotification={ctrl.pushNotification}
      />
    );
  }

  if (currentSpaceId === '07_INFRASTRUCTURE') {
    return (
      <AdminDatabaseManager
        supabaseHealthMsg={ctrl.supabaseHealthMsg} entityDb={ctrl.entityDb} onRegisterEntity={ctrl.handleRegisterEntityInDb}
        onDeleteEntity={ctrl.handleDeleteEntityFromDb} onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin} pushNotification={ctrl.pushNotification}
      />
    );
  }

  return (
    <AdminDrmOfflinePanel
      allTracksFlat={ctrl.allTracksFlat} currentTrack={ctrl.currentTrack} adminDrmTargetTrackId={ctrl.adminDrmTargetTrackId}
      setAdminDrmTargetTrackId={ctrl.setAdminDrmTargetTrackId} adminDrmVault={ctrl.adminDrmVault} isEncryptingAdminDrm={ctrl.isEncryptingAdminDrm}
      adminDrmStatusMsg={ctrl.adminDrmStatusMsg} onEncryptTrackToSandbox={ctrl.encryptTrackToAdminSandbox} onTestRamDecrypt={ctrl.handleAdminTestRamDecrypt}
      onSimulateExfiltrationSelfDestruct={ctrl.handleAdminSimulateExfiltrationSelfDestruct} syncSnapshot={ctrl.syncSnapshot}
    />
  );
};
