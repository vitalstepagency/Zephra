'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  
  useEffect(() => {
    // Clear checkout-related localStorage items
    localStorage.removeItem('checkout_session_id')
    localStorage.removeItem('stripe_checkout_session_id')
    localStorage.removeItem('checkout_email')
    localStorage.removeItem('checkout_name')
    localStorage.removeItem('billing_frequency')
    localStorage.removeItem('selected_plan')
    localStorage.removeItem('selected_frequency')
    localStorage.removeItem('redirect_to_checkout')
    localStorage.removeItem('redirectToCheckout')
    localStorage.removeItem('redirectCount')
    
    // Start countdown to redirect to dashboard
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Thank you for your purchase. Your subscription has been activated.
        </p>
        
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-600 dark:text-gray-300">
            You will receive a confirmation email shortly with your receipt and subscription details.
          </p>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300">
          Redirecting to dashboard in <span className="font-bold">{countdown}</span> seconds...
        </p>
        
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
        >
          Go to Dashboard Now
        </button>
      </motion.div>
    </div>
  )
}