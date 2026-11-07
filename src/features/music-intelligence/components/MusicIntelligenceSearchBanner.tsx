import React from 'react';
import { Activity, Sparkles, X } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import { parseMusicIntelligenceNaturalQuery } from '../services/catalogue-intelligence.service';

export interface MusicIntelligenceSearchBannerProps {
  query: string;
  onChangeQuery: (nextQuery: string) => void;
  compact?: boolean;
}

const NATURAL_QUERY_PRESETS = [
  'Afrobeats énergique autour de 110 BPM',
  'Ntcham rapide 126 BPM',
  'Amapiano dansant 112-116 BPM',
  'Nocturne calme A minor',
  'Sport festive 120 BPM',
] as const;

export const MusicIntelligenceSearchBanner: React.FC<MusicIntelligenceSearchBannerProps> = ({
  query,
  onChangeQuery,
  compact = false,
}) => {
  const decoded = parseMusicIntelligenceNaturalQuery(query);

  return (
    <section
      aria-label="Recherche Musicale Intelligente par Tempo, Tonalité et Énergie"
      className="rounded-2xl bg-[#080A0F] border border-white/[0.09] p-3 space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] font-extrabold text-[#F8FAFC] truncate">
            Recherche Music Intelligence (Genre • Tempo BPM • Camelot • Énergie)
          </span>
        </div>
        {query.trim().length > 0 && (
          <button
            type="button"
            onClick={() => onChangeQuery('')}
            className="px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-bold text-[#A3A9BA] hover:text-[#F8FAFC] flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Effacer</span>
          </button>
        )}
      </div>

      {!compact && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {NATURAL_QUERY_PRESETS.map((preset) => {
            const isSelected = query.trim().toLowerCase() === preset.toLowerCase();
            return (
              <motion.button
                key={preset}
                type="button"
                whileTap={{ scale: 0.96 }}
                transition={SPRING_SNAPPY}
                onClick={() => onChangeQuery(isSelected ? '' : preset)}
                className={`px-2.5 py-1 rounded-xl text-[10.5px] font-semibold whitespace-nowrap border shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400/20 border-amber-400/50 text-amber-200'
                    : 'bg-[#0D1017] hover:bg-[#131824] border-white/[0.08] text-[#A3A9BA] hover:text-[#F8FAFC]'
                }`}
              >
                « {preset} »
              </motion.button>
            );
          })}
        </div>
      )}

      {decoded.hasActiveIntelligenceFilter && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/[0.07]">
          <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1 shrink-0">
            <Activity className="w-3 h-3" />
            <span>Critères acoustiques décodés :</span>
          </span>
          {decoded.decodedBadges.map((badge) => (
            <span
              key={badge}
              className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-200"
            >
              {badge}
            </span>
          ))}
        </div>
      )}
    </section>
  );
};

