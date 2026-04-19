'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function MyPurchasesPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadPurchases()
  }, [])

  async function loadPurchases() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Recupera le transazioni dove l'utente è l'acquirente
    // Collega i dati dell'annuncio per vedere il titolo
    const { data, error } = await supabase
      .from('transactions')
      .select('*, announcements(title, image_url)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setTransactions(data)
    setLoading(false)
  }

  async function handleConfirmReceipt(transactionId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (!confirm("Confermi di aver ricevuto l'oggetto? Questa azione sbloccherà i fondi e pagherà il venditore definitivamente.")) return

    setProcessingId(transactionId)

    try {
      const res = await fetch('/api/stripe/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transactionId,
          buyerId: user.id
        })
      })

      const result = await res.json()

      if (result.success) {
        alert("Ricezione confermata! Fondi sbloccati.")
        loadPurchases() // Ricarica la lista per aggiornare lo stato
      } else {
        alert("Errore: " + result.error)
      }
    } catch (err) {
      alert("Si è verificato un errore durante la comunicazione con il server.")
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) return <div className="p-10 font-black uppercase text-xs text-center">Caricamento acquisti...</div>

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 p-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
            <h1 className="text-2xl font-black uppercase italic text-stone-900">I Miei Acquisti</h1>
            <Link href="/" className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-900">← Torna alla Home</Link>
        </div>

        {transactions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <p className="text-sm font-bold text-stone-400 uppercase">Non hai ancora effettuato acquisti.</p>
                <Link href="/" className="inline-block mt-4 text-[10px] font-black uppercase bg-stone-900 text-white px-6 py-3 rounded-xl">Inizia a cercare</Link>
            </div>
        ) : (
            <div className="space-y-4">
              {transactions.map((trx) => (
                <div key={trx.id} className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                  
                  {/* Anteprima Immagine */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-50 border border-stone-100 flex-shrink-0">
                    <img 
                      src={trx.announcements?.image_url || "/usato.png"} 
                      className="w-full h-full object-cover" 
                      alt="Prodotto"
                    />
                  </div>

                  {/* Info Ordine */}
                  <div className="flex-grow text-center md:text-left">
                    <p className="text-[8px] font-black uppercase text-stone-400 mb-1">Ordine #{trx.id.slice(0,8)}</p>
                    <h3 className="text-sm font-bold text-stone-800 uppercase mb-1">{trx.announcements?.title || "Oggetto non più disponibile"}</h3>
                    <p className="text-lg font-black text-stone-900">€ {trx.amount.toFixed(2)}</p>
                  </div>

                  {/* Stato e Azioni */}
                  <div className="flex flex-col items-center md:items-end gap-2 min-w-[180px]">
                    {trx.status === 'held' ? (
                      <>
                        <span className="text-[9px] font-black uppercase px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full mb-2">
                          Fondi Trattenuti (Escrow)
                        </span>
                        <button 
                          onClick={() => handleConfirmReceipt(trx.id)}
                          disabled={processingId === trx.id}
                          className="w-full bg-emerald-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all shadow-md disabled:opacity-50"
                        >
                          {processingId === trx.id ? 'Elaborazione...' : 'Conferma Ricezione'}
                        </button>
                      </>
                    ) : (
                      <span className="text-[9px] font-black uppercase px-3 py-1 bg-stone-100 text-stone-500 border border-stone-200 rounded-full">
                        Completato • Pagato
                      </span>
                    )}
                  </div>

                </div>
              ))}
            </div>
        )}

        <p className="text-[9px] text-stone-400 font-bold uppercase text-center mt-12 leading-relaxed">
          I fondi vengono sbloccati automaticamente dopo 15 giorni dalla transazione<br/>se non confermi manualmente la ricezione.
        </p>

      </div>
    </div>
  )
}
