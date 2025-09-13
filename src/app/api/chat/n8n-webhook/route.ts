import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// Environment variables for n8n webhook
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.zephra.io/webhook/chat'
const N8N_API_KEY = process.env.N8N_API_KEY

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    
    // Extract data from the request
    const { message, businessName, industry, currentChallenges, messageHistory } = body
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    
    // Create Supabase admin client
    const supabase = getSupabaseAdmin()
    
    // Forward the request to n8n webhook
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${N8N_API_KEY}`,
      },
      body: JSON.stringify({
        message,
        businessName,
        industry,
        currentChallenges,
        messageHistory,
        timestamp: new Date().toISOString(),
      }),
    })
    
    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook responded with status: ${n8nResponse.status}`)
    }
    
    const data = await n8nResponse.json()
    
    // Store the conversation in Supabase for future reference
    await supabase.from('chat_conversations').insert({
      user_message: message,
      ai_response: data.message,
      business_name: businessName,
      industry,
      current_challenges: currentChallenges,
    })
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing chat message:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        message: 'I apologize, but I\'m having trouble connecting to our knowledge base. Let me provide a general response instead.',
        suggestions: [
          'Can you tell me more about your business?',
          'What specific marketing challenges are you facing?',
          'How can I help you with your marketing strategy?'
        ] 
      }, 
      { status: 500 }
    )
  }
}