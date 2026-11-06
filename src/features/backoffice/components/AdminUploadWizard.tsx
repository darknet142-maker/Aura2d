import React from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Disc,
  Edit3,
  Headphones,
  Pause,
  Play,
  Plus,
  Shield,
  Sliders,
  Trash2,
  Upload,
} from 'lucide-react';
import { CoverArtwork } from '../../../components/CoverArtwork';
import type { FeaturingSplitMode } from '../../../utils/rankingEngine';
import type { WaveformConcordanceResult } from '../../../services/musicService';
import type { EntityDatabase, Track } from '../../../shared/types/domain.types';
import { formatTime } from '../../../shared/utils/mediaFormatters';

export interface WaveformVerificationReportData {
  candidatePeaks: number[];
  candidateCid: string;
  matchedTrack: Track | null;
  matchedPeaks: number[];
  matchedCid: string;
  concordance: WaveformConcordanceResult;
  isBlocked: boolean;
}

interface AdminUploadWizardProps {
  wizardStep: 1 | 2 | 3 | 4;
  setWizardStep: React.Dispatch<React.SetStateAction<1 | 2 | 3 | 4>>;
  isWizardStep1Valid: boolean;
  isWizardStep2Valid: boolean;
  isWizardStep3Valid: boolean;
  canAccessWizardStep: (step: 1 | 2 | 3 | 4) => boolean;
  uploadSuccess: string | null;
  uploadSourceType: 'FILE' | 'STREAM';
  setUploadSourceType: React.Dispatch<React.SetStateAction<'FILE' | 'STREAM'>>;
  newAudioFileName: string;
  handleAudioFileDrop: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLoadStudioOpusMasterPreset: () => void;
  handleSimulateDuplicateWaveformUpload: (targetExistingTrack?: Track) => void;
  allTracksFlat: Track[];
  newExternalUrl: string;
  setNewExternalUrl: React.Dispatch<React.SetStateAction<string>>;
  isUploadingFile: boolean;
  uploadProgress: number;
  newCoverFileUrl: string;
  newCoverFileName: string;
  handleRemoveNewCover: () => void;
  handleCoverFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  waveformVerificationReport: WaveformVerificationReportData | null;
  handleCancelDuplicateUpload: () => void;
  newIsInstrumental: boolean;
  setNewIsInstrumental: React.Dispatch<React.SetStateAction<boolean>>;
  setNewIsBeatDownloadable: React.Dispatch<React.SetStateAction<boolean>>;
  newCategory: string;
  setNewCategory: React.Dispatch<React.SetStateAction<string>>;
  newTitle: string;
  setNewTitle: React.Dispatch<React.SetStateAction<string>>;
  newArtist: string;
  setNewArtist: React.Dispatch<React.SetStateAction<string>>;
  inlineNewEntityField: string | null;
  setInlineNewEntityField: React.Dispatch<React.SetStateAction<string | null>>;
  inlineNewEntityValue: string;
  setInlineNewEntityValue: React.Dispatch<React.SetStateAction<string>>;
  entityDb: EntityDatabase;
  handleRegisterEntityInDb: (
    category: keyof EntityDatabase,
    rawNames: string,
    silent?: boolean
  ) => void;
  newFeaturingInput: string;
  setNewFeaturingInput: React.Dispatch<React.SetStateAction<string>>;
  newFeaturingSplitMode: FeaturingSplitMode;
  setNewFeaturingSplitMode: React.Dispatch<React.SetStateAction<FeaturingSplitMode>>;
  newDurationFormatted: string;
  setNewDurationFormatted: React.Dispatch<React.SetStateAction<string>>;
  newGabonTerritoryPct: number;
  setNewGabonTerritoryPct: React.Dispatch<React.SetStateAction<number>>;
  newAlbum: string;
  setNewAlbum: React.Dispatch<React.SetStateAction<string>>;
  newBpm: number;
  setNewBpm: React.Dispatch<React.SetStateAction<number>>;
  newMusicalKey: string;
  setNewMusicalKey: React.Dispatch<React.SetStateAction<string>>;
  categories: string[];
  customCategoryInput: string;
  setCustomCategoryInput: React.Dispatch<React.SetStateAction<string>>;
  handleAddCategory: () => void;
  newLabelName: string;
  setNewLabelName: React.Dispatch<React.SetStateAction<string>>;
  newBeatmakerName: string;
  setNewBeatmakerName: React.Dispatch<React.SetStateAction<string>>;
  newRecordingEngineerName: string;
  setNewRecordingEngineerName: React.Dispatch<React.SetStateAction<string>>;
  newMixingEngineerName: string;
  setNewMixingEngineerName: React.Dispatch<React.SetStateAction<string>>;
  newSoundEngineerName: string;
  setNewSoundEngineerName: React.Dispatch<React.SetStateAction<string>>;
  newMasteringEngineerName: string;
  setNewMasteringEngineerName: React.Dispatch<React.SetStateAction<string>>;
  newLyricistName: string;
  setNewLyricistName: React.Dispatch<React.SetStateAction<string>>;
  newIsExternalLyricist: boolean;
  setNewIsExternalLyricist: React.Dispatch<React.SetStateAction<boolean>>;
  newDropContentId: string;
  newAudioCodec: 'OPUS' | 'AAC' | 'WAV';
  newMeasuredLufs: number;
  parsedNewDuration: number;
  toggleUploadDropPreview: () => void;
  isPreviewingUploadDrop: boolean;
  uploadPreviewTime: number;
  newDropStart: number;
  setNewDropStart: React.Dispatch<React.SetStateAction<number>>;
  newDropDuration: number;
  setNewDropDuration: React.Dispatch<React.SetStateAction<number>>;
  newCopyrightText: string;
  waveformPeaks: number[];
  handlePublishTrack: () => void;
}

