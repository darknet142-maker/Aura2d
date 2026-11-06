/**
 * Ingénierie du Mouvement (Emil Kowalski Philosophy)
 * Courbes de ressort réalistes (< 300ms), zéro ease-in, zéro scale(0).
 */
import type { Transition, Variants } from 'motion/react';

export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  duration: 0.18,
  bounce: 0.12,
};

export const SPRING_ENTRANCE: Transition = {
  type: 'spring',
  duration: 0.24,
  bounce: 0.08,
};

export const SPRING_DRAWER: Transition = {
  type: 'spring',
  duration: 0.28,
  bounce: 0.05,
};

export const SUBTLE_ENTRANCE_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 6,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRING_ENTRANCE,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: { duration: 0.16, ease: [0.23, 1, 0.32, 1] },
  },
};

export const INTERACTIVE_CARD_MOTION = {
  whileHover: { y: -2, scale: 1.005 },
  whileTap: { scale: 0.985 },
  transition: SPRING_SNAPPY,
} as const;

export const INTERACTIVE_BUTTON_MOTION = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.97 },
  transition: SPRING_SNAPPY,
} as const;

