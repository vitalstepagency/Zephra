import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

// Pricing configuration
export const PRICING_PLANS = {
  starter: {
    name: 'Starter',
    description: 'Perfect for small businesses getting started',
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER!,
    features: [
      'Up to 5 campaigns',
      'Basic analytics',
      'Email support',
      '1,000 contacts',
      'Basic templates'
    ],
    limits: {
      campaigns: 5,
      contacts: 1000,
      emailsPerMonth: 5000,
      funnels: 3
    }
  },
  pro: {
    name: 'Pro',
    description: 'For growing businesses that need more power',
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO!,
    features: [
      'Unlimited campaigns',
      'Advanced analytics',
      'Priority support',
      '10,000 contacts',
      'Custom templates',
      'A/B testing',
      'Automation workflows'
    ],
    limits: {
      campaigns: -1, // unlimited
      contacts: 10000,
      emailsPerMonth: 50000,
      funnels: 25
    }
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    price: 299,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE!,
    features: [
      'Everything in Pro',
      'White-label solution',
      'Dedicated support',
      'Unlimited contacts',
      'Custom integrations',
      'Advanced reporting',
      'Team collaboration',
      'API access'
    ],
    limits: {
      campaigns: -1, // unlimited
      contacts: -1, // unlimited
      emailsPerMonth: -1, // unlimited
      funnels: -1 // unlimited
    }
  }
} as const

export type PricingPlan = keyof typeof PRICING_PLANS

// Helper function to get plan details
export const getPlanDetails = (plan: PricingPlan) => {
  return PRICING_PLANS[plan]
}

// Helper function to check if user has access to feature
export const hasFeatureAccess = (userPlan: PricingPlan, feature: string) => {
  const plan = getPlanDetails(userPlan)
  return (plan.features as readonly string[]).some(f => f === feature)
}

// Helper function to check usage limits
export const checkUsageLimit = (userPlan: PricingPlan, resource: 'campaigns' | 'contacts' | 'emailsPerMonth' | 'funnels', currentUsage: number) => {
  const plan = getPlanDetails(userPlan)
  const limit = plan.limits[resource]
  
  if (limit === -1) return { allowed: true, remaining: -1 } // unlimited
  
  return {
    allowed: currentUsage < limit,
    remaining: Math.max(0, limit - currentUsage),
    limit
  }
}

export function getPlanByTier(tier: string) {
  return PRICING_PLANS[tier as PricingPlan] || null
}

export function checkFeatureAccess(
  subscriptionTier: string,
  feature: string
): boolean {
  const plan = getPlanByTier(subscriptionTier)
  if (!plan) return false
  
  return (plan.features as readonly string[]).some(f => f === feature)
}