'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, CreditCard, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { PRICING_PLANS } from '@/lib/stripe/config'
import { assertExists } from '@/lib/utils'
import { normalizePlanId } from '@/lib/stripe/helpers'

interface CheckoutContentProps {
  user: any
  planId: string | null
  billingFrequency: string | null
}

// Import the Plan type from config.ts
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

interface PricingPlanWithId {
  id: string;
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
  popular?: boolean;
}

// Check if PRICING_PLANS properties exist
if (!PRICING_PLANS.starter) throw new Error('Starter plan is missing');
if (!PRICING_PLANS.pro) throw new Error('Pro plan is missing');
if (!PRICING_PLANS.enterprise) throw new Error('Enterprise plan is missing');

// Create plan objects with id
const pricingPlans: Record<string, PricingPlanWithId> = {
  starter: {
    id: 'starter',
    name: PRICING_PLANS.starter.name,
    description: PRICING_PLANS.starter.description,
    monthlyPrice: PRICING_PLANS.starter.monthlyPrice,
    yearlyPrice: PRICING_PLANS.starter.yearlyPrice,
    priceIds: PRICING_PLANS.starter.priceIds,
    features: PRICING_PLANS.starter.features,
    detailedFeatures: PRICING_PLANS.starter.detailedFeatures,
    limits: PRICING_PLANS.starter.limits,
    popular: PRICING_PLANS.starter.popular || false
  },
  pro: {
    id: 'pro',
    name: PRICING_PLANS.pro.name,
    description: PRICING_PLANS.pro.description,
    monthlyPrice: PRICING_PLANS.pro.monthlyPrice,
    yearlyPrice: PRICING_PLANS.pro.yearlyPrice,
    priceIds: PRICING_PLANS.pro.priceIds,
    features: PRICING_PLANS.pro.features,
    detailedFeatures: PRICING_PLANS.pro.detailedFeatures,
    limits: PRICING_PLANS.pro.limits,
    popular: PRICING_PLANS.pro.popular || false
  },
  professional: {
    id: 'professional',
    name: PRICING_PLANS.pro.name,
    description: PRICING_PLANS.pro.description,
    monthlyPrice: PRICING_PLANS.pro.monthlyPrice,
    yearlyPrice: PRICING_PLANS.pro.yearlyPrice,
    priceIds: PRICING_PLANS.pro.priceIds,
    features: PRICING_PLANS.pro.features,
    detailedFeatures: PRICING_PLANS.pro.detailedFeatures,
    limits: PRICING_PLANS.pro.limits,
    popular: PRICING_PLANS.pro.popular || false
  },
  enterprise: {
    id: 'enterprise',
    name: PRICING_PLANS.enterprise.name,
    description: PRICING_PLANS.enterprise.description,
    monthlyPrice: PRICING_PLANS.enterprise.monthlyPrice,
    yearlyPrice: PRICING_PLANS.enterprise.yearlyPrice,
    priceIds: PRICING_PLANS.enterprise.priceIds,
    features: PRICING_PLANS.enterprise.features,
    detailedFeatures: PRICING_PLANS.enterprise.detailedFeatures,
    limits: PRICING_PLANS.enterprise.limits,
    popular: PRICING_PLANS.enterprise.popular || false
  },
  elite: {
    id: 'elite',
    name: PRICING_PLANS.enterprise.name,
    description: PRICING_PLANS.enterprise.description,
    monthlyPrice: PRICING_PLANS.enterprise.monthlyPrice,
    yearlyPrice: PRICING_PLANS.enterprise.yearlyPrice,
    priceIds: PRICING_PLANS.enterprise.priceIds,
    features: PRICING_PLANS.enterprise.features,
    detailedFeatures: PRICING_PLANS.enterprise.detailedFeatures,
    limits: PRICING_PLANS.enterprise.limits,
    popular: PRICING_PLANS.enterprise.popular || false
  }
}

