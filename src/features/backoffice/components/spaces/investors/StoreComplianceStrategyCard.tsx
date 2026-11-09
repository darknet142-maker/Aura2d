import React from 'react';
import { Smartphone, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const StoreComplianceStrategyCard: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Stratégie de Conformité Stores (Apple &amp; Google Play)
          </h3>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
          Protection de Marge (Zéro Taxe 30%)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.05] space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-cyan-300 block">
            1. Souscription &amp; Paiement sur le Web (Airtel &amp; Moov Money)
          </span>
          <p className="text-[10.5px] text-[#A3A9BA] leading-relaxed">
            Les abonnements directs (1 500 FCFA) et les campagnes B2B sont réglés sur le portail web.
            Les commissions télécom sont limitées à ~2% (contre 30% imposés par les stores in-app).
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.05] space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">
            2. Application Mobile en Mode « Lecteur Connecté » (Reader App)
          </span>
          <p className="text-[10.5px] text-[#A3A9BA] leading-relaxed">
            Conforme à l’article 3.1.3(a) des Guidelines Apple : l’auditeur se connecte à son compte déjà abonné.
            L’app synchronise les droits sans vendre de biens numériques directement in-app.
          </p>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06] flex items-center justify-between text-[10.5px]">
        <span className="text-[#A3A9BA] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Déblocage par Jetons 100% Sponsorisé : Totalement exempté de commission store
        </span>
        <span className="text-emerald-400 font-bold">100% Conforme</span>
      </div>
    </div>
  );
};
