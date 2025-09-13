'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User as UserIcon, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 shadow-2xl h-full flex flex-col">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl text-white flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Zephra AI Assistant
        </CardTitle>
        <CardDescription className="text-slate-400">
          Ask me anything about your marketing strategy
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow flex flex-col p-4 overflow-hidden">
        <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`flex max-w-[80%] ${message.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-slate-800 text-slate-100 rounded-2xl rounded-tl-sm'}`}
                >
                  <div className="p-3 flex gap-2">
                    <div className="flex-shrink-0 mt-1">
                      {message.sender === 'ai' 
                        ? <Bot className="w-5 h-5 text-indigo-400" /> 
                        : <UserIcon className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-tl-sm p-4">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-400" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </AnimatePresence>
        </div>
        
        {suggestions.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white text-xs py-1 h-auto"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 px-4 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-12 max-h-32 overflow-y-auto"
              style={{ minHeight: '48px' }}
              rows={1}
            />
          </div>
          <Button 
            onClick={handleSendMessage} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 w-12 rounded-lg p-0 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="mt-4 text-center">
          <Button 
            onClick={handleComplete}
            variant="ghost" 
            className="text-slate-400 hover:text-white text-sm"
          >
            Continue to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}