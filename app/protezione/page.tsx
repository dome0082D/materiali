import Link from 'next/link'

export default function ProtezionePage() {
  return (
    <div className="min-h-screen bg-stone-50 p-10 flex flex-col items-center pt-20">
      <div className="max-w-2xl bg-white p-10 rounded-[3rem] shadow-xl border border-stone-200 text-center">
        <span className="text-6xl block mb-6">🛡️</span>
        <h1 className="text-4xl font-black uppercase italic text-stone-900 mb-4">Protezione Acquisti</h1>
        <p className="text-stone-500 font-medium mb-8">I tuoi soldi sono al sicuro con Stripe e il nostro sistema Escrow. Tratteniamo il pagamento finché non ricevi e confermi l'oggetto.</p>
        <Link href="/" className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-emerald-500 transition-all">Torna alla Home</Link>
      </div>
    </div>
  )
}
