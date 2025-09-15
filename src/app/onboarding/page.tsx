'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { CheckCircle, ArrowRight, Sparkles, Target, Users, Zap, Crown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PRICING_PLANS } from '@/lib/stripe/config'
import { AIChat } from '@/components/chat/ai-chat'

const steps = [
  {
    id: 1,
    title: 'Welcome to Zephra',
    description: 'Let\'s get you set up for success'
  },
  {
    id: 2,
    title: 'Tell us about your business',
    description: 'Help us personalize your experience'
  },
  {
    id: 3,
    title: 'Set your goals',
    description: 'What do you want to achieve?'
  },
  {
    id: 4,
    title: 'You\'re all set!',
    description: 'Welcome to your new marketing powerhouse'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 0.61, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3
    }
  }
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
}

function OnboardingContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'starter'
  const checkoutSuccess = searchParams.get('checkout') === 'success'
  const userName = session?.user?.name || ''
  
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    teamSize: '',
    currentChallenges: '',
    primaryGoals: [] as string[],
    monthlyBudget: '',
    timelineExpectation: '',
    monthlyGoal: '',
    primaryObjective: ''
  })
  
  // All hooks must be called before any conditional returns
  useEffect(() => {
    // Redirect to signin if no session, but preserve the current URL as callbackUrl
    if (status === 'unauthenticated') {
      console.log('❌ Onboarding: No session found, redirecting to signin')
      const currentUrl = window.location.pathname + window.location.search
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`)
      return
    }
    
    console.log('✅ Onboarding: Session found, user can proceed with onboarding')
  }, [session, status, router])
  
  // Show loading state while session is loading - moved after all hooks
  if (!session && status !== 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4" />
          <p className="text-white text-lg">Loading your account...</p>
        </div>
      </div>
    )
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setDirection(1)
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = async () => {
    setIsLoading(true)
    
    try {
      // Save onboarding data
      const onboardingResponse = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          plan,
          completedAt: new Date().toISOString()
        }),
      })

      if (onboardingResponse.ok) {
        // Redirect to dashboard with welcome message
        router.push('/dashboard?welcome=true&onboarding_completed=true')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const progress = (currentStep / steps.length) * 100

  // Loading state is already handled by the early return above

  // Show welcome message for checkout success
  const showWelcomeMessage = checkoutSuccess

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)]" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
          
          <Badge className="mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
            <Crown className="w-3 h-3 mr-1" />
            {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
          </Badge>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome{userName ? `, ${userName.split(' ')[0] || ''}` : ''}!
          </h1>
          
          <p className="text-slate-400 text-lg">
            Let's get your marketing automation set up in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-slate-400">Step {currentStep} of {steps.length}</span>
            <span className="text-sm text-slate-400">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
            >
              <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 shadow-2xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl text-white">
                    {steps[currentStep - 1]?.title}
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-lg">
                    {steps[currentStep - 1]?.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Step 1: Welcome */}
                  {currentStep === 1 && (
                    <div className="text-center space-y-6">
                      <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                        <Sparkles className="w-12 h-12 text-white" />
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white">
                          You're about to transform your marketing
                        </h3>
                        <p className="text-slate-300 leading-relaxed">
                          Zephra's AI will help you create, optimize, and scale your marketing campaigns 
                          automatically. Let's personalize your experience to get the best results.
                        </p>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 mt-8">
                        {[
                          { icon: <Target className="w-6 h-6" />, title: 'Smart Targeting', desc: 'AI finds your ideal customers' },
                          { icon: <Zap className="w-6 h-6" />, title: 'Auto-Optimization', desc: 'Campaigns improve themselves' },
                          { icon: <Users className="w-6 h-6" />, title: 'Scale Effortlessly', desc: 'Grow without the complexity' }
                        ].map((feature, index) => (
                          <div key={index} className="text-center p-4 bg-slate-800/30 rounded-lg">
                            <div className="text-indigo-400 mb-2 flex justify-center">{feature.icon}</div>
                            <h4 className="text-white font-medium mb-1">{feature.title}</h4>
                            <p className="text-slate-400 text-sm">{feature.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Business Info */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="businessName" className="text-slate-300 font-medium">
                            Business Name
                          </Label>
                          <Input
                            id="businessName"
                            placeholder="Enter your business name"
                            value={formData.businessName}
                            onChange={(e) => updateFormData('businessName', e.target.value)}
                            className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="industry" className="text-slate-300 font-medium">
                            Industry
                          </Label>
                          <Input
                            id="industry"
                            placeholder="e.g., E-commerce, SaaS, Consulting"
                            value={formData.industry}
                            onChange={(e) => updateFormData('industry', e.target.value)}
                            className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="teamSize" className="text-slate-300 font-medium">
                          Team Size
                        </Label>
                        <select
                          id="teamSize"
                          value={formData.teamSize}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateFormData('teamSize', e.target.value)}
                          className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">Select team size</option>
                          <option value="1">Just me</option>
                          <option value="2-5">2-5 people</option>
                          <option value="6-20">6-20 people</option>
                          <option value="21-50">21-50 people</option>
                          <option value="50+">50+ people</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="currentChallenges" className="text-slate-300 font-medium">
                          What's your biggest marketing challenge?
                        </Label>
                        <textarea
                          id="currentChallenges"
                          placeholder="Tell us about your current marketing challenges..."
                          value={formData.currentChallenges}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('currentChallenges', e.target.value)}
                          className="w-full bg-slate-800/50 border border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500 min-h-[100px] rounded-md px-3 py-2 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Goals */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="monthlyGoal" className="text-slate-300 font-medium">
                            Monthly Revenue Goal
                          </Label>
                          <select
                            id="monthlyGoal"
                            value={formData.monthlyGoal}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateFormData('monthlyGoal', e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="">Select your goal</option>
                            <option value="<10k">Less than $10k</option>
                            <option value="10k-50k">$10k - $50k</option>
                            <option value="50k-100k">$50k - $100k</option>
                            <option value="100k-500k">$100k - $500k</option>
                            <option value="500k+">$500k+</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="primaryObjective" className="text-slate-300 font-medium">
                            Primary Objective
                          </Label>
                          <select
                            id="primaryObjective"
                            value={formData.primaryObjective}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateFormData('primaryObjective', e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="">Select objective</option>
                            <option value="lead-generation">Generate more leads</option>
                            <option value="sales-increase">Increase sales</option>
                            <option value="brand-awareness">Build brand awareness</option>
                            <option value="customer-retention">Improve customer retention</option>
                            <option value="market-expansion">Expand to new markets</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/30 rounded-lg p-6">
                        <h4 className="text-white font-semibold mb-3 flex items-center">
                          <Target className="w-5 h-5 mr-2 text-indigo-400" />
                          Your Personalized Strategy
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          Based on your goals, Zephra will create custom campaigns, optimize your funnels, 
                          and automate your follow-up sequences to help you achieve your revenue targets.
                        </p>
                      </div>
                      
                      <div className="mt-6 h-[500px]">
                        <AIChat 
                          businessName={formData.businessName}
                          industry={formData.industry}
                          currentChallenges={formData.currentChallenges}
                          onComplete={() => nextStep()}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 4: Complete */}
                  {currentStep === 4 && (
                    <div className="text-center space-y-6">
                      <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-12 h-12 text-white" />
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-white">
                          🎉 You're all set!
                        </h3>
                        <p className="text-slate-300 leading-relaxed">
                          Your Zephra account is ready to go. Our AI is already analyzing your business 
                          profile and preparing personalized campaign recommendations.
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg p-6 border border-indigo-500/20">
                        <h4 className="text-white font-semibold mb-3">What happens next?</h4>
                        <ul className="text-slate-300 text-sm space-y-2 text-left">
                          <li>• AI analyzes your business and creates your first campaign</li>
                          <li>• You'll receive personalized recommendations in your dashboard</li>
                          <li>• Start seeing results within 24-48 hours</li>
                          <li>• Our team will check in to ensure you're getting great results</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
                
                {/* Navigation */}
                <div className="px-6 pb-6">
                  <div className="flex justify-between items-center">
                    <Button
                      onClick={prevStep}
                      variant="outline"
                      disabled={currentStep === 1}
                      className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                    >
                      Previous
                    </Button>
                    
                    {currentStep < steps.length ? (
                      <Button
                        onClick={nextStep}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleFinish}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Setting up...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            Go to Dashboard
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </div>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}