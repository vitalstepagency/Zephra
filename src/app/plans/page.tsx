'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Shield } from 'lucide-react';
import { PRICING_PLANS } from '@/lib/stripe/config';
import { assertExists } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

export default function PlansPage() {
  const router = useRouter();
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'yearly'>('monthly');

  const handleViewPlan = (planId: string) => {
    router.push(`/plans/${planId}?billing=${billingFrequency}`);
  };

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
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow p-6 lg:p-12 relative z-10">
        <motion.div 
          className="w-full max-w-7xl mx-auto"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Select the perfect plan for your needs and start growing your business with Zephra.
            </p>
            
            <div className="inline-flex items-center bg-slate-800/50 p-1 rounded-lg mb-8">
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
          </motion.div>
          
          <motion.div variants={fadeInUp} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-indigo-500/50 transition-all duration-300 flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Starter</h2>
                <p className="text-slate-400">Perfect for individuals and small businesses just getting started.</p>
              </div>
              
              <div className="mb-6">
                {/* Use assertExists to ensure TypeScript knows these properties exist */}
                {(() => {
                  // Check if starter plan exists before using it
                  if (!PRICING_PLANS.starter) {
                    console.error('Starter plan is missing');
                    return <div>Starter plan details unavailable</div>;
                  }
                  
                  const starterPlan = PRICING_PLANS.starter;
                  return (
                    <>
                      <div className="text-4xl font-bold text-white">
                        ${billingFrequency === 'monthly' ? starterPlan.monthlyPrice : starterPlan.yearlyPrice}
                        <span className="text-slate-400 text-lg font-normal ml-1">/{billingFrequency === 'monthly' ? 'month' : 'year'}</span>
                      </div>
                      {billingFrequency === 'yearly' && (
                        <div className="text-sm text-emerald-400 mt-1">
                          Save ${(starterPlan.monthlyPrice * 12) - starterPlan.yearlyPrice} per year
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              
              <div className="mb-8 flex-grow">
                {(() => {
                  // Check if starter plan exists before using it
                  if (!PRICING_PLANS.starter) {
                    console.error('Starter plan is missing');
                    return <div>Starter plan details unavailable</div>;
                  }
                  
                  const starterPlan = PRICING_PLANS.starter;
                  return (
                    <ul className="space-y-3">
                      {starterPlan.features.slice(0, 5).map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                      {starterPlan.features.length > 5 && (
                        <li className="text-slate-400 text-sm mt-2 pl-8">+ {starterPlan.features.length - 5} more features</li>
                      )}
                    </ul>
                  );
                })()}
              </div>
              
              <Button 
                onClick={() => handleViewPlan('starter')}
                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl font-bold hover:from-indigo-700 hover:to-blue-700 transition-all duration-300"
              >
                View Plan Details
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
            
            {/* Pro Plan */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-indigo-500/50 rounded-2xl p-8 hover:border-indigo-500 transition-all duration-300 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                MOST POPULAR
              </div>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Pro</h2>
                <p className="text-slate-400">Ideal for growing businesses that need more advanced features.</p>
              </div>
              
              <div className="mb-6">
                {(() => {
                  // Check if pro plan exists before using it
                  if (!PRICING_PLANS.pro) {
                    console.error('Pro plan is missing');
                    return <div>Pro plan details unavailable</div>;
                  }
                  
                  const proPlan = PRICING_PLANS.pro;
                  return (
                    <>
                      <div className="text-4xl font-bold text-white">
                        ${billingFrequency === 'monthly' ? proPlan.monthlyPrice : proPlan.yearlyPrice}
                        <span className="text-slate-400 text-lg font-normal ml-1">/{billingFrequency === 'monthly' ? 'month' : 'year'}</span>
                      </div>
                      {billingFrequency === 'yearly' && (
                        <div className="text-sm text-emerald-400 mt-1">
                          Save ${(proPlan.monthlyPrice * 12) - proPlan.yearlyPrice} per year
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              
              <div className="mb-8 flex-grow">
                {(() => {
                  // Check if pro plan exists before using it
                  if (!PRICING_PLANS.pro) {
                    console.error('Pro plan is missing');
                    return <div>Pro plan details unavailable</div>;
                  }
                  
                  const proPlan = PRICING_PLANS.pro;
                  return (
                    <ul className="space-y-3">
                      {proPlan.features.slice(0, 5).map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                      {proPlan.features.length > 5 && (
                        <li className="text-slate-400 text-sm mt-2 pl-8">+ {proPlan.features.length - 5} more features</li>
                      )}
                    </ul>
                  );
                })()}
              </div>
              
              <Button 
                onClick={() => handleViewPlan('pro')}
                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl font-bold hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-xl shadow-indigo-500/20"
              >
                View Plan Details
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
            
            {/* Enterprise Plan */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-indigo-500/50 transition-all duration-300 flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Enterprise</h2>
                <p className="text-slate-400">For large organizations that need custom solutions and dedicated support.</p>
              </div>
              
              <div className="mb-6">
                <div className="text-4xl font-bold text-white">
                  ${billingFrequency === 'monthly' ? 499 : 4999}
                  <span className="text-slate-400 text-lg font-normal ml-1">/{billingFrequency === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingFrequency === 'yearly' && (
                  <div className="text-sm text-emerald-400 mt-1">
                    Save ${(499 * 12) - 4999} per year
                  </div>
                )}
              </div>
              
              <div className="mb-8 flex-grow">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Everything in Pro plan</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Unlimited AI generations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Custom integrations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Priority support</span>
                  </li>
                </ul>
              </div>
              
              <Button 
                onClick={() => handleViewPlan('enterprise')}
                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl font-bold hover:from-indigo-700 hover:to-blue-700 transition-all duration-300"
              >
                View Plan Details
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}