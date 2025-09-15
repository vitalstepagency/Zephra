'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { User, Loader2 } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { normalizePlanId } from '@/lib/stripe/helpers'
import { AuthModal } from './auth-modal'

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
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error checking user:', error)
      }
    }
    checkUser()
  }, [])

  const handleGetStarted = async () => {
    setIsLoading(true)
    
    try {
      // Normalize plan ID to handle aliases
      const normalizedPlan = normalizePlanId(plan)
      
      // Clear localStorage to prevent redirect loops
      localStorage.removeItem('redirectCount')
      localStorage.removeItem('redirectToCheckout')
      
      if (user) {
        // User is logged in - go directly to checkout
        const params = new URLSearchParams({
          plan: normalizedPlan,
          frequency: frequency
        })
        router.push(`/checkout?${params.toString()}`)
      } else {
        // User is not logged in - go to account creation page
        localStorage.setItem('selected_plan', normalizedPlan)
        localStorage.setItem('selected_frequency', frequency)
        localStorage.setItem('redirect_to_checkout', redirectToCheckout ? 'true' : 'false')
        
        const params = new URLSearchParams({ frequency })
        router.push(`/plans/${normalizedPlan}?${params.toString()}`)
      }
    } catch (error) {
      console.error('Error in handleGetStarted:', error)
      router.push(`/plans/${plan}`)
    } finally {
      setIsLoading(false)
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (session) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2"
      >
        <User className="w-4 h-4" />
        Dashboard
      </Button>
    )
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsModalOpen(true)}
      >
        Sign In
      </Button>
      
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultMode="signin"
      />
    </>
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