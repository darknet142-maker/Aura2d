import type { CommunityRecommendationItem } from '../utils/rankingEngine';
import type { AppNotification } from '../shared/types/domain.types';

export const INITIAL_ARTIST_SUBSCRIBERS: Record<string, number> = {
  "Emma'a": 48200,
  "Ba'ponga": 62400,
  "L'Oiseau Rare": 54800,
  "Shan'L": 51500,
  'Pierre Akendengué': 36900,
  Eboloko: 29400,
  'Ng Bling': 31200,
  Movaizhaleine: 44900,
  'Kôba Building': 38800,
  Creol: 34700,
  'Arielle T': 28200,
  'Annie Flore Batchiellilys': 33400,
  'Vicky R': 24100,
};

export const INITIAL_COMMUNITY_RECOMMENDATIONS: CommunityRecommendationItem[] = [
  {
    id: 'rec-init-1',
    trackId: 't-301',
    trackTitle: "Couronne d'Okoumé",
    trackArtist: "Ba'ponga feat. Movaizhaleine, Kôba Building",
    trackCategory: 'Rap Gabonais',
    cover: '',
    artworkType: 'pastel_heart',
    userId: 'u-3',
    userName: 'Inès Mba-Mintsa',
    userAvatar: 'IM',
    commentOrLyricExcerpt:
      '« [DROP] Trois décennies de plume gravées dans le marbre de Libreville » — Plume Externe x1.25 & Mix -14 LUFS !',
    isLyricExcerpt: true,
    lyricistName: 'Movaizhaleine & Edgar Nguema',
    createdAt: 'il y a 3 min',
    boostPoints: 0.45,
  },
  {
    id: 'rec-init-2',
    trackId: 't-main-1',
    trackTitle: 'Lumières du Bord de Mer',
    trackArtist: "Emma'a feat. Eboloko",
    trackCategory: 'Afrobeats / Afro-Pop',
    cover: '',
    artworkType: 'creative_yellow',
    userId: 'u-1',
    userName: 'Camille Ndong',
    userAvatar: 'CN',
    commentOrLyricExcerpt:
      'Duo Co-Lead 50/50 certifié Single de Diamant (580K ECG) ! Le refrain à 1:16 est magique.',
    isLyricExcerpt: false,
    createdAt: 'il y a 11 min',
    boostPoints: 0.35,
  },
  {
    id: 'rec-init-3',
    trackId: 't-101',
    trackTitle: 'Souverain du Komo',
    trackArtist: "L'Oiseau Rare feat. Ng Bling",
    trackCategory: 'Ntcham',
    cover: '',
    artworkType: 'crimson_bloom',
    userId: 'u-2',
    userName: 'Marc-Arthur Obiang',
    userAvatar: 'MO',
    commentOrLyricExcerpt:
      'Énorme Delta d’Impact sur la prod Ntcham de Kvnz Beats et le mix Studio K de Maître Boussengui !',
    isLyricExcerpt: false,
    createdAt: 'il y a 24 min',
    boostPoints: 0.35,
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-init-1',
    title: 'Normalisation Opus (-14.0 LUFS) active',
    message:
      'Toutes les pistes du catalogue sont alignées au même niveau sonore constant (-14.0 LUFS) en conteneur Opus.',
    type: 'PUBLISH',
    createdAt: 'À l’instant',
    read: false,
  },
  {
    id: 'notif-init-2',
    title: 'Base de données Artistes & Crédits synchronisée',
    message:
      'Les listes déroulantes des artistes, labels, beatmakers, ingénieurs et auteurs sont prêtes.',
    type: 'DATABASE',
    createdAt: 'Il y a 5 min',
    read: false,
  },
];

