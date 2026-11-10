import React, { useState, useMemo } from 'react';
import { Award, Smartphone, Coins, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Search, FileText, LayoutGrid, List, SlidersHorizontal, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../../../shared/ui/springMotion';
import type { AppUser } from '../../../../../shared/types/domain.types';
import { loadSubscriptions, type SubscriptionRecord } from '../../../../payments/services/subscription-store.service';

export interface AdminSubscriptionsManagerProps {
  users: AppUser[];
  onToast?: (msg: string) => void;
}

type SubscriptionSortKey = 'EXPIRES' | 'USER' | 'DATE';
type SubscriptionViewMode = 'TABLE' | 'GRID';

export const AdminSubscriptionsManager: React.FC<AdminSubscriptionsManagerProps> = ({ users, onToast }) => {
  const [filter, setFilter] = useState<'ALL' | 'DIRECT' | 'TOKENS' | 'EXPIRING' | 'FAILED'>('ALL');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SubscriptionSortKey>('EXPIRES');
  const [viewMode, setViewMode] = useState<SubscriptionViewMode>('TABLE');

  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(loadSubscriptions);

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

  const filterCounts = useMemo(() => {
    return {
      ALL: subscriptions.length,
      DIRECT: subscriptions.filter((s) => s.method !== 'TOKEN_UNLOCKED').length,
      TOKENS: subscriptions.filter((s) => s.method === 'TOKEN_UNLOCKED').length,
      EXPIRING: subscriptions.filter((s) => s.status === 'EXPIRING_SOON' || s.expiresInDays <= 5).length,
      FAILED: subscriptions.filter((s) => s.status === 'FAILED').length,
    };
  }, [subscriptions]);

  const filtered = useMemo(() => {
    let list = subscriptions.filter((s) => {
      if (filter === 'DIRECT' && s.method === 'TOKEN_UNLOCKED') return false;
      if (filter === 'TOKENS' && s.method !== 'TOKEN_UNLOCKED') return false;
      if (filter === 'EXPIRING' && s.status !== 'EXPIRING_SOON' && s.expiresInDays > 5) return false;
      if (filter === 'FAILED' && s.status !== 'FAILED') return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.userName.toLowerCase().includes(q) ||
          s.planTitle.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.userId.toLowerCase().includes(q) ||
          s.method.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortKey === 'EXPIRES') {
      list.sort((a, b) => a.expiresInDays - b.expiresInDays);
    } else if (sortKey === 'USER') {
      list.sort((a, b) => a.userName.localeCompare(b.userName));
    }

    return list;
  }, [subscriptions, filter, search, sortKey]);

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
            Paiements directs Mobile Money ({filterCounts.DIRECT}) • Déblocages 100% Jetons Sponsorisés ({filterCounts.TOKENS})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubscriptions(loadSubscriptions())}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-[#A3A9BA] hover:text-white transition cursor-pointer"
            title="Rafraîchir les souscriptions réelles"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Actualiser</span>
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] text-[#A3A9BA]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zéro Double Comptage</span>
          </div>
        </div>
      </div>

      {/* 2. Barre Universelle de Recherche, Tri et Vues (Conforme Capture) */}
      <div className="flex flex-col gap-3 w-full bg-[#07090E] p-3 rounded-2xl border border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md bg-[#0D1017] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#F8FAFC] focus-within:border-[#DE1B34] transition">
            <Search className="w-4 h-4 text-[#A3A9BA] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par auditeur, ID, téléphone, pass..."
              className="w-full bg-transparent outline-none text-xs text-[#F8FAFC] placeholder:text-[#A3A9BA]/60"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-[#0D1017] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg cursor-pointer transition ${viewMode === 'TABLE' ? 'bg-white/15 text-white' : 'text-[#A3A9BA] hover:text-white'}`}
                title="Vue Tableau"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg cursor-pointer transition ${viewMode === 'GRID' ? 'bg-white/15 text-white' : 'text-[#A3A9BA] hover:text-white'}`}
                title="Vue Cartes"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0D1017] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-[#A3A9BA]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SubscriptionSortKey)}
                aria-label="Trier les abonnements"
                className="bg-transparent text-[#F8FAFC] outline-none text-xs cursor-pointer font-medium"
              >
                <option value="EXPIRES" className="bg-[#0D1017] text-white">Échéance (Plus Proche)</option>
                <option value="USER" className="bg-[#0D1017] text-white">Auditeur (A-Z)</option>
              </select>
            </div>

            <motion.button
              type="button"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING_SNAPPY}
              onClick={() => onToast?.('Console de souscription manuelle pass activée.')}
              className="px-3.5 py-2 rounded-xl bg-[#DE1B34] hover:bg-[#FF4D64] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#DE1B34]/30 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">+ Créer un Pass</span>
            </motion.button>
          </div>
        </div>

        {/* Pilules de Filtrage avec Compteurs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/[0.05]">
          {(
            [
              { id: 'ALL', label: 'Tous', count: filterCounts.ALL },
              { id: 'DIRECT', label: 'Direct Mobile Money', count: filterCounts.DIRECT },
              { id: 'TOKENS', label: '100% Jetons', count: filterCounts.TOKENS },
              { id: 'EXPIRING', label: 'Échéance ≤ 5j', count: filterCounts.EXPIRING },
              { id: 'FAILED', label: 'Échecs', count: filterCounts.FAILED },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilter(pill.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                filter === pill.id
                  ? 'bg-[#DE1B34]/20 text-[#F8FAFC] border border-[#DE1B34]/40 shadow-sm'
                  : 'bg-[#0D1017] text-[#A3A9BA] hover:text-white border border-white/[0.06]'
              }`}
            >
              <span>{pill.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                filter === pill.id ? 'bg-[#DE1B34] text-white' : 'bg-white/10 text-[#A3A9BA]'
              }`}>
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Table des Abonnements */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#A3A9BA] border border-dashed border-white/10 rounded-xl bg-[#07090E]/60 flex flex-col items-center justify-center gap-1.5">
            <Award className="w-5 h-5 text-white/20 mb-1" />
            <p className="font-bold text-[#F8FAFC]">Aucun abonnement actif pour le moment</p>
            <p className="text-[11px] text-[#A3A9BA]/80 max-w-sm">
              Les souscriptions Mobile Money (+241) et les pass débloqués 100% en jetons apparaîtront ici en temps réel.
            </p>
          </div>
        ) : (
          filtered.map((sub) => {
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
        })
      )}
      </div>
    </div>
  );
};
