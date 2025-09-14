import Stripe from 'stripe'

// Function to get Stripe instance (prevents build-time execution)
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
    typescript: true,
  })
}

// Pricing configuration
// Define the type for each plan
type Plan = {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  priceIds: {
    monthly: string;
    yearly: string;
  };
  features: string[];
  detailedFeatures: Record<string, {
    title: string;
    description: string;
    items: string[];
  }>;
  limits: {
    campaigns: number;
    contacts: number;
    emailsPerMonth: number;
    funnels: number;
  };
  aliases?: string[];
  popular?: boolean;
};

export const PRICING_PLANS: Record<string, Plan> = {
  starter: {
    name: 'Basic',
    description: 'Perfect for solo entrepreneurs ready to automate',
    monthlyPrice: 197,
    yearlyPrice: 1970,
    priceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_MONTHLY!,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_YEARLY!
    },
    features: [
      '90-Day Marketing Blueprint with step-by-step implementation guide',
      '25 high-converting ad variations with proven templates',
      'Complete sales funnel with 7-email sequence',
      'High-converting landing page templates',
      'Lead magnets that attract ideal customers',
      'Priority chat support for perfect setup'
    ],
    detailedFeatures: {
      blueprint: {
        title: '90-Day Marketing Blueprint',
        description: 'Your complete roadmap to marketing success - no guesswork, just results',
        items: [
          'Step-by-step implementation guide with weekly milestones',
          'Proven campaign templates that convert at 15%+ rates',
          'Monthly optimization checkpoints to maximize ROI'
        ]
      },
      content: {
        title: 'High-Converting Ad Arsenal',
        description: '25 battle-tested ad variations that stop the scroll and drive action',
        items: [
          'High-retention video scripts with shot-by-shot breakdowns',
          'Scroll-stopping headlines that generate 3x more clicks',
          'Platform-specific variations for Facebook, Instagram & Google',
          'A/B testing framework to identify your best performers'
        ]
      },
      automation: {
        title: 'Set-and-Forget Sales System',
        description: 'Complete funnel that nurtures leads while you sleep',
        items: [
          '7-email sequence that converts 25% of leads into customers',
          'High-converting landing page templates with proven copy',
          'Lead magnets that attract your ideal customers',
          'Priority support to get everything set up perfectly'
        ]
      }
    },
    limits: {
      campaigns: 5,
      contacts: 1000,
      emailsPerMonth: 5000,
      funnels: 3
    },
    aliases: ['basic'] // Add aliases for plan ID normalization
  },
  pro: {
    name: 'Pro',
    description: 'Perfect for growing businesses that need results',
    monthlyPrice: 297,
    yearlyPrice: 2970,
    priceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY!,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY!
    },
    popular: true,
    features: [
      'Everything in Basic +',
      'Advanced Market Intelligence with 3 detailed customer personas',
      '100 unique ad variations across all major platforms',
      '5 custom sales funnels with 12-email nurture sequences',
      'SMS campaigns for immediate engagement',
      'Weekly strategy calls with performance optimization'
    ],
    detailedFeatures: {
      intelligence: {
        title: 'Advanced Market Intelligence',
        description: 'Deep competitor analysis that reveals exactly how to dominate your market',
        items: [
          '3 detailed customer personas with psychological triggers',
          'Competitor weakness analysis with positioning strategies',
          'Market gap identification for untapped opportunities'
        ]
      },
      domination: {
        title: 'Multi-Platform Ad Domination',
        description: '100 unique ad variations that flood every platform with your message',
        items: [
          'Platform-optimized creatives for Facebook, Instagram, Google & YouTube',
          'Weekly creative refreshes to prevent ad fatigue',
          'Advanced targeting strategies for maximum reach',
          'Cross-platform retargeting sequences'
        ]
      },
      ecosystem: {
        title: 'Complete Sales Ecosystem',
        description: '5 custom funnels that convert traffic into paying customers automatically',
        items: [
          'High-converting landing pages with conversion tracking',
          '12-email nurture sequences with 90%+ open rates',
          'SMS campaigns for immediate engagement',
          'Weekly performance optimization and strategy calls'
        ]
      }
    },
    limits: {
      campaigns: -1, // unlimited
      contacts: 10000,
      emailsPerMonth: 50000,
      funnels: 25
    },
    aliases: ['professional'] // Add aliases for plan ID normalization
  },
  enterprise: {
    name: 'Elite',
    description: 'Perfect for established businesses ready to dominate',
    monthlyPrice: 497,
    yearlyPrice: 4970,
    priceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE_MONTHLY!,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE_YEARLY!
    },
    features: [
      'Everything in Pro +',
      'Enterprise Market Domination with 5 customer segments',
      'Unlimited ad creatives across all platforms including LinkedIn & TikTok',
      'AI-Powered Marketing Intelligence with custom models',
      'Dedicated senior marketing strategist',
      'Weekly strategy calls with direct founder access'
    ],
    detailedFeatures: {
      domination: {
        title: 'Enterprise Market Domination',
        description: 'Complete competitive landscape control with brand authority campaigns',
        items: [
          '5 detailed customer segments with psychological profiling',
          'Competitive landscape mapping and positioning strategy',
          'Brand authority campaigns that establish market leadership',
          'Industry-specific growth opportunity identification'
        ]
      },
      creative: {
        title: 'Unlimited Creative Domination',
        description: 'Flood every platform with fresh, high-converting content daily',
        items: [
          'Unlimited ad creatives across all major platforms including LinkedIn & TikTok',
          'Daily creative optimization and performance enhancement',
          'Advanced audience research and custom targeting strategies',
          'Cross-platform retargeting and lookalike audience scaling'
        ]
      },
      intelligence: {
        title: 'AI-Powered Marketing Intelligence',
        description: 'Predictive modeling that optimizes campaigns before you even launch',
        items: [
          'Custom AI models trained on your business data',
          'Predictive campaign performance modeling',
          'Automated optimization based on real-time data',
          'Executive-level reporting with actionable insights'
        ]
      },
      support: {
        title: 'Executive-Level Support',
        description: 'Direct access to senior strategists and founder-level expertise',
        items: [
          'Dedicated senior marketing strategist assigned to your account',
          'Weekly strategy calls with direct founder access',
          'Custom business integrations and technical implementation'
        ]
      }
    },
    limits: {
      campaigns: -1, // unlimited
      contacts: -1, // unlimited
      emailsPerMonth: -1, // unlimited
      funnels: -1 // unlimited
    },
    aliases: ['elite'] // Add aliases for plan ID normalization
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
  return plan?.features ? (plan.features as readonly string[]).some(f => f === feature) : false
}

// Helper function to check usage limits
export const checkUsageLimit = (userPlan: PricingPlan, resource: 'campaigns' | 'contacts' | 'emailsPerMonth' | 'funnels', currentUsage: number) => {
  const plan = getPlanDetails(userPlan)
  if (!plan) return { allowed: false, remaining: 0 } // Plan not found
  
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