import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create a function to get supabaseAdmin to avoid build-time errors
export const getSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Server-side Supabase client with service role (admin access)
export const supabaseAdmin = (() => {
  // Only create the client if environment variables are available
  if (supabaseUrl && supabaseServiceKey) {
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  // Return a proxy that throws an error when accessed during build
  return new Proxy({} as any, {
    get() {
      throw new Error('Supabase client not available - missing environment variables')
    }
  })
})()

// For use in Server Components with Next.js App Router
export const createSupabaseServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

// Helper function to get user from server
export const getServerUser = async () => {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting server user:', error)
    return null
  }
  
  return user
}

// Helper function to get session from server
export const getServerSession = async () => {
  const supabase = createSupabaseServerClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting server session:', error)
    return null
  }
  
  return session
}

// Helper function to require authentication
export const requireAuth = async () => {
  const user = await getServerUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

// Helper function to get user profile with subscription info
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error getting user profile:', error)
    return null
  }
  
  return data
}

// Helper function to update user profile
export const updateUserProfile = async (userId: string, updates: Partial<Database['public']['Tables']['users']['Update']>) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
  
  return data
}