export function CheckoutContent({ user, planId, billingFrequency }: CheckoutContentProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Set default plan and billing frequency if not provided
  const defaultPlanId = planId || 'pro'
  const defaultBillingFrequency = billingFrequency || 'monthly'
  
  // Get plan ID from URL params or localStorage if not provided as prop
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    // If planId prop is provided, use it (normalized)
    if (planId) return normalizePlanId(planId)
    
    // Otherwise check URL params and localStorage
    if (typeof window !== 'undefined') {
      // First try URL params
      const params = new URLSearchParams(window.location.search)
      const planFromUrl = params.get('plan')
      if (planFromUrl) return normalizePlanId(planFromUrl)
      
      // Then try localStorage
      const storedPlan = localStorage.getItem('selected_plan')
      if (storedPlan) return normalizePlanId(storedPlan)
      
      // Check old format
      const oldStoredPlan = localStorage.getItem('selectedPlan')
      if (oldStoredPlan) {
        const normalizedPlan = normalizePlanId(oldStoredPlan)
        localStorage.setItem('selected_plan', normalizedPlan)
        localStorage.removeItem('selectedPlan')
        return normalizedPlan
      }
    }
    
    return 'pro' // Default to pro plan
  })
  
  // Initialize selected plan and billing frequency
  const [selectedPlan, setSelectedPlan] = useState<PricingPlanWithId>(() => {
    const validPlanKeys = Object.keys(pricingPlans) as (keyof typeof pricingPlans)[];
    const planKey: keyof typeof pricingPlans = validPlanKeys.includes(selectedPlanId as keyof typeof pricingPlans) 
      ? (selectedPlanId as keyof typeof pricingPlans) 
      : 'pro';
    return pricingPlans[planKey]!;
  })
  
  const [selectedBillingFrequency, setBillingFrequency] = useState<'monthly' | 'yearly'>
    (defaultBillingFrequency === 'yearly' ? 'yearly' : 'monthly')
  
  // Store selected plan and frequency in localStorage for persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (defaultPlanId) localStorage.setItem('selectedPlan', defaultPlanId)
      if (defaultBillingFrequency) localStorage.setItem('billingFrequency', defaultBillingFrequency)
    }
  }, [defaultPlanId, defaultBillingFrequency])
  
  // Helper functions for pricing
  const getCurrentPrice = () => selectedBillingFrequency === 'monthly' ? 
    selectedPlan.monthlyPrice : selectedPlan.yearlyPrice
  
  const getCurrentPriceId = () => selectedBillingFrequency === 'monthly' ? 
    selectedPlan.priceIds.monthly : selectedPlan.priceIds.yearly
  
  const handleSecureCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // User should already be authenticated at this point
    if (!user) {
      console.log('User not authenticated, redirecting to sign up')
      
      // Store plan selection for after authentication
      localStorage.setItem('selected_plan', selectedPlan.id)
      localStorage.setItem('selected_frequency', selectedBillingFrequency)
      
      // Set redirect flag but clear any existing redirect count to start fresh
      localStorage.setItem('redirect_to_checkout', 'true')
      localStorage.setItem('redirectToCheckout', 'true') // Set both formats for compatibility
      localStorage.removeItem('redirectCount')
      
      const params = new URLSearchParams({
        plan: selectedPlan.id,
        frequency: selectedBillingFrequency,
        redirectToCheckout: 'true'
      })
      console.log(`Redirecting to sign up page: /auth/signup?${params.toString()}`)
      
      // Use window.location for a hard redirect to ensure fresh page load
      window.location.href = `/auth/signup?${params.toString()}`
      return
    }
    
    setIsLoading(true)
    console.log('Starting secure checkout process')
    
    try {
      // Reset any redirect count to prevent loops
      localStorage.removeItem('redirectCount')
      
      // Validate priceId before sending
      const currentPriceId = getCurrentPriceId()
      if (!currentPriceId) {
        throw new Error(`No price ID found for plan: ${selectedPlan.id}`)
      }

      console.log('Creating checkout session with:', {
        priceId: currentPriceId,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        billingFrequency: selectedBillingFrequency
      })
      
      // Store user email, name, and billing frequency for session restoration after payment
      if (user) {
        localStorage.setItem('checkout_email', user.email)
        localStorage.setItem('checkout_name', user.name || user.email.split('@')[0])
        localStorage.setItem('billing_frequency', selectedBillingFrequency)
        localStorage.setItem('selected_plan', selectedPlan.id)
      }

      // Now create the checkout session (user is authenticated)
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          name: user.name || user.email.split('@')[0],
          planId: selectedPlan.id,
          priceId: currentPriceId,
          userId: user.id || '',
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout`
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response from server:', errorText)
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || 'Failed to create checkout session')
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
      }
      
      const data = await response.json().catch(err => {
        console.error('Error parsing JSON response:', err)
        throw new Error('Invalid response from server')
      })
      
      console.log('Checkout session created successfully:', data)
      
      // Store session ID for verification after payment
      if (data.sessionId) {
        localStorage.setItem('stripe_checkout_session_id', data.sessionId)
      }
      
      // Redirect to Stripe Checkout
      if (data.url) {
        // Only clear plan selection parameters after we have the URL
        // to prevent redirection loops
        localStorage.removeItem('selected_plan')
        localStorage.removeItem('selected_frequency')
        localStorage.removeItem('redirect_to_checkout')
        localStorage.removeItem('selectedPlan')
        localStorage.removeItem('billingFrequency')
        localStorage.removeItem('redirectToCheckout')
        
        console.log('Redirecting to Stripe checkout:', data.url)
        // Use a hard redirect to Stripe
        window.location.href = data.url
      } else {
        console.error('Missing URL in checkout response:', data)
        throw new Error('No checkout URL returned from Stripe')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setErrors({
        checkout: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
      
      // Show a toast notification for better user feedback
      if (typeof window !== 'undefined' && window.document) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        alert(`Checkout error: ${errorMessage}. Please try again or contact support.`);
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column - Plan details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Your Plan</h2>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium">{selectedPlan.name}</span>
              <span className="text-xl font-bold">
                ${getCurrentPrice()}
                <span className="text-sm font-normal text-gray-500">
                  /{selectedBillingFrequency === 'monthly' ? 'mo' : 'yr'}
                </span>
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedPlan.description}</p>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Plan Features</h3>
              <ul className="space-y-2">
                {selectedPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Right column - Checkout form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Secure Checkout</h2>
          
          {errors.checkout && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {errors.checkout}
            </div>
          )}
          
          <form onSubmit={handleSecureCheckout}>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium">Total</span>
                <span className="text-2xl font-bold">
                  ${getCurrentPrice()}
                  <span className="text-sm font-normal text-gray-500">
                    /{selectedBillingFrequency === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </span>
              </div>
              
              <div className="flex flex-col items-center space-y-2 mb-4">
            <div className="flex items-center justify-center space-x-2">
              <Lock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Secure checkout powered by Stripe</span>
            </div>
            <div className="text-center text-sm text-indigo-500 font-medium">
              Your 14-day free trial starts today
            </div>
          </div>
              
              <button
                id="checkout-button"
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Proceed to Payment
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm text-gray-500">Secure Payment</span>
              </div>
              <div className="flex items-center">
                <Lock className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm text-gray-500">SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}