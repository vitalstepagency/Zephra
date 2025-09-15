'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Github, Mail, Chrome, CheckCircle } from 'lucide-react'

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkoutSuccess = searchParams.get('checkout') === 'success'

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        // Check if user has active subscription
        try {
          const response = await fetch('/api/user/subscription-status')
          if (response.ok) {
            const { hasActiveSubscription } = await response.json()
            if (hasActiveSubscription) {
              router.push('/onboarding')
            } else {
              setSubscriptionError('Please purchase a subscription to access the platform.')
            }
          } else {
            router.push('/dashboard')
          }
        } catch (error) {
          console.error('Error checking subscription:', error)
          router.push('/dashboard')
        }
      }
    }
    checkSession()
  }, [router])

  const handleSignIn = async (provider: string) => {
    setIsLoading(true)
    setSubscriptionError('')
    try {
      const result = await signIn(provider, { 
        redirect: false
      })
      
      if (result?.ok) {
        // Check subscription status after sign in
        try {
          const response = await fetch('/api/user/subscription-status')
          if (response.ok) {
            const { hasActiveSubscription } = await response.json()
            if (hasActiveSubscription) {
              router.push('/onboarding')
            } else {
              setSubscriptionError('Please purchase a subscription to access the platform.')
            }
          } else {
            router.push('/dashboard')
          }
        } catch (error) {
          console.error('Error checking subscription after sign in:', error)
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {checkoutSuccess && (
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                Payment Successful!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your subscription is now active. Sign in to get started.
              </p>
            </div>
          )}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {checkoutSuccess ? 'Complete Your Setup' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {checkoutSuccess 
              ? 'Sign in to access your new subscription and start your AI marketing journey'
              : 'Sign in to your account to continue building amazing campaigns'
            }
          </p>
        </div>
        
        {subscriptionError && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {subscriptionError}
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Choose your preferred sign-in method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleSignIn('google')}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <Chrome className="w-4 h-4 mr-2" />
              Continue with Google
            </Button>
            
            <Button
              onClick={() => handleSignIn('github')}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <Github className="w-4 h-4 mr-2" />
              Continue with GitHub
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <Button
              onClick={() => handleSignIn('email')}
              disabled={isLoading}
              className="w-full"
              variant="default"
            >
              <Mail className="w-4 h-4 mr-2" />
              Continue with Email
            </Button>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            By signing in, you agree to our{' '}
            <a href="/terms" className="underline hover:text-gray-900 dark:hover:text-gray-100">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-gray-900 dark:hover:text-gray-100">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}