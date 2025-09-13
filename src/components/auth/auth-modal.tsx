'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { X, Mail, Lock, Eye, EyeOff, User, Chrome, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Alert, AlertDescription } from '../ui/alert'


interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'signin' | 'signup'
  redirectTo?: string | undefined
  plan?: string | undefined
  frequency?: string | undefined
}

type AuthMode = 'signin' | 'signup' | 'forgot-password'
type AuthStep = 'form' | 'loading' | 'success' | 'error'

export function AuthModal({ isOpen, onClose, defaultMode = 'signin', redirectTo, plan, frequency }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode)
  const [step, setStep] = useState<AuthStep>('form')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()



  useEffect(() => {
    if (isOpen) {
      setStep('form')
      setError('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setName('')
    }
  }, [isOpen])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setStep('loading')

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long')
        }
        
        // Create account with Supabase
        const response = await fetch('/api/auth/simple-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create account')
        }
        
        setStep('success')
        setTimeout(() => {
          onClose()
          if (redirectTo && plan && frequency) {
            router.push(`${redirectTo}?plan=${plan}&frequency=${frequency}`)
          } else {
            router.push('/dashboard')
          }
        }, 2000)
      } else {
        // Sign in with credentials
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false
        })
        
        if (result?.error) {
          // Display the specific error message from the credentials provider
          throw new Error(result.error)
        }
        
        setStep('success')
        setTimeout(() => {
          onClose()
          if (redirectTo && plan && frequency) {
            router.push(`${redirectTo}?plan=${plan}&frequency=${frequency}`)
          } else {
            router.push('/dashboard')
          }
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setStep('error')
      setTimeout(() => setStep('form'), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true)
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch (error) {
      setError('Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  const modalVariants = {
    hidden: { scale: 0.9, opacity: 0, y: 20 },
    visible: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.9, opacity: 0, y: 20 }
  }

  const contentVariants = {
    form: { opacity: 1, y: 0 },
    loading: { opacity: 0.7, y: -10 },
    success: { opacity: 1, y: 0 },
    error: { opacity: 1, y: 0 }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {mode === 'signin' 
                    ? 'Sign in to your account to continue' 
                    : mode === 'signup'
                    ? 'Join thousands of marketers growing their business'
                    : 'Enter your email to reset your password'
                  }
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {step === 'loading' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Authenticating...</p>
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
                  <p className="text-gray-900 dark:text-white font-semibold">Success!</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Redirecting to dashboard...</p>
                </div>
              )}

              {step === 'error' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
                  <p className="text-red-600 font-semibold mb-2">Authentication Failed</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm text-center">{error}</p>
                </div>
              )}

                {step === 'form' && (
                  <div className="space-y-4">
                    {/* Google Sign In */}
                    <Button
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                      className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      <Chrome className="w-5 h-5 mr-3" />
                      Continue with Google
                    </Button>

                    <div className="relative">
                      <Separator className="my-6" />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 px-4 text-sm text-gray-500">
                        or
                      </span>
                    </div>

                    {/* Email/Password Form */}
                    <form 
                      onSubmit={handleEmailAuth} 
                      className="space-y-4"
                    >
                      {mode === 'signup' && (
                        <div className="space-y-1">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Full Name
                          </Label>
                          <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            required
                            className="h-12 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-colors"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="h-12 pl-11 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-colors"
                          />
                        </div>
                      </div>

                      {mode !== 'forgot-password' && (
                        <div className="space-y-1">
                          <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              required
                              className="h-12 pl-11 pr-11 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {mode === 'signup' && (
                        <div className="space-y-1">
                          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              id="confirmPassword"
                              type={showPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm your password"
                              required
                              className="h-12 pl-11 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-colors"
                            />
                          </div>
                        </div>
                      )}

                      {error && (
                        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="font-medium">{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors rounded-lg"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'
                        )}
                      </Button>
                    </form>

                    {/* Footer Links */}
                    <div className="text-center space-y-3 pt-4">
                      {mode === 'signin' && (
                        <>
                          <button
                            onClick={() => setMode('forgot-password')}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
                          >
                            Forgot your password?
                          </button>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Don't have an account?{' '}
                            <button
                              onClick={() => setMode('signup')}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
                            >
                              Sign up
                            </button>
                          </div>
                        </>
                      )}
                      
                      {mode === 'signup' && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Already have an account?{' '}
                          <button
                            onClick={() => setMode('signin')}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
                          >
                            Sign in
                          </button>
                        </div>
                      )}
                      
                      {mode === 'forgot-password' && (
                        <button
                          onClick={() => setMode('signin')}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
                        >
                          Back to sign in
                        </button>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}