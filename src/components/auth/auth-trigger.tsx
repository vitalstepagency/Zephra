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
  plan,
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

  const handleClick = async () => {
    setIsLoading(true)
    
    try {
      const currentUser = await getCurrentUser()
      
      if (currentUser && redirectToCheckout) {
        // User is authenticated and should go to checkout
        const params = new URLSearchParams({
          plan: plan || 'pro',
          frequency: frequency
        })
        router.push(`/checkout?${params.toString()}`)
      } else if (!currentUser && scrollToPricing) {
        // User is not authenticated, scroll to pricing
        scrollToPricing()
      } else if (!currentUser) {
        // Redirect to signup page with plan parameters
        const params = new URLSearchParams({
          plan: plan || 'pro',
          frequency: frequency,
          redirectToCheckout: redirectToCheckout ? 'true' : 'false'
        })
        router.push(`/auth/signup?${params.toString()}`)
      }
    } catch (error) {
      console.error('Error in handleClick:', error)
      // Fallback behavior
      if (scrollToPricing) {
        scrollToPricing()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading...
        </div>
      ) : (
        children
      )}
    </Button>
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