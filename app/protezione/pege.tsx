import Link from 'next/link'

export default function ProtezioneAcquistiPage() {
  return (
    <div className="min-h-screen bg-stone-50 p-6 font-sans text-stone-900 flex justify-center items-start pt-12 pb-20">
      <div className="max-w-3xl w-full bg-white rounded-[2.5rem] p-10 border border-stone-200 shadow-xl">
        <div className="text-center mb-10 border-b border-stone-100 pb-8">
          <span className="text-6xl block mb-4">🛡️</span>
          <h1 className="text-4xl font-black uppercase italic text-stone-900 mb-2">Protezione Acquisti</h1>
          <p className="text-sm text-stone-400 font-bold uppercase tracking-widest">Sicurezza garantita con Escrow & Stripe</p>
        </div>
        <div className="space-y-10">
          <div className="flex gap-6 items-start">
            <span className="bg-emerald-500 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl shadow-lg">1</span>
            <div>
              <h3 className="text-lg font-black uppercase italic text-stone-900 mb-2">Pagamento Protetto</h3>
              <p className="text-sm text-stone-600 leading-relaxed font-medium">Quando paghi, i tuoi soldi non vanno al venditore. Restano "congelati" nel nostro sistema di sicurezza professionale gestito da Stripe.</p>
            </div>
          </div>
          <div className="flex gap-6 items-start">
            <span className="bg-emerald-500 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl shadow-lg">2</span>
            <div>
              <h3 className="text-lg font-black uppercase italic text-stone-900 mb-2">Verifica Materiale</h3>
              <p className="text-sm text-stone-600 leading-relaxed font-medium">Hai il tempo di ricevere l'oggetto o incontrarti con il venditore per verificare che sia tutto perfetto come da descrizione.</p>
            </div>
          </div>
          <div className="flex gap-6 items-start">
            <span className="bg-emerald-500 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl shadow-lg">3</span>
            <div>
              <h3 className="text-lg font-black uppercase italic text-stone-900 mb-2">Sblocco dei Fondi</h3>
              <p className="text-sm text-stone-600 leading-relaxed font-medium">Solo dopo la tua conferma di ricezione, il sistema sblocca i fondi al venditore. Se c'è un problema, i tuoi soldi sono al sicuro.</p>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-stone-100 text-center">
          <Link href="/" className="inline-block bg-stone-900 text-white font-black uppercase tracking-widest text-[11px] px-10 py-5 rounded-2xl hover:bg-emerald-500 transition-all shadow-lg">
            ← Torna alla Vetrina
          </Link>
        </div>
      </div>
    </div>
  )
}
