'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { getCurrentUser } from '@/lib/supabase/client'
import { CheckoutContent } from '@/components/checkout/checkout-content'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // Get plan and billing from URL params
  const [planParam, setPlanParam] = useState<string | null>(null)
  const [billingParam, setBillingParam] = useState<string | null>(null)
  
  // Set plan and billing from URL params or localStorage
  const [planId, setPlanId] = useState<string | null>(null)
  const [billingFrequency, setBillingFrequency] = useState<string | null>(null)
  
  // Initialize plan and billing from URL params or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get URL params
      const url = new URL(window.location.href)
      const planFromUrl = url.searchParams.get('plan')
      const billingFromUrl = url.searchParams.get('billing')
      
      setPlanParam(planFromUrl)
      setBillingParam(billingFromUrl)
      
      // First try to get from URL params
      if (planFromUrl) {
        setPlanId(planFromUrl)
      } else {
        // Fallback to localStorage
        const storedPlan = localStorage.getItem('selectedPlan')
        if (storedPlan) setPlanId(storedPlan)
      }
      
      // Same for billing frequency
      if (billingFromUrl) {
        setBillingFrequency(billingFromUrl)
      } else {
        const storedFrequency = localStorage.getItem('billingFrequency')
        if (storedFrequency) setBillingFrequency(storedFrequency)
      }
      
      setIsLoading(false)
    }
  }, [])
  
  // Check for user session and redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    
    const checkSession = async () => {
      try {
        if (status === 'unauthenticated') {
          console.log('No authenticated session found, redirecting to plans')
          // Store the redirect flag in URL params
          const params = new URLSearchParams({
            redirectToCheckout: 'true'
          })
          
          // If we have plan and billing info, add them to the redirect
          if (planId) params.append('plan', planId)
          if (billingFrequency) params.append('billing', billingFrequency)
          
          // Redirect to plans page with the flag
          router.push(`/plans/${planId || 'pro'}?${params.toString()}`)
          return
        }
        
        // We have a session, set the user
        if (session?.user) {
          setUser(session.user)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        // Handle error - redirect to plans
        router.push('/plans')
      }
    }
    
    checkSession()
  }, [router, planId, billingFrequency, status, session])
  
  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          <Skeleton className="h-12 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full max-w-md" />
              <Skeleton className="h-4 w-full max-w-sm" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      }
    >
      <CheckoutContent 
        user={user} 
        planId={planId} 
        billingFrequency={billingFrequency} 
      />
    </Suspense>
  )
}