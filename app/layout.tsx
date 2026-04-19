import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Materiali Edili',
  description: 'Recupera, Regala, Vendi',
  manifest: '/manifest.json', // Questa riga trasforma il sito in un'App installabile
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className="bg-stone-50 text-stone-900 selection:bg-emerald-200">
        {children}
      </body>
    </html>
  )
}