import React from 'react';
import {
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Repeat1,
} from 'lucide-react';
import { PlayerUtilityDock, PlayerUtilityDockProps } from './PlayerUtilityDock';

export interface PlayerPlaybackDockProps extends PlayerUtilityDockProps {
  isPlaying: boolean;
  isDropMode: boolean;
  isShuffle: boolean;
  repeatMode: number; // 0: Off, 1: All, 2: One
  onTogglePlay: () => void;
  onNavigateTrack: (dir: 1 | -1) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToast: (msg: string) => void;
}

export const PlayerPlaybackDock: React.FC<PlayerPlaybackDockProps> = ({
  isPlaying,
  isDropMode,
  isShuffle,
  repeatMode,
  onTogglePlay,
  onNavigateTrack,
  onToggleShuffle,
  onCycleRepeat,
  onToast,
  ...utilityProps
}) => {
  return (
    <section className="relative z-20 px-4 sm:px-6 pb-2 shrink-0">
      <div className="glass-dock px-4 py-3 sm:px-5 sm:py-4">
        {/* Rangée 1 : Contrôles de flux principaux (Ergonomie tactile mobile) */}
        <div className="relative z-10 flex items-center justify-between px-1">
          {/* Lecture aléatoire */}
          <button
            type="button"
            onClick={() => {
              onToggleShuffle();
              onToast(!isShuffle ? 'Lecture aléatoire activée' : 'Lecture aléatoire désactivée');
            }}
            className={`relative w-11 h-11 rounded-full flex items-center justify-center hover:text-white active:scale-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              isShuffle ? 'text-amber-400' : 'text-white/90'
            }`}
            aria-label="Lecture aléatoire"
          >
            <Shuffle className="w-5 h-5 stroke-[2]" />
            {isShuffle && (
              <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
            )}
          </button>

          {/* Titre précédent */}
          <button
            type="button"
            onClick={() => onNavigateTrack(-1)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:text-amber-200 active:scale-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="Titre précédent"
          >
            <SkipBack className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
          </button>

          {/* Bouton Play/Pause Principal (Crimson Glow Premium) */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="play-btn-main focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-400"
            aria-label={
              isPlaying && !isDropMode
                ? 'Mettre en pause'
                : 'Lancer la lecture complète depuis 0:00'
            }
            title={
              isPlaying && !isDropMode
                ? 'Mettre en pause'
                : 'Lancer la lecture complète depuis 0:00'
            }
          >
            {isPlaying && !isDropMode ? (
              <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
            ) : (
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-0.5" />
            )}
          </button>

          {/* Titre suivant */}
          <button
            type="button"
            onClick={() => onNavigateTrack(1)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:text-amber-200 active:scale-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="Titre suivant"
          >
            <SkipForward className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
          </button>

          {/* Mode répétition */}
          <button
            type="button"
            onClick={() => {
              const nextMode = (repeatMode + 1) % 3;
              onCycleRepeat();
              if (nextMode === 0) onToast('Répétition désactivée');
              else if (nextMode === 1) onToast('Répéter toute la sélection');
              else onToast('Répéter ce titre en boucle');
            }}
            className={`relative w-11 h-11 rounded-full flex items-center justify-center hover:text-white active:scale-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              repeatMode > 0 ? 'text-amber-400' : 'text-white/90'
            }`}
            aria-label="Mode répétition"
          >
            {repeatMode === 2 ? (
              <Repeat1 className="w-5 h-5 stroke-[2]" />
            ) : (
              <Repeat className="w-5 h-5 stroke-[2]" />
            )}
            {repeatMode > 0 && (
              <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
            )}
          </button>
        </div>

        {/* Rangée 2 : 5 Boutons Utilitaires (avec Bouton REC Rouge 30s) */}
        <PlayerUtilityDock {...utilityProps} />
      </div>
    </section>
  );
};

