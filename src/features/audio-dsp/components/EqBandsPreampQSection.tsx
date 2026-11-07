import React from 'react';
import { computeOctaveBandwidth, describeQFactorCharacter } from '../services/biquad-transfer.service';
import { DSP_BANDS_SPEC } from '../services/mastering-presets.service';

export interface EqBandsPreampQSectionProps {
  eqGains: number[];
  eqQFactors: number[];
  eqBypassed: boolean;
  selectedBandIdx: number;
  onSelectBand: (idx: number) => void;
  onChangeBandGain: (idx: number, gainDb: number) => void;
  onChangeBandQ: (idx: number, q: number, applyAll?: boolean) => void;
}

const Q_QUICK_PRESETS = [
  { q: 0.55, label: '0.55 Large' },
  { q: 1.0, label: '1.0 Analog' },
  { q: 1.85, label: '1.85 Mix' },
  { q: 3.6, label: '3.6 Étroit' },
  { q: 6.5, label: '6.5 Notch' },
];

export const EqBandsPreampQSection: React.FC<EqBandsPreampQSectionProps> = ({
  eqGains,
  eqQFactors,
  eqBypassed,
  selectedBandIdx,
  onSelectBand,
  onChangeBandGain,
  onChangeBandQ,
}) => {
  const activeSpec = DSP_BANDS_SPEC[selectedBandIdx] || DSP_BANDS_SPEC[0];
  const activeGain = eqGains[selectedBandIdx] ?? 0;
  const activeQ = eqQFactors[selectedBandIdx] ?? activeSpec.defaultQ;
  const bandwidthOct = computeOctaveBandwidth(activeQ);

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-5 gap-1.5">
        {DSP_BANDS_SPEC.map((band, idx) => {
          const gain = eqGains[idx] ?? 0;
          const qVal = eqQFactors[idx] ?? band.defaultQ;
          const isSelected = selectedBandIdx === idx;
          const fillPct = ((gain + 12) / 24) * 100;
          return (
            <div
              key={band.freqHz}
              onClick={() => onSelectBand(idx)}
              className={`rounded-2xl border p-2 flex flex-col items-center gap-1 cursor-pointer min-w-0 ${
                isSelected ? 'bg-[#131722] border-amber-400/75 shadow-[0_10px_24px_-10px_rgba(245,158,11,0.35)]' : 'bg-[#080A0F] border-white/[0.08] hover:border-white/20'
              }`}
            >
              <span className={`text-[9.5px] font-mono font-bold ${eqBypassed ? 'text-[#A3A9BA]/50' : gain > 0 ? 'text-amber-300' : gain < 0 ? 'text-sky-300' : 'text-[#A3A9BA]'}`}>
                {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)}
              </span>
              <div className="relative h-20 w-7 flex items-center justify-center">
                <div className="relative h-full w-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="absolute inset-x-0 top-1/2 h-px bg-white/35 z-10" />
                  <div
                    style={{ height: `${Math.abs(fillPct - 50)}%`, bottom: gain >= 0 ? '50%' : `${fillPct}%` }}
                    className={`absolute inset-x-0 rounded-full ${eqBypassed ? 'bg-slate-500' : gain >= 0 ? 'bg-amber-400' : 'bg-sky-400'}`}
                  />
                </div>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={0.1}
                  value={gain}
                  onChange={(e) => { onSelectBand(idx); onChangeBandGain(idx, parseFloat(e.target.value)); }}
                  aria-label={`Bande ${band.freqLabel}`}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                />
              </div>
              <span className={`text-[10px] font-extrabold leading-none truncate max-w-full ${isSelected ? 'text-amber-300' : 'text-[#F8FAFC]'}`}>{band.freqLabel}</span>
              <span className="text-[8.5px] font-mono text-emerald-300/90">Q {qVal.toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-2xl bg-[#080A0F] border border-white/[0.09] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#F8FAFC] truncate min-w-0">
            {activeSpec.freqLabel} • {activeSpec.roleLabel}{' '}
            <span className="text-[10px] font-mono text-emerald-300">(Q={activeQ.toFixed(2)} • {bandwidthOct} oct • {describeQFactorCharacter(activeQ)})</span>
          </span>
          <button type="button" onClick={() => onChangeBandQ(selectedBandIdx, activeQ, true)} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-[#A3A9BA] hover:text-[#F8FAFC] shrink-0">
            Appliquer Q aux 5 bandes
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <div className="flex justify-between text-[10.5px] font-mono text-[#A3A9BA]">
              <span>Gain chirurgical (0.1 dB)</span>
              <strong className="text-amber-300">{activeGain > 0 ? `+${activeGain.toFixed(1)}` : activeGain.toFixed(1)} dB</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => onChangeBandGain(selectedBandIdx, Math.max(-12, Math.round((activeGain - 0.2) * 10) / 10))} className="px-2 py-1 rounded-lg bg-white/[0.07] text-[10px] font-mono text-[#F8FAFC]">-0.2</button>
              <input type="range" min={-12} max={12} step={0.1} value={activeGain} onChange={(e) => onChangeBandGain(selectedBandIdx, parseFloat(e.target.value))} className="flex-1 fat-slider cursor-pointer" aria-label="Gain précis bande active" />
              <button type="button" onClick={() => onChangeBandGain(selectedBandIdx, Math.min(12, Math.round((activeGain + 0.2) * 10) / 10))} className="px-2 py-1 rounded-lg bg-amber-400/20 text-[10px] font-mono text-amber-300">+0.2</button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10.5px] font-mono text-[#A3A9BA]">
              <span>Facteur Q Bande (0.30 – 10.0)</span>
              <strong className="text-emerald-300">Q = {activeQ.toFixed(2)}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => onChangeBandQ(selectedBandIdx, Math.max(0.3, Math.round((activeQ - 0.15) * 100) / 100))} className="px-2 py-1 rounded-lg bg-white/[0.07] text-[10px] font-mono text-[#F8FAFC]">-Q</button>
              <input type="range" min={0.3} max={10} step={0.05} value={activeQ} onChange={(e) => onChangeBandQ(selectedBandIdx, parseFloat(e.target.value))} className="flex-1 fat-slider cursor-pointer" aria-label="Facteur Q bande active" />
              <button type="button" onClick={() => onChangeBandQ(selectedBandIdx, Math.min(10, Math.round((activeQ + 0.15) * 100) / 100))} className="px-2 py-1 rounded-lg bg-emerald-500/20 text-[10px] font-mono text-emerald-300">+Q</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 pt-0.5">
          {Q_QUICK_PRESETS.map((item) => (
            <button key={item.q} type="button" onClick={() => onChangeBandQ(selectedBandIdx, item.q)} className={`py-1 px-1 rounded-lg text-[9.5px] font-mono font-bold border truncate ${Math.abs(activeQ - item.q) < 0.12 ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300' : 'bg-white/[0.03] border-white/[0.08] text-[#A3A9BA] hover:text-[#F8FAFC]'}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
