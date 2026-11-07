import React from 'react';
import { Check, ShieldCheck, Sliders } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import type { TrackAnalysis } from '../types/music-analysis.types';

export interface AnalysisReviewProps {
  analysis: TrackAnalysis | null;
  currentBpm: number | null;
  currentKey: string;
  onConfirmBpm: (confirmedBpm: number) => void;
  onConfirmKey: (confirmedKey: string) => void;
}

const STUDIO_KEYS_LIST = [
  'A minor (La Mineur • 8A)',
  'C minor (Do Mineur • 5A)',
  'F# minor (Fa# Mineur • 11A)',
  'G minor (Sol Mineur • 6A)',
  'D minor (Ré Mineur • 7A)',
  'E minor (Mi Mineur • 9A)',
  'C major (Do Majeur • 8B)',
  'F major (Fa Majeur • 7B)',
  'G major (Sol Majeur • 9B)',
];

/**
 * Interface de révision et validation humaine (Artiste / Label / Admin).
 * Sépare strictement confirmedBpm / confirmedKey des valeurs brutes détectées (zéro 120 BPM par défaut).
 */
export const AnalysisReview: React.FC<AnalysisReviewProps> = ({
  analysis,
  currentBpm,
  currentKey,
  onConfirmBpm,
  onConfirmKey,
}) => {
  const candidates = analysis?.alternativeBpms || [];
  const stepBase = currentBpm ?? analysis?.detectedBpm ?? 100;

  return (
    <div className="rounded-2xl bg-[#0D1017] border border-amber-400/30 p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-extrabold text-[#F8FAFC] truncate">
            Validation Humaine &amp; Arbitrage Demi-Temps / Double-Temps
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Détecté brut : {analysis?.detectedBpm != null ? `${analysis.detectedBpm} BPM` : 'Non détecté'}</span>
        </span>
      </div>

      {candidates.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A9BA] block">
            Candidats Rythmiques Détectés (Cliquez pour confirmer)
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {candidates.map((cand) => {
              const isSelected = currentBpm === cand.bpm;
              return (
                <motion.button
                  key={`${cand.relation}-${cand.bpm}`}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING_SNAPPY}
                  onClick={() => onConfirmBpm(cand.bpm)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold border flex items-center gap-1.5 ${
                    isSelected ? 'bg-amber-400 text-[#080A0F] border-amber-300 shadow-sm' : 'bg-[#07090E] text-[#F8FAFC] border-white/10 hover:border-amber-400/50'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  <span>{cand.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <div>
          <label className="block text-[11px] text-amber-300 font-semibold mb-1">
            BPM Confirmé * (45 – 240 BPM, zéro valeur fictive)
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={45}
              max={240}
              step={1}
              value={currentBpm ?? ''}
              placeholder="Saisir BPM réel..."
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 40 && val <= 240) onConfirmBpm(val);
              }}
              className="flex-1 min-w-0 bg-[#07090E] border border-white/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300"
            />
            <button type="button" onClick={() => onConfirmBpm(Math.max(45, stepBase - 1))} className="px-2.5 py-2 rounded-xl bg-[#07090E] border border-white/10 text-xs font-mono text-[#F8FAFC] hover:border-white/25 shrink-0">-1</button>
            <button type="button" onClick={() => onConfirmBpm(Math.min(240, stepBase + 1))} className="px-2.5 py-2 rounded-xl bg-[#07090E] border border-white/10 text-xs font-mono text-[#F8FAFC] hover:border-white/25 shrink-0">+1</button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-cyan-300 font-semibold mb-1">
            Tonalité Confirmée (Détectée : {analysis?.detectedKey || '—'})
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={currentKey}
              onChange={(e) => onConfirmKey(e.target.value)}
              placeholder="Ex: A minor (8A)"
              className="w-1/2 min-w-0 bg-[#07090E] border border-white/15 rounded-xl px-2.5 py-2 text-xs font-mono text-cyan-300"
            />
            <select
              value=""
              onChange={(e) => { if (e.target.value) onConfirmKey(e.target.value); }}
              className="w-1/2 min-w-0 bg-[#07090E] border border-white/15 rounded-xl px-2 py-2 text-[11px] text-[#F8FAFC]"
            >
              <option value="">Choisir...</option>
              {STUDIO_KEYS_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
