import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Smartphone, RefreshCw, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { Track } from '../../../shared/types/domain.types';
import type { QrDownloadTicket } from '../types/qr-download.types';
import { createDownloadTicket, getTicketStatus } from '../services/qr-download.service';
import { MobileDownloadSimulatorModal } from './MobileDownloadSimulatorModal';

export interface QrDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  currentUserId: string;
  onDownloadConfirmed?: (ticket: QrDownloadTicket) => void;
  onToast: (msg: string, dotColor?: string) => void;
}

export const QrDownloadModal: React.FC<QrDownloadModalProps> = ({
  isOpen, onClose, track, currentUserId, onDownloadConfirmed, onToast,
}) => {
  const [ticket, setTicket] = useState<QrDownloadTicket | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState(120);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initTicket = () => {
    const fresh = createDownloadTicket({
      trackId: track.id, trackTitle: track.title, trackArtist: track.artist,
      coverUrl: track.cover, userId: currentUserId,
    });
    setTicket(fresh);
    setTimeLeftSec(120);
  };

  useEffect(() => {
    if (isOpen) initTicket();
  }, [isOpen, track.id, currentUserId]);

  useEffect(() => {
    if (!isOpen || !ticket || ticket.status === 'CONFIRMED' || ticket.status === 'EXPIRED') return;
    const timer = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          const st = getTicketStatus(ticket.ticketId);
          if (st.ticket) setTicket({ ...st.ticket });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, ticket?.ticketId, ticket?.status]);

  useEffect(() => {
    if (!ticket || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, ticket.qrPayload, {
      width: 170, margin: 1, color: { dark: '#F8FAFC', light: '#0D1017' },
    }).catch(() => {});
  }, [ticket?.qrPayload, isOpen]);

  if (!isOpen || !ticket) return null;
  const isExpired = timeLeftSec <= 0 || ticket.status === 'EXPIRED';

  return (
    <div onClick={onClose} className="fixed inset-0 z-[180] bg-[#07090E]/85 backdrop-blur-md flex items-center justify-center p-3 text-xs text-[#F8FAFC]">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-[#0D1017] border border-white/15 p-4 sm:p-5 space-y-3.5 shadow-2xl text-center">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-xs">Téléchargement Exclusif Mobile</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20"><X className="w-3.5 h-3.5" /></button>
        </div>

        <div className="space-y-1">
          <p className="font-extrabold text-[#F8FAFC] truncate text-xs">{track.title} — {track.artist}</p>
          <p className="text-[10px] text-[#A3A9BA]">Scannez avec l’application mobile DROP du compte <strong className="text-emerald-300 font-mono">{currentUserId}</strong>.</p>
        </div>

        <div className="p-3 rounded-2xl bg-[#080A0F] border border-white/10 flex flex-col items-center justify-center gap-2 relative">
          <canvas ref={canvasRef} className={`rounded-xl ${isExpired ? 'opacity-20 blur-xs' : ''}`} />
          {isExpired && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[#080A0F]/80 rounded-2xl">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
              <span className="text-[11px] font-bold text-rose-300">QR Code Expiré</span>
              <button type="button" onClick={initTicket} className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#080A0F] font-extrabold text-[10px] cursor-pointer flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Nouveau QR</button>
            </div>
          )}
          {ticket.status === 'CONFIRMED' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[#080A0F]/90 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">Téléchargement Réussi</span>
              <span className="text-[10px] text-[#A3A9BA]">Stockage Privé Mobile • {ticket.selectedQuality === 'HIGH' ? 'Haute Qualité (256k)' : 'Standard (128k)'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] px-1">
          <span className="text-[#A3A9BA]">Expiration : <strong className="font-mono text-amber-400">{timeLeftSec}s</strong></span>
          <span className="text-emerald-400 font-mono font-bold text-[10px] flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Usage Unique</span>
        </div>

        <button
          type="button"
          onClick={() => setIsSimulatorOpen(true)}
          className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-amber-300 cursor-pointer transition flex items-center justify-center gap-1.5"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Simuler le Scan Mobile (Test Dev)</span>
        </button>
      </div>

      <MobileDownloadSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        ticket={ticket}
        currentUserId={currentUserId}
        onTicketUpdated={(updated) => {
          setTicket(updated);
          if (onDownloadConfirmed) onDownloadConfirmed(updated);
        }}
        onToast={onToast}
      />
    </div>
  );
};
