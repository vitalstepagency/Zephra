'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Button,
  Badge
} from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Settings,
    Zap,
    Crown,
    Sparkles,
    ArrowRight,
    Star,
    Wand2,
    Brain,
    Rocket
  } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AIChat } from '@/components/chat/ai-chat'
import { AccountSettings } from '@/components/account/account-settings'

function OnboardingContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'starter'
  const checkoutSuccess = searchParams.get('checkout') === 'success'
  const fromCheckout = searchParams.get('fromCheckout') === 'true'
  const isFromCheckoutFlow = checkoutSuccess || fromCheckout
  const userName = session?.user?.name || 'User'
  const userEmail = session?.user?.email || ''
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase()
  
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  
  useEffect(() => {
    if (status === 'unauthenticated' && !isFromCheckoutFlow) {
      const currentUrl = window.location.pathname + window.location.search
      router.push(`/signin?callbackUrl=${encodeURIComponent(currentUrl)}`)
      return
    }
  }, [session, status, router, isFromCheckoutFlow])
  
  if (!session && status === 'loading' && !isFromCheckoutFlow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm font-medium">Loading Zephra...</p>
        </div>
      </div>
    )
  }
  
  const canProceedWithOnboarding = session || isFromCheckoutFlow
  if (!canProceedWithOnboarding) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white overflow-hidden">
      {/* Top Navigation */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 p-6"
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Zephra
            </h1>
          </motion.div>

          {/* Account Settings Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              onClick={() => setShowAccountSettings(true)}
              className="flex items-center space-x-3 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-2xl px-4 py-3 transition-all duration-300"
            >
              <Avatar className="w-8 h-8 ring-2 ring-blue-500/20">
                <AvatarImage src={session?.user?.image || ''} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white font-bold text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-white">{userName}</p>
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs px-2 py-0 rounded-full">
                  <Crown className="w-2 h-2 mr-1" />
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </Badge>
              </div>
              <Settings className="w-4 h-4 text-white/70" />
            </Button>
          </motion.div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 px-6 py-12 text-center"
      >
        <div className="max-w-4xl mx-auto">
          {/* Welcome Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full px-6 py-3 mb-8"
          >
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 font-medium">Welcome to the Future of Marketing</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-6xl md:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Welcome to
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Zephra
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Your AI-powered marketing companion is ready to transform your business. 
            Let's create something extraordinary together.
          </motion.p>

          {/* Feature Highlights */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6 mb-16"
          >
            {[
              { icon: Brain, text: "AI-Powered Insights" },
              { icon: Wand2, text: "Automated Campaigns" },
              { icon: Rocket, text: "Growth Acceleration" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                className="flex items-center space-x-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4"
              >
                <feature.icon className="w-5 h-5 text-blue-400" />
                <span className="text-white/80 font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Chat Interface Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className="relative z-10 px-6 pb-12"
      >
        <div className="max-w-5xl mx-auto">
          {/* Chat Container */}
          <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/20 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
            
            {/* Chat Header */}
            <div className="relative text-center mb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h2 className="text-2xl font-bold text-white mb-3">
                  Let's Get Started
                </h2>
                <p className="text-white/60 text-lg">
                  Tell me about your business and I'll help you create the perfect marketing strategy
                </p>
              </motion.div>
            </div>

            {/* AI Chat Interface */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.9 }}
               className="relative bg-black/20 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden"
             >
               <AIChat 
                 businessName={userName}
                 industry=""
                 currentChallenges=""
                 onComplete={async () => {
                   try {
                     // Mark onboarding as completed
                     const response = await fetch('/api/onboarding', {
                       method: 'POST',
                       headers: {
                         'Content-Type': 'application/json',
                       },
                       body: JSON.stringify({
                         businessName: userName,
                         industry: 'General',
                         teamSize: '1-5',
                         currentChallenges: 'Getting started',
                         monthlyGoal: '10000',
                         primaryObjective: 'Lead Generation',
                         plan: plan || 'starter',
                         completedAt: new Date().toISOString()
                       })
                     })
                     
                     if (response.ok) {
                       // Redirect to dashboard after successful completion
                       router.push('/dashboard')
                     } else {
                       console.error('Failed to mark onboarding as complete')
                       // Still redirect to dashboard even if API fails
                       router.push('/dashboard')
                     }
                   } catch (error) {
                     console.error('Error completing onboarding:', error)
                     // Still redirect to dashboard even if API fails
                     router.push('/dashboard')
                   }
                 }}
               />
             </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
        
        {/* Floating Stars */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Account Settings Modal */}
      <AccountSettings 
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
      />
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm font-medium">Loading Zephra...</p>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}