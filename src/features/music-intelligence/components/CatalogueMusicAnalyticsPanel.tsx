import React, { useMemo, useState } from 'react';
import { Activity, CheckCircle2, Disc } from 'lucide-react';
import type { Track } from '../../../shared/types/domain.types';
import { ensureTrackSurgicalAnalysis } from '../services/catalogue-intelligence.service';
import { RhythmBenchmarkMatrixCard } from './RhythmBenchmarkMatrixCard';

export interface CatalogueMusicAnalyticsPanelProps {
  tracks: Track[];
  onSelectTrack: (trackId: string) => void;
  onSelectArtist: (artistName: string) => void;
}

const BUCKET_FILTERS = [
  { id: 'ALL', label: 'Tout' },
  { id: 'SLOW', label: '< 105 BPM' },
  { id: 'MID', label: '105–122 BPM' },
  { id: 'FAST', label: '> 122 BPM' },
  { id: 'REVIEW', label: 'À vérifier' },
] as const;

export const CatalogueMusicAnalyticsPanel: React.FC<CatalogueMusicAnalyticsPanelProps> = ({
  tracks,
  onSelectTrack,
  onSelectArtist,
}) => {
  const [tempoBucketFilter, setTempoBucketFilter] = useState<(typeof BUCKET_FILTERS)[number]['id']>('ALL');

  const analyzedCatalogue = useMemo(
    () => tracks.map((track) => ({ track, analysis: ensureTrackSurgicalAnalysis(track) })),
    [tracks]
  );

  const stats = useMemo(() => {
    const total = Math.max(1, analyzedCatalogue.length);
    let sumBpm = 0;
    let sumEnergy = 0;
    let sumConf = 0;
    let reviewCount = 0;
    for (const { analysis } of analyzedCatalogue) {
      sumBpm += analysis.confirmedBpm ?? analysis.detectedBpm ?? 0;
      sumEnergy += analysis.energy ?? 0;
      sumConf += analysis.bpmConfidence ?? 0;
      if (analysis.analysisStatus === 'needs_review') reviewCount++;
    }
    return {
      avgBpm: Math.round(sumBpm / total),
      avgEnergyPct: Math.round((sumEnergy / total) * 100),
      avgConfidencePct: Math.round((sumConf / total) * 100),
      reviewCount,
    };
  }, [analyzedCatalogue]);

  const filteredRows = useMemo(
    () =>
      analyzedCatalogue.filter(({ analysis }) => {
        const bpm = analysis.confirmedBpm ?? analysis.detectedBpm ?? 0;
        if (tempoBucketFilter === 'SLOW') return bpm > 0 && bpm < 105;
        if (tempoBucketFilter === 'MID') return bpm >= 105 && bpm <= 122;
        if (tempoBucketFilter === 'FAST') return bpm > 122;
        if (tempoBucketFilter === 'REVIEW') return analysis.analysisStatus !== 'completed';
        return true;
      }),
    [analyzedCatalogue, tempoBucketFilter]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-[#0D1017] border border-white/[0.08]">
          <span className="text-[10.5px] font-mono text-[#A3A9BA] block">Tempo Moyen Catalogue</span>
          <strong className="text-base font-mono font-extrabold text-amber-300 mt-0.5 block">{stats.avgBpm} BPM</strong>
        </div>
        <div className="p-3 rounded-2xl bg-[#0D1017] border border-white/[0.08]">
          <span className="text-[10.5px] font-mono text-[#A3A9BA] block">Confiance Moyenne DSP</span>
          <strong className="text-base font-mono font-extrabold text-emerald-300 mt-0.5 block">{stats.avgConfidencePct}%</strong>
        </div>
        <div className="p-3 rounded-2xl bg-[#0D1017] border border-white/[0.08]">
          <span className="text-[10.5px] font-mono text-[#A3A9BA] block">Énergie Broadcast Moy.</span>
          <strong className="text-base font-mono font-extrabold text-[#F8FAFC] mt-0.5 block">{stats.avgEnergyPct}% (-14 LUFS)</strong>
        </div>
        <div className="p-3 rounded-2xl bg-[#0D1017] border border-white/[0.08]">
          <span className="text-[10.5px] font-mono text-[#A3A9BA] block">À Vérifier Humainement</span>
          <strong className="text-base font-mono font-extrabold text-rose-300 mt-0.5 block">{stats.reviewCount} piste(s)</strong>
        </div>
      </div>

      <RhythmBenchmarkMatrixCard />

      <div className="rounded-2xl bg-[#0D1017] border border-white/[0.08] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Disc className="w-4 h-4 text-[#DE1B34] shrink-0" />
            <h3 className="text-xs sm:text-sm font-extrabold text-[#F8FAFC] truncate">
              Cartographie BPM, Camelot, Intro/Outro &amp; Confiance ({filteredRows.length})
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {BUCKET_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTempoBucketFilter(f.id)}
                className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold border cursor-pointer ${
                  tempoBucketFilter === f.id ? 'bg-[#DE1B34] border-[#DE1B34] text-[#F8FAFC]' : 'bg-[#080A0F] border-white/10 text-[#A3A9BA] hover:text-[#F8FAFC]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="p-5 rounded-xl bg-[#080A0F] border border-white/[0.06] text-center space-y-2">
            <p className="text-xs font-bold text-[#F8FAFC]">Aucune piste dans ce segment de tempo ou de statut.</p>
            <button type="button" onClick={() => setTempoBucketFilter('ALL')} className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-[#F8FAFC] cursor-pointer">
              Réinitialiser le filtre
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredRows.map(({ track, analysis }) => (
              <div key={track.id} onClick={() => onSelectTrack(track.id)} className="p-2.5 rounded-xl bg-[#080A0F] hover:bg-[#121722] border border-white/[0.07] flex items-center justify-between gap-2.5 cursor-pointer min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-[#F8FAFC] truncate">{track.title}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[9.5px] font-mono text-[#A3A9BA] shrink-0">{track.category}</span>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); onSelectArtist(track.artist); }} className="text-[11px] text-amber-300 hover:underline truncate block max-w-full">
                    {track.artist}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10.5px] shrink-0">
                  <span className="px-2 py-0.5 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold">{analysis.confirmedBpm ?? analysis.detectedBpm ?? '—'} BPM</span>
                  <span className="px-2 py-0.5 rounded-lg bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 font-bold">{analysis.camelotKey || '8A'}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1">
                    {analysis.analysisStatus === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Activity className="w-3 h-3 text-amber-300" />}
                    {Math.round((analysis.bpmConfidence ?? 0.9) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
