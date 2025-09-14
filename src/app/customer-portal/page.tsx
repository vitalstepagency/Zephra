'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function CustomerPortalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/?signin=true&callbackUrl=/customer-portal')
      return
    }

    // Wait for session to be loaded
    if (status === 'loading') return

    // If authenticated, redirect to Stripe Customer Portal
    if (session?.user) {
      redirectToCustomerPortal()
    }
  }, [session, status, router])

  const redirectToCustomerPortal = async () => {
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: '/dashboard',
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create customer portal session')
      }
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Customer portal error:', error)
      setError('Failed to open customer portal. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Customer Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isLoading ? 'Redirecting to Stripe Customer Portal...' : 'Manage your subscription'}
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
            <button
              className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => router.push('/dashboard')}
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}