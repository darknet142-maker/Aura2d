import React from 'react';
import { Radio, Database, ShieldCheck, CheckCircle2, AlertTriangle, Key, Clock, ArrowRight } from 'lucide-react';
import type { SyncStatusSnapshot } from '../../../../services/offlineStreamTracker';
import type { AdminSpaceId } from '../../types/admin-spaces.types';

export interface OverviewAlertsAndServicesProps {
  syncSnapshot: SyncStatusSnapshot;
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
}

export const OverviewAlertsAndServices: React.FC<OverviewAlertsAndServicesProps> = ({
  syncSnapshot, onNavigateToSpace,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
      {/* 1. Statut des Microservices */}
      <div className="lg:col-span-6 p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-[#F8FAFC]">
              Supervision Microservices &amp; Réseau
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">Uptime : 100.00%</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex flex-col justify-between">
            <span className="text-[#A3A9BA]">API Express (Port 3000)</span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-emerald-400 font-bold">12 ms</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex flex-col justify-between">
            <span className="text-[#A3A9BA]">Supabase SQL Cloud</span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-emerald-400 font-bold">Connecté</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex flex-col justify-between">
            <span className="text-[#A3A9BA]">Coffre DRM AES-256</span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-emerald-400 font-bold">Chiffré RAM</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex flex-col justify-between">
            <span className="text-[#A3A9BA]">Queue Store-and-Forward</span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[#F8FAFC]">{syncSnapshot.queue.length} ops en file</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Centre d'Alertes Stratégiques */}
      <div className="lg:col-span-6 p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-[#F8FAFC]">
              Centre d&apos;Alertes &amp; Échéances
            </h3>
          </div>
          <span className="text-[10px] font-mono text-amber-400">3 Notifications</span>
        </div>

        <div className="space-y-2">
          <div
            onClick={() => onNavigateToSpace('08_SECURITY')}
            className="p-2 rounded-xl bg-[#07090E] border border-white/[0.05] hover:border-white/20 flex items-center justify-between text-xs cursor-pointer group transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Key className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-[#F8FAFC] truncate">Rotation des Clés AES-256 programmée</p>
                <p className="text-[10px] font-mono text-[#A3A9BA]">Cycle de sécurité 7 jours automatique actif</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#A3A9BA] group-hover:text-white shrink-0" />
          </div>

          <div
            onClick={() => onNavigateToSpace('05_FINANCE')}
            className="p-2 rounded-xl bg-[#07090E] border border-white/[0.05] hover:border-white/20 flex items-center justify-between text-xs cursor-pointer group transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-[#F8FAFC] truncate">Clôture Mensuelle BUGADA 12%</p>
                <p className="text-[10px] font-mono text-[#A3A9BA]">Bordereau fiscal DGI et ordonnancement prêts</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#A3A9BA] group-hover:text-white shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};

