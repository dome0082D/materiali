'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [offersList, setOffersList] = useState<any[]>([]) // AGGIUNTO: Stato per le proposte
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState('')

  // STATI PER IL SISTEMA RECENSIONI
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [orderToReview, setOrderToReview] = useState<any>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setMyId(user.id)

    // Recupero Ordini
    const { data: txData } = await supabase
      .from('transactions')
      .select('*, announcements(*)')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (txData) setOrders(txData)

    // AGGIUNTO: Recupero Proposte
    const { data: offData } = await supabase
      .from('offers')
      .select('*, announcements(*)')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (offData) setOffersList(offData)

    setLoading(false)
  }

  // AGGIUNTO: Funzione per accettare/rifiutare le proposte
  const handleOfferAction = async (offerId: string, newStatus: string) => {
    if (!window.confirm(`Vuoi davvero ${newStatus.toLowerCase()} questa proposta?`)) return;
    setLoading(true);
    const { error } = await supabase.from('offers').update({ status: newStatus }).eq('id', offerId);
    if (error) alert("Errore: " + error.message);
    fetchOrders(); // Ricarica i dati
  }

  const handleAction = async (transactionId: string, action: string, userRole: string) => {
    if (!window.confirm("Sei sicuro di voler procedere?")) return;
    
    setLoading(true)
    const res = await fetch('/api/orders/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, action, userId: myId, userRole })
    })
    const data = await res.json()
    if (data.success) {
      alert(data.message)
      fetchOrders()
    } else {
      alert("Errore: " + data.error)
      setLoading(false)
    }
  }

  // FUNZIONE PER INVIARE LA RECENSIONE
  const submitReview = async () => {
    if (!orderToReview) return
    setSubmittingReview(true)

    const { error } = await supabase.from('reviews').insert([{
      transaction_id: orderToReview.id,
      reviewer_id: myId,
      reviewed_user_id: orderToReview.seller_id, // Il destinatario è sempre il venditore
      announcement_id: orderToReview.announcement_id,
      rating: rating,
      comment: comment
    }])

    if (!error) {
      alert("Grazie! La tua recensione è stata pubblicata. ⭐")
      setShowReviewModal(false)
      setRating(5)
      setComment('')
      fetchOrders() // Aggiorna per far sparire il tasto se necessario
    } else {
      alert("Errore: " + error.message)
    }
    setSubmittingReview(false)
  }

  if (loading) return <div className="min-h-screen bg-stone-50 flex justify-center items-center font-black text-stone-400 text-[10px] tracking-widest uppercase">Caricamento ordini...</div>

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10 pb-32">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black uppercase italic text-stone-900 mb-8">Hub Transazioni</h1>

        {/* AGGIUNTO: SEZIONE PROPOSTE IN CORSO */}
        {offersList.length > 0 && (
          <div className="mb-12 space-y-4">
            <h2 className="text-[11px] font-black uppercase text-stone-400 tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span> Negoziazioni in corso
            </h2>
            {offersList.map(offer => {
              const isBuyer = offer.buyer_id === myId
              const ann = offer.announcements

              return (
                <div key={offer.id} className={`p-5 rounded-[2rem] border shadow-sm transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 
                  ${offer.status === 'In attesa' ? 'bg-orange-50 border-orange-100' : 
                    offer.status === 'Accettata' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                  
                  <div className="flex items-center gap-4">
                    <img src={ann.image_url} className="w-12 h-12 object-cover rounded-xl border border-stone-200" alt="Item" />
                    <div>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{isBuyer ? 'Hai proposto' : 'Ti hanno proposto'}</p>
                      <h3 className="text-sm font-black uppercase italic text-stone-900">{ann.title}</h3>
                      <p className="text-lg font-black text-stone-900">€ {offer.offer_price} <span className="text-[9px] text-stone-400 font-bold line-through ml-1">(era €{ann.price})</span></p>
                    </div>
                  </div>

                  <div className="w-full md:w-auto">
                    {!isBuyer && offer.status === 'In attesa' ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleOfferAction(offer.id, 'Accettata')} className="flex-1 md:flex-none bg-emerald-500 text-white px-4 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600 transition-all shadow-md">✅ Accetta</button>
                        <button onClick={() => handleOfferAction(offer.id, 'Rifiutata')} className="flex-1 md:flex-none border border-rose-200 text-rose-500 bg-white px-4 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-rose-50 transition-all">❌ Rifiuta</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end w-full">
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-md mb-2 ${
                          offer.status === 'In attesa' ? 'bg-orange-200 text-orange-700' : 
                          offer.status === 'Accettata' ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700'
                        }`}>{offer.status}</span>
                        {offer.status === 'Accettata' && (
                          <Link href={`/chat/${isBuyer ? offer.seller_id : offer.buyer_id}?ann=${ann.id}`} className="w-full md:w-auto bg-stone-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-rose-500 transition-all text-center">
                            Vai in Chat per concludere
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <h2 className="text-[11px] font-black uppercase text-stone-400 tracking-[0.2em] mb-4">Ordini Definitivi</h2>
        
        <div className="space-y-6">
          {orders.length === 0 ? (
            <p className="text-[10px] font-bold text-stone-400 italic">Nessuna transazione attiva.</p>
          ) : (
            orders.map(order => {
              const isBuyer = order.buyer_id === myId
              const role = isBuyer ? 'buyer' : 'seller'
              const ann = order.announcements

              return (
                <div key={order.id} className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-sm transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md text-white ${ann.condition === 'Baratto' ? 'bg-blue-500' : 'bg-stone-900'}`}>
                        {ann.condition}
                      </span>
                      <h3 className="text-lg font-black uppercase italic text-stone-900 mt-2">{ann.title}</h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase mt-1">
                        Ruolo: {isBuyer ? 'Acquirente' : 'Venditore'} | Stato: <span className="text-rose-500">{order.status}</span>
                      </p>
                    </div>
                    <img src={ann.image_url} className="w-16 h-16 object-cover rounded-xl border border-stone-100" alt="Item" />
                  </div>

                  {/* BOX TRACCIAMENTO SPEDIZIONE */}
                  {(order.status === 'Spedito' || order.status === 'Ricevuto' || order.status === 'Concluso') && isBuyer && order.tracking_number && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                      <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-3 tracking-widest">🚚 Tracciamento Spedizione</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8px] font-black text-stone-400 uppercase">Corriere</p>
                          <p className="text-xs font-bold text-stone-800">{order.courier_name || 'In elaborazione...'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-stone-400 uppercase">Codice Tracking</p>
                          <p className="text-xs font-bold text-stone-800">{order.tracking_number || 'Richiedi in chat'}</p>
                        </div>
                        <div className="col-span-2 pt-3 border-t border-emerald-100/50">
                          <p className="text-[8px] font-black text-stone-400 uppercase">Identificativo Pacco Re-love</p>
                          <p className="text-[10px] font-mono font-bold text-emerald-700">{order.package_id_code}</p>
                        </div>
                      </div>
                      <a 
                        href={`https://www.google.com/search?q=tracking+spedizione+${order.courier_name}+${order.tracking_number}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full mt-4 bg-white border border-emerald-200 text-emerald-600 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex justify-center items-center"
                      >
                        Cerca Tracking Online
                      </a>
                    </div>
                  )}

                  {/* LOGICA BOTTONI NUOVO/USATO (Modificata la condizione dello stato) */}
                  {(ann.condition === 'Nuovo' || ann.condition === 'Usato') && isBuyer && (order.status === 'Pagato' || order.status === 'Spedito') && (
                    <div className="mt-6 flex gap-3 pt-6 border-t border-stone-100">
                      <button onClick={() => handleAction(order.id, 'confirm_receipt', role)} className="flex-1 bg-stone-900 text-white p-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-colors">
                        📦 Pacco Ricevuto Integro
                      </button>
                      <button onClick={() => handleAction(order.id, 'request_refund', role)} className="flex-1 border border-rose-200 text-rose-500 bg-rose-50 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-colors">
                        ❌ Richiedi Rimborso
                      </button>
                    </div>
                  )}

                  {/* LOGICA BOTTONI BARATTO */}
                  {ann.condition === 'Baratto' && order.status === 'Pagato' && (
                    <div className="mt-6 pt-6 border-t border-stone-100">
                      {(isBuyer && order.barter_confirmed_buyer) || (!isBuyer && order.barter_confirmed_seller) ? (
                        <p className="text-[10px] font-black uppercase text-orange-400 text-center tracking-widest bg-orange-50 p-4 rounded-xl border border-orange-100">
                          Hai confermato. In attesa dell'altro utente...
                        </p>
                      ) : (
                        <button onClick={() => handleAction(order.id, 'confirm_barter', role)} className="w-full bg-blue-500 text-white p-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
                          🤝 Conferma Avvenuto Scambio
                        </button>
                      )}
                    </div>
                  )}

                  {/* TASTO LASCIA RECENSIONE */}
                  {isBuyer && (order.status === 'Ricevuto' || order.status === 'Concluso') && (
                    <div className="mt-4 pt-4 border-t border-stone-50">
                       <button 
                         onClick={() => { setOrderToReview(order); setShowReviewModal(true); }}
                         className="w-full bg-yellow-400 text-stone-900 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500 transition-colors shadow-sm"
                       >
                         ⭐ Lascia una Recensione al Venditore
                       </button>
                    </div>
                  )}

                  <div className="mt-4 text-center">
                    <Link href={`/chat/${isBuyer ? order.seller_id : order.buyer_id}?ann=${ann.id}`} className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 tracking-widest underline">
                      Vai alla Chat dell'annuncio
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* MODALE RECENSIONE */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md">
          <div className="bg-white max-w-md w-full rounded-[3rem] p-10 shadow-2xl border-t-8 border-yellow-400 animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black uppercase italic text-stone-900 mb-2">Com'è andata?</h2>
            <p className="text-xs font-medium text-stone-500 mb-8 italic">La tua opinione aiuta la community di Re-love a crescere sicura.</p>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className={`text-4xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-stone-200'}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea 
              className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold outline-none focus:border-yellow-400 transition-all mb-8 min-h-[100px]"
              placeholder="Scrivi un commento sul venditore..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="space-y-3">
              <button 
                onClick={submitReview}
                disabled={submittingReview}
                className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-500 transition-all disabled:opacity-50"
              >
                {submittingReview ? 'Pubblicazione...' : 'Pubblica Recensione'}
              </button>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="w-full text-stone-400 py-2 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:text-stone-900"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}