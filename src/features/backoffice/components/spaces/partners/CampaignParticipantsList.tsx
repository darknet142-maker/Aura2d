import React from 'react';
import { Users, CheckCircle2, ShieldCheck, Clock, Coins } from 'lucide-react';
import type { SponsorCampaign } from '../../../../tokens';

export interface CampaignParticipantsListProps {
  campaign: SponsorCampaign;
}

export const CampaignParticipantsList: React.FC<CampaignParticipantsListProps> = ({ campaign }) => {
  const participants = [
    { id: 'usr-01', name: 'Kévin Mba', listensSec: 42, reward: campaign.rewardPerMission || 150, time: 'Il y a 14 min', status: 'VALIDATED' as const, antiFraud: '100% Conforme' },
    { id: 'usr-02', name: 'Ornella Bignoumba', listensSec: 35, reward: campaign.rewardPerMission || 150, time: 'Il y a 28 min', status: 'VALIDATED' as const, antiFraud: '100% Conforme' },
    { id: 'usr-03', name: 'Patrick Obame', listensSec: 60, reward: campaign.rewardPerMission || 150, time: 'Il y a 45 min', status: 'VALIDATED' as const, antiFraud: '100% Conforme' },
    { id: 'usr-04', name: 'Sarah Nzengue', listensSec: 38, reward: campaign.rewardPerMission || 150, time: 'Il y a 1h 12', status: 'VALIDATED' as const, antiFraud: '100% Conforme' },
  ];

  return (
    <div className="p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Auditeurs Participants &amp; Écoutes ECG Validées ({participants.length})
          </h4>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
          Zéro Doublon • Transaction Atomique
        </span>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
        {participants.map((p) => (
          <div
            key={p.id}
            className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-[#F8FAFC] block truncate">{p.name}</span>
                <span className="text-[9.5px] text-[#A3A9BA] block truncate">
                  {p.time} • Écoute : {p.listensSec}s (seuil 30s) • {p.antiFraud}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-black text-amber-400 block">+{p.reward} JTN</span>
              <span className="text-[9px] text-emerald-400 font-bold">Crédité</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
