import React from 'react';
import { Compass, Heart, MessageCircle, Play, Repeat, Sparkles, Trash2, Clock, Trophy } from 'lucide-react';
import { CoverArtwork, RankMedalSvg } from '../../../components/CoverArtwork';
import type { CommunityMemberCompleteStats } from '../services/community-scouts-leaderboard.service';
import type { SocialTargetSubject } from '../types/social-feed.types';
import { formatRemaining4hLabel } from './ProfileQuotaCleanupModal';

export interface UserProfileSocialAndRanksCardProps {
  stats: CommunityMemberCompleteStats;
  isOwnProfile: boolean;
  maxProfileItems?: number;
  onDeleteStatus?: (statusId: string) => void;
  onDeletePost?: (postId: string) => void;
  onOpenTarget?: (target: SocialTargetSubject) => void;
  onOpenScoutsLeaderboard?: () => void;
}

export const UserProfileSocialAndRanksCard: React.FC<UserProfileSocialAndRanksCardProps> = ({
  stats, isOwnProfile, maxProfileItems = 10, onDeleteStatus, onDeletePost, onOpenTarget, onOpenScoutsLeaderboard,
}) => {
  const kpis = [
    { label: 'Écoutes', value: stats.totalPlays, icon: Play, accent: 'text-emerald-300' },
    { label: 'Boucles', value: stats.totalLoops, icon: Repeat, accent: 'text-amber-300' },
    { label: "J'aime", value: stats.totalLikesGiven, icon: Heart, accent: 'text-[#DE1B34]' },
    { label: 'Recommandations', value: stats.recommendationsCount, icon: Compass, accent: 'text-amber-300' },
    { label: 'Commentaires', value: stats.commentsCount, icon: MessageCircle, accent: 'text-sky-300' },
    { label: 'Découvertes', value: stats.discoveriesGenerated, icon: Sparkles, accent: 'text-emerald-300' },
  ];

  const rankBadges = [
    { label: 'Éclaireurs', rank: stats.ranks.SCOUTS },
    { label: 'Likes', rank: stats.ranks.LIKES },
    { label: 'Commentaires', rank: stats.ranks.COMMENTS },
    { label: 'Écoutes', rank: stats.ranks.PLAYS },
    { label: 'Boucles', rank: stats.ranks.LOOPS },
  ];

  return (
    <div className="space-y-3">
      {/* Bilan avancé d'activité (Écoutes, Boucles, Likes, Recommandations, Commentaires, Découvertes) */}
      <div className="rounded-2xl bg-[#080A0F] border border-white/10 p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-extrabold text-[#F8FAFC] truncate">Bilan d&apos;activité &amp; Éclaireur</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 shrink-0">
              {stats.scoutBadgeLabel}
            </span>
          </div>
          {onOpenScoutsLeaderboard && (
            <button type="button" onClick={onOpenScoutsLeaderboard} className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:underline shrink-0 cursor-pointer">
              <Trophy className="w-3.5 h-3.5 shrink-0" /><span>Classement Éclaireurs →</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {kpis.map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="rounded-xl bg-[#131722] border border-white/[0.07] p-2.5 flex flex-col justify-between gap-1 min-w-0">
              <Icon className={`w-3.5 h-3.5 shrink-0 ${accent}`} />
              <span className="text-sm font-mono font-extrabold text-[#F8FAFC] tabular-nums truncate">{value}</span>
              <span className="text-[10px] text-[#A3A9BA] truncate">{label}</span>
            </div>
          ))}
        </div>

        {/* Rangs personnels dans les classements communautaires */}
        <div className="pt-2 border-t border-white/[0.07] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {rankBadges.map((b) => (
            <div key={b.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0D1017] border border-white/10 shrink-0">
              <RankMedalSvg rank={b.rank} className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-mono font-bold text-amber-300 tabular-nums">#{b.rank}</span>
              <span className="text-[11px] text-[#A3A9BA]">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Statuts actifs (4h) & Recommandations publiées (max 10 par profil) */}
      {(stats.activeStatuses.length > 0 || stats.publishedPosts.length > 0 || isOwnProfile) && (
        <div className="rounded-2xl bg-[#080A0F] border border-white/10 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#F8FAFC] truncate">
              Statuts (4h) &amp; Recommandations actives
            </span>
            <span className={`px-2 py-0.5 rounded-md font-mono text-[10.5px] font-bold shrink-0 ${stats.activeItemsCount >= maxProfileItems ? 'bg-[#DE1B34]/20 text-[#DE1B34] border border-[#DE1B34]/40' : 'bg-white/10 text-[#F8FAFC]'}`}>
              {stats.activeItemsCount} / {maxProfileItems}
            </span>
          </div>

          {stats.activeStatuses.length === 0 && stats.publishedPosts.length === 0 ? (
            <p className="text-xs text-[#A3A9BA]">Aucune recommandation ou statut actif en ce moment.</p>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
              {stats.activeStatuses.map((st) => (
                <div key={st.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#131722] border border-amber-400/25">
                  <button type="button" onClick={() => onOpenTarget?.(st.target)} className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0"><CoverArtwork artworkType={st.target.artworkType} coverUrl={st.target.cover} title={st.target.title} artist={st.target.entityName} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#F8FAFC] truncate">{st.target.title}</p>
                      <p className="text-[10px] text-amber-300 inline-flex items-center gap-1 truncate"><Clock className="w-2.5 h-2.5 shrink-0" />Statut • {formatRemaining4hLabel(st.expiresAtIso)}</p>
                    </div>
                  </button>
                  {isOwnProfile && onDeleteStatus && (
                    <button type="button" onClick={() => onDeleteStatus(st.id)} aria-label="Supprimer ce statut" className="p-1.5 rounded-lg bg-[#DE1B34]/20 hover:bg-[#DE1B34] text-[#F8FAFC] shrink-0 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
              {stats.publishedPosts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#131722] border border-white/[0.07]">
                  <button type="button" onClick={() => onOpenTarget?.(p.target)} className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0"><CoverArtwork artworkType={p.target.artworkType} coverUrl={p.target.cover} title={p.target.title} artist={p.target.entityName} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#F8FAFC] truncate">{p.target.title}</p>
                      <p className="text-[10.5px] text-[#A3A9BA] truncate">{p.caption}</p>
                    </div>
                  </button>
                  {isOwnProfile && onDeletePost && (
                    <button type="button" onClick={() => onDeletePost(p.id)} aria-label="Supprimer cette recommandation" className="p-1.5 rounded-lg bg-[#DE1B34]/20 hover:bg-[#DE1B34] text-[#F8FAFC] shrink-0 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

