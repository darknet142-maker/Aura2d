import React from 'react';
import { Globe2, CheckCircle2, Clock, ShieldCheck, MapPin } from 'lucide-react';

interface CountryMarket {
  code: string;
  name: string;
  flag: string;
  population: string;
  operators: string;
  status: 'ACTIVE' | 'PROSPECTION' | 'RIGHTS_STUDY' | 'PLANNED';
  launchPhase: string;
}

const CEMAC_COUNTRIES: CountryMarket[] = [
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', population: '2,4 M', operators: 'Airtel Money, Moov Money', status: 'ACTIVE', launchPhase: 'Phase 1 — Marché Pilote' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', population: '28,0 M', operators: 'MTN Mobile Money, Orange Money', status: 'PROSPECTION', launchPhase: 'Phase 2 — Expansion Majeure' },
  { code: 'CG', name: 'Rép. du Congo', flag: '🇨🇬', population: '5,8 M', operators: 'MTN MoMo, Airtel Money', status: 'RIGHTS_STUDY', launchPhase: 'Phase 2 — Expansion Proche' },
  { code: 'GQ', name: 'Guinée Équatoriale', flag: '🇬🇶', population: '1,6 M', operators: 'Bange Money, Cartes CEMAC', status: 'PLANNED', launchPhase: 'Phase 3 — CEMAC Ouest' },
  { code: 'CF', name: 'Centrafrique', flag: '🇨🇫', population: '5,5 M', operators: 'Orange Money, Telecel', status: 'PLANNED', launchPhase: 'Phase 3 — CEMAC Est' },
  { code: 'TD', name: 'Tchad', flag: '🇹🇩', population: '18,0 M', operators: 'Airtel Money, Moov Africa', status: 'PLANNED', launchPhase: 'Phase 3 — CEMAC Nord' },
];

export const CemacExpansionMatrixCard: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3.5 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Matrice d&apos;Expansion Régionale Afrique Centrale (Zone CEMAC)
          </h3>
        </div>
        <span className="text-[10px] text-[#A3A9BA]">
          Monnaie Commune : Franc CFA BEAC (XAF) • Droit des Affaires OHADA
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {CEMAC_COUNTRIES.map((c) => (
          <div
            key={c.code}
            className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition ${
              c.status === 'ACTIVE'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-[#07090E] border-white/[0.05]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-base">{c.flag}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                    c.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : c.status === 'PROSPECTION'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {c.status === 'ACTIVE' ? 'Marché Actif' : c.status === 'PROSPECTION' ? 'Prospection' : 'Étude'}
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-[#F8FAFC] mt-1">{c.name}</h4>
              <span className="text-[10px] text-[#A3A9BA] block">
                {c.population} hab. • {c.launchPhase}
              </span>
            </div>

            <div className="pt-2 border-t border-white/[0.04] text-[9.5px]">
              <span className="text-[#A3A9BA] block">Opérateurs Mobile Money :</span>
              <span className="text-[#F8FAFC] font-bold truncate block">{c.operators}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
