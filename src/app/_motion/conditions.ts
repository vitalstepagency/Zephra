export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getReducedMotionVariant<T>(normalVariant: T, reducedVariant: T): T {
  return prefersReducedMotion() ? reducedVariant : normalVariant;
}

export function withReducedMotion(
  variants: Record<string, any>,
  staticVariants?: Record<string, any>
): Record<string, any> {
  if (prefersReducedMotion()) {
    const reduced = { ...variants };
    Object.keys(reduced).forEach(key => {
      if (staticVariants && staticVariants[key]) {
        reduced[key] = staticVariants[key];
      } else {
        // Remove animations but keep final state
        const variant = reduced[key];
        if (variant && typeof variant === 'object' && 'transition' in variant) {
          reduced[key] = {
            ...variant,
            transition: { duration: 0 }
          };
        }
      }
    });
    return reduced;
  }
  return variants;
}

export const reducedMotionConfig = {
  transition: { duration: 0 },
  animate: false,
};