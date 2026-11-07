import React from 'react';
import { BellOff, ShieldCheck } from 'lucide-react';
import type { NotificationPrefs } from './notificationGovernance';

export interface NotificationPrefsPanelProps {
  prefs: NotificationPrefs;
  isAdminViewer: boolean;
  onChangePrefs: (next: NotificationPrefs) => void;
}

const COOLDOWN_STEPS: (0 | 4 | 10 | 30)[] = [0, 4, 10, 30];

export const NotificationPrefsPanel: React.FC<NotificationPrefsPanelProps> = ({
  prefs,
  isAdminViewer,
  onChangePrefs,
}) => {
  return (
    <div className="p-3 rounded-2xl bg-[#080A0F] border border-white/[0.1] space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <BellOff className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="text-xs font-extrabold text-[#F8FAFC] truncate">
            Mode Ne Pas Déranger (Bloquer les popups)
          </span>
        </div>
        <input
          type="checkbox"
          checked={prefs.dndMutePopups}
          onChange={(e) => onChangePrefs({ ...prefs, dndMutePopups: e.target.checked })}
          className="w-4 h-4 accent-amber-400 shrink-0"
          aria-label="Activer le mode Ne Pas Déranger"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-white/[0.07]">
        <label className="flex items-center justify-between p-2 rounded-xl bg-[#0D1017] border border-white/[0.07] cursor-pointer">
          <span className="text-[11px] text-[#F8FAFC] truncate">Sorties musicales</span>
          <input
            type="checkbox"
            checked={prefs.enableReleases}
            onChange={(e) => onChangePrefs({ ...prefs, enableReleases: e.target.checked })}
            className="w-4 h-4 accent-emerald-400 shrink-0"
          />
        </label>

        <label className="flex items-center justify-between p-2 rounded-xl bg-[#0D1017] border border-white/[0.07] cursor-pointer">
          <span className="text-[11px] text-[#F8FAFC] truncate">Communauté &amp; Recos</span>
          <input
            type="checkbox"
            checked={prefs.enableCommunity}
            onChange={(e) => onChangePrefs({ ...prefs, enableCommunity: e.target.checked })}
            className="w-4 h-4 accent-emerald-400 shrink-0"
          />
        </label>

        <label className="flex items-center justify-between p-2 rounded-xl bg-[#0D1017] border border-white/[0.07] cursor-pointer">
          <span className="text-[11px] text-[#F8FAFC] truncate">Certifications &amp; Pass</span>
          <input
            type="checkbox"
            checked={prefs.enableCertifications}
            onChange={(e) => onChangePrefs({ ...prefs, enableCertifications: e.target.checked })}
            className="w-4 h-4 accent-emerald-400 shrink-0"
          />
        </label>

        {isAdminViewer && (
          <label className="flex items-center justify-between p-2 rounded-xl bg-amber-400/10 border border-amber-400/35 cursor-pointer">
            <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1 truncate">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Système &amp; Studio Admin</span>
            </span>
            <input
              type="checkbox"
              checked={prefs.enableAdminSystem}
              onChange={(e) => onChangePrefs({ ...prefs, enableAdminSystem: e.target.checked })}
              className="w-4 h-4 accent-amber-400 shrink-0"
            />
          </label>
        )}
      </div>

      <div className="space-y-1 pt-1 border-t border-white/[0.07]">
        <div className="flex items-center justify-between text-[10.5px] font-mono text-[#A3A9BA]">
          <span>Anti-Rafale Popups (Délai minimal)</span>
          <strong className="text-emerald-300">
            {prefs.cooldownSec === 0 ? 'Aucun filtre' : `1 popup / ${prefs.cooldownSec}s`}
          </strong>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {COOLDOWN_STEPS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => onChangePrefs({ ...prefs, cooldownSec: sec })}
              className={`py-1 rounded-lg text-[10px] font-mono font-bold border ${
                prefs.cooldownSec === sec
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                  : 'bg-white/[0.04] border-white/10 text-[#A3A9BA] hover:text-[#F8FAFC]'
              }`}
            >
              {sec === 0 ? 'Direct' : `${sec}s`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

