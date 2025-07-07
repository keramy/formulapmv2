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
      <body className={inter.className}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  )
}