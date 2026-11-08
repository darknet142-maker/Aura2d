import React, { useState } from 'react';
import { Smartphone, CheckCircle2, ShieldAlert, Sparkles, X } from 'lucide-react';
import type { QrDownloadTicket, AudioDownloadQuality } from '../types/qr-download.types';
import { confirmDownloadTicket, resolveDownloadTicket } from '../services/qr-download.service';

export interface MobileDownloadSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: QrDownloadTicket;
  currentUserId: string;
  onTicketUpdated: (ticket: QrDownloadTicket) => void;
  onToast: (msg: string, dotColor?: string) => void;
}

export const MobileDownloadSimulatorModal: React.FC<MobileDownloadSimulatorModalProps> = ({
  isOpen, onClose, ticket, currentUserId, onTicketUpdated, onToast,
}) => {
  const [simulateMismatchedUser, setSimulateMismatchedUser] = useState(false);
  const [quality, setQuality] = useState<AudioDownloadQuality>('HIGH');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;
  const effectiveMobileUser = simulateMismatchedUser ? 'usr_intruder_99' : currentUserId;

  const handleConfirmDownload = () => {
    setErrorMsg(null);
    const res = confirmDownloadTicket({
      ticketId: ticket.ticketId,
      mobileUserId: effectiveMobileUser,
      quality,
    });

    if (!res.success || !res.ticket) {
      setErrorMsg(res.error || 'Erreur de confirmation mobile');
      onToast(res.error || 'Rejet sécurité', 'bg-rose-500');
      return;
    }

    onTicketUpdated(res.ticket);
    onToast(`Morceau téléchargé en ${quality === 'HIGH' ? 'Haute Qualité (256k)' : 'Standard (128k)'} dans le stockage privé mobile !`, 'bg-emerald-400');
    onClose();
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[190] bg-[#07090E]/90 backdrop-blur-md flex items-center justify-center p-3 text-xs text-[#F8FAFC]">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-[#0D1017] border border-emerald-500/30 p-4 space-y-3.5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-xs">Simulateur Mobile DROP (+241)</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>

        <div className="p-3 rounded-2xl bg-[#131722] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#A3A9BA]">Titre scanné :</span>
            <span className="font-bold text-[#F8FAFC] truncate max-w-[180px]">{ticket.trackTitle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#A3A9BA]">Compte Mobile :</span>
            <span className="font-mono text-[10px] text-emerald-300 font-bold">{effectiveMobileUser}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-[#A3A9BA] block">Sélectionnez la qualité sonore :</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setQuality('STANDARD')}
              className={`p-2 rounded-xl border text-left cursor-pointer transition ${quality === 'STANDARD' ? 'bg-amber-400/15 border-amber-400 text-white font-bold' : 'bg-[#080A0F] border-white/10 text-[#A3A9BA]'}`}
            >
              <div className="text-[11px]">Standard</div>
              <div className="text-[9px] text-[#A3A9BA]">Opus 128 kbps</div>
            </button>
            <button
              type="button"
              onClick={() => setQuality('HIGH')}
              className={`p-2 rounded-xl border text-left cursor-pointer transition ${quality === 'HIGH' ? 'bg-emerald-500/15 border-emerald-400 text-white font-bold' : 'bg-[#080A0F] border-white/10 text-[#A3A9BA]'}`}
            >
              <div className="text-[11px] flex items-center gap-1">Haute Qualité <Sparkles className="w-3 h-3 text-emerald-400" /></div>
              <div className="text-[9px] text-[#A3A9BA]">Broadcast -14 LUFS</div>
            </button>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-[#080A0F] border border-white/10 flex items-center justify-between text-[10px]">
          <span className="text-[#A3A9BA]">Simuler un compte pirate différent :</span>
          <input type="checkbox" checked={simulateMismatchedUser} onChange={(e) => setSimulateMismatchedUser(e.target.checked)} className="cursor-pointer" />
        </div>

        {errorMsg && (
          <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleConfirmDownload}
          className="w-full py-2.5 rounded-xl bg-[#DE1B34] hover:bg-[#f02842] text-white font-extrabold cursor-pointer transition flex items-center justify-center gap-2 shadow-lg shadow-[#DE1B34]/25"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Confirmer le Stockage Privé Mobile</span>
        </button>
      </div>
    </div>
  );
};

