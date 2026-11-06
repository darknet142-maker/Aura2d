import React from 'react';
import {
  Building2, Check, CheckCircle2, Disc, Edit3, Headphones, Pause,
  Play, Shield, Sliders, Trash2, Upload,
} from 'lucide-react';
import { CoverArtwork } from '../../../../components/CoverArtwork';
import { formatTime } from '../../../../shared/utils/mediaFormatters';
import type { AdminUploadWizardProps } from './uploadWizard.types';

export const UploadStep3StudioCredits: React.FC<AdminUploadWizardProps> = ({
  wizardStep,
  setWizardStep,
  isWizardStep1Valid,
  isWizardStep2Valid,
  isWizardStep3Valid,
  canAccessWizardStep,
  uploadSuccess,
  uploadSourceType,
  setUploadSourceType,
  newAudioFileName,
  handleAudioFileDrop,
  handleLoadStudioOpusMasterPreset,
  handleSimulateDuplicateWaveformUpload,
  allTracksFlat,
  newExternalUrl,
  setNewExternalUrl,
  isUploadingFile,
  uploadProgress,
  newCoverFileUrl,
  newCoverFileName,
  handleRemoveNewCover,
  handleCoverFileSelect,
  waveformVerificationReport,
  handleCancelDuplicateUpload,
  newIsInstrumental,
  setNewIsInstrumental,
  setNewIsBeatDownloadable,
  newCategory,
  setNewCategory,
  newTitle,
  setNewTitle,
  newArtist,
  setNewArtist,
  inlineNewEntityField,
  setInlineNewEntityField,
  inlineNewEntityValue,
  setInlineNewEntityValue,
  entityDb,
  handleRegisterEntityInDb,
  newFeaturingInput,
  setNewFeaturingInput,
  newFeaturingSplitMode,
  setNewFeaturingSplitMode,
  newDurationFormatted,
  setNewDurationFormatted,
  newGabonTerritoryPct,
  setNewGabonTerritoryPct,
  newAlbum,
  setNewAlbum,
  newBpm,
  setNewBpm,
  newMusicalKey,
  setNewMusicalKey,
  categories,
  customCategoryInput,
  setCustomCategoryInput,
  handleAddCategory,
  newLabelName,
  setNewLabelName,
  newBeatmakerName,
  setNewBeatmakerName,
  newRecordingEngineerName,
  setNewRecordingEngineerName,
  newMixingEngineerName,
  setNewMixingEngineerName,
  newSoundEngineerName,
  setNewSoundEngineerName,
  newMasteringEngineerName,
  setNewMasteringEngineerName,
  newLyricistName,
  setNewLyricistName,
  newIsExternalLyricist,
  setNewIsExternalLyricist,
  newDropContentId,
  newAudioCodec,
  newMeasuredLufs,
  parsedNewDuration,
  toggleUploadDropPreview,
  isPreviewingUploadDrop,
  uploadPreviewTime,
  newDropStart,
  setNewDropStart,
  newDropDuration,
  setNewDropDuration,
  newCopyrightText,
  waveformPeaks,
  handlePublishTrack,
}) => {
  return (
<div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Label */}
              <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#F5F2EB] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#DE1B34]" />
                    <span>Label Producteur *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (newLabelName.trim()) {
                        handleRegisterEntityInDb('labels', newLabelName);
                      }
                    }}
                    className="text-[10px] font-bold text-emerald-400 hover:underline"
                  >
                    + Sauver en BDD
                  </button>
                </div>
                <select
                  value={entityDb.labels.includes(newLabelName) ? newLabelName : ''}
                  onChange={(e) => {
                    if (e.target.value) setNewLabelName(e.target.value);
                  }}
                  className="w-full bg-[#0D1017] border border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                >
                  <option value="">
                    Choisir un Label existant ({entityDb.labels.length})
                  </option>
                  {entityDb.labels.map((lbl) => (
                    <option key={lbl} value={lbl}>
                      {lbl}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Ou saisir un nouveau label..."
                  className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-[#F5F2EB]"
                />
              </div>

              {/* Beatmaker */}
              <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#F5F2EB] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Beatmaker / Compositeur *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (newBeatmakerName.trim()) {
                        handleRegisterEntityInDb('beatmakers', newBeatmakerName);
                      }
                    }}
                    className="text-[10px] font-bold text-emerald-400 hover:underline"
                  >
                    + Sauver en BDD
                  </button>
                </div>
                <select
                  value={entityDb.beatmakers.includes(newBeatmakerName) ? newBeatmakerName : ''}
                  onChange={(e) => {
                    if (e.target.value) setNewBeatmakerName(e.target.value);
                  }}
                  className="w-full bg-[#0D1017] border border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                >
                  <option value="">
                    Choisir un Beatmaker existant ({entityDb.beatmakers.length})
                  </option>
                  {entityDb.beatmakers.map((bm) => (
                    <option key={bm} value={bm}>
                      {bm}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newBeatmakerName}
                  onChange={(e) => setNewBeatmakerName(e.target.value)}
                  placeholder="Ou saisir un nouveau beatmaker..."
                  className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-[#F5F2EB]"
                />
              </div>
            </div>

            {/* Ingénierie du Son */}
            <div className="bg-[#07080C] border border-amber-500/25 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ingénierie du Son (-14.0 LUFS)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const allEng = [
                      newRecordingEngineerName,
                      newMixingEngineerName || newSoundEngineerName,
                      newMasteringEngineerName,
                    ]
                      .filter(Boolean)
                      .join(', ');
                    if (allEng) handleRegisterEntityInDb('engineers', allEng);
                  }}
                  className="text-[10px] font-bold text-amber-300 hover:underline"
                >
                  + Sauver les ingés en BDD
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {!newIsInstrumental ? (
                  <div className="flex flex-col gap-1">
                    <label className="block text-[10px] font-mono text-[#A3A9BA]">
                      1. Ingé Prise de Voix (Optionnel)
                    </label>
                    <select
                      value={
                        entityDb.engineers.includes(newRecordingEngineerName)
                          ? newRecordingEngineerName
                          : ''
                      }
                      onChange={(e) => {
                        if (e.target.value) setNewRecordingEngineerName(e.target.value);
                      }}
                      className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-[#F5F2EB]"
                    >
                      <option value="">Choisir dans la BDD</option>
                      {entityDb.engineers.map((eng) => (
                        <option key={eng} value={eng}>
                          {eng}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newRecordingEngineerName}
                      onChange={(e) => setNewRecordingEngineerName(e.target.value)}
                      placeholder="Junior Nzeng"
                      className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                    />
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-[#0D1017] border border-white/[0.05] flex flex-col justify-center">
                    <span className="text-[10px] font-mono text-amber-300">
                      1. Ingé Prise de Voix
                    </span>
                    <span className="text-[11px] text-[#A3A9BA] mt-0.5">
                      Désactivé (Titre Instrumental)
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="block text-[10px] font-mono text-amber-300">
                    2. Ingé Mixage *
                  </label>
                  <select
                    value={
                      entityDb.engineers.includes(newMixingEngineerName || newSoundEngineerName)
                        ? newMixingEngineerName || newSoundEngineerName
                        : ''
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        setNewMixingEngineerName(e.target.value);
                        setNewSoundEngineerName(e.target.value);
                      }
                    }}
                    className="w-full bg-[#0D1017] border border-amber-500/30 rounded-lg px-2 py-1 text-[11px] text-[#F5F2EB]"
                  >
                    <option value="">Choisir dans la BDD</option>
                    {entityDb.engineers.map((eng) => (
                      <option key={eng} value={eng}>
                        {eng}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newMixingEngineerName || newSoundEngineerName}
                    onChange={(e) => {
                      setNewMixingEngineerName(e.target.value);
                      setNewSoundEngineerName(e.target.value);
                    }}
                    placeholder="Maître Boussengui (Studio K)"
                    className="w-full bg-[#0D1017] border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="block text-[10px] font-mono text-[#A3A9BA]">
                    3. Ingé Mastering (Optionnel)
                  </label>
                  <select
                    value={
                      entityDb.engineers.includes(newMasteringEngineerName)
                        ? newMasteringEngineerName
                        : ''
                    }
                    onChange={(e) => {
                      if (e.target.value) setNewMasteringEngineerName(e.target.value);
                    }}
                    className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-[#F5F2EB]"
                  >
                    <option value="">Choisir dans la BDD</option>
                    {entityDb.engineers.map((eng) => (
                      <option key={eng} value={eng}>
                        {eng}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newMasteringEngineerName}
                    onChange={(e) => setNewMasteringEngineerName(e.target.value)}
                    placeholder="Samy Master LBV"
                    className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                  />
                </div>
              </div>
            </div>

            {/* Parolier / Auteur */}
            {!newIsInstrumental ? (
              <div className="bg-[#07080C] border border-sky-500/30 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Parolier / Auteur des paroles *</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] font-mono text-sky-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newIsExternalLyricist}
                        onChange={(e) => setNewIsExternalLyricist(e.target.checked)}
                        className="accent-sky-400"
                      />
                      <span>Auteur externe dédié</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (newLyricistName.trim()) {
                          handleRegisterEntityInDb('lyricists', newLyricistName);
                        }
                      }}
                      className="text-[10px] font-bold text-sky-300 hover:underline"
                    >
                      + Sauver en BDD
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={entityDb.lyricists.includes(newLyricistName) ? newLyricistName : ''}
                    onChange={(e) => {
                      if (e.target.value) setNewLyricistName(e.target.value);
                    }}
                    className="w-full bg-[#0D1017] border border-white/[0.1] rounded-xl px-2.5 py-2 text-xs text-[#F5F2EB]"
                  >
                    <option value="">
                      Choisir un Auteur existant ({entityDb.lyricists.length})
                    </option>
                    {entityDb.lyricists.map((lyr) => (
                      <option key={lyr} value={lyr}>
                        {lyr}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newLyricistName}
                    onChange={(e) => setNewLyricistName(e.target.value)}
                    placeholder="Ou saisir un nouvel auteur..."
                    className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                <span>
                  Mode <strong>Instrumental</strong> actif : Aucun auteur/parolier requis pour
                  valider cette étape.
                </span>
                <button
                  type="button"
                  onClick={() => setNewIsInstrumental(false)}
                  className="text-[11px] underline"
                >
                  Rétablir paroles
                </button>
              </div>
            )}

            {!isWizardStep3Valid && (
              <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                Veuillez renseigner le Label, le Beatmaker, l'Ingénieur Mixage
                {!newIsInstrumental ? ' et le Parolier/Auteur' : ''} pour accéder à l'aperçu final.
              </div>
            )}
          </div>
  );
};
