import React, { useState, useMemo } from 'react';
import { Users, Search, CheckCircle2, ChevronRight, ShieldCheck, MapPin } from 'lucide-react';
import type { AppUser } from '../../../shared/types/domain.types';
import { formatLongDuration } from '../../../shared/utils/mediaFormatters';
import { RankBadge } from '../../../shared/ui/RankBadge';

export interface AdminUsersDirectoryProps {
  users: AppUser[];
  onSelectUser: (userId: string) => void;
  onSaveAndSyncAll: (sectionLabel?: string) => void;
}

type UserDirectoryFilter = 'ALL' | 'ACTIVE' | 'TOP_LISTENERS' | 'NEW';

export const AdminUsersDirectory: React.FC<AdminUsersDirectoryProps> = ({
  users,
  onSelectUser,
  onSaveAndSyncAll,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserDirectoryFilter>('ALL');

  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
    }

    if (filter === 'TOP_LISTENERS') {
      list.sort((a, b) => b.totalListenSeconds - a.totalListenSeconds);
    }

    return list;
  }, [users, search, filter]);

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
          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07080C] font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer shrink-0"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Sauvegarder &amp; Sync Auditeurs</span>
        </button>
      </div>

      {/* 2. Barre de Recherche & Filtres */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-[#07090E] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-[#F8FAFC]">
          <Search className="w-3.5 h-3.5 text-[#A3A9BA]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom d'auditeur ou ID..."
            className="bg-transparent outline-none text-xs text-[#F8FAFC] placeholder:text-[#A3A9BA]/60 w-full"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#07090E] p-1 rounded-xl border border-white/10 text-xs">
          {(['ALL', 'TOP_LISTENERS'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition ${filter === mode ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
                }`}
            >
              {mode === 'ALL' ? `Tous (${users.length})` : 'Top Écoutes'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Grille des Profils Auditeurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredUsers.map((u, idx) => (
          <div
            key={u.id}
            onClick={() => onSelectUser(u.id)}
            className="flex items-center justify-between gap-2.5 p-3 rounded-xl bg-[#07090E] border border-white/[0.06] hover:border-emerald-500/40 cursor-pointer transition group"
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
              <ChevronRight className="w-4 h-4 text-[#A3A9BA] group-hover:text-emerald-400 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
