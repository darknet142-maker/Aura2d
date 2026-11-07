import React from 'react';
import {
  Building2, Check, CheckCircle2, Disc, Edit3, Headphones, Pause,
  Play, Shield, Sliders, Trash2, Upload,
} from 'lucide-react';
import { CoverArtwork } from '../../../../components/CoverArtwork';
import { formatTime } from '../../../../shared/utils/mediaFormatters';
import { AnalysisReview } from '../../../music-intelligence';
import type { AdminUploadWizardProps } from './uploadWizard.types';

export const UploadStep2ArtistMetadata: React.FC<AdminUploadWizardProps> = ({
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
  currentTrackAnalysis,
  handleConfirmBpm,
  handleConfirmKey,
  handlePublishTrack,
}) => {
  return (
<div className="flex flex-col gap-3">
            {/* Sélecteur Type d'œuvre */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-amber-300">
                  Nature de la publication : Chanson Vocale ou Beat / Instrumentale
                </div>
                <div className="text-[11px] text-[#A3A9BA]">
                  En mode Beat / Instrumentale, le bouton « Télécharger le Beat » est activé dans
                  Central et les champs voix/paroles deviennent facultatifs.
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setNewIsInstrumental(false);
                    setNewIsBeatDownloadable(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    !newIsInstrumental
                      ? 'bg-[#DE1B34] border-[#DE1B34] text-white'
                      : 'bg-[#07080C] border-white/10 text-[#A3A9BA]'
                  }`}
                >
                  Chanson Vocale
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewIsInstrumental(true);
                    setNewIsBeatDownloadable(true);
                    setNewCategory('Beats & Instrumentales');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    newIsInstrumental
                      ? 'bg-amber-400 text-[#07080C] border-amber-300'
                      : 'bg-[#07080C] border-amber-500/40 text-amber-300'
                  }`}
                >
                  Beat / Instrumentale ⬇
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-[#A3A9BA] mb-1">
                  Titre de l'œuvre ou du Beat *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Souverain du Komo / Akanda 808 Beat"
                  className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-[#A3A9BA]">Artiste Principal *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setInlineNewEntityField(
                        inlineNewEntityField === 'artist' ? null : 'artist'
                      );
                      setInlineNewEntityValue('');
                    }}
                    className="text-[10px] font-bold text-emerald-400 hover:underline"
                  >
                    + Nouvel artiste dans la BDD
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={entityDb.artists.includes(newArtist) ? newArtist : ''}
                    onChange={(e) => {
                      if (e.target.value) setNewArtist(e.target.value);
                    }}
                    className="w-1/2 bg-[#07080C] border border-white/[0.1] rounded-xl px-2.5 py-2 text-xs text-[#F5F2EB]"
                  >
                    <option value="">Choisir dans la liste ({entityDb.artists.length})</option>
                    {entityDb.artists.map((art) => (
                      <option key={art} value={art}>
                        {art}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    placeholder="Ou saisir un nom..."
                    className="w-1/2 bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-[#F5F2EB]"
                  />
                </div>
                {inlineNewEntityField === 'artist' && (
                  <div className="flex gap-1.5 mt-1.5">
                    <input
                      type="text"
                      value={inlineNewEntityValue}
                      onChange={(e) => setInlineNewEntityValue(e.target.value)}
                      placeholder="Nom du nouvel artiste à sauvegarder..."
                      className="flex-1 bg-[#07080C] border border-emerald-500/40 rounded-lg px-2.5 py-1 text-xs text-[#F5F2EB]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (inlineNewEntityValue.trim()) {
                          handleRegisterEntityInDb('artists', inlineNewEntityValue);
                          setNewArtist(inlineNewEntityValue.trim());
                          setInlineNewEntityValue('');
                          setInlineNewEntityField(null);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 text-[#07080C] text-xs font-bold"
                    >
                      Sauver
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-sky-300">
                    Artistes en Featuring (optionnel)
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const currentList = newFeaturingInput
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (!currentList.includes(val)) {
                        setNewFeaturingInput([...currentList, val].join(', '));
                      }
                    }}
                    className="bg-[#07080C] border border-sky-500/30 rounded-lg px-2 py-0.5 text-[10px] text-sky-200"
                  >
                    <option value="">+ Ajouter depuis la BDD</option>
                    {entityDb.artists
                      .filter((a) => a !== newArtist)
                      .map((art) => (
                        <option key={art} value={art}>
                          {art}
                        </option>
                      ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={newFeaturingInput}
                  onChange={(e) => setNewFeaturingInput(e.target.value)}
                  placeholder="Ex: Eboloko, Ng Bling"
                  className="w-full bg-[#07080C] border border-sky-500/30 rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-sky-300 mb-1">
                  Contrat de Partage Featuring
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewFeaturingSplitMode('70_30')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-mono border transition-colors ${
                      newFeaturingSplitMode === '70_30'
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-200 font-bold'
                        : 'bg-[#07080C] border-white/[0.08] text-[#A3A9BA]'
                    }`}
                  >
                    70% Lead / 30% Feat
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFeaturingSplitMode('50_50')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-mono border transition-colors ${
                      newFeaturingSplitMode === '50_50'
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-200 font-bold'
                        : 'bg-[#07080C] border-white/[0.08] text-[#A3A9BA]'
                    }`}
                  >
                    50% / 50% Co-Lead
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#A3A9BA] mb-1">
                  Durée totale (MM:SS) *
                </label>
                <input
                  type="text"
                  value={newDurationFormatted}
                  onChange={(e) => setNewDurationFormatted(e.target.value)}
                  placeholder="03:00"
                  className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-[#F59E0B]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-emerald-300 mb-1">
                  Quota Écoutes Territoire Gabon (+241) : {newGabonTerritoryPct}%
                </label>
                <input
                  type="range"
                  min={50}
                  max={99}
                  value={newGabonTerritoryPct}
                  onChange={(e) => setNewGabonTerritoryPct(Number(e.target.value))}
                  className="w-full accent-emerald-400 mt-1.5"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#A3A9BA] mb-1">
                  Projet / Album / Beat Tape
                </label>
                <input
                  type="text"
                  value={newAlbum}
                  onChange={(e) => setNewAlbum(e.target.value)}
                  placeholder="Ex: Bantou Ntcham Vol. 2 / Libreville Beat Tape"
                  className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                />
              </div>
            </div>

            {/* MODULE DE DÉTECTION CHIRURGICALE BPM, CANDIDATS OCTAVE & VALIDATION HUMAINE */}
            <AnalysisReview
              analysis={currentTrackAnalysis || null}
              currentBpm={newBpm}
              currentKey={newMusicalKey || ''}
              onConfirmBpm={(bpm) => {
                if (handleConfirmBpm) {
                  handleConfirmBpm(bpm);
                } else {
                  setNewBpm(bpm);
                }
              }}
              onConfirmKey={(key) => {
                if (handleConfirmKey) {
                  handleConfirmKey(key);
                } else {
                  setNewMusicalKey(key);
                }
              }}
            />

            <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-2">
              <span className="text-[11px] text-[#A3A9BA]">
                Genre / Identité Musicale Gabonaise *
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs ${
                      newCategory === cat
                        ? 'bg-[#DE1B34] text-white font-bold'
                        : 'bg-[#0D1017] text-[#A3A9BA]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  placeholder="Nouveau genre (ex: Ikokou Moderne, Afro-Trap LBV)..."
                  className="flex-1 min-w-0 bg-[#0D1017] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-[#F5F2EB]"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-xs text-[#F5F2EB] shrink-0"
                >
                  + Ajouter
                </button>
              </div>
            </div>

            {!isWizardStep2Valid && (
              <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                Veuillez renseigner le Titre, l&apos;Artiste Principal et confirmer un BPM chirurgical valide (zéro BPM fictif par défaut) pour débloquer l&apos;étape 3.
              </div>
            )}
          </div>
  );
};
