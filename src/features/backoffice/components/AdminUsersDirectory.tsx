import React from 'react';
import { Users, CheckCircle2, ChevronRight } from 'lucide-react';
import type { AppUser } from '../../../shared/types/domain.types';
import { formatLongDuration } from '../../../shared/utils/mediaFormatters';
import { RankBadge } from '../../../shared/ui/RankBadge';

export interface AdminUsersDirectoryProps {
  users: AppUser[];
  onSelectUser: (userId: string) => void;
  onSaveAndSyncAll: (sectionLabel?: string) => void;
}

export const AdminUsersDirectory: React.FC<AdminUsersDirectoryProps> = ({
  users,
  onSelectUser,
  onSaveAndSyncAll,
}) => {
  return (
    <div className="flex-1 w-full bg-[#0D1017] border border-white/[0.08] rounded-2xl p-4 overflow-y-auto flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08]">
        <div>
          <h3 className="text-sm font-extrabold text-[#F5F2EB] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#DE1B34]" />
            <span>
              Classement &amp; Télémétrie des Auditeurs ({users.length})
            </span>
          </h3>
          <p className="text-xs text-[#8E93A4]">
            Sélectionnez un auditeur pour inspecter ses écoutes par morceau et sa répartition User-Centric.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSaveAndSyncAll('Profils & Statistiques Auditeurs')}
          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07080C] font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer shrink-0"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Sauvegarder &amp; Synchroniser Auditeurs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {[...users]
          .sort((a, b) => b.totalListenSeconds - a.totalListenSeconds)
          .map((u, idx) => (
            <div
              key={u.id}
              onClick={() => onSelectUser(u.id)}
              className="w-full flex items-center justify-between gap-2.5 p-3 rounded-xl bg-[#07080C] border border-white/[0.06] hover:border-[#DE1B34]/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center font-bold text-xs text-[#F5F2EB] shrink-0">
                  {u.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#F5F2EB] truncate">
                    {u.name}
                  </div>
                  <div className="text-[11px] font-mono text-[#8E93A4] truncate">
                    {formatLongDuration(u.totalListenSeconds)} d'écoute
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <RankBadge rank={idx + 1} delta={0} />
                <ChevronRight className="w-4 h-4 text-[#8E93A4]" />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

