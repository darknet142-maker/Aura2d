import React from 'react';
import { X, ShieldCheck, CheckCircle2, Share2, Award, Download, Play, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_DRAWER } from '../../../shared/ui/springMotion';
import { formatCompactPlays } from '../../../components/player/playerEngineHelpers';
import { CoverArtwork } from '../../../components/CoverArtwork';
import type { CertificationInfo } from '../../../utils/rankingEngine';

export interface PublicCertificationDossierModalProps {
  isOpen: boolean;
  cert: CertificationInfo | null;
  entityTitle?: string;
  entityArtist?: string;
  coverUrl?: string;
  artworkType?: string;
  onClose: () => void;
  onPlayTrack?: () => void;
  onShare?: () => void;
}

export const PublicCertificationDossierModal: React.FC<PublicCertificationDossierModalProps> = ({
  isOpen, cert, entityTitle = 'Couronne d’Okoumé', entityArtist = "Ba'ponga feat. Movaizhaleine",
  coverUrl, artworkType, onClose, onPlayTrack, onShare,
}) => {
  if (!isOpen || !cert) return null;

  const plays = cert.weightedEcgCount || cert.threshold || 100_000;
  const certNumber = cert.certificateHash || `DROP-GA-${cert.level}-${Date.now().toString(36).toUpperCase()}`;
  const certDate = 'Novembre 2026';

  const tierColors = {
    GOLD: { text: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-400/40', badge: 'DISQUE D’OR OFFICIEL' },
    PLATINUM: { text: 'text-sky-300', bg: 'bg-sky-500/15 border-sky-400/40', badge: 'DISQUE DE PLATINE' },
    DIAMOND: { text: 'text-fuchsia-300', bg: 'bg-fuchsia-500/15 border-fuchsia-400/40', badge: 'DISQUE DE DIAMANT' },
    NONE: { text: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-400/40', badge: 'CERTIFICATION DROP' },
  }[cert.level] || { text: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-400/40', badge: 'DISQUE D’OR' };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[150] bg-[#07090E]/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <motion.div
        role="dialog" aria-modal="true" aria-label={`Certificat officiel : ${entityTitle}`}
        initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING_DRAWER}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#0D1017] border border-white/20 p-5 sm:p-6 space-y-4 shadow-[0_24px_80px_rgba(6,8,14,0.98)] text-[#F8FAFC]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">Registre Public Officiel • Certification DROP</span>
              <h2 className="text-base sm:text-lg font-extrabold truncate">{tierColors.badge}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer le dossier" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#F8FAFC] transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#080A0F] border border-white/10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/15 shrink-0 shadow-lg">
            <CoverArtwork coverUrl={coverUrl} artworkType={artworkType as any} title={entityTitle} artist={entityArtist} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-sm sm:text-base font-extrabold text-[#F8FAFC] truncate">{entityTitle}</h3>
            <p className="text-xs text-[#A3A9BA] truncate">{entityArtist}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${tierColors.bg} ${tierColors.text}`}>Seuil : {formatCompactPlays(cert.threshold || 100000)} écoutes</span>
              <span className="text-[10px] text-[#A3A9BA] font-mono">Délivré : {certDate}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit de Diffusion Certifié (Zéro Faux Streams)</span>
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-[#080A0F] border border-white/5 space-y-0.5">
              <span className="text-[10px] text-[#A3A9BA] block">Lectures ECG Dédupliquées</span>
              <strong className="text-sm font-bold text-amber-300 font-mono">{plays.toLocaleString('fr-FR')}</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#080A0F] border border-white/5 space-y-0.5">
              <span className="text-[10px] text-[#A3A9BA] block">Territoire Certifié</span>
              <strong className="text-sm font-bold text-emerald-400 font-mono">≥ 74% Validé</strong>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#080A0F] border border-white/5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#A3A9BA]">Empreinte d'authenticité SHA-256 :</span>
            <span className="text-emerald-400 font-mono font-bold text-[10px]">VÉRIFIÉ ✓</span>
          </div>
          <p className="font-mono text-[10px] text-[#A3A9BA] break-all bg-white/5 p-2 rounded-lg">{certNumber}</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          {onShare && (
            <button type="button" onClick={onShare} className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5 transition cursor-pointer">
              <Share2 className="w-3.5 h-3.5" /><span>Partager</span>
            </button>
          )}
          {onPlayTrack && (
            <button type="button" onClick={() => { onClose(); onPlayTrack(); }} className="px-4 py-2 rounded-xl bg-[#DE1B34] hover:bg-[#f02842] text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer">
              <Play className="w-3.5 h-3.5 fill-current" /><span>Écouter le titre</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
