'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { User, LogOut } from 'lucide-react'

interface AuthTriggerProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  plan?: string
  frequency?: string
  redirectToCheckout?: boolean
}

export function AuthTrigger({ variant = 'default', size = 'default', className, plan, frequency, redirectToCheckout = false }: AuthTriggerProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        Loading...
      </Button>
    )
  }

  if (session) {
    // If user is authenticated and we have plan/frequency, redirect to checkout
    if (redirectToCheckout && plan && frequency) {
      return (
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => router.push(`/checkout?plan=${plan}&frequency=${frequency}`)}
        >
          Start 7-Day Free Trial
        </Button>
      )
    }
    
    return (
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size={size}
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          Dashboard
        </Button>
        <Button
          variant="ghost"
          size={size}
          onClick={() => {
            // Sign out logic
            window.location.href = '/api/auth/signout'
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => {
        const checkoutUrl = plan && frequency 
          ? `/checkout?plan=${plan}&frequency=${frequency}`
          : '/checkout'
        router.push(checkoutUrl)
      }}
    >
      Get Started Free
    </Button>
  )
}

export function SignInTrigger({ variant = 'outline', size = 'default', className }: AuthTriggerProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return (
      <Button variant={variant} size={size} className={className} disabled>
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
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => router.push('/checkout')}
    >
      Sign In
    </Button>
  )
}