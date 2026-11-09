import React from 'react';
import { Coins, PieChart, ShieldCheck, Building2, UserCheck, ArrowUpRight } from 'lucide-react';

export const FundingUseOfFundsCard: React.FC = () => {
  const sources = [
    { label: 'Investisseurs Privés (Equity)', amountEur: 50000, amountFcfa: 32.8, pct: 66.7, color: 'bg-emerald-500' },
    { label: 'Financements Institutionnels', amountEur: 15000, amountFcfa: 9.8, pct: 20.0, color: 'bg-cyan-500' },
    { label: 'Avances Commerciales B2B', amountEur: 10000, amountFcfa: 6.6, pct: 13.3, color: 'bg-amber-400' },
  ];

  const allocations = [
    { label: 'Équipe & Salaires Clés', eur: 18000, pct: 24, desc: 'Lead tech, dev mobile, commercial labels' },
    { label: 'Marketing & Acquisition', eur: 15000, pct: 20, desc: 'Campagnes réseaux, activation Libreville' },
    { label: 'Produit, Sécurité & Infra', eur: 12000, pct: 16, desc: 'Cloudflare R2, serveurs, DRM AES-256' },
    { label: 'Réserve de Trésorerie', eur: 12000, pct: 16, desc: 'Sécurité de piste d’atterrissage (runway)' },
    { label: 'Droits Musicaux & Légal', eur: 10000, pct: 13.3, desc: 'Ordonnance 2024, conseil juridique OHADA' },
    { label: 'Prospection Partenaires', eur: 8000, pct: 10.7, desc: 'Accords maisons de disque, démos' },
  ];

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3.5 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Levée de Fonds de Référence : 75 000 € (49,2 M FCFA)
          </h3>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold">
          Runway Initial : 12 à 18 Mois
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Colonne 1 : Structure des Sources */}
        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] space-y-2.5">
          <span className="text-[10px] uppercase text-[#A3A9BA] font-bold block">
            1. Structure du Financement
          </span>
          <div className="space-y-2">
            {sources.map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#F8FAFC]">{s.label}</span>
                  <span className="font-bold text-white tabular-nums">
                    {s.amountEur.toLocaleString()} € ({s.amountFcfa} M F)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div style={{ width: `${s.pct}%` }} className={`h-full ${s.color} rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne 2 : Utilisation des Fonds */}
        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] space-y-2.5">
          <span className="text-[10px] uppercase text-[#A3A9BA] font-bold block">
            2. Allocation Budgétaire des 75 000 €
          </span>
          <div className="grid grid-cols-2 gap-2">
            {allocations.map((a) => (
              <div key={a.label} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-[#F8FAFC] truncate">{a.label.split(' ')[0]}</span>
                  <span className="text-emerald-400 font-bold tabular-nums">{a.eur.toLocaleString()} €</span>
                </div>
                <span className="text-[8.5px] text-[#A3A9BA] block truncate mt-0.5">{a.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
