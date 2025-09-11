import { useEffect, useRef, useState } from 'react';
import { useInView, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { E } from './tokens';

interface UseInViewOnceOptions {
  rootMargin?: string;
  threshold?: number;
}

export function useInViewOnce(options: UseInViewOnceOptions = {}) {
  const ref = useRef(null);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const isInView = useInView(ref, {
    margin: options.rootMargin || '-10% 0px -10% 0px',
    amount: options.threshold || 0.1,
    once: true,
  });

  useEffect(() => {
    if (isInView && !hasBeenInView) {
      setHasBeenInView(true);
    }
  }, [isInView, hasBeenInView]);

  return { ref, isInView: hasBeenInView };
}

export function useParallax(range: [number, number] = [-20, 20]) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], range);
  return y;
}

interface UseCounterOptions {
  from: number;
  to: number;
  duration?: number;
}

export function useCounter({ from, to, duration = 2000 }: UseCounterOptions) {
  const [count, setCount] = useState(from);
  const [isAnimating, setIsAnimating] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animate = () => {
    if (prefersReducedMotion) {
      setCount(to);
      return;
    }

    setIsAnimating(true);
    const startTime = Date.now();
    const startValue = from;
    const endValue = to;
    const difference = endValue - startValue;

    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (difference * easedProgress));
      
      setCount(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(updateCount);
  };

  return { count, animate, isAnimating };
}

export function useScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  
  return scaleX;
}

export function useMagneticHover(strength: number = 0.3) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    
    x.set(deltaX);
    y.set(deltaY);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);
  
  return { ref, x, y };
}