import React from 'react';
import { Bell, LogOut, Music, Shield, Volume2, Wifi, WifiOff, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { DropOfficialLogo } from '../../components/CoverArtwork';
import { streamTracker, type SyncStatusSnapshot } from '../../services/offlineStreamTracker';
import type { Track } from '../types/domain.types';
import { SPRING_SNAPPY, SUBTLE_ENTRANCE_VARIANTS } from './springMotion';

interface AppTopNavigationHeaderProps {
  appView: 'AUTH' | 'PLAYER' | 'ADMIN';
  setAppView: React.Dispatch<React.SetStateAction<'AUTH' | 'PLAYER' | 'ADMIN'>>;
  isPlaying: boolean;
  currentTrack: Track;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  syncSnapshot: SyncStatusSnapshot;
  isRealtimeConnected: boolean;
  isBreakUiMode?: boolean;
  onToggleBreakUiMode?: () => void;
}

export const AppTopNavigationHeader: React.FC<AppTopNavigationHeaderProps> = ({
  appView,
  setAppView,
  isPlaying,
  currentTrack,
  unreadNotificationsCount,
  onOpenNotifications,
  syncSnapshot,
  isRealtimeConnected,
  isBreakUiMode = false,
  onToggleBreakUiMode,
}) => {
  return (
    <motion.header
      variants={SUBTLE_ENTRANCE_VARIANTS}
      initial="initial"
      animate="animate"
      className="relative z-30 w-full flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 border-b border-white/[0.08] bg-[#080A0F]/92 backdrop-blur-xl shrink-0"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          transition={SPRING_SNAPPY}
          onClick={() => setAppView('PLAYER')}
          className="flex items-center gap-2 shrink-0"
          title="Retour au lecteur DROP"
        >
          <DropOfficialLogo className="h-[18px] sm:h-[20px] w-auto max-w-[110px]" />
        </motion.button>

        {isPlaying && (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_SNAPPY}
            onClick={() => setAppView('PLAYER')}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#DE1B34]/15 border border-[#DE1B34]/35 text-[11px] text-[#FF4D64] font-mono min-w-0 max-w-[160px] sm:max-w-[220px]"
          >
            <Volume2 className="w-3 h-3 animate-pulse shrink-0" />
            <span className="truncate">{currentTrack.title}</span>
          </motion.button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {onToggleBreakUiMode && (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={SPRING_SNAPPY}
            onClick={onToggleBreakUiMode}
            className={`h-7 px-2.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border cursor-pointer ${
              isBreakUiMode
                ? 'bg-amber-400 text-[#080A0F] border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                : 'bg-[#0D1017] hover:bg-[#131722] text-[#A3A9BA] hover:text-[#F8FAFC] border-white/[0.1]'
            }`}
            title="Protocole break-ui : tester les titres de 80+ caractères et les pochettes manquantes"
          >
            <Zap className="w-3 h-3 shrink-0" />
            <span className="hidden md:inline">
              {isBreakUiMode ? 'Crash-Test 80+ car. : ACTIF' : 'Crash-Test UI (80+ car.)'}
            </span>
          </motion.button>
        )}

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={SPRING_SNAPPY}
          onClick={onOpenNotifications}
          className="relative h-7 px-2 rounded-lg text-[11px] font-mono flex items-center gap-1 border bg-[#0D1017] hover:bg-[#131722] border-white/[0.1] text-[#F8FAFC]"
          title="Centre de notifications"
        >
          <Bell className="w-3.5 h-3.5 text-amber-300" />
          {unreadNotificationsCount > 0 && (
            <span className="px-1 py-0.2 rounded-full bg-[#DE1B34] text-white text-[9px] font-bold">
              {unreadNotificationsCount}
            </span>
          )}
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={SPRING_SNAPPY}
          onClick={() => streamTracker.setSimulatedOffline(!syncSnapshot.simulatedOffline)}
          className={`h-7 px-2 rounded-lg text-[11px] font-mono flex items-center gap-1 border ${
            syncSnapshot.isOnline
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/35'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
          }`}
        >
          {syncSnapshot.isOnline ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          {syncSnapshot.queue.length > 0 && (
            <span className="text-[10px] font-bold">{syncSnapshot.queue.length}</span>
          )}
        </motion.button>

        <div
          className={`h-7 px-2 rounded-lg text-[10px] font-mono flex items-center gap-1.5 border ${
            isRealtimeConnected
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/35'
              : 'bg-[#0D1017] text-[#A3A9BA] border-white/[0.1]'
          }`}
          title={
            isRealtimeConnected
              ? 'Base de données temps réel active (WebSocket Supabase)'
              : 'Connexion temps réel...'
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isRealtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="hidden sm:inline">
            {isRealtimeConnected ? 'Temps Réel' : 'Sync Local'}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#0D1017] p-0.5 rounded-lg border border-white/[0.08]">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={SPRING_SNAPPY}
            onClick={() => setAppView('PLAYER')}
            className="h-6 px-2.5 rounded-md text-xs font-medium text-[#A3A9BA] hover:text-[#F8FAFC] flex items-center gap-1"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Lecteur</span>
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={SPRING_SNAPPY}
            onClick={() => setAppView('ADMIN')}
            className={`h-6 px-2.5 rounded-md text-xs font-medium flex items-center gap-1 ${
              appView === 'ADMIN'
                ? 'bg-emerald-500 text-[#080A0F] font-semibold'
                : 'text-[#A3A9BA] hover:text-[#F8FAFC]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={SPRING_SNAPPY}
            onClick={() => setAppView('AUTH')}
            aria-label="Portail d'authentification"
            className={`h-6 px-2 rounded-md text-xs font-medium flex items-center ${
              appView === 'AUTH'
                ? 'bg-white/15 text-[#F8FAFC]'
                : 'text-[#A3A9BA] hover:text-[#F8FAFC]'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};
