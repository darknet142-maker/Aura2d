import React from 'react';
import { Sparkles, ArrowUpRight, FolderOpen, Upload, Users, Coins, DollarSign, Shield } from 'lucide-react';
import type { AdminSpaceId } from '../../types/admin-spaces.types';

export interface OverviewAuditTickerProps {
  ledgerEntries: any[];
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
}

export const OverviewAuditTicker: React.FC<OverviewAuditTickerProps> = ({
  ledgerEntries, onNavigateToSpace,
}) => {
  const quickActions: { id: AdminSpaceId; label: string; icon: React.ReactNode; color: string }[] = [
    { id: '01_CATALOGUE', label: 'Repertoire', icon: <FolderOpen className="w-3.5 h-3.5" />, color: 'hover:border-[#DE1B34]' },
    { id: '02_STUDIO', label: 'Mastering', icon: <Upload className="w-3.5 h-3.5" />, color: 'hover:border-cyan-400' },
    { id: '03_LISTENERS', label: 'Auditeurs', icon: <Users className="w-3.5 h-3.5" />, color: 'hover:border-emerald-400' },
    { id: '04_PARTNERS', label: 'Campagnes', icon: <Coins className="w-3.5 h-3.5" />, color: 'hover:border-amber-400' },
    { id: '05_FINANCE', label: 'Royalties', icon: <DollarSign className="w-3.5 h-3.5" />, color: 'hover:border-emerald-400' },
    { id: '08_SECURITY', label: 'DRM Vault', icon: <Shield className="w-3.5 h-3.5" />, color: 'hover:border-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
      {/* 1. Audit Live Ledger */}
      <div className="lg:col-span-8 p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-[#F8FAFC]">
              Journal de Bord &amp; Télémétrie en Direct
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSpace('04_PARTNERS')}
            className="text-[10px] font-mono text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Voir Grand Livre</span> <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {ledgerEntries.slice(0, 6).map((e) => (
            <div
              key={e.transactionId}
              className="p-2 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center justify-between gap-2 text-[11px]"
            >
              <div className="min-w-0">
                <div className="font-bold text-[#F8FAFC] truncate">{e.referenceNote || e.reason}</div>
                <div className="text-[9px] text-[#A3A9BA] font-mono">
                  {new Date(e.timestampIso).toLocaleTimeString('fr-FR')} • {e.sourceBucket} → {e.destinationBucket}
                </div>
              </div>
              <span className="font-mono font-extrabold text-amber-400 shrink-0">
                +{e.amountTokens.toLocaleString('fr-FR')} JTN
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Raccourcis Tour de Contrôle */}
      <div className="lg:col-span-4 p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 flex flex-col justify-between">
        <div className="border-b border-white/[0.06] pb-2">
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-[#F8FAFC]">
            Accès Rapides Départementaux
          </h3>
          <span className="text-[10px] font-mono text-[#A3A9BA]">Bascule instantanée sans rechargement</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((qa) => (
            <button
              key={qa.id}
              type="button"
              onClick={() => onNavigateToSpace(qa.id)}
              className={`p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06] ${qa.color} text-[#F8FAFC] flex items-center gap-2 text-xs font-bold cursor-pointer transition`}
            >
              <span className="shrink-0">{qa.icon}</span>
              <span className="truncate">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
