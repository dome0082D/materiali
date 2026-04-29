'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ControversiePage() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // STATI PER IL MODULO NUOVA SEGNALAZIONE
  const [showModal, setShowModal] = useState(false)
  const [selectedTx, setSelectedTx] = useState('')
  const [reason, setReason] = useState('Oggetto non ricevuto')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return
    setUser(currentUser)

    // 1. Recupera le controversie già aperte
    const { data: dispData } = await supabase
      .from('disputes')
      .select('*, transaction:transactions(*, announcements(*))')
      .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false })

    if (dispData) setDisputes(dispData)

    // 2. Recupera gli acquisti per permettere di sceglierne uno nel modulo
    const { data: purchData } = await supabase
      .from('transactions')
      .select('*, announcements(*)')
      .eq('buyer_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (purchData) {
      setPurchases(purchData)
      if (purchData.length > 0) setSelectedTx(purchData[0].id) // Seleziona il primo di default
    }

    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!selectedTx || !description.trim()) {
      alert("Seleziona un ordine e descrivi il problema.")
      return
    }
    setSubmitting(true)

    // Troviamo il venditore di quell'ordine
    const tx = purchases.find(p => p.id === selectedTx)
    const sellerId = tx?.announcements?.user_id

    const { error } = await supabase.from('disputes').insert([{
      transaction_id: selectedTx,
      buyer_id: user.id,
      seller_id: sellerId,
      reason: reason,
      description: description,
      status: 'Aperta'
    }])

    if (!error) {
      alert("Segnalazione inviata allo Staff con successo! I fondi sono stati congelati.")
      
      // Notifica al venditore
      if (sellerId) {
        await supabase.from('notifications').insert([{
          user_id: sellerId,
          message: `⚠️ L'acquirente ha aperto una controversia per "${tx.announcements?.title}". Lo Staff interverrà a breve.`,
          is_read: false
        }])
      }

      setShowModal(false)
      setDescription('')
      fetchData() // Ricarica la pagina per far vedere la nuova pratica
    } else {
      alert("Errore nell'invio: " + error.message)
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-white font-sans text-stone-900 pb-32">
      <div className="w-full py-16 bg-rose-50 border-b border-rose-100 flex items-center justify-center relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl">⚖️</div>
         <div className="text-center max-w-2xl px-6 relative z-10">
            <h1 className="text-4xl font-black uppercase italic text-stone-900 tracking-tighter mb-2">Tribunale Re-love</h1>
            <p className="text-rose-500 font-bold text-[10px] uppercase tracking-[0.3em]">Centro Risoluzione Controversie</p>
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-stone-100 pb-4 gap-4">
          <h2 className="text-sm font-black uppercase text-stone-400 tracking-widest">Le tue pratiche attive</h2>
          
          {/* BOTTONE ORA ATTIVO */}
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-stone-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 transition-all shadow-md"
          >
            + Apri Segnalazione
          </button>
        </div>

        {loading ? (
          <p className="text-center text-stone-400 font-bold text-xs uppercase tracking-widest mt-12">Caricamento pratiche...</p>
        ) : disputes.length === 0 ? (
          <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-[3rem] p-16 text-center">
            <span className="text-6xl block mb-4">🕊️</span>
            <h3 className="text-xl font-black uppercase text-stone-900 mb-2">Tutto tranquillo</h3>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6">Non ci sono controversie aperte. Le tue vendite vanno a gonfie vele!</p>
            <Link href="/dashboard/analitiche" className="text-[10px] font-black uppercase text-rose-500 hover:text-stone-900 tracking-widest underline">
              ← Torna al Seller Hub
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {disputes.map(dispute => (
              <div key={dispute.id} className="p-6 bg-white border border-stone-200 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${dispute.status === 'Aperta' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {dispute.status}
                  </span>
                  <h4 className="text-sm font-black text-stone-900 mt-2 uppercase">{dispute.reason}</h4>
                  <p className="text-[10px] font-bold text-stone-500 mt-1 uppercase tracking-widest">Ordine: {dispute.transaction?.announcements?.title || 'Sconosciuto'}</p>
                </div>
                <div className="bg-stone-50 px-4 py-3 rounded-xl border border-stone-100 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  In attesa dello Staff
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODULO REALE PER LA SEGNALAZIONE */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 text-xl font-bold">✕</button>
            <div className="text-center mb-6">
              <span className="text-6xl block mb-2">📝</span>
              <h2 className="text-2xl font-black uppercase italic text-stone-900">Nuova Segnalazione</h2>
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mt-1">Invia il modulo allo Staff</p>
            </div>
            
            <div className="space-y-4">
              {purchases.length === 0 ? (
                <p className="text-xs font-bold text-rose-500 bg-rose-50 p-4 rounded-xl text-center">Non hai acquisti su cui aprire una segnalazione.</p>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Quale ordine ha un problema?</label>
                    <select value={selectedTx} onChange={(e) => setSelectedTx(e.target.value)} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl font-bold text-sm outline-none mt-1 focus:border-rose-400">
                      {purchases.map(p => (
                        <option key={p.id} value={p.id}>{p.announcements?.title} (€{p.amount})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Motivo della segnalazione</label>
                    <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl font-bold text-sm outline-none mt-1 focus:border-rose-400">
                      <option>Oggetto non ricevuto</option>
                      <option>Oggetto danneggiato / Diverso</option>
                      <option>Sospetto Oggetto Falso</option>
                      <option>Venditore non risponde</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Spiega la situazione allo Staff</label>
                    <textarea 
                      rows={4} 
                      placeholder="Scrivi qui i dettagli per aiutarci a giudicare..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl font-medium text-sm outline-none mt-1 resize-none focus:border-rose-400"
                    />
                  </div>

                  <button onClick={handleSubmit} disabled={submitting} className="w-full bg-rose-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-stone-900 transition-all disabled:opacity-50 mt-4 shadow-md">
                    {submitting ? 'Invio in corso...' : 'Invia allo Staff'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}