import React, { useState } from 'react';
import { Award, Smartphone, Coins, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Search, FileText } from 'lucide-react';
import type { AppUser } from '../../../../../shared/types/domain.types';

export interface AdminSubscriptionsManagerProps {
  users: AppUser[];
  onToast?: (msg: string) => void;
}

interface SubscriptionRecord {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  planTitle: string;
  method: 'AIRTEL_MONEY' | 'MOOV_MONEY' | 'CARD' | 'TOKEN_UNLOCKED';
  amountFcfa: number;
  tokensCost?: number;
  startDate: string;
  expiresInDays: number;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'FAILED' | 'SUSPENDED';
  autoRenew: boolean;
}

export const AdminSubscriptionsManager: React.FC<AdminSubscriptionsManagerProps> = ({ users, onToast }) => {
  const [filter, setFilter] = useState<'ALL' | 'DIRECT' | 'TOKENS' | 'EXPIRING' | 'FAILED'>('ALL');
  const [search, setSearch] = useState('');

  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([
    {
      id: 'sub-01',
      userId: users[0]?.id || 'usr-1',
      userName: users[0]?.name || 'Junior Ndong',
      userAvatar: users[0]?.avatar || '🎧',
      planTitle: 'Pass Mensuel Premium',
      method: 'AIRTEL_MONEY',
      amountFcfa: 1500,
      startDate: '01 Mars 2026',
      expiresInDays: 22,
      status: 'ACTIVE',
      autoRenew: true,
    },
    {
      id: 'sub-02',
      userId: users[1]?.id || 'usr-2',
      userName: users[1]?.name || 'Sylvie Mboumba',
      userAvatar: users[1]?.avatar || '🎵',
      planTitle: 'Pass Mensuel Premium',
      method: 'TOKEN_UNLOCKED',
      amountFcfa: 0,
      tokensCost: 500,
      startDate: '12 Fév 2026',
      expiresInDays: 4,
      status: 'EXPIRING_SOON',
      autoRenew: false,
    },
    {
      id: 'sub-03',
      userId: users[2]?.id || 'usr-3',
      userName: users[2]?.name || 'Marc Ella',
      userAvatar: users[2]?.avatar || '⚡',
      planTitle: 'Pass Hebdo 7 Jours',
      method: 'MOOV_MONEY',
      amountFcfa: 500,
      startDate: '06 Mars 2026',
      expiresInDays: 3,
      status: 'ACTIVE',
      autoRenew: true,
    },
    {
      id: 'sub-04',
      userId: 'usr-99',
      userName: 'Boris Nguema',
      userAvatar: '🎤',
      planTitle: 'Pass Mensuel Premium',
      method: 'AIRTEL_MONEY',
      amountFcfa: 1500,
      startDate: '08 Mars 2026',
      expiresInDays: 0,
      status: 'FAILED',
      autoRenew: false,
    },
  ]);

  const handleAction = (subId: string, action: 'SUSPEND' | 'ACTIVATE' | 'EXTEND' | 'RECEIPT') => {
    if (action === 'EXTEND') {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, expiresInDays: s.expiresInDays + 7, status: 'ACTIVE' } : s))
      );
      onToast?.(`Geste commercial : Abonnement #${subId} prolongé de 7 jours.`);
      return;
    }

    if (action === 'RECEIPT') {
      onToast?.(`Bordereau fiscal & reçu dématérialisé #${subId} généré (PDF DGI).`);
      return;
    }

    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== subId) return s;
        if (action === 'SUSPEND') return { ...s, status: 'SUSPENDED' };
        if (action === 'ACTIVATE') return { ...s, status: 'ACTIVE' };
        return s;
      })
    );
    onToast?.(`Statut mis à jour sur l'abonnement #${subId}.`);
  };

  const filtered = subscriptions.filter((s) => {
    if (filter === 'DIRECT' && s.method === 'TOKEN_UNLOCKED') return false;
    if (filter === 'TOKENS' && s.method !== 'TOKEN_UNLOCKED') return false;
    if (filter === 'EXPIRING' && s.status !== 'EXPIRING_SOON') return false;
    if (filter === 'FAILED' && s.status !== 'FAILED') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.userName.toLowerCase().includes(q) || s.planTitle.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    }
    return true;
  });

  const directCount = subscriptions.filter((s) => s.method !== 'TOKEN_UNLOCKED').length;
  const tokenCount = subscriptions.filter((s) => s.method === 'TOKEN_UNLOCKED').length;
  const failedCount = subscriptions.filter((s) => s.status === 'FAILED').length;

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3.5 font-mono text-xs">
      {/* 1. En-tête & Synthèse Calme */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#A3A9BA]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
              Gestionnaire du Cycle de Vie des Abonnements
            </h3>
          </div>
          <p className="text-[10px] text-[#A3A9BA]">
            Paiements directs Mobile Money ({directCount}) • Déblocages 100% Jetons Sponsorisés ({tokenCount})
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] text-[#A3A9BA]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zéro Double Comptage</span>
        </div>
      </div>

      {/* 2. Filtres & Recherche Sobre */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#07090E] border border-white/[0.06] text-[10.5px] flex-wrap">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
              filter === 'ALL' ? 'bg-white/10 text-white font-bold shadow-sm' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            Tous ({subscriptions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('DIRECT')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
              filter === 'DIRECT' ? 'bg-white/10 text-white font-bold shadow-sm' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            Paiements Directs ({directCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('TOKENS')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
              filter === 'TOKENS' ? 'bg-white/10 text-white font-bold shadow-sm' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            100% Jetons ({tokenCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('EXPIRING')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
              filter === 'EXPIRING' ? 'bg-white/10 text-white font-bold shadow-sm' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            Échéance &lt; 5j
          </button>
          {failedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('FAILED')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
                filter === 'FAILED' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              Échecs ({failedCount})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 bg-[#07090E] border border-white/10 rounded-xl px-2.5 py-1 text-xs">
          <Search className="w-3.5 h-3.5 text-[#A3A9BA]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer par nom..."
            className="bg-transparent outline-none text-[#F8FAFC] placeholder:text-[#A3A9BA]/50 text-xs w-32 sm:w-36"
          />
        </div>
      </div>

      {/* 3. Table des Abonnements */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
        {filtered.map((sub) => {
          const isDirect = sub.method !== 'TOKEN_UNLOCKED';

          return (
            <div
              key={sub.id}
              className="p-3 rounded-xl bg-[#07090E] border border-white/[0.05] hover:border-white/15 transition flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0">
                  {sub.userAvatar}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F8FAFC] truncate">{sub.userName}</span>
                    <span className="flex items-center gap-1.5 text-[10px] text-[#A3A9BA]">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          sub.status === 'ACTIVE'
                            ? 'bg-emerald-400'
                            : sub.status === 'EXPIRING_SOON'
                            ? 'bg-amber-400'
                            : sub.status === 'FAILED'
                            ? 'bg-rose-400'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span>{sub.method.replace('_', ' ')}</span>
                    </span>
                  </div>
                  <span className="text-[10.5px] text-[#A3A9BA] block">
                    {sub.planTitle} • {sub.status === 'FAILED' ? 'Échec prélèvement (Période de grâce 48h)' : `Échéance dans ${sub.expiresInDays}j ${sub.autoRenew ? '(Reconduction auto)' : ''}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="font-bold text-[#F8FAFC] tabular-nums">
                  {isDirect ? `${sub.amountFcfa.toLocaleString()} F` : `${sub.tokensCost} JTN`}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAction(sub.id, 'RECEIPT')}
                    title="Générer reçu fiscal"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#A3A9BA] hover:text-white border border-white/10 cursor-pointer transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(sub.id, 'EXTEND')}
                    title="Geste commercial (+7j)"
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#A3A9BA] hover:text-white border border-white/10 text-[10px] cursor-pointer transition"
                  >
                    +7j
                  </button>

                  {sub.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      onClick={() => handleAction(sub.id, 'SUSPEND')}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-[#A3A9BA] hover:text-rose-300 border border-white/10 text-[10px] cursor-pointer transition"
                    >
                      Suspendre
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAction(sub.id, 'ACTIVATE')}
                      className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] cursor-pointer transition"
                    >
                      Réactiver
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
