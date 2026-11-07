import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import type { TrackAnalysis } from '../types/music-analysis.types';

export interface AnalysisStatusProps {
  analysis: TrackAnalysis | null;
  onReanalyze?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

export const AnalysisStatus: React.FC<AnalysisStatusProps> = ({
  analysis,
  onReanalyze,
  onCancel,
  compact = false,
}) => {
  const status = analysis?.analysisStatus || 'pending';
  const confidencePct = analysis?.bpmConfidence != null ? Math.round(analysis.bpmConfidence * 100) : null;

  const statusConfig = {
    pending: {
      label: 'En attente d’importation audio',
      badge: 'EN ATTENTE',
      color: 'text-[#A3A9BA] bg-[#121622] border-white/10',
      icon: Clock,
    },
    processing: {
      label: 'Analyse spectrale 4 bandes & Beat Tracking en cours...',
      badge: 'ANALYSE EN COURS',
      color: 'text-amber-300 bg-amber-500/15 border-amber-400/40',
      icon: Loader2,
    },
    completed: {
      label: analysis?.confirmedByHumanAt ? 'BPM & Tonalité confirmés (Traçabilité Studio)' : 'Analyse chirurgicale réussie (Haute confiance)',
      badge: analysis?.confirmedByHumanAt ? 'CONFIRMÉ' : 'ANALYSE RÉUSSIE',
      color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40',
      icon: CheckCircle2,
    },
    needs_review: {
      label: analysis?.failureReason || 'Analyse incertaine (ambiguïté demi/double temps) — validation humaine requise',
      badge: 'VALIDATION REQUISE',
      color: 'text-amber-300 bg-amber-500/15 border-amber-400/45',
      icon: AlertTriangle,
    },
    failed: {
      label: analysis?.failureReason || 'Analyse impossible — aucun BPM par défaut (120) attribué',
      badge: 'ÉCHEC ANALYSE',
      color: 'text-rose-300 bg-rose-500/15 border-rose-500/40',
      icon: XCircle,
    },
  }[status];

  const IconComp = statusConfig.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold ${statusConfig.color}`}>
        <IconComp className={`w-3.5 h-3.5 shrink-0 ${status === 'processing' ? 'animate-spin' : ''}`} />
        <span className="truncate">{statusConfig.badge}</span>
        {confidencePct !== null && status !== 'failed' && <span className="opacity-85">• {confidencePct}%</span>}
      </div>
    );
  }

  return (
    <div className="p-3 rounded-2xl bg-[#07090E] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${statusConfig.color}`}>
          <IconComp className={`w-4 h-4 ${status === 'processing' ? 'animate-spin' : ''}`} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-extrabold ${statusConfig.color}`}>{statusConfig.badge}</span>
            {confidencePct !== null && status !== 'failed' && (
              <span className="px-2 py-0.5 rounded-md bg-[#121622] border border-white/10 text-[9px] font-mono font-bold text-[#F8FAFC]">
                Confiance : {(analysis!.bpmConfidence || 0).toFixed(2)} ({confidencePct}%)
              </span>
            )}
            {analysis?.algorithmVersion && <span className="text-[9px] font-mono text-[#A3A9BA] truncate">{analysis.algorithmVersion}</span>}
          </div>
          <p className="text-[11px] text-[#A3A9BA] mt-1 break-words">{statusConfig.label}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {status === 'processing' && onCancel && (
          <motion.button type="button" whileTap={{ scale: 0.96 }} transition={SPRING_SNAPPY} onClick={onCancel} className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-[10px] font-bold">
            Annuler
          </motion.button>
        )}
        {status !== 'processing' && onReanalyze && (
          <motion.button type="button" whileTap={{ scale: 0.96 }} transition={SPRING_SNAPPY} onClick={onReanalyze} className="px-2.5 py-1.5 rounded-xl bg-[#121622] hover:bg-[#191F2E] border border-white/10 text-[#F8FAFC] text-[10px] font-bold flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            <span>Réanalyser</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};
