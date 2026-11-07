import React from 'react';
import { Activity, Disc } from 'lucide-react';
import { formatTime } from '../../../shared/utils/mediaFormatters';
import type { DjTransitionCompatibility, TrackAnalysis } from '../types/music-analysis.types';
import { AnalysisStatus } from './AnalysisStatus';

export interface MusicMetadataCardProps {
  analysis: TrackAnalysis;
  trackTitle?: string;
  djCompatibleTracks?: DjTransitionCompatibility[];
  onSelectCompatibleTrack?: (trackId: string) => void;
}

export const MusicMetadataCard: React.FC<MusicMetadataCardProps> = ({
  analysis,
  trackTitle,
  djCompatibleTracks = [],
  onSelectCompatibleTrack,
}) => {
  const effectiveBpm = analysis.confirmedBpm ?? analysis.detectedBpm;
  const effectiveKey = analysis.confirmedKey ?? analysis.detectedKey;
  const altCandidate = analysis.alternativeBpms.find((c) => c.relation !== 'primary');
  const bands = analysis.multiBandSummary;
  const historyCount = analysis.analysisHistory?.length ?? 0;

  return (
    <div className="rounded-2xl bg-[#07090E] border border-white/10 p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#F8FAFC] truncate">
              Fiche d’Intelligence Musicale {trackTitle ? `— ${trackTitle}` : ''}
            </h4>
            <p className="text-[10px] text-[#A3A9BA] truncate">
              Worker Multibande (30Hz–9kHz) • Beat Tracking DP
              {analysis.pcmMemoryMib ? ` • PCM ${analysis.pcmMemoryMib} Mio libéré` : ''}
              {historyCount > 0 ? ` • ${historyCount} passe(s) audit` : ''}
            </p>
          </div>
        </div>
        <AnalysisStatus analysis={analysis} compact />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="p-2.5 rounded-xl bg-[#0D1017] border border-amber-400/25 min-w-0">
          <span className="text-[10px] text-[#A3A9BA] block truncate">BPM Confirmé / Détecté</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-mono font-extrabold text-amber-300 truncate">
              {effectiveBpm != null ? `${effectiveBpm} BPM` : 'Non défini'}
            </span>
            {analysis.detectedBpm != null && analysis.confirmedBpm != null && analysis.confirmedBpm !== analysis.detectedBpm && (
              <span className="text-[9px] font-mono text-[#A3A9BA] shrink-0">(Auto {analysis.detectedBpm})</span>
            )}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.07] min-w-0">
          <span className="text-[10px] text-[#A3A9BA] block truncate">Octave &amp; Repères DJ</span>
          <span className="text-xs font-mono font-bold text-[#F8FAFC] block mt-0.5 truncate">
            {altCandidate ? `${altCandidate.bpm} (${altCandidate.relation === 'half_time' ? '÷2' : '×2'})` : '—'}
            {analysis.introEndSec != null && analysis.outroStartSec != null ? ` • ${formatTime(analysis.introEndSec)}/${formatTime(analysis.outroStartSec)}` : ''}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0D1017] border border-cyan-400/25 min-w-0">
          <span className="text-[10px] text-[#A3A9BA] block truncate">Tonalité &amp; Camelot</span>
          <span className="text-xs font-mono font-extrabold text-cyan-300 block mt-0.5 truncate">
            {effectiveKey || '—'} {analysis.camelotKey ? `• ${analysis.camelotKey}` : ''}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0D1017] border border-emerald-500/25 min-w-0">
          <span className="text-[10px] text-[#A3A9BA] block truncate">Confiance &amp; Grille</span>
          <span className="text-xs font-mono font-extrabold text-emerald-300 block mt-0.5 truncate">
            {analysis.bpmConfidence != null ? analysis.bpmConfidence.toFixed(2) : '—'} • {analysis.beatPositions.length} beats
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.07]">
          <span className="text-[10px] text-[#A3A9BA] block">Énergie Acoustique</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-[#DE1B34]" style={{ width: `${Math.round((analysis.energy ?? 0) * 100)}%` }} />
            </div>
            <span className="font-mono font-bold text-[#F8FAFC] text-[10px]">{analysis.energy != null ? analysis.energy.toFixed(2) : '—'}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.07]">
          <span className="text-[10px] text-[#A3A9BA] block">Danceability (Groove)</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-amber-400" style={{ width: `${Math.round((analysis.danceability ?? 0) * 100)}%` }} />
            </div>
            <span className="font-mono font-bold text-amber-300 text-[10px]">{analysis.danceability != null ? analysis.danceability.toFixed(2) : '—'}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.07] col-span-2 min-w-0">
          <span className="text-[10px] text-[#A3A9BA] block truncate">Spectre 4 Bandes (Sub &lt;140Hz • Groove • Transitoires • Percussions &gt;3.2kHz)</span>
          {bands ? (
            <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-mono text-[#F8FAFC]">
              <span className="text-rose-300">Sub {bands.subBassKickPct}%</span>
              <span className="text-amber-300">Groove {bands.lowMidGroovePct}%</span>
              <span className="text-emerald-300">Attaques {bands.midTransientPct}%</span>
              <span className="text-cyan-300">Hi-Hat {bands.highPercussionPct}%</span>
            </div>
          ) : (
            <span className="text-[10px] font-mono text-[#A3A9BA]">4 bandes calibrées</span>
          )}
        </div>
      </div>

      {djCompatibleTracks.length > 0 && (
        <div className="pt-2 border-t border-white/[0.07] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-amber-300">
            <span className="flex items-center gap-1 font-bold truncate"><Disc className="w-3.5 h-3.5 shrink-0" /><span className="truncate">DJ Mode B2B — Transitions Harmoniques &amp; Phase</span></span>
            <span className="text-[#A3A9BA] shrink-0">Carrure 4/8 mes.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {djCompatibleTracks.slice(0, 2).map((dj) => (
              <button key={dj.targetTrackId} type="button" onClick={() => onSelectCompatibleTrack?.(dj.targetTrackId)} className="p-2 rounded-xl bg-[#0D1017] hover:bg-[#141926] border border-white/10 text-left flex items-center justify-between gap-2 cursor-pointer min-w-0">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#F8FAFC] truncate">{dj.targetTitle} — {dj.targetArtist}</p>
                  <p className="text-[10px] font-mono text-[#A3A9BA] truncate">{dj.targetBpm} BPM • {dj.targetKey} • {dj.recommendedCrossfadeSec}s</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-mono text-[10px] font-bold shrink-0">{dj.compatibilityScore}%</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
