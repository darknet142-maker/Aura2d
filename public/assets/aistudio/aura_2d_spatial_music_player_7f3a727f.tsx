import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Plus,
  Share2,
  Compass,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  Grid,
  Mic2,
  Sliders,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Radio,
  Disc,
  Zap,
  Check,
  Info,
  Maximize2,
  ListMusic,
  Headphones,
  ArrowLeftRight,
  ArrowUpDown,
  Flame
} from 'lucide-react';

// ============================================================================
// BASE DE DONNÉES MUSICALE 2D (AXE X = FLUX D'UNIVERS, AXE Y = PISTES D'ALBUM)
// ============================================================================
const MUSIC_MATRIX = [
  {
    id: 'feed-1',
    type: 'ALBUM',
    releaseTitle: 'Always Be Creative',
    artist: 'Nova Collective',
    ArtistAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    genre: 'Future Soul • Alt-Pop',
    year: '2026',
    accent: '#F59E0B', // Ambre doré (clin d'œil au visuel original)
    secondaryAccent: '#EA580C',
    bgGlow: 'from-amber-500/30 via-orange-900/20 to-zinc-950',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    listeners: '1,4 M',
    tracks: [
      {
        id: 't-101',
        number: 1,
        title: 'Story of My Life (Reimagined)',
        feat: 'feat. Kaelen',
        duration: 180, // 3:00
        dropStart: 0.38,
        dropEnd: 0.68,
        bpm: 118,
        keySignature: 'Fa min',
        quality: '24-Bit / 192kHz Spatial',
        rootFreq: 174.61, // F3
        chordType: 'minor7',
        coverOverlay: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
        lyrics: [
          { time: 0, text: "♪ Intro instrumentale analogique..." },
          { time: 18, text: "Walking through the amber light of yesterday" },
          { time: 42, text: "Every frame a memory we refused to fade" },
          { time: 68, text: "★ DROP : This is the story of my life, written in neon!" },
          { time: 105, text: "Turning every page vertical into the night" },
          { time: 140, text: "We keep the frequencies alive until dawn" }
        ]
      },
      {
        id: 't-102',
        number: 2,
        title: 'Golden Hour Paradox',
        feat: 'Solo Session',
        duration: 214,
        dropStart: 0.32,
        dropEnd: 0.62,
        bpm: 122,
        keySignature: 'Ré min',
        quality: 'Dolby Atmos',
        rootFreq: 146.83, // D3
        chordType: 'maj9',
        coverOverlay: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        lyrics: [
          { time: 0, text: "♪ Synthétiseurs solaires en montée..." },
          { time: 25, text: "Sunbeams catching dust on the vinyl groove" },
          { time: 65, text: "★ DROP : Golden hour never ends when you move" },
          { time: 120, text: "Floating between the horizon and the bassline" },
          { time: 175, text: "Fade out into warm static..." }
        ]
      },
      {
        id: 't-103',
        number: 3,
        title: 'Velvet Sketchbook',
        feat: 'feat. Mira & Sol',
        duration: 165,
        dropStart: 0.45,
        dropEnd: 0.75,
        bpm: 105,
        keySignature: 'La min',
        quality: 'Lossless FLAC',
        rootFreq: 220.0, // A3
        chordType: 'minor9',
        coverOverlay: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=80',
        lyrics: [
          { time: 0, text: "♪ Rythmique Lo-Fi feutrée & Rhodes..." },
          { time: 30, text: "Drawing new worlds on the corner of a napkin" },
          { time: 74, text: "★ DROP : Colors bleeding through the speakers" },
          { time: 125, text: "Always be creative, never lock the door" }
        ]
      },
      {
        id: 't-104',
        number: 4,
        title: 'Midnight Studio Tape (Outro)',
        feat: 'Live Take',
        duration: 198,
        dropStart: 0.50,
        dropEnd: 0.82,
        bpm: 96,
        keySignature: 'Do maj',
        quality: 'Master Studio',
        rootFreq: 130.81, // C3
        chordType: 'sus4',
        coverOverlay: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        lyrics: [
          { time: 0, text: "♪ Bruits de studio et accordage..." },
          { time: 45, text: "One last take before the city wakes up" },
          { time: 99, text: "★ DROP : Solo de synthé modulaire spatial" },
          { time: 155, text: "Fin de l'album — Glissez à droite pour continuer" }
        ]
      }
    ]
  },
  {
    id: 'feed-2',
    type: 'ALBUM',
    releaseTitle: 'Cybernetic Pulse',
    artist: 'Klang & Aether',
    ArtistAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    genre: 'Melodic Techno • Synthwave',
    year: '2026',
    accent: '#F43F5E', // Rose/Rouge électrique
    secondaryAccent: '#9333EA',
    bgGlow: 'from-rose-600/30 via-purple-950/25 to-zinc-950',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    listeners: '2,8 M',
    tracks: [
      {
        id: 't-201',
        number: 1,
        title: 'Hyperdrive Horizon',
        feat: 'Original Mix',
        duration: 205,
        dropStart: 0.35,
        dropEnd: 0.70,
        bpm: 128,
        keySignature: 'Sol min',
        quality: 'Dolby Atmos',
        rootFreq: 196.0, // G3
        chordType: 'minor7',
        coverOverlay: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        lyrics: [
          { time: 0, text: "♪ Arpégiateur analogique 128 BPM..." },
          { time: 32, text: "Neon reflections on wet asphalt" },
          { time: 71, text: "★ DROP : Sub-bass impact & laser lead" },
          { time: 145, text: "Accelerating past the skyline" }
        ]
      },
      {
        id: 't-202',
        number: 2,
        title: ' Crimson Protocol',
        feat: 'feat. VEX',
        duration: 188,
        dropStart: 0.40,
        dropEnd: 0.72,
        bpm: 130,
        keySignature: 'Mi min',
        quality: '24-Bit Lossless',
        rootFreq: 164.81, // E3
        chordType: 'sus4',
        coverOverlay: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80',
        lyrics: [
          { time: 0, text: "♪ Séquence industrielle sombre..." },
          { time: 40, text: "System override in the red sector" },
          { time: 75, text: "★ DROP : Rave stabs & vocoder choir" },
          { time: 140, text: "Pure kinetic energy in the matrix" }
        ]
      },
      {
        id: 't-203',
        number: 3,
        title: 'Zero Gravity Tears',
        feat: 'Ambient Dub',
        duration: 230,
        dropStart: 0.42,
        dropEnd: 0.78,
        bpm: 124,
        keySignature: 'Si min',
        quality: 'Spatial Audio',
        rootFreq: 246.94, // B3
        chordType: 'minor9',
        coverOverlay: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
        lyrics: [
          { time: 0, text: "♪ Nappes atmosphériques profondes..." },
          { time: 52, text: "Drifting above the orbital ring" },
          { time: 96, text: "★ DROP : Euphoric melodic break" },
          { time: 180, text: "Silence returns to the cosmos" }
        ]
      }
    ]
  },
  {
    id: 'feed-3',
    type: 'SINGLE',
    releaseTitle: 'Azure Frequencies (Single)',
    artist: 'Lumina',
    ArtistAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    genre: 'UK Garage • Liquid D&B',
    year: '2026',
    accent: '#06B6D4', // Cyan polaire
    secondaryAccent: '#3B82F6',
    bgGlow: 'from-cyan-500/30 via-blue-950/25 to-zinc-950',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
    listeners: '920 k',
    tracks: [
      {
        id: 't-301',
        number: 1,
        title: 'Azure Frequencies (Club Edit)',
        feat: 'Single Exclusif',
        duration: 192,
        dropStart: 0.30,
        dropEnd: 0.66,
        bpm: 136,
        keySignature: 'Lab maj',
        quality: '24-Bit Hi-Res',
        rootFreq: 207.65, // G#3
        chordType: 'maj9',
        coverOverlay: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
        lyrics: [
          { time: 0, text: "♪ 2-Step percussion & chopped vocals..." },
          { time: 28, text: "Caught in the tide of a crystal wave" },
          { time: 57, text: "★ DROP : Reese bassline & breakbeat explosion!" },
          { time: 130, text: "Note UX : Ce titre est un Single (1 seule piste Y)" }
        ]
      }
    ]
  },
  {
    id: 'feed-4',
    type: 'EP',
    releaseTitle: 'Libreville Nights EP',
    artist: 'Ogooué Sound System',
    ArtistAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    genre: 'Afro-Tech • Amapiano Fusion',
    year: '2026',
    accent: '#10B981', // Émeraude vibrant
    secondaryAccent: '#84CC16',
    bgGlow: 'from-emerald-500/30 via-teal-950/25 to-zinc-950',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    listeners: '1,9 M',
    tracks: [
      {
        id: 't-401',
        number: 1,
        title: 'Estuaire Sunset Groove',
        feat: 'feat. Zaya',
        duration: 210,
        dropStart: 0.36,
        dropEnd: 0.74,
        bpm: 113,
        keySignature: 'Do min',
        quality: 'Dolby Atmos',
        rootFreq: 130.81,
        chordType: 'minor7',
        coverOverlay: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        lyrics: [
          { time: 0, text: "♪ Shakers organiques & Log Drum en approche..." },
          { time: 38, text: "From the coast to the equator rhythm" },
          { time: 75, text: "★ DROP : Deep Amapiano Log Drum & Cuivres" },
          { time: 155, text: "Dancing under the equatorial stars" }
        ]
      },
      {
        id: 't-402',
        number: 2,
        title: 'Emerald Canopy',
        feat: 'Percussion Dub',
        duration: 184,
        dropStart: 0.33,
        dropEnd: 0.65,
        bpm: 116,
        keySignature: 'Fa min',
        quality: 'Lossless 24-Bit',
        rootFreq: 174.61,
        chordType: 'minor9',
        coverOverlay: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
        lyrics: [
          { time: 0, text: "♪ Marimba hypnotique & basse profonde..." },
          { time: 35, text: "Echoes of the rainforest meets future bass" },
          { time: 61, text: "★ DROP : Polyrythmie ancestrale & synthés" },
          { time: 135, text: "Vibration pure jusqu'au bout de la nuit" }
        ]
      },
      {
        id: 't-403',
        number: 3,
        title: 'Bantu Cybernetics',
        feat: 'Club Mix',
        duration: 196,
        dropStart: 0.40,
        dropEnd: 0.75,
        bpm: 120,
        keySignature: 'Sol min',
        quality: 'Master Spatial',
        rootFreq: 196.0,
        chordType: 'sus4',
        coverOverlay: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=80',
        lyrics: [
          { time: 0, text: "♪ Afro-House kick & chants spirituels..." },
          { time: 44, text: "Bridging the roots and the satellite" },
          { time: 78, text: "★ DROP : Hypnotic synth lead & tribal drums" },
          { time: 150, text: "The future has an ancient heartbeat" }
        ]
      }
    ]
  }
];

