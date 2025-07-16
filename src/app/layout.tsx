import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { LayoutWrapper } from '@/components/layouts/LayoutWrapper'
import { StartupService } from '@/lib/startup'
import { PageErrorBoundary, ErrorBoundaryProvider } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Formula PM 2.0',
  description: 'Construction Project Management System',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize startup services
  if (typeof window === 'undefined') {
    // Server-side initialization
    StartupService.initialize()
  }

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ErrorBoundaryProvider>
          <PageErrorBoundary pageName="Application Root">
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </PageErrorBoundary>
        </ErrorBoundaryProvider>
      </body>
    </html>
  )
}