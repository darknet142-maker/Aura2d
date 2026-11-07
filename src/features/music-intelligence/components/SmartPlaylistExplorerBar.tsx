import React, { useMemo, useState } from 'react';
import { Disc3, Flame, Pause, Play, Radio } from 'lucide-react';
import { motion } from 'motion/react';
import { CoverArtwork, type ArtworkType } from '../../../components/CoverArtwork';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import { ensureTrackSurgicalAnalysis } from '../services/catalogue-intelligence.service';
import { computeDjTransitionCompatibility } from '../services/key-detection.service';
import type { TrackAnalysis } from '../types/music-analysis.types';

export interface SmartPlaylistTrackEntry {
  albumIndex: number;
  trackIndex: number;
  track: {
    id: string;
    title: string;
    artist: string;
    category: string;
    cover: string;
    artworkType?: ArtworkType;
    bpm?: number;
    musicalKey?: string;
    duration: number;
    waveformPeaks?: number[];
    trackAnalysis?: TrackAnalysis;
  };
}

export interface SmartPlaylistExplorerBarProps {
  entries: SmartPlaylistTrackEntry[];
  currentTrack: SmartPlaylistTrackEntry['track'];
  isPlaying: boolean;
  onPlayTrack: (albumIndex: number, trackIndex: number) => void;
  onOpenTrackDetail: (trackId: string) => void;
}

type SmartModeId = 'NONE' | 'DJ_MIX' | 'CALM_GROOVE' | 'AFRO_AMAPIANO' | 'HIGH_ENERGY';

const MODES: { id: SmartModeId; label: string; badge: string }[] = [
  { id: 'DJ_MIX', label: 'DJ Mode B2B', badge: 'Camelot + Tempo' },
  { id: 'CALM_GROOVE', label: 'Groove Calme', badge: '80–108 BPM' },
  { id: 'AFRO_AMAPIANO', label: 'Afro & Amapiano', badge: '109–124 BPM' },
  { id: 'HIGH_ENERGY', label: 'Club & Sport', badge: 'Énergie ≥ 78%' },
];

export const SmartPlaylistExplorerBar: React.FC<SmartPlaylistExplorerBarProps> = ({
  entries,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onOpenTrackDetail,
}) => {
  const [activeMode, setActiveMode] = useState<SmartModeId>('NONE');
  const currentAnalysis = useMemo(() => currentTrack.trackAnalysis || ensureTrackSurgicalAnalysis(currentTrack), [currentTrack]);

  const filtered = useMemo(() => {
    if (activeMode === 'NONE') return [];
    const curBpm = currentAnalysis.confirmedBpm ?? currentAnalysis.detectedBpm ?? currentTrack.bpm ?? 116;
    const srcMeta = {
      bpm: curBpm,
      camelotKey: currentAnalysis.camelotKey,
      energy: currentAnalysis.energy ?? 0.75,
      downbeatOffsetSec: currentAnalysis.downbeatOffsetSec,
    };
    return entries
      .map((entry) => {
        const analysis = entry.track.trackAnalysis || ensureTrackSurgicalAnalysis(entry.track);
        const bpm = analysis.confirmedBpm ?? analysis.detectedBpm ?? entry.track.bpm ?? 0;
        const key = analysis.confirmedKey || analysis.detectedKey || 'A minor';
        const energy = analysis.energy ?? 0.72;
        const dj =
          entry.track.id === currentTrack.id
            ? null
            : computeDjTransitionCompatibility(srcMeta, {
                id: entry.track.id,
                title: entry.track.title,
                artist: entry.track.artist,
                bpm,
                key,
                camelotKey: analysis.camelotKey,
                energy,
                downbeatOffsetSec: analysis.downbeatOffsetSec,
              });
        return { entry, bpm, key, energy, dj };
      })
      .filter((item) => {
        if (item.bpm <= 0) return false;
        if (activeMode === 'DJ_MIX') return Boolean(item.dj && item.dj.compatibilityScore >= 62);
        if (activeMode === 'CALM_GROOVE') return item.bpm >= 70 && item.bpm <= 108;
        if (activeMode === 'AFRO_AMAPIANO') return item.bpm >= 109 && item.bpm <= 124;
        return item.energy >= 0.78 || item.bpm >= 125;
      })
      .sort((a, b) => (activeMode === 'DJ_MIX' ? (b.dj?.compatibilityScore ?? 0) - (a.dj?.compatibilityScore ?? 0) : b.energy - a.energy))
      .slice(0, 8);
  }, [activeMode, entries, currentTrack.id, currentTrack.bpm, currentAnalysis]);

  return (
    <section className="rounded-2xl bg-[#0D1017] border border-white/[0.08] p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Disc3 className="w-4 h-4 text-amber-400 shrink-0" />
          <h3 className="text-xs sm:text-sm font-extrabold text-[#F8FAFC] truncate">Smart Playlists &amp; Transitions DJ</h3>
        </div>
        {activeMode !== 'NONE' && (
          <button type="button" onClick={() => setActiveMode('NONE')} className="text-[10.5px] font-semibold text-[#A3A9BA] hover:text-[#F8FAFC] shrink-0">Fermer</button>
        )}
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {MODES.map((m) => (
          <motion.button key={m.id} type="button" whileTap={{ scale: 0.96 }} transition={SPRING_SNAPPY} onClick={() => setActiveMode(activeMode === m.id ? 'NONE' : m.id)} className={`px-2.5 py-1.5 rounded-xl border text-left shrink-0 flex items-center gap-1.5 ${activeMode === m.id ? 'bg-amber-400/20 border-amber-400/60 text-amber-300' : 'bg-[#080A0F] border-white/[0.08] text-[#F8FAFC] hover:border-white/20'}`}>
            {m.id === 'DJ_MIX' ? <Radio className="w-3 h-3 text-emerald-400 shrink-0" /> : <Flame className="w-3 h-3 text-amber-400 shrink-0" />}
            <span className="text-[11px] font-bold">{m.label}</span>
            <span className="text-[9.5px] font-mono text-[#A3A9BA]">{m.badge}</span>
          </motion.button>
        ))}
      </div>
      {activeMode !== 'NONE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {filtered.length === 0 ? (
            <div className="sm:col-span-2 p-3 rounded-xl bg-[#080A0F] border border-white/[0.06] text-center text-[11px] text-[#A3A9BA]">Aucun titre compatible dans cette plage rythmique.</div>
          ) : (
            filtered.map(({ entry, bpm, key, energy, dj }) => (
              <div key={entry.track.id} onClick={() => onPlayTrack(entry.albumIndex, entry.trackIndex)} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#080A0F] border border-white/[0.08] hover:border-amber-400/45 cursor-pointer">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <CoverArtwork artworkType={entry.track.artworkType} coverUrl={entry.track.cover} title={entry.track.title} artist={entry.track.artist} />
                    <span className="absolute inset-0 bg-[#07090E]/45 flex items-center justify-center text-white">{entry.track.id === currentTrack.id && isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onOpenTrackDetail(entry.track.id); }} className="text-xs font-bold text-[#F8FAFC] hover:text-amber-300 truncate block max-w-full text-left">{entry.track.title}</button>
                    <span className="text-[10px] font-mono text-[#A3A9BA] truncate block">{bpm} BPM • {key || '8A'} • Énergie {Math.round(energy * 100)}%</span>
                  </div>
                </div>
                {dj && activeMode === 'DJ_MIX' && <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 font-mono text-[9.5px] font-bold shrink-0">Mix {dj.compatibilityScore}%</span>}
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};
