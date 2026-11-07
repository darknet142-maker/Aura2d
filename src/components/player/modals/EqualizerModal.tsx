import React, { useEffect, useState } from 'react';
import { Activity, Headphones, Infinity as InfinityIcon, Power, RotateCcw, Sliders, X } from 'lucide-react';
import { motion } from 'motion/react';
import { DropOfficialLogo } from '../../CoverArtwork';
import { SPRING_SNAPPY, SUBTLE_ENTRANCE_VARIANTS } from '../../../shared/ui/springMotion';
import {
  DEFAULT_PLAYBACK_PREFS,
  DEFAULT_SPATIAL_CONFIG,
  DSP_BANDS_SPEC,
  EqBandsPreampQSection,
  EqPlaybackModeSection,
  EqPreampMasterCard,
  EqRealtimeRtaGraph,
  EqSpatializerSection,
  type AudioSpectrumSnapshot,
  type PlaybackEnginePrefs,
  type PrecisionEqPreset,
  type SpatialAudioConfig,
} from '../../../features/audio-dsp';

export interface EqualizerModalProps {
  isOpen: boolean;
  isPro?: boolean;
  isPlaying?: boolean;
  isDropMode?: boolean;
  eqGains: number[];
  eqQFactors?: number[];
  eqBypassed?: boolean;
  preampDb?: number;
  effectivePreampDb?: number;
  eqQFactor?: number;
  autoHeadroom?: boolean;
  phaseInvert?: boolean;
  spatialConfig?: SpatialAudioConfig;
  playbackPrefs?: PlaybackEnginePrefs;
  masterVolume: number;
  onClose: () => void;
  onResetEq: () => void;
  onApplyEqPreset: (gains: number[]) => void;
  onApplyPrecisionPreset?: (preset: PrecisionEqPreset) => void;
  onChangeEqBand: (bandIdx: number, gainDb: number) => void;
  onChangeBandQ?: (bandIdx: number, q: number, applyAll?: boolean) => void;
  onToggleEqBypass?: () => void;
  onChangePreampDb?: (db: number) => void;
  onChangeEqQFactor?: (q: number) => void;
  onToggleAutoHeadroom?: () => void;
  onTogglePhaseInvert?: () => void;
  onChangeSpatialConfig?: (cfg: SpatialAudioConfig) => void;
  onChangePlaybackPrefs?: (prefs: PlaybackEnginePrefs) => void;
  onChangeMasterVolume: (val: number) => void;
  getAudioSpectrumData?: () => AudioSpectrumSnapshot | null;
  onToast: (msg: string) => void;
}

type ConsoleTab = 'EQ_Q' | 'SPATIAL' | 'PLAYBACK';

