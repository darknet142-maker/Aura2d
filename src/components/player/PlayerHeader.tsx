import React from 'react';
import { ChevronDown, Bell, Ellipsis, Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { DropOfficialLogo } from '../CoverArtwork';
import { SPRING_SNAPPY } from '../../shared/ui/springMotion';

export interface PlayerHeaderProps {
  onOpenCentral: () => void;
  onOpenQueue: () => void;
  onOpenOptions: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  albumIdx?: number;
  albumsTotal?: number;
  trackIdx?: number;
  tracksTotal?: number;
  lufsLevel?: number;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  onOpenCentral,
  onOpenQueue,
  onOpenOptions,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  albumIdx = 0,
  albumsTotal = 1,
  trackIdx = 0,
  tracksTotal = 1,
  lufsLevel = -14.0,
}) => {
  const pad2 = (n: number) => String(Math.max(1, n)).padStart(2, '0');

  return (
    <header className="relative z-20 w-full px-4 sm:px-5 pt-2.5 sm:pt-3.5 pb-1 shrink-0 flex flex-col gap-1.5">
      {/* Rangée 1 : Barre de commande symétrique Studio */}
      <div className="relative w-full flex items-center justify-between">
        {/* 1. Bloc gauche : Bouton d'accès à Central */}
        <div className="flex items-center justify-start z-10 w-28">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.94 }}
            transition={SPRING_SNAPPY}
            onClick={onOpenCentral}
            className="h-9 px-2.5 rounded-full bg-[#0C0F17]/85 hover:bg-[#131824] border border-white/[0.1] flex items-center gap-1.5 text-[#F8FAFC] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Ouvrir l'explorateur Central"
            title="Ouvrir Central (Catalogue, Classements & Profil)"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-bold tracking-tight">Central</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#A3A9BA] shrink-0 lg:hidden" />
          </motion.button>
        </div>

        {/* 2. Bloc central STRICTEMENT SYMÉTRIQUE : Logo DROP centré au pixel près */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={SPRING_SNAPPY}
            onClick={onOpenQueue}
            className="pointer-events-auto flex items-center justify-center px-3.5 py-1.5 rounded-full hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
            aria-label="DROP — Ouvrir la file de lecture"
            title="File de lecture DROP"
          >
            <DropOfficialLogo className="h-[19px] sm:h-[21px] w-auto max-w-[124px]" />
          </motion.button>
        </div>

        {/* 3. Bloc droit : Cloche de Notifications + Menu Options (•••) */}
        <div className="flex items-center justify-end gap-1.5 z-10 w-28">
          {onOpenNotifications && (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.92 }}
              transition={SPRING_SNAPPY}
              onClick={onOpenNotifications}
              className="relative w-9 h-9 rounded-full bg-[#0C0F17]/85 hover:bg-[#131824] border border-white/[0.1] flex items-center justify-center text-[#F8FAFC] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="w-4 h-4 stroke-[2]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[#DE1B34] text-white text-[9px] font-mono font-bold flex items-center justify-center shadow">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </motion.button>
          )}
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.92 }}
            transition={SPRING_SNAPPY}
            onClick={onOpenOptions}
            className="w-9 h-9 rounded-full bg-[#0C0F17]/85 hover:bg-[#131824] border border-white/[0.1] flex items-center justify-center text-[#F8FAFC] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            aria-label="Options et Paramètres"
            title="Options et Paramètres"
          >
            <Ellipsis className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};
