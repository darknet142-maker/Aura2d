import React from 'react';
import { X, ChevronRight, ArrowUp, ArrowDown, Music } from 'lucide-react';
import { motion } from 'motion/react';
import { CoverArtwork } from '../../../components/CoverArtwork';
import { CertificationBadgeSvg } from '../../../components/ReusableAnalyticsSheets';
import {
  getAlbumCertification,
  getTrackCertification,
} from '../../../utils/rankingEngine';
import { triggerBeatAudioDownload } from '../../../services/musicService';
import type { AlbumNode } from '../../../shared/types/domain.types';
import { RankBadge } from '../../../shared/ui/RankBadge';
import { SPRING_SNAPPY, SUBTLE_ENTRANCE_VARIANTS } from '../../../shared/ui/springMotion';
import { ensureTrackSurgicalAnalysis } from '../../music-intelligence';

export interface AdminCatalogueRepertoireProps {
  catalogue: AlbumNode[];
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  onAutoReorderByAlgo: () => void;
  onSaveAndSyncAll: (sectionLabel?: string) => void;
  onSelectArtist: (artistName: string) => void;
  onMoveAlbumOrder: (idx: number, dir: -1 | 1) => void;
  onSelectTrack: (trackId: string) => void;
  trackRankMap: Record<string, { rank: number; delta: number }>;
}

export const AdminCatalogueRepertoire: React.FC<
  AdminCatalogueRepertoireProps
