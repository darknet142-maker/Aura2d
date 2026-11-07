import React, { useState, useMemo } from 'react';
import { Compass, Heart, MessageCircle, Play, Repeat, Radio, ChevronRight } from 'lucide-react';
import { RankBadgeSvg } from '../../../components/ReusableAnalyticsSheets';
import type { CommunityMemberCompleteStats, ScoutLeaderboardDimension } from '../services/community-scouts-leaderboard.service';

export interface ScoutsLeaderboardPanelProps {
  members: CommunityMemberCompleteStats[];
  currentUserId?: string;
  onOpenUserProfile: (userId: string) => void;
}

const DIMENSION_TABS: {
  id: ScoutLeaderboardDimension;
  label: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'SCOUTS', label: 'Éclaireurs (Recos)', unit: 'recos', icon: Compass },
  { id: 'LIKES', label: 'Meilleurs Likes', unit: 'likes', icon: Heart },
  { id: 'COMMENTS', label: 'Commentaires', unit: 'avis', icon: MessageCircle },
  { id: 'PLAYS', label: 'Écoutes', unit: 'écoutes', icon: Play },
  { id: 'LOOPS', label: 'Boucles', unit: 'boucles', icon: Repeat },
  { id: 'DISCOVERIES', label: 'Découvertes', unit: 'découvertes', icon: Radio },
];

export const ScoutsLeaderboardPanel: React.FC<ScoutsLeaderboardPanelProps> = ({
  members, currentUserId, onOpenUserProfile,
}) => {
  const [dimension, setDimension] = useState<ScoutLeaderboardDimension>('SCOUTS');

  const sorted = useMemo(
    () => [...members].sort((a, b) => a.ranks[dimension] - b.ranks[dimension]),
    [members, dimension]
  );

  const ownEntry = useMemo(
    () => sorted.find((m) => m.userId === currentUserId) ?? null,
    [sorted, currentUserId]
  );

  const activeSpec = DIMENSION_TABS.find((d) => d.id === dimension) || DIMENSION_TABS[0];

  const primaryValue = (m: CommunityMemberCompleteStats): number => {
    if (dimension === 'SCOUTS') return m.recommendationsCount;
    if (dimension === 'LIKES') return m.totalLikesGiven;
    if (dimension === 'COMMENTS') return m.commentsCount;
    if (dimension === 'PLAYS') return m.totalPlays;
    if (dimension === 'LOOPS') return m.totalLoops;
    return m.discoveriesGenerated;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {DIMENSION_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id} type="button" onClick={() => setDimension(id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
              dimension === id ? 'bg-[#DE1B34] text-white' : 'bg-[#0D1017] border border-white/10 text-[#A3A9BA] hover:text-[#F8FAFC]'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {ownEntry && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-amber-400/12 border border-amber-400/35">
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-[#F8FAFC] truncate">
              Votre rang actuel : <span className="text-amber-300">#{ownEntry.ranks[dimension]}</span> en {activeSpec.label}
            </p>
            <p className="text-[11px] text-[#A3A9BA] truncate tabular-nums">
              {ownEntry.recommendationsCount} recos • {ownEntry.totalLikesGiven} likes • {ownEntry.totalPlays} écoutes • {ownEntry.totalLoops} boucles
            </p>
          </div>
          <button
            type="button" onClick={() => onOpenUserProfile(ownEntry.userId)}
            className="px-3 py-1.5 rounded-xl bg-amber-400 text-[#080A0F] text-xs font-extrabold shrink-0 cursor-pointer"
          >
            Mon profil
          </button>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((member, idx) => {
          const isMe = member.userId === currentUserId;
          return (
            <button
              key={member.userId} type="button" onClick={() => onOpenUserProfile(member.userId)}
              className={`w-full flex items-center justify-between gap-2.5 p-3 rounded-2xl border text-left transition cursor-pointer ${
                isMe ? 'bg-[#131722] border-amber-400/45' : 'bg-[#080A0F]/90 hover:bg-[#131722] border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <RankBadgeSvg rank={idx + 1} delta={0} />
                <div className="w-10 h-10 rounded-full bg-[#131722] border border-white/15 text-xs font-bold text-[#F8FAFC] flex items-center justify-center shrink-0">
                  {member.user.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-[#F8FAFC] truncate">{member.user.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[9.5px] font-bold text-emerald-300 shrink-0">
                      {member.scoutBadgeLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A3A9BA] truncate tabular-nums">
                    {member.totalPlays} écoutes • {member.totalLoops} boucles • {member.recommendationsCount} recos
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-xl bg-[#131722] border border-white/12 font-mono text-xs font-extrabold text-amber-300 tabular-nums">
                  {primaryValue(member)} {activeSpec.unit}
                </span>
                <ChevronRight className="w-4 h-4 text-[#A3A9BA] shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

