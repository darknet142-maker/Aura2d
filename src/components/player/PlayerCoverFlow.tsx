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
  onToast,
  children,
}) => {
  const currentAlbum = catalogue[albumIdx] || catalogue[0];

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
        onNavigateAlbum(1);
      } else if (dragDeltaX > threshold) {
        onNavigateAlbum(-1);
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
  }, [dragAxis, dragDeltaX, dragDeltaY, onNavigateAlbum, onNavigateTrack, onToast]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 28) {
      onNavigateAlbum(e.deltaX > 0 ? 1 : -1);
    } else if (Math.abs(e.deltaY) > 35) {
      onNavigateTrack(e.deltaY > 0 ? 1 : -1);
    }
  }, [onNavigateAlbum, onNavigateTrack]);

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
        {catalogue.map((alb, idx) => {
          const isActiveCard = idx === albumIdx;
          const displayedTrack = isActiveCard ? currentTrack : alb.tracks[0];

          const rawOffset = idx - albumIdx + dragOffsetRatio;
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
              key={alb.id}
              onClick={() => {
                if (dragMovedRef.current) return;
                if (!isActiveCard) {
                  onSelectAlbumIndex(idx, 0, false);
                }
              }}
              style={{
                zIndex,
                opacity,
                transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                pointerEvents: absOffset > 1.5 ? 'none' : 'auto',
              }}
              className={`cover-card ${isDragging ? 'dragging' : ''}`}
            >
              <div className="cover-card-inner">
                <CoverArtwork
                  artworkType={displayedTrack.artworkType}
                  coverUrl={displayedTrack.cover}
                  title={displayedTrack.title}
                  artist={displayedTrack.artist}
                />
                <div className="cover-glare" />

                {!isActiveCard && (
                  <div className="absolute inset-0 bg-black/40 pointer-events-none transition-opacity duration-300" />
                )}

                {/* Track switcher indicator dots (min 44px tap zone) */}
                {isActiveCard && currentAlbum && currentAlbum.tracks.length > 1 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5 py-2 px-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15">
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

