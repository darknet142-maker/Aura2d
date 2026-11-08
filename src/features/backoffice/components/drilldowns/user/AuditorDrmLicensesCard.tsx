import React from 'react';
import { Lock, Smartphone, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import type { AppUser } from '../../../../../shared/types/domain.types';

export interface AuditorDrmLicensesCardProps {
  user: AppUser;
}

export const AuditorDrmLicensesCard: React.FC<AuditorDrmLicensesCardProps> = ({ user }) => {
  const offlineTracks = [
    { id: 'trk-01', title: 'Mayombe Groove', artist: 'Queen Koumb', size: '8.4 Mo', validUntil: 'Dans 11 jours', cipher: 'AES-256-GCM' },
    { id: 'trk-02', title: 'Bantu Vibe', artist: 'Zebila Sound', size: '7.9 Mo', validUntil: 'Dans 11 jours', cipher: 'AES-256-GCM' },
    { id: 'trk-03', title: 'Ogooué Sunset', artist: 'Lord Ekomy Ndong', size: '9.1 Mo', validUntil: 'Dans 13 jours', cipher: 'AES-256-GCM' },
  ];

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Coffre-fort DRM Mobile &amp; Licences Hors-Ligne ({offlineTracks.length} Titres)
          </h3>
        </div>
        <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
          Stockage Sandbox Privé
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center justify-between">
          <div>
            <span className="text-[9.5px] uppercase text-[#A3A9BA] block">Espace Chiffré Utilisé</span>
            <span className="text-base font-black text-[#F8FAFC]">25.4 Mo</span>
          </div>
          <Smartphone className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center justify-between">
          <div>
            <span className="text-[9.5px] uppercase text-[#A3A9BA] block">Fenêtre de Renouvellement</span>
            <span className="text-base font-black text-emerald-400">14 Jours Max</span>
          </div>
          <Clock className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
        {offlineTracks.map((t) => (
          <div
            key={t.id}
            className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0 text-emerald-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-[#F8FAFC] block truncate">{t.title}</span>
                <span className="text-[9.5px] text-[#A3A9BA] block truncate">
                  {t.artist} • {t.size} • Chiffrement : {t.cipher}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-emerald-400 font-bold block">{t.validUntil}</span>
              <span className="text-[9px] text-[#A3A9BA]">Licence Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
