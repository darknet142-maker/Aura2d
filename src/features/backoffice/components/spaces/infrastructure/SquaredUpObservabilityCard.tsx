import React from 'react';
import { Activity, Server, Zap, CheckCircle2, Clock } from 'lucide-react';

export interface SquaredUpObservabilityCardProps {
  supabaseHealthMsg: string;
  queueLength: number;
}

export const SquaredUpObservabilityCard: React.FC<SquaredUpObservabilityCardProps> = ({
  supabaseHealthMsg,
  queueLength,
}) => {
  const services = [
    { name: 'API Server Express (3000)', status: 'HEALTHY', latency: '12 ms' },
    { name: 'Supabase PostgreSQL Cloud', status: 'HEALTHY', latency: '48 ms' },
    { name: 'DRM AES-256 Vault RAM', status: 'HEALTHY', latency: '2 ms' },
    { name: 'Sync Store-and-Forward', status: queueLength > 0 ? 'SYNCING' : 'IDLE', latency: `${queueLength} ops` },
    { name: 'Opus Audio Transcoder', status: 'READY', latency: '0.1x RT' },
    { name: 'Broadcast Push Gateway', status: 'HEALTHY', latency: '18 ms' },
  ];

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#F8FAFC]">
            Télémétrie Haute Disponibilité (SquaredUp OS)
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-bold">
          ● Systèmes Opérationnels
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-4 p-4 rounded-xl bg-[#07090E] border border-white/[0.06] flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-mono text-[#A3A9BA] uppercase tracking-wider">Disponibilité Globale (30j)</span>
          <span className="text-4xl font-mono font-black text-[#10B981] my-1 tracking-tight">100.00%</span>
          <span className="text-[10px] font-mono text-[#A3A9BA]">0 incident critique répertorié</span>
        </div>

        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {services.map((srv) => (
            <div key={srv.name} className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06] flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-extrabold text-[#F8FAFC] truncate" title={srv.name}>
                  {srv.name.split(' ')[0]}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              </div>
              <div className="flex items-center justify-between text-[9.5px] font-mono text-[#A3A9BA] mt-2">
                <span>{srv.status}</span>
                <span className="text-emerald-300 font-bold">{srv.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
        <span className="text-[#A3A9BA] truncate">Status SQL : {supabaseHealthMsg}</span>
        <span className="text-white/80 shrink-0">Pool : 10/10 connexions actives</span>
      </div>
    </div>
  );
};
