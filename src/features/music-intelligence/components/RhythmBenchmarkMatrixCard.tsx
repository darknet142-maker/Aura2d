import React, { useState } from 'react';
import { Activity, CheckCircle2, Play, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import {
  executeScientificRhythmBenchmark,
  type RhythmBenchmarkReport,
} from '../services/rhythm-benchmark.service';

export const RhythmBenchmarkMatrixCard: React.FC = () => {
  const [report, setReport] = useState<RhythmBenchmarkReport>(() =>
    executeScientificRhythmBenchmark()
  );

  const dropSummary = report.summaries.find((s) => s.engineId === 'DROP_MULTIBAND');

  return (
    <div className="rounded-2xl bg-[#0D1017] border border-white/[0.08] p-4 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-extrabold text-[#F8FAFC] truncate">
              Protocole de Validation Scientifique — Benchmark Polyrythmique Africain &amp; Urbain
            </h3>
          </div>
          <p className="text-[11px] text-[#A3A9BA] mt-0.5">
            Comparatif exécuté en temps réel ({report.generatedAt}) sur {report.cases.length} signaux PCM synthétisés (Ntcham, Ndombolo, Afrobeats, Amapiano, 6/8, Intro longue).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {dropSummary?.meetsLaunchGate90Pct ? (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10.5px] font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Seuil ≥ 90% Validé ({dropSummary.exactWithin2BpmPct}%)</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10.5px] font-mono font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Calibrage requis</span>
            </span>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            transition={SPRING_SNAPPY}
            onClick={() => setReport(executeScientificRhythmBenchmark())}
            className="px-3 py-1.5 rounded-xl bg-[#DE1B34] hover:bg-[#f02843] text-[#F8FAFC] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Relancer Benchmark DSP</span>
          </motion.button>
        </div>
      </div>

      {/* Tableau comparatif des 3 moteurs (Section 7 du cahier des charges) */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#080A0F]">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-white/[0.08] text-[10.5px] text-[#A3A9BA]">
              <th className="p-2.5">Moteur d’Analyse</th>
              <th className="p-2.5">BPM Exact (±2)</th>
              <th className="p-2.5">Erreur Octave</th>
              <th className="p-2.5">Syncopés / 6:8</th>
              <th className="p-2.5">Temps Moyen</th>
              <th className="p-2.5">RAM PCM</th>
            </tr>
          </thead>
          <tbody>
            {report.summaries.map((s) => {
              const isDrop = s.engineId === 'DROP_MULTIBAND';
              return (
                <tr
                  key={s.engineId}
                  className={`border-b border-white/[0.05] ${isDrop ? 'bg-emerald-500/[0.08]' : ''}`}
                >
                  <td className="p-2.5 font-sans font-bold text-[#F8FAFC]">{s.engineName}</td>
                  <td className={`p-2.5 font-extrabold ${s.exactWithin2BpmPct >= 90 ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {s.exactWithin2BpmPct}%
                  </td>
                  <td className="p-2.5 text-rose-300">{s.octaveErrorPct}%</td>
                  <td className="p-2.5 text-cyan-300">{s.syncopatedAccuracyPct}%</td>
                  <td className="p-2.5 text-[#F8FAFC]">{s.avgProcessingMs} ms</td>
                  <td className="p-2.5 text-[#A3A9BA]">{s.samplePcmMib} Mio</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Détail par genre musical africain & cas limite */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {report.cases.map((c) => {
          const okDrop = Math.abs(c.dropMultibandBpm - c.trueBpm) <= 2;
          const okBasic = Math.abs(c.basic150HzBpm - c.trueBpm) <= 2;
          return (
            <div
              key={c.id}
              className="p-2.5 rounded-xl bg-[#080A0F] border border-white/[0.07] flex flex-col gap-1 min-w-0"
            >
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <span className="text-[11px] font-bold text-[#F8FAFC] truncate">{c.genre}</span>
                <span className="text-[10px] font-mono text-amber-300 shrink-0">Réel : {c.trueBpm}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className={okBasic ? 'text-[#A3A9BA]' : 'text-rose-400'}>
                  150Hz : {c.basic150HzBpm}
                </span>
                <span className={okDrop ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                  DROP : {c.dropMultibandBpm} BPM ✓
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

