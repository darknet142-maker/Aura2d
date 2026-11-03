import React from 'react';
import { X } from 'lucide-react';
import { ProLockBadgeSvg } from '../PlayerIcons';
import { DropOfficialLogo } from '../../CoverArtwork';

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
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex flex-col justify-end p-4"
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
            <span className="text-xs font-bold text-white block">Niveau de Compte DROP</span>
            <span className="text-[11px] text-zinc-400">
              {isPro
                ? 'DROP Pro actif (Toutes les données analytiques débloquées)'
                : 'Compte Basic (Fonctions Pro grisées)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleUserPlan();
              onToast(
                !isPro ? 'Compte passé en DROP Pro' : 'Compte passé en DROP Basic',
                !isPro ? 'bg-amber-400' : 'bg-zinc-400'
              );
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              isPro
                ? 'bg-amber-400 text-black shadow-[0_0_16px_rgba(251,191,36,0.35)]'
                : 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
            }`}
          >
            {isPro ? 'PRO Actif' : 'Passer en PRO'}
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-200 font-semibold">Volume Master Temps Réel</span>
            <span className="font-mono text-amber-400 font-bold">
              {Math.round(masterVolume)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={masterVolume}
            onChange={(e) => onChangeMasterVolume(parseFloat(e.target.value))}
            className="w-full fat-slider cursor-pointer"
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
