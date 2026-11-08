import React from 'react';
import {
  Shield,
  CheckCircle2,
  FolderOpen,
  Upload,
  Layers,
  Database,
  Users,
  Zap,
  Coins,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { AdminMainTabId } from '../backoffice.types';
import { SPRING_SNAPPY, SUBTLE_ENTRANCE_VARIANTS } from '../../../shared/ui/springMotion';

export interface AdminCommandHeaderProps {
  isRealtimeConnected: boolean;
  lastAdminSavedAt: string | null;
  enableAwardsCeremony: boolean;
  onToggleAwardsCeremony: () => void;
  isSavingAdmin: boolean;
  onSaveAndSyncAll: (sectionLabel?: string) => void;
  adminMainTab: AdminMainTabId;
  onSelectMainTab: (tab: AdminMainTabId) => void;
  tracksCount: number;
  bannersCount: number;
  usersCount: number;
  isBreakUiMode?: boolean;
  onToggleBreakUiMode?: () => void;
  onSwitchToSaaSMode?: () => void;
}

export const AdminCommandHeader: React.FC<AdminCommandHeaderProps> = ({
  isRealtimeConnected,
  lastAdminSavedAt,
  enableAwardsCeremony,
  onToggleAwardsCeremony,
  isSavingAdmin,
  onSaveAndSyncAll,
  adminMainTab,
  onSelectMainTab,
  tracksCount,
  bannersCount,
  usersCount,
  isBreakUiMode = false,
  onToggleBreakUiMode,
  onSwitchToSaaSMode,
}) => {
  return (
    <motion.div
      variants={SUBTLE_ENTRANCE_VARIANTS}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-3 w-full"
    >
      <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#0D1017] via-[#131722] to-[#0D1017] border border-emerald-500/30 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
        <div className="lg:col-span-4 flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-extrabold text-[#F8FAFC]">
                Studio Admin &amp; Cloud Sync
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isRealtimeConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {isRealtimeConnected ? '● Temps Réel Actif' : '● Sync Hybride'}
              </span>
              {onSwitchToSaaSMode && (
                <button
                  type="button"
                  onClick={onSwitchToSaaSMode}
                  className="px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-[#DE1B34]/20 border border-[#DE1B34]/50 text-red-300 hover:bg-[#DE1B34] hover:text-white transition cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Basculer vers la nouvelle interface Admin Studio 2.0 (SaaS)"
                >
                  <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                  <span className="truncate">Mode Studio 2.0 (SaaS)</span>
                </button>
              )}
            </div>
            <span className="text-[10.5px] font-mono text-[#A3A9BA] block truncate mt-0.5">
              {lastAdminSavedAt
                ? `✓ Dernière sauvegarde multi-appareils : ${lastAdminSavedAt}`
                : 'Modifications synchronisées sur Mobile, Tablette et PC'}
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <motion.button
            type="button"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_SNAPPY}
            onClick={onToggleAwardsCeremony}
            className={`w-full px-3 py-2.5 rounded-xl text-[11px] font-mono font-bold border flex items-center justify-center gap-1.5 cursor-pointer truncate ${
              enableAwardsCeremony
                ? 'bg-amber-400 text-[#080A0F] border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                : 'bg-[#07090E] hover:bg-[#131722] text-amber-200 border-amber-400/35'
            }`}
          >
            <span className="truncate">
              {enableAwardsCeremony
                ? '★ Awards : ACTIFS (Public)'
                : '☆ Activer DROP Awards'}
            </span>
          </motion.button>

          {onToggleBreakUiMode && (
            <motion.button
              type="button"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING_SNAPPY}
              onClick={onToggleBreakUiMode}
              className={`w-full px-3 py-2.5 rounded-xl text-[11px] font-mono font-bold border flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                isBreakUiMode
                  ? 'bg-[#DE1B34] text-white border-[#FF4D64] shadow-[0_0_15px_rgba(222,27,52,0.4)]'
                  : 'bg-[#07090E] hover:bg-[#131722] text-[#A3A9BA] hover:text-[#F8FAFC] border-white/15'
              }`}
              title="Protocole break-ui : injecter des titres de 80+ caractères et des pochettes manquantes pour vérifier l'alignement"
            >
              <Zap className="w-3.5 h-3.5 shrink-0 text-amber-300" />
              <span className="truncate">
                {isBreakUiMode ? 'Crash-Test 80+ car. : ACTIF' : 'Crash-Test 80+ car. & Sans Image'}
              </span>
            </motion.button>
          )}
        </div>

        <div className="lg:col-span-3">
          <motion.button
            type="button"
            disabled={isSavingAdmin}
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_SNAPPY}
            onClick={() => onSaveAndSyncAll()}
            className="w-full px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#080A0F] font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {isSavingAdmin
                ? 'Synchronisation...'
                : 'Sauvegarder & Synchroniser Tout'}
            </span>
          </motion.button>
        </div>
      </div>

      <nav
        aria-label="Sections principales de l'administration"
        className="w-full grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-2 bg-[#0D1017] p-2 rounded-2xl border border-white/[0.08]"
      >
        <motion.button
          type="button"
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING_SNAPPY}
          onClick={() => onSelectMainTab('CATALOGUE')}
          className={`p-2.5 rounded-xl text-left border flex flex-col justify-between gap-1 cursor-pointer ${
            adminMainTab === 'CATALOGUE'
              ? 'bg-[#DE1B34] border-[#FF4D64] text-white shadow-md shadow-[#DE1B34]/25'
              : 'bg-[#07090E] border-white/[0.08] text-[#CBD5E1] hover:text-white hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-extrabold leading-tight">1. Catalogue</span>
            <FolderOpen className="w-3.5 h-3.5 shrink-0 opacity-90" />
          </div>
          <span
            className={`text-[10px] font-mono block truncate ${
              adminMainTab === 'CATALOGUE' ? 'text-white/95' : 'text-[#A3A9BA]'
            }`}
          >
            {tracksCount} pistes • Rangs &amp; DRM
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING_SNAPPY}
          onClick={() => onSelectMainTab('UPLOAD')}
          className={`p-2.5 rounded-xl text-left border flex flex-col justify-between gap-1 cursor-pointer ${
            adminMainTab === 'UPLOAD'
              ? 'bg-[#DE1B34] border-[#FF4D64] text-white shadow-md shadow-[#DE1B34]/25'
              : 'bg-[#07090E] border-white/[0.08] text-[#CBD5E1] hover:text-white hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-extrabold leading-tight">2. Ajout Studio</span>
            <Upload className="w-3.5 h-3.5 shrink-0 opacity-90" />
          </div>
          <span
            className={`text-[10px] font-mono block truncate ${
              adminMainTab === 'UPLOAD' ? 'text-white/95' : 'text-[#A3A9BA]'
            }`}
          >
            Opus -14 LUFS &amp; CID
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING_SNAPPY}
          onClick={() => onSelectMainTab('BANNERS')}
          className={`p-2.5 rounded-xl text-left border flex flex-col justify-between gap-1 cursor-pointer ${
            adminMainTab === 'BANNERS'
              ? 'bg-[#DE1B34] border-[#FF4D64] text-white shadow-md shadow-[#DE1B34]/25'
              : 'bg-[#07090E] border-white/[0.08] text-[#CBD5E1] hover:text-white hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-extrabold leading-tight">3. Bannières Pub</span>
            <Layers className="w-3.5 h-3.5 shrink-0 opacity-90" />
          </div>
          <span
            className={`text-[10px] font-mono block truncate ${
              adminMainTab === 'BANNERS' ? 'text-white/95' : 'text-[#A3A9BA]'
            }`}
          >
            {bannersCount} slide(s) Central
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING_SNAPPY}
          onClick={() => onSelectMainTab('DATABASE')}
          className={`p-2.5 rounded-xl text-left border flex flex-col justify-between gap-1 cursor-pointer ${
            adminMainTab === 'DATABASE'
              ? 'bg-[#DE1B34] border-[#FF4D64] text-white shadow-md shadow-[#DE1B34]/25'
              : 'bg-[#07090E] border-white/[0.08] text-[#CBD5E1] hover:text-white hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-extrabold leading-tight">4. Base de données</span>
            <Database className="w-3.5 h-3.5 shrink-0 opacity-90" />
          </div>
          <span
            className={`text-[10px] font-mono block truncate ${
              adminMainTab === 'DATABASE' ? 'text-white/95' : 'text-[#A3A9BA]'
            }`}
          >
            Métiers &amp; SQL Cloud
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING_SNAPPY}
          onClick={() => onSelectMainTab('USERS')}
          className={`p-2.5 rounded-xl text-left border flex flex-col justify-between gap-1 cursor-pointer ${
            adminMainTab === 'USERS'
              ? 'bg-[#DE1B34] border-[#FF4D64] text-white shadow-md shadow-[#DE1B34]/25'
              : 'bg-[#07090E] border-white/[0.08] text-[#CBD5E1] hover:text-white hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-extrabold leading-tight">5. Auditeurs</span>
            <Users className="w-3.5 h-3.5 shrink-0 opacity-90" />
          </div>
          <span
            className={`text-[10px] font-mono block truncate ${
              adminMainTab === 'USERS' ? 'text-white/95' : 'text-[#A3A9BA]'
            }`}
          >
            {usersCount} comptes actifs
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING_SNAPPY}
          onClick={() => onSelectMainTab('ROYALTIES_BUGADA')}
          className={`p-2.5 rounded-xl text-left border flex flex-col justify-between gap-1 cursor-pointer ${
            adminMainTab === 'ROYALTIES_BUGADA'
              ? 'bg-emerald-500 border-emerald-400 text-[#080A0F] shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/20'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-extrabold leading-tight">6. Royalties &amp; BUGADA</span>
            <Shield className="w-3.5 h-3.5 shrink-0" />
          </div>
          <span
            className={`text-[10px] font-mono block truncate ${
              adminMainTab === 'ROYALTIES_BUGADA' ? 'text-[#080A0F]/85 font-bold' : 'text-emerald-300/90'
            }`}
          >
            60/40 • B2B • Modèle 36M
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING_SNAPPY}
          onClick={() => onSelectMainTab('SPONSOR_CAMPAIGNS')}
          className={`p-2.5 rounded-xl text-left border flex flex-col justify-between gap-1 cursor-pointer ${
            adminMainTab === 'SPONSOR_CAMPAIGNS'
              ? 'bg-amber-500 border-amber-400 text-[#080A0F] shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'bg-amber-500/10 border-amber-500/35 text-amber-300 hover:bg-amber-500/20'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-extrabold leading-tight">7. Partenaires</span>
            <Coins className="w-3.5 h-3.5 shrink-0" />
          </div>
          <span
            className={`text-[10px] font-mono block truncate ${
              adminMainTab === 'SPONSOR_CAMPAIGNS' ? 'text-[#080A0F]/85 font-bold' : 'text-amber-300/90'
            }`}
          >
            Sponsors &amp; Jetons
          </span>
        </motion.button>
      </nav>
    </motion.div>
  );
};
