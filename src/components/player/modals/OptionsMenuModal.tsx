import React from 'react';
import { X, Zap, Volume2 } from 'lucide-react';
import { ProLockBadgeSvg } from '../PlayerIcons';
import { DropOfficialLogo } from '../../CoverArtwork';
import { StudioLevelSlider } from '../../../shared/ui/StudioLevelSlider';

export interface OptionsMenuModalProps {
  isOpen: boolean;
  isPro: boolean;
  masterVolume: number;
  currentTrackId: string;
  currentArtist: string;
  currentLyricist: string;
  onClose: () => void;
  onToggleUserPlan: () => void;
  onChangeMasterVolume: (val: number) => void;
  onOpenTrackSheet: (trackId: string) => void;
  onOpenArtistProfile: (artist: string) => void;
  onOpenLyricistProfile: (lyricist: string) => void;
  onOpenAdminStudio: () => void;
  onNotifyProRequired: (feature: string) => void;
  onToast: (msg: string, color?: string) => void;
  onOpenMissions?: () => void;
  availableMissionsCount?: number;
  onOpenSubscriptionCheckout?: () => void;
}

export const OptionsMenuModal: React.FC<OptionsMenuModalProps> = ({
  isOpen,
  isPro,
  masterVolume,
  currentTrackId,
  currentArtist,
  currentLyricist,
  onClose,
  onToggleUserPlan,
  onChangeMasterVolume,
  onOpenTrackSheet,
  onOpenArtistProfile,
  onOpenLyricistProfile,
  onOpenAdminStudio,
  onNotifyProRequired,
  onToast,
  onOpenMissions,
  availableMissionsCount = 0,
  onOpenSubscriptionCheckout,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 bg-[#07090E]/75 backdrop-blur-md flex flex-col justify-end p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-zinc-900/95 border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl max-h-[88dvh] overflow-y-auto animate-fade-in"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DropOfficialLogo className="h-[18px] w-auto max-w-[90px]" />
            <h2 className="text-base font-bold text-white">Contrôles Audio &amp; Compte</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-white block">Formule d'Abonnement DROP</span>
            <span className="text-[11px] text-[#A3A9BA]">
              {isPro
                ? 'Pass Actif (Qualité Studio Opus & Cache Hors-Ligne)'
                : 'Mobile Money Gabon (+241) ou 100% Jetons'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenSubscriptionCheckout) onOpenSubscriptionCheckout();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 bg-[#DE1B34] hover:bg-[#c0172c] text-white shadow-sm cursor-pointer"
          >
            {isPro ? 'Gérer le Pass' : 'S\'abonner'}
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
          <StudioLevelSlider
            value={masterVolume}
            min={0}
            max={100}
            step={0.5}
            onChange={onChangeMasterVolume}
            label="Volume Master Temps Réel"
            variant="master"
            icon={<Volume2 className="w-4 h-4 text-amber-400" />}
            aria-label="Volume Master"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              if (!isPro) {
                onNotifyProRequired('Fiche détaillée du titre');
                return;
              }
              onClose();
              onOpenTrackSheet(currentTrackId);
            }}
            className={`relative p-3 rounded-2xl border text-xs font-semibold text-center transition ${
              isPro
                ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
                : 'bg-white/5 border-white/10 text-zinc-400 opacity-40 cursor-not-allowed'
            }`}
          >
            <span>Fiche Titre</span>
            {!isPro && <ProLockBadgeSvg />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isPro) {
                onNotifyProRequired('Profil Artiste');
                return;
              }
              onClose();
              onOpenArtistProfile(currentArtist);
            }}
            className={`relative p-3 rounded-2xl border text-xs font-semibold text-center transition ${
              isPro
                ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
                : 'bg-white/5 border-white/10 text-zinc-400 opacity-40 cursor-not-allowed'
            }`}
          >
            <span>Profil Artiste</span>
            {!isPro && <ProLockBadgeSvg />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isPro) {
                onNotifyProRequired('Profil Parolier');
                return;
              }
              onClose();
              onOpenLyricistProfile(currentLyricist);
            }}
            className={`relative p-3 rounded-2xl border text-xs font-semibold text-center transition ${
              isPro
                ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
                : 'bg-white/5 border-white/10 text-zinc-400 opacity-40 cursor-not-allowed'
            }`}
          >
            <span>Parolier</span>
            {!isPro && <ProLockBadgeSvg />}
          </button>
        </div>

        {onOpenMissions && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenMissions();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-semibold text-sm transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 fill-amber-400" />
              <span>Missions Sponsorisées des Labels</span>
            </div>
            {availableMissionsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#DE1B34] text-white text-[10px] font-mono font-bold shadow">
                {availableMissionsCount} disponible{availableMissionsCount > 1 ? 's' : ''}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenAdminStudio();
          }}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 font-semibold text-sm transition"
        >
          <span>Studio Admin (Catalogue, Featuring, Paroliers &amp; DRM)</span>
          <span className="text-xs">Ouvrir →</span>
        </button>
      </div>
    </div>
  );
};
