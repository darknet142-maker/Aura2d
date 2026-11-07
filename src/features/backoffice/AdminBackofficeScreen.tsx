import React from 'react';
import { Activity, Disc, Flame, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { BugadaRoyaltiesAdminPanel } from '../royalties/BugadaRoyaltiesAdminPanel';
import { CatalogueMusicAnalyticsPanel } from '../music-intelligence';
import type { StatsBaseline } from '../royalties/royaltyLedgerStore';
import { SPRING_SNAPPY, SUBTLE_ENTRANCE_VARIANTS } from '../../shared/ui/springMotion';
import {
  AdminCommandHeader,
  AdminCatalogueRepertoire,
  AdminCatalogueAlgo,
  AdminBannersManager,
  AdminDatabaseManager,
  AdminUsersDirectory,
  AdminDrmOfflinePanel,
  TrackEditModal,
  AdminTrackDrilldownView,
  AdminArtistDrilldownView,
  AdminConsumerUserDrilldownView,
  AdminUploadWizard,
} from './index';
import type { ReturnTypeUseDropPlatformController } from '../listener/hooks/useDropPlatformController';

export const AdminBackofficeScreen: React.FC<{ ctrl: ReturnTypeUseDropPlatformController }> = ({ ctrl }) => {
  const {
    selectedTrackDetail, setSelectedTrackId, setSelectedArtistName, finalizeListeningSessionOnZap,
    setAlbumIdx, setTrackIdx, setIsDropMode, seekAllEngines, manualSessionRef, setIsPlaying,
    setAppView, setEditingTrack, handleDeleteTrack, selectedArtistAnalytics, artistSubscribers,
    subscribedArtists, handleToggleSubscribeArtist, royaltyLedger, royaltyLedgerState,
    trackRankMap, setSelectedConsumerUserId, selectedConsumerUser, consumerAnalytics, users,
    isRealtimeConnected, lastAdminSavedAt, enableAwardsCeremony, setEnableAwardsCeremony,
    pushNotification, isSavingAdmin, handleSaveAndSyncAllAdmin, adminMainTab, setAdminMainTab,
    allTracksFlat, adBanners, catalogueSubTab, setCatalogueSubTab, syncSnapshot, catalogue,
    searchQuery, setSearchQuery, handleAutoReorderByAlgo, handleMoveAlbumOrder, algoDimension,
    setAlgoDimension, algoFilterValue, setAlgoFilterValue, algoFilterOptions, dropAwardsList,
    groupedDimensionRankings, rankedFilteredTracks, currentTrack, adminDrmTargetTrackId,
    setAdminDrmTargetTrackId, adminDrmVault, isEncryptingAdminDrm, adminDrmStatusMsg,
    encryptTrackToAdminSandbox, handleAdminTestRamDecrypt, handleAdminSimulateExfiltrationSelfDestruct,
    wizardStep, setWizardStep, isWizardStep1Valid, isWizardStep2Valid, isWizardStep3Valid,
    canAccessWizardStep, uploadSuccess, uploadSourceType, setUploadSourceType, newAudioFileName,
    handleAudioFileDrop, handleLoadStudioOpusMasterPreset, handleSimulateDuplicateWaveformUpload,
    newExternalUrl, setNewExternalUrl, isUploadingFile, uploadProgress, newCoverFileUrl,
    newCoverFileName, handleRemoveNewCover, handleCoverFileSelect, waveformVerificationReport,
    handleCancelDuplicateUpload, newIsInstrumental, setNewIsInstrumental, setNewIsBeatDownloadable,
    newCategory, setNewCategory, newTitle, setNewTitle, newArtist, setNewArtist,
    inlineNewEntityField, setInlineNewEntityField, inlineNewEntityValue, setInlineNewEntityValue,
    entityDb, handleRegisterEntityInDb, newFeaturingInput, setNewFeaturingInput,
    newFeaturingSplitMode, setNewFeaturingSplitMode, newDurationFormatted, setNewDurationFormatted,
    newGabonTerritoryPct, setNewGabonTerritoryPct, newAlbum, setNewAlbum, newBpm, setNewBpm,
    newMusicalKey, setNewMusicalKey, newAcousticEnergy, setNewAcousticEnergy, newGroove, setNewGroove, categories, customCategoryInput, setCustomCategoryInput,
    handleAddCategory, newLabelName, setNewLabelName, newBeatmakerName, setNewBeatmakerName,
    newRecordingEngineerName, setNewRecordingEngineerName, newMixingEngineerName,
    setNewMixingEngineerName, newSoundEngineerName, setNewSoundEngineerName,
    newMasteringEngineerName, setNewMasteringEngineerName, newLyricistName, setNewLyricistName,
    newLyricsText, setNewLyricsText,
    newIsExternalLyricist, setNewIsExternalLyricist, newDropContentId, newAudioCodec,
    newMeasuredLufs, parsedNewDuration, toggleUploadDropPreview, isPreviewingUploadDrop,
    uploadPreviewTime, newDropStart, setNewDropStart, newDropDuration, setNewDropDuration,
    newCopyrightText, waveformPeaks, handlePublishTrack, setAdBanners, adBannerSettings,
    setAdBannerSettings, supabaseHealthMsg, handleDeleteEntityFromDb, updateRoyaltySettings,
    resetRoyaltySettings, setHolderTaxStatus, closeRoyaltyPeriod, editingTrack, handleSaveEditedTrack,
    isBreakUiMode, handleToggleBreakUiMode,
  } = ctrl;

  return (
        <motion.main
          variants={SUBTLE_ENTRANCE_VARIANTS}
          initial="initial"
          animate="animate"
          className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 overflow-y-auto overflow-x-hidden flex flex-col gap-3.5"
        >
          {selectedTrackDetail ? (
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
          ) : selectedArtistAnalytics ? (
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
          ) : selectedConsumerUser && consumerAnalytics ? (
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
          ) : (
            <>
              <AdminCommandHeader
                isRealtimeConnected={isRealtimeConnected}
                lastAdminSavedAt={lastAdminSavedAt}
                enableAwardsCeremony={enableAwardsCeremony}
                onToggleAwardsCeremony={() => {
                  const nextState = !enableAwardsCeremony;
                  setEnableAwardsCeremony(nextState);
                  pushNotification(
                    nextState
                      ? 'Cérémonie DROP Awards activée !'
                      : 'Menu Awards masqué dans Central',
                    nextState
                      ? 'L’onglet Awards est désormais ouvert au public dans Central.'
                      : 'L’onglet Awards a été retiré de la navigation publique de Central.',
                    'CERTIFICATION'
                  );
                }}
                isSavingAdmin={isSavingAdmin}
                onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                adminMainTab={adminMainTab}
                onSelectMainTab={setAdminMainTab}
                tracksCount={allTracksFlat.length}
                bannersCount={adBanners.length}
                usersCount={users.length}
                isBreakUiMode={isBreakUiMode}
                onToggleBreakUiMode={() => {
                  const next = !isBreakUiMode;
                  handleToggleBreakUiMode();
                  pushNotification(
                    next
                      ? 'Crash-Test UI (break-ui) ACTIVÉ'
                      : 'Retour au Catalogue Standard',
                    next
                      ? 'Titres de 80+ caractères et pochettes manquantes injectés pour éprouver la symétrie et les placeholders SVG.'
                      : 'Catalogue nominal restauré sans aucune perte de données.',
                    'CERTIFICATION'
                  );
                }}
              />

              {adminMainTab === 'CATALOGUE' && (
                <div className="w-full flex flex-col gap-3">
                  {/* SOUS-ONGLETS DU CATALOGUE EN GRILLE SYMÉTRIQUE 4 COLONNES */}
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-[#0D1017] p-2 rounded-2xl border border-white/[0.08]">
                    <motion.button
                      type="button"
                      whileHover={{ y: -1.5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={SPRING_SNAPPY}
                      onClick={() => setCatalogueSubTab('REPERTOIRE')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border cursor-pointer ${
                        catalogueSubTab === 'REPERTOIRE'
                          ? 'bg-white/15 border-white/25 text-[#F8FAFC]'
                          : 'bg-[#07090E] border-white/[0.08] text-[#A3A9BA] hover:text-white'
                      }`}
                    >
                      <Disc className="w-3.5 h-3.5 text-[#DE1B34] shrink-0" />
                      <span className="truncate">Pistes, Beats &amp; Certifs ({allTracksFlat.length})</span>
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ y: -1.5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={SPRING_SNAPPY}
                      onClick={() => setCatalogueSubTab('ALGO')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border cursor-pointer ${
                        catalogueSubTab === 'ALGO'
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#07090E] border-white/[0.08] text-[#A3A9BA] hover:text-white'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Rangs Anti-Halo &amp; Awards</span>
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ y: -1.5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={SPRING_SNAPPY}
                      onClick={() => setCatalogueSubTab('MUSIC_INTEL')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border cursor-pointer ${
                        catalogueSubTab === 'MUSIC_INTEL'
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-[#07090E] border-white/[0.08] text-[#A3A9BA] hover:text-white'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">Intelligence BPM &amp; Benchmark</span>
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ y: -1.5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={SPRING_SNAPPY}
                      onClick={() => setCatalogueSubTab('RULES')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border cursor-pointer ${
                        catalogueSubTab === 'RULES'
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-[#07090E] border-white/[0.08] text-[#A3A9BA] hover:text-white'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">DRM &amp; Offline ({syncSnapshot.queue.length})</span>
                    </motion.button>
                  </div>

                  {catalogueSubTab === 'REPERTOIRE' && (
                    <AdminCatalogueRepertoire
                      catalogue={catalogue}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      onAutoReorderByAlgo={handleAutoReorderByAlgo}
                      onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                      onSelectArtist={(name) => setSelectedArtistName(name)}
                      onMoveAlbumOrder={handleMoveAlbumOrder}
                      onSelectTrack={(tid) => setSelectedTrackId(tid)}
                      trackRankMap={trackRankMap}
                    />
                  )}

                  {catalogueSubTab === 'ALGO' && (
                    <AdminCatalogueAlgo
                      algoDimension={algoDimension}
                      setAlgoDimension={setAlgoDimension}
                      algoFilterValue={algoFilterValue}
                      setAlgoFilterValue={setAlgoFilterValue}
                      algoFilterOptions={algoFilterOptions}
                      dropAwardsList={dropAwardsList}
                      groupedDimensionRankings={groupedDimensionRankings}
                      rankedFilteredTracks={rankedFilteredTracks}
                      trackRankMap={trackRankMap}
                      onSelectArtist={(name) => setSelectedArtistName(name)}
                      onSelectTrack={(tid) => setSelectedTrackId(tid)}
                      onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                    />
                  )}

                  {catalogueSubTab === 'MUSIC_INTEL' && (
                    <CatalogueMusicAnalyticsPanel
                      tracks={allTracksFlat}
                      onSelectTrack={(tid) => setSelectedTrackId(tid)}
                      onSelectArtist={(name) => setSelectedArtistName(name)}
                    />
                  )}

                  {catalogueSubTab === 'RULES' && (
                    <AdminDrmOfflinePanel
                      allTracksFlat={allTracksFlat}
                      currentTrack={currentTrack}
                      adminDrmTargetTrackId={adminDrmTargetTrackId}
                      setAdminDrmTargetTrackId={setAdminDrmTargetTrackId}
                      adminDrmVault={adminDrmVault}
                      isEncryptingAdminDrm={isEncryptingAdminDrm}
                      adminDrmStatusMsg={adminDrmStatusMsg}
                      onEncryptTrackToSandbox={encryptTrackToAdminSandbox}
                      onTestRamDecrypt={handleAdminTestRamDecrypt}
                      onSimulateExfiltrationSelfDestruct={
                        handleAdminSimulateExfiltrationSelfDestruct
                      }
                      syncSnapshot={syncSnapshot}
                    />
                  )}
                </div>
              )}

              {adminMainTab === 'UPLOAD' && (
                <AdminUploadWizard
                  wizardStep={wizardStep}
                  setWizardStep={setWizardStep}
                  isWizardStep1Valid={isWizardStep1Valid}
                  isWizardStep2Valid={isWizardStep2Valid}
                  isWizardStep3Valid={isWizardStep3Valid}
                  canAccessWizardStep={canAccessWizardStep}
                  uploadSuccess={uploadSuccess}
                  uploadSourceType={uploadSourceType}
                  setUploadSourceType={setUploadSourceType}
                  newAudioFileName={newAudioFileName}
                  handleAudioFileDrop={handleAudioFileDrop}
                  handleLoadStudioOpusMasterPreset={handleLoadStudioOpusMasterPreset}
                  handleSimulateDuplicateWaveformUpload={handleSimulateDuplicateWaveformUpload}
                  allTracksFlat={allTracksFlat}
                  newExternalUrl={newExternalUrl}
                  setNewExternalUrl={setNewExternalUrl}
                  isUploadingFile={isUploadingFile}
                  uploadProgress={uploadProgress}
                  newCoverFileUrl={newCoverFileUrl}
                  newCoverFileName={newCoverFileName}
                  handleRemoveNewCover={handleRemoveNewCover}
                  handleCoverFileSelect={handleCoverFileSelect}
                  waveformVerificationReport={waveformVerificationReport}
                  handleCancelDuplicateUpload={handleCancelDuplicateUpload}
                  newIsInstrumental={newIsInstrumental}
                  setNewIsInstrumental={setNewIsInstrumental}
                  setNewIsBeatDownloadable={setNewIsBeatDownloadable}
                  newCategory={newCategory}
                  setNewCategory={setNewCategory}
                  newTitle={newTitle}
                  setNewTitle={setNewTitle}
                  newArtist={newArtist}
                  setNewArtist={setNewArtist}
                  inlineNewEntityField={inlineNewEntityField}
                  setInlineNewEntityField={setInlineNewEntityField}
                  inlineNewEntityValue={inlineNewEntityValue}
                  setInlineNewEntityValue={setInlineNewEntityValue}
                  entityDb={entityDb}
                  handleRegisterEntityInDb={handleRegisterEntityInDb}
                  newFeaturingInput={newFeaturingInput}
                  setNewFeaturingInput={setNewFeaturingInput}
                  newFeaturingSplitMode={newFeaturingSplitMode}
                  setNewFeaturingSplitMode={setNewFeaturingSplitMode}
                  newDurationFormatted={newDurationFormatted}
                  setNewDurationFormatted={setNewDurationFormatted}
                  newGabonTerritoryPct={newGabonTerritoryPct}
                  setNewGabonTerritoryPct={setNewGabonTerritoryPct}
                  newAlbum={newAlbum}
                  setNewAlbum={setNewAlbum}
                  newBpm={newBpm}
                  setNewBpm={setNewBpm}
                  newMusicalKey={newMusicalKey}
                  setNewMusicalKey={setNewMusicalKey}
                  newAcousticEnergy={newAcousticEnergy}
                  setNewAcousticEnergy={setNewAcousticEnergy}
                  newGroove={newGroove}
                  setNewGroove={setNewGroove}
                  categories={categories}
                  customCategoryInput={customCategoryInput}
                  setCustomCategoryInput={setCustomCategoryInput}
                  handleAddCategory={handleAddCategory}
                  newLabelName={newLabelName}
                  setNewLabelName={setNewLabelName}
                  newBeatmakerName={newBeatmakerName}
                  setNewBeatmakerName={setNewBeatmakerName}
                  newRecordingEngineerName={newRecordingEngineerName}
                  setNewRecordingEngineerName={setNewRecordingEngineerName}
                  newMixingEngineerName={newMixingEngineerName}
                  setNewMixingEngineerName={setNewMixingEngineerName}
                  newSoundEngineerName={newSoundEngineerName}
                  setNewSoundEngineerName={setNewSoundEngineerName}
                  newMasteringEngineerName={newMasteringEngineerName}
                  setNewMasteringEngineerName={setNewMasteringEngineerName}
                  newLyricistName={newLyricistName}
                  setNewLyricistName={setNewLyricistName}
                  newLyricsText={newLyricsText}
                  setNewLyricsText={setNewLyricsText}
                  newIsExternalLyricist={newIsExternalLyricist}
                  setNewIsExternalLyricist={setNewIsExternalLyricist}
                  newDropContentId={newDropContentId}
                  newAudioCodec={newAudioCodec}
                  newMeasuredLufs={newMeasuredLufs}
                  parsedNewDuration={parsedNewDuration}
                  toggleUploadDropPreview={toggleUploadDropPreview}
                  isPreviewingUploadDrop={isPreviewingUploadDrop}
                  uploadPreviewTime={uploadPreviewTime}
                  newDropStart={newDropStart}
                  setNewDropStart={setNewDropStart}
                  newDropDuration={newDropDuration}
                  setNewDropDuration={setNewDropDuration}
                  newCopyrightText={newCopyrightText}
                  waveformPeaks={waveformPeaks}
                  currentTrackAnalysis={ctrl.currentTrackAnalysis}
                  isAnalyzingAudio={ctrl.isAnalyzingAudio}
                  handleConfirmBpm={ctrl.handleConfirmBpm}
                  handleConfirmKey={ctrl.handleConfirmKey}
                  handleReanalyzeAudio={ctrl.handleReanalyzeAudio}
                  handleCancelAudioAnalysis={ctrl.handleCancelAudioAnalysis}
                  handlePublishTrack={handlePublishTrack}
                />
              )}

              {adminMainTab === 'BANNERS' && (
                <AdminBannersManager
                  adBanners={adBanners}
                  setAdBanners={setAdBanners}
                  adBannerSettings={adBannerSettings}
                  setAdBannerSettings={setAdBannerSettings}
                  allTracksFlat={allTracksFlat}
                  catalogue={catalogue}
                  onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                  pushNotification={pushNotification}
                />
              )}

              {adminMainTab === 'DATABASE' && (
                <AdminDatabaseManager
                  supabaseHealthMsg={supabaseHealthMsg}
                  entityDb={entityDb}
                  onRegisterEntity={handleRegisterEntityInDb}
                  onDeleteEntity={handleDeleteEntityFromDb}
                  onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                  pushNotification={pushNotification}
                />
              )}

              {adminMainTab === 'USERS' && (
                <AdminUsersDirectory
                  users={users}
                  onSelectUser={(uid) => setSelectedConsumerUserId(uid)}
                  onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                />
              )}

              {adminMainTab === 'ROYALTIES_BUGADA' && (
                <BugadaRoyaltiesAdminPanel
                  ledger={royaltyLedger}
                  settings={royaltyLedgerState.settings}
                  closedPeriods={royaltyLedgerState.closedPeriods}
                  onUpdateSettings={updateRoyaltySettings}
                  onResetSettings={resetRoyaltySettings}
                  onChangeHolderTaxStatus={setHolderTaxStatus}
                  onSaveAndSyncAll={handleSaveAndSyncAllAdmin}
                  tracks={allTracksFlat}
                  onTriggerDjTransition={(targetTrackId, crossfadeSec) => {
                    for (let aIdx = 0; aIdx < catalogue.length; aIdx++) {
                      const tIdx = catalogue[aIdx].tracks.findIndex((t) => t.id === targetTrackId);
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
                        finalizeListeningSessionOnZap();
                        setAlbumIdx(aIdx);
                        setTrackIdx(tIdx);
                        setIsDropMode(false);
                        seekAllEngines(0);
                        setIsPlaying(true);
                        break;
                      }
                    }
                  }}
                  onCloseAccountingPeriod={(period) => {
                    const currentStats: StatsBaseline = {};
                    users.forEach((u) => {
                      currentStats[u.id] = {};
                      Object.values(u.trackStats).forEach((st) => {
                        currentStats[u.id][st.trackId] = {
                          plays: st.playsCount,
                          seconds: st.listenSeconds,
                        };
                      });
                    });
                    closeRoyaltyPeriod({
                      period,
                      statements: royaltyLedger.statements,
                      bugadaTotal: royaltyLedger.bugada.totalAuthorship,
                      currentStats,
                    });
                    pushNotification(
                      `Clôture BUGADA & Paie (${period})`,
                      'Bordereau BUGADA 12% validé et paiements directs Master 48% ordonnancés.',
                      'CERTIFICATION'
                    );
                  }}
                />
              )}
            </>
          )}

          <TrackEditModal
            editingTrack={editingTrack}
            setEditingTrack={setEditingTrack}
            entityDb={entityDb}
            categories={categories}
            onSaveEditedTrack={handleSaveEditedTrack}
          />
        </motion.main>
  );
};
