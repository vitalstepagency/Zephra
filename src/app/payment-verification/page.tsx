'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CheckCircle, XCircle, Loader2, CreditCard, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type PaymentStatus = 'pending' | 'success' | 'failed' | 'timeout'

function PaymentVerificationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<PaymentStatus>('pending')
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  const { data: session, status: authStatus } = useSession()
  
  const sessionId = searchParams.get('session_id')
  const maxWaitTime = 300 // 5 minutes in seconds
  
  // Redirect unauthenticated users
  useEffect(() => {
    if (authStatus === 'loading') return
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [authStatus, router])
  
  useEffect(() => {
    if (!sessionId || authStatus !== 'authenticated') return
    
    let interval: NodeJS.Timeout
    let timeoutId: NodeJS.Timeout
    
    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/stripe/verify-payment?session_id=${sessionId}`)
        const data = await response.json()
        
        if (response.ok) {
          if (data.status === 'complete') {
            setStatus('success')
            // Redirect to onboarding after a brief delay
            setTimeout(() => {
              router.push('/onboarding')
            }, 2000)
          } else if (data.status === 'failed') {
            setStatus('failed')
            setErrorMessage(data.error || 'Payment failed')
          }
          // If status is still 'pending', continue checking
        } else {
          console.error('Error checking payment status:', data.error)
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
      }
    }
    
    // Check immediately
    checkPaymentStatus()
    
    // Then check every 3 seconds
    interval = setInterval(checkPaymentStatus, 3000)
    
    // Set timeout after max wait time
    timeoutId = setTimeout(() => {
      if (status === 'pending') {
        setStatus('timeout')
        setErrorMessage('Payment verification timed out. Please contact support if your payment was processed.')
      }
    }, maxWaitTime * 1000)
    
    return () => {
      clearInterval(interval)
      clearTimeout(timeoutId)
    }
  }, [sessionId, authStatus, status, router])
  
  useEffect(() => {
    // Timer for elapsed time
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const handleRetryPayment = () => {
    router.push('/pricing')
  }
  
  const handleContactSupport = () => {
    // You can implement this to open a support chat or redirect to support page
    window.open('mailto:support@yourcompany.com', '_blank')
  }
  
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border-slate-700/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'pending' && (
              <div className="relative">
                <CreditCard className="w-16 h-16 text-blue-400 mx-auto" />
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin absolute -bottom-1 -right-1" />
              </div>
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
            )}
            {(status === 'failed' || status === 'timeout') && (
              <XCircle className="w-16 h-16 text-red-400 mx-auto" />
            )}
          </div>
          
          <CardTitle className="text-white">
            {status === 'pending' && 'Verifying Your Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
            {status === 'timeout' && 'Verification Timeout'}
          </CardTitle>
          
          <CardDescription className="text-slate-400">
            {status === 'pending' && 'Please wait while we confirm your payment with Stripe...'}
            {status === 'success' && 'Your subscription is now active. Redirecting to onboarding...'}
            {status === 'failed' && 'There was an issue processing your payment.'}
            {status === 'timeout' && 'We\'re still processing your payment in the background.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'pending' && (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-slate-400 mb-4">
                <Clock className="w-4 h-4" />
                <span>Time elapsed: {formatTime(timeElapsed)}</span>
              </div>
              
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((timeElapsed / maxWaitTime) * 100, 100)}%` }}
                />
              </div>
              
              <p className="text-xs text-slate-500 mt-2">
                This usually takes 10-30 seconds
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <Alert className="border-green-500/20 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                Welcome to your new subscription! You'll be redirected to onboarding shortly.
              </AlertDescription>
            </Alert>
          )}
          
          {(status === 'failed' || status === 'timeout') && (
            <>
              <Alert className="border-red-500/20 bg-red-500/10">
                <XCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  {errorMessage}
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={handleRetryPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Try Payment Again
                </Button>
                
                <Button 
                  onClick={handleContactSupport}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Contact Support
                </Button>
              </div>
            </>
          )}
          
          {sessionId && (
            <div className="text-xs text-slate-500 text-center">
              Session ID: {sessionId.slice(-8)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <PaymentVerificationContent />
    </Suspense>
  )
}