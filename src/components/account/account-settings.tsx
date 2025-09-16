'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  Button,
  Badge,
  Separator
} from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Settings,
  LogOut,
  Crown,
  Calendar,
  CreditCard,
  ChevronDown,
  X,
  Sparkles,
  Shield
} from 'lucide-react'

interface UserProfile {
  user: {
    id: string
    email: string
    name: string | null
    subscriptionStatus: string
    subscriptionTier: string
    hasActiveSubscription: boolean
    isTrialActive: boolean
    trialEndsAt: string | null
    onboardingCompleted: boolean
    createdAt: string
    updatedAt: string
  }
  billing: {
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    status: string
    nextBillingDate: string | null
  } | null
}

interface AccountSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function AccountSettings({ isOpen, onClose }: AccountSettingsProps) {
  const { data: session } = useSession()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const userName = session?.user?.name || userProfile?.user?.name || 'User'
  const userEmail = session?.user?.email || userProfile?.user?.email || ''
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase()

  useEffect(() => {
    if (isOpen && session?.user?.id) {
      fetchUserProfile()
    }
  }, [isOpen, session?.user?.id])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getSubscriptionBadge = () => {
    const tier = userProfile?.user?.subscriptionTier || 'starter'
    const isActive = userProfile?.user?.hasActiveSubscription
    const isTrial = userProfile?.user?.isTrialActive

    if (isTrial) {
      return (
        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-3 py-1 rounded-full">
          <Sparkles className="w-3 h-3 mr-1" />
          Trial
        </Badge>
      )
    }

    if (isActive) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-3 py-1 rounded-full">
          <Crown className="w-3 h-3 mr-1" />
          {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="border-zinc-600 text-zinc-400 px-3 py-1 rounded-full">
        Free
      </Badge>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-4 right-4 w-96 z-50"
          >
            <Card className="bg-zinc-900/95 backdrop-blur-2xl border-zinc-800/50 shadow-2xl shadow-black/40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
              <CardContent className="relative p-0">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Account Settings</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 p-2 rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="p-6 text-center">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-zinc-400 text-sm">Loading account details...</p>
                  </div>
                ) : (
                  <>
                    {/* User Profile Section */}
                    <div className="p-6 border-b border-zinc-800/50">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-16 h-16 ring-2 ring-blue-500/20 ring-offset-2 ring-offset-zinc-900">
                          <AvatarImage src={session?.user?.image || ''} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white font-bold text-xl">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-white truncate">{userName}</h4>
                          <p className="text-sm text-zinc-400 truncate">{userEmail}</p>
                          <div className="mt-2">
                            {getSubscriptionBadge()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Details */}
                    <div className="p-6 border-b border-zinc-800/50">
                      <h5 className="text-sm font-medium text-white mb-4 flex items-center">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Subscription Details
                      </h5>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Status</span>
                          <span className="text-sm text-white capitalize">
                            {userProfile?.user?.subscriptionStatus || 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Plan</span>
                          <span className="text-sm text-white capitalize">
                            {userProfile?.user?.subscriptionTier || 'Free'}
                          </span>
                        </div>
                        
                        {userProfile?.user?.isTrialActive && userProfile?.user?.trialEndsAt && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-400">Trial Ends</span>
                            <span className="text-sm text-white">
                              {formatDate(userProfile.user.trialEndsAt)}
                            </span>
                          </div>
                        )}
                        
                        {userProfile?.billing?.nextBillingDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-400">Next Billing</span>
                            <span className="text-sm text-white">
                              {formatDate(userProfile.billing.nextBillingDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Account Info */}
                    <div className="p-6 border-b border-zinc-800/50">
                      <h5 className="text-sm font-medium text-white mb-4 flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Account Information
                      </h5>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Member Since</span>
                          <span className="text-sm text-white">
                            {formatDate(userProfile?.user?.createdAt || null)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Account ID</span>
                          <span className="text-xs text-zinc-500 font-mono">
                            {userProfile?.user?.id?.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6">
                      <div className="space-y-3">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-xl"
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Manage Subscription
                        </Button>
                        
                        <Button
                          variant="ghost"
                          onClick={handleSignOut}
                          className="w-full justify-start text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-xl"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}