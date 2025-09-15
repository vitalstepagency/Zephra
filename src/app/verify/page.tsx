'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui'
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const [sessionData, setSessionData] = useState<any>(null)
  
  // Get session_id from URL parameters
  const sessionId = searchParams.get('session_id')
  
  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided')
      setVerificationStatus('error')
      return
    }
    
    verifyPayment()
  }, [sessionId])
  
  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
      const data = await response.json()
      
      if (response.ok && data.verified) {
        setSessionData(data)
        setVerificationStatus('success')
        
        // Auto-redirect to sign-in after 3 seconds
        setTimeout(() => {
          router.push(`/signin?session_id=${sessionId}&redirect=/onboarding`)
        }, 3000)
      } else {
        setError(data.error || 'Payment verification failed')
        setVerificationStatus('error')
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError('Failed to verify payment')
      setVerificationStatus('error')
    }
  }
  
  const handleContinue = () => {
    router.push(`/signin?session_id=${sessionId}&redirect=/onboarding`)
  }
  
  const handleRetry = () => {
    setVerificationStatus('loading')
    setError('')
    verifyPayment()
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-md w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center"
      >
        {/* Zephra Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">Z</span>
          </div>
          <span className="ml-3 text-2xl font-bold text-white">Zephra</span>
        </div>
        
        {verificationStatus === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Verifying Payment</h2>
              <p className="text-slate-400">Please wait while we confirm your payment and set up your account...</p>
            </div>
          </motion.div>
        )}
        
        {verificationStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-green-400" />
              </motion.div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Verified!</h2>
              <p className="text-slate-400 mb-4">Your payment has been successfully processed. You'll be redirected to sign in shortly.</p>
              {sessionData && (
                <div className="text-sm text-slate-500 space-y-1">
                  <p>Plan: {sessionData.subscriptionId ? 'Premium' : 'Starter'}</p>
                  <p>Email: {sessionData.customerEmail}</p>
                </div>
              )}
            </div>
            <Button 
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
            >
              Continue to Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-slate-500">Redirecting automatically in 3 seconds...</p>
          </motion.div>
        )}
        
        {verificationStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-slate-400 mb-4">{error}</p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => router.push('/signin')}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Continue to Sign In
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}