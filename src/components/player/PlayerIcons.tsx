import React from 'react';
import { Lock } from 'lucide-react';

export const ProLockBadgeSvg: React.FC = () => {
  return (
    <span
      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-900/95 border border-white/25 flex items-center justify-center text-amber-400 shadow"
      title="Réservé aux comptes DROP Pro"
    >
      <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
    </span>
  );
};

