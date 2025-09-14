'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { Mail, Eye, EyeOff, ArrowRight, Zap, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
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

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkSession()
  }, [router])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })
      
      if (result?.error) {
        setError('Invalid email or password')
      } else {
        // Check if there's stored plan information from signup
        const storedPlan = localStorage.getItem('selected_plan')
        const storedFrequency = localStorage.getItem('selected_frequency')
        const redirectToCheckout = localStorage.getItem('redirect_to_checkout') === 'true'
        
        // Check old key formats and migrate if found
        if (!storedPlan) {
          const oldStoredPlan = localStorage.getItem('selectedPlan')
          if (oldStoredPlan) {
            localStorage.setItem('selected_plan', oldStoredPlan)
          }
        }
        
        if (localStorage.getItem('redirectToCheckout') === 'true') {
          localStorage.setItem('redirect_to_checkout', 'true')
        }
        
        // Store the current redirect state before clearing flags
        const shouldRedirectToCheckout = redirectToCheckout || localStorage.getItem('redirectToCheckout') === 'true'
        const finalPlan = storedPlan || localStorage.getItem('selectedPlan') || 'pro'
        const finalFrequency = storedFrequency || localStorage.getItem('billingFrequency') || 'monthly'
        
        // Clear all redirect flags immediately to prevent loops
        localStorage.removeItem('redirect_to_checkout')
        localStorage.removeItem('redirectToCheckout')
        localStorage.removeItem('redirectCount')
        localStorage.removeItem('selectedPlan')
        localStorage.removeItem('billingFrequency')
        
        if (finalPlan && shouldRedirectToCheckout) {
          // Redirect to checkout with plan parameters
          const params = new URLSearchParams({
            plan: finalPlan,
            billing: finalFrequency
          })
          
          console.log('Redirecting to checkout with plan:', finalPlan, 'and billing:', finalFrequency)
          router.push(`/checkout?${params.toString()}`)
        } else if (storedPlan) {
          // Redirect to onboarding with plan parameter
          router.push(`/onboarding?plan=${storedPlan}`)
        } else {
          // Default redirect to dashboard
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An error occurred during sign in')
    } finally {
      setIsLoading(false)
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
            Welcome Back
          </motion.h1>
          
          <motion.p 
            className="text-slate-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Sign in to continue building amazing campaigns
          </motion.p>
        </div>

        {/* Sign In Card */}
        <motion.div variants={cardVariants}>
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 shadow-2xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-xl text-white">Welcome Back</CardTitle>
              <CardDescription className="text-slate-400">
                Choose your preferred sign-in method
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Email Sign In Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                
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
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 py-6 pr-12"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 py-6 font-semibold"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Signing in...
                    </div>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
              
              <div className="text-center">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center space-y-4"
        >
          <p className="text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign up here
            </Link>
          </p>
          
          <div className="flex items-center justify-center space-x-6 text-xs text-slate-500">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}