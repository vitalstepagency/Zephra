import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getStripe } from '@/lib/stripe/config'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { returnUrl } = await req.json()

    // Find customer by email
    const stripe = getStripe()
    const customers = await stripe.customers.list({
      email: session.user.email,
      limit: 1
    })

    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 })
    }

    const customer = customers.data[0]
    
    if (!customer || !customer.id) {
      return NextResponse.json({ error: 'Invalid customer data' }, { status: 400 })
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl || `${req.nextUrl.origin}/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Stripe customer portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    )
  }
}