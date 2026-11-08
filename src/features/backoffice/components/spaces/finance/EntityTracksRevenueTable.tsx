import React from 'react';
import { Play, Disc3, CheckCircle2 } from 'lucide-react';
import type { Track } from '../../../../../shared/types/domain.types';

export interface EntityTracksRevenueTableProps {
  tracks: Track[];
  onSelectTrack: (trackId: string) => void;
}

export const EntityTracksRevenueTable: React.FC<EntityTracksRevenueTableProps> = ({
  tracks, onSelectTrack,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F8FAFC]">
          Ventilation Détaillée par Titre ({tracks.length} Chansons)
        </h4>
        <span className="text-[10px] font-mono text-emerald-400">Assiette 48% Master</span>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {tracks.map((t) => {
          const plays = t.duration ? Math.round(t.duration * 1.8) : 210;
          const gross = Math.round(plays * 1.5);
          const master = Math.round(gross * 0.48);
          const bugada = Math.round(gross * 0.12);

          return (
            <div
              key={t.id}
              onClick={() => onSelectTrack(t.id)}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] hover:border-white/20 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#131722] border border-white/10 shrink-0 flex items-center justify-center">
                  {t.cover ? (
                    <img src={t.cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Disc3 className="w-4 h-4 text-[#DE1B34]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-[#F8FAFC] truncate group-hover:text-[#DE1B34] transition">
                    {t.title}
                  </p>
                  <p className="text-[10.5px] text-[#A3A9BA] truncate">
                    {t.album || 'Single'} • {plays.toLocaleString('fr-FR')} streams
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                <div className="text-right">
                  <span className="text-[#F8FAFC] font-extrabold block">{gross.toLocaleString('fr-FR')} F</span>
                  <span className="text-[9.5px] text-[#A3A9BA]">Brut</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-extrabold block">{master.toLocaleString('fr-FR')} F</span>
                  <span className="text-[9.5px] text-[#A3A9BA]">Master 48%</span>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-amber-400 font-extrabold block">{bugada.toLocaleString('fr-FR')} F</span>
                  <span className="text-[9.5px] text-[#A3A9BA]">BUGADA 12%</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Éligible
                </span>
                <Play className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
