'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle } from 'lucide-react'

function SignInContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkoutSuccess = searchParams.get('checkout') === 'success'

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        // If user is already authenticated, redirect to onboarding
        router.push('/onboarding')
      }
    }
    checkSession()
  }, [router])

  // This function is no longer used as we're using the form directly
  // Keeping it for reference in case we need to revert
  // Updated to persist authentication token and redirect directly
  const handleSignIn = async (provider: string) => {
    setIsLoading(true)
    setSubscriptionError('')
    try {
      const result = await signIn(provider, { 
        redirect: false,
        callbackUrl: '/onboarding'
      })
      
      if (result?.ok) {
        // Direct redirect after successful authentication
        router.push('/onboarding')
      } else if (result?.error) {
        setSubscriptionError(result.error)
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setSubscriptionError('An error occurred during sign in')
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
              ? 'Enter your email and password to access your new subscription'
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
            {/* Google and GitHub sign-in options removed as requested */}
            
            <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                setIsLoading(true);
                setSubscriptionError('');
                const formData = new FormData(e.currentTarget);
                const email = formData.get('email') as string;
                const password = formData.get('password') as string;
                
                if (!email || !password) {
                  setIsLoading(false);
                  return;
                }
                
                try {
                  // Use redirect: false to handle the redirection manually
                  // This prevents the redundant second sign-in page
                  const result = await signIn('credentials', {
                    email,
                    password,
                    redirect: false
                  });
                  
                  if (result?.error) {
                    setSubscriptionError(result.error);
                  } else if (result?.ok) {
                    // Redirect directly to onboarding after successful authentication
                    // This bypasses the intermediate redirect to /api/auth/signin
                    router.push('/onboarding');
                  }
                } catch (error) {
                  console.error('Sign in error:', error);
                  setSubscriptionError('An error occurred during sign in');
                } finally {
                  setIsLoading(false);
                }
              }}>
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                <Mail className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </form>
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

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}