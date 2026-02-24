import type { Metadata } from 'next'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import './globals.css'

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <Theme appearance="dark" accentColor="blue" radius="medium">
          {children}
        </Theme>
      </body>
    </html>
  )
}
