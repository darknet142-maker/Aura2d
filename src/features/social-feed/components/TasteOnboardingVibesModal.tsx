import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_DRAWER } from '../../../shared/ui/springMotion';

export interface TasteVibeOption {
  id: string;
  label: string;
  icon: string;
  genreKeywords: string[];
}

export const DROP_VIBES_CATALOG: TasteVibeOption[] = [
  { id: 'RAP_DRILL', label: 'Rap & Drill', icon: '🎤', genreKeywords: ['rap', 'drill', 'hip-hop'] },
  { id: 'AFROBEATS', label: 'Afrobeats & Soul', icon: '🌊', genreKeywords: ['afrobeats', 'soul', 'afro-pop'] },
  { id: 'NTCHAM', label: 'Ntcham & Street', icon: '⚡', genreKeywords: ['ntcham', 'street', 'libreville'] },
  { id: 'BEATS', label: 'Beats & Instros', icon: '🎹', genreKeywords: ['beats', 'instrumentales', 'type beat'] },
  { id: 'RNB', label: 'R&B & Lovers', icon: '💜', genreKeywords: ['r&b', 'lovers', 'zouk'] },
  { id: 'AMAPIANO', label: 'Amapiano & Club', icon: '🔥', genreKeywords: ['amapiano', 'dance', 'club'] },
  { id: 'GOSPEL', label: 'Gospel & Foi', icon: '✨', genreKeywords: ['gospel', 'louange', 'spirituel'] },
  { id: 'POP', label: 'Pop Urbaine', icon: '🌟', genreKeywords: ['pop', 'variété'] },
  { id: 'VIDEOS', label: 'Avis Vidéo 30s', icon: '🎥', genreKeywords: ['video', 'opinion', 'avis'] },
  { id: 'SCOUTS', label: 'Pépites Éclaireur', icon: '🧭', genreKeywords: ['recommandation', 'scout', 'découverte'] },
  { id: 'CERTIF', label: 'Certifications', icon: '💎', genreKeywords: ['or', 'platine', 'diamant', 'certifié'] },
  { id: 'CLASSICS', label: 'Patrimoine', icon: '🏆', genreKeywords: ['classique', 'héritage', 'légende'] },
];

export const TASTE_STORAGE_KEY = 'drop_user_selected_vibes_v1';

export interface TasteOnboardingVibesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVibes: (vibeIds: string[]) => void;
}

export const TasteOnboardingVibesModal: React.FC<TasteOnboardingVibesModalProps> = ({
  isOpen, onClose, onApplyVibes,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem(TASTE_STORAGE_KEY);
      return s ? JSON.parse(s) : ['RAP_DRILL', 'AFROBEATS', 'NTCHAM'];
    } catch {
      return ['RAP_DRILL', 'AFROBEATS', 'NTCHAM'];
    }
  });

  useEffect(() => {
    try {
      const s = localStorage.getItem(TASTE_STORAGE_KEY);
      if (s) setSelectedIds(JSON.parse(s));
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleVibe = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleConfirm = () => {
    try { localStorage.setItem(TASTE_STORAGE_KEY, JSON.stringify(selectedIds)); } catch {}
    onApplyVibes(selectedIds);
    onClose();
  };

  const canContinue = selectedIds.length >= 3;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[150] bg-[#07090E]/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        role="dialog" aria-modal="true" aria-label="Personnalisation des préférences musicales"
        initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING_DRAWER}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-[32px] sm:rounded-[32px] bg-[#0D1017] border border-white/15 p-5 sm:p-6 space-y-4 shadow-[0_24px_70px_rgba(6,8,14,0.95)] max-h-[92dvh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight leading-tight">
              Qu&apos;aimerais-tu écouter sur DROP ?
            </h2>
            <p className="text-xs text-[#A3A9BA] mt-1">
              Choisis 3 univers ou plus pour propulser tes recommandations et statuts.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2.5 py-1">
          {DROP_VIBES_CATALOG.map((vibe) => {
            const isSelected = selectedIds.includes(vibe.id);
            return (
              <button
                key={vibe.id} type="button" onClick={() => toggleVibe(vibe.id)}
                className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-[#DE1B34] text-white border border-[#ff3b52] shadow-[0_4px_16px_rgba(222,27,52,0.45)]'
                    : 'bg-[#131722] hover:bg-[#1A2030] text-[#F8FAFC] border border-white/10'
                }`}
              >
                <span className="text-base select-none">{vibe.icon}</span>
                <span>{vibe.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>

        <div className="space-y-2 pt-2 border-t border-white/10">
          <button
            type="button" disabled={!canContinue} onClick={handleConfirm}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-xs transition active:scale-95 cursor-pointer ${
              canContinue
                ? 'bg-[#DE1B34] hover:bg-[#F02842] text-white shadow-[0_8px_24px_rgba(222,27,52,0.4)]'
                : 'bg-rose-950/40 text-rose-300/50 cursor-not-allowed border border-rose-900/30'
            }`}
          >
            {canContinue ? `Explorer ma sélection (${selectedIds.length})` : `Continuer (${selectedIds.length}/3)`}
          </button>
          <button type="button" onClick={onClose} className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#A3A9BA] hover:text-[#F8FAFC] transition cursor-pointer">
            Passer et tout explorer
          </button>
        </div>

        <p className="text-[10px] text-center text-[#A3A9BA]/70 leading-relaxed">
          Personnalisation en direct de l&apos;algorithme DROP. Modifiable à tout instant depuis le fil.
        </p>
      </motion.div>
    </div>
  );
};
