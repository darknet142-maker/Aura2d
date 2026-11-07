import React, { useMemo, useState } from 'react';
import { Disc3, Play, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import { formatTime } from '../../../shared/utils/mediaFormatters';
import { ensureTrackSurgicalAnalysis } from '../services/catalogue-intelligence.service';
import { computeDjTransitionCompatibility } from '../services/key-detection.service';

export interface DjB2bTrackLite {
  id: string; title: string; artist: string; category?: string;
  bpm?: number | null; musicalKey?: string; duration: number; waveformPeaks?: number[];
}

export interface DjModeB2bDeckCardProps {
  tracks: DjB2bTrackLite[];
  activeCrossfadeSec: number;
  onApplyCrossfadeSec?: (sec: number) => void;
  onTriggerTransition?: (targetTrackId: string, recommendedCrossfadeSec: number) => void;
}

const HARMONIC_BADGE: Record<string, { label: string; cls: string }> = {
  PERFECT_MATCH: { label: 'Unisson Camelot', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  RELATIVE_KEY: { label: 'Relatif Maj/Min', cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  FIFTH_STEP: { label: 'Quinte ±1 Compatible', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  ENERGY_BOOST: { label: 'Boost Énergie +2', cls: 'bg-[#DE1B34]/20 text-rose-300 border-[#DE1B34]/40' },
  DISSONANT: { label: 'Écart Harmonique', cls: 'bg-white/[0.06] text-[#A3A9BA] border-white/10' },
};

export const DjModeB2bDeckCard: React.FC<DjModeB2bDeckCardProps> = ({
  tracks, activeCrossfadeSec, onApplyCrossfadeSec, onTriggerTransition,
}) => {
  const [deckATrackId, setDeckATrackId] = useState<string>(() => tracks[0]?.id ?? '');
  const [lastMixBanner, setLastMixBanner] = useState<string | null>(null);
  const enriched = useMemo(() => tracks.map((t) => ({ track: t, analysis: ensureTrackSurgicalAnalysis(t) })), [tracks]);
  const deckA = enriched.find((e) => e.track.id === deckATrackId) || enriched[0];

  const rankedTransitions = useMemo(() => {
    if (!deckA) return [];
    const srcBpm = deckA.analysis.confirmedBpm ?? deckA.analysis.detectedBpm ?? 118;
    return enriched
      .filter((item) => item.track.id !== deckA.track.id)
      .map((item) =>
        computeDjTransitionCompatibility(
          { bpm: srcBpm, camelotKey: deckA.analysis.camelotKey, downbeatOffsetSec: deckA.analysis.downbeatOffsetSec, energy: deckA.analysis.energy, outroStartSec: deckA.analysis.outroStartSec },
          { id: item.track.id, title: item.track.title, artist: item.track.artist, bpm: item.analysis.confirmedBpm ?? item.analysis.detectedBpm ?? 118, key: item.analysis.confirmedKey || item.analysis.detectedKey || 'A minor', camelotKey: item.analysis.camelotKey, downbeatOffsetSec: item.analysis.downbeatOffsetSec, energy: item.analysis.energy, introEndSec: item.analysis.introEndSec }
        )
      )
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 4);
  }, [deckA, enriched]);

  if (!deckA) return null;
  const deckABpm = deckA.analysis.confirmedBpm ?? deckA.analysis.detectedBpm ?? 118;

  return (
    <div className="rounded-2xl bg-[#080A0F] border border-amber-400/25 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">DJ Mode B2B (Bar Pro Libreville) — Transitions Calées en Phase</span>
          </h4>
          <p className="text-[11px] text-[#A3A9BA] truncate">
            Détection Intro / Outro, grille de battements, roue de Camelot et courbe d’énergie (zéro tri BPM naïf).
          </p>
        </div>
        <select
          aria-label="Choisir la piste en cours sur la Platine A"
          value={deckA.track.id}
          onChange={(e) => setDeckATrackId(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl bg-[#0D1017] border border-white/15 text-xs font-bold text-[#F8FAFC] max-w-[230px] truncate"
        >
          {enriched.map(({ track, analysis }) => (
            <option key={track.id} value={track.id}>
              Platine A : {track.title} ({analysis.confirmedBpm ?? analysis.detectedBpm} BPM • {analysis.camelotKey})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.08] text-[11px] font-mono">
        <div className="min-w-0"><span className="text-[#A3A9BA] block truncate">Tempo &amp; Camelot</span><strong className="text-amber-300 truncate block">{deckABpm} BPM • {deckA.analysis.camelotKey}</strong></div>
        <div className="min-w-0"><span className="text-[#A3A9BA] block truncate">Fin Intro (Cue In)</span><strong className="text-emerald-300">{formatTime(deckA.analysis.introEndSec ?? 14)}</strong></div>
        <div className="min-w-0"><span className="text-[#A3A9BA] block truncate">Début Outro (Mix Out)</span><strong className="text-rose-300">{formatTime(deckA.analysis.outroStartSec ?? 150)}</strong></div>
        <div className="min-w-0"><span className="text-[#A3A9BA] block truncate">Énergie / Crossfade</span><strong className="text-[#F8FAFC]">{Math.round((deckA.analysis.energy ?? 0.8) * 100)}% • {activeCrossfadeSec}s</strong></div>
      </div>

      {lastMixBanner && (
        <div role="status" className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-[11px] font-medium text-emerald-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{lastMixBanner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {rankedTransitions.map((tr) => {
          const badge = HARMONIC_BADGE[tr.harmonicRelation] || HARMONIC_BADGE.DISSONANT;
          return (
            <div key={tr.targetTrackId} className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.08] flex items-center justify-between gap-2.5 min-w-0">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-[#F8FAFC] truncate">{tr.targetTitle}</span>
                  <span className={`px-1.5 py-0.5 rounded border text-[9.5px] font-mono font-bold shrink-0 ${badge.cls}`}>{badge.label}</span>
                </div>
                <p className="text-[10.5px] font-mono text-[#A3A9BA] truncate">
                  {tr.targetArtist} • {tr.targetBpm} BPM (Pitch {tr.pitchShiftPct > 0 ? `+${tr.pitchShiftPct}` : tr.pitchShiftPct}%) • Phase Δ{tr.phaseOffsetMs}ms • {tr.phraseBars} mes.
                </p>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                transition={SPRING_SNAPPY}
                onClick={() => {
                  const snappedSec = Math.min(8, Math.max(2, Math.round(tr.recommendedCrossfadeSec)));
                  onApplyCrossfadeSec?.(snappedSec);
                  setDeckATrackId(tr.targetTrackId);
                  onTriggerTransition?.(tr.targetTrackId, snappedSec);
                  setLastMixBanner(`Mix lancé vers « ${tr.targetTitle} » à ${formatTime(tr.sourceOutroStartSec ?? 150)} (Crossfade ${tr.phraseBars} mesures • ${tr.compatibilityScore}% Match).`);
                }}
                className="px-2.5 py-2 rounded-xl bg-[#DE1B34] hover:bg-[#f02843] text-[#F8FAFC] text-[10.5px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current shrink-0" />
                <span>{tr.compatibilityScore}% Mix</span>
              </motion.button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
