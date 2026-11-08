import React from 'react';
import { DollarSign, ShieldCheck, CheckCircle2, FileText, Send } from 'lucide-react';

export interface EntityPayoutCardProps {
  entityName: string;
  entityType: 'ARTIST' | 'LABEL' | 'ALBUM';
  totalPlays: number;
  grossRevenue: number;
  masterShare: number;
  bugadaShare: number;
  taxDgi: number;
  onEmitStatement: () => void;
  onOrderPayout: () => void;
}

export const EntityPayoutCard: React.FC<EntityPayoutCardProps> = ({
  entityName, entityType, totalPlays, grossRevenue,
  masterShare, bugadaShare, taxDgi, onEmitStatement, onOrderPayout,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-2.5">
        <div>
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
            {entityType === 'ARTIST' ? 'Fiche Financière Artiste' : entityType === 'LABEL' ? 'Fiche Financière Maison de Production' : 'Fiche Projet'}
          </span>
          <h3 className="text-base font-extrabold text-[#F8FAFC]">{entityName}</h3>
          <span className="text-[10px] font-mono text-[#A3A9BA]">
            {totalPlays.toLocaleString('fr-FR')} streams certifiés • Modèle 60/40 Broadcast
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEmitStatement}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Relevé Certifié</span>
          </button>
          <button
            type="button"
            onClick={onOrderPayout}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#080A0F] text-xs font-mono font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/25 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ordonnancer Paie</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[10px] font-mono text-[#A3A9BA] uppercase block">Brut Généré</span>
          <span className="text-base font-mono font-extrabold text-[#F8FAFC]">
            {grossRevenue.toLocaleString('fr-FR')} F
          </span>
          <span className="text-[9.5px] font-mono text-emerald-400 block">100% Recettes</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[10px] font-mono text-[#A3A9BA] uppercase block">Part Master (48%)</span>
          <span className="text-base font-mono font-extrabold text-emerald-400">
            {masterShare.toLocaleString('fr-FR')} F
          </span>
          <span className="text-[9.5px] font-mono text-[#A3A9BA] block">Net Ayant-Droit</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[10px] font-mono text-[#A3A9BA] uppercase block">BUGADA (12%)</span>
          <span className="text-base font-mono font-extrabold text-amber-400">
            {bugadaShare.toLocaleString('fr-FR')} F
          </span>
          <span className="text-[9.5px] font-mono text-[#A3A9BA] block">Auteurs/Compositeurs</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[10px] font-mono text-[#A3A9BA] uppercase block">Retenue DGI (9.5%)</span>
          <span className="text-base font-mono font-extrabold text-red-400">
            {taxDgi.toLocaleString('fr-FR')} F
          </span>
          <span className="text-[9.5px] font-mono text-[#A3A9BA] block">Fisc Gabonais</span>
        </div>
      </div>
    </div>
  );
};
