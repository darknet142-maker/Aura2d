import React from 'react';
import { Server, Database, ShieldCheck, Radio, CheckCircle2, Cpu } from 'lucide-react';
import type { AdminSpaceId } from '../../types/admin-spaces.types';

export interface OverviewMicroservicesHealthBarProps {
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
  latencyMs?: number;
}

export const OverviewMicroservicesHealthBar: React.FC<OverviewMicroservicesHealthBarProps> = ({
  onNavigateToSpace,
  latencyMs = 12,
}) => {
  const services = [
    { id: 'edge', name: 'API Edge Gateway', status: '100.00%', ping: `${latencyMs} ms`, ok: true, space: '07_INFRASTRUCTURE' as AdminSpaceId },
    { id: 'pg', name: 'PostgreSQL Supabase', status: 'Opérationnel', ping: 'Cluster A', ok: true, space: '07_INFRASTRUCTURE' as AdminSpaceId },
    { id: 'drm', name: 'Keystore DRM AES-256', status: 'Intègre', ping: '0 fuite', ok: true, space: '08_SECURITY' as AdminSpaceId },
    { id: 'sse', name: 'Moteur Push SSE Live', status: 'Connecté', ping: '24/24', ok: true, space: '07_INFRASTRUCTURE' as AdminSpaceId },
    { id: 'mobile', name: 'Mobile Money CEMAC', status: 'Airtel / Moov', ping: 'Synchro', ok: true, space: '05_FINANCE' as AdminSpaceId },
  ];

  return (
    <div className="p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
      <div
        onClick={() => onNavigateToSpace('07_INFRASTRUCTURE')}
        className="flex items-center gap-3 cursor-pointer group shrink-0"
        title="Ouvrir la télémétrie infrastructure"
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
          <Cpu className="w-5 h-5" />
          <span className="text-[9px] font-black leading-none mt-0.5">SLA</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black text-emerald-400 tracking-tight">100.00%</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
          </div>
          <span className="text-[10px] text-[#A3A9BA]">Disponibilité Globale Système</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full md:w-auto flex-1">
        {services.map((s) => (
          <div
            key={s.id}
            onClick={() => onNavigateToSpace(s.space)}
            className="p-2 rounded-xl bg-[#07090E] border border-white/[0.06] hover:border-emerald-500/30 cursor-pointer transition flex flex-col justify-between"
            title={`Vérifier le microservice ${s.name}`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9.5px] text-[#A3A9BA] truncate">{s.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[11px] font-extrabold text-[#F8FAFC] truncate">{s.status}</span>
              <span className="text-[9px] text-emerald-400 font-bold">{s.ping}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

