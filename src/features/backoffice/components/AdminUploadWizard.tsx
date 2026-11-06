import React from 'react';
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { AdminUploadWizardProps, WaveformVerificationReportData } from './upload-steps/uploadWizard.types';
import { UploadStep1AudioCover } from './upload-steps/UploadStep1AudioCover';
import { UploadStep2ArtistMetadata } from './upload-steps/UploadStep2ArtistMetadata';
import { UploadStep3StudioCredits } from './upload-steps/UploadStep3StudioCredits';
import { UploadStep4PreviewDrop } from './upload-steps/UploadStep4PreviewDrop';

export type { AdminUploadWizardProps, WaveformVerificationReportData };

export const AdminUploadWizard: React.FC<AdminUploadWizardProps> = (props) => {
  const {
    wizardStep,
    setWizardStep,
    isWizardStep1Valid,
    isWizardStep2Valid,
    isWizardStep3Valid,
    canAccessWizardStep,
    uploadSuccess,
    handlePublishTrack,
  } = props;

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
                      : 'bg-white/[0.02] border-white/[0.04] text-[#A3A9BA]/40 cursor-not-allowed'
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
        {wizardStep === 1 && <UploadStep1AudioCover {...props} />}
        {wizardStep === 2 && <UploadStep2ArtistMetadata {...props} />}
        {wizardStep === 3 && <UploadStep3StudioCredits {...props} />}
        {wizardStep === 4 && <UploadStep4PreviewDrop {...props} />}

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
