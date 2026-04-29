'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeListings: 0,
    totalValue: 0,
    potentialEarnings: 0,
    barters: 0,
    gifts: 0
  })
  const router = useRouter()

  useEffect(() => {
    async function fetchStats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Recuperiamo tutti gli annunci dell'utente
      const { data: ads } = await supabase
        .from('announcements')
        .select('*')
        .eq('user_id', user.id)

      if (ads) {
        let value = 0;
        let bCount = 0;
        let gCount = 0;

        ads.forEach(ad => {
          value += (Number(ad.price) * Number(ad.quantity));
          if (ad.condition === 'Baratto') bCount++;
          if (ad.condition === 'Regalo') gCount++;
        });

        setStats({
          activeListings: ads.length,
          totalValue: value,
          potentialEarnings: value * 0.90, // Togliamo il 10% di commissione stimata
          barters: bCount,
          gifts: gCount
        });
      }
      setLoading(false)
    }

    fetchStats()
  }, [router])

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-black uppercase tracking-widest text-xs text-stone-400">Elaborazione Dati...</div>

  return (
    <div className="min-h-screen bg-white font-sans text-stone-900 pb-32">
      
      {/* HEADER */}
      <div className="w-full py-16 bg-stone-50 border-b border-stone-100 flex items-center justify-center">
         <div className="text-center max-w-2xl px-6">
            <h1 className="text-4xl font-black uppercase italic text-stone-900 tracking-tighter mb-2">Seller Hub</h1>
            <p className="text-stone-400 font-bold text-[10px] uppercase tracking-[0.3em]">Le performance del tuo negozio Re-love</p>
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-12">
        
        {/* GRIGLIA STATISTICHE PRINCIPALI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4">Valore Magazzino</p>
            <h2 className="text-4xl font-black text-stone-900">€ {stats.totalValue.toFixed(2)}</h2>
            <p className="text-xs font-bold text-emerald-500 mt-2">Stimato: € {stats.potentialEarnings.toFixed(2)} netti</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4">Annunci Attivi</p>
            <h2 className="text-4xl font-black text-stone-900">{stats.activeListings}</h2>
            <p className="text-xs font-bold text-stone-500 mt-2 flex gap-4">
              <span>🤝 {stats.barters} Baratti</span>
              <span>🎁 {stats.gifts} Regali</span>
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📈</div>
            <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4">Traffico Totale</p>
            <h2 className="text-4xl font-black text-stone-900">--</h2>
            <p className="text-[10px] font-bold text-orange-400 uppercase mt-2 tracking-widest">In elaborazione</p>
          </div>

        </div>

        {/* SEZIONE PRO: TRIBUNALE E SPEDIZIONI (IN ARRIVO) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 flex flex-col justify-center items-center text-center">
            <span className="text-4xl mb-4">⚖️</span>
            <h3 className="text-xl font-black uppercase text-stone-900 mb-2">Centro Controversie</h3>
            <p className="text-xs font-medium text-stone-600 mb-6">Gestisci i rimborsi, i resi e i problemi con gli acquirenti in totale sicurezza.</p>
            <button disabled className="bg-rose-200 text-rose-500 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest opacity-70 cursor-not-allowed">
              In Arrivo...
            </button>
          </div>

          <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 flex flex-col justify-center items-center text-center">
            <span className="text-4xl mb-4">📦</span>
            <h3 className="text-xl font-black uppercase text-stone-900 mb-2">Etichette Spedizione</h3>
            <p className="text-xs font-medium text-stone-600 mb-6">Genera e stampa automaticamente le lettere di vettura per i tuoi pacchi.</p>
            <button disabled className="bg-blue-200 text-blue-500 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest opacity-70 cursor-not-allowed">
              In Arrivo...
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}