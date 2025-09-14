'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { getCurrentUser } from '@/lib/supabase/client'
import { CheckoutContent } from '@/components/checkout/checkout-content'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

// Define the session user type
type SessionUser = {
  name?: string | null
  email?: string | null
  image?: string | null
  id?: string | null
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)
  
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
  
  // Check for user session and handle authentication
  useEffect(() => {
    if (status === 'loading') return
    
    const checkSession = async () => {
      try {
        console.log('Checkout page - Current auth status:', status)
        
        // Clear stored credentials after sign-in
        if (status === 'authenticated') {
          console.log('User is authenticated, clearing temporary credentials')
          localStorage.removeItem('newUserEmail')
          localStorage.removeItem('newUserPassword')
          localStorage.removeItem('redirectToCheckout')
          localStorage.removeItem('redirectCount')
          
          // Set the user
          if (session?.user) {
            const sessionUser: SessionUser = {
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
              id: session.user.id as string | undefined
            }
            setUser(sessionUser)
          } else {
            setUser(null)
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
            localStorage.removeItem('redirectCount')
            localStorage.removeItem('newUserEmail')
            localStorage.removeItem('newUserPassword')
            localStorage.removeItem('redirectToCheckout')
            localStorage.removeItem('selectedPlan')
            localStorage.removeItem('billingFrequency')
            router.push('/')
            return
          }
          
          // Increment redirect count
          localStorage.setItem('redirectCount', (redirectCount + 1).toString())
          
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
          // Cast the session user to our SessionUser type
          const sessionUser: SessionUser = {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            id: session.user.id as string | undefined
          }
          setUser(sessionUser)
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