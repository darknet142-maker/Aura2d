import React from 'react';
import {
  Shield,
  CheckCircle2,
  FolderOpen,
  Upload,
  Layers,
  Database,
  Users,
} from 'lucide-react';
import type { AdminMainTabId } from '../backoffice.types';

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
}) => {
  return (
    <>
      <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#0E1118] via-[#121621] to-[#0E1118] border border-emerald-500/30 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center shadow-lg">
        <div className="lg:col-span-5 flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-extrabold text-[#F5F2EB]">
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
            </div>
            <span className="text-[10.5px] font-mono text-zinc-400 block truncate mt-0.5">
              {lastAdminSavedAt
                ? `✓ Dernière sauvegarde multi-appareils : ${lastAdminSavedAt}`
                : 'Modifications synchronisées sur Mobile, Tablette et PC'}
            </span>
          </div>
        </div>

        <div className="lg:col-span-4">
          <button
            type="button"
            onClick={onToggleAwardsCeremony}
            className={`w-full px-3 py-2.5 rounded-xl text-[11px] font-mono font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
              enableAwardsCeremony
                ? 'bg-amber-400 text-[#07080C] border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                : 'bg-[#07080C] hover:bg-white/[0.08] text-amber-200 border-amber-400/30'
            }`}
          >
            <span>
              {enableAwardsCeremony
                ? '★ Cérémonie Awards : ACTIVE (Public)'
                : '☆ Activer Cérémonie DROP Awards'}
            </span>
          </button>
        </div>

        <div className="lg:col-span-3">
          <button
            type="button"
            disabled={isSavingAdmin}
            onClick={() => onSaveAndSyncAll()}
            className="w-full px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07080C] font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {isSavingAdmin
                ? 'Synchronisation...'
                : 'Sauvegarder & Synchroniser Tout'}
            </span>
          </button>
        </div>
      </div>

      <nav
        aria-label="Sections principales de l'administration"
        className="w-full grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 bg-[#0E1118] p-2 rounded-2xl border border-white/[0.08]"
      >
        <button
          type="button"
          onClick={() => onSelectMainTab('CATALOGUE')}
          className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between gap-1 cursor-pointer ${
            adminMainTab === 'CATALOGUE'
              ? 'bg-[#DE1B34] border-[#DE1B34] text-white shadow-md shadow-[#DE1B34]/25'
              : 'bg-[#07080C] border-white/[0.06] text-zinc-300 hover:text-white hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-extrabold leading-tight">1. Catalogue</span>
            <FolderOpen className="w-3.5 h-3.5 shrink-0 opacity-90" />
          </div>
          <span
            className={`text-[10px] font-mono block ${
              adminMainTab === 'CATALOGUE' ? 'text-white/90' : 'text-zinc-500'
            }`}
          >
            {tracksCount} pistes • Rangs &amp; DRM
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMainTab('UPLOAD')}
          className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between gap-1 cursor-pointer ${
            adminMainTab === 'UPLOAD'
              ? 'bg-[#DE1B34] border-[#DE1B34] text-white shadow-md shadow-[#DE1B34]/25'
              : 'bg-[#07080C] border-white/[0.06] text-zinc-300 hover:text-white hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-extrabold leading-tight">2. Ajout Studio</span>
            <Upload className="w-3.5 h-3.5 shrink-0 opacity-90" />
          </div>
          <span
            className={`text-[10px] font-mono block ${
              adminMainTab === 'UPLOAD' ? 'text-white/90' : 'text-zinc-500'
            }`}
          >
            Opus -14 LUFS &amp; CID
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMainTab('BANNERS')}
          className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between gap-1 cursor-pointer ${
            adminMainTab === 'BANNERS'
              ? 'bg-[#DE1B34] border-[#DE1B34] text-white shadow-md shadow-[#DE1B34]/25'
              : 'bg-[#07080C] border-white/[0.06] text-zinc-300 hover:text-white hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-extrabold leading-tight">3. Bannières Pub</span>
            <Layers className="w-3.5 h-3.5 shrink-0 opacity-90" />
          </div>
          <span
            className={`text-[10px] font-mono block ${
              adminMainTab === 'BANNERS' ? 'text-white/90' : 'text-zinc-500'
            }`}
          >
            {bannersCount} slide(s) Central
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMainTab('DATABASE')}
          className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between gap-1 cursor-pointer ${
            adminMainTab === 'DATABASE'
              ? 'bg-[#DE1B34] border-[#DE1B34] text-white shadow-md shadow-[#DE1B34]/25'
              : 'bg-[#07080C] border-white/[0.06] text-zinc-300 hover:text-white hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-extrabold leading-tight">4. Base de données</span>
            <Database className="w-3.5 h-3.5 shrink-0 opacity-90" />
          </div>
          <span
            className={`text-[10px] font-mono block ${
              adminMainTab === 'DATABASE' ? 'text-white/90' : 'text-zinc-500'
            }`}
          >
            Métiers &amp; SQL Cloud
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMainTab('USERS')}
          className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between gap-1 cursor-pointer ${
            adminMainTab === 'USERS'
              ? 'bg-[#DE1B34] border-[#DE1B34] text-white shadow-md shadow-[#DE1B34]/25'
              : 'bg-[#07080C] border-white/[0.06] text-zinc-300 hover:text-white hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-extrabold leading-tight">5. Auditeurs</span>
            <Users className="w-3.5 h-3.5 shrink-0 opacity-90" />
          </div>
          <span
            className={`text-[10px] font-mono block ${
              adminMainTab === 'USERS' ? 'text-white/90' : 'text-zinc-500'
            }`}
          >
            {usersCount} comptes actifs
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMainTab('ROYALTIES_BUGADA')}
          className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between gap-1 cursor-pointer ${
            adminMainTab === 'ROYALTIES_BUGADA'
              ? 'bg-emerald-500 border-emerald-400 text-[#07080C] shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/20'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-extrabold leading-tight">6. Royalties &amp; BUGADA</span>
            <Shield className="w-3.5 h-3.5 shrink-0" />
          </div>
          <span
            className={`text-[10px] font-mono block ${
              adminMainTab === 'ROYALTIES_BUGADA' ? 'text-[#07080C]/80 font-bold' : 'text-emerald-300/80'
            }`}
          >
            60/40 • B2B • Modèle 36M
          </span>
        </button>
      </nav>
    </>
  );
};

