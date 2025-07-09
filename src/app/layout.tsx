import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { LayoutWrapper } from '@/components/layouts/LayoutWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Formula PM 2.0',
  description: 'Construction Project Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          src="https://js-de.sentry-cdn.com/9977f47ea251dd164329ee41129feddf.min.js"
          crossOrigin="anonymous"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              Sentry.onLoad(function() {
                Sentry.init({
                  environment: "${process.env.NODE_ENV || 'development'}",
                  tracesSampleRate: 1.0,
                  replaysSessionSampleRate: 0.1,
                  replaysOnErrorSampleRate: 1.0,
                  
                  // Enable experimental logging features
                  _experiments: {
                    enableLogs: true,
                  },
                  
                  // Automatically capture console logs
                  integrations: [
                    Sentry.consoleLoggingIntegration({ 
                      levels: ["log", "error", "warn"] 
                    }),
                  ],
                });
              });
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  )
}