import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CoverArtwork } from '../CoverArtwork';
import { PlayerAlbumNode, PlayerTrackItem } from './types';

export interface PlayerCoverFlowProps {
  catalogue: PlayerAlbumNode[];
  albumIdx: number;
  trackIdx: number;
  currentTrack: PlayerTrackItem;
  onNavigateAlbum: (dir: 1 | -1) => void;
  onSelectAlbumIndex: (newAlbumIdx: number, newTrackIdx?: number, startFullPlay?: boolean) => void;
  onNavigateTrack: (dir: 1 | -1) => void;
  onSelectTrackIndex: (newTrackIdx: number) => void;
  onOpenActiveTrackSheet?: () => void;
  onToast?: (msg: string) => void;
  children?: React.ReactNode; // Optional lyrics overlay or extra overlay
}

export const PlayerCoverFlow: React.FC<PlayerCoverFlowProps> = ({
  catalogue,
  albumIdx,
  trackIdx,
  currentTrack,
  onNavigateAlbum,
  onSelectAlbumIndex,
  onNavigateTrack,
  onSelectTrackIndex,
  onOpenActiveTrackSheet,
  onToast,
  children,
}) => {
  const currentAlbum = catalogue[albumIdx] || catalogue[0];

  // Flat release sequence for full 3D CoverFlow carousel across all tracks
  const allCards = React.useMemo(() => {
    const list: {
      key: string;
      albumIndex: number;
      trackIndex: number;
      track: PlayerTrackItem;
      albumTitle: string;
    }[] = [];
    catalogue.forEach((alb, aIdx) => {
      alb.tracks.forEach((trk, tIdx) => {
        list.push({
          key: `${alb.id}-${trk.id}-${aIdx}-${tIdx}`,
          albumIndex: aIdx,
          trackIndex: tIdx,
          track: trk,
          albumTitle: alb.albumTitle,
        });
      });
    });
    return list;
  }, [catalogue]);

  const activeIndex = React.useMemo(() => {
    const found = allCards.findIndex((c) => c.track.id === currentTrack.id);
    if (found !== -1) return found;
    const byIndices = allCards.findIndex(
      (c) => c.albumIndex === albumIdx && c.trackIndex === trackIdx
    );
    return byIndices !== -1 ? byIndices : 0;
  }, [allCards, currentTrack.id, albumIdx, trackIdx]);

  // Gesture state
  const [isDragging, setIsDragging] = useState(false);
  const [dragAxis, setDragAxis] = useState<'NONE' | 'X' | 'Y'>('NONE');
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const [dragDeltaY, setDragDeltaY] = useState(0);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragMovedRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const pendingDeltaRef = useRef<{ x: number; y: number } | null>(null);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragAxis('NONE');
    setDragDeltaX(0);
    setDragDeltaY(0);
    dragMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    pendingDeltaRef.current = null;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if capture is not supported
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    pendingDeltaRef.current = { x: dx, y: dy };

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (!pendingDeltaRef.current) return;
        const curX = pendingDeltaRef.current.x;
        const curY = pendingDeltaRef.current.y;

        setDragAxis((prevAxis) => {
          let axis = prevAxis;
          if (axis === 'NONE') {
            if (Math.abs(curX) > 8 || Math.abs(curY) > 8) {
              axis = Math.abs(curX) >= Math.abs(curY) ? 'X' : 'Y';
              dragMovedRef.current = true;
            }
          }
          if (axis === 'X') {
            setDragDeltaX(curX);
          } else if (axis === 'Y') {
            setDragDeltaY(curY);
          }
          return axis;
        });
      });
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsDragging(false);

    const threshold = 40;
    if (dragAxis === 'X') {
      if (dragDeltaX < -threshold) {
        if (allCards.length > 1) {
          const nextIdx = (activeIndex + 1) % allCards.length;
          const target = allCards[nextIdx];
          onSelectAlbumIndex(target.albumIndex, target.trackIndex, true);
        } else {
          onNavigateAlbum(1);
        }
      } else if (dragDeltaX > threshold) {
        if (allCards.length > 1) {
          const prevIdx = (activeIndex - 1 + allCards.length) % allCards.length;
          const target = allCards[prevIdx];
          onSelectAlbumIndex(target.albumIndex, target.trackIndex, true);
        } else {
          onNavigateAlbum(-1);
        }
      }
    } else if (dragAxis === 'Y') {
      if (dragDeltaY < -threshold) {
        onNavigateTrack(1);
        onToast?.('Titre suivant de l’album');
      } else if (dragDeltaY > threshold) {
        onNavigateTrack(-1);
        onToast?.('Titre précédent de l’album');
      }
    }

    setDragAxis('NONE');
    setDragDeltaX(0);
    setDragDeltaY(0);
    dragStartRef.current = null;
    pendingDeltaRef.current = null;
  }, [dragAxis, dragDeltaX, dragDeltaY, allCards, activeIndex, onSelectAlbumIndex, onNavigateAlbum, onNavigateTrack, onToast]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 28) {
      if (allCards.length > 1) {
        const dir = e.deltaX > 0 ? 1 : -1;
        const targetIdx = (activeIndex + dir + allCards.length) % allCards.length;
        const target = allCards[targetIdx];
        onSelectAlbumIndex(target.albumIndex, target.trackIndex, true);
      } else {
        onNavigateAlbum(e.deltaX > 0 ? 1 : -1);
      }
    } else if (Math.abs(e.deltaY) > 35) {
      onNavigateTrack(e.deltaY > 0 ? 1 : -1);
    }
  }, [allCards, activeIndex, onSelectAlbumIndex, onNavigateAlbum, onNavigateTrack]);

  const dragOffsetRatio = dragAxis === 'X' ? dragDeltaX / 220 : 0;

  return (
    <section className="relative z-20 flex-1 min-h-0 flex flex-col justify-center">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className="carousel-stage touch-none"
        style={{ touchAction: 'none' }}
      >
        {allCards.map((card, idx) => {
          const isActiveCard = idx === activeIndex;
          const displayedTrack = isActiveCard ? currentTrack : card.track;

          const rawOffset = idx - activeIndex + dragOffsetRatio;
          const absOffset = Math.abs(rawOffset);

          // Hardware accelerated 3D transforms (compositor thread)
          const translateX = rawOffset * 108;
          const translateY =
            isActiveCard && dragAxis === 'Y'
              ? dragDeltaY * 0.42
              : absOffset * 6;
          const translateZ = -absOffset * 95;
          const rotateY = rawOffset * -22;
          const rotateZ = rawOffset * 2.5;
          const scale = Math.max(0.68, 1 - absOffset * 0.14);

          // Fast compositor-friendly visual tiers (no continuous GPU blur shader thrashing)
          const opacity =
            absOffset > 2.1
              ? 0
              : absOffset < 0.05
              ? 1
              : Math.max(0.25, 0.72 - Math.max(0, absOffset - 1) * 0.45);
          const zIndex = Math.round(30 - absOffset * 10);

          return (
            <div
              key={card.key}
              onClick={() => {
                if (dragMovedRef.current) return;
                if (!isActiveCard) {
                  onSelectAlbumIndex(card.albumIndex, card.trackIndex, true);
                } else {
                  onOpenActiveTrackSheet?.();
                }
              }}
              title={
                isActiveCard
                  ? `Inspecter « ${displayedTrack.title} » (Crédits Studio, Split Royalties & Paramètres)`
                  : `Écouter « ${card.track.title} » (${card.track.artist})`
              }
              style={{
                zIndex,
                opacity,
                transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                pointerEvents: absOffset > 1.5 ? 'none' : 'auto',
              }}
              className={`cover-card group cursor-pointer ${isDragging ? 'dragging' : ''}`}
            >
              <div className="cover-card-inner">
                {displayedTrack.isSponsoredAnnouncement ? (
                  <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-[#1A060A] via-[#0D1017] to-[#080A0F] p-4 flex flex-col justify-between text-left select-none border border-[#DE1B34]/30 rounded-2xl">
                    <div className="flex items-center justify-between z-10">
                      <span className="px-2.5 py-1 rounded-full bg-[#DE1B34] text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                        ✦ Annonce Sponsorisée
                      </span>
                      <span className="text-[10px] font-mono text-[#A3A9BA]">
                        DROP Broadcast
                      </span>
                    </div>

                    {displayedTrack.cover ? (
                      <div className="relative my-2 flex-1 rounded-xl overflow-hidden border border-white/10">
                        <img
                          src={displayedTrack.cover}
                          alt={displayedTrack.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F] via-transparent to-transparent opacity-80" />
                      </div>
                    ) : (
                      <div className="my-2 flex-1 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-3 text-center">
                        <div className="space-y-1">
                          <p className="text-sm font-black text-rose-400">
                            {displayedTrack.sponsoredCampaign?.brandName || displayedTrack.artist}
                          </p>
                          <p className="text-xs text-[#F8FAFC]">
                            {displayedTrack.sponsoredCampaign?.tagline || displayedTrack.title}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-1 z-10">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider truncate">
                          {displayedTrack.sponsoredCampaign?.brandName || displayedTrack.artist}
                        </span>
                        <p className="text-xs font-bold text-[#F8FAFC] line-clamp-2">
                          {displayedTrack.sponsoredCampaign?.tagline || displayedTrack.title}
                        </p>
                      </div>

                      <a
                        href={displayedTrack.sponsoredCampaign?.ctaUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2 px-3 rounded-xl bg-[#DE1B34] hover:bg-[#FF4D64] text-white font-extrabold text-xs text-center flex items-center justify-center gap-1.5 shadow-lg shadow-[#DE1B34]/30 transition cursor-pointer"
                      >
                        <span>{displayedTrack.sponsoredCampaign?.ctaText || 'Découvrir'}</span>
                        <span>→</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <CoverArtwork
                    artworkType={displayedTrack.artworkType}
                    coverUrl={displayedTrack.cover}
                    title={displayedTrack.title}
                    artist={displayedTrack.artist}
                  />
                )}
                <div className="cover-glare" />

                {isActiveCard && !displayedTrack.isSponsoredAnnouncement && onOpenActiveTrackSheet && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenActiveTrackSheet();
                    }}
                    className="absolute bottom-2.5 left-2.5 z-20 px-2.5 py-1 rounded-full bg-[#07090E]/75 hover:bg-[#07090E]/95 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-[#F8FAFC] hover:text-amber-300 flex items-center gap-1 shadow-lg transition-all"
                    title="Ouvrir la fiche analytique, les crédits studio et les paramètres du titre"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Fiche &amp; Crédits</span>
                  </button>
                )}

                {!isActiveCard && (
                  <div className="absolute inset-0 bg-[#07090E]/40 pointer-events-none transition-opacity duration-300" />
                )}

                {/* Track switcher indicator dots (min 44px tap zone) */}
                {isActiveCard && currentAlbum && currentAlbum.tracks.length > 1 && (
                  currentAlbum.tracks.length <= 8 ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5 py-2 px-1.5 rounded-full bg-[#07090E]/60 backdrop-blur-md border border-white/15">
                      {currentAlbum.tracks.map((t, tIdx) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTrackIndex(tIdx);
                          }}
                          aria-label={`Piste ${tIdx + 1}: ${t.title}`}
                          className={`min-w-[20px] min-h-[20px] flex items-center justify-center p-1 rounded-full transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400`}
                        >
                          <span
                            className={`w-1.5 rounded-full transition-all ${
                              tIdx === trackIdx
                                ? 'h-4 bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                                : 'h-1.5 bg-white/45 hover:bg-white/80'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 px-2 py-1 rounded-full bg-[#07090E]/75 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-amber-300 shadow-md">
                      {trackIdx + 1}/{currentAlbum.tracks.length}
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {children}
    </section>
  );
};

