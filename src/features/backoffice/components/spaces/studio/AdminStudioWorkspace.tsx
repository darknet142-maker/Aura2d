import React, { useState } from 'react';
import { EchoJayLoudnessConsole } from './EchoJayLoudnessConsole';
import { SpectrumWaveformCard } from './SpectrumWaveformCard';
import { AdminUploadWizard } from '../../AdminUploadWizard';
import type { ReturnTypeUseDropPlatformController } from '../../../../listener/hooks/useDropPlatformController';

export interface AdminStudioWorkspaceProps {
  ctrl: ReturnTypeUseDropPlatformController;
}

export const AdminStudioWorkspace: React.FC<AdminStudioWorkspaceProps> = ({ ctrl }) => {
  const [activeView, setActiveView] = useState<'CONSOLE_WIZARD' | 'CONSOLE_ONLY'>('CONSOLE_WIZARD');

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0D1017] border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveView('CONSOLE_WIZARD')}
            className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer transition ${
              activeView === 'CONSOLE_WIZARD'
                ? 'bg-[#DE1B34] text-white shadow-sm'
                : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            Console Studio &amp; Assistant Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveView('CONSOLE_ONLY')}
            className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer transition ${
              activeView === 'CONSOLE_ONLY'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            Monitoring Télémétrie Seul
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={ctrl.handleLoadStudioOpusMasterPreset}
            className="px-3 py-1.5 rounded-xl bg-[#07090E] border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-mono font-bold cursor-pointer transition"
          >
            Charger Preset Studio Opus (-14 LUFS)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={activeView === 'CONSOLE_ONLY' ? 'lg:col-span-12 space-y-4' : 'lg:col-span-5 space-y-4'}>
          <EchoJayLoudnessConsole
            measuredLufs={ctrl.newMeasuredLufs}
            audioCodec={ctrl.newAudioCodec}
            isAnalyzing={ctrl.isAnalyzingAudio}
          />
          <SpectrumWaveformCard
            waveformPeaks={ctrl.waveformPeaks}
            audioFileName={ctrl.newAudioFileName || 'Master_Opus_320k.opus'}
            duration={ctrl.newDurationFormatted || '03:45'}
          />
        </div>

        {activeView === 'CONSOLE_WIZARD' && (
          <div className="lg:col-span-7">
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
          </div>
        )}
      </div>
    </div>
  );
};
