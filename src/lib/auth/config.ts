import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import { getSupabaseAdmin } from '../supabase/server'

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
  }),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          const supabaseAdmin = getSupabaseAdmin()
          
          // Check if this is a session restoration attempt (from payment verification)
           const isSessionRestoration = credentials.password?.startsWith('session_restore_');
           
           let authData;
           
           if (isSessionRestoration) {
             // This is a session restoration from payment verification
             // We'll look up the user by email instead of password authentication
             const { data: userData, error: lookupError } = await supabaseAdmin
               .from('profiles')
               .select('*')
               .eq('email', credentials.email)
               .single();
               
             if (lookupError) {
               console.error('User lookup error:', lookupError.message);
               throw new Error('User not found during session restoration')
             }
             
             // Get user from Supabase Auth by email
             const { data: userAuth, error: userAuthError } = await supabaseAdmin.auth.admin.listUsers();
             const foundUser = userAuth.users?.find((user: any) => user.email === credentials.email);
             
             if (userAuthError || !foundUser) {
               console.error('Auth lookup error:', userAuthError?.message || 'No user found');
               throw new Error('Authentication failed during session restoration')
             }
             
             authData = { user: foundUser };
          } else {
            // Normal password authentication
            const { data, error: authError } = await supabaseAdmin.auth.signInWithPassword({
              email: credentials.email,
              password: credentials.password
            })

            if (authError) {
              // Handle specific error cases
              if (authError.message?.toLowerCase().includes('invalid login credentials')) {
                throw new Error('Invalid email or password')
              }
              if (authError.message?.toLowerCase().includes('email not confirmed')) {
                throw new Error('Please check your email and click the confirmation link')
              }
              if (authError.message?.toLowerCase().includes('too many requests')) {
                throw new Error('Too many login attempts. Please try again later')
              }
              // Generic fallback
              throw new Error(authError.message || 'Authentication failed')
            }
            
            if (!data.user) {
              throw new Error('Authentication failed')
            }
            
            authData = data;
          }

          // Get user profile
          const { data: profile } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          return {
            id: authData.user.id,
            email: authData.user.email!,
            name: profile?.full_name || authData.user.user_metadata?.name || null,
            image: profile?.avatar_url || authData.user.user_metadata?.avatar_url || null
          }
        } catch (error) {
          console.error('Auth error:', error)
          // Re-throw the error so NextAuth can handle it properly
          throw error
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
  },
  // Remove the custom pages configuration to prevent the redundant redirect
  pages: {},
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET!,
  debug: process.env.NODE_ENV === 'development',
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