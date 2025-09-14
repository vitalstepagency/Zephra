'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { CreditCard } from 'lucide-react'

export function CustomerPortalButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleManageSubscription = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
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
      alert('Failed to open customer portal. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleManageSubscription}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="flex items-center"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Manage Subscription
        </>
      )}
    </Button>
  )
}