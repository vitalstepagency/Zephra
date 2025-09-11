import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Zephra - AI Marketing Autopilot for Solopreneurs',
    template: '%s | Zephra',
  },
  description: 'Plan, script, and launch Meta ads, funnels, and follow-ups without hiring an agency. Agency-grade outcomes without agency overhead.',
  keywords: [
    'AI marketing',
    'marketing automation',
    'Meta ads',
    'Facebook ads',
    'marketing funnels',
    'email marketing',
    'SMS marketing',
    'solopreneurs',
    'marketing autopilot',
    'campaign strategy',
    'ad creative',
    'funnel builder',
  ],
  authors: [{ name: 'Zephra' }],
  creator: 'Zephra',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://zephra.ai',
    title: 'Zephra - AI Marketing Autopilot for Solopreneurs',
    description: 'Plan, script, and launch Meta ads, funnels, and follow-ups without hiring an agency. Agency-grade outcomes without agency overhead.',
    siteName: 'Zephra',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zephra - AI Marketing Autopilot for Solopreneurs',
    description: 'Plan, script, and launch Meta ads, funnels, and follow-ups without hiring an agency. Agency-grade outcomes without agency overhead.',
    creator: '@zephra_ai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable,
          spaceGrotesk.variable
        )}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
            </div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}