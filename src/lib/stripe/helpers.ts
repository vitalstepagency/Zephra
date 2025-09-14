import { PRICING_PLANS, type PricingPlan } from './config'

/**
 * Normalize a plan ID to handle aliases
 * This ensures that plan aliases like 'professional' or 'elite' are properly mapped
 * to their canonical IDs ('pro' and 'enterprise' respectively)
 */
export function normalizePlanId(planId: string): keyof typeof PRICING_PLANS | 'starter' {
  // Default to 'starter' if no plan ID is provided
  if (!planId) return 'starter'
  
  // Check if the plan ID is already a valid key in PRICING_PLANS
  if (planId in PRICING_PLANS) {
    return planId as keyof typeof PRICING_PLANS
  }
  
  // Check if the plan ID is an alias for any plan
  for (const [key, plan] of Object.entries(PRICING_PLANS)) {
    if (plan.aliases && plan.aliases.includes(planId)) {
      return key as keyof typeof PRICING_PLANS
    }
  }
  
  // If no match is found, default to 'starter'
  return 'starter'
}

/**
 * Get the price ID for a given plan and billing frequency
 */
export function getPriceId(plan: string, frequency: 'monthly' | 'yearly'): string {
  const normalizedPlan = normalizePlanId(plan) as keyof typeof PRICING_PLANS
  const pricingPlan = PRICING_PLANS[normalizedPlan]
  if (!pricingPlan) {
    throw new Error(`Invalid plan: ${plan}`)
  }
  
  return frequency === 'monthly' ? pricingPlan.monthlyPriceId : pricingPlan.yearlyPriceId
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(price)
}