'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { getSession, signIn } from 'next-auth/react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Badge } from '@/components/ui'
import { CheckCircle, ArrowRight, Eye, EyeOff, Shield, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { PRICING_PLANS } from '@/lib/stripe/config'
import { normalizePlanId } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 0.61, 0.36, 1]
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 0.61, 0.36, 1]
    }
  }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 0.61, 0.36, 1]
    }
  }
}

export default function PlanSignUpPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const planId = params.planId as string
  const frequency = searchParams.get('frequency') || 'monthly'
  
  // Form state
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'form' | 'loading' | 'success' | 'error'>('form')
  const [error, setError] = useState('')
  
  // Get plan details
  const [planDetails, setPlanDetails] = useState<any>(null)
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsCheckingSession(true)
        const session = await getSession()
        if (session) {
          // User is already logged in, redirect to checkout
          const normalizedPlanId = normalizePlanId(params.planId as string)
          const searchParams = new URLSearchParams({
            plan: normalizedPlanId,
            frequency: frequency
          })
          router.push(`/checkout?${searchParams.toString()}`)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setIsCheckingSession(false)
      }
    }
    checkSession()
    
    // Get plan details
    const normalizedPlanId = normalizePlanId(params.planId as string)
    const plan = PRICING_PLANS[normalizedPlanId] || PRICING_PLANS.pro
    
    if (plan) {
      setPlanDetails({
        ...plan,
        id: normalizedPlanId,
        price: frequency === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
        billingFrequency: frequency
      })
    }
  }, [params.planId, frequency, router])
  
  const validateForm = () => {
    if (!email) {
      setError('Email is required')
      return false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return false
    }
    
    if (!name || name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return false
    }
    
    if (!password) {
      setError('Password is required')
      return false
    } else if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    return true
  }
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      // Create the account via API
      // Auth is now handled via modal, not dedicated routes
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password, 
          name: name.trim(),
          planId: planDetails?.id
        }),
      })
      
      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create account')
      }
      
      // Store necessary information for checkout
      localStorage.setItem('selected_plan', planDetails.id)
      localStorage.setItem('selected_frequency', frequency)
      
      toast({ title: 'Account created successfully!' })
      
      // Sign in without redirect
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })
      
      if (!result?.ok) {
        throw new Error('Failed to sign in')
      }
      
      // Get the price ID based on plan and frequency
      const priceId = frequency === 'monthly' ? 
        planDetails.priceIds.monthly : 
        planDetails.priceIds.yearly
      
      // Create checkout session
      const checkoutResponse = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/verify?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/plans/${planDetails.id}`,
          trialDays: 7
        }),
      })
      
      const checkoutData = await checkoutResponse.json()
      
      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.error || 'Failed to create checkout session')
      }
      
      // Store session ID for verification after payment
      if (checkoutData.sessionId) {
        localStorage.setItem('checkoutSessionId', checkoutData.sessionId)
      }
      
      if (checkoutData.url) {
        // Redirect to Stripe Checkout
        window.location.href = checkoutData.url
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!planDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]" />
      
      <motion.div 
        className="w-full max-w-6xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Plan Details Card */}
        <motion.div variants={cardVariants} className="hidden md:block">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/30 h-full">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl font-bold text-white">{planDetails.name} Plan</CardTitle>
                {planDetails.popular && (
                  <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    Most Popular
                  </Badge>
                )}
              </div>
              <CardDescription className="text-slate-300">
                {planDetails.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">${planDetails.price}</span>
                  <span className="text-slate-400 ml-2">/{frequency === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                {frequency === 'yearly' && (
                  <div className="mt-1 text-emerald-400 text-sm font-medium">
                    Save {planDetails.yearlySavings || '20%'} with annual billing
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">What's included:</h3>
                <ul className="space-y-3">
                  {planDetails.features.map((feature: string, index: number) => (
                    <motion.li 
                      key={index} 
                      className="flex items-start"
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                    >
                      <CheckCircle className="h-5 w-5 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-200">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <h4 className="flex items-center text-white font-medium mb-2">
                  <Zap className="h-4 w-4 mr-2 text-amber-400" />
                  Start with a 14-day free trial
                </h4>
                <p className="text-slate-300 text-sm">
                  Get full access to all {planDetails.name} features. No credit card required for your trial period.
                </p>
              </div>
              
              <div className="mt-4 p-4 bg-indigo-900/30 rounded-lg border border-indigo-700/30">
                <h4 className="flex items-center text-white font-medium mb-2">
                  <Shield className="h-4 w-4 mr-2 text-indigo-400" />
                  Secure Sign-Up Process
                </h4>
                <p className="text-slate-300 text-sm">
                  Create your account now and complete payment in the next step.
                  Your {planDetails.name} plan will be activated immediately after checkout.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Sign Up Form */}
        <motion.div variants={cardVariants}>
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-white">Create your account</CardTitle>
                  <CardDescription className="text-slate-300">
                    Sign up for the {planDetails.name} plan
                  </CardDescription>
                  <CardDescription className="text-slate-300">
                    Sign up to start your {planDetails.name} plan free trial
                  </CardDescription>
                </div>
                <div className="md:hidden">
                  <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    ${planDetails.price}/{frequency === 'monthly' ? 'mo' : 'yr'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-200">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    disabled={isLoading}
                  />
                  {error && error.includes('name') && <p className="text-red-400 text-sm mt-1">{error}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    disabled={isLoading}
                  />
                  {error && error.includes('email') && <p className="text-red-400 text-sm mt-1">{error}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {error && error.includes('password') && <p className="text-red-400 text-sm mt-1">{error}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {error && error.includes('confirm') && <p className="text-red-400 text-sm mt-1">{error}</p>}
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium py-2 rounded-md transition-all duration-200 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Start Your Free Trial <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
                
                <div className="text-center text-slate-400 text-sm mt-4">
                  Already have an account?{" "}
                  <Link href="/?signin=true" className="text-indigo-400 hover:text-indigo-300 font-medium">
                    Sign in
                  </Link>
                </div>
                
                <div className="text-center text-slate-500 text-xs mt-6">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="text-slate-400 hover:text-slate-300">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-slate-400 hover:text-slate-300">
                    Privacy Policy
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}