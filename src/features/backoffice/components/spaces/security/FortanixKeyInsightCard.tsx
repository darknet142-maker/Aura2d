import React from 'react';
import { Shield, Key, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface FortanixKeyInsightCardProps {
  totalTracks: number;
  encryptedCount: number;
}

export const FortanixKeyInsightCard: React.FC<FortanixKeyInsightCardProps> = ({
  totalTracks,
  encryptedCount,
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#F8FAFC]">
            Gestionnaire de Clés &amp; Coffre AES-256 (Fortanix Insight)
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          Chiffrement Matériel Actif
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center shrink-0">
            <span className="text-sm font-mono font-extrabold text-[#F8FAFC]">{totalTracks}</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-[#A3A9BA] uppercase">Masters Protégés</span>
            <p className="text-xs font-bold text-emerald-400">100% Chiffrés AES-GCM</p>
            <p className="text-[9.5px] font-mono text-[#A3A9BA]">Zéro fuite mémoire</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-[#A3A9BA] flex items-center justify-between">
            <span>Rotation des Clés de Déchiffrement</span>
            <span className="text-emerald-400">7j TTL</span>
          </span>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex my-2">
            <div className="bg-emerald-500 h-full w-[85%]" title="Clés Actives" />
            <div className="bg-amber-400 h-full w-[15%]" title="En Renouvellement" />
          </div>
          <div className="flex items-center justify-between text-[9.5px] font-mono text-[#A3A9BA]">
            <span>Actives : 37</span>
            <span>Révoquées : 0</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-[#A3A9BA] flex items-center justify-between">
            <span>Téléchargements Mobiles QR</span>
            <span className="text-cyan-400">120s TTL</span>
          </span>
          <p className="text-xs font-bold text-[#F8FAFC] my-1">
            Usage Unique Strict &amp; Anti-Rejeu
          </p>
          <span className="text-[9.5px] font-mono text-emerald-400">
            ✓ Téléchargement Web Bloqué
          </span>
        </div>
      </div>
    </div>
  );
};
