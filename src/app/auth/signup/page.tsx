'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { Mail, ArrowRight, Sparkles, Shield, Zap, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

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

function SignUpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'starter'
  const frequency = searchParams.get('frequency') || 'monthly'
  const redirectToCheckout = searchParams.get('redirectToCheckout') === 'true'
  
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{email?: string, name?: string, password?: string}>({})
  const [selectedPlan, setSelectedPlan] = useState(plan || '')
  const [selectedFrequency, setSelectedFrequency] = useState<'monthly' | 'yearly'>((frequency || 'monthly') as 'monthly' | 'yearly')

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      // Only redirect to dashboard if we're not in the middle of a signup flow
      // This prevents redirect loops when creating an account
      if (session && !redirectToCheckout && !plan) {
        router.push('/dashboard')
      }
    }
    checkSession()
    
    // Check if we have a plan in localStorage but not in URL params
    // This happens when coming from plan details page
    if (!plan && localStorage.getItem('selected_plan')) {
      const storedPlan = localStorage.getItem('selected_plan')
      const storedFrequency = localStorage.getItem('selected_frequency') || 'monthly'
      setSelectedPlan(storedPlan || '')
      setSelectedFrequency(storedFrequency as 'monthly' | 'yearly')
    }
  }, [router, redirectToCheckout, plan])
  
  // Store plan selection in localStorage to persist through sign-in redirects
  useEffect(() => {
    if (plan) {
      localStorage.setItem('selected_plan', plan)
      localStorage.setItem('selected_frequency', frequency || 'monthly')
      localStorage.setItem('redirect_to_checkout', redirectToCheckout ? 'true' : 'false')
    }
  }, [plan, frequency, redirectToCheckout])

  const validateForm = () => {
    const newErrors: {email?: string, name?: string, password?: string} = {}
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!name || name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const { toast } = useToast()
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    // Set loading state first to update UI immediately
    setIsLoading(true)
    console.log('Setting loading state to true')
    
    try {
      // First create the account via API
      const response = await fetch('/api/auth/simple-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password, 
          name: name.trim() 
        })
      })
      
      if (response.ok) {
        // Store credentials in localStorage for session restoration
        localStorage.setItem('checkout_email', email.trim().toLowerCase())
        localStorage.setItem('checkout_name', name.trim())
        
        // Use the selected plan from state (which may have come from localStorage)
        const finalPlan = selectedPlan || plan || 'starter'
        const finalFrequency = selectedFrequency || frequency || 'monthly'
        
        // Set redirect flag for checkout
        localStorage.setItem('redirect_to_checkout', 'true')
        localStorage.setItem('redirectToCheckout', 'true') // Set both formats for compatibility
        
        toast({
          title: 'Account created successfully!',
          description: 'Redirecting to checkout...'
        })
        
        // Always sign in and redirect to checkout
        // Sign in without redirect
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false
        })
        
        if (result?.ok) {
          // Keep loading state true during redirect
          console.log('Redirecting to checkout')
          // Redirect to checkout with plan parameters
          const params = new URLSearchParams({
            plan: finalPlan,
            frequency: finalFrequency
          })
          router.push(`/checkout?${params.toString()}`)
        } else {
          throw new Error('Failed to sign in')
        }
      } else {
        const error = await response.json()
        setErrors({ email: error.message || 'Sign up failed' })
        setIsLoading(false) // Reset loading state on error
      }
    } catch (error) {
      console.error('Sign up error:', error)
      setErrors({ email: 'An error occurred during sign up' })
      toast({
        variant: 'destructive',
        title: 'Error creating account',
        description: 'An unexpected error occurred during sign up'
      })
      setIsLoading(false) // Reset loading state on error
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]" />
      
      <motion.div 
        className="w-full max-w-md relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            className="flex items-center justify-center mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-3xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Create Your Account
          </motion.h1>
          
          <motion.p 
            className="text-slate-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Start your journey to marketing success
          </motion.p>
          
          {plan && plan !== 'starter' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Badge className="mt-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Selected
              </Badge>
            </motion.div>
          )}
        </div>
        
        {/* Plan Details - Only show when plan is selected */}
        {plan && plan !== 'starter' && (
          <motion.div 
            className="mb-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {plan === 'pro' ? 'Pro Plan' : plan === 'enterprise' ? 'Enterprise Plan' : 'Starter Plan'}
              </h3>
              <div className="text-right">
                <div className="text-indigo-400 font-bold">
                  ${frequency === 'monthly' ? 
                    (plan === 'pro' ? '297' : plan === 'enterprise' ? '497' : '197') : 
                    (plan === 'pro' ? '2,970' : plan === 'enterprise' ? '4,970' : '1,970')}
                </div>
                <div className="text-slate-400 text-sm">
                  {frequency === 'monthly' ? 'per month' : 'per year'}
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              {plan === 'pro' && (
                <>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Advanced Market Intelligence with 3 detailed customer personas</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">100 unique ad variations across all major platforms</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">5 custom sales funnels with 12-email nurture sequences</span>
                  </div>
                </>
              )}
              {plan === 'enterprise' && (
                <>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Everything in Pro plan plus enterprise features</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Unlimited ad variations and custom funnels</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Dedicated account manager and priority support</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Sign Up Card */}
        <motion.div variants={cardVariants}>
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 shadow-2xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-xl text-white">Get Started</CardTitle>
              <CardDescription className="text-slate-400">
                Choose your preferred sign-up method
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Sign Up Form */}
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300 font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 py-6"
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm">{errors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 py-6"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 py-6 pr-12"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm">{errors.password}</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 py-6 font-semibold"
                  id="signup-button"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Creating Your Account Now...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      Start Your Free Trial
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="flex items-center justify-center space-x-6 mb-6">
            <div className="flex items-center text-slate-400 text-sm">
              <Shield className="w-4 h-4 mr-2 text-emerald-400" />
              Secure & Encrypted
            </div>
            <div className="flex items-center text-slate-400 text-sm">
              <Zap className="w-4 h-4 mr-2 text-indigo-400" />
              Instant Setup
            </div>
          </div>
          
          <p className="text-xs text-slate-500 mb-4">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline">
              Privacy Policy
            </Link>
          </p>
          
          <p className="text-slate-400 text-sm">
            Already have an account?{' '}
            <Link 
              href="/auth/signin" 
              className="text-indigo-400 hover:text-indigo-300 font-medium underline"
            >
              Sign in here
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpContent />
    </Suspense>
  )
}