// Utilitaire de formatage du temps (ex: 116 -> "1:56")
const formatTime = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Générateur de forme d'onde déterministe par piste
const generateWaveformBars = (trackId, count = 46) => {
  let seed = 0;
  for (let i = 0; i < trackId.length; i++) {
    seed = (seed * 31 + trackId.charCodeAt(i)) % 10000;
  }
  const bars = [];
  for (let i = 0; i < count; i++) {
    seed = (seed * 16807) % 2147483647;
    const normalized = (seed % 100) / 100;
    // Forme d'onde plus intense au milieu (drop)
    const positionFactor = Math.sin((i / count) * Math.PI);
    const height = Math.max(0.22, Math.min(1, normalized * 0.65 + positionFactor * 0.45));
    bars.push(height);
  }
  return bars;
};

// ============================================================================
// COMPOSANT PRINCIPAL : AURA 2D SPATIAL PLAYER
// ============================================================================
export default function AuraSpatialPlayer() {
  // Position dans la matrice 2D : X = Index du Feed, Y = Index de la piste dans l'album
  const [xIndex, setXIndex] = useState(0);
  const [yIndex, setYIndex] = useState(0);

  // États du lecteur audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(116); // Démarre à 1:56 (clin d'œil corrigé au 1:56 / 3:00 du shot !)
  const [isMuted, setIsMuted] = useState(false);
  const [synthEnabled, setSynthEnabled] = useState(true);

  // Modes UX exclusifs (Résolution des ambiguïtés du concept 2D)
  // 'Y-FOCUS' = Enchaîne les pistes de l'album verticalement | 'X-FLOW' = Zappe de découverte en découverte (Mode TikTok/Feed)
  const [navigationMode, setNavigationMode] = useState('Y-FOCUS');
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('ALBUM'); // 'OFF' | 'ALBUM' | 'TRACK'

  // Modales et vues superposées sans conflit gestuel
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [showUxInspector, setShowUxInspector] = useState(true);
  const [likedTracks, setLikedTracks] = useState({ 't-101': true });
  const [savedReleases, setSavedReleases] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // États du moteur gestuel 2D (Drag X / Drag Y sur la pochette)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lockedAxis, setLockedAxis] = useState(null); // 'x' | 'y' | null
  const [transitionAnim, setTransitionAnim] = useState(null); // 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down'
  const pointerStartRef = useRef(null);
  const wheelCooldownRef = useRef(false);

  // Références Web Audio API pour générer un vrai son d'ambiance évolutif
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const oscNodesRef = useRef([]);

  // Données courantes dérivées de (X, Y)
  const currentFeed = MUSIC_MATRIX[xIndex] || MUSIC_MATRIX[0];
  const safeYIndex = Math.min(yIndex, currentFeed.tracks.length - 1);
  const currentTrack = currentFeed.tracks[safeYIndex] || currentFeed.tracks[0];
  const isMultiTrack = currentFeed.tracks.length > 1;

  // Barres d'onde sonore pré-calculées pour la piste active
  const waveformBars = useMemo(
    () => generateWaveformBars(currentTrack.id, 48),
    [currentTrack.id]
  );

  // Paroles synchronisées en temps réel
  const activeLyricIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < currentTrack.lyrics.length; i++) {
      if (currentTime >= currentTrack.lyrics[i].time) {
        idx = i;
      }
    }
    return idx;
  }, [currentTrack.lyrics, currentTime]);

  // Notification éphémère (Toast UX)
  const triggerToast = useCallback((msg) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2600);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // ============================================================================
  // MOTEUR AUDIO SYNTHÉTIQUE (WEB AUDIO API) POUR LE FEEDBACK SONORE RÉEL
  // ============================================================================
  const stopSynthNodes = useCallback(() => {
    oscNodesRef.current.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {
        // Ignorer si déjà arrêté
      }
    });
    oscNodesRef.current = [];
  }, []);

  const updateSynthSound = useCallback(() => {
    if (!isPlaying || isMuted || !synthEnabled) {
      stopSynthNodes();
      return;
    }

    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      stopSynthNodes();

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.35);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // Accords harmonieux selon la piste active (X, Y)
      const root = currentTrack.rootFreq || 174.61;
      const ratios =
        currentTrack.chordType === 'maj9'
          ? [1, 1.25, 1.5, 1.875]
          : currentTrack.chordType === 'sus4'
          ? [1, 1.333, 1.5, 2]
          : [1, 1.2, 1.5, 1.78]; // minor7/9

      ratios.forEach((ratio, idx) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const oscGain = ctx.createGain();

        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(root * ratio, ctx.currentTime);

        // Légère modulation LFO liée au BPM du morceau
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650 + idx * 250, ctx.currentTime);

        oscGain.gain.setValueAtTime(idx === 0 ? 0.45 : 0.2, ctx.currentTime);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start();
        oscNodesRef.current.push(osc);
      });
    } catch (err) {
      // Fallback silencieux si l'autoplay navigateur bloque
    }
  }, [isPlaying, isMuted, synthEnabled, currentTrack, stopSynthNodes]);

  useEffect(() => {
    updateSynthSound();
    return () => stopSynthNodes();
  }, [updateSynthSound, stopSynthNodes]);

  // Petit retour sonore (clic subtil) lors d'un swipe X ou Y
  const playSwipeFeedbackSound = useCallback(
    (axis) => {
      if (isMuted || !synthEnabled) return;
      try {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const startFreq = axis === 'x' ? 320 : 520;
        const endFreq = axis === 'x' ? 480 : 680;

        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.09);

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.095);
      } catch (e) {
        // Ignore
      }
    },
    [isMuted, synthEnabled]
  );

  // ============================================================================
  // NAVIGATION 2D : FONCTIONS DE DÉPLACEMENT AXE X (FEED) & AXE Y (ALBUM)
  // ============================================================================
  const navigateX = useCallback(
    (direction) => {
      // direction : +1 (Feed suivant à droite) ou -1 (Feed précédent à gauche)
      setTransitionAnim(direction > 0 ? 'swipe-left' : 'swipe-right');
      setTimeout(() => setTransitionAnim(null), 280);

      setXIndex((prevX) => {
        const nextX = (prevX + direction + MUSIC_MATRIX.length) % MUSIC_MATRIX.length;
        const nextRelease = MUSIC_MATRIX[nextX];
        // En mode X-FLOW (Découverte TikTok), on démarre directement sur le Drop/Hook du morceau !
        const firstTrack = nextRelease.tracks[0];
        const initialTime =
          navigationMode === 'X-FLOW'
            ? Math.floor(firstTrack.duration * firstTrack.dropStart)
            : 0;
        setYIndex(0);
        setCurrentTime(initialTime);
        triggerToast(
          navigationMode === 'X-FLOW'
            ? `↔ Flux X : ${nextRelease.releaseTitle} (Aperçu Drop ★)`
            : `↔ Univers : ${nextRelease.releaseTitle} (${nextRelease.tracks.length} piste${
                nextRelease.tracks.length > 1 ? 's' : ''
              })`
        );
        return nextX;
      });
      playSwipeFeedbackSound('x');
    },
    [navigationMode, playSwipeFeedbackSound, triggerToast]
  );

  const navigateY = useCallback(
    (direction) => {
      // direction : +1 (Piste suivante en glissant vers le haut) ou -1 (Piste précédente vers le bas)
      const totalTracks = currentFeed.tracks.length;
      if (totalTracks <= 1) {
        triggerToast(`Ce titre est un Single (1/1) • Glissez ↔ pour changer d'artiste`);
        return;
      }

      const nextY = safeYIndex + direction;
      if (nextY >= 0 && nextY < totalTracks) {
        setTransitionAnim(direction > 0 ? 'swipe-up' : 'swipe-down');
        setTimeout(() => setTransitionAnim(null), 280);
        setYIndex(nextY);
        const targetTrack = currentFeed.tracks[nextY];
        setCurrentTime(0);
        playSwipeFeedbackSound('y');
        triggerToast(`↕ Piste ${nextY + 1}/${totalTracks} : ${targetTrack.title}`);
      } else if (nextY >= totalTracks) {
        // Fin de l'album vertical : rebond ou bascule intelligente vers le flux suivant
        triggerToast(`Fin de l'album "${currentFeed.releaseTitle}" → Passage au flux suivant`);
        navigateX(1);
      } else {
        triggerToast(`Début de l'album • Piste 1/${totalTracks}`);
      }
    },
    [currentFeed, safeYIndex, navigateX, playSwipeFeedbackSound, triggerToast]
  );

  // Logique des boutons Suivant / Précédent du Dock (Résout le paradoxe des flèches |<< et >>|)
  const handleSmartNext = useCallback(() => {
    if (navigationMode === 'X-FLOW') {
      navigateX(1);
    } else {
      // En mode Focus Album (Y), passe à la piste suivante de l'album, ou au feed suivant si c'est la dernière
      if (safeYIndex < currentFeed.tracks.length - 1) {
        navigateY(1);
      } else {
        navigateX(1);
      }
    }
  }, [navigationMode, safeYIndex, currentFeed.tracks.length, navigateX, navigateY]);

  const handleSmartPrev = useCallback(() => {
    if (currentTime > 10) {
      setCurrentTime(0);
      triggerToast('Retour au début du morceau');
      return;
    }
    if (navigationMode === 'X-FLOW') {
      navigateX(-1);
    } else {
      if (safeYIndex > 0) {
        navigateY(-1);
      } else {
        navigateX(-1);
      }
    }
  }, [currentTime, navigationMode, safeYIndex, navigateX, navigateY, triggerToast]);

  // Timer de lecture temps réel
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev + 1 >= currentTrack.duration) {
          if (repeatMode === 'TRACK') {
            return 0;
          }
          handleSmartNext();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.duration, repeatMode, handleSmartNext]);

  // Raccourcis Clavier 2D (Flèches Gauche/Droite = X, Flèches Haut/Bas = Y, Espace = Play)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateX(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateX(-1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateY(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateY(1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateX, navigateY]);

  // ============================================================================
  // GESTIONNAIRE TACTILE & SOURIS 2D SUR LA POCHETTE CENTRALE
  // ============================================================================
  const handlePointerDown = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    pointerStartRef.current = { x: clientX, y: clientY };
    setLockedAxis(null);
  };

  const handlePointerMove = (e) => {
    if (!pointerStartRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - pointerStartRef.current.x;
    const dy = clientY - pointerStartRef.current.y;

    // Verrouillage d'axe intelligent dès 10px pour éviter toute collision diagonale
    let currentAxis = lockedAxis;
    if (!currentAxis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      currentAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      setLockedAxis(currentAxis);
    }

    if (currentAxis === 'x') {
      setDragOffset({ x: Math.max(-130, Math.min(130, dx)), y: 0 });
    } else if (currentAxis === 'y') {
      setDragOffset({ x: 0, y: Math.max(-130, Math.min(130, dy)) });
    }
  };

  const handlePointerUp = () => {
    if (!pointerStartRef.current) return;
    const THRESHOLD = 48;

    if (lockedAxis === 'x') {
      if (dragOffset.x < -THRESHOLD) {
        navigateX(1); // Glisser vers la gauche -> Feed suivant
      } else if (dragOffset.x > THRESHOLD) {
        navigateX(-1); // Glisser vers la droite -> Feed précédent
      }
    } else if (lockedAxis === 'y') {
      if (dragOffset.y < -THRESHOLD) {
        navigateY(1); // Glisser vers le haut -> Piste suivante de l'album
      } else if (dragOffset.y > THRESHOLD) {
        navigateY(-1); // Glisser vers le bas -> Piste précédente de l'album
      }
    }

    pointerStartRef.current = null;
    setDragOffset({ x: 0, y: 0 });
    setLockedAxis(null);
  };

  // Molette de la souris sur la pochette = Défilement vertical des pistes de l'album
  const handleCardWheel = (e) => {
    e.preventDefault();
    if (wheelCooldownRef.current) return;
    if (Math.abs(e.deltaY) > 18) {
      wheelCooldownRef.current = true;
      if (e.deltaY > 0) {
        navigateY(1);
      } else {
        navigateY(-1);
      }
      setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 360);
    }
  };

  // Sauter directement au moment fort (Hook / Drop) du morceau
  const jumpToDrop = () => {
    const dropSecond = Math.floor(currentTrack.duration * currentTrack.dropStart);
    setCurrentTime(dropSecond);
    setIsPlaying(true);
    triggerToast(`★ Saut direct au Drop (${formatTime(dropSecond)})`);
  };

  // Calcul exact du pourcentage temporel (corrige l'erreur 1:56 / 3:00 du visuel Dribbble)
  const progressPercent = Math.min(100, Math.max(0, (currentTime / currentTrack.duration) * 100));

  // Pochettes adjacentes sur l'axe X (gauche et droite)
  const prevFeedIndex = (xIndex - 1 + MUSIC_MATRIX.length) % MUSIC_MATRIX.length;
  const nextFeedIndex = (xIndex + 1) % MUSIC_MATRIX.length;
  const prevFeed = MUSIC_MATRIX[prevFeedIndex];
  const nextFeed = MUSIC_MATRIX[nextFeedIndex];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-amber-500 selection:text-black flex flex-col lg:flex-row items-center justify-center p-2 sm:p-6 gap-6 overflow-x-hidden">
      {/* ====================================================================
          CADRE DU SMARTPHONE : EXPÉRIENCE PRINCIPALE "AURA 2D PLAYER"
         ==================================================================== */}
      <div className="relative w-full max-w-[420px] h-[850px] max-h-[94vh] rounded-[44px] bg-zinc-950 border-[6px] border-zinc-800/90 shadow-[0_25px_90px_-15px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col justify-between select-none shrink-0">
        {/* Halo lumineux dynamique réactif à l'album actif (X) et à la lecture */}
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${currentFeed.bgGlow} transition-all duration-700`}
        />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[95px] opacity-40 transition-all duration-700"
          style={{
            backgroundColor: currentFeed.accent,
            transform: `translate(-50%, ${isPlaying ? '8px' : '0px'}) scale(${isPlaying ? 1.12 : 0.95})`
          }}
        />

        {/* NOTIFICATION TOAST FLOTTANTE */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/95 backdrop-blur-xl border border-white/15 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-medium text-zinc-100 whitespace-nowrap animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ==================================================================
            1. EN-TÊTE CONTEXTUEL INTELLIGENT (Remplace le "Audio Player" muet)
           ================================================================== */}
        <header className="relative z-20 pt-5 pb-2 px-5 flex items-center justify-between gap-2">
          {/* Bouton Vue Matrice 2D (Minimap X/Y) */}
          <button
            onClick={() => setShowMatrixModal(true)}
            title="Ouvrir la carte spatiale 2D (Axe X / Axe Y)"
            className="group relative flex items-center gap-2 h-10 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all active:scale-95"
          >
            <Grid className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
            <span className="text-[11px] font-semibold tracking-wider text-zinc-300">
              {xIndex + 1}/{MUSIC_MATRIX.length}
            </span>
          </button>

          {/* Sélecteur de Mode d'Écoute : FLUX X (Découverte) vs FOCUS Y (Album) */}
          <div className="flex items-center p-1 rounded-full bg-zinc-900/90 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => {
                setNavigationMode('X-FLOW');
                triggerToast('Mode Flux (X) : Zapping rapide de refrain en refrain');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                navigationMode === 'X-FLOW'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Flux X</span>
            </button>
            <button
              onClick={() => {
                setNavigationMode('Y-FOCUS');
                triggerToast("Mode Album (Y) : Lecture intégrale des pistes de l'album");
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                navigationMode === 'Y-FOCUS'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Album Y</span>
            </button>
          </div>

          {/* Bouton Audio Synth / Cast */}
          <button
            onClick={() => {
              setIsMuted((m) => !m);
              triggerToast(!isMuted ? 'Audio coupé' : 'Synthétiseur Web Audio activé');
            }}
            className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all active:scale-95 ${
              !isMuted && isPlaying
                ? 'bg-white/15 border-white/25 text-white'
                : 'bg-white/[0.06] border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Activer/Couper le générateur sonore"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </header>

        {/* Sous-barre d'information contextuelle (Genre + Indicateur d'axes) */}
        <div className="relative z-20 px-6 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: currentFeed.accent }}
            />
            <span className="font-medium text-zinc-300 truncate">{currentFeed.releaseTitle}</span>
            <span className="text-zinc-600">•</span>
            <span className="truncate">{currentFeed.genre}</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-[10px] font-mono uppercase tracking-wider text-zinc-300 shrink-0">
            {currentFeed.type}
          </span>
        </div>

        {/* ==================================================================
            2. ZONE MATRICIELLE 2D : CARROUSEL HORIZONTAL (X) + PILE D'ALBUM (Y)
           ================================================================== */}
        <div className="relative z-10 my-auto py-2 flex items-center justify-center">
          {/* CARTE GAUCHE (Aperçu du Feed X-1) */}
          <button
            onClick={() => navigateX(-1)}
            aria-label="Flux précédent"
            className="absolute -left-12 w-24 h-60 rounded-3xl overflow-hidden opacity-35 hover:opacity-65 scale-90 transition-all duration-300 border border-white/10 shadow-xl group cursor-pointer z-10"
          >
            <img
              src={prevFeed.coverUrl}
              alt={prevFeed.releaseTitle}
              className="w-full h-full object-cover filter blur-[1px] group-hover:blur-0 transition-all"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/70 flex items-center justify-end pr-2">
              <ChevronLeft className="w-5 h-5 text-white/80 group-hover:scale-125 transition-transform" />
            </div>
          </button>

          {/* CARTE DROITE (Aperçu du Feed X+1) */}
          <button
            onClick={() => navigateX(1)}
            aria-label="Flux suivant"
            className="absolute -right-12 w-24 h-60 rounded-3xl overflow-hidden opacity-35 hover:opacity-65 scale-90 transition-all duration-300 border border-white/10 shadow-xl group cursor-pointer z-10"
          >
            <img
              src={nextFeed.coverUrl}
              alt={nextFeed.releaseTitle}
              className="w-full h-full object-cover filter blur-[1px] group-hover:blur-0 transition-all"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-black/70 flex items-center justify-start pl-2">
              <ChevronRight className="w-5 h-5 text-white/80 group-hover:scale-125 transition-transform" />
            </div>
          </button>

          {/* CONTENEUR CENTRAL AVEC AFFORDANCE VERTICALE (PILE D'ALBUM 3D) */}
          <div className="relative w-[286px] h-[296px] flex items-center justify-center">
            {/* Cartes fantômes supérieures et inférieures (Signifier visuel de l'axe Y si multi-pistes) */}
            {isMultiTrack && (
              <>
                {/* Piste précédente empilée en haut */}
                <div
                  onClick={() => safeYIndex > 0 && navigateY(-1)}
                  className={`absolute -top-3.5 w-[240px] h-12 rounded-t-3xl border border-white/15 bg-zinc-800/70 backdrop-blur-md transition-all duration-300 cursor-pointer ${
                    safeYIndex > 0
                      ? 'opacity-80 hover:-translate-y-1'
                      : 'opacity-20 pointer-events-none'
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(to bottom, ${currentFeed.accent}33, rgba(24,24,27,0.9))`
                  }}
                >
                  <div className="flex items-center justify-center gap-1 pt-1 text-[9px] font-semibold tracking-widest uppercase text-zinc-300">
                    <ChevronUp className="w-3 h-3" />
                    <span>
                      {safeYIndex > 0
                        ? `Piste ${safeYIndex} : ${currentFeed.tracks[safeYIndex - 1].title.slice(0, 18)}...`
                        : 'Début Album'}
                    </span>
                  </div>
                </div>

                {/* Piste suivante empilée en bas (Effet double tranche) */}
                <div
                  className={`absolute -bottom-5 w-[224px] h-10 rounded-b-3xl border border-white/10 bg-zinc-900/60 transition-all duration-300 ${
                    safeYIndex < currentFeed.tracks.length - 2 ? 'opacity-55' : 'opacity-0'
                  }`}
                />
                <div
                  onClick={() => safeYIndex < currentFeed.tracks.length - 1 && navigateY(1)}
                  className={`absolute -bottom-3 w-[248px] h-12 rounded-b-3xl border border-white/20 bg-zinc-800/80 backdrop-blur-md transition-all duration-300 cursor-pointer flex items-end justify-center pb-1 ${
                    safeYIndex < currentFeed.tracks.length - 1
                      ? 'opacity-90 hover:translate-y-1'
                      : 'opacity-30'
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(to top, ${currentFeed.accent}44, rgba(24,24,27,0.95))`
                  }}
                >
                  <div className="flex items-center gap-1 text-[9px] font-semibold tracking-widest uppercase text-zinc-200">
                    <span>
                      {safeYIndex < currentFeed.tracks.length - 1
                        ? `Suivant (${safeYIndex + 2}/${currentFeed.tracks.length}) : ${currentFeed.tracks[
                            safeYIndex + 1
                          ].title.slice(0, 16)}...`
                        : 'Glisser ↑ pour Flux Suivant'}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </div>
              </>
            )}

            {/* CARTE PRINCIPALE INTERACTIVE (SWIPE 2D : GAUCHE/DROITE & HAUT/BAS) */}
            <div
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              onWheel={handleCardWheel}
              style={{
                transform: `translate3d(${dragOffset.x * 0.55}px, ${
                  dragOffset.y * 0.55
                }px, 0) rotateZ(${dragOffset.x * 0.04}deg) scale(${
                  lockedAxis ? 0.97 : 1
                })`
              }}
              className={`relative z-20 w-[276px] h-[276px] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/15 cursor-grab active:cursor-grabbing transition-transform ${
                lockedAxis ? 'duration-0' : 'duration-300 ease-out'
              } ${
                transitionAnim === 'swipe-left'
                  ? 'animate-pulse'
                  : transitionAnim === 'swipe-up'
                  ? '-translate-y-2'
                  : ''
              }`}
            >
              {/* Image de la piste courante */}
              <img
                src={currentTrack.coverOverlay || currentFeed.coverUrl}
                alt={currentTrack.title}
                draggable={false}
                className="w-full h-full object-cover select-none pointer-events-none transition-all duration-500 scale-105"
              />

              {/* Dégradés de lisibilité interne */}
              <div className="
                pointer-events-none absolute inset-0
                bg-gradient-to-t from-black/80 via-black/15 to-black/45
              " />

              {/* HUD Supérieur sur la Pochette : Avatar Artiste + Badge Piste Y */}
              <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-black/55 backdrop-blur-md pl-1 pr-2.5 py-1 rounded-full border border-white/15">
                  <img
                    src={currentFeed.ArtistAvatar}
                    alt={currentFeed.artist}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="text-[11px] font-medium text-white/95 truncate max-w-[115px]">
                    {currentFeed.artist}
                  </span>
                </div>

                {/* Pilule de profondeur verticale (Axe Y) */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border text-[11px] font-bold shadow-lg"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    borderColor: `${currentFeed.accent}66`,
                    color: currentFeed.accent
                  }}
                >
                  <Layers className="w-3 h-3" />
                  <span>
                    {isMultiTrack
                      ? `Piste ${safeYIndex + 1}/${currentFeed.tracks.length}`
                      : 'Single 1/1'}
                  </span>
                </div>
              </div>

              {/* JAUGE DE PAGINATION VERTICALE SUR LE BORD DROIT DE LA POCHETTE */}
              {isMultiTrack && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 bg-black/55 backdrop-blur-md py-2.5 px-1.5 rounded-full border border-white/15">
                  {currentFeed.tracks.map((t, idx) => {
                    const active = idx === safeYIndex;
                    return (
                      <button
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setYIndex(idx);
                          setCurrentTime(0);
                          triggerToast(`↕ Saut à la piste ${idx + 1} : ${t.title}`);
                        }}
                        aria-label={`Piste ${idx + 1}`}
                        className={`rounded-full transition-all duration-300 ${
                          active ? 'w-2 h-6' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/75'
                        }`}
                        style={active ? { backgroundColor: currentFeed.accent } : {}}
                      />
                    );
                  })}
                </div>
              )}

              {/* OVERLAY D'INDICATION DE GESTE EN DIRECT PENDANT LE GLISSEMENT */}
              {lockedAxis && (
                <div className="absolute inset-0 bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 border border-white/20"
                    style={{ backgroundColor: `${currentFeed.accent}33` }}
                  >
                    {lockedAxis === 'x' ? (
                      <ArrowLeftRight className="w-6 h-6 text-white" />
                    ) : (
                      <ArrowUpDown className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white">
                    {lockedAxis === 'x'
                      ? dragOffset.x < 0
                        ? '→ Flux Suivant (Axe X)'
                        : '← Flux Précédent (Axe X)'
                      : dragOffset.y < 0
                      ? '↑ Piste Suivante (Axe Y)'
                      : '↓ Piste Précédente (Axe Y)'}
                  </p>
                  <span className="text-[11px] text-zinc-300 mt-0.5">
                    {lockedAxis === 'x'
                      ? dragOffset.x < 0
                        ? nextFeed.releaseTitle
                        : prevFeed.releaseTitle
                      : isMultiTrack
                      ? `Exploration de ${currentFeed.releaseTitle}`
                      : 'Single (1 seule piste)'}
                  </span>
                </div>
              )}

              {/* HUD Inférieur sur la Pochette : Métadonnées Audio + Actions Rapides (Cœur / Playlist) */}
              <div className="absolute bottom-3.5 inset-x-3.5 flex items-end justify-between">
                {/* Métadonnées Sonic DNA */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-white/15 backdrop-blur-md text-[10px] font-semibold text-white">
                      {currentTrack.bpm} BPM
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/50 backdrop-blur-md text-[10px] text-zinc-300 border border-white/10">
                      {currentTrack.keySignature}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-300/90 font-medium flex items-center gap-1">
                    <Headphones className="w-3 h-3 text-amber-400" />
                    {currentTrack.quality}
                  </span>
                </div>

                {/* Actions d'engagement déplacées hors du dock inférieur pour l'épurer */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSavedReleases((prev) => ({
                        ...prev,
                        [currentFeed.id]: !prev[currentFeed.id]
                      }));
                      triggerToast(
                        savedReleases[currentFeed.id]
                          ? 'Retiré de votre bibliothèque'
                          : `Album "${currentFeed.releaseTitle}" sauvegardé !`
                      );
                    }}
                    className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-90 ${
                      savedReleases[currentFeed.id]
                        ? 'bg-emerald-500/90 border-emerald-300 text-black'
                        : 'bg-black/55 border-white/15 text-white hover:bg-black/75'
                    }`}
                    title="Ajouter l'album à une playlist"
                  >
                    {savedReleases[currentFeed.id] ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLikedTracks((prev) => ({
                        ...prev,
                        [currentTrack.id]: !prev[currentTrack.id]
                      }));
                      triggerToast(
                        likedTracks[currentTrack.id]
                          ? 'Retiré des coups de cœur'
                          : `❤️ "${currentTrack.title}" ajouté aux favoris`
                      );
                    }}
                    className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-90 ${
                      likedTracks[currentTrack.id]
                        ? 'bg-rose-500 border-rose-300 text-white shadow-lg shadow-rose-500/40'
                        : 'bg-black/55 border-white/15 text-white hover:bg-black/75'
                    }`}
                    title="Liker ce morceau"
                  >
                    <Heart
                      className={`w-4 h-4 ${likedTracks[currentTrack.id] ? 'fill-current' : ''}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================
            3. TITRE, ARTISTE & PAROLES SYNCHRONISÉES (Sans conflit gestuel)
           ================================================================== */}
        <div className="relative z-20 px-6 text-center mt-1">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white truncate">
              {currentTrack.title}
            </h1>
          </div>

          <p className="text-xs text-zinc-400 mt-0.5 flex items-center justify-center gap-1.5">
            <span className="font-medium text-zinc-200">{currentFeed.artist}</span>
            <span>•</span>
            <span className="text-zinc-400">{currentTrack.feat}</span>
          </p>

          {/* Pilule de Paroles Synchronisées en Direct (Cliquable -> Ouvre les paroles sans bloquer le swipe Y) */}
          <button
            onClick={() => setShowLyricsModal(true)}
            className="mt-2.5 w-full py-1.5 px-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] flex items-center justify-between gap-2 transition-all group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Mic2
                className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110"
                style={{ color: currentFeed.accent }}
              />
              <p className="text-xs text-zinc-200 font-medium truncate">
                {currentTrack.lyrics[activeLyricIndex]?.text}
              </p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 group-hover:text-white shrink-0">
              Paroles
            </span>
          </button>
        </div>

        {/* ==================================================================
            4. ONDE SONORE INTERACTIVE + PROPORTION EXACTE + SAUT AU DROP
           ================================================================== */}
        <div className="relative z-20 px-6 mt-2">
          {/* En-tête de la timeline : Bouton "Aller au Drop" */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono text-zinc-300 font-medium">
              {formatTime(currentTime)}
            </span>

            <button
              onClick={jumpToDrop}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/[0.07] hover:bg-white/[0.15] border border-white/10 transition-all active:scale-95"
              style={{ color: currentFeed.accent }}
            >
              <Flame className="w-3 h-3 fill-current" />
              <span>Écouter le Drop ({formatTime(currentTrack.duration * currentTrack.dropStart)})</span>
            </button>

            <span className="text-[11px] font-mono text-zinc-400">
              {formatTime(currentTrack.duration)}
            </span>
          </div>

          {/* Barre d'onde sonore cliquable (Remplace la ligne plate disproportionnée) */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              setCurrentTime(Math.floor(clickRatio * currentTrack.duration));
            }}
            className="relative h-10 flex items-center justify-between gap-[3px] cursor-pointer group py-1"
            title="Cliquer pour naviguer dans le morceau (Zone colorée = Refrain / Drop)"
          >
            {waveformBars.map((barHeight, i) => {
              const barRatio = i / waveformBars.length;
              const isPlayed = barRatio <= progressPercent / 100;
              const isDropZone =
                barRatio >= currentTrack.dropStart && barRatio <= currentTrack.dropEnd;

              // Animation subtile des barres quand la lecture est active
              const dynamicScale =
                isPlaying && Math.abs(barRatio - progressPercent / 100) < 0.06 ? 1.25 : 1;

              return (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all duration-150"
                  style={{
                    height: `${Math.round(barHeight * 100 * dynamicScale)}%`,
                    backgroundColor: isPlayed
                      ? isDropZone
                        ? currentFeed.accent
                        : '#FFFFFF'
                      : isDropZone
                      ? `${currentFeed.accent}55`
                      : 'rgba(255,255,255,0.18)'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* ==================================================================
            5. DOCK DE CONTRÔLE ÉPURÉ (1 SEULE LIGNE + CONTEXTE 2D CLAIR)
           ================================================================== */}
        <div className="relative z-20 px-5 pb-5 pt-1">
          <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[28px] p-3.5 shadow-2xl">
            <div className="flex items-center justify-between px-2">
              {/* Shuffle avec portée explicite */}
              <button
                onClick={() => {
                  setIsShuffle((s) => !s);
                  triggerToast(
                    !isShuffle
                      ? `Aléatoire activé (${navigationMode === 'Y-FOCUS' ? 'Album' : 'Flux Global'})`
                      : 'Aléatoire désactivé'
                  );
                }}
                className={`p-2 rounded-full transition-all ${
                  isShuffle ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-400 hover:text-white'
                }`}
                title="Lecture aléatoire"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Bouton Précédent avec badge d'axe dynamique (Y ou X) */}
              <button
                onClick={handleSmartPrev}
                className="relative p-2.5 rounded-full text-zinc-200 hover:text-white hover:bg-white/5 transition-all active:scale-90"
                title={
                  navigationMode === 'Y-FOCUS'
                    ? 'Piste précédente dans l’album (Axe Y)'
                    : 'Flux précédent (Axe X)'
                }
              >
                <SkipBack className="w-5 h-5 fill-current" />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono uppercase tracking-tighter text-zinc-400">
                  {navigationMode === 'Y-FOCUS' ? 'Axe Y' : 'Axe X'}
                </span>
              </button>

              {/* BOUTON PLAY / PAUSE COHÉRENT AVEC L'ÉTAT DE LECTURE */}
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="w-15 h-15 w-[60px] h-[60px] rounded-full flex items-center justify-center text-zinc-950 shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: currentFeed.accent,
                  boxShadow: `0 10px 30px -5px ${currentFeed.accent}88`
                }}
                aria-label={isPlaying ? 'Pause' : 'Lecture'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current stroke-[2.5]" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5 stroke-[2.5]" />
                )}
              </button>

              {/* Bouton Suivant avec badge d'axe dynamique (Y ou X) */}
              <button
                onClick={handleSmartNext}
                className="relative p-2.5 rounded-full text-zinc-200 hover:text-white hover:bg-white/5 transition-all active:scale-90"
                title={
                  navigationMode === 'Y-FOCUS'
                    ? 'Piste suivante dans l’album (Axe Y)'
                    : 'Flux suivant (Axe X)'
                }
              >
                <SkipForward className="w-5 h-5 fill-current" />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono uppercase tracking-tighter text-zinc-400">
                  {navigationMode === 'Y-FOCUS' ? 'Axe Y' : 'Axe X'}
                </span>
              </button>

              {/* Repeat avec cycle d'état */}
              <button
                onClick={() => {
                  const nextRepeat =
                    repeatMode === 'ALBUM' ? 'TRACK' : repeatMode === 'TRACK' ? 'OFF' : 'ALBUM';
                  setRepeatMode(nextRepeat);
                  triggerToast(
                    nextRepeat === 'ALBUM'
                      ? 'Répétition : Album Y'
                      : nextRepeat === 'TRACK'
                      ? 'Répétition : Piste actuelle (1)'
                      : 'Répétition désactivée'
                  );
                }}
                className={`relative p-2 rounded-full transition-all ${
                  repeatMode !== 'OFF'
                    ? 'text-amber-400 bg-amber-400/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Mode de répétition"
              >
                <Repeat className="w-4 h-4" />
                {repeatMode === 'TRACK' && (
                  <span className="absolute top-1 right-1 text-[8px] font-bold bg-amber-400 text-black w-3 h-3 rounded-full flex items-center justify-center">
                    1
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Barre d'actions secondaires épurée sous le dock */}
          <div className="flex items-center justify-between px-4 mt-3 text-[11px] text-zinc-400">
            <button
              onClick={() => setShowMatrixModal(true)}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>File 2D ({currentFeed.tracks.length} titres)</span>
            </button>

            <span className="text-[10px] text-zinc-500 font-medium">
              Glissez la pochette ↔ ou ↕
            </span>

            <button
              onClick={() => setShowLyricsModal(true)}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mic2 className="w-3.5 h-3.5" />
              <span>Paroles & Crédits</span>
            </button>
          </div>
        </div>

        {/* ==================================================================
            MODALE 1 : VUE HÉLICOPTÈRE DE LA MATRICE 2D (AXE X / AXE Y)
           ================================================================== */}
        {showMatrixModal && (
          <div className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-2xl p-5 flex flex-col justify-between animate-fadeIn">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Grid className="w-4 h-4 text-amber-400" />
                    <span>Carte Spatiale 2D (X × Y)</span>
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Colonnes = Flux d'univers (Axe X) • Lignes = Pistes d'album (Axe Y)
                  </p>
                </div>
                <button
                  onClick={() => setShowMatrixModal(false)}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold"
                >
                  Fermer
                </button>
              </div>

              {/* Grille interactive X / Y */}
              <div className="mt-4 grid grid-cols-4 gap-2.5">
                {MUSIC_MATRIX.map((feed, colIdx) => {
                  const isCurrentCol = colIdx === xIndex;
                  return (
                    <div key={feed.id} className="flex flex-col gap-2">
                      {/* En-tête de colonne (Axe X) */}
                      <button
                        onClick={() => {
                          setXIndex(colIdx);
                          setYIndex(0);
                          setCurrentTime(0);
                          setShowMatrixModal(false);
                        }}
                        className={`p-2 rounded-2xl border text-left transition-all ${
                          isCurrentCol
                            ? 'bg-white/15 border-white/40'
                            : 'bg-white/[0.04] border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <img
                          src={feed.coverUrl}
                          alt={feed.releaseTitle}
                          className="w-full h-14 object-cover rounded-xl mb-1.5"
                        />
                        <p className="text-[10px] font-bold text-white truncate">
                          {feed.releaseTitle}
                        </p>
                        <p className="text-[9px] text-zinc-400 truncate">{feed.artist}</p>
                      </button>

                      {/* Cellules verticales (Pistes de l'album sur l'Axe Y) */}
                      <div className="flex flex-col gap-1.5">
                        {feed.tracks.map((track, rowIdx) => {
                          const isActiveCell = isCurrentCol && rowIdx === safeYIndex;
                          return (
                            <button
                              key={track.id}
                              onClick={() => {
                                setXIndex(colIdx);
                                setYIndex(rowIdx);
                                setCurrentTime(0);
                                setIsPlaying(true);
                                setShowMatrixModal(false);
                                triggerToast(`Saut matriciel → ${track.title}`);
                              }}
                              className={`p-2 rounded-xl border text-left transition-all ${
                                isActiveCell
                                  ? 'text-black font-bold shadow-lg scale-[1.03]'
                                  : 'bg-zinc-900/90 border-white/10 text-zinc-300 hover:border-white/30'
                              }`}
                              style={
                                isActiveCell
                                  ? {
                                      backgroundColor: feed.accent,
                                      borderColor: '#ffffff'
                                    }
                                  : {}
                              }
                            >
                              <div className="text-[9px] opacity-75 font-mono">
                                Y{rowIdx + 1} • {formatTime(track.duration)}
                              </div>
                              <div className="text-[10px] leading-tight line-clamp-2 mt-0.5">
                                {track.title}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 text-xs text-zinc-300 flex items-center justify-between">
              <span>Position actuelle :</span>
              <span className="font-mono font-bold text-amber-400">
                Flux X{xIndex + 1} ({currentFeed.releaseTitle}) × Piste Y{safeYIndex + 1}
              </span>
            </div>
          </div>
        )}

        {/* ==================================================================
            MODALE 2 : PAROLES SYNCHRONISÉES & CRÉDITS (Sans conflit de swipe)
           ================================================================== */}
        {showLyricsModal && (
          <div className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-2xl p-6 flex flex-col justify-between animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src={currentFeed.coverUrl}
                  alt={currentTrack.title}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div>
                  <h3 className="text-sm font-bold text-white">{currentTrack.title}</h3>
                  <p className="text-xs text-zinc-400">
                    {currentFeed.artist} • Piste {safeYIndex + 1}/{currentFeed.tracks.length}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLyricsModal(false)}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold"
              >
                Fermer
              </button>
            </div>

            {/* Paroles interactives (cliquer sur une ligne déplace le curseur audio !) */}
            <div className="my-auto py-6 space-y-4 overflow-y-auto max-h-[520px] pr-1">
              {currentTrack.lyrics.map((line, idx) => {
                const isCurrent = idx === activeLyricIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentTime(line.time);
                      setIsPlaying(true);
                    }}
                    className={`w-full text-left transition-all duration-300 rounded-2xl p-3 ${
                      isCurrent
                        ? 'bg-white/10 border border-white/15 scale-[1.02]'
                        : 'opacity-45 hover:opacity-80'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-zinc-400 block mb-1">
                      {formatTime(line.time)}
                    </span>
                    <p
                      className={`text-base font-bold leading-snug ${
                        isCurrent ? 'text-white' : 'text-zinc-300'
                      }`}
                      style={isCurrent ? { color: currentFeed.accent } : {}}
                    >
                      {line.text}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Crédits & ADN Technique */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-zinc-500 block text-[10px]">BPM</span>
                <span className="font-bold text-zinc-200">{currentTrack.bpm}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Tonalité</span>
                <span className="font-bold text-zinc-200">{currentTrack.keySignature}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Audio</span>
                <span className="font-bold text-amber-400">{currentTrack.quality}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          PANNEAU LATÉRAL : SIMULATEUR DE GESTES & ARCHITECTURE UX V2
         ==================================================================== */}
      <div className="w-full max-w-[460px] bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-[36px] p-6 flex flex-col gap-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block">
              Lead Product Design • Prototype V2
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Contrôleur Spatial & Améliorations UX
            </h2>
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Interactif</span>
          </div>
        </div>

        {/* Pavé directionnel 2D rapide pour tester sans souris/tactile */}
        <div className="p-4 rounded-3xl bg-zinc-950/80 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Testeur de Swipes 2D (ou glissez la pochette)
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Clavier : ← → ↑ ↓
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
            <div />
            <button
              onClick={() => navigateY(-1)}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 active:scale-95 transition-all"
            >
              <ChevronUp className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-semibold mt-0.5">Piste Y-1</span>
            </button>
            <div />

            <button
              onClick={() => navigateX(-1)}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-semibold mt-0.5">Flux X-1</span>
            </button>

            <button
              onClick={() => setShowMatrixModal(true)}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 active:scale-95 transition-all"
            >
              <Grid className="w-4 h-4" />
              <span className="text-[10px] font-bold mt-0.5">Carte 2D</span>
            </button>

            <button
              onClick={() => navigateX(1)}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-semibold mt-0.5">Flux X+1</span>
            </button>

            <div />
            <button
              onClick={() => navigateY(1)}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 active:scale-95 transition-all"
            >
              <span className="text-[10px] font-semibold mb-0.5">Piste Y+1</span>
              <ChevronDown className="w-4 h-4 text-amber-400" />
            </button>
            <div />
          </div>
        </div>

        {/* Liste interactive des pistes de l'album courant (Axe Y en direct) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300">
              Profondeur verticale active ({currentFeed.releaseTitle})
            </span>
            <span className="text-zinc-400 font-mono text-[11px]">
              {currentFeed.tracks.length} titre{currentFeed.tracks.length > 1 ? 's' : ''} sur l'Axe Y
            </span>
          </div>

          <div className="space-y-1.5 max-h-[185px] overflow-y-auto pr-1">
            {currentFeed.tracks.map((t, idx) => {
              const isCurrent = idx === safeYIndex;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setYIndex(idx);
                    setCurrentTime(0);
                    setIsPlaying(true);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-white/12 border-white/30 text-white'
                      : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={
                        isCurrent
                          ? { backgroundColor: currentFeed.accent, color: '#000' }
                          : { backgroundColor: 'rgba(255,255,255,0.06)' }
                      }
                    >
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-zinc-100 truncate">{t.title}</p>
                      <p className="text-[10px] text-zinc-400">{t.feat}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 font-mono">
                      {t.bpm} BPM
                    </span>
                    <span className="text-xs font-mono">{formatTime(t.duration)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Synthèse des innovations UX intégrées au prototype */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 text-[11px]">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Affordance de Pile 3D
            </p>
            <p className="text-zinc-400 mt-1 leading-relaxed">
              Tranches d'album en haut/bas + jauge verticale sur la pochette (disparaît automatiquement sur un Single 1/1).
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Waveform & Drop Marker
            </p>
            <p className="text-zinc-400 mt-1 leading-relaxed">
              Proportion temporelle exacte (1:56 = 64%) et coloration du refrain pour sauter au moment fort en 1 clic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}