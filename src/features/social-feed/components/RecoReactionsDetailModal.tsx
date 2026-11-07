import React, { useState } from 'react';
import { X, Trophy, Flame, Heart, Repeat, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_DRAWER } from '../../../shared/ui/springMotion';
import { formatCompactPlays } from '../../../components/player/playerEngineHelpers';
import type { SocialFeedPost } from '../types/social-feed.types';

export type ReactionDetailTab = 'HEART' | 'REDROP' | 'TROPHY' | 'FLAME' | 'VIEWS';

export interface RecoReactionsDetailModalProps {
  isOpen: boolean;
  initialTab?: ReactionDetailTab;
  post: SocialFeedPost | null;
  trackPlays?: number;
  onClose: () => void;
  onOpenUserProfile: (userId: string) => void;
}

const TABS: { id: ReactionDetailTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'HEART', label: "J'aime", icon: Heart },
  { id: 'REDROP', label: 'Re-Drops', icon: Repeat },
  { id: 'TROPHY', label: 'Points', icon: Trophy },
  { id: 'FLAME', label: 'Vélocité', icon: Flame },
  { id: 'VIEWS', label: 'Portée', icon: Eye },
];

export const RecoReactionsDetailModal: React.FC<RecoReactionsDetailModalProps> = ({
  isOpen, initialTab = 'HEART', post, trackPlays = 100_500, onClose, onOpenUserProfile,
}) => {
  const [activeTab, setActiveTab] = useState<ReactionDetailTab>(initialTab);
  if (!isOpen || !post) return null;

  const likesCount = post.likedByUserIds.length;
  const reDropsCount = post.reDroppedByUserIds.length;
  const uniqueViews = Math.max(trackPlays, (likesCount + reDropsCount + 1) * 42 + 12_400);

  return (
    <div onClick={onClose} className="fixed inset-0 z-[140] bg-[#07090E]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        role="dialog" aria-modal="true" aria-label="Détails d'impact et réactions"
        initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING_DRAWER}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0D1017] border border-white/15 p-4 sm:p-5 space-y-3.5 shadow-[0_24px_70px_rgba(6,8,14,0.95)]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#F8FAFC] truncate">Impact & Réactions de la recommandation</h3>
            <p className="text-[11px] text-[#A3A9BA] truncate">« {post.target.title} » • {post.target.entityName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-8 h-8 rounded-full bg-white/10 text-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id} type="button" onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeTab === id ? 'bg-amber-400 text-[#080A0F]' : 'bg-[#080A0F] border border-white/10 text-[#A3A9BA] hover:text-[#F8FAFC]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" /><span>{label}</span>
            </button>
          ))}
        </div>

        <div className="min-h-[170px] max-h-[280px] overflow-y-auto pr-1 space-y-2 text-xs">
          {activeTab === 'HEART' && (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-[#080A0F] border border-white/10 flex items-center justify-between">
                <span className="text-[#A3A9BA]">Total mentions J'aime</span>
                <span className="font-bold text-rose-400 font-mono">{likesCount} auditeurs</span>
              </div>
              {likesCount === 0 ? (
                <p className="text-[#A3A9BA] text-center py-6">Aucun J'aime pour l'instant. Soyez le premier à soutenir l'artiste !</p>
              ) : (
                post.likedByUserIds.map((uId) => (
                  <button key={uId} type="button" onClick={() => { onClose(); onOpenUserProfile(uId); }} className="w-full p-2.5 rounded-xl bg-[#080A0F] border border-white/5 flex items-center justify-between text-left hover:border-amber-400/40 cursor-pointer">
                    <span className="font-bold text-[#F8FAFC]">{uId === 'u-guest' ? 'Vous' : `Mélomane ${uId.slice(0, 6)}`}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">+0.25 pt</span>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === 'REDROP' && (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-[#080A0F] border border-white/10 flex items-center justify-between">
                <span className="text-[#A3A9BA]">Relais et Re-Drops</span>
                <span className="font-bold text-emerald-400 font-mono">{reDropsCount} partages</span>
              </div>
              {reDropsCount === 0 ? (
                <p className="text-[#A3A9BA] text-center py-6">Aucun re-drop enregistré. Partagez pour propulser ce titre dans les tendances.</p>
              ) : (
                post.reDroppedByUserIds.map((uId) => (
                  <button key={uId} type="button" onClick={() => { onClose(); onOpenUserProfile(uId); }} className="w-full p-2.5 rounded-xl bg-[#080A0F] border border-white/5 flex items-center justify-between text-left hover:border-emerald-400/40 cursor-pointer">
                    <span className="font-bold text-[#F8FAFC]">{uId === 'u-guest' ? 'Vous' : `Éclaireur ${uId.slice(0, 6)}`}</span>
                    <span className="text-[10px] text-amber-300 font-mono">+0.35 pt</span>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === 'TROPHY' && (
            <div className="p-3.5 rounded-2xl bg-[#080A0F] border border-amber-400/20 space-y-2">
              <div className="flex items-center justify-between"><span className="text-[#A3A9BA]">Impact communautaire généré :</span><span className="font-mono font-bold text-amber-300">Rayonnement Éclaireur</span></div>
              <div className="space-y-1 text-[11px] text-[#A3A9BA] border-t border-white/10 pt-2"><p>• J&apos;aime : Soutien direct au profil artiste</p><p>• Re-drop : Relais viral vers de nouveaux auditeurs</p><p>• Commentaire : Échange et valorisation de l&apos;œuvre</p></div>
            </div>
          )}

          {activeTab === 'FLAME' && (
            <div className="p-3.5 rounded-2xl bg-[#080A0F] border border-rose-500/20 space-y-2">
              <div className="flex items-center justify-between"><span className="text-[#A3A9BA]">Vélocité horaire :</span><span className="font-mono font-bold text-[#DE1B34]">+340 écoutes / h</span></div>
              <div className="flex items-center justify-between"><span className="text-[#A3A9BA]">Zone N°1 :</span><span className="font-bold text-[#F8FAFC]">Libreville</span></div>
            </div>
          )}

          {activeTab === 'VIEWS' && (
            <div className="p-3.5 rounded-2xl bg-[#080A0F] border border-white/10 space-y-2">
              <div className="flex items-center justify-between"><span className="text-[#A3A9BA]">Portée comptes uniques :</span><span className="font-mono font-bold text-emerald-400 tabular-nums">{formatCompactPlays(uniqueViews)}</span></div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded-xl bg-white/5"><span className="text-[#A3A9BA] block">Audience Locale</span><strong className="text-[#F8FAFC]">74%</strong></div>
                <div className="p-2 rounded-xl bg-white/5"><span className="text-[#A3A9BA] block">Diaspora &amp; International</span><strong className="text-[#F8FAFC]">26%</strong></div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
