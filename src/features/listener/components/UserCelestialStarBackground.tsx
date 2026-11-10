import React, { memo } from 'react';
import './UserCelestialStarBackground.css';

/**
 * Fond Céleste Étoilé Animé (Uiverse.io par amir_6539).
 * Défilement vertical infini multi-couches en parallaxe (GPU composite-only).
 * Réservé exclusivement à la section utilisateur (Lecteur immersif & Auth).
 */
export const UserCelestialStarBackground: React.FC = memo(() => {
  return (
    <div
      aria-hidden="true"
      className="celestial-star-container select-none pointer-events-none"
    >
      <div className="celestial-stars-stage">
        <div id="stars" />
        <div id="stars2" />
        <div id="stars3" />
        <div className="celestial-shooting-star" />
        <div className="celestial-shooting-star" />
        <div className="celestial-shooting-star" />
      </div>
    </div>
  );
});

UserCelestialStarBackground.displayName = 'UserCelestialStarBackground';

