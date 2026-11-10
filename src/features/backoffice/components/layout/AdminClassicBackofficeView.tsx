import React from 'react';
import { Activity, Disc, Flame, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../../shared/ui/springMotion';
import { AdminCommandHeader } from '../AdminCommandHeader';
import {
  AdminCatalogueRepertoire,
  AdminCatalogueAlgo,
  AdminBannersManager,
  AdminDatabaseManager,
  AdminUsersDirectory,
  AdminDrmOfflinePanel,
  AdminUploadWizard,
  AdminSponsorCampaignsPanel,
} from '../../index';
import { BugadaRoyaltiesAdminPanel } from '../../../royalties/BugadaRoyaltiesAdminPanel';
import { CatalogueMusicAnalyticsPanel } from '../../../music-intelligence';
import type { StatsBaseline } from '../../../royalties/royaltyLedgerStore';
import type { ReturnTypeUseDropPlatformController } from '../../../listener/hooks/useDropPlatformController';

export interface AdminClassicBackofficeViewProps {
  ctrl: ReturnTypeUseDropPlatformController;
  onSwitchToSaaSMode: () => void;
}

export const AdminClassicBackofficeView: React.FC<AdminClassicBackofficeViewProps> = ({
  ctrl,
  onSwitchToSaaSMode,
}) => {
  return (
    <>
      <AdminCommandHeader
        isRealtimeConnected={ctrl.isRealtimeConnected}
        lastAdminSavedAt={ctrl.lastAdminSavedAt}
        enableAwardsCeremony={ctrl.enableAwardsCeremony}
        onToggleAwardsCeremony={() => {
          const nextState = !ctrl.enableAwardsCeremony;
          ctrl.setEnableAwardsCeremony(nextState);
          ctrl.pushNotification(
            nextState ? 'Cérémonie DROP Awards activée !' : 'Menu Awards masqué dans Central',
            nextState ? 'L’onglet Awards est désormais ouvert au public dans Central.' : 'L’onglet Awards a été retiré de la navigation publique de Central.',
            'CERTIFICATION'
          );
        }}
        isSavingAdmin={ctrl.isSavingAdmin}
        onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
        adminMainTab={ctrl.adminMainTab}
        onSelectMainTab={ctrl.setAdminMainTab}
        tracksCount={ctrl.allTracksFlat.length}
        bannersCount={ctrl.adBanners.length}
        usersCount={ctrl.users.length}
        onSwitchToSaaSMode={onSwitchToSaaSMode}
      />

      {ctrl.adminMainTab === 'CATALOGUE' && (
        <div className="w-full flex flex-col gap-3">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-[#0D1017] p-2 rounded-2xl border border-white/[0.08]">
            <motion.button
              type="button" whileHover={{ y: -1.5 }} whileTap={{ scale: 0.98 }} transition={SPRING_SNAPPY}
              onClick={() => ctrl.setCatalogueSubTab('REPERTOIRE')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border cursor-pointer ${ctrl.catalogueSubTab === 'REPERTOIRE' ? 'bg-white/15 border-white/25 text-[#F8FAFC]' : 'bg-[#07090E] border-white/[0.08] text-[#A3A9BA] hover:text-white'}`}
            >
              <Disc className="w-3.5 h-3.5 text-[#DE1B34] shrink-0" />
              <span className="truncate">Pistes, Beats &amp; Certifs ({ctrl.allTracksFlat.length})</span>
            </motion.button>
            <motion.button
              type="button" whileHover={{ y: -1.5 }} whileTap={{ scale: 0.98 }} transition={SPRING_SNAPPY}
              onClick={() => ctrl.setCatalogueSubTab('ALGO')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border cursor-pointer ${ctrl.catalogueSubTab === 'ALGO' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-[#07090E] border-white/[0.08] text-[#A3A9BA] hover:text-white'}`}
            >
              <Flame className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Rangs Anti-Halo &amp; Awards</span>
            </motion.button>
            <motion.button
              type="button" whileHover={{ y: -1.5 }} whileTap={{ scale: 0.98 }} transition={SPRING_SNAPPY}
              onClick={() => ctrl.setCatalogueSubTab('MUSIC_INTEL')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border cursor-pointer ${ctrl.catalogueSubTab === 'MUSIC_INTEL' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-[#07090E] border-white/[0.08] text-[#A3A9BA] hover:text-white'}`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Intelligence BPM &amp; Benchmark</span>
            </motion.button>
            <motion.button
              type="button" whileHover={{ y: -1.5 }} whileTap={{ scale: 0.98 }} transition={SPRING_SNAPPY}
              onClick={() => ctrl.setCatalogueSubTab('RULES')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border cursor-pointer ${ctrl.catalogueSubTab === 'RULES' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-[#07090E] border-white/[0.08] text-[#A3A9BA] hover:text-white'}`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">DRM &amp; Offline ({ctrl.syncSnapshot.queue.length})</span>
            </motion.button>
          </div>

          {ctrl.catalogueSubTab === 'REPERTOIRE' && (
            <AdminCatalogueRepertoire
              catalogue={ctrl.catalogue} searchQuery={ctrl.searchQuery} setSearchQuery={ctrl.setSearchQuery}
              onAutoReorderByAlgo={ctrl.handleAutoReorderByAlgo} onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
              onSelectArtist={(name: string) => ctrl.setSelectedArtistName(name)} onMoveAlbumOrder={ctrl.handleMoveAlbumOrder}
              onSelectTrack={(tid: string) => ctrl.setSelectedTrackId(tid)} trackRankMap={ctrl.trackRankMap}
            />
          )}

          {ctrl.catalogueSubTab === 'ALGO' && (
            <AdminCatalogueAlgo
              algoDimension={ctrl.algoDimension} setAlgoDimension={ctrl.setAlgoDimension}
              algoFilterValue={ctrl.algoFilterValue} setAlgoFilterValue={ctrl.setAlgoFilterValue}
              algoFilterOptions={ctrl.algoFilterOptions} dropAwardsList={ctrl.dropAwardsList}
              groupedDimensionRankings={ctrl.groupedDimensionRankings} rankedFilteredTracks={ctrl.rankedFilteredTracks}
              trackRankMap={ctrl.trackRankMap} onSelectArtist={(name: string) => ctrl.setSelectedArtistName(name)}
              onSelectTrack={(tid: string) => ctrl.setSelectedTrackId(tid)} onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
            />
          )}

          {ctrl.catalogueSubTab === 'MUSIC_INTEL' && (
            <CatalogueMusicAnalyticsPanel
              tracks={ctrl.allTracksFlat} onSelectTrack={(tid: string) => ctrl.setSelectedTrackId(tid)}
              onSelectArtist={(name: string) => ctrl.setSelectedArtistName(name)}
            />
          )}

          {ctrl.catalogueSubTab === 'RULES' && (
            <AdminDrmOfflinePanel
              allTracksFlat={ctrl.allTracksFlat} currentTrack={ctrl.currentTrack}
              adminDrmTargetTrackId={ctrl.adminDrmTargetTrackId} setAdminDrmTargetTrackId={ctrl.setAdminDrmTargetTrackId}
              adminDrmVault={ctrl.adminDrmVault} isEncryptingAdminDrm={ctrl.isEncryptingAdminDrm}
              adminDrmStatusMsg={ctrl.adminDrmStatusMsg} onEncryptTrackToSandbox={ctrl.encryptTrackToAdminSandbox}
              onTestRamDecrypt={ctrl.handleAdminTestRamDecrypt}
              onSimulateExfiltrationSelfDestruct={ctrl.handleAdminSimulateExfiltrationSelfDestruct}
              syncSnapshot={ctrl.syncSnapshot}
            />
          )}
        </div>
      )}

      {ctrl.adminMainTab === 'UPLOAD' && (
        <AdminUploadWizard
          wizardStep={ctrl.wizardStep} setWizardStep={ctrl.setWizardStep}
          isWizardStep1Valid={ctrl.isWizardStep1Valid} isWizardStep2Valid={ctrl.isWizardStep2Valid}
          isWizardStep3Valid={ctrl.isWizardStep3Valid} canAccessWizardStep={ctrl.canAccessWizardStep}
          uploadSuccess={ctrl.uploadSuccess} uploadSourceType={ctrl.uploadSourceType}
          setUploadSourceType={ctrl.setUploadSourceType} newAudioFileName={ctrl.newAudioFileName}
          handleAudioFileDrop={ctrl.handleAudioFileDrop} handleLoadStudioOpusMasterPreset={ctrl.handleLoadStudioOpusMasterPreset}
          handleSimulateDuplicateWaveformUpload={ctrl.handleSimulateDuplicateWaveformUpload}
          allTracksFlat={ctrl.allTracksFlat} newExternalUrl={ctrl.newExternalUrl}
          setNewExternalUrl={ctrl.setNewExternalUrl} isUploadingFile={ctrl.isUploadingFile}
          uploadProgress={ctrl.uploadProgress} newCoverFileUrl={ctrl.newCoverFileUrl}
          newCoverFileName={ctrl.newCoverFileName} handleRemoveNewCover={ctrl.handleRemoveNewCover}
          handleCoverFileSelect={ctrl.handleCoverFileSelect} waveformVerificationReport={ctrl.waveformVerificationReport}
          handleCancelDuplicateUpload={ctrl.handleCancelDuplicateUpload} newIsInstrumental={ctrl.newIsInstrumental}
          setNewIsInstrumental={ctrl.setNewIsInstrumental} setNewIsBeatDownloadable={ctrl.setNewIsBeatDownloadable}
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
      )}

      {ctrl.adminMainTab === 'BANNERS' && (
        <AdminBannersManager
          adBanners={ctrl.adBanners} setAdBanners={ctrl.setAdBanners}
          adBannerSettings={ctrl.adBannerSettings} setAdBannerSettings={ctrl.setAdBannerSettings}
          allTracksFlat={ctrl.allTracksFlat} catalogue={ctrl.catalogue}
          onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin} pushNotification={ctrl.pushNotification}
        />
      )}

      {ctrl.adminMainTab === 'DATABASE' && (
        <AdminDatabaseManager
          supabaseHealthMsg={ctrl.supabaseHealthMsg} entityDb={ctrl.entityDb}
          onRegisterEntity={ctrl.handleRegisterEntityInDb} onDeleteEntity={ctrl.handleDeleteEntityFromDb}
          onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin} pushNotification={ctrl.pushNotification}
        />
      )}

      {ctrl.adminMainTab === 'USERS' && (
        <AdminUsersDirectory
          users={ctrl.users} onSelectUser={(uid: string) => ctrl.setSelectedConsumerUserId(uid)}
          onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
        />
      )}

      {ctrl.adminMainTab === 'ROYALTIES_BUGADA' && (
        <BugadaRoyaltiesAdminPanel
          ledger={ctrl.royaltyLedger} settings={ctrl.royaltyLedgerState.settings}
          closedPeriods={ctrl.royaltyLedgerState.closedPeriods} onUpdateSettings={ctrl.updateRoyaltySettings}
          onResetSettings={ctrl.resetRoyaltySettings} onChangeHolderTaxStatus={ctrl.setHolderTaxStatus}
          onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin} tracks={ctrl.allTracksFlat}
          onTriggerDjTransition={(targetTrackId: string, crossfadeSec: number) => {
            for (let aIdx = 0; aIdx < ctrl.catalogue.length; aIdx++) {
              const tIdx = ctrl.catalogue[aIdx].tracks.findIndex((t) => t.id === targetTrackId);
              if (tIdx >= 0) {
                const snapped = ([0, 2, 4, 6, 8] as const).reduce((prev, curr) =>
                  Math.abs(curr - crossfadeSec) < Math.abs(prev - crossfadeSec) ? curr : prev
                );
                ctrl.handleChangePlaybackPrefs({
                  ...ctrl.playbackPrefs,
                  defaultStartMode: 'FULL_NONSTOP',
                  chainingMode: 'CATALOGUE_NONSTOP',
                  crossfadeSec: snapped,
                  bpmSyncCrossfade: true,
                });
                ctrl.finalizeListeningSessionOnZap();
                ctrl.setAlbumIdx(aIdx);
                ctrl.setTrackIdx(tIdx);
                ctrl.setIsDropMode(false);
                ctrl.seekAllEngines(0);
                ctrl.setIsPlaying(true);
                break;
              }
            }
          }}
          onCloseAccountingPeriod={(period: string) => {
            const currentStats: StatsBaseline = {};
            ctrl.users.forEach((u) => {
              currentStats[u.id] = {};
              Object.values(u.trackStats).forEach((st: { trackId: string; playsCount: number; listenSeconds: number }) => {
                currentStats[u.id][st.trackId] = { plays: st.playsCount, seconds: st.listenSeconds };
              });
            });
            ctrl.closeRoyaltyPeriod({ period, statements: ctrl.royaltyLedger.statements, bugadaTotal: ctrl.royaltyLedger.bugada.totalAuthorship, currentStats });
            ctrl.pushNotification(`Clôture BUGADA & Paie (${period})`, 'Bordereau BUGADA 12% validé et paiements directs Master 48% ordonnancés.', 'CERTIFICATION');
          }}
        />
      )}

      {ctrl.adminMainTab === 'SPONSOR_CAMPAIGNS' && (
        <AdminSponsorCampaignsPanel
          allTracksFlat={ctrl.allTracksFlat}
          onToast={(msg: string, color?: string) => ctrl.pushNotification('Sponsors & Jetons', msg, color?.includes('rose') ? 'COMMUNITY' : 'DATABASE')}
        />
      )}
    </>
  );
};
