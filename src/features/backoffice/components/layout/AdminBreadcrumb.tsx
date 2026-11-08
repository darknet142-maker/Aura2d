import React from 'react';
import { ChevronRight, Shield } from 'lucide-react';
import type { AdminSpaceDef } from '../../types/admin-spaces.types';

export interface AdminBreadcrumbProps {
  currentSpace: AdminSpaceDef;
  subSection?: string;
}

export const AdminBreadcrumb: React.FC<AdminBreadcrumbProps> = ({ currentSpace, subSection }) => {
  return (
    <nav aria-label="Fil d'Ariane de navigation" className="flex items-center gap-1.5 text-[11px] text-[#A3A9BA]">
      <div className="flex items-center gap-1 hover:text-[#F8FAFC] transition">
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        <span>Studio Admin 2.0</span>
      </div>
      <ChevronRight className="w-3 h-3 text-[#A3A9BA]/50" />
      <span className="font-bold text-[#F8FAFC] flex items-center gap-1">
        <span className="font-mono text-emerald-400">{currentSpace.code}</span>
        <span>{currentSpace.name}</span>
      </span>
      {subSection && (
        <>
          <ChevronRight className="w-3 h-3 text-[#A3A9BA]/50" />
          <span className="text-amber-300 font-medium">{subSection}</span>
        </>
      )}
    </nav>
  );
};

