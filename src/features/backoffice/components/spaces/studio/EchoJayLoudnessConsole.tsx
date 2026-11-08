import React from 'react';
import { Activity, Radio, Volume2 } from 'lucide-react';

export interface EchoJayLoudnessConsoleProps {
  measuredLufs?: number;
  audioCodec?: string;
  isAnalyzing?: boolean;
}

export const EchoJayLoudnessConsole: React.FC<EchoJayLoudnessConsoleProps> = ({
  measuredLufs = -14.0,
  audioCodec = 'Opus Broadcast 320 kbps',
  isAnalyzing = false,
}) => {
  const integrated = measuredLufs;
  const momentary = (integrated + 2.9).toFixed(1);
  const shortTerm = (integrated + 0.6).toFixed(1);
  const lra = '2.7';

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#F8FAFC]">
            Loudness &amp; Niveaux — EBU R128
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            {audioCodec}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/80">
            -14.0 LUFS Target
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06]">
          <span className="text-[10px] font-mono uppercase text-[#A3A9BA] block">Momentary</span>
          <span className="text-lg font-mono font-extrabold text-emerald-400">{momentary}</span>
          <span className="text-[9px] font-mono text-[#A3A9BA] block">LUFS</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06]">
          <span className="text-[10px] font-mono uppercase text-[#A3A9BA] block">Short Term</span>
          <span className="text-lg font-mono font-extrabold text-cyan-400">{shortTerm}</span>
          <span className="text-[9px] font-mono text-[#A3A9BA] block">LUFS</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06]">
          <span className="text-[10px] font-mono uppercase text-[#A3A9BA] block">Integrated</span>
          <span className="text-lg font-mono font-extrabold text-[#10B981]">{integrated.toFixed(1)}</span>
          <span className="text-[9px] font-mono text-[#A3A9BA] block">LUFS</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06]">
          <span className="text-[10px] font-mono uppercase text-[#A3A9BA] block">LRA (Dynamic)</span>
          <span className="text-lg font-mono font-extrabold text-[#F59E0B]">{lra}</span>
          <span className="text-[9px] font-mono text-[#A3A9BA] block">LU</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] flex flex-col gap-2">
          <span className="text-[10px] font-mono uppercase text-[#A3A9BA] flex items-center justify-between">
            <span>Peak &amp; True Peak Stereo (L / R)</span>
            <span className="text-emerald-400">Normalisé</span>
          </span>
          <div className="space-y-1.5 text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-10 text-[#A3A9BA]">RMS L</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[78%]" />
              </div>
              <span className="text-[#F8FAFC] w-12 text-right">-8.3 dB</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 text-[#A3A9BA]">RMS R</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[77%]" />
              </div>
              <span className="text-[#F8FAFC] w-12 text-right">-8.4 dB</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 text-[#A3A9BA]">PEAK</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full w-[94%]" />
              </div>
              <span className="text-amber-300 w-12 text-right">-0.3 dB</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] flex flex-col justify-between gap-2">
          <span className="text-[10px] font-mono uppercase text-[#A3A9BA] flex items-center justify-between">
            <span>Image Stéréo &amp; Corrélation de Phase</span>
            <span className="text-cyan-400">+0.97 Corr</span>
          </span>
          <div className="flex items-center justify-around gap-2 py-1">
            <div className="flex flex-col items-center">
              <span className="text-xs font-mono font-bold text-cyan-300">29.7 %</span>
              <span className="text-[9px] font-mono text-[#A3A9BA]">Stereo Width</span>
            </div>
            <div className="w-24 h-8 bg-[#07090E] rounded-lg border border-white/10 relative flex items-center justify-center">
              <div className="w-1.5 h-6 bg-cyan-400/80 rounded-full blur-[1px] transform rotate-12" />
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-white/40">Goniometer</div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-mono font-bold text-emerald-400">8.1 dB</span>
              <span className="text-[9px] font-mono text-[#A3A9BA]">Crest Factor</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500 w-[95%]" />
          </div>
        </div>
      </div>
    </div>
  );
};
