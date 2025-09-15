import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/config'

console.log('🔧 NextAuth route loaded with providers:', authOptions.providers?.map(p => p.name))

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }