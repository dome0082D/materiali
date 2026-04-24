import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Script from 'next/script'

// METADATI AGGIORNATI PER RE-LOVE
export const metadata: Metadata = {
  title: 'Re-love - Dai nuova vita all\'usato',
  description: 'Il marketplace sostenibile per vendere e comprare vestiti, oggetti e tanto altro. Unisciti alla rivoluzione circular.',
  manifest: '/manifest.json',
}

// COLORE DELLA BARRA (f43f5e è il rosa/rosso del brand)
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
        {/* Registrazione Service Worker per PWA */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('Re-love: Service Worker registrato');
                }, function(err) {
                  console.log('Re-love: Errore Service Worker', err);
                });
              });
            }
          `}
        </Script>
      </head>
      <body className="bg-stone-50 text-stone-900 font-sans antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  )
}