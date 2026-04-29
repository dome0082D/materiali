'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ControversiePage() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDisputes() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Cerchiamo le controversie in cui l'utente è coinvolto (come venditore o compratore)
      const { data } = await supabase
        .from('disputes')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (data) setDisputes(data)
      setLoading(false)
    }

    fetchDisputes()
  }, [])

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
        <div className="flex justify-between items-end mb-8 border-b border-stone-100 pb-4">
          <h2 className="text-sm font-black uppercase text-stone-400 tracking-widest">Le tue pratiche attive</h2>
          <button className="bg-stone-900 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 transition-all">
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
              <div key={dispute.id} className="p-6 bg-white border border-stone-200 rounded-3xl shadow-sm flex justify-between items-center">
                <div>
                  <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${dispute.status === 'Aperta' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {dispute.status}
                  </span>
                  <h4 className="text-sm font-black text-stone-900 mt-2 uppercase">{dispute.reason}</h4>
                  <p className="text-[10px] font-bold text-stone-500 mt-1 uppercase tracking-widest">ID Pratica: {dispute.id.slice(0, 8)}</p>
                </div>
                <button className="bg-stone-100 text-stone-600 px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-900 hover:text-white transition-all">
                  Vedi Dettagli
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}