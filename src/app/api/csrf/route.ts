import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFTokenEndpoint } from '../../../lib/csrf'

export async function GET(request: NextRequest): Promise<NextResponse> {
  return generateCSRFTokenEndpoint(request)
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'