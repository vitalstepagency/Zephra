import { Variants } from 'framer-motion';
import { D, E, STAGGER, DIST } from './tokens';

export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: DIST.md,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: D.md / 1000,
      ease: E.out,
    },
  },
};

export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: D.md / 1000,
      ease: E.out,
    },
  },
};

export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -DIST.lg,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: D.md / 1000,
      ease: E.out,
    },
  },
};

export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: DIST.lg,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: D.md / 1000,
      ease: E.out,
    },
  },
};

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: D.md / 1000,
      ease: E.out,
    },
  },
};

export const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER,
    },
  },
};

export const clipReveal: Variants = {
  hidden: {
    clipPath: 'inset(0 100% 0 0)',
  },
  visible: {
    clipPath: 'inset(0 0% 0 0)',
    transition: {
      duration: D.lg / 1000,
      ease: E.out,
    },
  },
};

export const blurIn: Variants = {
  hidden: {
    opacity: 0,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: D.md / 1000,
      ease: E.out,
    },
  },
};