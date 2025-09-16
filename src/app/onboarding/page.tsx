'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Separator
} from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Bell,
    Search,
    Menu,
    MessageCircle,
    MessageSquare,
    User,
    X,
    Settings,
    LogOut,
    Zap,
    Crown,
    Sparkles,
    ChevronDown,
    TrendingUp
  } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AIChat } from '@/components/chat/ai-chat'

function DashboardContent() {
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
  
  const [showSettings, setShowSettings] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  useEffect(() => {
    if (status === 'unauthenticated' && !isFromCheckoutFlow) {
      const currentUrl = window.location.pathname + window.location.search
      router.push(`/signin?callbackUrl=${encodeURIComponent(currentUrl)}`)
      return
    }
  }, [session, status, router, isFromCheckoutFlow])
  
  if (!session && status === 'loading' && !isFromCheckoutFlow) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm font-medium">Loading Zephra...</p>
        </div>
      </div>
    )
  }
  
  const canProceedWithOnboarding = session || isFromCheckoutFlow
  if (!canProceedWithOnboarding) return null

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="h-screen bg-black text-white overflow-hidden flex">
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-zinc-900/80 backdrop-blur-2xl border-r border-zinc-800/30 flex flex-col transition-all duration-500 ease-out shadow-2xl shadow-black/20`}
      >
        {/* Sidebar Header */}
        <div className="p-8 border-b border-zinc-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Zap className="w-7 h-7 text-white" />
              </div>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    Zephra
                  </h1>
                  <p className="text-sm text-zinc-400 font-medium">AI Marketing Platform</p>
                </motion.div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 p-3 rounded-xl transition-all duration-200"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-8 border-b border-zinc-800/30">
          <div className="flex items-center space-x-4">
            <Avatar className="w-14 h-14 ring-2 ring-blue-500/20 ring-offset-2 ring-offset-zinc-900">
              <AvatarImage src={session?.user?.image || ''} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white font-bold text-xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <motion.div 
                className="flex-1 min-w-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <p className="text-lg font-semibold text-white truncate">{userName}</p>
                <p className="text-sm text-zinc-400 truncate">{userEmail}</p>
                <Badge className="mt-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs px-3 py-1 rounded-full">
                  <Crown className="w-3 h-3 mr-1" />
                  {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
                </Badge>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-8">
          <nav className="space-y-4">
            <motion.div 
              className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 shadow-lg"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <span className="font-semibold text-blue-400 text-lg">AI Assistant</span>
                  <p className="text-xs text-blue-300">Active conversation</p>
                </div>
              )}
            </motion.div>
            
            <motion.button 
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center space-x-4 p-4 rounded-2xl hover:bg-zinc-800/50 text-zinc-300 transition-all duration-200 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-12 h-12 bg-zinc-800 group-hover:bg-zinc-700 rounded-xl flex items-center justify-center transition-colors">
                <Settings className="w-6 h-6" />
              </div>
              {!sidebarCollapsed && <span className="font-medium text-lg">Settings</span>}
            </motion.button>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-8">
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full justify-start p-4 hover:bg-zinc-800/50 rounded-2xl transition-all duration-200"
            >
              <div className="flex items-center space-x-3 w-full">
                {!sidebarCollapsed && (
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-white">Account Status</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">All systems operational</p>
                  </div>
                )}
                {!sidebarCollapsed && <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </div>
            </Button>
            
            {/* User Menu Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 right-0 mb-4 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <Button
                    variant="ghost"
                    onClick={() => setShowSettings(true)}
                    className="w-full justify-start px-6 py-4 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-none"
                  >
                    <Settings className="w-5 h-5 mr-4" />
                    <span className="font-medium">Settings</span>
                  </Button>
                  <div className="h-px bg-zinc-800/50" />
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start px-6 py-4 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-none"
                  >
                    <LogOut className="w-5 h-5 mr-4" />
                    <span className="font-medium">Sign Out</span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="h-20 bg-zinc-900/40 backdrop-blur-2xl border-b border-zinc-800/30 flex items-center justify-between px-8 shadow-lg"
        >
          <div className="flex items-center space-x-6">
            <div>
              <h2 className="text-2xl font-bold text-white">AI Marketing Assistant</h2>
              <p className="text-base text-zinc-400 font-medium">Your intelligent marketing automation companion</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 p-3 rounded-xl transition-all duration-200">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 p-3 rounded-xl transition-all duration-200 relative">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
            </Button>
          </div>
        </motion.div>

        {/* Chat Interface */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 p-8"
        >
          <div className="h-full bg-zinc-900/30 backdrop-blur-xl rounded-3xl border border-zinc-800/30 overflow-hidden shadow-2xl shadow-black/20">
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
          </div>
        </motion.div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative px-8 py-6 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                        Settings
                      </h3>
                      <p className="text-sm text-slate-400 font-medium">
                        Manage your Zephra experience
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSettings(false)}
                    className="w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                {/* Account Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/60 rounded-3xl border border-white/10 backdrop-blur-sm shadow-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
                  <div className="relative">
                    <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-400" />
                      Account Information
                    </h4>
                    
                    <div className="space-y-6">
                      {/* Profile Section */}
                      <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-2xl border border-white/5">
                        <Avatar className="w-16 h-16 ring-2 ring-white/10">
                          <AvatarImage src={session?.user?.image || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-white text-lg">{userName}</p>
                          <p className="text-slate-400 font-medium">{userEmail}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-xs text-green-400 font-medium">Online</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Plan Section */}
                      <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl border border-yellow-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                              <Crown className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-white capitalize">{plan} Plan</p>
                              <p className="text-sm text-slate-400">Premium marketing automation</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                              <span className="text-xs font-bold text-white">ACTIVE</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Preferences Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/60 rounded-3xl border border-white/10 backdrop-blur-sm shadow-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
                  <div className="relative">
                    <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      AI Preferences
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-800/40 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">Smart Suggestions</span>
                          <div className="w-12 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full p-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-lg" />
                          </div>
                        </div>
                        <p className="text-sm text-slate-400">Get AI-powered marketing recommendations</p>
                      </div>
                      
                      <div className="p-4 bg-slate-800/40 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">Auto-optimization</span>
                          <div className="w-12 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full p-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-lg" />
                          </div>
                        </div>
                        <p className="text-sm text-slate-400">Automatically optimize campaigns based on performance</p>
                      </div>
                      
                      <div className="p-4 bg-slate-800/40 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">Real-time Insights</span>
                          <div className="w-12 h-6 bg-slate-600 rounded-full p-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full shadow-lg" />
                          </div>
                        </div>
                        <p className="text-sm text-slate-400">Receive instant notifications about campaign performance</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Support Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/60 rounded-3xl border border-white/10 backdrop-blur-sm shadow-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5" />
                  <div className="relative">
                    <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-blue-400" />
                      Support & Resources
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 bg-slate-800/40 hover:bg-slate-700/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-200 text-left"
                      >
                        <div className="text-white font-medium mb-1">Help Center</div>
                        <div className="text-xs text-slate-400">Browse documentation</div>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 bg-slate-800/40 hover:bg-slate-700/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-200 text-left"
                      >
                        <div className="text-white font-medium mb-1">Contact Support</div>
                        <div className="text-xs text-slate-400">Get personalized help</div>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-transparent to-purple-500/8" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/15 to-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/15 to-pink-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}