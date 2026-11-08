import React from 'react';
import { AudioWaveform, BarChart3 } from 'lucide-react';

export interface SpectrumWaveformCardProps {
  waveformPeaks?: number[];
  audioFileName?: string;
  duration?: string;
}

export const SpectrumWaveformCard: React.FC<SpectrumWaveformCardProps> = ({
  waveformPeaks,
  audioFileName = 'Master_Opus_320k_EBU_R128.opus',
  duration = '03:45',
}) => {
  const peaks = waveformPeaks && waveformPeaks.length > 0
    ? waveformPeaks
    : Array.from({ length: 48 }, (_, i) => Math.sin(i * 0.25) * 0.4 + 0.5);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <AudioWaveform className="w-4 h-4 text-[#DE1B34]" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#F8FAFC]">
            Forme d&apos;Onde &amp; Spectre Fréquentiel
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#A3A9BA]">
          {audioFileName} • {duration}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 bg-[#07090E] p-3 rounded-xl border border-white/[0.06]">
        <div className="flex items-center justify-between text-[9.5px] font-mono text-[#A3A9BA]">
          <span>WAVEFORM PEAKS</span>
          <span className="text-emerald-400">Normalisation -14.0 LUFS</span>
        </div>
        <div className="h-16 flex items-center justify-between gap-1 overflow-hidden px-1">
          {peaks.slice(0, 48).map((peak, idx) => {
            const h = Math.max(12, Math.min(100, Math.round(peak * 100)));
            return (
              <div
                key={idx}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-sm transition-all duration-300 ${
                  h > 85 ? 'bg-amber-400' : 'bg-cyan-400/80'
                }`}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 bg-[#07090E] p-3 rounded-xl border border-white/[0.06]">
        <div className="flex items-center justify-between text-[9.5px] font-mono text-[#A3A9BA]">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3 text-cyan-400" />
            SPECTRUM ANALYZER (50 Hz — 20 kHz)
          </span>
          <span className="text-cyan-300">Fast Fourier Transform (FFT)</span>
        </div>
        <div className="h-12 relative flex items-end justify-between gap-1 pt-2">
          {Array.from({ length: 32 }, (_, i) => {
            const curve = Math.sin((i / 32) * Math.PI) * 0.7 + 0.2;
            const h = Math.round(curve * 100);
            return (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 bg-gradient-to-t from-cyan-600/60 to-cyan-400/90 rounded-t-sm"
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[8.5px] font-mono text-[#A3A9BA]/70 pt-1">
          <span>50 Hz</span>
          <span>250 Hz</span>
          <span>1 kHz</span>
          <span>5 kHz</span>
          <span>20 kHz</span>
        </div>
      </div>
    </div>
  );
};
