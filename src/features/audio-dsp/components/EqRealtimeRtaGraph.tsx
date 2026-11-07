import React, { useEffect, useMemo, useRef } from 'react';
import {
  buildLogFrequencyGrid,
  computeOctaveBandwidth,
  computeTransferCurvesDb,
  freqToNormLogX,
} from '../services/biquad-transfer.service';
import { DSP_BANDS_SPEC } from '../services/mastering-presets.service';
import { renderLogSpectrumRta } from '../services/rta-canvas.service';
import type { AudioSpectrumSnapshot } from '../types/audio-dsp.types';

export interface EqRealtimeRtaGraphProps {
  isOpen: boolean;
  isPlaying: boolean;
  eqGains: number[];
  eqQFactors: number[];
  eqBypassed: boolean;
  effectivePreampDb: number;
  selectedBandIdx: number;
  onSelectBand: (idx: number) => void;
  onDragBandGain: (idx: number, gainDb: number) => void;
  onChangeBandQ?: (idx: number, q: number) => void;
  getAudioSpectrumData?: () => AudioSpectrumSnapshot | null;
  onUpdateLiveMeters: (m: { rmsDb: number; peakDb: number; grDb: number }) => void;
}

const LOG_GRID = buildLogFrequencyGrid(128, 20, 20000);
const SVG_W = 360;
const SVG_H = 120;
const DB_RANGE = 15;
const dbToY = (db: number) =>
  SVG_H / 2 - (Math.max(-DB_RANGE, Math.min(DB_RANGE, db)) / DB_RANGE) * (SVG_H / 2 - 10);

