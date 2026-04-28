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
        {/* Registrazione Service Worker per PWA CORRETTA */}
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
      {/* Impostiamo bg-transparent per far vedere l'immagine sotto senza filtri */}
      <body className="bg-transparent text-stone-900 font-sans antialiased min-h-screen flex flex-col relative">
        
        {/* --- SFONDO GLOBALE TEATRO (Senza Velo) --- */}
        <div className="fixed inset-0 z-[-10] pointer-events-none">
          <img 
            src="/teatro.jpeg" 
            alt="Sfondo Globale Re-love"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <Navbar />
        
        {/* main reso trasparente per far passare lo sfondo */}
        <main className="flex-grow relative z-10 bg-transparent">
          {children}
        </main>
      </body>
    </html>
  )
}