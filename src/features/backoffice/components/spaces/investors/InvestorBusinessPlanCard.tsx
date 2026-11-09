import React from 'react';
import { TrendingUp, DollarSign, Calculator, Target, ArrowUpRight } from 'lucide-react';

export const InvestorBusinessPlanCard: React.FC = () => {
  const years = [
    {
      year: 'Année 1',
      directSubs: '500 abonnés',
      directRev: '9,0 M',
      campCount: '20 campagnes',
      campRev: '10,0 M',
      otherB2b: '5,0 M',
      totalRev: 24.0,
      directCosts: 8.75,
      grossMargin: 15.25,
      opex: 30.0,
      ebitda: -14.75,
    },
    {
      year: 'Année 2',
      directSubs: '1 200 abonnés',
      directRev: '21,6 M',
      campCount: '40 campagnes',
      campRev: '28,0 M',
      otherB2b: '13,0 M',
      totalRev: 62.6,
      directCosts: 22.45,
      grossMargin: 40.15,
      opex: 42.0,
      ebitda: -1.85,
    },
    {
      year: 'Année 3',
      directSubs: '3 000 abonnés',
      directRev: '54,0 M',
      campCount: '70 campagnes',
      campRev: '59,5 M',
      otherB2b: '25,0 M',
      totalRev: 138.5,
      directCosts: 51.10,
      grossMargin: 87.40,
      opex: 55.0,
      ebitda: 32.40,
    },
  ];

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3.5 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Business Plan Financier sur 3 Ans (Scénario Central)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Seuil de Rentabilité : 87,2 M FCFA
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-[10px] text-[#A3A9BA] uppercase">
              <th className="py-2 pr-3">Indicateur Financier (M FCFA)</th>
              <th className="py-2 px-3 text-right">Année 1</th>
              <th className="py-2 px-3 text-right">Année 2</th>
              <th className="py-2 pl-3 text-right text-emerald-400">Année 3</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-[11px]">
            <tr>
              <td className="py-2 pr-3 text-[#A3A9BA]">Abonnements Directs (1 500 F/mois)</td>
              <td className="py-2 px-3 text-right tabular-nums">9,0 M</td>
              <td className="py-2 px-3 text-right tabular-nums">21,6 M</td>
              <td className="py-2 pl-3 text-right tabular-nums font-bold text-white">54,0 M</td>
            </tr>
            <tr>
              <td className="py-2 pr-3 text-[#A3A9BA]">Campagnes Sponsorisées (B2B)</td>
              <td className="py-2 px-3 text-right tabular-nums">10,0 M</td>
              <td className="py-2 px-3 text-right tabular-nums">28,0 M</td>
              <td className="py-2 pl-3 text-right tabular-nums font-bold text-white">59,5 M</td>
            </tr>
            <tr>
              <td className="py-2 pr-3 text-[#A3A9BA]">Autres Prestations B2B &amp; Data</td>
              <td className="py-2 px-3 text-right tabular-nums">5,0 M</td>
              <td className="py-2 px-3 text-right tabular-nums">13,0 M</td>
              <td className="py-2 pl-3 text-right tabular-nums font-bold text-white">25,0 M</td>
            </tr>
            <tr className="bg-white/[0.02] font-bold">
              <td className="py-2 pr-3 text-[#F8FAFC]">Chiffre d&apos;Affaires Total</td>
              <td className="py-2 px-3 text-right tabular-nums text-white">24,0 M</td>
              <td className="py-2 px-3 text-right tabular-nums text-white">62,6 M</td>
              <td className="py-2 pl-3 text-right tabular-nums text-emerald-400">138,5 M</td>
            </tr>
            <tr>
              <td className="py-2 pr-3 text-[#A3A9BA]">Total Coûts Directs (Droits, Egress, Telco)</td>
              <td className="py-2 px-3 text-right tabular-nums text-rose-300">-8,75 M</td>
              <td className="py-2 px-3 text-right tabular-nums text-rose-300">-22,45 M</td>
              <td className="py-2 pl-3 text-right tabular-nums text-rose-300">-51,10 M</td>
            </tr>
            <tr className="font-bold text-white">
              <td className="py-2 pr-3">Marge Brute</td>
              <td className="py-2 px-3 text-right tabular-nums">15,25 M</td>
              <td className="py-2 px-3 text-right tabular-nums">40,15 M</td>
              <td className="py-2 pl-3 text-right tabular-nums text-emerald-400">87,40 M</td>
            </tr>
            <tr>
              <td className="py-2 pr-3 text-[#A3A9BA]">Charges Opérationnelles (OPEX)</td>
              <td className="py-2 px-3 text-right tabular-nums text-[#A3A9BA]">-30,0 M</td>
              <td className="py-2 px-3 text-right tabular-nums text-[#A3A9BA]">-42,0 M</td>
              <td className="py-2 pl-3 text-right tabular-nums text-[#A3A9BA]">-55,0 M</td>
            </tr>
            <tr className="bg-[#07090E] font-black border-t-2 border-white/10">
              <td className="py-2.5 pr-3 text-white">EBITDA Indicatif</td>
              <td className="py-2.5 px-3 text-right tabular-nums text-rose-400">-14,75 M</td>
              <td className="py-2.5 px-3 text-right tabular-nums text-amber-400">-1,85 M</td>
              <td className="py-2.5 pl-3 text-right tabular-nums text-emerald-400 text-sm">+32,40 M</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] flex items-center justify-between text-[10.5px]">
        <span className="text-[#A3A9BA]">
          Hypothèse tarifaire B2C : 1 500 FCFA / abonné / mois • Zéro double comptage des jetons
        </span>
        <span className="text-emerald-400 font-bold">
          Modèle certifié OHADA / DGI
        </span>
      </div>
    </div>
  );
};
