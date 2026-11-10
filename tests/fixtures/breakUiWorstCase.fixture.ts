import type { AlbumNode } from '../../src/shared/types/domain.types';

/**
 * Fixture de test pour le protocole `break-ui` (Emil Kowalski & Impeccable)
 * Utilisé exclusivement dans les scripts d'audit et tests de régression QA :
 * - Titres d'œuvres et d'albums de 80 à 96 caractères
 * - Pochettes manquantes (`cover: ""`) pour éprouver le fallback SVG/typographique local
 * - Noms d'artistes, labels et featurings composés très longs
 * - Compteurs d'écoutes extrêmes (98M+ ECG) et valeurs unitaires (1 écoute)
 */
export function buildBreakUiWorstCaseCatalogue(baseCatalogue: AlbumNode[] = []): AlbumNode[] {
  return baseCatalogue.map((alb, aIdx) => {
    if (aIdx === 0) {
      return {
        ...alb,
        albumTitle:
          'Symphonie Électro-Acoustique des Estuaires du Komo & des Monts de Cristal — Édition Master -14 LUFS',
        artist: 'Collectif Philharmonique Bantou-Urbain de Libreville & Port-Gentil (+241)',
        tracks: (alb.tracks || []).map((t, tIdx) => ({
          ...t,
          title:
            tIdx === 0
              ? 'Chroniques Nocturnes du Boulevard Triomphal & des Plages de la Sablière (Version Intégrale Studio 2026)'
              : `${t.title} — Remasterisation Analytique Haute-Fidélité Sans Perte (-14.0 LUFS Broadcast Gabon)`,
          artist:
            tIdx === 0
              ? 'Jean-Baptiste Ndong-Mba & L’Orchestre National Polyphonique de l’Ogooué'
              : t.artist,
          featuringArtists: [
            'Aleksandra Wiśniewska-Obame',
            'Collectif Tambours Sacrés de Franceville',
            'Maître Kvnz-808',
          ],
          album:
            'Symphonie Électro-Acoustique des Estuaires du Komo & des Monts de Cristal — Édition Master -14 LUFS',
          labelName:
            'Consortium Phonographique International d’Afrique Centrale & de l’Estuaire (CPIACE +241)',
          cover: '', // Image volontairement manquante pour valider le placeholder visuel SVG/textuel local
          artworkType: undefined,
          realPlays: tIdx === 0 ? 98450210 : 1,
          displayPlaysFormatted: undefined,
        })),
      };
    }

    if (aIdx === 1) {
      return {
        ...alb,
        albumTitle:
          'Anthologie Contemporaine des Rythmes Ntcham, Ikokou & Afro-Fusion du Grand Libreville (Vol. IV)',
        tracks: (alb.tracks || []).map((t, tIdx) => ({
          ...t,
          title:
            tIdx === 0
              ? 'Résonance Magnétique Sous-Marine du Cap Esterias au Crépuscule Équatorial (Session Live Acoustique)'
              : t.title,
          cover: tIdx === 0 ? '' : t.cover,
          artworkType: tIdx === 0 ? undefined : t.artworkType,
          realPlays: tIdx === 0 ? 14892340 : t.realPlays,
          displayPlaysFormatted: undefined,
        })),
      };
    }

    return alb;
  });
}

