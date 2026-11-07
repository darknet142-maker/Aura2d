import React from 'react';
import { X, Sparkles, Zap, ShieldCheck, Crown, Check, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_DRAWER } from '../../../shared/ui/springMotion';

export interface ProFeatureGateModalProps {
  isOpen: boolean;
  featureTitle: string;
  featureReason?: string;
  onClose: () => void;
  onUpgradeSuccess: () => void;
}

const PRO_BENEFITS = [
  'Flux illimité sans coupure quotidienne',
  'Master Studio OPUS (-14.0 LUFS) & Spatialisation 3D',
  'Paroles synchronisées complètes en plein écran',
  'Téléchargement hors-ligne crypté (zéro data consommée)',
  'Dossiers d’analytique studio J+90 & Handshake DAW',
];

export const ProFeatureGateModal: React.FC<ProFeatureGateModalProps> = ({
  isOpen, featureTitle, featureReason, onClose, onUpgradeSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[160] bg-[#07090E]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        role="dialog" aria-modal="true" aria-label="Passer à DROP PRO"
        initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING_DRAWER}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0D1017] border border-amber-400/40 p-5 sm:p-6 space-y-4 shadow-[0_24px_80px_rgba(245,158,11,0.2)] text-[#F8FAFC]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">Exclusivité DROP PRO (+241)</span>
              <h3 className="text-base font-extrabold">{featureTitle}</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-8 h-8 rounded-full bg-white/10 text-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {featureReason && (
          <p className="text-xs text-[#A3A9BA] leading-relaxed bg-[#080A0F] p-3 rounded-xl border border-white/5">
            {featureReason}
          </p>
        )}

        <div className="space-y-2 py-1">
          <span className="text-[11px] font-mono text-amber-300 uppercase tracking-wider block">Avantages du compte PRO :</span>
          <ul className="space-y-1.5 text-xs text-[#F8FAFC]/90">
            {PRO_BENEFITS.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#080A0F] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A3A9BA] flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Airtel Money & Moov Money</span>
            </span>
            <strong className="text-amber-300 font-mono">2 500 FCFA / mois</strong>
          </div>
          <p className="text-[10px] text-[#A3A9BA]">Sans engagement. Activation immédiate via votre numéro Gabon (+241).</p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button" onClick={onClose}
            className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#F8FAFC] transition cursor-pointer"
          >
            Plus tard
          </button>
          <button
            type="button"
            onClick={() => {
              onUpgradeSuccess();
              onClose();
            }}
            className="py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#080A0F] text-xs font-extrabold shadow-lg transition cursor-pointer"
          >
            Passer en PRO (Activer)
          </button>
        </div>
      </motion.div>
    </div>
  );
};
