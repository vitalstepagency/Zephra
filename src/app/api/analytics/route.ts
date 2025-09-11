import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth/config'
import { supabaseAdmin } from '../../../lib/supabase/server'
import { z } from 'zod'

const createEventSchema = z.object({
  event_type: z.string().min(1, 'Event type is required'),
  event_data: z.record(z.any()),
  user_id: z.string().optional(),
  session_id: z.string().optional(),
  page_url: z.string().url().optional(),
  referrer: z.string().optional(),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
})

const analyticsQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  event_type: z.string().optional(),
  campaign_id: z.string().uuid().optional(),
  funnel_id: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const validatedQuery = analyticsQuerySchema.parse(queryParams)

    let query = supabaseAdmin
      .from('analytics_events')
      .select('*')
      .eq('user_id', session.user.id)

    if (validatedQuery.start_date) {
      query = query.gte('created_at', validatedQuery.start_date)
    }

    if (validatedQuery.end_date) {
      query = query.lte('created_at', validatedQuery.end_date)
    }

    if (validatedQuery.event_type) {
      query = query.eq('event_type', validatedQuery.event_type)
    }

    if (validatedQuery.campaign_id) {
      query = query.eq('campaign_id', validatedQuery.campaign_id)
    }

    if (validatedQuery.funnel_id) {
      query = query.eq('funnel_id', validatedQuery.funnel_id)
    }

    const { data: events, error } = await query
      .order('created_at', { ascending: false })
      .range(validatedQuery.offset, validatedQuery.offset + validatedQuery.limit - 1)

    if (error) {
      console.error('Error fetching analytics:', error)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    return NextResponse.json({ events })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 })
    }
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createEventSchema.parse(body)

    const { data: event, error } = await supabaseAdmin
      .from('analytics_events')
      .insert({
        ...validatedData,
        user_id: session.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating analytics event:', error)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Analytics event creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}