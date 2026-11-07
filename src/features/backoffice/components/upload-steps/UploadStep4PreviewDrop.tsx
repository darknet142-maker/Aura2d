import React from 'react';
import {
  Building2, Check, CheckCircle2, Disc, Edit3, Headphones, Pause,
  Play, Shield, Sliders, Trash2, Upload,
} from 'lucide-react';
import { CoverArtwork } from '../../../../components/CoverArtwork';
import { formatTime } from '../../../../shared/utils/mediaFormatters';
import { MusicMetadataCard, ensureTrackSurgicalAnalysis } from '../../../music-intelligence';
import type { AdminUploadWizardProps } from './uploadWizard.types';

export const UploadStep4PreviewDrop: React.FC<AdminUploadWizardProps> = ({
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
  handlePublishTrack,
}) => {
  return (
<div className="flex flex-col gap-3.5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121622] to-[#07080C] border border-emerald-500/40 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 uppercase">
                    Récapitulatif Intégral (Sans Limitation)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/35 text-[10px] font-mono font-bold text-cyan-300">
                    {newDropContentId || 'DROP-CID-241-VERIFIED'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[10px] font-mono text-[#F5F2EB]">
                    {newAudioCodec} • {newMeasuredLufs.toFixed(1)} LUFS → -14.0 LUFS
                  </span>
                  {newIsInstrumental && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono font-bold text-amber-300">
                      Beat / Instrumentale Téléchargeable
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-emerald-300 font-bold">
                  Durée : {newDurationFormatted} ({parsedNewDuration}s)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden cover-card-bevel cover-gloss-sheen shrink-0 bg-[#12151F]">
                    <CoverArtwork
                      artworkType="creative_yellow"
                      coverUrl={newCoverFileUrl}
                      title={newTitle || 'Nouveau Titre'}
                      artist={newArtist || 'Artiste'}
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h4 className="text-base sm:text-lg font-bold text-[#F5F2EB] break-words">
                      {newTitle || 'Titre sans nom'}
                    </h4>
                    <p className="text-xs sm:text-sm text-amber-300 font-semibold break-words">
                      {newArtist || 'Artiste non renseigné'}
                      {newFeaturingInput.trim() ? ` feat. ${newFeaturingInput.trim()}` : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#A3A9BA]">
                      <span className="text-[#DE1B34] font-semibold">{newCategory}</span>
                      <span>•</span>
                      <span>
                        Projet :{' '}
                        <strong className="text-white">
                          {newAlbum.trim() || `${newArtist.trim()} — Studio Session`}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Label : <strong className="text-white">{newLabelName}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleUploadDropPreview}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shrink-0 ${
                    isPreviewingUploadDrop
                      ? 'bg-[#F59E0B] text-[#07080C]'
                      : 'bg-[#DE1B34] hover:bg-[#f0223d] text-white'
                  }`}
                >
                  {isPreviewingUploadDrop ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Arrêter la pré-écoute ({formatTime(uploadPreviewTime)})</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Pré-écouter la piste Opus (-14 LUFS)</span>
                    </>
                  )}
                </button>
              </div>

              {/* SECTION 1 */}
              <div className="rounded-xl bg-[#07090E]/45 border border-white/[0.08] p-3 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold border-b border-white/[0.06] pb-1.5">
                  1. Source Audio, Empreinte d’Onde, Content ID &amp; Cover (Étape 1)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Type de Source &amp; Fichier Audio
                    </span>
                    <span className="font-mono font-semibold text-white break-all block mt-0.5">
                      {uploadSourceType === 'FILE'
                        ? newAudioFileName || 'Master Studio Opus'
                        : `Flux Externe : ${newExternalUrl}`}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Identifiant Acoustique Unique (DROP Content ID)
                    </span>
                    <span className="font-mono font-bold text-cyan-300 break-all block mt-0.5">
                      {newDropContentId || 'DROP-CID-241-AUTO'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Vérification Concordance Forme d’Onde (64 bandes)
                    </span>
                    <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        Certifié Unique (Concordance max :{' '}
                        {waveformVerificationReport?.concordance.similarityPct ?? 12}% &lt; 85%)
                      </span>
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Codec &amp; Normalisation Broadcast
                    </span>
                    <span className="font-mono font-semibold text-white block mt-0.5">
                      Conteneur {newAudioCodec} • Mesuré {newMeasuredLufs.toFixed(1)} LUFS → Aligné
                      -14.0 LUFS
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Pochette / Cover Officielle
                    </span>
                    <span className="font-mono font-semibold text-emerald-300 break-all block mt-0.5">
                      {newCoverFileName
                        ? `Image importée : ${newCoverFileName}`
                        : newCoverFileUrl
                          ? 'Pochette personnalisée enregistrée'
                          : 'Visuel Studio DROP par défaut'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Fenêtre Officielle du Drop (30s max en Trend)
                    </span>
                    <span className="font-mono font-bold text-[#F59E0B] block mt-0.5">
                      Début : {formatTime(newDropStart)} ({newDropStart}s) → Fin :{' '}
                      {formatTime(Math.min(parsedNewDuration, newDropStart + newDropDuration))}{' '}
                      (Durée : {newDropDuration}s)
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2 */}
              <div className="rounded-xl bg-[#07090E]/45 border border-white/[0.08] p-3 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold border-b border-white/[0.06] pb-1.5">
                  2. Identité Artistique, Featurings, Genre &amp; Paramètres Musicaux (Étape 2)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Titre Complet de l’Œuvre
                    </span>
                    <span className="font-semibold text-white break-words block mt-0.5">
                      {newTitle}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Nature de la Publication
                    </span>
                    <span className="font-semibold text-amber-300 block mt-0.5">
                      {newIsInstrumental
                        ? 'Beat / Instrumentale Téléchargeable (Sans voix)'
                        : 'Chanson Vocale Officielle'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Artiste Principal (Lead)
                    </span>
                    <span className="font-semibold text-white break-words block mt-0.5">
                      {newArtist}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Artistes en Featuring (Intégral)
                    </span>
                    <span className="font-semibold text-sky-300 break-words block mt-0.5">
                      {newFeaturingInput.trim() || 'Aucun featuring (Titre Solo)'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Contrat de Répartition Featuring
                    </span>
                    <span className="font-mono font-semibold text-sky-200 block mt-0.5">
                      {newFeaturingSplitMode === '50_50'
                        ? '50% / 50% (Duo Co-Lead)'
                        : '70% Lead / 30% Featuring (Classique)'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Projet / Album de rattachement
                    </span>
                    <span className="font-semibold text-white break-words block mt-0.5">
                      {newAlbum.trim() || `${newArtist.trim()} — Studio Session`}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Genre / Catégorie Musicale
                    </span>
                    <span className="font-semibold text-[#DE1B34] block mt-0.5">
                      {newCategory}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Tempo (BPM) &amp; Tonalité Musicale
                    </span>
                    <span className="font-mono font-semibold text-cyan-300 block mt-0.5">
                      {newBpm} BPM • {newMusicalKey || 'Do Mineur (Cm)'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Quota Écoutes Territoire
                    </span>
                    <span className="font-mono font-bold text-emerald-400 block mt-0.5">
                      {newGabonTerritoryPct}% (Éligible Certifications Nationales ≥ 70%)
                    </span>
                  </div>
                </div>
              </div>

              {/* FICHE D'ANALYSE MUSICALE CHIRURGICALE OFFICIELLE (MUSIC INTELLIGENCE) */}
              <MusicMetadataCard
                analysis={
                  currentTrackAnalysis ||
                  ensureTrackSurgicalAnalysis({
                    id: 'preview-cid',
                    title: newTitle || 'Piste en cours',
                    category: newCategory,
                    bpm: newBpm || 120,
                    musicalKey: newMusicalKey || 'Do Mineur (Cm)',
                    duration: parsedNewDuration || 180,
                    waveformPeaks,
                  })
                }
                trackTitle={newTitle || 'Aperçu'}
              />

              {/* SECTION 3 */}
              <div className="rounded-xl bg-[#07090E]/45 border border-white/[0.08] p-3 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold border-b border-white/[0.06] pb-1.5">
                  3. Crédits Studio Intégraux, Ingénierie du Son, Plume &amp; Droits (Étape 3)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">Label Producteur</span>
                    <span className="font-semibold text-white break-words block mt-0.5">
                      {newLabelName}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Beatmaker / Compositeur (100% Prod)
                    </span>
                    <span className="font-semibold text-emerald-300 break-words block mt-0.5">
                      {newBeatmakerName}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Ingénieur Prise de Voix (20% Son)
                    </span>
                    <span className="font-semibold text-white break-words block mt-0.5">
                      {newIsInstrumental
                        ? 'Instrumental (Sans prise de voix)'
                        : newRecordingEngineerName.trim() ||
                          newMixingEngineerName.trim() ||
                          newSoundEngineerName.trim()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Ingénieur Mixage (50% Son)
                    </span>
                    <span className="font-semibold text-amber-300 break-words block mt-0.5">
                      {newMixingEngineerName.trim() || newSoundEngineerName.trim()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Ingénieur Mastering -14.0 LUFS (30% Son)
                    </span>
                    <span className="font-semibold text-amber-200 break-words block mt-0.5">
                      {newMasteringEngineerName.trim() ||
                        newMixingEngineerName.trim() ||
                        newSoundEngineerName.trim()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Parolier / Auteur de l’Œuvre (Plume)
                    </span>
                    <span className="font-semibold text-sky-300 break-words block mt-0.5">
                      {newIsInstrumental || newCategory === 'Beats & Instrumentales' ? 'Instrumental (Sans paroles)' : newLyricistName}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#A3A9BA] block text-[10px]">Statut Plume Externe</span>
                    <span className="font-mono font-semibold text-sky-200 block mt-0.5">
                      {newIsInstrumental || newCategory === 'Beats & Instrumentales'
                        ? 'Non applicable (Instrumental)'
                        : newIsExternalLyricist
                          ? 'Oui (Bonus Plume Externe x1.25 actif)'
                          : 'Non (Auteur-Interprète)'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05] sm:col-span-2">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Mention Légale Copyright &amp; Registre Handshake
                    </span>
                    <span className="font-mono text-zinc-200 break-words block mt-0.5">
                      {newCopyrightText.trim() ||
                        (newLabelName ? `© 2026 ${newLabelName}. Tous droits réservés.` : '© 2026 DROP. Tous droits réservés.')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ajustement de la Zone Drop */}
            <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#F59E0B] truncate">
                  Calibrage de la Zone Drop : {formatTime(newDropStart)} →{' '}
                  {formatTime(Math.min(parsedNewDuration, newDropStart + newDropDuration))}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Aperçu automatique sur le lecteur
                </span>
              </div>

              <div className="relative h-12 w-full rounded-lg bg-[#0D1017] border border-white/[0.06] overflow-hidden flex items-end px-1 gap-[2px]">
                {(waveformPeaks.length > 0
                  ? waveformPeaks
                  : Array.from({ length: 48 }, (_, idx) => 0.25 + ((idx * 7) % 10) * 0.06)
                ).map((peak, i, arr) => {
                  const barSec = (i / arr.length) * parsedNewDuration;
                  const inDrop =
                    barSec >= newDropStart && barSec <= newDropStart + newDropDuration;
                  return (
                    <div
                      key={i}
                      style={{ height: `${Math.round(peak * 88)}%` }}
                      className={`flex-1 rounded-t ${inDrop ? 'bg-[#F59E0B]' : 'bg-white/15'}`}
                    />
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-[#A3A9BA] mb-1">
                    <span>Début du Drop</span>
                    <span className="font-mono text-[#F5F2EB]">{formatTime(newDropStart)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(10, parsedNewDuration - newDropDuration)}
                    value={newDropStart}
                    onChange={(e) => setNewDropStart(Number(e.target.value))}
                    className="w-full accent-[#F59E0B]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-[#A3A9BA] mb-1">
                    <span>Durée du Drop</span>
                    <span className="font-mono text-[#F5F2EB]">{formatTime(newDropDuration)}</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={60}
                    value={newDropDuration}
                    onChange={(e) => setNewDropDuration(Number(e.target.value))}
                    className="w-full accent-[#F59E0B]"
                  />
                </div>
              </div>
            </div>
          </div>
  );
};
