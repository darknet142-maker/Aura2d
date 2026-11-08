import React from 'react';
import { Layers, Eye, MousePointerClick, Sparkles } from 'lucide-react';
import { AdminBannersManager } from '../../AdminBannersManager';
import type { ReturnTypeUseDropPlatformController } from '../../../../listener/hooks/useDropPlatformController';

export interface AdminAdsWorkspaceProps {
  ctrl: ReturnTypeUseDropPlatformController;
}

export const AdminAdsWorkspace: React.FC<AdminAdsWorkspaceProps> = ({ ctrl }) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DE1B34]/15 border border-[#DE1B34]/30 flex items-center justify-center text-[#DE1B34] shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-[#A3A9BA] uppercase">Slides Actifs</span>
            <p className="text-sm font-mono font-extrabold text-[#F8FAFC]">
              {ctrl.adBanners.length} Campagne(s)
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-[#A3A9BA] uppercase">Impressions Central</span>
            <p className="text-sm font-mono font-extrabold text-cyan-300">
              42 850 vues
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-[#A3A9BA] uppercase">Taux de Clic (CTR)</span>
            <p className="text-sm font-mono font-extrabold text-emerald-400">
              4.82 %
            </p>
          </div>
        </div>
      </div>

      <AdminBannersManager
        adBanners={ctrl.adBanners}
        setAdBanners={ctrl.setAdBanners}
        adBannerSettings={ctrl.adBannerSettings}
        setAdBannerSettings={ctrl.setAdBannerSettings}
        allTracksFlat={ctrl.allTracksFlat}
        catalogue={ctrl.catalogue}
        onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
        pushNotification={ctrl.pushNotification}
      />
    </div>
  );
};
