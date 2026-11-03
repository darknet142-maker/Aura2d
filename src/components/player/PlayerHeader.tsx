import React from 'react';
import { ChevronDown, Bell, Ellipsis } from 'lucide-react';
import { DropOfficialLogo } from '../CoverArtwork';

export interface PlayerHeaderProps {
  onOpenCentral: () => void;
  onOpenQueue: () => void;
  onOpenOptions: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  onOpenCentral,
  onOpenQueue,
  onOpenOptions,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}) => {
  return (
    <header className="relative z-20 w-full px-4 sm:px-6 pt-3 sm:pt-4 pb-1 shrink-0 flex items-center justify-between">
      {/* 1. Bloc gauche : Bouton Flèche vers le bas (Ouvre l'écran Central) */}
      <div className="flex items-center justify-start z-10 w-24">
        <button
          type="button"
          onClick={onOpenCentral}
          className="w-11 h-11 -ml-1.5 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:scale-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label="Ouvrir Central"
          title="Central"
        >
          <ChevronDown className="w-6 h-6 stroke-[2.2]" />
        </button>
      </div>

      {/* 2. Bloc central STRICTEMENT SYMÉTRIQUE : Logo DROP centré au pixel près */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <button
          type="button"
          onClick={onOpenQueue}
          className="pointer-events-auto flex items-center justify-center px-4 py-1.5 rounded-full hover:bg-white/[0.08] active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
          aria-label="DROP — Ouvrir la file de lecture"
          title="File de lecture DROP"
        >
          <DropOfficialLogo className="h-[18px] sm:h-[20px] w-auto max-w-[125px]" />
        </button>
      </div>

      {/* 3. Bloc droit : Cloche de Notifications + Menu Options (•••) */}
      <div className="flex items-center justify-end gap-1 z-10 w-24 -mr-1.5">
        {onOpenNotifications && (
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:scale-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[2]" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#ff3b30] text-white text-[9px] font-mono font-bold flex items-center justify-center shadow">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onOpenOptions}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:scale-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label="Options et Paramètres"
          title="Options et Paramètres"
        >
          <Ellipsis className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
