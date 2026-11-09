import React, { useState } from 'react';
import { HelpCircle, Check, X, AlertCircle, MessageSquare } from 'lucide-react';
import type { AppUser } from '../../../../../shared/types/domain.types';

export interface UserContestationsCardProps {
  user: AppUser;
  onToast?: (msg: string) => void;
}

interface ContestationItem {
  id: string;
  date: string;
  reason: string;
  details: string;
  requestedCompensation: number;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
}

export const UserContestationsCard: React.FC<UserContestationsCardProps> = ({ user, onToast }) => {
  const [items, setItems] = useState<ContestationItem[]>([
    {
      id: `cont-${user.id}-1`,
      date: 'Hier à 16:30',
      reason: 'Écoute hors-ligne non synchronisée',
      details: 'L’auditeur réclame la validation d’une écoute de 50s en mode avion non comptabilisée lors du zap.',
      requestedCompensation: 25,
      status: 'PENDING',
    },
  ]);

  const handleResolve = (id: string, approve: boolean) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: approve ? 'RESOLVED' : 'REJECTED' } : it))
    );
    if (onToast) {
      onToast(
        approve
          ? `Contestation arbitrée en faveur de ${user.name} (+25 JTN crédités).`
          : `Contestation rejetée avec notification explicative envoyée à ${user.name}.`
      );
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-rose-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Procédures de Contestation &amp; Litiges Auditeur ({items.length})
          </h3>
        </div>
        <span className="text-[10px] text-amber-400 font-bold">Arbitrage Humain Garanti</span>
      </div>

      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.id}
            className="p-3 rounded-xl bg-[#07090E] border border-white/[0.05] flex flex-col gap-2.5 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F8FAFC]">{it.reason}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                    it.status === 'PENDING'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : it.status === 'RESOLVED'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {it.status === 'PENDING' ? 'En attente' : it.status === 'RESOLVED' ? 'Résolue' : 'Rejetée'}
                </span>
              </div>
              <span className="text-[10px] text-[#A3A9BA]">{it.date}</span>
            </div>

            <p className="text-[10.5px] text-[#A3A9BA] leading-relaxed">{it.details}</p>

            {it.status === 'PENDING' && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => handleResolve(it.id, false)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Rejeter</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve(it.id, true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accorder dédommagement (+{it.requestedCompensation} JTN)</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