export const AdminUploadWizard: React.FC<AdminUploadWizardProps> = ({
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
    <div className="flex-1 w-full overflow-y-auto flex flex-col gap-3 pr-0.5">
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2 bg-[#0D1017] border border-white/[0.08] rounded-2xl p-2 shrink-0">
        {(
          [
            { step: 1, title: '1. Audio Opus & Cover', valid: isWizardStep1Valid },
            { step: 2, title: '2. Artiste & Infos', valid: isWizardStep2Valid },
            { step: 3, title: '3. Crédits & Équipe', valid: isWizardStep3Valid },
            { step: 4, title: '4. Aperçu & Publication', valid: true },
          ] as const
        ).map((s) => {
          const unlocked = canAccessWizardStep(s.step);
          return (
            <button
              key={s.step}
              type="button"
              disabled={!unlocked}
              onClick={() => {
                if (unlocked) setWizardStep(s.step);
              }}
              className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-semibold text-center leading-tight transition-all flex items-center justify-center gap-1.5 border ${
                wizardStep === s.step
                  ? 'bg-[#DE1B34] border-[#DE1B34] text-white font-extrabold shadow-md shadow-[#DE1B34]/20'
                  : unlocked && s.valid && s.step < 4
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                    : unlocked
                      ? 'bg-[#07080C] border-white/[0.08] text-[#F5F2EB] hover:border-white/20'
                      : 'bg-white/[0.02] border-white/[0.04] text-[#8E93A4]/40 cursor-not-allowed'
              }`}
            >
              {unlocked && s.valid && s.step < 4 && (
                <Check className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{s.title}</span>
            </button>
          );
        })}
      </div>

      {uploadSuccess && (
        <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{uploadSuccess}</span>
        </div>
      )}

      <div className="flex-1 w-full bg-[#0D1017] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between gap-4">
        {wizardStep === 1 && (
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
                          : 'text-[#8E93A4]'
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
                          : 'text-[#8E93A4]'
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={handleLoadStudioOpusMasterPreset}
                          className="py-2 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Master Opus Unique (Test)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulateDuplicateWaveformUpload(allTracksFlat[0])}
                          className="py-2 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
                        >
                          <Shield className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Tester Doublon (&ge;85% Onde)</span>
                        </button>
                      </div>
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
                      <Disc className="w-6 h-6 text-[#8E93A4]/40" />
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
                    {waveformVerificationReport.isBlocked ? (
                      <button
                        type="button"
                        onClick={handleCancelDuplicateUpload}
                        className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-[11px] font-bold transition"
                      >
                        Annuler le téléversement &amp; Réinitialiser
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleSimulateDuplicateWaveformUpload(
                            waveformVerificationReport.matchedTrack || allTracksFlat[0]
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-rose-500/20 border border-white/10 text-[10px] font-mono text-zinc-300 hover:text-rose-200 transition"
                      >
                        Simuler un doublon (&ge;85%)
                      </button>
                    )}
                  </div>
                </div>

                {/* Détails de l'analyse spectrale et de forme d'onde 64 bandes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[#8E93A4] block text-[10px]">
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
                  <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Similarité Cosinus (64 bandes)
                    </span>
                    <span className="font-mono text-sm font-bold text-white">
                      {waveformVerificationReport.concordance.cosineSimilarityPct}%
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Corrélation d’Enveloppe RMS
                    </span>
                    <span className="font-mono text-sm font-bold text-amber-300">
                      {waveformVerificationReport.concordance.envelopeCorrelationPct}%
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[#8E93A4] block text-[10px]">Proximité Temporelle</span>
                    <span className="font-mono text-sm font-bold text-cyan-300">
                      {waveformVerificationReport.concordance.durationProximityPct}%
                    </span>
                  </div>
                </div>

                {/* Superposition visuelle des 64 bandes d'onde */}
                <div className="bg-black/50 border border-white/[0.07] rounded-xl p-2.5 flex flex-col gap-1.5">
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
        )}

        {wizardStep === 2 && (
          <div className="flex flex-col gap-3">
            {/* Sélecteur Type d'œuvre */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-amber-300">
                  Nature de la publication : Chanson Vocale ou Beat / Instrumentale
                </div>
                <div className="text-[11px] text-[#8E93A4]">
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
                      : 'bg-[#07080C] border-white/10 text-[#8E93A4]'
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
                <label className="block text-[11px] text-[#8E93A4] mb-1">
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
                  <label className="text-[11px] text-[#8E93A4]">Artiste Principal *</label>
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
                  <label className="text-[11px] text-violet-300">
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
                    className="bg-[#07080C] border border-violet-500/30 rounded-lg px-2 py-0.5 text-[10px] text-violet-200"
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
                  className="w-full bg-[#07080C] border border-violet-500/30 rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-violet-300 mb-1">
                  Contrat de Partage Featuring
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewFeaturingSplitMode('70_30')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-mono border transition-colors ${
                      newFeaturingSplitMode === '70_30'
                        ? 'bg-violet-500/20 border-violet-500/50 text-violet-200 font-bold'
                        : 'bg-[#07080C] border-white/[0.08] text-[#8E93A4]'
                    }`}
                  >
                    70% Lead / 30% Feat
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFeaturingSplitMode('50_50')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-mono border transition-colors ${
                      newFeaturingSplitMode === '50_50'
                        ? 'bg-violet-500/20 border-violet-500/50 text-violet-200 font-bold'
                        : 'bg-[#07080C] border-white/[0.08] text-[#8E93A4]'
                    }`}
                  >
                    50% / 50% Co-Lead
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#8E93A4] mb-1">
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
                <label className="block text-[11px] text-[#8E93A4] mb-1">
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-amber-300 mb-1">Tempo (BPM)</label>
                  <input
                    type="number"
                    min={60}
                    max={220}
                    value={newBpm}
                    onChange={(e) => setNewBpm(Number(e.target.value) || 120)}
                    className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-cyan-300 mb-1">Tonalité (Key)</label>
                  <input
                    type="text"
                    value={newMusicalKey}
                    onChange={(e) => setNewMusicalKey(e.target.value)}
                    placeholder="Fa# Mineur (F#m)"
                    className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-cyan-200"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-2">
              <span className="text-[11px] text-[#8E93A4]">
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
                        : 'bg-[#0D1017] text-[#8E93A4]'
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
                Veuillez renseigner le Titre et l'Artiste Principal pour débloquer l'étape 3.
              </div>
            )}
          </div>
        )}

        {wizardStep === 3 && (
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
                    <label className="block text-[10px] font-mono text-[#8E93A4]">
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
                    <span className="text-[11px] text-[#8E93A4] mt-0.5">
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
                  <label className="block text-[10px] font-mono text-[#8E93A4]">
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
        )}

        {wizardStep === 4 && (
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
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8E93A4]">
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
              <div className="rounded-xl bg-black/45 border border-white/[0.08] p-3 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold border-b border-white/[0.06] pb-1.5">
                  1. Source Audio, Empreinte d’Onde, Content ID &amp; Cover (Étape 1)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Type de Source &amp; Fichier Audio
                    </span>
                    <span className="font-mono font-semibold text-white break-all block mt-0.5">
                      {uploadSourceType === 'FILE'
                        ? newAudioFileName || 'Master Studio Opus'
                        : `Flux Externe : ${newExternalUrl}`}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Identifiant Acoustique Unique (DROP Content ID)
                    </span>
                    <span className="font-mono font-bold text-cyan-300 break-all block mt-0.5">
                      {newDropContentId || 'DROP-CID-241-AUTO'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
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
                    <span className="text-[#8E93A4] block text-[10px]">
                      Codec &amp; Normalisation Broadcast
                    </span>
                    <span className="font-mono font-semibold text-white block mt-0.5">
                      Conteneur {newAudioCodec} • Mesuré {newMeasuredLufs.toFixed(1)} LUFS → Aligné
                      -14.0 LUFS
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
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
                    <span className="text-[#8E93A4] block text-[10px]">
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
              <div className="rounded-xl bg-black/45 border border-white/[0.08] p-3 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold border-b border-white/[0.06] pb-1.5">
                  2. Identité Artistique, Featurings, Genre &amp; Paramètres Musicaux (Étape 2)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Titre Complet de l’Œuvre
                    </span>
                    <span className="font-semibold text-white break-words block mt-0.5">
                      {newTitle}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Nature de la Publication
                    </span>
                    <span className="font-semibold text-amber-300 block mt-0.5">
                      {newIsInstrumental
                        ? 'Beat / Instrumentale Téléchargeable (Sans voix)'
                        : 'Chanson Vocale Officielle'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Artiste Principal (Lead)
                    </span>
                    <span className="font-semibold text-white break-words block mt-0.5">
                      {newArtist}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Artistes en Featuring (Intégral)
                    </span>
                    <span className="font-semibold text-violet-300 break-words block mt-0.5">
                      {newFeaturingInput.trim() || 'Aucun featuring (Titre Solo)'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Contrat de Répartition Featuring
                    </span>
                    <span className="font-mono font-semibold text-violet-200 block mt-0.5">
                      {newFeaturingSplitMode === '50_50'
                        ? '50% / 50% (Duo Co-Lead)'
                        : '70% Lead / 30% Featuring (Classique)'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Projet / Album de rattachement
                    </span>
                    <span className="font-semibold text-white break-words block mt-0.5">
                      {newAlbum.trim() || `${newArtist.trim()} — Studio Session`}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Genre / Catégorie Musicale
                    </span>
                    <span className="font-semibold text-[#DE1B34] block mt-0.5">
                      {newCategory}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Tempo (BPM) &amp; Tonalité Musicale
                    </span>
                    <span className="font-mono font-semibold text-cyan-300 block mt-0.5">
                      {newBpm} BPM • {newMusicalKey || 'Do Mineur (Cm)'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Quota Écoutes Territoire Gabon (+241)
                    </span>
                    <span className="font-mono font-bold text-emerald-400 block mt-0.5">
                      {newGabonTerritoryPct}% (Éligible Certifications Nationales ≥ 70%)
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3 */}
              <div className="rounded-xl bg-black/45 border border-white/[0.08] p-3 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold border-b border-white/[0.06] pb-1.5">
                  3. Crédits Studio Intégraux, Ingénierie du Son, Plume &amp; Droits (Étape 3)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">Label Producteur</span>
                    <span className="font-semibold text-white break-words block mt-0.5">
                      {newLabelName}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Beatmaker / Compositeur (100% Prod)
                    </span>
                    <span className="font-semibold text-emerald-300 break-words block mt-0.5">
                      {newBeatmakerName}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
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
                    <span className="text-[#8E93A4] block text-[10px]">
                      Ingénieur Mixage (50% Son)
                    </span>
                    <span className="font-semibold text-amber-300 break-words block mt-0.5">
                      {newMixingEngineerName.trim() || newSoundEngineerName.trim()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Ingénieur Mastering -14.0 LUFS (30% Son)
                    </span>
                    <span className="font-semibold text-amber-200 break-words block mt-0.5">
                      {newMasteringEngineerName.trim() ||
                        newMixingEngineerName.trim() ||
                        newSoundEngineerName.trim()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Parolier / Auteur de l’Œuvre (Plume)
                    </span>
                    <span className="font-semibold text-sky-300 break-words block mt-0.5">
                      {newIsInstrumental ? 'Instrumental (Sans paroles)' : newLyricistName}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05]">
                    <span className="text-[#8E93A4] block text-[10px]">Statut Plume Externe</span>
                    <span className="font-mono font-semibold text-sky-200 block mt-0.5">
                      {newIsInstrumental
                        ? 'Non applicable (Instrumental)'
                        : newIsExternalLyricist
                          ? 'Oui (Bonus Plume Externe x1.25 actif)'
                          : 'Non (Auteur-Interprète)'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B0E16] border border-white/[0.05] sm:col-span-2">
                    <span className="text-[#8E93A4] block text-[10px]">
                      Mention Légale Copyright &amp; Registre Handshake
                    </span>
                    <span className="font-mono text-zinc-200 break-words block mt-0.5">
                      {newCopyrightText.trim() ||
                        `Copyright 2026 ${newLabelName || 'Direct Prod Gabon'} (+241). Tous droits réservés • Handshake Studio Vérifié`}
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
                  <div className="flex justify-between text-[11px] text-[#8E93A4] mb-1">
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
                  <div className="flex justify-between text-[11px] text-[#8E93A4] mb-1">
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
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.07]">
          <button
            type="button"
            onClick={() =>
              setWizardStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev))
            }
            disabled={wizardStep === 1}
            className="px-3.5 py-2 rounded-xl bg-white/[0.05] text-xs text-[#F5F2EB] disabled:opacity-30 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Précédent</span>
          </button>

          {wizardStep < 4 ? (
            <button
              type="button"
              disabled={
                (wizardStep === 1 && !isWizardStep1Valid) ||
                (wizardStep === 2 && !isWizardStep2Valid) ||
                (wizardStep === 3 && !isWizardStep3Valid)
              }
              onClick={() => {
                const nextStep = (wizardStep + 1) as 1 | 2 | 3 | 4;
                if (canAccessWizardStep(nextStep)) {
                  setWizardStep(nextStep);
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#DE1B34] text-white font-bold text-xs flex items-center gap-1 disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <span>
                {wizardStep === 3 ? 'Prévisualiser le résumé complet' : 'Étape suivante'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublishTrack}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07080C] font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ Publier et mettre en ligne</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
