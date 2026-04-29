'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardOrdini() {
  const [activeTab, setActiveTab] = useState<'acquisti' | 'vendite'>('acquisti')
  const [purchases, setPurchases] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [trackingInput, setTrackingInput] = useState<{ [key: string]: string }>({})
  const [actionLoading, setActionLoading] = useState(false)
  
  // STATI PER IL MODALE CONTROVERSIE (TRIBUNALE)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [disputeReason, setDisputeReason] = useState('Oggetto non ricevuto')
  const [disputeDescription, setDisputeDescription] = useState('')
  const [submittingDispute, setSubmittingDispute] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetchOrders()
  }, [router])

  async function fetchOrders() {
    setLoading(true)
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      router.push('/login')
      return
    }
    setUser(currentUser)

    // 1. Recupera gli Acquisti (dove tu sei il buyer_id)
    const { data: myPurchases } = await supabase
      .from('transactions')
      .select('*, announcements(*)')
      .eq('buyer_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (myPurchases) setPurchases(myPurchases)

    // 2. Recupera le Vendite (dove tu sei il proprietario dell'annuncio)
    const { data: mySales } = await supabase
      .from('transactions')
      .select('*, announcements!inner(*)')
      .eq('announcements.user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (mySales) setSales(mySales)

    setLoading(false)
  }

  // --- AZIONI VENDITORE ---
  const handleMarkAsShipped = async (transactionId: string) => {
    const tracking = trackingInput[transactionId]
    if (!tracking || tracking.trim() === '') {
      alert("Inserisci un codice di tracciamento valido prima di confermare.")
      return
    }

    setActionLoading(true)
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'Spedito', tracking_code: tracking })
      .eq('id', transactionId)

    if (!error) {
      alert("Ordine segnato come SPEDITO!")
      fetchOrders() 
    } else {
      alert("Errore durante l'aggiornamento.")
    }
    setActionLoading(false)
  }

  // --- AZIONI COMPRATORE ---
  const handleConfirmReceipt = async (transactionId: string) => {
    if (!confirm("Confermi di aver ricevuto l'oggetto in buone condizioni? Questo rilascerà i fondi al venditore.")) return

    setActionLoading(true)
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'Ricevuto' })
      .eq('id', transactionId)

    if (!error) {
      alert("Ottimo! Transazione conclusa. Ora puoi lasciare una recensione al venditore!")
      fetchOrders() 
    } else {
      alert("Errore durante l'aggiornamento.")
    }
    setActionLoading(false)
  }

  // --- LOGICA CONTROVERSIE (TRIBUNALE) ---
  const openDisputeModal = (transaction: any) => {
    setSelectedTransaction(transaction)
    setShowDisputeModal(true)
  }

  const submitDispute = async () => {
    if (!disputeDescription) {
      alert("Inserisci una breve descrizione del problema.");
      return;
    }
    setSubmittingDispute(true)

    const sellerId = selectedTransaction.announcements?.user_id

    const { error } = await supabase.from('disputes').insert([{
      transaction_id: selectedTransaction.id,
      buyer_id: user.id,
      seller_id: sellerId,
      reason: disputeReason,
      description: disputeDescription,
      status: 'Aperta'
    }])

    if (!error) {
      alert("Controversia aperta con successo! Il venditore è stato notificato e i fondi sono bloccati.")
      
      // Notifica al venditore
      if (sellerId) {
        await supabase.from('notifications').insert([{
          user_id: sellerId,
          message: `⚠️ È stata aperta una controversia per l'ordine "${selectedTransaction.announcements?.title}". Vai nel Centro Controversie per rispondere.`,
          is_read: false
        }]);
      }

      setShowDisputeModal(false)
      setDisputeDescription('')
    } else {
      alert("Errore nell'apertura della pratica: " + error.message)
    }
    setSubmittingDispute(false)
  }

  if (loading) return <div className="min-h-screen bg-stone-50 p-10 text-center font-bold uppercase text-[10px] tracking-widest text-stone-400">Caricamento ordini...</div>

  const displayedItems = activeTab === 'acquisti' ? purchases : sales

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-10 pt-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black uppercase italic text-stone-900 mb-8">I Miei Ordini <span className="text-rose-500">SECURE</span></h1>

        {/* TABS SELECTION */}
        <div className="flex gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-stone-100">
          <button 
            onClick={() => setActiveTab('acquisti')} 
            className={`flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'acquisti' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100'}`}
          >
            I miei Acquisti
          </button>
          <button 
            onClick={() => setActiveTab('vendite')} 
            className={`flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'vendite' ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
          >
            Le mie Vendite
          </button>
        </div>

        {/* LISTA ORDINI */}
        {displayedItems.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-stone-100 text-center shadow-sm">
            <span className="text-5xl block mb-4">📭</span>
            <p className="text-stone-500 font-bold uppercase tracking-widest text-[11px]">Nessun ordine trovato qui.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedItems.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                
                {/* Immagine Oggetto */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-50 border border-stone-200 flex-shrink-0">
                  <img src={item.announcements?.image_url || '/usato.png'} className="w-full h-full object-cover" alt="Oggetto" />
                </div>

                {/* Dettagli Base */}
                <div className="flex-1 text-center md:text-left">
                  <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded tracking-widest ${
                    item.status === 'Pagato' ? 'bg-blue-50 text-blue-500' : 
                    item.status === 'Spedito' ? 'bg-orange-50 text-orange-500' : 
                    'bg-emerald-50 text-emerald-500'
                  }`}>
                    Stato: {item.status || 'Pagato'}
                  </span>
                  <h3 className="text-lg font-bold uppercase text-stone-900 mt-2">{item.announcements?.title || 'Annuncio Eliminato'}</h3>
                  <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider mt-1">
                    Data: {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  {item.tracking_code && (
                    <p className="text-xs font-bold text-stone-700 mt-2 bg-stone-50 inline-block px-3 py-1 rounded-lg border border-stone-200">
                      🚚 Tracking: {item.tracking_code}
                    </p>
                  )}
                  {/* Prezzo solo per acquisti visibile qua, se vendite si può rimuovere o lasciare */}
                  <p className="text-lg font-black text-stone-900 mt-2">€ {item.amount?.toFixed(2) || '0.00'}</p>
                </div>

                {/* LOGICA AZIONI (Cambia tra Acquirente e Venditore) */}
                <div className="w-full md:w-auto flex flex-col gap-2 min-w-[200px]">
                  
                  {/* SEZIONE ACQUISTI (Compratore) */}
                  {activeTab === 'acquisti' && (
                    <>
                      {item.status === 'Pagato' && (
                        <p className="text-[10px] text-center font-bold text-stone-400 uppercase tracking-widest bg-stone-50 p-3 rounded-xl border border-stone-100">
                          In attesa di spedizione
                        </p>
                      )}
                      {item.status === 'Spedito' && (
                        <button 
                          disabled={actionLoading}
                          onClick={() => handleConfirmReceipt(item.id)}
                          className="bg-emerald-500 text-white w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md"
                        >
                          {actionLoading ? 'Attendi...' : '✓ Conferma Ricezione'}
                        </button>
                      )}
                      {item.status === 'Ricevuto' && (
                         <Link href={`/announcement/${item.announcements?.id}`} className="block text-center bg-stone-900 text-white w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-md">
                           Lascia Recensione
                         </Link>
                      )}
                      
                      {/* TASTO SEGNALA PROBLEMA SEMPRE PRESENTE PER GLI ACQUISTI */}
                      <button 
                        onClick={() => openDisputeModal(item)} 
                        className="block mt-2 w-full bg-white text-stone-500 px-4 py-2 rounded-xl font-bold uppercase text-[9px] tracking-widest hover:bg-rose-50 hover:text-rose-600 border border-stone-200 transition-all text-center"
                      >
                        ⚠️ Segnala Problema
                      </button>
                    </>
                  )}

                  {/* SEZIONE VENDITE (Venditore) */}
                  {activeTab === 'vendite' && (
                    <>
                      {item.status === 'Pagato' && (
                        <div className="flex flex-col gap-2">
                          <input 
                            type="text" 
                            placeholder="Es. IT123456789 (SDA)" 
                            className="w-full p-2 text-xs border border-stone-200 rounded-lg outline-none focus:border-rose-400"
                            onChange={(e) => setTrackingInput({...trackingInput, [item.id]: e.target.value})}
                          />
                          <button 
                            disabled={actionLoading}
                            onClick={() => handleMarkAsShipped(item.id)}
                            className="bg-gradient-to-r from-rose-500 to-orange-400 text-white w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] transition-all shadow-md"
                          >
                            {actionLoading ? 'Attendi...' : 'Segna come Spedito'}
                          </button>
                        </div>
                      )}
                      {item.status === 'Spedito' && (
                        <p className="text-[10px] text-center font-bold text-stone-400 uppercase tracking-widest bg-stone-50 p-3 rounded-xl border border-stone-100">
                          In attesa di conferma
                        </p>
                      )}
                      {item.status === 'Ricevuto' && (
                        <p className="text-[10px] text-center font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                          ✓ Transazione Conclusa
                        </p>
                      )}
                    </>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALE PER APRIRE LA CONTROVERSIA */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative">
            <button onClick={() => setShowDisputeModal(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 text-xl font-bold">✕</button>
            <div className="text-center mb-6">
              <span className="text-6xl block mb-2">⚖️</span>
              <h2 className="text-2xl font-black uppercase italic text-stone-900">Apri Controversia</h2>
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mt-1">Blocca i fondi e richiedi aiuto</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Motivo della segnalazione</label>
                <select value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl font-bold text-sm outline-none mt-1 focus:border-rose-400">
                  <option>Oggetto non ricevuto</option>
                  <option>Oggetto danneggiato / Diverso</option>
                  <option>Sospetto Oggetto Falso</option>
                  <option>Venditore non risponde</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Descrizione dettagliata</label>
                <textarea 
                  rows={4} 
                  placeholder="Spiega nel dettaglio cosa è successo..." 
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl font-medium text-sm outline-none mt-1 resize-none focus:border-rose-400"
                />
              </div>

              <button onClick={submitDispute} disabled={submittingDispute} className="w-full bg-rose-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-stone-900 transition-all disabled:opacity-50 mt-4 shadow-md">
                {submittingDispute ? 'Apertura in corso...' : 'Invia Segnalazione'}
              </button>
              <p className="text-center text-[9px] font-bold text-stone-400 uppercase tracking-widest px-4 mt-4">
                I fondi verranno bloccati su Stripe finché la controversia non sarà risolta dal team di Re-love.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}