export const EqualizerModal: React.FC<EqualizerModalProps> = (props) => {
  const {
    isOpen, isPlaying = false, isDropMode = false, eqGains, eqBypassed = false,
    preampDb = 0, effectivePreampDb = preampDb, autoHeadroom = true, phaseInvert = false,
    spatialConfig = DEFAULT_SPATIAL_CONFIG, playbackPrefs = DEFAULT_PLAYBACK_PREFS,
    masterVolume, onClose, onResetEq, onApplyEqPreset, onApplyPrecisionPreset,
    onChangeEqBand, onChangeBandQ, onToggleEqBypass, onChangePreampDb, onChangeEqQFactor,
    onToggleAutoHeadroom, onTogglePhaseInvert, onChangeSpatialConfig, onChangePlaybackPrefs,
    onChangeMasterVolume, getAudioSpectrumData, onToast,
  } = props;

  const [activeTab, setActiveTab] = useState<ConsoleTab>('EQ_Q');
  const [selectedBandIdx, setSelectedBandIdx] = useState<number>(0);
  const [meters, setMeters] = useState({ rmsDb: -14.0, peakDb: -5.8, grDb: 0 });

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const qFactors = props.eqQFactors ?? DSP_BANDS_SPEC.map((b) => props.eqQFactor ?? b.defaultQ);

  return (
    <div role="dialog" aria-modal="true" aria-label="Drop Console" onClick={onClose} className="absolute inset-0 z-40 bg-[#07090E]/90 backdrop-blur-xl flex flex-col justify-end p-2.5 sm:p-4">
      <motion.div variants={SUBTLE_ENTRANCE_VARIANTS} initial="initial" animate="animate" onClick={(e) => e.stopPropagation()} className="w-full bg-[#0D1017] border border-white/[0.12] rounded-[26px] p-3.5 sm:p-5 space-y-3 shadow-[0_24px_70px_-12px_rgba(6,8,14,0.95)] max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <DropOfficialLogo className="h-4 w-auto max-w-[72px] shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#F8FAFC] truncate">Console</h2>
            </div>
            <p className="text-[10px] font-mono text-[#A3A9BA] truncate">RTA Log 20Hz–20kHz • Biquad Exact • Mid/Side 3D</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <motion.button type="button" whileTap={{ scale: 0.94 }} transition={SPRING_SNAPPY} onClick={() => { onToggleEqBypass?.(); onToast(!eqBypassed ? 'Bypass A/B activé (0 dB)' : 'Moteur DSP réactivé'); }} className={`px-2.5 py-1.5 rounded-xl border text-[10.5px] font-mono font-bold flex items-center gap-1 ${!eqBypassed ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300' : 'bg-white/[0.05] border-white/15 text-[#A3A9BA]'}`}>
              <Power className="w-3.5 h-3.5" /><span>{eqBypassed ? 'BYPASS' : 'DSP ON'}</span>
            </motion.button>
            <motion.button type="button" whileTap={{ scale: 0.94 }} transition={SPRING_SNAPPY} onClick={() => { onResetEq(); onToast('Console DSP remise à plat (0.0 dB)'); }} className="px-2.5 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-[10.5px] font-bold text-amber-300 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /><span>Plat</span>
            </motion.button>
            <button type="button" onClick={onClose} aria-label="Fermer la console DSP" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#F8FAFC] flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 p-2 rounded-2xl bg-[#080A0F] border border-white/[0.08] text-[10px] font-mono">
          <div className="min-w-0"><span className="text-[#A3A9BA] block truncate">RMS Broadcast</span><strong className="text-emerald-400 flex items-center gap-1"><Activity className="w-3 h-3 shrink-0" />{meters.rmsDb.toFixed(1)} dB</strong></div>
          <div className="border-l border-white/[0.08] pl-2 min-w-0"><span className="text-[#A3A9BA] block truncate">Crête Peak</span><strong className={meters.peakDb > -1.2 ? 'text-amber-300' : 'text-[#F8FAFC]'}>{meters.peakDb.toFixed(1)} dBFS</strong></div>
          <div className="border-l border-white/[0.08] pl-2 min-w-0"><span className="text-[#A3A9BA] block truncate">Limiteur GR</span><strong className="text-amber-300">{meters.grDb.toFixed(1)} dB</strong></div>
          <div className="border-l border-white/[0.08] pl-2 min-w-0"><span className="text-[#A3A9BA] block truncate">Mode Flux</span><strong className="text-emerald-300 truncate block">{playbackPrefs.defaultStartMode === 'FULL_NONSTOP' ? 'Non-Stop' : 'Drop 30s'}</strong></div>
        </div>

        <EqRealtimeRtaGraph isOpen={isOpen} isPlaying={isPlaying} eqGains={eqGains} eqQFactors={qFactors} eqBypassed={eqBypassed} effectivePreampDb={effectivePreampDb} selectedBandIdx={selectedBandIdx} onSelectBand={setSelectedBandIdx} onDragBandGain={onChangeEqBand} onChangeBandQ={(idx, q) => (onChangeBandQ ? onChangeBandQ(idx, q, false) : onChangeEqQFactor?.(q))} getAudioSpectrumData={getAudioSpectrumData} onUpdateLiveMeters={setMeters} />

        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#080A0F] border border-white/[0.08]">
          {([
            { id: 'EQ_Q', label: 'Égaliseur & Q', icon: Sliders },
            { id: 'SPATIAL', label: 'Spatialisation 3D', icon: Headphones },
            { id: 'PLAYBACK', label: 'Lecture Non-Stop', icon: InfinityIcon },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 min-w-0 ${active ? 'bg-[#DE1B34] text-[#F8FAFC] shadow-[0_8px_18px_-6px_rgba(222,27,52,0.65)]' : 'text-[#A3A9BA] hover:text-[#F8FAFC]'}`}>
                <Icon className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'EQ_Q' && (
          <>
            <EqBandsPreampQSection eqGains={eqGains} eqQFactors={qFactors} eqBypassed={eqBypassed} selectedBandIdx={selectedBandIdx} onSelectBand={setSelectedBandIdx} onChangeBandGain={onChangeEqBand} onChangeBandQ={(idx, q, all) => (onChangeBandQ ? onChangeBandQ(idx, q, all) : onChangeEqQFactor?.(q))} />
            <EqPreampMasterCard eqGains={eqGains} eqBypassed={eqBypassed} preampDb={preampDb} effectivePreampDb={effectivePreampDb} autoHeadroom={autoHeadroom} phaseInvert={phaseInvert} masterVolume={masterVolume} onChangePreampDb={(db) => onChangePreampDb?.(db)} onToggleAutoHeadroom={() => onToggleAutoHeadroom?.()} onTogglePhaseInvert={() => onTogglePhaseInvert?.()} onApplyPrecisionPreset={(p) => (onApplyPrecisionPreset ? onApplyPrecisionPreset(p) : onApplyEqPreset(p.gains))} onChangeMasterVolume={onChangeMasterVolume} onToast={onToast} />
          </>
        )}

        {activeTab === 'SPATIAL' && <EqSpatializerSection spatialConfig={spatialConfig} onChangeSpatialConfig={(cfg) => onChangeSpatialConfig?.(cfg)} onToast={onToast} />}

        {activeTab === 'PLAYBACK' && <EqPlaybackModeSection playbackPrefs={playbackPrefs} isDropMode={isDropMode} onChangePlaybackPrefs={(p) => onChangePlaybackPrefs?.(p)} onToast={onToast} />}
      </motion.div>
    </div>
  );
};
