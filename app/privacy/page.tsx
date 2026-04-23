import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50 p-10 flex flex-col items-center justify-center">
      <div className="max-w-2xl bg-white p-10 rounded-3xl shadow-sm border border-stone-100">
        <h1 className="text-2xl font-bold mb-6 italic uppercase">Privacy Policy</h1>
        <p className="text-stone-600 mb-6">I tuoi dati sono al sicuro. Usiamo queste informazioni solo per gestire i tuoi annunci e i tuoi acquisti su Re-love.</p>
        <Link href="/" className="bg-stone-900 text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase">Torna alla Home</Link>
      </div>
    </div>
  )
}