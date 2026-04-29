'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function StaffControversiePanel() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchDisputes()
  }, [])

  async function fetchDisputes() {
    setLoading(true)
    
    // Lo staff scarica TUTTE le controversie, con i dettagli della transazione
    const { data, error } = await supabase
      .from('disputes')
      .select(`
        *,
        transaction:transactions(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Errore recupero controversie:", error)
    } else if (data) {
      setDisputes(data)
    }
    
    setLoading(false)
  }

  // --- FUNZIONE DEL GIUDICE: DECIDI CHI HA RAGIONE ---
  const resolveDispute = async (disputeId: string, resolution: 'Rimborso Acquirente' | 'Fondi al Venditore', buyerId: string, sellerId: string) => {
    const confirmMessage = resolution === 'Rimborso Acquirente' 
      ? "⚠️ Sicuro di voler RIMBORSARE il compratore? I fondi verranno stornati su Stripe." 
      : "⚠️ Sicuro di voler sbloccare i fondi e PAGARE il venditore?";

    if (!confirm(confirmMessage)) return;

    setActionLoading(true)

    // 1. Aggiorniamo lo stato della controversia
    const { error } = await supabase
      .from('disputes')
      .update({ status: `Risolta (${resolution})` })
      .eq('id', disputeId)

    if (!error) {
      alert(`Pratica chiusa con successo: ${resolution}!`);
      
      // 2. Inviamo la notifica ufficiale (Sentenza) a ENTRAMBI
      const sentenzaMsg = resolution === 'Rimborso Acquirente'
        ? `⚖️ Lo Staff ha chiuso la controversia a favore dell'Acquirente. È stato emesso un rimborso.`
        : `⚖️ Lo Staff ha chiuso la controversia a favore del Venditore. I fondi sono stati sbloccati.`;

      await supabase.from('notifications').insert([
        { user_id: buyerId, message: sentenzaMsg, is_read: false },
        { user_id: sellerId, message: sentenzaMsg, is_read: false }
      ]);

      fetchDisputes(); // Aggiorniamo la lista a schermo
    } else {
      alert("Errore durante la chiusura: " + error.message)
    }
    setActionLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 pb-32">
      
      {/* HEADER PANNELLO STAFF */}
      <div className="w-full py-12 bg-stone-900 text-white flex items-center justify-center shadow-lg relative">
         <div className="text-center max-w-2xl px-6">
            <h1 className="text-3xl font-black uppercase italic tracking-widest mb-2">Pannello Staff <span className="text-rose-500">PRO</span></h1>
            <p className="text-stone-400 font-bold text-[10px] uppercase tracking-[0.3em]">Gestione Suprema Controversie</p>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-black uppercase text-stone-900 tracking-tighter">Pratiche Aperte</h2>
          <button onClick={fetchDisputes} className="bg-white text-stone-600 border border-stone-200 px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-stone-100 transition-all shadow-sm">
            🔄 Aggiorna
          </button>
        </div>

        {loading ? (
          <p className="text-center text-stone-400 font-bold text-xs uppercase tracking-widest mt-12">Recupero fascicoli in corso...</p>
        ) : disputes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-stone-200 rounded-[3rem] p-16 text-center shadow-sm">
            <span className="text-6xl block mb-4">☕</span>
            <h3 className="text-xl font-black uppercase text-stone-900 mb-2">Nessun problema</h3>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Non ci sono controversie aperte sulla piattaforma.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {disputes.map(dispute => {
              const isClosed = dispute.status.includes('Risolta');
              
              return (
                <div key={dispute.id} className={`p-6 md:p-8 bg-white border rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-8 ${isClosed ? 'border-emerald-200 bg-emerald-50/30 opacity-75' : 'border-rose-200'}`}>
                  
                  {/* DETTAGLI FASCICOLO */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start border-b border-stone-100 pb-4">
                      <div>
                        <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${isClosed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-500 text-white shadow-md'}`}>
                          {dispute.status}
                        </span>
                        <h4 className="text-xl font-black text-stone-900 mt-3 uppercase">{dispute.reason}</h4>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Pratica ID: {dispute.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Valore Bloccato</p>
                        <p className="text-2xl font-black text-stone-900">€ {dispute.transaction?.amount?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                      <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Descrizione dell'Acquirente:</p>
                      <p className="text-sm font-medium text-stone-800 italic">"{dispute.description}"</p>
                    </div>

                    <div className="flex gap-6 text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                      <p>👤 Acquirente ID: <span className="text-stone-900">{dispute.buyer_id.slice(0,8)}</span></p>
                      <p>👤 Venditore ID: <span className="text-stone-900">{dispute.seller_id.slice(0,8)}</span></p>
                    </div>
                  </div>

                  {/* PANNELLO DI COMANDO DEL GIUDICE */}
                  {!isClosed && (
                    <div className="w-full md:w-72 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-stone-100 pt-6 md:pt-0 md:pl-8">
                      <p className="text-[10px] font-black uppercase text-stone-900 tracking-widest text-center mb-2">Emetti Sentenza</p>
                      
                      <button 
                        disabled={actionLoading}
                        onClick={() => resolveDispute(dispute.id, 'Rimborso Acquirente', dispute.buyer_id, dispute.seller_id)}
                        className="bg-stone-900 text-white w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-md disabled:opacity-50"
                      >
                        ⚖️ Rimborsa Compratore
                      </button>
                      
                      <button 
                        disabled={actionLoading}
                        onClick={() => resolveDispute(dispute.id, 'Fondi al Venditore', dispute.buyer_id, dispute.seller_id)}
                        className="bg-emerald-500 text-white w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md disabled:opacity-50"
                      >
                        💸 Dai Soldi al Venditore
                      </button>
                      
                      <p className="text-center text-[8px] font-bold uppercase text-stone-400 tracking-widest mt-2">Questa azione è irreversibile e notificherà le parti in tempo reale.</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}