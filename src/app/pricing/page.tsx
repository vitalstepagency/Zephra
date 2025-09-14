'use client'

import { useState } from 'react'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Check, Star, Zap, Shield, Users, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

// Import pricing plans from the Stripe config
import { PRICING_PLANS } from '@/lib/stripe/config'

const plans = [
  {
    name: PRICING_PLANS.starter.name,
    price: PRICING_PLANS.starter.monthlyPrice,
    description: PRICING_PLANS.starter.description,
    features: PRICING_PLANS.starter.features,
    popular: false,
    cta: 'Get Started'
  },
  {
    name: PRICING_PLANS.pro.name,
    price: PRICING_PLANS.pro.monthlyPrice,
    description: PRICING_PLANS.pro.description,
    features: PRICING_PLANS.pro.features,
    popular: true,
    cta: 'Get Started'
  },
  {
    name: PRICING_PLANS.enterprise.name,
    price: PRICING_PLANS.enterprise.monthlyPrice,
    description: PRICING_PLANS.enterprise.description,
    features: PRICING_PLANS.enterprise.features,
    popular: false,
    cta: 'Contact Sales'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your business. All plans include our core features with no hidden fees.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${!isAnnual ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500'}`}>
              Annual
            </span>
            {isAnnual && (
              <Badge variant="secondary" className="ml-2">
                Save 20%
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {plans.map((plan, index) => (
            <motion.div key={plan.name} variants={cardVariants}>
              <Card className={`relative h-full ${plan.popular ? 'ring-2 ring-blue-500 shadow-xl scale-105' : 'hover:shadow-lg'} transition-all duration-300`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      ${isAnnual ? Math.round(plan.price * 0.8) : plan.price}
                    </span>
                    <span className="text-slate-500 ml-1">/month</span>
                    {isAnnual && (
                      <div className="text-sm text-slate-500 mt-1">
                        Billed annually (${Math.round(plan.price * 0.8 * 12)})
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-6">
                    <Button 
                      asChild
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      <Link href={`/plans/${plan.name.toLowerCase()}?frequency=${isAnnual ? 'yearly' : 'monthly'}`}>
                        {plan.cta}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-24 text-center"
        >
          <h2 className="text-3xl font-bold mb-12">All plans include</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Lightning Fast</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Optimized performance for quick campaign deployment
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Secure & Reliable</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Enterprise-grade security with 99.9% uptime guarantee
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Detailed insights and reporting for data-driven decisions
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-24 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  We offer a 14-day free trial for all plans. No credit card required to get started.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  We accept all major credit cards, PayPal, and bank transfers for annual plans.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}