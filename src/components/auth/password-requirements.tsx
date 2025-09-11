'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Shield, Lock, Eye, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface PasswordRequirement {
  id: string
  label: string
  test: (password: string) => boolean
  icon: React.ReactNode
}

const requirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
    icon: <Lock className="w-3 h-3" />
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(password),
    icon: <Shield className="w-3 h-3" />
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    test: (password) => /[a-z]/.test(password),
    icon: <Shield className="w-3 h-3" />
  },
  {
    id: 'number',
    label: 'One number',
    test: (password) => /\d/.test(password),
    icon: <AlertTriangle className="w-3 h-3" />
  },
  {
    id: 'special',
    label: 'One special character',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    icon: <Eye className="w-3 h-3" />
  }
]

interface PasswordRequirementsProps {
  password: string
  isVisible: boolean
  className?: string
}

export function PasswordRequirements({ password, isVisible, className }: PasswordRequirementsProps) {
  const [strengthScore, setStrengthScore] = useState(0)
  const [strengthLabel, setStrengthLabel] = useState('Weak')
  const [strengthColor, setStrengthColor] = useState('bg-red-500')

  useEffect(() => {
    const score = requirements.reduce((acc, req) => {
      return acc + (req.test(password) ? 1 : 0)
    }, 0)
    
    setStrengthScore(score)
    
    if (score <= 1) {
      setStrengthLabel('Very Weak')
      setStrengthColor('bg-red-500')
    } else if (score <= 2) {
      setStrengthLabel('Weak')
      setStrengthColor('bg-orange-500')
    } else if (score <= 3) {
      setStrengthLabel('Fair')
      setStrengthColor('bg-yellow-500')
    } else if (score <= 4) {
      setStrengthLabel('Good')
      setStrengthColor('bg-blue-500')
    } else {
      setStrengthLabel('Excellent')
      setStrengthColor('bg-green-500')
    }
  }, [password])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            duration: 0.2
          }}
          className={cn(
            "absolute z-50 mt-2 p-6 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl",
            "ring-1 ring-black/5 min-w-[320px] max-w-[400px]",
            "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/80 before:to-gray-50/80 before:-z-10",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Password Security</h3>
              <p className="text-xs text-gray-500">Create a strong password to protect your account</p>
            </div>
          </div>

          {/* Strength Meter */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Strength</span>
              <span className={cn(
                "text-xs font-semibold px-2 py-1 rounded-full",
                strengthScore <= 1 ? "text-red-700 bg-red-100" :
                strengthScore <= 2 ? "text-orange-700 bg-orange-100" :
                strengthScore <= 3 ? "text-yellow-700 bg-yellow-100" :
                strengthScore <= 4 ? "text-blue-700 bg-blue-100" :
                "text-green-700 bg-green-100"
              )}>
                {strengthLabel}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", strengthColor)}
                initial={{ width: 0 }}
                animate={{ width: `${(strengthScore / 5) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Requirements List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Requirements</h4>
            {requirements.map((requirement, index) => {
              const isValid = requirement.test(password)
              return (
                <motion.div
                  key={requirement.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 group"
                >
                  <motion.div
                    className={cn(
                      "flex items-center justify-center w-5 h-5 rounded-full transition-all duration-200",
                      isValid 
                        ? "bg-green-500 text-white shadow-lg shadow-green-500/25" 
                        : "bg-gray-200 text-gray-400 group-hover:bg-gray-300"
                    )}
                    animate={isValid ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isValid ? (
                      <Check className="w-3 h-3" strokeWidth={3} />
                    ) : (
                      <X className="w-3 h-3" strokeWidth={2} />
                    )}
                  </motion.div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className={cn(
                      "transition-colors duration-200",
                      isValid ? "text-gray-400" : "text-gray-600"
                    )}>
                      {requirement.icon}
                    </span>
                    <span className={cn(
                      "text-sm transition-all duration-200",
                      isValid 
                        ? "text-gray-500 line-through" 
                        : "text-gray-700 font-medium"
                    )}>
                      {requirement.label}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Security Tip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-5 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100/50"
          >
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-blue-900">Pro Tip</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Use a unique password you've never used before. Consider using a passphrase with numbers and symbols.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}