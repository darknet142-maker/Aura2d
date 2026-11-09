import React, { useState } from 'react';
import { Smartphone, CheckCircle2, ShieldCheck, ArrowRight, Loader2, CreditCard } from 'lucide-react';

export type MobileOperator = 'AIRTEL' | 'MOOV' | 'CARD';

export interface DirectMobileMoneyFormProps {
  priceFcfa: number;
  planTitle: string;
  onSuccess: (receipt: { operator: MobileOperator; phone: string; txnId: string; amount: number }) => void;
}

export const DirectMobileMoneyForm: React.FC<DirectMobileMoneyFormProps> = ({
  priceFcfa,
  planTitle,
  onSuccess,
}) => {
  const [operator, setOperator] = useState<MobileOperator>('AIRTEL');
  const [phone, setPhone] = useState('074 12 34 56');
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setStatus('PROCESSING');
    setTimeout(() => {
      setStatus('SUCCESS');
      const txnId = `TXN-${operator}-${Date.now().toString().slice(-6)}`;
      onSuccess({
        operator,
        phone: `+241 ${phone}`,
        txnId,
        amount: priceFcfa,
      });
    }, 1200);
  };

  return (
    <form onSubmit={handlePay} className="space-y-3 font-mono text-xs">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOperator('AIRTEL')}
          className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition ${
            operator === 'AIRTEL'
              ? 'bg-[#DE1B34]/15 border-[#DE1B34] text-white font-bold shadow-sm'
              : 'bg-[#07090E] border-white/10 text-[#A3A9BA] hover:text-white'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#DE1B34]" />
          <span>Airtel Money</span>
        </button>

        <button
          type="button"
          onClick={() => setOperator('MOOV')}
          className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition ${
            operator === 'MOOV'
              ? 'bg-cyan-500/15 border-cyan-400 text-white font-bold shadow-sm'
              : 'bg-[#07090E] border-white/10 text-[#A3A9BA] hover:text-white'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span>Moov Money</span>
        </button>

        <button
          type="button"
          onClick={() => setOperator('CARD')}
          className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition ${
            operator === 'CARD'
              ? 'bg-emerald-500/15 border-emerald-400 text-white font-bold shadow-sm'
              : 'bg-[#07090E] border-white/10 text-[#A3A9BA] hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Carte Bancaire</span>
        </button>
      </div>

      <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.08] space-y-1.5">
        <label className="text-[10.5px] text-[#A3A9BA] block">
          {operator === 'CARD' ? 'Numéro de carte sécurisé' : 'Numéro Mobile Money (Gabon +241)'}
        </label>
        <div className="flex items-center gap-2">
          {operator !== 'CARD' && (
            <span className="px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-[#F8FAFC] font-bold text-xs shrink-0">
              🇬🇦 +241
            </span>
          )}
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={operator === 'AIRTEL' ? '074 XX XX XX' : operator === 'MOOV' ? '062 XX XX XX' : '4970 XXXX XXXX XXXX'}
            className="w-full px-3 py-2 rounded-lg bg-[#0D1017] border border-white/10 text-[#F8FAFC] placeholder:text-[#A3A9BA]/40 outline-none focus:border-emerald-500/50 text-xs font-mono"
            required
          />
        </div>
        <p className="text-[9.5px] text-[#A3A9BA]">
          {operator === 'CARD'
            ? 'Paiement SSL 256-bit chiffré conforme PCI-DSS.'
            : 'Une invite USSD sera envoyée sur votre téléphone pour valider avec votre code PIN secret.'}
        </p>
      </div>

      <button
        type="submit"
        disabled={status === 'PROCESSING'}
        className="w-full py-3 rounded-xl bg-[#DE1B34] hover:bg-[#FF4D64] text-white font-extrabold flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 shadow-md shadow-[#DE1B34]/20"
      >
        {status === 'PROCESSING' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Communication avec {operator === 'AIRTEL' ? 'Airtel' : operator === 'MOOV' ? 'Moov' : 'la banque'}...</span>
          </>
        ) : (
          <>
            <span>Régler {priceFcfa.toLocaleString('fr-FR')} FCFA</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="flex items-center justify-between text-[10px] text-[#A3A9BA] pt-1">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Notification webhook certifiée
        </span>
        <span className="text-emerald-400 font-bold">Zéro frais d’émission</span>
      </div>
    </form>
  );
};
