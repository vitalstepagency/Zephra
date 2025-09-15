'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import type { Session } from 'next-auth'
import { getCurrentUser } from '@/lib/supabase/client'
import { CheckoutContent } from '@/components/checkout/checkout-content'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'
import { normalizePlanId } from '@/lib/stripe/helpers'

// Define the session user type
type SessionUser = {
  name?: string | null | undefined;
  email: string;
  image?: string | null | undefined;
  id: string;
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ id?: string; email?: string; name?: string; }>({ id: '', email: '', name: '' })
  
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
      const frequencyFromUrl = url.searchParams.get('frequency') || url.searchParams.get('billing')
      
      setPlanParam(planFromUrl)
      setBillingParam(frequencyFromUrl)
      
      // First try to get from URL params
      if (planFromUrl) {
        // Normalize plan ID to handle aliases
        const normalizedPlan = normalizePlanId(planFromUrl)
        
        setPlanId(normalizedPlan)
        localStorage.setItem('selected_plan', normalizedPlan)
      } else {
        // Fallback to localStorage - prioritize new key format
        const storedPlan = localStorage.getItem('selected_plan')
        if (storedPlan) {
          // Normalize stored plan ID
          const normalizedPlan = normalizePlanId(storedPlan)
          
          setPlanId(normalizedPlan)
          // Update localStorage if normalization occurred
          if (normalizedPlan !== storedPlan) {
            localStorage.setItem('selected_plan', normalizedPlan)
          }
        } else {
          // Check old key format and migrate if found
          const oldStoredPlan = localStorage.getItem('selectedPlan')
          if (oldStoredPlan) {
            // Normalize old stored plan ID
            const normalizedPlan = normalizePlanId(oldStoredPlan)
            
            localStorage.setItem('selected_plan', normalizedPlan)
            localStorage.removeItem('selectedPlan')
            setPlanId(normalizedPlan)
          } else {
            setPlanId('pro') // Default to 'pro' if no plan is specified
            localStorage.setItem('selected_plan', 'pro')
          }
        }
      }
      
      // Same for billing frequency
      if (frequencyFromUrl) {
        setBillingFrequency(frequencyFromUrl)
        localStorage.setItem('selected_frequency', frequencyFromUrl)
      } else {
        // Prioritize new key format
        const storedFrequency = localStorage.getItem('selected_frequency')
        if (storedFrequency) {
          setBillingFrequency(storedFrequency)
        } else {
          // Check old key format and migrate if found
          const oldStoredFrequency = localStorage.getItem('billingFrequency')
          if (oldStoredFrequency) {
            localStorage.setItem('selected_frequency', oldStoredFrequency)
            localStorage.removeItem('billingFrequency')
            setBillingFrequency(oldStoredFrequency)
          } else {
            setBillingFrequency('monthly') // Default to monthly if no frequency is specified
            localStorage.setItem('selected_frequency', 'monthly')
          }
        }
      }
      
      // Don't clear redirect flags here, we need them for the checkout flow
      
      setIsLoading(false)
    }
  }, [])
  
  // Check for user session and handle authentication
  useEffect(() => {
    if (status === 'loading') return
    
    const checkSession = async () => {
      try {
        // Clear stored credentials after sign-in
        if (status === 'authenticated') {
          // Clean up localStorage
          localStorage.removeItem('newUserEmail')
          localStorage.removeItem('newUserPassword')
          localStorage.removeItem('redirectCount')
          
          // Set the user
          const currentSession = session as Session | null;
          if (currentSession?.user) {
            setUser({
              name: currentSession.user.name || '',
              email: currentSession.user.email || '',
              id: currentSession.user.id || ''
            })
            
            // Check if we should redirect to Stripe checkout
            const shouldRedirectToCheckout = localStorage.getItem('redirect_to_checkout') === 'true' || 
                                            new URL(window.location.href).searchParams.get('redirectToCheckout') === 'true'
            
            if (shouldRedirectToCheckout) {
              // Trigger checkout automatically
              setTimeout(() => {
                const checkoutButton = document.querySelector('#checkout-button') as HTMLButtonElement
                if (checkoutButton) {
                  checkoutButton.click()
                  
                  // Clear redirect flags
                  localStorage.removeItem('redirect_to_checkout')
                  
                  // Clean up URL params
                  const currentUrl = new URL(window.location.href)
                  if (currentUrl.searchParams.has('redirectToCheckout')) {
                    currentUrl.searchParams.delete('redirectToCheckout')
                    window.history.replaceState({}, '', currentUrl.toString())
                  }
                }
              }, 500)
            }
          } else {
            setUser({ id: '', email: '', name: '' })
          }
          
          return
        }
        
        // Check if we have a newly created user from plan-specific signup
        const newUserEmail = localStorage.getItem('newUserEmail')
        const newUserPassword = localStorage.getItem('newUserPassword')
        
        if (status === 'unauthenticated' && newUserEmail && newUserPassword) {
          console.log('New user detected, attempting automatic sign-in')
          
          // Attempt to sign in with the new user credentials
          const result = await signIn('credentials', {
            email: newUserEmail,
            password: newUserPassword,
            redirect: false
          })
          
          if (result?.error) {
            console.error('Auto sign-in failed:', result.error)
            // Clear stored credentials and redirect to plans
            localStorage.removeItem('newUserEmail')
            localStorage.removeItem('newUserPassword')
            
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
          
          console.log('Auto sign-in successful, proceeding to checkout')
          // Clear stored credentials after successful sign-in
          localStorage.removeItem('newUserEmail')
          localStorage.removeItem('newUserPassword')
          
          // Refresh the session to get the user data
          window.location.reload()
          return
        } else if (status === 'unauthenticated') {
          console.log('No authenticated session found, checking for auto sign-in credentials')
          
          // Check if we have stored credentials for auto sign-in
          const storedEmail = localStorage.getItem('newUserEmail')
          const storedPassword = localStorage.getItem('newUserPassword')
          
          if (storedEmail && storedPassword) {
            console.log('Found stored credentials, attempting auto sign-in')
            try {
              // Attempt to sign in with stored credentials
              const result = await signIn('credentials', {
                email: storedEmail,
                password: storedPassword,
                redirect: false
              })
              
              if (result?.ok) {
                console.log('Auto sign-in successful, refreshing page')
                // Clear stored credentials after successful sign-in
                localStorage.removeItem('newUserEmail')
                localStorage.removeItem('newUserPassword')
                // Clear any redirect flags
                localStorage.removeItem('redirectCount')
                localStorage.removeItem('redirectToCheckout')
                
                // Refresh the page to get the authenticated session
                window.location.reload()
                return
              } else {
                console.log('Auto sign-in failed, proceeding with redirect')
                // Clear invalid credentials
                localStorage.removeItem('newUserEmail')
                localStorage.removeItem('newUserPassword')
              }
            } catch (error) {
              console.error('Error during auto sign-in:', error)
            }
          }
          
          // Check if we're in a redirection loop
          const redirectCount = parseInt(localStorage.getItem('redirectCount') || '0')
          if (redirectCount > 2) {
            console.log('Detected redirection loop, clearing state and redirecting to home')
            // Clear all localStorage keys related to auth flow
            localStorage.removeItem('redirectCount')
            localStorage.removeItem('newUserEmail')
            localStorage.removeItem('newUserPassword')
            localStorage.removeItem('redirectToCheckout')
            localStorage.removeItem('redirect_to_checkout')
            localStorage.removeItem('selectedPlan')
            localStorage.removeItem('selected_plan')
            localStorage.removeItem('billingFrequency')
            localStorage.removeItem('selected_frequency')
            router.push('/')
            return
          }
          
          // Increment redirect count
          localStorage.setItem('redirectCount', (redirectCount + 1).toString())
          
          // Check if we have a newly created user from plan-specific signup
          const checkoutEmail = localStorage.getItem('checkout_email')
          const checkoutName = localStorage.getItem('checkout_name')
          
          if (checkoutEmail) {
            // User has already signed up, proceed with checkout
            console.log('User has already signed up, proceeding with checkout')
            // Set a temporary user for checkout
            setUser({
              name: checkoutName || '',
              email: checkoutEmail,
              id: 'temp-id'
            })
            return
          } else {
            // Store the redirect flag in localStorage (more reliable than URL params)
            localStorage.setItem('redirect_to_checkout', 'true')
            
            // Store plan and billing info in localStorage
            if (planId) localStorage.setItem('selected_plan', planId)
            if (billingFrequency) localStorage.setItem('selected_frequency', billingFrequency)
            
            // Redirect to signin page
            router.push(`/?signin=true`)
            return
          }
        }
        
        // We have a session, set the user
        const currentSession = session as Session | null;
        if (currentSession?.user) {
          // Set the user with the correct type
          setUser({
            name: currentSession.user.name || '',
            email: currentSession.user.email || '',
            id: currentSession.user.id || ''
          })
          // Clear redirect count since we're successfully authenticated
          localStorage.removeItem('redirectCount')
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