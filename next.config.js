/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['postgres'],
  images: {
    domains: ['localhost', 'vercel.app'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default-value',
  },
  // Optimize for Vercel deployment
  poweredByHeader: false,
  compress: true,
  // Enhanced Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://*.supabase.co https://www.google-analytics.com https://vitals.vercel-insights.com; frame-src 'self' https://js.stripe.com https://checkout.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com; upgrade-insecure-requests;",
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
        ],
      },
    ];
  },
  // Webpack optimization
  webpack: (config, { isServer }) => {
    // Add path aliases for better module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components/ui': require('path').resolve(__dirname, 'src/components/ui'),
      '@/hooks/use-toast': require('path').resolve(__dirname, 'src/hooks/use-toast.ts'),
      '@/lib/utils': require('path').resolve(__dirname, 'src/lib/utils.ts'),
      '@/lib/stripe/config': require('path').resolve(__dirname, 'src/lib/stripe/config.ts'),
      '@/lib/stripe/checkout': require('path').resolve(__dirname, 'src/lib/stripe/checkout.ts'),
      '@/lib/security': require('path').resolve(__dirname, 'src/lib/security.ts'),
      '@/lib/auth/config': require('path').resolve(__dirname, 'src/lib/auth/config.ts'),
      '@/lib/monitoring': require('path').resolve(__dirname, 'src/lib/monitoring.ts'),
      '@/lib/api-security': require('path').resolve(__dirname, 'src/lib/api-security.ts'),
      '@/lib/error-handler': require('path').resolve(__dirname, 'src/lib/error-handler.ts'),
      '@/lib/rate-limit': require('path').resolve(__dirname, 'src/lib/rate-limit.ts'),
      '@/lib/supabase/client': require('path').resolve(__dirname, 'src/lib/supabase/client.ts'),
      '@/components/providers/theme-provider': require('path').resolve(__dirname, 'src/components/providers/theme-provider.tsx'),
      '@/components/providers/auth-provider': require('path').resolve(__dirname, 'src/components/providers/auth-provider.tsx'),
      '@/components/landing-page': require('path').resolve(__dirname, 'src/components/landing-page.tsx'),
    };
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;