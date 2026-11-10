import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useDragControls } from 'motion/react';
import {
  Disc3,
  Compass,
  ListMusic,
  Mic2,
  Coins,
  Flame,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export interface AssistiveFloatingMenuProps {
  onNavigateCoverFlow: () => void;
  onNavigateCentral: () => void;
  onOpenQueue: () => void;
  onOpenLyrics: () => void;
  onNavigateMissions: () => void;
  onOpenTrendStudio: () => void;
  onOpenEq: () => void;
  onOpenAdmin: () => void;
  isPlaying?: boolean;
}

interface MenuOptionItem {
  id: string;
  index: number;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  accentColor: string;
}

export const AssistiveFloatingMenu: React.FC<AssistiveFloatingMenuProps> = ({
  onNavigateCoverFlow,
  onNavigateCentral,
  onOpenQueue,
  onOpenLyrics,
  onNavigateMissions,
  onOpenTrendStudio,
  onOpenEq,
  onOpenAdmin,
  isPlaying = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pointerStartPos = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Les 8 menus principaux hautement pertinents
  const menuOptions: MenuOptionItem[] = [
    {
      id: 'coverflow',
      index: 1,
      label: 'Lecteur 3D',
      icon: <Disc3 className={`svg-icon ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />,
      action: onNavigateCoverFlow,
      accentColor: '#DE1B34',
    },
    {
      id: 'central',
      index: 2,
      label: 'DROP Central',
      icon: <Compass className="svg-icon" />,
      action: onNavigateCentral,
      accentColor: '#F59E0B',
    },
    {
      id: 'queue',
      index: 3,
      label: "File d'attente",
      icon: <ListMusic className="svg-icon" />,
      action: onOpenQueue,
      accentColor: '#06B6D4',
    },
    {
      id: 'lyrics',
      index: 4,
      label: 'Paroles Karaoké',
      icon: <Mic2 className="svg-icon" />,
      action: onOpenLyrics,
      accentColor: '#10B981',
    },
    {
      id: 'missions',
      index: 5,
      label: 'Missions & Jetons',
      icon: <Coins className="svg-icon" />,
      action: onNavigateMissions,
      accentColor: '#F59E0B',
    },
    {
      id: 'trends',
      index: 6,
      label: 'Trends Vidéo 30s',
      icon: <Flame className="svg-icon" />,
      action: onOpenTrendStudio,
      accentColor: '#DE1B34',
    },
    {
      id: 'eq',
      index: 7,
      label: 'Mastering & EQ',
      icon: <Sliders className="svg-icon" />,
      action: onOpenEq,
      accentColor: '#8B5CF6',
    },
    {
      id: 'admin',
      index: 8,
      label: 'Tour de Contrôle',
      icon: <ShieldCheck className="svg-icon" />,
      action: onOpenAdmin,
      accentColor: '#EC4899',
    },
  ];

  // Fermeture via touche Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartPos.current) {
      const distance = Math.hypot(
        e.clientX - pointerStartPos.current.x,
        e.clientY - pointerStartPos.current.y
      );
      if (distance > 5) {
        didDragRef.current = true;
      }
    }
  };

  const handleToggleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setIsOpen((prev) => !prev);
  }, []);

  const handleOptionClick = useCallback(
    (action: () => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      action();
      setIsOpen(false);
    },
    []
  );

  return (
    <>
      {/* Backdrop invisible pour fermer le menu au clic extérieur */}
      {isOpen && (
        <div
          className="assistive-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Conteneur déplaçable sur tout l'écran style iPhone AssistiveTouch */}
      <motion.div
        ref={containerRef}
        drag
        dragMomentum={false}
        dragElastic={0.08}
        dragControls={dragControls}
        whileDrag={{ scale: 1.05 }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="fixed z-[9999] pointer-events-auto touch-none"
        style={{
          bottom: '88px',
          right: '24px',
        }}
        initial={false}
        role="navigation"
        aria-label="Accès rapide AssistiveTouch DROP"
      >
        <div
          className={`assistive-menu-container ${isOpen ? 'is-open' : ''}`}
          style={{ '--options': menuOptions.length } as React.CSSProperties}
        >
          {/* Anneau de fond circulaire déployable */}
          <div className="assistive-menu-ring" />

          {/* Halo lumineux conique orienté vers l'option active */}
          <div className="assistive-selector-light" />

          {/* Bouton Central Déclencheur avec animation de morphing SVG */}
          <button
            type="button"
            onClick={handleToggleClick}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Fermer le menu rapide' : 'Ouvrir le menu rapide'}
            className="assistive-btn group"
            title="Menu d'accès rapide (déplaçable)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="assistive-btn-svg"
            >
              <path className="morph-line top" d="M4 7 L20 7" />
              <path className="morph-line middle" d="M4 12 L20 12" />
              <path className="morph-line bottom" d="M4 17 L20 17" />
            </svg>
          </button>

          {/* Couronne circulaire des 8 options */}
          <div className="assistive-options" role="menu">
            {menuOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="menuitem"
                onClick={handleOptionClick(opt.action)}
                className="assistive-option"
                style={
                  {
                    '--i': opt.index,
                    '--col-accent': opt.accentColor,
                  } as React.CSSProperties
                }
                title={opt.label}
              >
                <span className="option-inner" data-tooltip={opt.label}>
                  {opt.icon}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
};

