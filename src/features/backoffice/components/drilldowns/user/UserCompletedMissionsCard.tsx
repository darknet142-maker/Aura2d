import React from 'react';
import { Award, Coins, CheckCircle2, Clock, Building2 } from 'lucide-react';
import type { AppUser } from '../../../../../shared/types/domain.types';

export interface UserCompletedMissionsCardProps {
  user: AppUser;
}

interface CompletedMission {
  id: string;
  title: string;
  partnerName: string;
  type: string;
  completedAt: string;
  tokensEarned: number;
  ecgValidationSec: number;
}

export const UserCompletedMissionsCard: React.FC<UserCompletedMissionsCardProps> = ({ user }) => {
  const missions: CompletedMission[] = [
    {
      id: `mis-1-${user.id}`,
      title: 'Écoute sponsorisée 45s • Single Ntcham "Boma"',
      partnerName: 'Direct Prod Gabon',
      type: 'Écoute Validée 30s+',
      completedAt: 'Aujourd\'hui à 14:20',
      tokensEarned: 50,
      ecgValidationSec: 46,
    },
    {
      id: `mis-2-${user.id}`,
      title: 'Partage de Story & Réaction Émotionnelle',
      partnerName: 'Studio K & Mayena Records',
      type: 'Partage Social',
      completedAt: 'Hier à 19:45',
      tokensEarned: 30,
      ecgValidationSec: 0,
    },
    {
      id: `mis-3-${user.id}`,
      title: 'Découverte Beatmaker • Écoute Instrumentale Opus',
      partnerName: 'Gabon Music Expo',
      type: 'Curateur Beat',
      completedAt: 'Il y a 3 jours',
      tokensEarned: 40,
      ecgValidationSec: 62,
    },
  ];

  const totalMissionsTokens = missions.reduce((sum, m) => sum + m.tokensEarned, 0);

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Missions Partenaires Réalisées ({missions.length})
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#A3A9BA]">Total Gagné :</span>
          <span className="text-amber-400 font-black tabular-nums">+{totalMissionsTokens} JTN</span>
        </div>
      </div>

      <div className="space-y-2">
        {missions.map((m) => (
          <div
            key={m.id}
            className="p-3 rounded-xl bg-[#07090E] border border-white/[0.05] flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#F8FAFC] truncate">{m.title}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/5 border border-white/10 text-emerald-400">
                    Complétée
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#A3A9BA] mt-0.5">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-cyan-400" />
                    {m.partnerName}
                  </span>
                  <span>•</span>
                  <span>{m.completedAt}</span>
                  {m.ecgValidationSec > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">ECG {m.ecgValidationSec}s</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-xs tabular-nums">
                +{m.tokensEarned} JTN
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

