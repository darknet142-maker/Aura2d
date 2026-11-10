import React, { useState, useEffect } from 'react';
import { X, Check, Music, Layers, Zap, Mic, Heart, Radio, Disc3, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_DRAWER } from '../../../shared/ui/springMotion';

export type AcousticEnergyPreference = 'CALM' | 'BALANCED' | 'EXPLOSIVE';
export interface UserTasteProfile { selectedStyles: string[]; acousticEnergy: AcousticEnergyPreference; blindDiscoveryBoost: boolean; }
export interface TasteVibeOption { id: string; label: string; icon: React.ComponentType<{ className?: string }>; genreKeywords: string[]; }

export const DROP_VIBES_CATALOG: TasteVibeOption[] = [
  { id: 'AFROBEATS', label: 'Afrobeat & Afro-Pop', icon: Music, genreKeywords: ['afrobeats', 'afro-pop', 'pop'] },
  { id: 'AMAPIANO', label: 'Amapiano & Log Drum', icon: Layers, genreKeywords: ['amapiano', 'dance', 'club'] },
  { id: 'COUPE_DECALE', label: 'Coupé-Décalé & Ndombolo', icon: Zap, genreKeywords: ['coupé-décalé', 'ndombolo', 'danse'] },
  { id: 'RAP_DRILL', label: 'Trap & Rap Urbain', icon: Mic, genreKeywords: ['rap', 'drill', 'hip-hop'] },
  { id: 'RNB', label: 'R&B & Soul Acoustique', icon: Heart, genreKeywords: ['r&b', 'soul', 'acoustique'] },
  { id: 'FOLKLORE', label: 'Folklore & Acoustique', icon: Radio, genreKeywords: ['folklore', 'traditionnel', 'bantou'] },
  { id: 'BEATS', label: 'Beats & Instrumentales', icon: Disc3, genreKeywords: ['beats', 'instrumentales', 'type beat'] },
];

export const TASTE_STORAGE_KEY = 'drop_user_selected_vibes_v1';
export const TASTE_PROFILE_STORAGE_KEY = 'drop_user_taste_profile_v1';

export function loadUserTasteProfile(): UserTasteProfile {
  try { const raw = localStorage.getItem(TASTE_PROFILE_STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return { selectedStyles: ['AFROBEATS', 'AMAPIANO', 'RAP_DRILL'], acousticEnergy: 'BALANCED', blindDiscoveryBoost: true };
}

export interface TasteOnboardingVibesModalProps {
  isOpen: boolean; onClose: () => void; onApplyVibes: (vibeIds: string[]) => void;
}

export const TasteOnboardingVibesModal: React.FC<TasteOnboardingVibesModalProps> = ({ isOpen, onClose, onApplyVibes }) => {
  const [profile, setProfile] = useState<UserTasteProfile>(loadUserTasteProfile);
  const selectedIds = profile.selectedStyles;

  useEffect(() => { if (isOpen) setProfile(loadUserTasteProfile()); }, [isOpen]);
  if (!isOpen) return null;

  const toggleStyle = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      selectedStyles: prev.selectedStyles.includes(id) ? prev.selectedStyles.filter((s) => s !== id) : [...prev.selectedStyles, id],
    }));
  };

  const handleConfirm = () => {
    try {
      localStorage.setItem(TASTE_STORAGE_KEY, JSON.stringify(selectedIds));
      localStorage.setItem(TASTE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {}
    onApplyVibes(selectedIds);
    onClose();
  };

  const canContinue = selectedIds.length >= 3;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[150] bg-[#07090E]/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        role="dialog" aria-modal="true" aria-label="Profil d'Écoute & Goûts Musicaux DROP"
        initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING_DRAWER}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-[#0D1017] border border-white/[0.08] p-5 sm:p-6 space-y-4 shadow-[0_24px_70px_rgba(6,8,14,0.95)] max-h-[92dvh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2 space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-medium text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Calibrage studio • -14.0 LUFS
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#F8FAFC] tracking-tight leading-snug">
              Qu&apos;aimerais-tu écouter sur DROP ?
            </h2>
            <p className="text-xs text-[#A3A9BA]">
              Ajustez vos styles de prédilection et votre signature acoustique.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#A3A9BA]">Styles &amp; Univers Sonores (min. 3)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DROP_VIBES_CATALOG.map(({ id, label, icon: Icon }) => {
              const sel = selectedIds.includes(id);
              return (
                <button
                  key={id} type="button" onClick={() => toggleStyle(id)}
                  className={`p-2.5 rounded-2xl border text-left text-xs font-bold flex items-center justify-between gap-2 transition cursor-pointer ${
                    sel ? 'bg-[#1A2030] border-amber-400 text-[#F8FAFC] shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'bg-[#131722] border-white/10 text-[#A3A9BA] hover:text-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${sel ? 'text-amber-400' : 'text-[#A3A9BA]'}`} />
                    <span className="truncate">{label}</span>
                  </div>
                  {sel && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#A3A9BA]">Énergie Acoustique Préférée</label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#080A0F] border border-white/10">
            {([{ id: 'CALM', label: 'Calme' }, { id: 'BALANCED', label: 'Équilibré' }, { id: 'EXPLOSIVE', label: 'Club / Drop' }] as const).map((e) => (
              <button
                key={e.id} type="button" onClick={() => setProfile((p) => ({ ...p, acousticEnergy: e.id }))}
                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${profile.acousticEnergy === e.id ? 'bg-[#DE1B34] text-white shadow-md' : 'text-[#A3A9BA] hover:text-[#F8FAFC]'}`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#131722] border border-white/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#F8FAFC] truncate">Pépites Émergentes (-14.0 LUFS)</p>
            <p className="text-[11px] text-[#A3A9BA] truncate">Booster les découvertes à l&apos;aveugle sans effet de notoriété</p>
          </div>
          <button
            type="button" role="switch" aria-checked={profile.blindDiscoveryBoost}
            onClick={() => setProfile((p) => ({ ...p, blindDiscoveryBoost: !p.blindDiscoveryBoost }))}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${profile.blindDiscoveryBoost ? 'bg-emerald-500' : 'bg-white/20'}`}
          >
            <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${profile.blindDiscoveryBoost ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="space-y-2 pt-1 border-t border-white/10">
          <button
            type="button" disabled={!canContinue} onClick={handleConfirm}
            className={`w-full py-3 rounded-2xl font-extrabold text-xs transition cursor-pointer ${
              canContinue ? 'bg-amber-400 hover:bg-amber-300 text-[#080A0F] shadow-lg' : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {canContinue ? `Appliquer mon profil d'écoute (${selectedIds.length})` : `Sélectionnez au moins 3 univers (${selectedIds.length}/3)`}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
