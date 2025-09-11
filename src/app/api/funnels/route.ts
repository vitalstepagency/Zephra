import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth/config'
import { supabaseAdmin } from '../../../lib/supabase/server'
import { z } from 'zod'

const createFunnelSchema = z.object({
  name: z.string().min(1, 'Funnel name is required'),
  description: z.string().nullable().optional(),
  campaign_id: z.string().uuid().nullable().optional(),
  status: z.enum(['draft', 'active', 'paused']).default('draft'),
  steps: z.record(z.any()).optional(),
  conversion_rates: z.record(z.any()).optional(),
  total_visitors: z.number().optional(),
  total_conversions: z.number().optional(),
  revenue: z.number().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')

    let query = supabaseAdmin
      .from('funnels')
      .select('*')
      .eq('user_id', session.user.id)

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    const { data: funnels, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching funnels:', error)
      return NextResponse.json({ error: 'Failed to fetch funnels' }, { status: 500 })
    }

    return NextResponse.json({ funnels })
  } catch (error) {
    console.error('Funnels API error:', error)
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
    const validatedData = createFunnelSchema.parse(body)

    // Transform data to match database types
    const insertData = {
      user_id: session.user.id,
      name: validatedData.name,
      description: validatedData.description ?? null,
      campaign_id: validatedData.campaign_id ?? null,
      status: validatedData.status,
      steps: validatedData.steps ?? {},
      conversion_rates: validatedData.conversion_rates ?? {},
      total_visitors: validatedData.total_visitors ?? 0,
      total_conversions: validatedData.total_conversions ?? 0,
      revenue: validatedData.revenue ?? 0,
    }

    const { data: funnel, error } = await supabaseAdmin
      .from('funnels')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating funnel:', error)
      return NextResponse.json({ error: 'Failed to create funnel' }, { status: 500 })
    }

    return NextResponse.json({ funnel }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Funnel creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}