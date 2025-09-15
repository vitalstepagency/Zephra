'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User as UserIcon, Sparkles } from 'lucide-react'
// Removed Card components as we're using custom styling

interface Message {
  id: string
  content: string
  sender: 'ai' | 'user'
  timestamp: Date
}

interface AIResponse {
  message: string
  suggestions?: string[]
}

interface AIChatProps {
  businessName?: string
  industry?: string
  currentChallenges?: string
  onComplete?: () => void
}

export function AIChat({ businessName, industry, currentChallenges, onComplete }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  // Initial greeting when component mounts
  useEffect(() => {
    const initialMessage = {
      id: Date.now().toString(),
      content: generateInitialGreeting(),
      sender: 'ai' as const,
      timestamp: new Date()
    }
    
    setIsTyping(true)
    
    // Simulate typing delay
    const timer = setTimeout(() => {
      setMessages([initialMessage])
      setIsTyping(false)
      setSuggestions([
        'How can Zephra help my business?',
        'What marketing strategies do you recommend?',
        'How does the AI work?'
      ])
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  const generateInitialGreeting = () => {
    let greeting = 'Hi there! I\'m your Zephra AI assistant.'
    
    if (businessName) {
      greeting += ` I see you're from ${businessName}.`
    }
    
    if (industry) {
      greeting += ` I have expertise in the ${industry} industry and can help you optimize your marketing strategy.`
    }
    
    if (currentChallenges) {
      greeting += ` I understand you're facing challenges with: ${currentChallenges}. I'm here to help address these issues.`
    }
    
    greeting += ' What would you like to know about how Zephra can transform your marketing?'
    
    return greeting
  }
  
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setSuggestions([])
    setIsTyping(true)
    
    try {
      // Call n8n webhook to process the message and insert knowledge into Supabase
      const response = await fetch('/api/chat/n8n-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          businessName,
          industry,
          currentChallenges,
          messageHistory: messages.map(m => ({ content: m.content, sender: m.sender }))
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to get response from n8n')
      }
      
      const data = await response.json()
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || generateAIResponse(inputValue).message,
        sender: 'ai',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
      
      if (data.suggestions) {
        setSuggestions(data.suggestions)
      } else {
        setSuggestions(generateAIResponse(inputValue).suggestions || [])
      }
    } catch (error) {
      console.error('Error communicating with n8n:', error)
      
      // Fallback to local response if n8n fails
      const aiResponse = generateAIResponse(inputValue)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.message,
        sender: 'ai',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
      
      if (aiResponse.suggestions) {
        setSuggestions(aiResponse.suggestions)
      }
    }
  }
  
  const generateAIResponse = (userInput: string): AIResponse => {
    const input = userInput.toLowerCase()
    
    // Simple response logic - in a real app, this would be an API call to an LLM
    if (input.includes('help') || input.includes('how can')) {
      return {
        message: 'Zephra can help your business by automating your marketing campaigns, optimizing ad spend, and creating personalized customer journeys. Our AI analyzes your market and creates strategies tailored to your specific business needs.',
        suggestions: [
          'Tell me more about campaign automation',
          'How does Zephra optimize ad spend?',
          'What results can I expect?'
        ]
      }
    } else if (input.includes('strategy') || input.includes('recommend')) {
      return {
        message: `Based on your ${industry || 'business'} profile, I'd recommend focusing on targeted social media campaigns, email nurture sequences, and conversion-optimized landing pages. These three elements work together to create a complete marketing funnel.`,
        suggestions: [
          'How do I create effective social campaigns?',
          'What makes a good email sequence?',
          'How long until I see results?'
        ]
      }
    } else if (input.includes('ai') || input.includes('work')) {
      return {
        message: 'Our AI works by analyzing millions of successful marketing campaigns across various industries. For your business, we process market data, competitor strategies, and customer behavior patterns to create optimized campaigns that continuously improve based on performance.',
        suggestions: [
          'Is my data secure?',
          'Do I need technical knowledge?',
          'Can I customize the AI recommendations?'
        ]
      }
    } else {
      return {
        message: 'That\'s a great question! Zephra\'s AI-powered platform is designed to handle all aspects of your marketing strategy. From campaign creation to optimization and scaling, we\'ve got you covered. Would you like to know more about any specific feature?',
        suggestions: [
          'What features are included?',
          'How much time will this save me?',
          'I\'m ready to get started!'
        ]
      }
    }
  }
  
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    handleSendMessage()
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const handleComplete = () => {
    if (onComplete) {
      onComplete()
    }
  }
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="relative px-8 py-6 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10" />
        <div className="relative flex items-center justify-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Zephra AI
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Your intelligent marketing assistant
            </p>
          </div>
        </div>
      </div>
      
      {/* Chat Content */}
      <div className="flex-grow flex flex-col p-6 overflow-hidden relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        {/* Messages Container */}
        <div className="relative flex-grow overflow-y-auto mb-6 pr-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                      : 'bg-gradient-to-br from-slate-700 to-slate-600 border border-white/10'
                  }`}>
                    {message.sender === 'ai' 
                      ? <Bot className="w-5 h-5 text-white" /> 
                      : <UserIcon className="w-5 h-5 text-white" />}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`relative px-5 py-4 rounded-3xl shadow-lg backdrop-blur-sm border ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-white/20 rounded-br-lg'
                      : 'bg-gradient-to-br from-slate-800/90 to-slate-700/90 text-slate-100 border-white/10 rounded-bl-lg'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    
                    {/* Message timestamp */}
                    <div className={`text-xs mt-2 opacity-70 ${
                      message.sender === 'user' ? 'text-white/80' : 'text-slate-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex justify-start"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-slate-700 to-slate-600 border border-white/10">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="relative px-5 py-4 rounded-3xl rounded-bl-lg shadow-lg backdrop-blur-sm border bg-gradient-to-br from-slate-800/90 to-slate-700/90 border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-300">Zephra is thinking</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </AnimatePresence>
        </div>
        
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <p className="text-xs text-slate-400 mb-3 font-medium">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-white/10 rounded-2xl text-slate-300 hover:text-white hover:border-indigo-400/50 hover:bg-gradient-to-r hover:from-slate-700/80 hover:to-slate-600/80 text-xs transition-all duration-200 backdrop-blur-sm shadow-lg"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Input Area */}
        <div className="relative">
          <div className="flex gap-3 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-3xl border border-white/10 backdrop-blur-sm shadow-lg">
            <div className="relative flex-grow">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Zephra anything about your marketing..."
                className="w-full bg-transparent text-white placeholder:text-slate-400 resize-none focus:outline-none text-sm leading-relaxed"
                style={{ minHeight: '24px', maxHeight: '120px' }}
                rows={1}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 text-white" />
            </motion.button>
          </div>
          
          {/* Continue Button */}
          <div className="mt-6 text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleComplete}
              className="px-6 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200"
            >
              Continue to Dashboard →
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}