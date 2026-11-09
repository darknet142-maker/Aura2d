import React, { useState } from 'react';
import { InvestorPitchDeckViewer } from './InvestorPitchDeckViewer';
import { InvestorBusinessPlanCard } from './InvestorBusinessPlanCard';
import { FundingUseOfFundsCard } from './FundingUseOfFundsCard';
import { DataRoomDocumentIndexCard } from './DataRoomDocumentIndexCard';
import { Presentation, TrendingUp, Coins, FolderLock } from 'lucide-react';

export const AdminDataRoomWorkspace: React.FC = () => {
  const [subTab, setSubTab] = useState<'DECK' | 'FINANCE' | 'DOCS'>('DECK');

  return (
    <div className="flex flex-col gap-4 w-full font-mono text-xs text-[#F8FAFC]">
      {/* 1. Onglets Spécifiques Investisseurs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0D1017] border border-white/10 w-fit text-xs">
        <button
          type="button"
          onClick={() => setSubTab('DECK')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition ${
            subTab === 'DECK' ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          <Presentation className="w-3.5 h-3.5" />
          <span>Pitch Deck (12 Slides)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('FINANCE')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition ${
            subTab === 'FINANCE' ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Business Plan 3 Ans &amp; Levée (75k€)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('DOCS')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition ${
            subTab === 'DOCS' ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          <FolderLock className="w-3.5 h-3.5" />
          <span>Data Room &amp; Pièces Légales</span>
        </button>
      </div>

      {/* 2. Contenu selon sous-onglet */}
      {subTab === 'DECK' && (
        <div className="space-y-4">
          <InvestorPitchDeckViewer />
          <FundingUseOfFundsCard />
        </div>
      )}

      {subTab === 'FINANCE' && (
        <div className="space-y-4">
          <InvestorBusinessPlanCard />
          <FundingUseOfFundsCard />
        </div>
      )}

      {subTab === 'DOCS' && (
        <div className="space-y-4">
          <DataRoomDocumentIndexCard />
          <InvestorBusinessPlanCard />
        </div>
      )}
    </div>
  );
};
