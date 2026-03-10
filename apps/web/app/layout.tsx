import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Fraunces } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Lingle — Modern Language Learning',
  description: 'The first language learning system with a live model of exactly what you know.',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;600;700&family=Noto+Serif+JP:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
