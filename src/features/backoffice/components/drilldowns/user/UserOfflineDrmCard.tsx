import React from 'react';
import { Smartphone, QrCode, Lock, CheckCircle2 } from 'lucide-react';
import type { AppUser } from '../../../../../shared/types/domain.types';

export interface UserOfflineDrmCardProps {
  user: AppUser;
}

export const UserOfflineDrmCard: React.FC<UserOfflineDrmCardProps> = ({ user }) => {
  return (
    <div className="p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between space-y-2.5">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F8FAFC]">
            Téléchargements Privés &amp; DRM Mobile
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
          Stockage Sandbox
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#A3A9BA] block">Titres Hors-Ligne</span>
            <span className="text-base font-extrabold text-[#F8FAFC]">5 Pistes</span>
          </div>
          <Lock className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#A3A9BA] block">Autorisation QR</span>
            <span className="text-base font-extrabold text-cyan-300">Validée</span>
          </div>
          <QrCode className="w-4 h-4 text-cyan-400" />
        </div>
      </div>

      <div className="p-2 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center justify-between text-[10px] font-mono">
        <span className="text-[#A3A9BA]">Appareil : Mobile App iOS / Android</span>
        <span className="text-emerald-400 font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Zéro fuite web
        </span>
      </div>
    </div>
  );
};

