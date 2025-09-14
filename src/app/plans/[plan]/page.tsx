'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Shield, Zap, Sparkles, Eye, EyeOff, Mail } from 'lucide-react';
import { PRICING_PLANS } from '@/lib/stripe/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 0.61, 0.36, 1]
    }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

function PlanSignupContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const planId = params?.plan as string;
  
  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{email?: string, name?: string, password?: string}>({});
  
  // Plan state
  const frequency = searchParams.get('frequency') as 'monthly' | 'yearly';
  const redirectToCheckout = searchParams.get('redirectToCheckout') === 'true';
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'yearly'>(frequency || 'monthly');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Validate plan ID and get plan details
  const validPlanIds = ['starter', 'pro', 'professional', 'enterprise', 'elite'];
  const normalizedPlanId = typeof planId === 'string' && validPlanIds.includes(planId) ? planId : 'pro';
  
  // Map aliases to actual plan keys
  const planKeyMap: Record<string, keyof typeof PRICING_PLANS> = {
    'starter': 'starter',
    'pro': 'pro',
    'professional': 'pro',
    'enterprise': 'enterprise',
    'elite': 'enterprise'
  };
  
  const planKey = planKeyMap[normalizedPlanId] || 'pro';
  const plan = PRICING_PLANS[planKey];

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // Check if user is already logged in and should be redirected
        const session = await getSession();
        if (session && redirectToCheckout) {
          // User is logged in and should be redirected to checkout
          const params = new URLSearchParams({
            plan: normalizedPlanId,
            billing: billingFrequency
          });
          router.push(`/checkout?${params.toString()}`);
        }
      } catch (error) {
        // Handle auth session missing error gracefully
        console.error('Error checking user:', error);
        // Continue with null user - they'll need to sign up
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [router, normalizedPlanId, billingFrequency, redirectToCheckout]);

  // Store plan selection in localStorage to persist through sign-in redirects
  useEffect(() => {
    if (planId) {
      localStorage.setItem('selected_plan', planId);
      localStorage.setItem('selected_frequency', billingFrequency);
      localStorage.setItem('redirect_to_checkout', redirectToCheckout ? 'true' : 'false');
    }
  }, [planId, billingFrequency, redirectToCheckout]);

  const validateForm = () => {
    const newErrors: {email?: string, name?: string, password?: string} = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!name || name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { toast } = useToast();
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // First create the account via API
      const response = await fetch('/api/auth/simple-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password, 
          name: name.trim() 
        })
      });
      
      if (response.ok) {
        // Store credentials and plan selection in localStorage for session restoration
        localStorage.setItem('checkout_email', email.trim().toLowerCase());
        localStorage.setItem('checkout_name', name.trim());
        localStorage.setItem('selectedPlan', normalizedPlanId);
        localStorage.setItem('billingFrequency', billingFrequency);
        localStorage.setItem('redirectToCheckout', 'true');
        
        toast({
          title: 'Account created successfully!',
          description: 'Redirecting to checkout...'
        });
        
        // Sign in with redirect to checkout
        await signIn('credentials', {
          email,
          password,
          redirect: true,
          callbackUrl: `/checkout?plan=${normalizedPlanId}&billing=${billingFrequency}`
        });
        
        // The redirect will happen automatically from signIn
      } else {
        const error = await response.json();
        setErrors({ email: error.message || 'Sign up failed' });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setErrors({ email: 'An error occurred during sign up' });
      toast({
        variant: 'destructive',
        title: 'Error creating account',
        description: 'An unexpected error occurred during sign up'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Plan Not Found</h1>
          <p className="text-slate-400 mb-8">The plan you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/pricing')} className="bg-gradient-to-r from-indigo-600 to-blue-600">
            View All Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]" />
      
      {/* Header */}
      <header className="relative z-10 py-6 px-6 lg:px-8 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Zephra</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={() => router.push('/pricing')}
            >
              View All Plans
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row items-stretch relative z-10">
        {/* Plan Details Section - Left Side */}
        <motion.div 
          className="w-full md:w-1/2 p-6 lg:p-12 flex flex-col justify-center"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {plan.name} Plan
            </h1>
            <p className="text-xl text-slate-300 mb-6">
              Unlock powerful marketing automation and growth tools
            </p>
            
            <div className="inline-flex items-center bg-slate-800/50 p-1 rounded-lg mb-6">
              <button
                className={`px-4 py-2 rounded-md transition-all ${billingFrequency === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setBillingFrequency('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 rounded-md transition-all ${billingFrequency === 'yearly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setBillingFrequency('yearly')}
              >
                Yearly
                <span className="ml-1 text-xs text-emerald-400">Save 15%</span>
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-600/20 to-blue-600/20 backdrop-blur-xl rounded-2xl border border-indigo-500/30 p-6 mb-8 inline-block">
              <div className="text-4xl font-black text-white mb-2">
                ${billingFrequency === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                <span className="text-slate-400 text-lg font-normal ml-1">/{billingFrequency === 'monthly' ? 'month' : 'year'}</span>
              </div>
              {billingFrequency === 'yearly' && (
                <div className="text-sm text-emerald-400">
                  Save ${(plan.monthlyPrice * 12) - plan.yearlyPrice} per year
                </div>
              )}
            </div>
          </motion.div>
          
          <motion.div variants={fadeInUp} className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">What's Included</h2>
            
            <ul className="space-y-3">
              {plan.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          
          {plan.detailedFeatures && Object.entries(plan.detailedFeatures).length > 0 && (
            <motion.div variants={fadeInUp} className="space-y-6 mb-8">
              {Object.entries(plan.detailedFeatures).map(([key, feature]: [string, any]) => (
                <div key={key} className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-4">
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 mb-3 text-sm">{feature.description}</p>
                  {feature.items && (
                    <ul className="space-y-2">
                      {feature.items.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-300 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Sign Up Form - Right Side */}
        <motion.div 
          className="w-full md:w-1/2 p-6 lg:p-12 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm border-l border-slate-700/30"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div 
                className="flex items-center justify-center mb-3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-7 h-7 text-white" />
                </div>
              </motion.div>
              
              <motion.h2 
                className="text-3xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Create Your Account
              </motion.h2>
              
              <motion.p 
                className="text-slate-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Start your journey to marketing success
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Badge className="mt-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {plan.name} Plan Selected
                </Badge>
              </motion.div>
            </div>

            {/* Sign Up Card */}
            <motion.div variants={cardVariants}>
              <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 shadow-2xl border-indigo-500/20">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-xl text-white">Get Started</CardTitle>
                  <CardDescription className="text-slate-400">
                    Choose your preferred sign-up method
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Sign Up Form */}
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-300 font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 py-5"
                        disabled={isLoading}
                      />
                      {errors.name && (
                        <p className="text-red-400 text-sm">{errors.name}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300 font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 py-5"
                        disabled={isLoading}
                      />
                      {errors.email && (
                        <p className="text-red-400 text-sm">{errors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300 font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 py-5 pr-12"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-slate-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-red-400 text-sm">{errors.password}</p>
                      )}
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 py-6 font-semibold mt-4 rounded-xl shadow-lg shadow-indigo-500/20"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                          Creating Account...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Mail className="w-5 h-5 mr-2" />
                          Create Account
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </div>
                      )}
                    </Button>
                  </form>

                  {/* Trust Indicators */}
                  <div className="mt-6 text-center">
                    <div className="flex items-center justify-center space-x-8 mb-5 bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl p-3">
                      <div className="flex items-center text-slate-300 text-sm">
                        <Shield className="w-4 h-4 mr-2 text-emerald-400" />
                        Secure & Encrypted
                      </div>
                      <div className="flex items-center text-slate-300 text-sm">
                        <Zap className="w-4 h-4 mr-2 text-indigo-400" />
                        Instant Setup
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 mb-3">
                      By creating an account, you agree to our{' '}
                      <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline">
                        Privacy Policy
                      </Link>
                    </p>
                    
                    <p className="text-slate-300 text-sm">
                      Already have an account?{' '}
                      <Link 
                        href="/auth/signin" 
                        className="text-indigo-400 hover:text-indigo-300 font-medium underline"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function PlanSignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlanSignupContent />
    </Suspense>
  );
}