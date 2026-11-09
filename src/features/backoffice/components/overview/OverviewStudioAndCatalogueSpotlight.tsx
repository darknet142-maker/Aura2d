import React from 'react';
import { Disc3, Radio, ArrowUpRight, ShieldCheck, Activity } from 'lucide-react';
import type { AdminSpaceId } from '../../types/admin-spaces.types';
import type { Track } from '../../../../shared/types/domain.types';

export interface OverviewStudioAndCatalogueSpotlightProps {
  tracks: Track[];
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
  onSelectTrack?: (trackId: string) => void;
}

export const OverviewStudioAndCatalogueSpotlight: React.FC<OverviewStudioAndCatalogueSpotlightProps> = ({
  tracks,
  onNavigateToSpace,
  onSelectTrack,
}) => {
  const topTracks = tracks.slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 font-mono text-xs text-[#F8FAFC]">
      {/* 1. Moniteur Studio & Mastering Broadcast (-14.0 LUFS Target) */}
      <div className="lg:col-span-6 p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
              Console Mastering &amp; DSP Studio
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSpace('02_STUDIO')}
            className="flex items-center gap-1 text-[10.5px] text-cyan-300 hover:text-white transition cursor-pointer"
          >
            <span>Ouvrir Console</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-xl bg-[#07090E] border border-white/[0.06]">
            <span className="text-[9px] uppercase text-[#A3A9BA] block">Integrated</span>
            <span className="text-sm font-extrabold text-emerald-400">-14.0</span>
            <span className="text-[8.5px] text-[#A3A9BA] block">LUFS Target</span>
          </div>
          <div className="p-2 rounded-xl bg-[#07090E] border border-white/[0.06]">
            <span className="text-[9px] uppercase text-[#A3A9BA] block">Peak L/R</span>
            <span className="text-sm font-extrabold text-amber-400">-0.3 dB</span>
            <span className="text-[8.5px] text-emerald-400 block">Normalisé</span>
          </div>
          <div className="p-2 rounded-xl bg-[#07090E] border border-white/[0.06]">
            <span className="text-[9px] uppercase text-[#A3A9BA] block">Stereo Width</span>
            <span className="text-sm font-extrabold text-cyan-400">29.7%</span>
            <span className="text-[8.5px] text-cyan-300 block">Corr. 0.97</span>
          </div>
          <div className="p-2 rounded-xl bg-[#07090E] border border-white/[0.06]">
            <span className="text-[9px] uppercase text-[#A3A9BA] block">Format Audio</span>
            <span className="text-sm font-extrabold text-[#F8FAFC]">Opus 320k</span>
            <span className="text-[8.5px] text-emerald-400 block">Broadcast</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06] flex items-center justify-between">
          <span className="text-[10px] text-[#A3A9BA]">
            DSP Ingestion Pipeline : Transcodage sans perte &amp; DRM AES-256 actif
          </span>
          <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            100% Conforme
          </span>
        </div>
      </div>

      {/* 2. Top Titres Diffusés (Distinction Organique / Sponsorisé) */}
      <div className="lg:col-span-6 p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-[#DE1B34]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
              Top Titres — Répartition Écoutes
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSpace('01_CATALOGUE')}
            className="flex items-center gap-1 text-[10.5px] text-[#DE1B34] hover:text-[#FF4D64] transition cursor-pointer"
          >
            <span>Voir Catalogue</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1.5">
          {topTracks.map((t, idx) => {
            const plays = t.realPlays || 1200 + idx * 800;
            const org = Math.round(plays * 0.86);
            const spon = plays - org;

            return (
              <div
                key={t.id}
                onClick={() => onSelectTrack?.(t.id)}
                className="flex items-center justify-between p-2 rounded-xl bg-[#07090E] hover:bg-white/[0.04] border border-white/[0.06] cursor-pointer transition group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] font-bold text-emerald-400 w-4 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#F8FAFC] truncate group-hover:text-emerald-300 transition">
                      {t.title}
                    </p>
                    <span className="text-[9.5px] text-[#A3A9BA] truncate block">
                      {t.artist} • {t.category}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-[#F8FAFC] tabular-nums block">
                    {plays.toLocaleString('fr-FR')} plays
                  </span>
                  <span className="text-[9px] text-[#A3A9BA] tabular-nums">
                    <span className="text-emerald-400">{org} org.</span> •{' '}
                    <span className="text-amber-400">{spon} spon.</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