> = ({
  catalogue,
  searchQuery,
  setSearchQuery,
  onAutoReorderByAlgo,
  onSaveAndSyncAll,
  onSelectArtist,
  onMoveAlbumOrder,
  onSelectTrack,
  trackRankMap,
}) => {
  const normSearch = (s: string) =>
    (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const q = normSearch(searchQuery.trim());

  return (
    <motion.div
      variants={SUBTLE_ENTRANCE_VARIANTS}
      initial="initial"
      animate="animate"
      className="w-full flex flex-col gap-2.5"
    >
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-2 items-center">
        <div className="relative lg:col-span-7 min-w-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Recherche instantanée dès la 1re lettre (Titre, Artiste, Beatmaker, Ingé, Parolier, Genre, DROP-CID)..."
            className="w-full bg-[#0D1017] border border-white/[0.12] rounded-xl pl-3 pr-8 py-2.5 text-xs text-[#F8FAFC] placeholder:text-[#A3A9BA]/70 focus:outline-none focus:border-[#DE1B34]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A3A9BA] hover:text-white"
              aria-label="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="lg:col-span-5 grid grid-cols-2 gap-2">
          <motion.button
            type="button"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_SNAPPY}
            onClick={onAutoReorderByAlgo}
            className="px-3 py-2.5 rounded-xl bg-[#0D1017] hover:bg-[#131722] border border-white/15 text-[#F8FAFC] text-xs font-bold cursor-pointer truncate"
          >
            Trier 2D (Score Algo)
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_SNAPPY}
            onClick={() =>
              onSaveAndSyncAll('Ordre 2D & Catalogue des Pistes')
            }
            className="px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#080A0F] text-xs font-extrabold cursor-pointer truncate"
          >
            Sauvegarder Catalogue
          </motion.button>
        </div>
      </div>

      {catalogue.map((alb, aIdx) => {
        const filteredTracks = alb.tracks.filter((t) => {
          if (!q) return true;
          return (
            normSearch(t.title).includes(q) ||
            normSearch(t.artist).includes(q) ||
            normSearch(t.category).includes(q) ||
            normSearch(t.album).includes(q) ||
            normSearch(t.beatmakerName).includes(q) ||
            normSearch(t.soundEngineerName).includes(q) ||
            normSearch(t.lyricistName).includes(q) ||
            normSearch(t.labelName).includes(q) ||
            normSearch(t.dropContentId || '').includes(q) ||
            (t.featuringArtists || []).some((f) => normSearch(f).includes(q))
          );
        });
        if (filteredTracks.length === 0) return null;

        const albumPlays = alb.tracks.reduce(
          (acc, tr) => acc + tr.realPlays,
          0
        );
        const albCert = getAlbumCertification(albumPlays);

        return (
          <div
            key={alb.id}
            className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl p-3 flex flex-col gap-2 shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]"
          >
            <div className="w-full flex items-center justify-between gap-2 pb-1.5 border-b border-white/[0.08]">
              <button
                type="button"
                onClick={() => onSelectArtist(alb.artist)}
                className="min-w-0 flex-1 flex items-center gap-2 text-left group"
              >
                <span className="px-1.5 py-0.5 rounded bg-[#DE1B34]/15 text-[#FF4D64] font-mono text-[10px] font-bold shrink-0">
                  X:{aIdx + 1}
                </span>
                <span className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#FF4D64] truncate">
                  {alb.artist}
                </span>
                <span className="hidden md:inline text-[11px] font-mono text-[#A3A9BA] truncate max-w-[320px]">
                  — {alb.albumTitle}
                </span>
                <CertificationBadgeSvg cert={albCert} compact />
                <ChevronRight className="w-3.5 h-3.5 text-[#A3A9BA] shrink-0" />
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onMoveAlbumOrder(aIdx, -1)}
                  disabled={aIdx === 0}
                  aria-label="Monter l'album"
                  className="p-1.5 rounded bg-[#07090E] border border-white/[0.08] text-[#A3A9BA] hover:text-white disabled:opacity-30"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveAlbumOrder(aIdx, 1)}
                  disabled={aIdx === catalogue.length - 1}
                  aria-label="Descendre l'album"
                  className="p-1.5 rounded bg-[#07090E] border border-white/[0.08] text-[#A3A9BA] hover:text-white disabled:opacity-30"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="w-full flex flex-col gap-1.5">
              {filteredTracks.map((t) => {
                const rInfo = trackRankMap[t.id] || { rank: 1, delta: 0 };
                const tCert = getTrackCertification(t.realPlays);
                const isBeat =
                  t.isInstrumental ||
                  t.isBeatDownloadable ||
                  t.category === 'Beats & Instrumentales';
                return (
                  <motion.div
                    key={t.id}
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.992 }}
                    transition={SPRING_SNAPPY}
                    onClick={() => onSelectTrack(t.id)}
                    className="w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#07090E] border border-white/[0.08] hover:border-[#DE1B34]/45 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-lg overflow-hidden cover-card-bevel cover-gloss-sheen shrink-0">
                        <CoverArtwork
                          artworkType={t.artworkType}
                          coverUrl={t.cover}
                          title={t.title}
                          artist={t.artist}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-[#F8FAFC] truncate">
                            {t.title}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <CertificationBadgeSvg cert={tCert} compact />
                            {isBeat && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[9px] font-mono font-bold">
                                BEAT • {t.bpm} BPM
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-[11px] text-[#A3A9BA] truncate mt-0.5 flex items-center gap-1.5">
                          <span className="truncate">
                            {t.artist}
                            {t.featuringArtists && t.featuringArtists.length > 0
                              ? ` feat. ${t.featuringArtists.join(', ')}`
                              : ''}{' '}
                            • {t.category}
                          </span>
                          <span className="hidden sm:inline-flex px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.08] font-mono text-[9.5px] text-amber-300 shrink-0">
                            {t.bpm} BPM • {(t.trackAnalysis || ensureTrackSurgicalAnalysis(t)).confirmedKey || t.musicalKey || '8A'} • Énergie{' '}
                            {Math.round(((t.trackAnalysis || ensureTrackSurgicalAnalysis(t)).energy ?? 0.78) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isBeat && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerBeatAudioDownload({
                              id: t.id,
                              title: t.title,
                              artist: t.artist,
                              beatmakerName: t.beatmakerName,
                              bpm: t.bpm,
                              audioUrl: t.audioUrl,
                              duration: t.duration,
                            });
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/45 text-amber-200 text-[10px] font-mono font-bold transition"
                          title="Télécharger l'instrumentale"
                        >
                          ⬇ Beat
                        </button>
                      )}
                      <RankBadge rank={rInfo.rank} delta={rInfo.delta} />
                      <ChevronRight className="w-4 h-4 text-[#A3A9BA]" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {catalogue.length === 0 && (
        <div className="w-full p-8 rounded-2xl bg-[#0D1017] border border-white/[0.08] text-center space-y-3 font-mono">
          <div className="w-12 h-12 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#A3A9BA]">
            <Music className="w-5 h-5 text-emerald-400" />
          </div>
          <h4 className="text-sm font-bold text-[#F8FAFC]">Catalogue Initial Vide</h4>
          <p className="text-xs text-[#A3A9BA] max-w-md mx-auto">
            Aucun album n&apos;est actuellement chargé. Utilisez l&apos;Espace Studio pour téléverser et masteriser vos premières pistes réelles.
          </p>
        </div>
      )}
    </motion.div>
  );
};
