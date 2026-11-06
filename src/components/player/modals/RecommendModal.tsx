import React, { useState } from 'react';
import { X, Video } from 'lucide-react';
import { CoverArtwork, DropOfficialLogo } from '../../CoverArtwork';
import { CertificationBadgeSvg } from '../../ReusableAnalyticsSheets';
import { CertificationInfo } from '../../../utils/rankingEngine';
import { PlayerTrackItem } from '../types';

export interface RecommendModalProps {
  isOpen: boolean;
  currentTrack: PlayerTrackItem;
  currentTrackCert: CertificationInfo;
  currentRecsCount: number;
  communityRecommendationsCount: number;
  onClose: () => void;
  onOpenTrendStudio: () => void;
  onPublishRecommendation: (note: string) => void;
  onViewFeed: () => void;
}

export const RecommendModal: React.FC<RecommendModalProps> = ({
  isOpen,
  currentTrack,
  currentTrackCert,
  currentRecsCount,
  communityRecommendationsCount,
  onClose,
  onOpenTrendStudio,
  onPublishRecommendation,
  onViewFeed,
}) => {
  const [recommendNote, setRecommendNote] = useState('');

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 bg-[#07090E]/80 backdrop-blur-md flex flex-col justify-end p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-zinc-900/95 border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <DropOfficialLogo className="h-4 w-auto max-w-[80px]" />
              <h2 className="text-base font-bold text-white">
                Recommander à la communauté
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Propulsez « {currentTrack.title} » dans le Fil Commun et boostez son score d&apos;explosion
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
            <CoverArtwork
              artworkType={currentTrack.artworkType}
              coverUrl={currentTrack.cover}
              title={currentTrack.title}
              artist={currentTrack.artist}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
            <p className="text-xs text-zinc-400 truncate">
              {currentTrack.artist} • {currentRecsCount} recommandations
            </p>
          </div>
          <CertificationBadgeSvg cert={currentTrackCert} compact />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Message ou pourquoi écouter ce titre (optionnel)
          </label>
          <input
            type="text"
            value={recommendNote}
            onChange={(e) => setRecommendNote(e.target.value)}
            placeholder="Ex: Le drop à 1:16 et le mix sont incroyables..."
            className="w-full bg-[#07090E]/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Bouton Rouge pour enregistrer une Vidéo Trend 30s */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenTrendStudio();
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#ff3b30] via-rose-600 to-[#e11d38] hover:brightness-110 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-[0_10px_30px_rgba(255,59,48,0.45)] transition active:scale-95"
        >
          <Video className="w-5 h-5 shrink-0 stroke-[2.2]" />
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span>
            Enregistrer une Vidéo Trend (30s • REC)
          </span>
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              onPublishRecommendation(
                recommendNote.trim() || 'Recommande fortement ce titre à la communauté DROP !'
              );
              setRecommendNote('');
            }}
            className="py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition shadow-[0_0_16px_rgba(251,191,36,0.35)]"
          >
            Publier dans le Fil DROP
          </button>
          <button
            type="button"
            onClick={onViewFeed}
            className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition"
          >
            Voir le Fil Commun ({communityRecommendationsCount})
          </button>
        </div>
      </div>
    </div>
  );
};
