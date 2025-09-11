import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    console.log('Protected route accessed:', req.nextUrl.pathname)
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/protected/:path*',
    '/campaigns/:path*',
    '/funnels/:path*',
    '/analytics/:path*',
    '/settings/:path*',
  ]
}