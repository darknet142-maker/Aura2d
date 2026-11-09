import React, { useState } from 'react';
import { User, ShieldAlert, ShieldCheck, Ban, CheckCircle, RefreshCw, MapPin, Calendar, Clock } from 'lucide-react';
import type { AppUser } from '../../../../../shared/types/domain.types';

export interface UserIdentityAndActionsCardProps {
  user: AppUser;
  onStatusChange?: (newStatus: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED') => void;
  onToast?: (msg: string) => void;
}

export const UserIdentityAndActionsCard: React.FC<UserIdentityAndActionsCardProps> = ({
  user,
  onStatusChange,
  onToast,
}) => {
  const [accountStatus, setAccountStatus] = useState<'ACTIVE' | 'RESTRICTED' | 'SUSPENDED'>('ACTIVE');
  const [auditScore] = useState(99.8);

  const registrationDate = '14 Janvier 2026';
  const country = 'Gabon (GA) • Libreville';
  const phone = '+241 77 12 34 56';

  const handleUpdateStatus = (status: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED') => {
    setAccountStatus(status);
    if (onStatusChange) onStatusChange(status);
    if (onToast) {
      onToast(`Compte auditeur passé en statut : ${status === 'ACTIVE' ? 'Actif' : status === 'RESTRICTED' ? 'Restreint' : 'Suspendu'}`);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-xl shrink-0">
            {user.avatar || '🎧'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#F8FAFC]">{user.name}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                  accountStatus === 'ACTIVE'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : accountStatus === 'RESTRICTED'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                {accountStatus === 'ACTIVE' ? 'Compte Actif' : accountStatus === 'RESTRICTED' ? 'Restreint' : 'Suspendu'}
              </span>
            </div>
            <p className="text-[10px] text-[#A3A9BA]">
              ID: {user.id} • {phone}
            </p>
          </div>
        </div>

        {/* Boutons d'actions administratives directes */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {accountStatus !== 'ACTIVE' && (
            <button
              type="button"
              onClick={() => handleUpdateStatus('ACTIVE')}
              className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Réactiver</span>
            </button>
          )}

          {accountStatus === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => handleUpdateStatus('RESTRICTED')}
              className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition"
              title="Restreindre les téléchargements hors-ligne et limiter les missions"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Restreindre</span>
            </button>
          )}

          {accountStatus !== 'SUSPENDED' && (
            <button
              type="button"
              onClick={() => handleUpdateStatus('SUSPENDED')}
              className="px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition"
              title="Bloquer l'accès complet au compte et geler les jetons"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Suspendre</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onToast && onToast(`Sessions révoquées pour ${user.name}. Reconnexion requise.`)}
            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition"
            title="Forcer la réinitialisation des tokens de session JWT"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Session</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9.5px] text-[#A3A9BA] uppercase block">Pays &amp; Région</span>
            <span className="font-bold text-[#F8FAFC] truncate block">{country}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9.5px] text-[#A3A9BA] uppercase block">Date d&apos;inscription</span>
            <span className="font-bold text-[#F8FAFC] truncate block">{registrationDate}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9.5px] text-[#A3A9BA] uppercase block">Score Anti-Fraude</span>
            <span className="font-bold text-emerald-400 tabular-nums block">{auditScore}% (Zéro Bot)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
