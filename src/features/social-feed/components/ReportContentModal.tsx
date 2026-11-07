import React, { useState } from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_DRAWER } from '../../../shared/ui/springMotion';

export const REPORT_REASONS = [
  { id: 'INAPPROPRIATE', label: 'Contenu inapproprié ou offensant' },
  { id: 'COPYRIGHT', label: 'Violation de droits d’auteur ou plagiat' },
  { id: 'SPAM', label: 'Spam, arnaque ou faux profil' },
  { id: 'HARASSMENT', label: 'Harcèlement ou diffamation' },
  { id: 'OTHER', label: 'Autre motif' },
] as const;

export interface ReportContentModalProps {
  isOpen: boolean;
  postId: string;
  authorName: string;
  onConfirmReport: (postId: string, reasonId: string) => void;
  onClose: () => void;
}

export const ReportContentModal: React.FC<ReportContentModalProps> = ({
  isOpen, postId, authorName, onConfirmReport, onClose,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('INAPPROPRIATE');
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[260] bg-[#07090E]/88 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Signaler cette publication"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={SPRING_DRAWER}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0D1017] border border-white/15 p-4 sm:p-5 space-y-4 shadow-[0_24px_70px_rgba(6,8,14,0.95)]"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">Signaler la publication</h3>
              <p className="text-[11px] text-[#A3A9BA]">Post de {authorName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-white/10 text-[#A3A9BA] hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-[#A3A9BA]">
            Sélectionnez la raison pour laquelle vous souhaitez signaler ce contenu :
          </p>
          <div className="space-y-1.5">
            {REPORT_REASONS.map((reason) => {
              const isSelected = selectedReason === reason.id;
              return (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#DE1B34]/18 border-[#DE1B34]/50 text-[#F8FAFC] font-semibold'
                      : 'bg-[#131722] border-white/10 text-[#A3A9BA] hover:text-[#F8FAFC]'
                  }`}
                >
                  <span>{reason.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-rose-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-white/10 text-xs font-semibold text-[#A3A9BA] hover:text-white cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmReport(postId, selectedReason);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-[#DE1B34] hover:bg-rose-600 text-xs font-bold text-white shadow-lg cursor-pointer active:scale-95 transition"
          >
            Confirmer le signalement
          </button>
        </div>
      </motion.div>
    </div>
  );
};
