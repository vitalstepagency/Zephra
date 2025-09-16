import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import { getSupabaseAdmin } from '../supabase/server'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        console.log('🚨 AUTHORIZE FUNCTION CALLED! 🚨')
        console.log('📧 Email:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          const supabaseAdmin = getSupabaseAdmin()
          
          // First, try to authenticate with Supabase Auth
          const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
          })

          if (authError || !authData.user) {
            console.log('❌ Authentication failed:', authError?.message)
            return null
          }

          // Get user profile from users table
          const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name, subscription_status, stripe_customer_id')
            .eq('id', authData.user.id)
            .single()

          if (profileError || !userProfile) {
            console.log('❌ User profile not found:', profileError?.message)
            return null
          }

          console.log('✅ User authenticated successfully:', userProfile.email)
          
          return {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.full_name || userProfile.email.split('@')[0]
          }
        } catch (error) {
          console.error('❌ Authorization error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id
      }
      return token
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 NextAuth redirect callback triggered:', { url, baseUrl })
      
      // Handle checkout success redirect - preserve all query parameters
      if (url.includes('checkout=success')) {
        const urlObj = new URL(url, baseUrl)
        const redirectUrl = `${baseUrl}/onboarding${urlObj.search}`
        console.log('✅ Checkout success redirect:', redirectUrl)
        return redirectUrl
      }
      
      // Handle encoded onboarding URL from callbackUrl
      if (url.includes('%2Fonboarding%3Fcheckout%3Dsuccess')) {
        const redirectUrl = `${baseUrl}/onboarding?checkout=success`
        console.log('✅ Encoded onboarding redirect:', redirectUrl)
        return redirectUrl
      }
      
      // Handle fromCheckout parameter
      if (url.includes('fromCheckout=true')) {
        const urlObj = new URL(url, baseUrl)
        const redirectUrl = `${baseUrl}/onboarding${urlObj.search}`
        console.log('✅ FromCheckout redirect:', redirectUrl)
        return redirectUrl
      }
      
      // Handle onboarding URL - only add checkout context if it's already present
      if (url.includes('/onboarding')) {
        // If checkout context is already in the URL, preserve it
        if (url.includes('checkout=success') || url.includes('fromCheckout=true')) {
          const urlObj = new URL(url, baseUrl)
          const redirectUrl = `${baseUrl}/onboarding${urlObj.search}`
          console.log('✅ Onboarding redirect with existing checkout context:', redirectUrl)
          return redirectUrl
        }
        // Otherwise, redirect to onboarding without forcing checkout context
        const redirectUrl = `${baseUrl}/onboarding`
        console.log('✅ Onboarding redirect without checkout context:', redirectUrl)
        return redirectUrl
      }
      
      // If it's a relative URL, make it absolute
      if (url.startsWith('/')) {
        const redirectUrl = `${baseUrl}${url}`
        console.log('✅ Relative URL redirect:', redirectUrl)
        return redirectUrl
      }
      // If it's the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        console.log('✅ Same origin redirect:', url)
        return url
      }
      
      // CRITICAL FIX: If we're just getting the base URL, it means we need to redirect to onboarding
      // This happens when sign-in is successful but no specific redirect URL is provided
      if (url === baseUrl) {
        console.log('🚨 Base URL redirect detected - redirecting to onboarding')
        return `${baseUrl}/onboarding`
      }
      
      // Default to onboarding instead of base URL
      console.log('⚠️ Default redirect to onboarding:', `${baseUrl}/onboarding`)
      return `${baseUrl}/onboarding`
    },
  },
  pages: {
    signIn: '/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET!,
  debug: true,
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata)
    }
  }
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid: string
  }
}