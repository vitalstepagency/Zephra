'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, Clock, DollarSign, CheckCircle, ChevronRight, 
  TrendingUp, Target, Rocket, Brain, Users, Star, Play,
  BarChart3, Sparkles, Globe, MessageSquare, Mail, Smartphone,
  Eye, MousePointer, Layers, Gauge, ChevronDown, Plus, Minus
} from 'lucide-react';
import { PRICING_PLANS } from '@/lib/stripe/config';
import { AuthTrigger } from '@/components/auth/auth-trigger';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }
  }
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const textReveal = {
  initial: { opacity: 0, y: 50 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 0.61, 0.36, 1]
    }
  }
};

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'yearly'>('monthly');

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      // Use faster custom scroll animation
      const startPosition = window.pageYOffset;
      const targetPosition = pricingSection.offsetTop - 80; // 80px offset for header
      const distance = targetPosition - startPosition;
      const duration = 800; // Slightly slower duration
      let start: number | null = null;
      
      const animation = (currentTime: number) => {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
      };
      
      const ease = (t: number, b: number, c: number, d: number) => {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
      };
      
      requestAnimationFrame(animation);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Premium Header */}
      <header className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/zephra.png" 
                alt="Zephra Logo" 
                className="h-8 w-8"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Zephra
              </span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors duration-200">Features</a>
              <button onClick={scrollToPricing} className="text-slate-300 hover:text-white transition-colors duration-200">Pricing</button>
              <a href="#faq" className="text-slate-300 hover:text-white transition-colors duration-200">FAQ</a>
              <a href="/auth/signin" className="text-slate-300 hover:text-white transition-colors duration-200">Sign In</a>
              <button onClick={scrollToPricing} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl font-medium hover:from-indigo-700 hover:to-blue-700 transition-all duration-300">
                Join Zephra
              </button>
            </nav>

            <button className="md:hidden text-slate-300 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 lg:px-8 pt-16">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight"
              variants={textReveal}
            >
              Marketing on{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Autopilot
              </span>
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed"
              variants={textReveal}
            >
              The AI-powered platform that plans, scripts, and launches your Meta ads, funnels, and follow-ups—without hiring an agency.
            </motion.p>
            
            <motion.p
              className="text-lg md:text-xl text-slate-400 mb-12 max-w-4xl mx-auto leading-relaxed"
              variants={textReveal}
            >
              Fast, simple, and incredibly powerful.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
              variants={textReveal}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AuthTrigger
                  scrollToPricing={scrollToPricing}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-2xl shadow-indigo-500/25"
                >
                  Get Started Free
                </AuthTrigger>
              </motion.div>
            </motion.div>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-8 justify-center items-center text-sm text-slate-400 mb-8"
              variants={textReveal}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Meta-safe</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>First plan in 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span>No long contracts</span>
              </div>
            </motion.div>
            
            <motion.div
              className="text-slate-500 text-sm"
              variants={textReveal}
            >
              Trusted by over 1,000+ entrepreneurs
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Future of Marketing */}
      <section className="py-32 px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            className="text-4xl md:text-6xl lg:text-7xl font-black mb-12 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
          >
            THE FUTURE OF MARKETING IS HERE
          </motion.h2>
          
          <motion.div
            className="bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-12 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">#1</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold ml-4">AI Marketing Platform</h3>
            </div>
            
            <p className="text-xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Turn your business goals into stunning, automated marketing campaigns with Zephra's AI marketing platform. Personalize your approach with AI-powered strategies, campaign optimization, and flexible automation tools to create pro-level marketing on demand.
            </p>
            

          </motion.div>
        </div>
      </section>

      {/* What is Zephra */}
      <section className="py-32 px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-12"
              variants={textReveal}
            >
              WHAT IS <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">ZEPHRA?</span>
            </motion.h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Campaign Strategy */}
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8 group hover:border-indigo-500/50 transition-all duration-500"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="text-3xl mb-4">🧠</div>
                <h3 className="text-2xl font-bold text-white mb-4">Campaign Strategy Engine</h3>
                <p className="text-slate-300 leading-relaxed">
                  Intelligent campaign planning that delivers results. Zephra's AI strategy engine turns your business details into complete marketing plans with natural audience targeting, perfectly optimized budgets, and campaign architectures that convert.
                </p>
              </motion.div>

              {/* Ad Creative */}
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8 group hover:border-blue-500/50 transition-all duration-500"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="text-3xl mb-4">✍️</div>
                <h3 className="text-2xl font-bold text-white mb-4">Ad Creative Orchestrator</h3>
                <p className="text-slate-300 leading-relaxed">
                  Generate high-converting copy at scale. Create dozens of ad variations, headlines, and hooks that stop the scroll with copy that's better than 99% of human copywriters.
                </p>
              </motion.div>

              {/* Funnel Builder */}
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8 group hover:border-purple-500/50 transition-all duration-500"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="text-3xl mb-4">🔥</div>
                <h3 className="text-2xl font-bold text-white mb-4">Funnel Builder & Copywriter</h3>
                <p className="text-slate-300 leading-relaxed">
                  Complete sales systems in minutes. Build landing pages, sales pages, and email sequences with conversion-optimized copy. From lead magnets to upsells, create entire customer journeys.
                </p>
              </motion.div>

              {/* Email Automation */}
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8 group hover:border-emerald-500/50 transition-all duration-500"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="text-3xl mb-4">📧</div>
                <h3 className="text-2xl font-bold text-white mb-4">Email & SMS Automation</h3>
                <p className="text-slate-300 leading-relaxed">
                  Nurture leads while you sleep. Automated sequences that build trust, provide value, and convert prospects into customers with psychological triggers that compel action.
                </p>
              </motion.div>

              {/* Instagram Automation */}
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8 group hover:border-pink-500/50 transition-all duration-500"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="text-3xl mb-4">📱</div>
                <h3 className="text-2xl font-bold text-white mb-4">Instagram Organic Automation <span className="text-sm text-slate-400">(Coming Soon)</span></h3>
                <p className="text-slate-300 leading-relaxed">
                  Content that builds your brand. Weekly calendars, Reels scripts, and engagement strategies that grow your following without the daily grind of content creation.
                </p>
              </motion.div>

              {/* Use Case Summary */}
              <motion.div
                className="bg-gradient-to-r from-indigo-600/20 to-blue-600/20 backdrop-blur-xl rounded-3xl border border-indigo-500/30 p-8"
                variants={fadeInUp}
              >
                <h3 className="text-2xl font-bold text-white mb-4">AI Marketing for any use case</h3>
                <p className="text-slate-300 leading-relaxed">
                  Whether for lead generation, e-commerce, or service businesses, AI-powered campaigns bring your marketing to life with strategies and copy that convert.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-12"
              variants={textReveal}
            >
              HOW IT <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">WORKS</span>
            </motion.h2>
            
            <motion.h3
              className="text-3xl md:text-4xl font-bold text-slate-300 mb-16"
              variants={textReveal}
            >
              Create AI Marketing in Minutes
            </motion.h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Step 1 */}
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8 text-center"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-4">Tell us about your business</h4>
                <p className="text-slate-300 leading-relaxed">
                  Start a conversation with our intelligent chat system. It will ask targeted questions to understand your offer, target market, goals, ideal customer profile, and business objectives.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8 text-center"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-4">Define your marketing approach</h4>
                <p className="text-slate-300 leading-relaxed">
                  Choose your campaign structure, funnel strategy, and marketing goals. This determines how your campaigns will be built and how you'll reach your target market.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8 text-center"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-4">Let Zephra build it</h4>
                <p className="text-slate-300 leading-relaxed">
                  Our AI plans your complete marketing system based on your goals—campaign strategies, ad copy variations, funnel copy, email sequences, and automation workflows.
                </p>
              </motion.div>

              {/* Step 4 */}
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8 text-center"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-pink-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-4">Launch and optimize</h4>
                <p className="text-slate-300 leading-relaxed">
                  Deploy your campaigns and watch performance data flow in. Edit and refine based on results, then export optimized campaigns with detailed analytics.
                </p>
              </motion.div>
            </div>

            <motion.div
              className="mt-16"
              variants={textReveal}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AuthTrigger
                  scrollToPricing={scrollToPricing}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-2xl shadow-indigo-500/25"
                >
                  Start Your Journey
                </AuthTrigger>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Zephra Advantage */}
      <section id="features" className="py-32 px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-12"
              variants={textReveal}
            >
              THE ZEPHRA <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">ADVANTAGE</span>
            </motion.h2>
            
            <motion.h3
              className="text-3xl md:text-4xl font-bold text-slate-300 mb-16"
              variants={textReveal}
            >
              AI Marketing Generator: Tools to Create, Optimize & Automate
            </motion.h3>

            <div className="grid md:grid-cols-2 gap-12">
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <h4 className="text-2xl font-bold text-white mb-4">Intelligent Campaign Creation</h4>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Strategic planning that adapts to your business. Zephra's AI creates custom campaigns tailored to your business with natural strategy flow, perfectly synced messaging, and optimized conversion paths.
                </p>
                <p className="text-slate-400 text-sm">
                  Input your business data, define your objectives, or generate from custom prompts to start creating agency-level campaigns.
                </p>
              </motion.div>

              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <h4 className="text-2xl font-bold text-white mb-4">Professional Video Content Creation</h4>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Create authentic video ads that convert. Generate detailed UGC shot lists with frame-by-frame scripts for real-world content creation.
                </p>
                <p className="text-slate-400 text-sm">
                  Perfect for businesses that want authentic content or fully automated video advertising.
                </p>
              </motion.div>

              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <h4 className="text-2xl font-bold text-white mb-4">Turn Any Business into Marketing Machine</h4>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Transform your expertise into automated campaigns. Input your business knowledge, add your unique approach, and quickly transform your operations into a lead-generating, revenue-producing marketing system.
                </p>
              </motion.div>

              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <h4 className="text-2xl font-bold text-white mb-4">Speak Any Market. Optimize Your Campaigns</h4>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Speak to any audience with precision. Input your target market research and Zephra's AI will optimize messaging, targeting, and creative approaches with natural market-fit.
                </p>
                <p className="text-slate-400 text-sm">
                  Perfectly synced value propositions that maintain the authenticity and effectiveness of your original strategy.
                </p>
              </motion.div>
            </div>

            <motion.div
              className="mt-16 bg-gradient-to-r from-indigo-600/20 to-blue-600/20 backdrop-blur-xl rounded-3xl border border-indigo-500/30 p-8"
              variants={fadeInUp}
            >
              <p className="text-lg text-slate-300 text-center">
                Level up your marketing. Effortlessly customize campaigns, messaging, targeting, and automation for a comprehensive and versatile marketing experience.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Built for Business */}
      <section className="py-32 px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-12"
              variants={textReveal}
            >
              BUILT FOR <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">BUSINESS</span>
            </motion.h2>

            <div className="grid md:grid-cols-2 gap-12">
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <h3 className="text-3xl font-bold text-white mb-6">Marketing for Entrepreneurs</h3>
                <p className="text-slate-300 leading-relaxed mb-6">
                  Market yourself with confidence. Get your online business up and running in a day. Gain customers, optimize sales, or create your community. Zephra is the key to unlocking the marketer inside of you.
                </p>
                <div className="flex items-center space-x-2 text-blue-400">
                  <TrendingUp className="w-5 h-5" />
                  <span>Rapid business growth</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <h3 className="text-3xl font-bold text-white mb-6">Build a marketing-based business</h3>
                <p className="text-slate-300 leading-relaxed mb-6">
                  Marketing isn't just a feature - it's a mentality. From leads to sales, from your products to your services to your community, your entire business is a marketing system. And you can build all that here too.
                </p>
                <div className="flex items-center space-x-2 text-purple-400">
                  <Rocket className="w-5 h-5" />
                  <span>Complete business transformation</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Advanced AI Technology */}
      <section className="py-32 px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-12"
              variants={textReveal}
            >
              ADVANCED AI <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">TECHNOLOGY</span>
            </motion.h2>

            <motion.div
              className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-12 mb-12"
              variants={fadeInUp}
            >
              <h3 className="text-4xl font-bold text-white mb-8 text-center">The Most Advanced AI Marketing Platform</h3>
              <p className="text-xl text-slate-300 text-center mb-8 leading-relaxed">
                Zephra makes it easy to create marketing campaigns that feel like magic. You can optimize campaigns for different audiences, add automation that matches your brand, and speed up your entire business growth process; all with simple, smart AI tools.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Campaigns that Don't Feel Generic</h4>
                  <p className="text-slate-300 text-sm">Skip the cookie-cutter approach. Our fully customizable AI adapts to your unique business model.</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Integrate Zephra</h4>
                  <p className="text-slate-300 text-sm">Streamline your workflow and eliminate tedious manual tasks with our powerful API.</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Keep It On Brand</h4>
                  <p className="text-slate-300 text-sm">Consistency is key to business success. Customize with your voice, values, and visual identity.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-12"
              variants={textReveal}
            >
              PRICING THAT <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">SCALES</span>
            </motion.h2>

            <motion.h3
              className="text-3xl md:text-4xl font-bold text-slate-300 mb-8"
              variants={textReveal}
            >
              Choose Your Marketing Automation Level
            </motion.h3>

            {/* Billing Frequency Toggle */}
            <motion.div
              className="flex items-center justify-center mb-16"
              variants={textReveal}
            >
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-2 border border-slate-700/30">
                <button
                  onClick={() => setBillingFrequency('monthly')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    billingFrequency === 'monthly'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingFrequency('yearly')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    billingFrequency === 'yearly'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Yearly
                  <span className="ml-2 text-xs bg-emerald-500 text-white px-2 py-1 rounded-full">
                    Save 20%
                  </span>
                </button>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Basic Plan */}
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <h4 className="text-2xl font-bold text-white mb-2">{PRICING_PLANS.starter.name}</h4>
                <div className="mb-4">
                  <span className="text-4xl font-black text-white">
                    ${billingFrequency === 'monthly' ? PRICING_PLANS.starter.monthlyPrice : PRICING_PLANS.starter.yearlyPrice}
                  </span>
                  <span className="text-slate-400 ml-2">/{billingFrequency === 'monthly' ? 'month' : 'year'}</span>
                  {billingFrequency === 'yearly' && (
                    <div className="text-sm text-emerald-400 mt-1">
                      Save ${(PRICING_PLANS.starter.monthlyPrice * 12) - PRICING_PLANS.starter.yearlyPrice} per year
                    </div>
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-6">{PRICING_PLANS.starter.description}</p>
                <ul className="text-slate-300 space-y-3 mb-8">
                  {PRICING_PLANS.starter.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <AuthTrigger
                  className="w-full px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl font-medium hover:from-slate-700 hover:to-slate-800 transition-all duration-300 inline-block text-center"
                  plan="starter"
                  frequency={billingFrequency}
                  redirectToCheckout={true}
                >
                  Get Started
                </AuthTrigger>
              </motion.div>

              {/* Pro Plan */}
              <motion.div
                className="bg-gradient-to-b from-indigo-600/20 to-blue-600/20 backdrop-blur-xl rounded-3xl border border-indigo-500/30 p-8 relative"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    ⭐ Most Popular
                  </span>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">{PRICING_PLANS.pro.name}</h4>
                <div className="mb-4">
                  <span className="text-4xl font-black text-white">
                    ${billingFrequency === 'monthly' ? PRICING_PLANS.pro.monthlyPrice : PRICING_PLANS.pro.yearlyPrice}
                  </span>
                  <span className="text-slate-400 ml-2">/{billingFrequency === 'monthly' ? 'month' : 'year'}</span>
                  {billingFrequency === 'yearly' && (
                    <div className="text-sm text-emerald-400 mt-1">
                      Save ${(PRICING_PLANS.pro.monthlyPrice * 12) - PRICING_PLANS.pro.yearlyPrice} per year
                    </div>
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-6">{PRICING_PLANS.pro.description}</p>
                <ul className="text-slate-300 space-y-3 mb-8">
                  {PRICING_PLANS.pro.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <AuthTrigger
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl font-medium hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 inline-block text-center"
                  plan="pro"
                  frequency={billingFrequency}
                  redirectToCheckout={true}
                >
                  Start Free Trial
                </AuthTrigger>
              </motion.div>

              {/* Elite Plan */}
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-8"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <h4 className="text-2xl font-bold text-white mb-2">{PRICING_PLANS.enterprise.name}</h4>
                <div className="mb-4">
                  <span className="text-4xl font-black text-white">
                    ${billingFrequency === 'monthly' ? PRICING_PLANS.enterprise.monthlyPrice : PRICING_PLANS.enterprise.yearlyPrice}
                  </span>
                  <span className="text-slate-400 ml-2">/{billingFrequency === 'monthly' ? 'month' : 'year'}</span>
                  {billingFrequency === 'yearly' && (
                    <div className="text-sm text-emerald-400 mt-1">
                      Save ${(PRICING_PLANS.enterprise.monthlyPrice * 12) - PRICING_PLANS.enterprise.yearlyPrice} per year
                    </div>
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-6">{PRICING_PLANS.enterprise.description}</p>
                <ul className="text-slate-300 space-y-3 mb-8">
                  {PRICING_PLANS.enterprise.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <AuthTrigger
                  className="w-full px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl font-medium hover:from-slate-700 hover:to-slate-800 transition-all duration-300 inline-block text-center"
                  plan="elite"
                  frequency={billingFrequency}
                  redirectToCheckout={true}
                >
                  Get Elite Access
                </AuthTrigger>
              </motion.div>
            </div>

            {/* Additional Info */}
            <motion.div
              className="text-center mt-12"
              variants={textReveal}
            >
              <p className="text-slate-400 mb-4">All plans include:</p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  7-day free trial
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  No setup fees
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Cancel anytime
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  24/7 AI monitoring
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 px-6 lg:px-8 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-12"
              variants={textReveal}
            >
              FREQUENTLY ASKED <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">QUESTIONS</span>
            </motion.h2>

            <div className="space-y-6">
              {[
                {
                  question: "What is Zephra?",
                  answer: "Zephra is an AI marketing platform that lets businesses create high-quality campaigns effortlessly. From intelligent campaign strategies to automated follow-up sequences, Zephra empowers entrepreneurs and growing businesses to scale their marketing with ease. Recognized as the fastest growing marketing platform, Zephra is reinventing campaign creation for lead generation, sales, and business growth."
                },
                {
                  question: "What is an AI marketing platform?",
                  answer: "An AI marketing platform is a tool that uses artificial intelligence to create campaigns from business goals, target markets, and growth objectives. It allows users to quickly produce professional marketing systems, such as adding automation or creating optimized funnels, without the need for advanced marketing skills. These tools are helping everyone, from individual entrepreneurs to growing companies, to produce professional campaigns quickly and efficiently."
                },
                {
                  question: "How to create AI marketing for yourself?",
                  answer: "Log in to Zephra, chat with our intelligent system to define your business strategy, and set your goals. Choose your approach, customize the campaigns with your brand and messaging, then generate and deploy your complete marketing system."
                },
                {
                  question: "Is Zephra a free AI marketing platform?",
                  answer: "Yes. Zephra's free trial offers access to campaign planning, ad copy generation, and basic automation tools. For advanced features like unlimited variations, multi-channel orchestration, and dedicated support, upgrade to a premium plan."
                },
                {
                  question: "How much does Zephra's AI marketing platform cost?",
                  answer: "Free Trial: Full access for 14 days, Basic Plan: $149/month, Pro Plan: $297/month, Elite Plans: $497/month. All plans include access to campaign strategy, ad copy generation, funnel building, and email automation."
                },
                {
                  question: "How does Zephra handle video content creation?",
                  answer: "Zephra provides two approaches to video content: detailed UGC shot lists with frame-by-frame scripts for authentic, real-world video creation, or AI-generated video ad concepts for fully automated content. This gives you flexibility whether you prefer authentic user-generated content or automated video advertising."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-6"
                  variants={fadeInUp}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h4 className="text-xl font-bold text-white">{faq.question}</h4>
                    {openFaq === index ? (
                      <Minus className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Plus className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="text-slate-300 mt-4 leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-12"
              variants={textReveal}
            >
              READY TO TRANSFORM YOUR <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">BUSINESS?</span>
            </motion.h2>

            <motion.div
              className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 p-12 mb-12"
              variants={fadeInUp}
            >
              <h3 className="text-3xl font-bold text-white mb-8">Stop Being Your Own Marketing Department</h3>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                The most successful entrepreneurs of 2025 will be those who leverage AI to automate what can be automated and focus their energy on what truly matters—serving customers and growing their business.
              </p>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="text-left">
                  <h4 className="text-lg font-bold text-white mb-4">Zephra gives you the marketing system you've always wanted:</h4>
                  <ul className="text-slate-300 space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                      Professional campaigns that convert
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                      Consistent lead generation
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                      Automated customer journeys
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                      Optimized performance tracking
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                      More time to focus on your business
                    </li>
                  </ul>
                </div>

                <div className="text-left">
                  <p className="text-lg text-slate-300 mb-4">
                    The question isn't whether you need better marketing. The question is: How much longer will you wait to get it?
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <AuthTrigger
                      className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-2xl shadow-indigo-500/25 text-center"
                      scrollToPricing={scrollToPricing}
                    >
                      Transform Your Marketing
                    </AuthTrigger>
                  </motion.div>
                </div>
              </div>

              <p className="text-slate-400 text-sm">
                Join the marketing revolution. Your competitors are already using AI—don't get left behind.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}