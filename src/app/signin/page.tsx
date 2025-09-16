'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input, Label } from '@/components/ui'
import { Eye, EyeOff, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

function SignInContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'signin' | 'success'>('signin')
  
  // Get URL parameters
  const sessionId = searchParams.get('session_id')
  const fromCheckout = searchParams.get('from') === 'checkout' || searchParams.get('checkout') === 'success'
  const callbackUrl = searchParams.get('callbackUrl')
  
  // Decode callbackUrl if it exists
  const decodedCallbackUrl = callbackUrl ? decodeURIComponent(callbackUrl) : null
  
  // Function to check onboarding completion and redirect accordingly
  const checkOnboardingAndRedirect = async (userId: string) => {
    try {
      // If coming from checkout, always redirect to onboarding
      if (fromCheckout || sessionId) {
        console.log('Redirecting to onboarding after checkout:', sessionId)
        const redirectUrl = sessionId ? `/onboarding?session_id=${sessionId}` : '/onboarding'
        window.location.href = redirectUrl
        return
      }
      
      // If there's a callbackUrl that contains 'onboarding', prioritize it
      if (callbackUrl) {
        console.log('Redirecting to callback URL:', callbackUrl)
        // Use the actual URL from the decoded callback URL instead of the encoded parameter
        window.location.href = decodedCallbackUrl || callbackUrl
        return
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error)
        // If no profile exists, redirect to onboarding
        const redirectUrl = sessionId ? `/onboarding?session_id=${sessionId}` : '/onboarding'
        router.push(redirectUrl)
        return
      }
      
      // Redirect based on onboarding completion status
      if (profile?.onboarding_completed) {
        // User has completed onboarding, go to dashboard
        const redirectUrl = sessionId ? `/dashboard?session_id=${sessionId}` : '/dashboard'
        router.push(redirectUrl)
      } else {
        // User hasn't completed onboarding, go to onboarding
        const redirectUrl = sessionId ? `/onboarding?session_id=${sessionId}` : '/onboarding'
        router.push(redirectUrl)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      // Default to onboarding on error
      const redirectUrl = sessionId ? `/onboarding?session_id=${sessionId}` : '/onboarding'
      router.push(redirectUrl)
    }
  }
  
  useEffect(() => {
    // If user is already signed in, check onboarding status and redirect
    if (session && status === 'authenticated' && session.user?.id) {
      checkOnboardingAndRedirect(session.user.id)
    }
    
    // Pre-fill email if available from URL or localStorage
    const urlEmail = searchParams.get('email')
    const storedEmail = localStorage.getItem('checkout_email') || localStorage.getItem('newUserEmail')
    
    if (urlEmail) {
      setEmail(urlEmail)
    } else if (storedEmail) {
      setEmail(storedEmail)
    }
  }, [session, status, router, searchParams])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      // Try to sign in with stored credentials first if available
      const storedPassword = localStorage.getItem('newUserPassword')
      let signInPassword = password
      
      // If we have stored credentials and email matches, use stored password
      if (storedPassword && localStorage.getItem('newUserEmail') === email) {
        signInPassword = storedPassword
      }
      
      const result = await signIn('credentials', {
        email,
        password: signInPassword,
        redirect: false,
      })
      
      if (result?.error) {
        // If stored password failed, try with entered password
        if (storedPassword && signInPassword === storedPassword && password !== storedPassword) {
          const retryResult = await signIn('credentials', {
            email,
            password,
            redirect: false,
          })
          
          if (retryResult?.error) {
            setError('Invalid email or password. Please check your credentials.')
            setIsLoading(false)
            return
          }
        } else {
          setError('Invalid email or password. Please check your credentials.')
          setIsLoading(false)
          return
        }
      }
      
      // Clear stored credentials after successful sign in
      localStorage.removeItem('newUserEmail')
      localStorage.removeItem('newUserPassword')
      
      // Show success state briefly before redirect
      setStep('success')
      
      // Get the session to access user ID for onboarding check
      setTimeout(async () => {
        // If coming from checkout, always redirect to onboarding
        if (fromCheckout || sessionId) {
          console.log('Redirecting to onboarding after successful sign-in from checkout')
          const redirectUrl = sessionId ? `/onboarding?session_id=${sessionId}` : '/onboarding'
          window.location.href = redirectUrl
          return
        }
        
        // If there's a callbackUrl that contains 'onboarding', prioritize it immediately
        if (callbackUrl && callbackUrl.includes('/onboarding')) {
          console.log('Redirecting to callback URL after sign-in:', callbackUrl)
          window.location.href = callbackUrl
          return
        }
        
        // Otherwise, proceed with normal flow
        // Refresh session to get user data
        const { data: sessionData } = await fetch('/api/auth/session').then(res => res.json())
        if (sessionData?.user?.id) {
          await checkOnboardingAndRedirect(sessionData.user.id)
        } else {
          // Fallback to onboarding if no user ID
          const redirectUrl = sessionId ? `/onboarding?session_id=${sessionId}` : '/onboarding'
          router.push(redirectUrl)
        }
      }, 1500)
      
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center space-x-2">
              <img 
                src="/zephra-logo.png" 
                alt="Zephra Logo" 
                className="h-14 w-auto"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Zephra
              </span>
            </div>
          </Link>
        </div>
        
        {step === 'signin' ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {fromCheckout ? 'Complete Your Setup' : 'Welcome Back'}
              </h1>
              <p className="text-gray-600">
                {fromCheckout 
                  ? 'Sign in to activate your subscription and continue to onboarding'
                  : 'Sign in to your Zephra account'
                }
              </p>
            </div>
            
            {/* Payment Success Indicator */}
            {fromCheckout && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Payment Successful!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Your subscription has been activated. Please sign in to continue.
                </p>
              </div>
            )}
            
            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="mt-1 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="h-12 pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
            
            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/?signup=true" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        ) : (
          /* Success State */
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
            <p className="text-gray-600 mb-4">Successfully signed in. Redirecting you now...</p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}