import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth/config'
import { getSupabaseAdmin } from '../../../lib/supabase/server'
import { z } from 'zod'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().nullable().optional(),
  target_audience: z.record(z.any()).optional(),
  budget_total: z.number().positive().nullable().optional(),
  budget_spent: z.number().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).default('draft'),
  goals: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: campaigns, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Campaigns API error:', error)
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
    const validatedData = createCampaignSchema.parse(body)

    // Transform data to match database types
    const insertData = {
      user_id: session.user.id,
      name: validatedData.name,
      description: validatedData.description ?? null,
      status: validatedData.status,
      target_audience: validatedData.target_audience ?? {},
      budget_total: validatedData.budget_total ?? null,
      budget_spent: validatedData.budget_spent ?? 0,
      start_date: validatedData.start_date ?? null,
      end_date: validatedData.end_date ?? null,
      goals: validatedData.goals ?? {},
      settings: validatedData.settings ?? {},
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Campaign creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}