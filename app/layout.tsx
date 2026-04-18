import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className="bg-slate-100 text-slate-900">{children}</body>
    </html>
  )
}