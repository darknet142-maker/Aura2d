import React from 'react';
import {
  Building2, Check, CheckCircle2, Disc, Edit3, Headphones, Pause,
  Play, Shield, Sliders, Trash2, Upload,
} from 'lucide-react';
import { CoverArtwork } from '../../../../components/CoverArtwork';
import { formatTime } from '../../../../shared/utils/mediaFormatters';
import { AnalysisStatus } from '../../../music-intelligence';
import type { AdminUploadWizardProps } from './uploadWizard.types';

export const UploadStep1AudioCover: React.FC<AdminUploadWizardProps> = ({
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
  isAnalyzingAudio,
  handleReanalyzeAudio,
  handleCancelAudioAnalysis,
  handlePublishTrack,
}) => {
  return (
<div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#DE1B34]">
                    1. Source Audio (Conversion Opus -14.0 LUFS obligatoire) *
                  </span>
                  <div className="flex bg-[#07080C] p-0.5 rounded-lg border border-white/[0.07] text-[11px]">
                    <button
                      type="button"
                      onClick={() => setUploadSourceType('FILE')}
                      className={`px-2 py-0.5 rounded ${
                        uploadSourceType === 'FILE'
                          ? 'bg-[#DE1B34] text-white font-semibold'
                          : 'text-[#A3A9BA]'
                      }`}
                    >
                      Fichier
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadSourceType('STREAM')}
                      className={`px-2 py-0.5 rounded ${
                        uploadSourceType === 'STREAM'
                          ? 'bg-[#DE1B34] text-white font-semibold'
                          : 'text-[#A3A9BA]'
                      }`}
                    >
                      Flux Externe
                    </button>
                  </div>
                </div>

                {uploadSourceType === 'FILE' ? (
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col items-center justify-center border border-dashed border-white/15 rounded-xl p-5 cursor-pointer hover:border-[#DE1B34]/60 bg-[#07080C]/60 text-center">
                      <Upload className="w-5 h-5 text-[#DE1B34] mb-1.5" />
                      <span className="text-xs font-medium text-[#F5F2EB] truncate max-w-full px-2">
                        {newAudioFileName ||
                          'Importer un fichier audio (WAV, MP3, FLAC → converti en .opus)'}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono mt-1">
                        Conversion automatique en OPUS • Volume constant -14.0 LUFS
                      </span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioFileDrop}
                        className="hidden"
                      />
                    </label>
                    {!newAudioFileName && (
                      <p className="text-[10px] text-zinc-500 font-mono text-center">
                        Formats acceptés : WAV, MP3, FLAC, AAC, OPUS • Analyse spectrale automatique
                      </p>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={newExternalUrl}
                    onChange={(e) => setNewExternalUrl(e.target.value)}
                    placeholder="Lien ou ID du flux audio externe..."
                    className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-[#F5F2EB]"
                  />
                )}

                {(isUploadingFile || uploadProgress > 0) && (
                  <div className="bg-[#07080C] border border-white/[0.08] rounded-xl p-2.5">
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-emerald-400">
                        Encodage OPUS, Empreinte d’Onde &amp; Content ID DROP
                      </span>
                      <span className="text-[#DE1B34]">{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        style={{ width: `${uploadProgress}%` }}
                        className="h-full bg-emerald-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">
                    2. Pochette / Cover Officielle
                  </span>
                  {newCoverFileUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveNewCover}
                      className="text-[11px] text-rose-400 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Supprimer</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-[#07080C] border border-white/[0.07] rounded-xl p-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden cover-card-bevel cover-gloss-sheen bg-[#12151F] shrink-0 flex items-center justify-center">
                    {newCoverFileUrl ? (
                      <img
                        src={newCoverFileUrl}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Disc className="w-6 h-6 text-[#A3A9BA]/40" />
                    )}
                  </div>

                  <label className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs font-semibold text-[#F5F2EB] cursor-pointer text-center truncate">
                    {newCoverFileName || 'Importer Cover'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300 flex items-center justify-between">
                  <span>Format de sortie :</span>
                  <span className="font-mono font-bold">OPUS • -14.0 LUFS Uniforme</span>
                </div>
              </div>
            </div>

            {/* STATUT DU MOTEUR D'INTELLIGENCE MUSICALE & BPM SUR LE FICHIER IMPORTÉ */}
            {(newAudioFileName || currentTrackAnalysis || isAnalyzingAudio) && (
              <AnalysisStatus
                analysis={
                  currentTrackAnalysis ||
                  (isAnalyzingAudio
                    ? {
                        detectedBpm: null,
                        confirmedBpm: null,
                        alternativeBpms: [],
                        bpmConfidence: null,
                        detectedKey: null,
                        confirmedKey: null,
                        mode: null,
                        energy: null,
                        danceability: null,
                        beatPositions: [],
                        durationSec: 0,
                        analysisStatus: 'processing',
                        algorithmVersion: 'essentia-multiband-v2.4',
                        analyzedAt: null,
                      }
                    : null)
                }
                onReanalyze={handleReanalyzeAudio}
                onCancel={handleCancelAudioAnalysis}
              />
            )}

            {/* ÉTAPE DE VÉRIFICATION OBLIGATOIRE DE LA FORME D'ONDE & ATTRIBUTION DU CONTENT ID DROP */}
            {waveformVerificationReport && (
              <div
                className={`rounded-2xl p-3.5 border flex flex-col gap-3 ${
                  waveformVerificationReport.isBlocked
                    ? 'bg-rose-950/35 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
                    : 'bg-[#070B12] border-cyan-500/35'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        waveformVerificationReport.isBlocked
                          ? 'bg-rose-500 text-white'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {waveformVerificationReport.isBlocked ? (
                        'BLOCAGE AUTOMATIQUE (CONCORDANCE ≥ 85%)'
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>EMPREINTE D’ONDE UNIQUE VALIDÉE (&lt; 85%)</span>
                        </span>
                      )}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold">
                      {waveformVerificationReport.candidateCid}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {waveformVerificationReport.isBlocked && (
                      <button
                        type="button"
                        onClick={handleCancelDuplicateUpload}
                        className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-[11px] font-bold transition"
                      >
                        Annuler le téléversement &amp; Réinitialiser
                      </button>
                    )}
                  </div>
                </div>

                {/* Détails de l'analyse spectrale et de forme d'onde 64 bandes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-[#07090E]/40 border border-white/[0.06]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Concordance Globale d’Onde
                    </span>
                    <span
                      className={`font-mono text-sm font-extrabold ${
                        waveformVerificationReport.isBlocked ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {waveformVerificationReport.concordance.similarityPct}%{' '}
                      <span className="text-[10px] font-normal text-zinc-400">
                        (Seuil max: 85%)
                      </span>
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#07090E]/40 border border-white/[0.06]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Similarité Cosinus (64 bandes)
                    </span>
                    <span className="font-mono text-sm font-bold text-white">
                      {waveformVerificationReport.concordance.cosineSimilarityPct}%
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#07090E]/40 border border-white/[0.06]">
                    <span className="text-[#A3A9BA] block text-[10px]">
                      Corrélation d’Enveloppe RMS
                    </span>
                    <span className="font-mono text-sm font-bold text-amber-300">
                      {waveformVerificationReport.concordance.envelopeCorrelationPct}%
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#07090E]/40 border border-white/[0.06]">
                    <span className="text-[#A3A9BA] block text-[10px]">Proximité Temporelle</span>
                    <span className="font-mono text-sm font-bold text-cyan-300">
                      {waveformVerificationReport.concordance.durationProximityPct}%
                    </span>
                  </div>
                </div>

                {/* Superposition visuelle des 64 bandes d'onde */}
                <div className="bg-[#07090E]/50 border border-white/[0.07] rounded-xl p-2.5 flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="text-cyan-300">
                      ■ Onde Téléversée ({waveformVerificationReport.candidateCid})
                    </span>
                    {waveformVerificationReport.matchedTrack && (
                      <span
                        className={
                          waveformVerificationReport.isBlocked
                            ? 'text-rose-400 font-bold'
                            : 'text-zinc-400'
                        }
                      >
                        ■ Plus proche dans le catalogue : «{' '}
                        {waveformVerificationReport.matchedTrack.title} » —{' '}
                        {waveformVerificationReport.matchedTrack.artist} (
                        {waveformVerificationReport.matchedCid})
                      </span>
                    )}
                  </div>

                  <div className="relative h-12 w-full flex items-end gap-[2px] px-1 pt-1">
                    {waveformVerificationReport.candidatePeaks.map((pk, idx) => {
                      const refPk = waveformVerificationReport.matchedPeaks[idx] ?? 0.3;
                      return (
                        <div
                          key={idx}
                          className="flex-1 h-full flex items-end justify-center relative"
                        >
                          <div
                            style={{ height: `${Math.round(refPk * 95)}%` }}
                            className={`w-full rounded-t opacity-45 ${
                              waveformVerificationReport.isBlocked ? 'bg-rose-500' : 'bg-zinc-600'
                            }`}
                          />
                          <div
                            style={{ height: `${Math.round(pk * 95)}%` }}
                            className={`w-2/3 rounded-t absolute bottom-0 ${
                              waveformVerificationReport.isBlocked ? 'bg-amber-300' : 'bg-cyan-400'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {waveformVerificationReport.isBlocked &&
                  waveformVerificationReport.matchedTrack && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex flex-col gap-1.5">
                      <div className="font-bold text-rose-300 flex items-center justify-between">
                        <span>
                          Rapport de Concordance Positif : Téléversement annulé et verrouillé
                        </span>
                        <span className="font-mono">
                          {waveformVerificationReport.concordance.similarityPct}% de concordance
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        L’empreinte acoustique de ce fichier concorde à{' '}
                        <strong>{waveformVerificationReport.concordance.similarityPct}%</strong> avec
                        le titre déjà présent sur la plateforme :{' '}
                        <strong className="text-white">
                          « {waveformVerificationReport.matchedTrack.title} »
                        </strong>{' '}
                        de{' '}
                        <strong className="text-amber-300">
                          {waveformVerificationReport.matchedTrack.artist}
                        </strong>{' '}
                        (Album : <em>{waveformVerificationReport.matchedTrack.album}</em> • ID :{' '}
                        <code className="text-cyan-300">
                          {waveformVerificationReport.matchedCid}
                        </code>
                        ). Conformément à la politique d’unicité DROP Content ID, aucun doublon ne
                        peut être publié.
                      </p>
                    </div>
                  )}
              </div>
            )}

            {!isWizardStep1Valid && !waveformVerificationReport?.isBlocked && (
              <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                Veuillez sélectionner un fichier audio (ou charger un master Opus de test) pour
                lancer la vérification d’onde Content ID et débloquer l’étape 2.
              </div>
            )}
          </div>
  );
};
