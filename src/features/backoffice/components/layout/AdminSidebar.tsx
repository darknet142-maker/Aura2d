import React from 'react';
import {
  Home, Music, Sliders, Users, Building2, Coins, Layers, Cpu, ShieldCheck,
  PanelLeftClose, PanelLeft, Radio,
} from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../../shared/ui/springMotion';
import {
  ADMIN_SPACES_REGISTRY, type AdminSpaceId, type AdminSpaceDef,
} from '../../types/admin-spaces.types';

const SPACE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Home, Music, Sliders, Users, Building2, Coins, Layers, Cpu, ShieldCheck,
};

export interface AdminSidebarProps {
  currentSpaceId: AdminSpaceId;
  onSelectSpace: (spaceId: AdminSpaceId) => void;
  isRealtimeConnected: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentSpaceId, onSelectSpace, isRealtimeConnected, isCollapsed = false, onToggleCollapse,
}) => {
  return (
    <aside
      className={`h-full flex flex-col justify-between bg-[#0D1017] border-r border-white/10 transition-all duration-200 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64 lg:w-72'
      }`}
    >
      <div className="p-3.5 space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/15">DROP (+241)</span>
                <span className="text-xs font-extrabold text-[#F8FAFC] truncate">Tour de Contrôle</span>
              </div>
              <p className="text-[10px] text-[#A3A9BA] truncate">Central Management Console</p>
            </div>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Déplier la barre' : 'Replier la barre'}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-[#A3A9BA] hover:text-[#F8FAFC] flex items-center justify-center cursor-pointer transition mx-auto"
            >
              {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )}
        </div>

        <nav aria-label="Espaces de travail Admin Studio" className="space-y-1">
          {ADMIN_SPACES_REGISTRY.map((space: AdminSpaceDef) => {
            const isActive = currentSpaceId === space.id;
            const Icon = SPACE_ICONS[space.iconName] || Home;

            return (
              <motion.button
                key={space.id}
                type="button"
                whileHover={{ x: isCollapsed ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
                transition={SPRING_SNAPPY}
                onClick={() => onSelectSpace(space.id)}
                title={`${space.code} — ${space.name}`}
                className={`w-full p-2 rounded-xl text-left flex items-center gap-2.5 transition cursor-pointer ${
                  isActive
                    ? 'bg-[#DE1B34] text-white shadow-md shadow-[#DE1B34]/25 font-bold'
                    : 'bg-transparent text-[#A3A9BA] hover:bg-white/5 hover:text-[#F8FAFC]'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-[#CBD5E1]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs truncate flex items-center gap-1.5">
                        <span className={`font-mono text-[10px] ${isActive ? 'text-white/80' : 'text-[#A3A9BA]/70'}`}>{space.code}</span>
                        <span className="truncate">{space.name}</span>
                      </span>
                      {space.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-amber-400/20 text-amber-300'}`}>
                          {space.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-[#A3A9BA]'}`}>{space.subtitle}</p>
                  </div>
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-white/10 bg-[#080A0F]">
        <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-1.5">
            <Radio className={`w-3.5 h-3.5 ${isRealtimeConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            {!isCollapsed && (
              <span className="text-[10px] font-mono text-[#A3A9BA]">
                {isRealtimeConnected ? '● Connecté (Live Sync)' : '● Mode Dégradé'}
              </span>
            )}
          </div>
          {!isCollapsed && <span className="text-[9px] font-mono text-[#A3A9BA]/60">v2.0 SaaS</span>}
        </div>
      </div>
    </aside>
  );
};

