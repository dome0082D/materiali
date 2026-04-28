import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Re-love - Dai nuova vita all\'usato',
  description: 'Il marketplace sostenibile per vendere e comprare.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#f43f5e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <head>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `}
        </Script>
      </head>
      {/* Torniamo allo sfondo bianco solido (bg-white) */}
      <body className="bg-white text-stone-900 font-sans antialiased min-h-screen flex flex-col relative">
        <Navbar />
        <main className="flex-grow bg-white">
          {children}
        </main>
      </body>
    </html>
  )
}