export const EqRealtimeRtaGraph: React.FC<EqRealtimeRtaGraphProps> = ({
  isOpen, isPlaying, eqGains, eqQFactors, eqBypassed, effectivePreampDb,
  selectedBandIdx, onSelectBand, onDragBandGain, onChangeBandQ, getAudioSpectrumData, onUpdateLiveMeters,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingBandRef = useRef<number | null>(null);
  const peakHoldRef = useRef<Float32Array>(new Float32Array(56));
  const holdFramesRef = useRef<Uint8Array>(new Uint8Array(56));

  const { compositePath, compositeFill, activeBandPath, handles } = useMemo(() => {
    const { compositeDb, perBandDb } = computeTransferCurvesDb({
      bands: DSP_BANDS_SPEC, gains: eqGains, qFactors: eqQFactors,
      bypassed: eqBypassed, effectivePreampDb, frequencies: LOG_GRID,
    });
    const toPath = (arr: number[]) =>
      arr.map((db, i) => `${i === 0 ? 'M' : 'L'} ${(i / (arr.length - 1)) * SVG_W},${dbToY(db).toFixed(1)}`).join(' ');
    const comp = toPath(compositeDb);
    const activeBell = perBandDb[selectedBandIdx] ? toPath(perBandDb[selectedBandIdx]) : '';
    const pts = DSP_BANDS_SPEC.map((b, idx) => ({
      x: freqToNormLogX(b.freqHz) * SVG_W,
      y: dbToY(eqBypassed ? 0 : (eqGains[idx] ?? 0) + effectivePreampDb),
    }));
    return { compositePath: comp, compositeFill: `${comp} L ${SVG_W},${SVG_H} L 0,${SVG_H} Z`, activeBandPath: activeBell, handles: pts };
  }, [eqGains, eqQFactors, eqBypassed, effectivePreampDb, selectedBandIdx]);

  useEffect(() => {
    if (!isOpen) return;
    let rafId = 0;
    let tick = 0;
    const loop = () => {
      tick++;
      const snap = getAudioSpectrumData?.() || null;
      if (canvasRef.current) {
        renderLogSpectrumRta({ canvas: canvasRef.current, snap, isPlaying, eqBypassed, peakHold: peakHoldRef.current, holdFrames: holdFramesRef.current });
      }
      if (snap && tick % 4 === 0) {
        onUpdateLiveMeters({ rmsDb: snap.rmsDb, peakDb: snap.peakDb, grDb: snap.gainReductionDb ?? 0 });
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, isPlaying, eqBypassed, getAudioSpectrumData, onUpdateLiveMeters]);

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const idx = draggingBandRef.current;
    if (idx === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relY = (e.clientY - rect.top) / Math.max(1, rect.height);
    if (e.shiftKey && onChangeBandQ) {
      const nextQ = Math.max(0.3, Math.min(10, Math.round((0.3 + (1 - relY) * 9.7) * 100) / 100));
      onChangeBandQ(idx, nextQ);
      return;
    }
    const rawDb = (0.5 - relY) * 2 * DB_RANGE - effectivePreampDb;
    onDragBandGain(idx, Math.max(-12, Math.min(12, Math.round(rawDb * 10) / 10)));
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!onChangeBandQ) return;
    e.preventDefault();
    const curQ = eqQFactors[selectedBandIdx] ?? DSP_BANDS_SPEC[selectedBandIdx].defaultQ;
    const step = e.deltaY < 0 ? 0.15 : -0.15;
    onChangeBandQ(selectedBandIdx, Math.max(0.3, Math.min(10, Math.round((curQ + step) * 100) / 100)));
  };

  const activeSpec = DSP_BANDS_SPEC[selectedBandIdx] || DSP_BANDS_SPEC[0];
  const activeGain = eqGains[selectedBandIdx] ?? 0;
  const activeQ = eqQFactors[selectedBandIdx] ?? activeSpec.defaultQ;

  return (
    <div onWheel={handleWheel} className="relative h-32 sm:h-36 w-full rounded-2xl bg-[#07090E] border border-white/[0.09] overflow-hidden select-none touch-none">
      <canvas ref={canvasRef} width={448} height={140} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="absolute inset-x-2.5 top-1 flex items-center justify-between gap-2 text-[8.5px] font-mono text-[#A3A9BA] pointer-events-none">
        <span>+15 dB • FFT 4096</span>
        <span className="px-2 py-0.5 rounded-md bg-[#0D1017]/90 border border-amber-400/30 text-amber-200 font-bold truncate">
          {activeSpec.freqLabel} • {activeGain >= 0 ? `+${activeGain.toFixed(1)}` : activeGain.toFixed(1)} dB • Q {activeQ.toFixed(2)} ({computeOctaveBandwidth(activeQ).toFixed(2)} oct)
        </span>
        <span>Molette = Q</span>
      </div>
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[8.5px] font-mono text-[#A3A9BA]/80 pointer-events-none">0 dB</div>
      <div className="absolute inset-x-3 bottom-1 flex justify-between text-[8px] font-mono text-[#A3A9BA] pointer-events-none">
        <span>20Hz</span><span>60Hz</span><span>250Hz</span><span>1kHz</span><span>4kHz</span><span>12kHz</span><span>20kHz</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="none"
        onPointerMove={handlePointerMove}
        onPointerUp={() => { draggingBandRef.current = null; }}
        onPointerLeave={() => { draggingBandRef.current = null; }}
        className="relative z-10 w-full h-full"
      >
        <defs>
          <linearGradient id="dspBiquadFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.30" />
            <stop offset="55%" stopColor="#DE1B34" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#07090E" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <line x1="0" y1={SVG_H / 2} x2={SVG_W} y2={SVG_H / 2} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" strokeWidth="1" />
        {!eqBypassed && activeBandPath && <path d={activeBandPath} fill="none" stroke="rgba(16,185,129,0.65)" strokeDasharray="2 2" strokeWidth="1.5" />}
        <path d={compositeFill} fill="url(#dspBiquadFill)" />
        <path d={compositePath} fill="none" stroke={eqBypassed ? '#64748B' : '#F59E0B'} strokeWidth="2.3" strokeLinecap="round" />
        {handles.map((h, idx) => (
          <g key={DSP_BANDS_SPEC[idx].freqHz} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); draggingBandRef.current = idx; onSelectBand(idx); }} className="cursor-ns-resize">
            <circle cx={h.x} cy={h.y} r={12} fill="transparent" />
            <circle cx={h.x} cy={h.y} r={selectedBandIdx === idx ? 6.5 : 4.5} fill={eqBypassed ? '#475569' : selectedBandIdx === idx ? '#F59E0B' : '#0D1017'} stroke={selectedBandIdx === idx ? '#F8FAFC' : '#F59E0B'} strokeWidth={selectedBandIdx === idx ? 2.2 : 1.5} />
          </g>
        ))}
      </svg>
    </div>
  );
};
