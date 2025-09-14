'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, CreditCard, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { PRICING_PLANS } from '@/lib/stripe/config'

interface CheckoutContentProps {
  user: any
  planId: string | null
  billingFrequency: string | null
}

interface PricingPlan {
  id: string
  name: string
  monthlyPrice: number
  yearlyPrice: number
  description: string
  features: readonly string[]
  popular?: boolean
  priceIds: {
    readonly monthly: string
    readonly yearly: string
  }
  detailedFeatures?: any
  limits?: any
}

const pricingPlans: Record<string, PricingPlan> = {
  starter: { ...PRICING_PLANS.starter, id: 'starter' },
  pro: { ...PRICING_PLANS.pro, id: 'pro' },
  professional: { ...PRICING_PLANS.pro, id: 'professional' }, // alias for pro
  enterprise: { ...PRICING_PLANS.enterprise, id: 'enterprise' },
  elite: { ...PRICING_PLANS.enterprise, id: 'elite' } // alias for enterprise
}

export function CheckoutContent({ user, planId, billingFrequency }: CheckoutContentProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Set default plan and billing frequency if not provided
  const defaultPlanId = planId || 'pro'
  const defaultBillingFrequency = billingFrequency || 'monthly'
  
  // Initialize selected plan and billing frequency
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(() => {
    const validPlanKeys = Object.keys(pricingPlans) as (keyof typeof pricingPlans)[]
    const planKey: keyof typeof pricingPlans = validPlanKeys.includes(defaultPlanId as keyof typeof pricingPlans) 
      ? (defaultPlanId as keyof typeof pricingPlans) 
      : 'pro'
    return pricingPlans[planKey]!
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
      const params = new URLSearchParams({
        plan: selectedPlan.id,
        billing: selectedBillingFrequency,
        redirectToCheckout: 'true'
      })
      router.push(`/plans/${selectedPlan.id}?${params.toString()}`)
      return
    }
    
    setIsLoading(true)
    
    try {
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
          firstName: user.name?.split(' ')[0] || user.email.split('@')[0],
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          planId: selectedPlan.id,
          priceId: currentPriceId
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }
      
      // Store session ID for verification after payment
      if (data.id) {
        localStorage.setItem('checkout_session_id', data.id)
      }
      
      // Clear plan selection parameters to prevent redirection loops
      localStorage.removeItem('selectedPlan')
      localStorage.removeItem('billingFrequency')
      localStorage.removeItem('redirectToCheckout')
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setErrors({
        checkout: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
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
              
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Lock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">Secure checkout powered by Stripe</span>
              </div>
              
              <button
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