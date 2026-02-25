import type { Metadata } from 'next'
import { Inter, Shippori_Mincho, DM_Mono } from 'next/font/google'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const shipporiMincho = Shippori_Mincho({
  weight: ['400', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-shippori',
})
const dmMono = DM_Mono({
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-mono',
})

export const metadata: Metadata = {
  title: 'Linguist',
  description: 'Language learning with adaptive knowledge modeling',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${shipporiMincho.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Theme appearance="light" accentColor="blue" radius="large">
          {children}
        </Theme>
      </body>
    </html>
  )
}
