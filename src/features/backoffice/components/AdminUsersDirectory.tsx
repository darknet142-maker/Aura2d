import React, { useState, useMemo } from 'react';
import { Users, Search, CheckCircle2, ChevronRight, LayoutGrid, List, SlidersHorizontal, Plus, ShieldCheck, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import type { AppUser } from '../../../shared/types/domain.types';
import { formatLongDuration } from '../../../shared/utils/mediaFormatters';
import { RankBadge } from '../../../shared/ui/RankBadge';

export interface AdminUsersDirectoryProps {
  users: AppUser[];
  onSelectUser: (userId: string) => void;
  onSaveAndSyncAll: (sectionLabel?: string) => void;
}

type UserDirectoryFilter = 'ALL' | 'ACTIVE_PASS' | 'FREEMIUM' | 'TOP_LISTENERS';
type UserSortKey = 'LISTEN_TIME' | 'NAME' | 'PLAYS';
type UserViewMode = 'GRID' | 'TABLE';

export const AdminUsersDirectory: React.FC<AdminUsersDirectoryProps> = ({
  users,
  onSelectUser,
  onSaveAndSyncAll,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserDirectoryFilter>('ALL');
  const [sortKey, setSortKey] = useState<UserSortKey>('LISTEN_TIME');
  const [viewMode, setViewMode] = useState<UserViewMode>('GRID');

  const filterCounts = useMemo(() => {
    return {
      ALL: users.length,
      ACTIVE_PASS: users.filter((u) => u.plan === 'PRO' || u.activeSubscriptionPass).length,
      FREEMIUM: users.filter((u) => u.plan !== 'PRO' && !u.activeSubscriptionPass).length,
      TOP_LISTENERS: users.filter((u) => u.totalListenSeconds > 300).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
    }

    if (filter === 'ACTIVE_PASS') {
      list = list.filter((u) => u.plan === 'PRO' || u.activeSubscriptionPass);
    } else if (filter === 'FREEMIUM') {
      list = list.filter((u) => u.plan !== 'PRO' && !u.activeSubscriptionPass);
    } else if (filter === 'TOP_LISTENERS') {
      list = list.filter((u) => u.totalListenSeconds > 300);
    }

    if (sortKey === 'LISTEN_TIME') {
      list.sort((a, b) => b.totalListenSeconds - a.totalListenSeconds);
    } else if (sortKey === 'NAME') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey === 'PLAYS') {
      list.sort((a, b) => b.totalValidatedPlays - a.totalValidatedPlays);
    }

    return list;
  }, [users, search, filter, sortKey]);

  return (
    <div className="flex-1 w-full bg-[#0D1017] border border-white/[0.08] rounded-2xl p-4 overflow-y-auto flex flex-col gap-3 font-mono">
      {/* 1. Header & Synchronisation */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08]">
        <div>
          <h3 className="text-sm font-black text-[#F8FAFC] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#DE1B34]" />
            <span>Classement &amp; Télémétrie des Auditeurs ({users.length})</span>
          </h3>
          <p className="text-xs text-[#A3A9BA]">
            Cliquez sur un profil pour inspecter sa fiche 360°, ses sessions et ses jetons.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSaveAndSyncAll('Profils & Statistiques Auditeurs')}
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 border border-white/15 transition cursor-pointer shrink-0"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sauvegarder &amp; Sync Auditeurs</span>
        </button>
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
              placeholder="Rechercher par nom d'auditeur, email, ID..."
              className="w-full bg-transparent outline-none text-xs text-[#F8FAFC] placeholder:text-[#A3A9BA]/60"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-[#0D1017] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg cursor-pointer transition ${viewMode === 'GRID' ? 'bg-white/15 text-white' : 'text-[#A3A9BA] hover:text-white'}`}
                title="Vue Grille"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg cursor-pointer transition ${viewMode === 'TABLE' ? 'bg-white/15 text-white' : 'text-[#A3A9BA] hover:text-white'}`}
                title="Vue Tableau dense"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0D1017] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-[#A3A9BA]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as UserSortKey)}
                aria-label="Trier les auditeurs"
                className="bg-transparent text-[#F8FAFC] outline-none text-xs cursor-pointer font-medium"
              >
                <option value="LISTEN_TIME" className="bg-[#0D1017] text-white">Temps d&apos;Écoute</option>
                <option value="NAME" className="bg-[#0D1017] text-white">Nom (A-Z)</option>
                <option value="PLAYS" className="bg-[#0D1017] text-white">Streams Validés</option>
              </select>
            </div>

            <motion.button
              type="button"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING_SNAPPY}
              onClick={() => onSelectUser(users[0]?.id || 'usr-beta-1')}
              className="px-3.5 py-2 rounded-xl bg-[#DE1B34] hover:bg-[#FF4D64] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#DE1B34]/30 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">+ Fiche Auditeur</span>
            </motion.button>
          </div>
        </div>

        {/* Pilules de Filtrage avec Compteurs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/[0.05]">
          {(
            [
              { id: 'ALL', label: 'Tous', count: filterCounts.ALL },
              { id: 'ACTIVE_PASS', label: 'Abonnés Actifs', count: filterCounts.ACTIVE_PASS },
              { id: 'FREEMIUM', label: 'Freemium', count: filterCounts.FREEMIUM },
              { id: 'TOP_LISTENERS', label: 'Top Écoutes', count: filterCounts.TOP_LISTENERS },
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

      {/* 3. Vue Selon le Mode Sélectionné (Grille ou Tableau) */}
      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredUsers.map((u, idx) => (
            <div
              key={u.id}
              onClick={() => onSelectUser(u.id)}
              className="flex items-center justify-between gap-2.5 p-3 rounded-xl bg-[#07090E] border border-white/[0.06] hover:border-white/20 cursor-pointer transition group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center font-bold text-base shrink-0 group-hover:scale-105 transition-transform">
                  {u.avatar || '🎧'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#F8FAFC] truncate">{u.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[8.5px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold shrink-0">
                      GA
                    </span>
                  </div>
                  <div className="text-[10.5px] text-[#A3A9BA] truncate mt-0.5">
                    {formatLongDuration(u.totalListenSeconds)} • {u.totalValidatedPlays} streams
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <RankBadge rank={idx + 1} delta={0} />
                <ChevronRight className="w-4 h-4 text-[#A3A9BA] group-hover:text-white transition-colors" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border border-white/[0.06] bg-[#07090E]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10.5px] text-[#A3A9BA] uppercase tracking-wider">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Auditeur</th>
                <th className="py-2.5 px-3">ID Compte</th>
                <th className="py-2.5 px-3">Formule / Pass</th>
                <th className="py-2.5 px-3">Temps d&apos;Écoute</th>
                <th className="py-2.5 px-3">Streams Validés</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredUsers.map((u, idx) => (
                <tr
                  key={u.id}
                  onClick={() => onSelectUser(u.id)}
                  className="hover:bg-white/[0.03] cursor-pointer transition"
                >
                  <td className="py-2.5 px-3 font-mono text-[#A3A9BA]">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{u.avatar || '🎧'}</span>
                      <span className="font-bold text-[#F8FAFC]">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#A3A9BA] text-[11px]">{u.id}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">
                      {u.plan === 'PRO' ? 'DROP PRO' : 'Freemium'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                    {formatLongDuration(u.totalListenSeconds)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#F8FAFC]">
                    {u.totalValidatedPlays}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectUser(u.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#DE1B34] text-white text-[11px] font-bold transition"
                    >
                      Inspecter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
