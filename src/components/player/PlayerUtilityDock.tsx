import React from 'react';
import {
  ListPlus,
  MicVocal,
  Video,
  SlidersHorizontal,
  ArrowDownToLine,
  Check,
} from 'lucide-react';
import { ProLockBadgeSvg } from './PlayerIcons';

export interface PlayerUtilityDockProps {
  isPro: boolean;
  lyricsOpen: boolean;
  onToggleLyrics: () => void;
  onOpenPlaylistModal: () => void;
  onOpenTrendStudio: () => void;
  isTrendStudioOpen: boolean;
  onOpenEqModal: () => void;
  isEqCustomOrActive: boolean;
  isDownloadedOffline: boolean;
  onToggleDownload: () => void;
  onNotifyProRequired: (featureName: string) => void;
}

export const PlayerUtilityDock: React.FC<PlayerUtilityDockProps> = ({
  isPro,
  lyricsOpen,
  onToggleLyrics,
  onOpenPlaylistModal,
  onOpenTrendStudio,
  onOpenEqModal,
  isEqCustomOrActive,
  isDownloadedOffline,
  onToggleDownload,
  onNotifyProRequired,
}) => {
  return (
    <div className="relative z-10 flex items-center justify-between gap-2 px-1 sm:px-2 mt-3.5 sm:mt-4">
      {/* 1. Ajouter à une sélection / Playlist */}
      <button
        type="button"
        onClick={onOpenPlaylistModal}
        className="utility-pill"
        aria-label="Ajouter à une sélection"
        title="Ajouter à une sélection"
      >
        <ListPlus className="w-5 h-5 stroke-[2]" />
      </button>

      {/* 2. Paroles Synchronisées & Score Parolier en Direct */}
      <button
        type="button"
        onClick={() => {
          if (!isPro) {
            onNotifyProRequired('Paroles synchronisées');
            return;
          }
          onToggleLyrics();
        }}
        className={`utility-pill ${
          !isPro
            ? 'opacity-40 grayscale cursor-not-allowed'
            : lyricsOpen
            ? 'active-pill'
            : ''
        }`}
        aria-label="Paroles synchronisées"
        title={
          isPro
            ? 'Paroles synchronisées & Partage d’extrait'
            : 'Paroles synchronisées (Réservé DROP Pro)'
        }
      >
        <MicVocal className="w-5 h-5 stroke-[2]" />
        {!isPro && <ProLockBadgeSvg />}
      </button>

      {/* 3. BOUTON ROUGE PHARE D'ENREGISTREMENT VIDÉO TREND 30S (Toujours visible et mis en avant) */}
      <button
        type="button"
        onClick={onOpenTrendStudio}
        className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff3b30] via-rose-600 to-[#e11d38] text-white shadow-[0_0_24px_rgba(255,59,48,0.55)] border border-rose-400/50 hover:brightness-110 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        aria-label="Lancer l'enregistrement d'une vidéo Trend 30s"
        title="Lancer l'enregistrement d'une vidéo Trend 30s (Verrouillée sur les 30s du Drop)"
      >
        <span className="relative flex items-center justify-center">
          <Video className="w-5 h-5 stroke-[2.2] text-white drop-shadow" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-sm" />
        </span>
        <span className="absolute -bottom-1 px-1.5 py-[1.5px] rounded-full bg-[#07090E]/85 text-amber-300 text-[8px] font-mono font-black tracking-wider leading-none border border-amber-400/40 shadow">
          REC 30s
        </span>
      </button>

      {/* 4. Égaliseur 5 Bandes & Préréglages Audio */}
      <button
        type="button"
        onClick={() => {
          if (!isPro) {
            onNotifyProRequired('Égaliseur 5 bandes & Préréglages');
            return;
          }
          onOpenEqModal();
        }}
        className={`utility-pill ${
          !isPro
            ? 'opacity-40 grayscale cursor-not-allowed'
            : isEqCustomOrActive
            ? 'active-pill'
            : ''
        }`}
        aria-label="Égaliseur 5 bandes et Préréglages"
        title={
          isPro
            ? 'Égaliseur 5 bandes & Préréglages'
            : 'Égaliseur 5 bandes (Réservé DROP Pro)'
        }
      >
        <SlidersHorizontal className="w-5 h-5 stroke-[2]" />
        {!isPro && <ProLockBadgeSvg />}
      </button>

      {/* 5. Téléchargement Hors-Ligne */}
      <button
        type="button"
        onClick={() => {
          if (!isPro) {
            onNotifyProRequired('Téléchargement hors-ligne');
            return;
          }
          onToggleDownload();
        }}
        className={`utility-pill relative ${
          !isPro ? 'opacity-40 grayscale cursor-not-allowed' : ''
        } ${isDownloadedOffline ? 'text-emerald-400' : ''}`}
        aria-label="Télécharger pour écoute hors-ligne"
        title={
          isPro
            ? isDownloadedOffline
              ? 'Titre disponible hors-ligne'
              : 'Télécharger pour écoute hors-ligne'
            : 'Téléchargement hors-ligne (Réservé DROP Pro)'
        }
      >
        {isDownloadedOffline ? (
          <Check className="w-5 h-5 stroke-[2.4]" />
        ) : (
          <ArrowDownToLine className="w-5 h-5 stroke-[2]" />
        )}
        {!isPro && <ProLockBadgeSvg />}
      </button>
    </div>
  );
};
