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
  
  // STATI PER MODALI
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  
  // STATI FORM CONTROVERSIA (Problemi Reali)
  const [disputeReason, setDisputeReason] = useState('Oggetto non ricevuto')
  const [disputeDescription, setDisputeDescription] = useState('')
  const [submittingDispute, setSubmittingDispute] = useState(false)

  // STATI FORM RESO (Normale reso)
  const [returnReason, setReturnReason] = useState('Ho cambiato idea')
  const [returnDescription, setReturnDescription] = useState('')

  const router = useRouter()
  const ADMIN_EMAIL = 'dome0082@gmail.com'

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

    const { data: myPurchases } = await supabase
      .from('transactions')
      .select('*, announcements(*)')
      .eq('buyer_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (myPurchases) setPurchases(myPurchases)

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
      alert("Inserisci un codice di tracciamento o il nome del corriere valido prima di confermare.")
      return
    }

    setActionLoading(true)
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'Spedito', tracking_code: tracking })
      .eq('id', transactionId)

    if (!error) {
      alert("Ordine segnato come SPEDITO!")
      
      const tx = sales.find(s => s.id === transactionId);
      if (tx) {
        await supabase.from('notifications').insert([{
          user_id: tx.buyer_id,
          message: `📦 Il tuo ordine "${tx.announcements?.title}" è stato spedito! Tracking: ${tracking}`,
          is_read: false
        }]);
      }
      fetchOrders() 
    } else {
      alert("Errore durante l'aggiornamento.")
    }
    setActionLoading(false)
  }

  // --- AZIONI COMPRATORE ---
  const handleConfirmReceipt = async (transactionId: string) => {
    if (!confirm("Confermi di aver ricevuto l'oggetto in buone condizioni? I fondi verranno sbloccati al venditore.")) return

    setActionLoading(true)
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'Ricevuto' })
      .eq('id', transactionId)

    if (!error) {
      alert("Ottimo! Transazione conclusa con successo.")
      
      const tx = purchases.find(p => p.id === transactionId);
      const sellerId = tx?.announcements?.user_id;
      if (sellerId) {
        await supabase.from('notifications').insert([{
          user_id: sellerId,
          message: `✅ L'acquirente ha ricevuto l'ordine "${tx.announcements?.title}". I fondi sono stati rilasciati!`,
          is_read: false
        }]);
      }
      fetchOrders() 
    } else {
      alert("Errore durante l'aggiornamento.")
    }
    setActionLoading(false)
  }

  // --- LOGICA SEGNALAZIONE PROBLEMA (CONTROVERSIA PER DANNI/TRUFFE) ---
  const submitDispute = async () => {
    if (!disputeDescription.trim()) {
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
      alert("Problema segnalato allo Staff! I fondi sono stati bloccati.")
      
      if (sellerId) {
        await supabase.from('notifications').insert([{
          user_id: sellerId,
          message: `⚠️ L'acquirente ha segnalato un problema (Controversia) per "${selectedTransaction.announcements?.title}".`,
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

  // --- LOGICA RESO NORMALE (CONCORDATO TRA UTENTI) ---
  const submitReturn = async () => {
    setSubmittingDispute(true)
    const sellerId = selectedTransaction.announcements?.user_id

    try {
      // Aggiorniamo SOLO la transazione. Niente controversia in tribunale!
      const { error } = await supabase.from('transactions')
        .update({ status: 'In Reso' })
        .eq('id', selectedTransaction.id)

      if (error) throw error;

      // Notifica diretta al Venditore con la motivazione
      if (sellerId) {
        await supabase.from('notifications').insert([{
          user_id: sellerId,
          message: `🔄 L'acquirente ha avviato il reso per "${selectedTransaction.announcements?.title}". Motivo: ${returnReason}. Contattalo in chat per i dettagli della spedizione.`,
          is_read: false
        }]);
      }

      alert("Reso avviato! Contatta il venditore in chat per accordarvi sulla spedizione di ritorno.")
      setShowReturnModal(false)
      setReturnDescription('')
      fetchOrders()

    } catch (err: any) {
      alert("Errore nell'avvio del reso: " + err.message)
    } finally {
      setSubmittingDispute(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-stone-50 p-10 text-center font-bold uppercase text-[10px] tracking-widest text-stone-400 flex items-center justify-center">Caricamento ordini...</div>

  const displayedItems = activeTab === 'acquisti' ? purchases : sales

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-10 pt-10 pb-32">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-black uppercase italic text-stone-900">
            I Miei Ordini <span className="text-rose-500 text-sm align-top">SECURE</span>
          </h1>
        </div>

        {/* TABS SELECTION */}
        <div className="flex gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-stone-100 max-w-lg mx-auto">
          <button 
            onClick={() => setActiveTab('acquisti')} 
            className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'acquisti' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
          >
            🛒 Acquisti
          </button>
          <button 
            onClick={() => setActiveTab('vendite')} 
            className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'vendite' ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
          >
            📦 Vendite
          </button>
        </div>

        {/* LISTA ORDINI */}
        {displayedItems.length === 0 ? (
          <div className="bg-white py-24 rounded-[2rem] border border-stone-100 text-center shadow-sm">
            <span className="text-6xl block mb-4">{activeTab === 'acquisti' ? '🛍️' : '🏷️'}</span>
            <h3 className="text-xl font-black uppercase text-stone-900 mb-2">Nessun {activeTab === 'acquisti' ? 'Acquisto' : 'Ordine ricevuto'}</h3>
            <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Non ci sono transazioni da mostrare qui.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {displayedItems.map((item) => (
              <div key={item.id} className="bg-white rounded-[2rem] p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center hover:shadow-md transition-shadow">
                
                {/* Immagine Oggetto */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-50 border border-stone-100 flex-shrink-0">
                  <img src={item.announcements?.image_url || '/usato.png'} className="w-full h-full object-cover" alt="Oggetto" />
                </div>

                {/* Dettagli Base */}
                <div className="flex-1 text-left">
                  <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-md tracking-widest ${
                    item.status === 'Pagato' ? 'bg-blue-50 text-blue-600' : 
                    item.status === 'Spedito' ? 'bg-orange-50 text-orange-600' : 
                    item.status === 'Ricevuto' ? 'bg-emerald-50 text-emerald-600' :
                    item.status === 'In Reso' ? 'bg-rose-50 text-rose-600' :
                    'bg-stone-100 text-stone-600'
                  }`}>
                    {item.status || 'Pagato'}
                  </span>
                  <h3 className="text-xl font-black uppercase text-stone-900 mt-3 truncate" title={item.announcements?.title}>
                    {item.announcements?.title || 'Annuncio Eliminato'}
                  </h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">
                    Del {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  
                  {item.tracking_code && (
                    <p className="text-[10px] font-bold text-stone-600 mt-3 bg-stone-50 inline-block px-3 py-1.5 rounded-lg border border-stone-200 uppercase tracking-widest">
                      🚚 Tracking: {item.tracking_code}
                    </p>
                  )}
                  
                  {activeTab === 'acquisti' && (
                     <p className="text-xl font-black text-rose-500 italic mt-3">€ {item.amount?.toFixed(2) || '0.00'}</p>
                  )}
                </div>

                {/* LOGICA AZIONI (Cambia tra Acquirente e Venditore) */}
                <div className="w-full md:w-56 flex flex-col gap-2 flex-shrink-0 border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6">
                  
                  {/* SEZIONE ACQUISTI (Compratore) */}
                  {activeTab === 'acquisti' && (
                    <>
                      {item.status === 'Pagato' && (
                        <p className="text-[10px] text-center font-bold text-stone-400 uppercase tracking-widest bg-stone-50 py-3 rounded-xl border border-stone-100">
                          In attesa di spedizione
                        </p>
                      )}
                      
                      {item.status === 'Spedito' && (
                        <button 
                          disabled={actionLoading}
                          onClick={() => handleConfirmReceipt(item.id)}
                          className="bg-emerald-500 text-white w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md"
                        >
                          {actionLoading ? 'Attendi...' : 'Ricevuto!'}
                        </button>
                      )}
                      
                      {item.status === 'Ricevuto' && (
                         <Link href={`/announcement/${item.announcements?.id}`} className="block text-center bg-stone-900 text-white w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-md">
                           Lascia Feedback
                         </Link>
                      )}

                      {/* TASTI AZIONE COMPRATORE */}
                      {(item.status === 'Pagato' || item.status === 'Spedito' || item.status === 'Ricevuto') && (
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {/* 1. SEGNALA PROBLEMA (Tribunale) */}
                          <button 
                            onClick={() => { setSelectedTransaction(item); setShowDisputeModal(true); }} 
                            className="bg-white text-stone-500 py-2 rounded-xl font-bold uppercase text-[8px] tracking-widest hover:bg-rose-50 hover:text-rose-600 border border-stone-200 transition-all"
                          >
                            ⚠️ Problema
                          </button>
                          
                          {/* 2. CHIEDI RESO NORMALE (Solo se il venditore lo accetta) */}
                          {item.announcements?.accepts_returns ? (
                            <button 
                              onClick={() => { setSelectedTransaction(item); setShowReturnModal(true); }} 
                              className="bg-white text-stone-500 py-2 rounded-xl font-bold uppercase text-[8px] tracking-widest hover:bg-blue-50 hover:text-blue-600 border border-stone-200 transition-all"
                            >
                              🔄 Reso
                            </button>
                          ) : (
                            <div className="flex items-center justify-center bg-stone-50 text-stone-400 py-2 rounded-xl font-bold uppercase text-[7px] tracking-widest border border-stone-100 text-center px-1">
                              🚫 No Resi
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* SEZIONE VENDITE (Venditore) */}
                  {activeTab === 'vendite' && (
                    <>
                      {item.status === 'Pagato' && (
                        <div className="flex flex-col gap-2">
                          <input 
                            type="text" 
                            placeholder="Codice Tracking..." 
                            className="w-full p-2.5 text-xs font-bold border border-stone-200 rounded-xl outline-none focus:border-orange-400 bg-stone-50"
                            onChange={(e) => setTrackingInput({...trackingInput, [item.id]: e.target.value})}
                          />
                          <button 
                            disabled={actionLoading}
                            onClick={() => handleMarkAsShipped(item.id)}
                            className="bg-gradient-to-r from-orange-400 to-rose-500 text-white w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-md"
                          >
                            {actionLoading ? 'Attendi...' : 'Segna Spedito'}
                          </button>
                        </div>
                      )}
                      
                      {item.status === 'Spedito' && (
                        <p className="text-[10px] text-center font-bold text-stone-400 uppercase tracking-widest bg-stone-50 p-3 rounded-xl border border-stone-100">
                          In attesa che arrivi
                        </p>
                      )}
                      
                      {item.status === 'Ricevuto' && (
                        <p className="text-[10px] text-center font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                          ✓ Pagamento Sbloccato
                        </p>
                      )}
                      
                      {item.status === 'In Reso' && (
                         <div className="flex flex-col gap-2">
                           <p className="text-[9px] text-center font-black text-rose-600 uppercase tracking-widest bg-rose-50 p-2 rounded-xl border border-rose-100">
                             Reso in corso
                           </p>
                           <Link href="/chat" className="text-center text-[10px] font-bold text-stone-500 underline">
                             Accorda spedizione in chat
                           </Link>
                         </div>
                      )}
                    </>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODALE CONTROVERSIA (PROBLEMA REALE: TRUFFA/DANNI) --- */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full relative animate-in zoom-in duration-200">
            <button onClick={() => setShowDisputeModal(false)} className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 text-2xl font-bold">✕</button>
            <div className="text-center mb-6">
              <span className="text-6xl block mb-3">⚖️</span>
              <h2 className="text-2xl font-black uppercase italic text-stone-900">Segnala Problema</h2>
              <p className="text-[10px] uppercase font-bold text-rose-500 tracking-widest mt-1">L'assistenza interverrà</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Motivo del problema</label>
                <select value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl font-bold text-sm outline-none mt-1 focus:border-rose-400">
                  <option>Oggetto non ricevuto</option>
                  <option>Oggetto danneggiato o difettoso</option>
                  <option>L'oggetto è palesemente falso</option>
                  <option>Venditore irreperibile</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Descrizione dettagliata</label>
                <textarea 
                  rows={4} 
                  placeholder="Spiega allo Staff cosa è andato storto..." 
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl font-medium text-sm outline-none mt-1 resize-none focus:border-rose-400"
                />
              </div>
              <button onClick={submitDispute} disabled={submittingDispute} className="w-full bg-rose-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-stone-900 transition-all disabled:opacity-50 mt-2 shadow-md">
                {submittingDispute ? 'Apertura in corso...' : 'Invia Segnalazione'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALE RESO NORMALE (ACCORDO DILETTO) --- */}
      {showReturnModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full relative animate-in zoom-in duration-200">
            <button onClick={() => setShowReturnModal(false)} className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 text-2xl font-bold">✕</button>
            <div className="text-center mb-6">
              <span className="text-6xl block mb-3">🔄</span>
              <h2 className="text-2xl font-black uppercase italic text-stone-900">Effettua il Reso</h2>
              <p className="text-[10px] uppercase font-bold text-blue-500 tracking-widest mt-1">Reso accettato dal venditore</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Perché fai il reso?</label>
                <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl font-bold text-sm outline-none mt-1 focus:border-blue-400">
                  <option>Ho cambiato idea / Non mi serve</option>
                  <option>Taglia o Misura errata</option>
                  <option>Diverso da come me lo aspettavo</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Aggiungi dettagli</label>
                <textarea 
                  rows={4} 
                  placeholder="Scrivi qui i dettagli per il venditore (opzionale)..." 
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl font-medium text-sm outline-none mt-1 resize-none focus:border-blue-400"
                />
              </div>
              <button onClick={submitReturn} disabled={submittingDispute} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-stone-900 transition-all disabled:opacity-50 mt-2 shadow-md">
                {submittingDispute ? 'Apertura in corso...' : 'Conferma Reso'}
              </button>
              <p className="text-center text-[9px] font-bold text-stone-400 uppercase tracking-widest px-2 mt-2">
                Il venditore riceverà una notifica. Accordatevi in chat per le spese e le modalità di spedizione del reso.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}