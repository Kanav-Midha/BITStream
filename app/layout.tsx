import { ChatWidget } from "@/frontend/components/chat-widget";
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BITStream',
  description: 'Moderated campus media uploads for students and admins.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
        {/* This makes the chatbot appear on every page of the site */}
        <ChatWidget />
      </body>
    </html>
  )
}