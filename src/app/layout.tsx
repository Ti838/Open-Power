import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Open Power',
  description: 'Open Power is a polished AI workspace for fast chat, model racing, and local-first control.',
  keywords: ['Open Power', 'AI workspace', 'chat', 'model racing', 'OpenRouter'],
  authors: [{ name: 'Open Power Team' }],
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png', sizes: '32x32' },
      { url: '/logo.png', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Open Power',
    description: 'A clean AI workspace for conversations, model control, and performance-focused workflows.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="shortcut icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased text-theme-text bg-theme-bg">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
