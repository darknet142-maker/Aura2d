import React, { useState } from 'react';
import { X, Award, ShieldCheck, CheckCircle2, Coins, ArrowRight, Smartphone, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import { DirectMobileMoneyForm, type MobileOperator } from './DirectMobileMoneyForm';
import { TokenUnlockForm } from './TokenUnlockForm';

export type SubscriptionMode = 'DIRECT_PAID' | 'TOKEN_UNLOCK';
export type PlanTier = 'PASS_24H' | 'PASS_7J' | 'PREMIUM_MENSUEL';

export interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance: number;
  onActivatePass: (planTier: PlanTier, method: 'DIRECT_PAID' | 'TOKEN_UNLOCK', reference: string) => void;
  onGoToMissions?: () => void;
}

interface PlanSpec {
  id: PlanTier;
  title: string;
  duration: string;
  priceFcfa: number;
  tokensCost: number;
  isPopular?: boolean;
  features: string[];
}

const PLANS: PlanSpec[] = [
  {
    id: 'PASS_24H',
    title: 'Pass Découverte 24h',
    duration: '24 heures d’accès',
    priceFcfa: 150,
    tokensCost: 50,
    features: ['Accès illimité 24h', 'Mode Éco-Data Opus 32k'],
  },
  {
    id: 'PASS_7J',
    title: 'Pass Semaine 7 Jours',
    duration: '7 jours complets',
    priceFcfa: 500,
    tokensCost: 150,
    features: ['Zéro publicité', '25 titres en cache hors-ligne', 'Qualité Standard 96k'],
  },
  {
    id: 'PREMIUM_MENSUEL',
    title: 'Pass Mensuel Premium',
    duration: '30 jours complets',
    priceFcfa: 1500,
    tokensCost: 500,
    isPopular: true,
    features: ['Téléchargements illimités', 'Zéro publicité', 'Qualité Hi-Res 256k', 'Streams 100% certifiés ECG'],
  },
];

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  userBalance,
  onActivatePass,
  onGoToMissions,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanTier>('PREMIUM_MENSUEL');
  const [mode, setMode] = useState<SubscriptionMode>('DIRECT_PAID');
  const [receipt, setReceipt] = useState<{ txnId: string; label: string } | null>(null);

  if (!isOpen) return null;

  const currentPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[2];

  const handleSuccess = (ref: string, method: 'DIRECT_PAID' | 'TOKEN_UNLOCK') => {
    setReceipt({
      txnId: ref,
      label: `${currentPlan.title} activé avec succès.`,
    });
    onActivatePass(currentPlan.id, method, ref);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#080A0F]/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={SPRING_SNAPPY}
          className="relative w-full max-w-lg rounded-2xl bg-[#0D1017] border border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh] font-mono text-xs text-[#F8FAFC]"
        >
          {/* 1. Header de Souscription */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-[#07090E]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#DE1B34]/15 border border-[#DE1B34]/30 text-[#DE1B34]">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#F8FAFC]">
                  Abonnements &amp; Pass DROP (+241)
                </h3>
                <p className="text-[10px] text-[#A3A9BA]">
                  Deux modes d&apos;accès : Paiement direct ou Déblocage 100% Jetons
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#A3A9BA] hover:text-white cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto space-y-4">
            {receipt ? (
              <div className="p-6 rounded-2xl bg-[#07090E] border border-emerald-500/30 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-[#F8FAFC]">{receipt.label}</h4>
                <p className="text-[11px] text-[#A3A9BA]">
                  Référence : <span className="font-bold text-emerald-400">{receipt.txnId}</span>
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#DE1B34] text-white font-bold cursor-pointer transition hover:bg-[#FF4D64]"
                >
                  Continuer l&apos;Écoute
                </button>
              </div>
            ) : (
              <>
                {/* 2. Sélection de Formule */}
                <div className="grid grid-cols-3 gap-2">
                  {PLANS.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer relative ${
                          isSelected
                            ? 'bg-[#131722] border-emerald-500/60 shadow-sm'
                            : 'bg-[#07090E] border-white/[0.06] text-[#A3A9BA] hover:text-white'
                        }`}
                      >
                        {plan.isPopular && (
                          <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black bg-[#DE1B34] text-white uppercase tracking-wider">
                            Populaire
                          </span>
                        )}
                        <div>
                          <span className="text-[10px] font-extrabold text-[#F8FAFC] block truncate">
                            {plan.title.replace('Pass ', '')}
                          </span>
                          <span className="text-[9px] text-[#A3A9BA]">{plan.duration}</span>
                        </div>
                        <div className="mt-2 pt-1 border-t border-white/[0.05]">
                          <span className="text-xs font-black text-emerald-400 block tabular-nums">
                            {plan.priceFcfa} F
                          </span>
                          <span className="text-[8.5px] text-amber-400 block tabular-nums">
                            ou {plan.tokensCost} JTN
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 3. Sélecteur des Deux Modes d'Accès */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#07090E] border border-white/10">
                  <button
                    type="button"
                    onClick={() => setMode('DIRECT_PAID')}
                    className={`p-2 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                      mode === 'DIRECT_PAID'
                        ? 'bg-[#DE1B34] text-white shadow-sm'
                        : 'text-[#A3A9BA] hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mode 1 : Paiement Direct</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('TOKEN_UNLOCK')}
                    className={`p-2 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                      mode === 'TOKEN_UNLOCK'
                        ? 'bg-amber-400 text-[#080A0F] shadow-sm font-extrabold'
                        : 'text-[#A3A9BA] hover:text-white'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Mode 2 : 100% Jetons</span>
                  </button>
                </div>

                {/* 4. Formulaire Selon le Mode */}
                {mode === 'DIRECT_PAID' ? (
                  <DirectMobileMoneyForm
                    priceFcfa={currentPlan.priceFcfa}
                    planTitle={currentPlan.title}
                    onSuccess={(rec) => handleSuccess(rec.txnId, 'DIRECT_PAID')}
                  />
                ) : (
                  <TokenUnlockForm
                    userBalance={userBalance}
                    tokensCost={currentPlan.tokensCost}
                    planTitle={currentPlan.title}
                    onSuccess={(rec) => handleSuccess(rec.txnId, 'TOKEN_UNLOCK')}
                    onGoToMissions={() => {
                      onClose();
                      onGoToMissions?.();
                    }}
                  />
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
