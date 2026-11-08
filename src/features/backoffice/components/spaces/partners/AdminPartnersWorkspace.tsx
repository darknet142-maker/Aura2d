import React from 'react';
import { Coins, Sparkles, Shield, ArrowUpRight } from 'lucide-react';
import { AdminSponsorCampaignsPanel } from '../../AdminSponsorCampaignsPanel';
import type { ReturnTypeUseDropPlatformController } from '../../../../listener/hooks/useDropPlatformController';

export interface AdminPartnersWorkspaceProps {
  ctrl: ReturnTypeUseDropPlatformController;
}

export const AdminPartnersWorkspace: React.FC<AdminPartnersWorkspaceProps> = ({ ctrl }) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A3A9BA] text-[10px] font-mono uppercase">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Coins className="w-3.5 h-3.5" />
              Pool de Liquidité Partenaire
            </span>
            <span className="text-emerald-400 font-bold">100% Sponsorisé</span>
          </div>
          <span className="text-2xl font-mono font-extrabold text-[#F8FAFC] my-1">
            2 500 000 JTN
          </span>
          <span className="text-[9.5px] font-mono text-[#A3A9BA]">
            Financé exclusivement par labels &amp; producteurs
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A3A9BA] text-[10px] font-mono uppercase">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Shield className="w-3.5 h-3.5" />
              Sécurité Modèle A
            </span>
            <span className="text-cyan-300 font-bold">Conforme</span>
          </div>
          <p className="text-xs font-bold text-[#F8FAFC] my-1">
            Zéro Achat Utilisateur • Zéro Cashout
          </p>
          <span className="text-[9.5px] font-mono text-emerald-400">
            Déblocage d&apos;abonnements 100% en jetons
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A3A9BA] text-[10px] font-mono uppercase">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Missions Actives
            </span>
            <span className="text-white/80 font-bold">Engagement</span>
          </div>
          <span className="text-2xl font-mono font-extrabold text-emerald-400 my-1">
            30s Écoute Validée
          </span>
          <span className="text-[9.5px] font-mono text-[#A3A9BA]">
            Streams sponsorisés exclus de l&apos;assiette BUGADA
          </span>
        </div>
      </div>

      <AdminSponsorCampaignsPanel
        allTracksFlat={ctrl.allTracksFlat}
        onToast={(msg: string, color?: string) =>
          ctrl.pushNotification(
            'Sponsors & Jetons',
            msg,
            color?.includes('rose') ? 'COMMUNITY' : 'DATABASE'
          )
        }
      />
    </div>
  );
};
