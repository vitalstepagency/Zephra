'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Shield, Lock, CreditCard, User, Mail, Phone, Building, MapPin, Calendar, ArrowRight, Star, Eye, EyeOff } from 'lucide-react';
import { createSupabaseClient, getCurrentUser } from '@/lib/supabase/client';
import { PRICING_PLANS } from '@/lib/stripe/config';
import { signIn as nextAuthSignIn } from 'next-auth/react'

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: readonly string[];
  popular?: boolean;
  priceIds: {
    readonly monthly: string;
    readonly yearly: string;
  };
  detailedFeatures?: any;
  limits?: any;
}

const pricingPlans: Record<string, PricingPlan> = {
  starter: { ...PRICING_PLANS.starter, id: 'starter' },
  pro: { ...PRICING_PLANS.pro, id: 'pro' },
  professional: { ...PRICING_PLANS.pro, id: 'professional' }, // alias for pro
  enterprise: { ...PRICING_PLANS.enterprise, id: 'enterprise' },
  elite: { ...PRICING_PLANS.enterprise, id: 'elite' } // alias for enterprise
};

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

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const planParam = searchParams.get('plan') || localStorage.getItem('selected_plan') || 'professional';
  const billingParam = searchParams.get('billing') || localStorage.getItem('selected_frequency') || 'monthly';
  
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // If no user is found, redirect to signup with plan parameters
        if (!currentUser) {
          const params = new URLSearchParams({
            plan: planParam,
            frequency: billingParam,
            redirectToCheckout: 'true'
          });
          router.push(`/auth/signup?${params.toString()}`);
          return;
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [router, planParam, billingParam]);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(() => {
    const validPlanKeys = Object.keys(pricingPlans) as (keyof typeof pricingPlans)[];
    const planKey: keyof typeof pricingPlans = validPlanKeys.includes(planParam as keyof typeof pricingPlans) 
      ? (planParam as keyof typeof pricingPlans) 
      : 'professional';
    return pricingPlans[planKey]!;
  });
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'yearly'>(billingParam === 'yearly' ? 'yearly' : 'monthly');
  
  // Store selected plan and frequency in localStorage for persistence
  useEffect(() => {
    if (planParam) localStorage.setItem('selected_plan', planParam);
    if (billingParam) localStorage.setItem('selected_frequency', billingParam);
  }, [planParam, billingParam]);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Helper functions for pricing
  const getCurrentPrice = () => billingFrequency === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice;
  const getCurrentPriceId = () => billingFrequency === 'monthly' ? selectedPlan.priceIds.monthly : selectedPlan.priceIds.yearly;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Email validation (required for both modes)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation (required for both modes)
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (authMode === 'signup' && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (authMode === 'signup' && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    // Name validation (only required for signup)
    if (authMode === 'signup') {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      
      // Confirm password validation (only for signup)
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      // Phone validation (optional but if provided, must be valid)
      if (formData.phone) {
        const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
        if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
          newErrors.phone = 'Please enter a valid phone number';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSecureCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // User should already be authenticated at this point
    // If not, they would have been redirected to signup
    if (!user) {
      const params = new URLSearchParams({
        plan: selectedPlan.id,
        frequency: billingFrequency,
        redirectToCheckout: 'true'
      });
      router.push(`/auth/signup?${params.toString()}`);
      return;
    }
    
    setIsLoading(true);
    
    try {

      // Validate priceId before sending
      const currentPriceId = getCurrentPriceId();
      if (!currentPriceId) {
        throw new Error(`No price ID found for plan: ${selectedPlan.id}`);
      }

      console.log('Creating checkout session with:', {
        priceId: currentPriceId,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        billingFrequency
      });
      
      // Store user email, name, and billing frequency for session restoration after payment
      if (user) {
        localStorage.setItem('checkout_email', user.email);
        localStorage.setItem('checkout_name', user.name || user.email.split('@')[0]);
        localStorage.setItem('billing_frequency', billingFrequency);
        localStorage.setItem('selected_plan', selectedPlan.id);
      }

      // Now create the checkout session (user is authenticated)
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          firstName: user.name?.split(' ')[0] || user.email.split('@')[0],
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          planId: selectedPlan.id,
          priceId: currentPriceId
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      
      // Store session ID for verification after payment
      if (data.id) {
        localStorage.setItem('checkout_session_id', data.id);
      }
      
      // Clear plan selection parameters to prevent redirection loops
      localStorage.removeItem('selected_plan');
      localStorage.removeItem('selected_frequency');
      localStorage.removeItem('redirect_to_checkout');
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Checkout', description: 'Complete your order' },
    { number: 2, title: 'Confirmation', description: 'Order confirmed' },
    { number: 3, title: 'Marketing Autopilot', description: 'Get started' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Progress Steps */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/30">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  currentStep >= step.number 
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 border-indigo-500 text-white' 
                    : 'border-slate-600 text-slate-400'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="font-bold">{step.number}</span>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className={`font-bold ${
                    currentStep >= step.number ? 'text-white' : 'text-slate-400'
                  }`}>{step.title}</h3>
                  <p className="text-sm text-slate-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className={`w-6 h-6 mx-8 ${
                    currentStep > step.number ? 'text-indigo-400' : 'text-slate-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left Column - Sales Copy & Plan Details */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="space-y-8"
          >
            {/* Hero Section */}
            <motion.div variants={fadeInUp}>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
                {selectedPlan.name} Plan
              </h1>
              <h2 className="text-xl md:text-2xl text-slate-300 mb-6">
                You're 60 Seconds Away From Never Worrying About Marketing Again
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                Everything you need to automate your marketing, generate consistent leads, and scale your business without the complexity or cost of traditional agencies.
              </p>

            </motion.div>



            {/* Plan Details */}
            <motion.div variants={fadeInUp} className="mb-12">
              <div className="text-center mb-12">
                <div className="text-center text-sm text-slate-400 space-y-2">
                  <p>🔒 Secure payment processing by Stripe</p>
                  <p>💳 All major payment methods accepted</p>
                  <p>🛡️ 14-day free trial included</p>
                  <p>⚡ Instant account activation</p>
                </div>
              </div>

              <div className="max-w-4xl mx-auto">


                {selectedPlan.name === 'Basic' && (
                   <div className="space-y-8">
                     {/* Strategic Foundation */}
                     <div className="space-y-3 border-t border-slate-700/50 pt-6">
                       <h4 className="text-xl font-bold text-white">Campaign strategy and planning</h4>
                       <p className="text-xs text-slate-400 mb-4 leading-relaxed">Your complete roadmap to marketing success - no guesswork, just results</p>
                       <ul className="space-y-2">
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Step-by-step implementation guide with weekly milestones</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Proven campaign templates that convert at 15%+ rates</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Monthly optimization checkpoints to maximize ROI</span></li>
                       </ul>
                     </div>

                     {/* Content Arsenal */}
                     <div className="space-y-3 border-t border-slate-700/50 pt-6">
                       <h4 className="text-xl font-bold text-white">High-Converting Ad Arsenal</h4>
                       <p className="text-xs text-slate-400 mb-4 leading-relaxed">25 battle-tested ad variations that stop the scroll and drive action</p>
                       <ul className="space-y-2">
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">High-retention video scripts with shot-by-shot breakdowns</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Scroll-stopping headlines that generate 3x more clicks</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Platform-specific variations for Facebook, Instagram & Google</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">A/B testing framework to identify your best performers</span></li>
                       </ul>
                     </div>

                     {/* Automation Engine */}
                     <div className="space-y-3 border-t border-slate-700/50 pt-6">
                       <h4 className="text-xl font-bold text-white">Set-and-Forget Sales System</h4>
                       <p className="text-xs text-slate-400 mb-4 leading-relaxed">Complete funnel that nurtures leads while you sleep</p>
                       <ul className="space-y-2">
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">7-email sequence that converts 25% of leads into customers</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">High-converting landing page templates with proven copy</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Lead magnets that attract your ideal customers</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Priority support to get everything set up perfectly</span></li>
                       </ul>
                     </div>
                   </div>
                 )}

                {selectedPlan.name === 'Pro' && (
                   <div className="space-y-8">
                     {/* Market Intelligence */}
                     <div className="space-y-3 border-t border-slate-700/50 pt-6">
                       <h4 className="text-xl font-bold text-white">Advanced Market Intelligence</h4>
                       <p className="text-xs text-slate-400 mb-4 leading-relaxed">Deep competitor analysis that reveals exactly how to dominate your market</p>
                       <ul className="space-y-2">
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">3 detailed customer personas with psychological triggers</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Competitor weakness analysis with positioning strategies</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Market gap identification for untapped opportunities</span></li>
                       </ul>
                     </div>

                     {/* Multi-Platform Domination */}
                     <div className="space-y-3 border-t border-slate-700/50 pt-6">
                       <h4 className="text-xl font-bold text-white">Multi-Platform Ad Domination</h4>
                       <p className="text-xs text-slate-400 mb-4 leading-relaxed">100 unique ad variations that flood every platform with your message</p>
                       <ul className="space-y-2">
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Platform-optimized creatives for Facebook, Instagram, Google & YouTube</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Weekly creative refreshes to prevent ad fatigue</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Advanced targeting strategies for maximum reach</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Cross-platform retargeting sequences</span></li>
                       </ul>
                     </div>

                     {/* Sales Funnel Ecosystem */}
                     <div className="space-y-3 border-t border-slate-700/50 pt-6">
                       <h4 className="text-xl font-bold text-white">Complete Sales Ecosystem</h4>
                       <p className="text-xs text-slate-400 mb-4 leading-relaxed">5 custom funnels that convert traffic into paying customers automatically</p>
                       <ul className="space-y-2">
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">High-converting landing pages with conversion tracking</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">12-email nurture sequences with 90%+ open rates</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">SMS campaigns for immediate engagement</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Weekly performance optimization and strategy calls</span></li>
                       </ul>
                     </div>
                   </div>
                 )}

                {selectedPlan.name === 'Elite' && (
                   <div className="space-y-8">
                     {/* Market Domination */}
                     <div className="space-y-3 border-t border-slate-700/50 pt-6">
                       <h4 className="text-xl font-bold text-white">Enterprise Market Domination</h4>
                       <p className="text-xs text-slate-400 mb-4 leading-relaxed">Complete competitive landscape control with brand authority campaigns</p>
                       <ul className="space-y-2">
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">5 detailed customer segments with psychological profiling</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Competitive landscape mapping and positioning strategy</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Brand authority campaigns that establish market leadership</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Industry-specific growth opportunity identification</span></li>
                       </ul>
                     </div>

                     {/* Unlimited Creative Engine */}
                     <div className="space-y-3 border-t border-slate-700/50 pt-6">
                       <h4 className="text-xl font-bold text-white">Unlimited Creative Domination</h4>
                       <p className="text-xs text-slate-400 mb-4 leading-relaxed">Flood every platform with fresh, high-converting content daily</p>
                       <ul className="space-y-2">
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Unlimited ad creatives across all major platforms including LinkedIn & TikTok</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Daily creative optimization and performance enhancement</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Advanced audience research and custom targeting strategies</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Cross-platform retargeting and lookalike audience scaling</span></li>
                       </ul>
                     </div>

                     {/* AI-Powered Intelligence */}
                     <div className="space-y-3 border-t border-slate-700/50 pt-6">
                       <h4 className="text-xl font-bold text-white">AI-Powered Marketing Intelligence</h4>
                       <p className="text-xs text-slate-400 mb-4 leading-relaxed">Predictive modeling that optimizes campaigns before you even launch</p>
                       <ul className="space-y-2">
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Custom AI models trained on your business data</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Predictive campaign performance modeling</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Automated optimization based on real-time data</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Executive-level reporting with actionable insights</span></li>
                       </ul>
                     </div>

                     {/* White-Glove Support */}
                     <div className="space-y-3 border-t border-slate-700/50 pt-6">
                       <h4 className="text-xl font-bold text-white">Executive-Level Support</h4>
                       <p className="text-xs text-slate-400 mb-4 leading-relaxed">Direct access to senior strategists and founder-level expertise</p>
                       <ul className="space-y-2">
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Dedicated senior marketing strategist assigned to your account</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Weekly strategy calls with direct founder access</span></li>
                         <li className="flex items-start"><CheckCircle className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">Custom business integrations and technical implementation</span></li>
                       </ul>
                     </div>
                   </div>
                 )}

                <div className="text-center mt-12">
                  <div className="inline-flex items-center bg-green-500/20 border border-green-500/50 rounded-lg px-6 py-3">
                    <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-300 font-bold">30-Day Money-Back Guarantee • Cancel Anytime • Instant Access</span>
                  </div>
                </div>
              </div>
            </motion.div>






          </motion.div>

          {/* Right Column - Checkout Form */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8"
          >
            <form onSubmit={handleSecureCheckout} className="space-y-8">
              {/* Authentication Mode Toggle */}
              <div className="space-y-4">
                <div className="flex bg-slate-700/50 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      authMode === 'signup'
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      authMode === 'signin'
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {errors.general && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-300 text-sm">{errors.general}</p>
                </div>
              )}
              
              {/* Personal Information */}
              {authMode === 'signup' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full px-3 py-3 bg-transparent border-2 rounded-xl text-white placeholder-slate-400 focus:ring-0 focus:outline-none transition-all text-sm ${
                        errors.firstName ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-indigo-500'
                      }`}
                      placeholder="John"
                      required
                    />
                    {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full px-3 py-3 bg-transparent border-2 rounded-xl text-white placeholder-slate-400 focus:ring-0 focus:outline-none transition-all text-sm ${
                        errors.lastName ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-indigo-500'
                      }`}
                      placeholder="Doe"
                      required
                    />
                    {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-3 bg-transparent border-2 rounded-xl text-white placeholder-slate-400 focus:ring-0 focus:outline-none transition-all text-sm ${
                        errors.email ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-indigo-500'
                      }`}
                      placeholder="john@company.com"
                      required
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full px-3 py-3 bg-transparent border-2 rounded-xl text-white placeholder-slate-400 focus:ring-0 focus:outline-none transition-all text-sm ${
                        errors.phone ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-indigo-500'
                      }`}
                      placeholder="(555) 123-4567"
                    />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Company (Optional)</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full px-3 py-3 bg-transparent border-2 border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-0 focus:outline-none transition-all text-sm"
                      placeholder="Your Company Name"
                    />
                  </div>
                </div>
                </div>
              )}

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4">{authMode === 'signin' ? 'Sign In' : 'Account Security'}</h3>
                
                {/* Email field for sign-in mode */}
                {authMode === 'signin' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-3 bg-transparent border-2 rounded-xl text-white placeholder-slate-400 focus:ring-0 focus:outline-none transition-all text-sm ${
                        errors.email ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-indigo-500'
                      }`}
                      placeholder="john@company.com"
                      required
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full px-3 py-3 pr-10 bg-transparent border-2 rounded-xl text-white placeholder-slate-400 focus:ring-0 focus:outline-none transition-all text-sm ${
                          errors.password ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-emerald-500'
                        }`}
                        placeholder={authMode === 'signin' ? 'Enter your password' : 'Create a strong password (8+ characters)'}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                  </div>
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className={`w-full px-3 py-3 pr-10 bg-transparent border-2 rounded-xl text-white placeholder-slate-400 focus:ring-0 focus:outline-none transition-all text-sm ${
                             errors.confirmPassword ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-emerald-500'
                           }`}
                           placeholder="Confirm your password"
                           required
                         />
                         <button
                           type="button"
                           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                         >
                           {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                         </button>
                       </div>
                       {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                     </div>
                   )}
                 </div>
               </div>

              {/* Security Notice */}
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Shield className="w-6 h-6 text-green-400" />
                  <h3 className="text-lg font-bold text-white">Secure Payment Processing</h3>
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-green-400" />
                    <span>256-bit SSL encryption protects your data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-green-400" />
                    <span>Powered by Stripe - trusted by millions worldwide</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>PCI DSS compliant payment processing</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Your payment information is processed securely. We never store your card details.
                </p>
              </div>

              {/* Order Summary */}
              <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/30">
                <h3 className="text-base font-bold text-white mb-3">Order Summary</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-300">{selectedPlan.name} Plan ({billingFrequency === 'monthly' ? 'Monthly' : 'Yearly'})</span>
                  <span className="text-sm text-white font-bold">${getCurrentPrice()}</span>
                </div>
                <div className="flex justify-between items-center mb-3 text-xs">
                  <span className="text-slate-400">Processing Fee</span>
                  <span className="text-slate-400">$0</span>
                </div>
                <div className="border-t border-slate-600 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-white">Total Today</span>
                    <span className="text-xl font-bold text-white">${getCurrentPrice()}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Billed {billingFrequency}. Cancel anytime.</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="space-y-6">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ 
                    scale: isLoading ? 1 : 1.02,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                  }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className={`relative w-full overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-500 hover:via-emerald-500 hover:to-green-500 text-white font-semibold py-4 px-6 rounded-xl text-lg shadow-2xl border border-green-500/50 hover:border-green-400/70 transition-all duration-500 mb-4 group ${
                    isLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {/* Animated shimmer overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                  
                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative flex items-center justify-center space-x-3">
                    {isLoading ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="tracking-wide">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                        <span className="tracking-wide">{authMode === 'signin' ? 'Sign In & Continue' : `Secure Checkout - $${getCurrentPrice()}/${billingFrequency === 'monthly' ? 'month' : 'year'}`}</span>
                      </>
                    )}
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </motion.button>

                <div className="text-center mb-4">
                  <p className="text-sm text-slate-300">Risk free for 30 days with a 100% money back guarantee.</p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-slate-500">
                    By completing this order, you agree to our <span className="text-blue-400 underline cursor-pointer">Terms of Service</span> and <span className="text-blue-400 underline cursor-pointer">Privacy Policy</span>.
                  </p>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}