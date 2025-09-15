import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PRICING_PLANS } from './stripe/config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a plan ID to ensure it matches one of the valid plan IDs in the system.
 * Handles aliases and case insensitivity.
 * 
 * @param planId - The plan ID to normalize
 * @returns The normalized plan ID that matches a key in PRICING_PLANS
 */
export function normalizePlanId(planId: string): string {
  if (!planId) return 'pro' // Default to pro plan if no ID provided
  
  const normalizedInput = planId.toLowerCase().trim()
  
  // Direct match with a plan ID
  if (PRICING_PLANS[normalizedInput]) {
    return normalizedInput
  }
  
  // Check for aliases
  for (const [id, plan] of Object.entries(PRICING_PLANS)) {
    if (plan.aliases?.includes(normalizedInput) || 
        plan.name.toLowerCase() === normalizedInput) {
      return id
    }
  }
  
  // Fallback to pro plan if no match found
  return 'pro'
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercentage(num: number, decimals = 1): string {
  return `${(num * 100).toFixed(decimals)}%`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Asserts that a value exists (is not null or undefined)
 * Useful for TypeScript to narrow types
 */
export function assertExists<T>(value: T | null | undefined, message = 'Value is null or undefined'): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}