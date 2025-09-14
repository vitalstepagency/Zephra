'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User, Loader2 } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthTriggerProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
  plan?: string
  frequency?: 'monthly' | 'yearly'
  redirectToCheckout?: boolean
  scrollToPricing?: () => void
}

export function AuthTrigger({ 
  variant = 'default', 
  size = 'default', 
  className = '',
  children = 'Get Started',
  plan = 'pro',
  frequency = 'monthly',
  redirectToCheckout = false,
  scrollToPricing
}: AuthTriggerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error checking user:', error)
        // Don't set user to null on error, keep it undefined to avoid infinite loading
      }
    }
    checkUser()
  }, [])

  const handleClick = async () => {
    setIsLoading(true)
    
    try {
      if (user) {
        // If user is already logged in, redirect directly to checkout
        const params = new URLSearchParams({
          plan: plan,
          billing: frequency
        })
        router.push(`/checkout?${params.toString()}`)
      } else {
        // If not logged in, redirect to plan-specific sign-up page
        const params = new URLSearchParams({
          frequency: frequency
        })
        
        // Store plan and frequency in localStorage for the checkout redirect
        localStorage.setItem('selected_plan', plan)
        localStorage.setItem('selected_frequency', frequency)
        localStorage.setItem('redirect_to_checkout', 'true')
        
        // Clear any redirect counts and old format keys to prevent loops
        localStorage.removeItem('redirectCount')
        localStorage.removeItem('redirectToCheckout')
        localStorage.removeItem('selectedPlan')
        localStorage.removeItem('billingFrequency')
        
        router.push(`/plans/${plan}?${params.toString()}`)
      }
    } catch (error) {
      console.error('Error in handleClick:', error)
      // Default fallback - go to plan-specific sign-up page
      router.push(`/plans/${plan}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Check if we're on a plan page
  useEffect(() => {
    const path = window.location.pathname
    const planMatch = path.match(/\/plans\/([^\/]+)/)
    if (planMatch && planMatch[1]) {
      setPlanId(planMatch[1])
    }
  }, [])

  const handleGetStarted = () => {
    // Clear any existing redirect counts and flags to start fresh
    localStorage.removeItem('redirectCount')
    
    // Set redirect flag and plan selection if needed
    if (redirectToCheckout) {
      localStorage.setItem('redirect_to_checkout', 'true')
      localStorage.setItem('selected_plan', plan)
      localStorage.setItem('selected_frequency', frequency)
      console.log('Setting redirect_to_checkout flag and plan details')
    } else {
      localStorage.removeItem('redirect_to_checkout')
      localStorage.removeItem('redirectToCheckout') // Clear old format too
    }
    
    if (planId) {
      // If we're on a plan page, redirect to the plan-specific signup
      const params = new URLSearchParams()
      params.append('frequency', frequency || 'monthly')
      // Don't add redirectToCheckout to URL params, use localStorage instead
      const destination = `/plans/${planId}?${params.toString()}`
      console.log(`Navigating to: ${destination}`)
      router.push(destination)
    } else if (plan) {
      // Otherwise redirect to the plan-specific signup page
      const params = new URLSearchParams()
      params.append('frequency', frequency || 'monthly')
      // Don't add redirectToCheckout to URL params, use localStorage instead
      const destination = `/plans/${plan}?${params.toString()}`
      console.log(`Navigating to: ${destination}`)
      router.push(destination)
    } else {
      console.log('Navigating to general plans page')
      router.push('/plans')
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={scrollToPricing ? scrollToPricing : handleGetStarted}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {children}
      </Button>
    </>
  )
}

export function SignInTrigger({ variant = 'outline', size = 'default', className }: AuthTriggerProps) {
  const router = useRouter()

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => router.push('/auth/signin')}
    >
      Sign In
    </Button>
  )
}

interface UserAvatarProps {
  user: SupabaseUser
  className?: string
}

export function UserAvatar({ user, className = '' }: UserAvatarProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
        {user.email?.[0]?.toUpperCase() || 'U'}
      </div>
      <span className="text-sm font-medium text-slate-700">
        {user.email}
      </span>
    </div>
  )
}