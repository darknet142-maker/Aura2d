import React from 'react';
import { Save, Radio, ArrowLeft, LayoutGrid, Menu, CheckCircle2, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../../shared/ui/springMotion';
import { AdminBreadcrumb } from './AdminBreadcrumb';
import type { AdminSpaceDef } from '../../types/admin-spaces.types';

export interface AdminHeaderProps {
  currentSpace: AdminSpaceDef;
  subSection?: string;
  isRealtimeConnected: boolean;
  lastAdminSavedAt: string | null;
  isSavingAdmin: boolean;
  onSaveAndSyncAll: (label?: string) => void;
  adminLayoutMode: 'SAAS_2' | 'CLASSIC';
  onToggleLayoutMode: () => void;
  onExitToPlayer: () => void;
  onToggleMobileSidebar?: () => void;
  canGoBack?: boolean;
  previousLabel?: string;
  onGoBack?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentSpace, subSection, isRealtimeConnected, lastAdminSavedAt,
  isSavingAdmin, onSaveAndSyncAll, adminLayoutMode, onToggleLayoutMode,
  onExitToPlayer, onToggleMobileSidebar, canGoBack = false, previousLabel = 'Précédent', onGoBack,
}) => {
  return (
    <header className="h-14 px-4 bg-[#0D1017] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            aria-label="Ouvrir le menu latéral"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center md:hidden cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {canGoBack && onGoBack && (
          <motion.button
            type="button"
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={SPRING_SNAPPY}
            onClick={onGoBack}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
            title={`Revenir en arrière : ${previousLabel}`}
          >
            <ChevronLeft className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline truncate max-w-[140px]">{previousLabel}</span>
          </motion.button>
        )}

        <AdminBreadcrumb currentSpace={currentSpace} subSection={subSection} />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131722] border border-white/10 text-[10px] font-mono">
          <Radio className={`w-3 h-3 ${isRealtimeConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-[#A3A9BA]">Sync Cloud :</span>
          <span className={isRealtimeConnected ? 'text-emerald-300 font-bold' : 'text-amber-300'}>
            {isRealtimeConnected ? 'Actif' : 'Local'}
          </span>
          {lastAdminSavedAt && (
            <span className="text-[#A3A9BA]/60 ml-1">
              ({new Date(lastAdminSavedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleLayoutMode}
          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#CBD5E1] hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
          title="Basculer entre la Vue SaaS Studio 2.0 et la Vue Classique"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">{adminLayoutMode === 'SAAS_2' ? 'Mode Classique' : 'Mode SaaS 2.0'}</span>
        </button>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={SPRING_SNAPPY}
          onClick={() => onSaveAndSyncAll(currentSpace.name)}
          disabled={isSavingAdmin}
          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#080A0F] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
        >
          {isSavingAdmin ? <CheckCircle2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{isSavingAdmin ? 'Synchronisation...' : 'Sauvegarder & Sync'}</span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={SPRING_SNAPPY}
          onClick={onExitToPlayer}
          className="px-2.5 py-1.5 rounded-xl bg-[#131722] hover:bg-white/10 border border-white/10 text-xs text-[#CBD5E1] hover:text-white flex items-center gap-1.5 cursor-pointer transition"
          title="Retourner au lecteur audio"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lecteur</span>
        </motion.button>
      </div>
    </header>
  );
};

