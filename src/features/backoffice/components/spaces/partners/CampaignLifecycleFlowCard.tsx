import React from 'react';
import { Building2, Bell, Play, Coins, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const CampaignLifecycleFlowCard: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Financement B2B par le Label',
      subtitle: 'Maisons de production & Artistes',
      desc: 'Le label finance un pool de jetons sans que l’auditeur ne dépense un centime.',
      icon: <Building2 className="w-4 h-4 text-amber-400" />,
      accent: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
    },
    {
      num: '02',
      title: 'Diffusion Ciblée & Notification',
      subtitle: 'Menu Central & Badge Dédié',
      desc: 'L’auditeur reçoit une notification discrète et voit le badge dans son espace Missions.',
      icon: <Bell className="w-4 h-4 text-cyan-400" />,
      accent: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300',
    },
    {
      num: '03',
      title: 'Écoute Validée ECG (30s+)',
      subtitle: 'Contrôle Télémétrique Intègre',
      desc: 'L’auditeur lance la piste sponsorisée. Le capteur ECG valide 30 secondes d’écoute.',
      icon: <Play className="w-4 h-4 text-emerald-400 fill-current" />,
      accent: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
    },
    {
      num: '04',
      title: 'Crédit Instantané du Wallet',
      subtitle: 'Grand Livre Auditeur',
      desc: 'Les jetons (+50 JTN) sont immédiatement inscrits dans le portefeuille local & cloud.',
      icon: <Coins className="w-4 h-4 text-amber-400" />,
      accent: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
    },
    {
      num: '05',
      title: 'Déblocage d’Abonnement (Modèle A)',
      subtitle: 'Zéro Cashout • 100% Jetons',
      desc: 'L’auditeur convertit ses jetons en Pass d’écoute ou téléchargements hors-ligne.',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      accent: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
    },
  ];

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
              Boucle Dynamique Complète — Du Partenaire à l&apos;Auditeur
            </h3>
          </div>
          <p className="text-[10px] text-[#A3A9BA]">
            Cycle fermé hermétique : les streams sponsorisés financent l&apos;accès sans impact sur le pool BUGADA.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          Modèle A Certifié
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
        {steps.map((st, i) => (
          <div
            key={st.num}
            className="p-3 rounded-xl bg-[#07090E] border border-white/[0.05] flex flex-col justify-between space-y-2 relative"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${st.accent}`}>
                  {st.num}
                </span>
                <div className="p-1 rounded-md bg-white/[0.04]">
                  {st.icon}
                </div>
              </div>
              <h4 className="text-xs font-bold text-[#F8FAFC] mt-2 leading-snug">{st.title}</h4>
              <span className="text-[9.5px] text-[#A3A9BA] block mt-0.5">{st.subtitle}</span>
            </div>
            <p className="text-[10px] text-[#A3A9BA]/80 leading-relaxed pt-2 border-t border-white/[0.04]">
              {st.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

