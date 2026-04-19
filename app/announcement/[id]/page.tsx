'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AnnouncementPage() {
  const { id } = useParams()
  const router = useRouter()
  const [ann, setAnn] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAd() {
      const { data } = await supabase.from('announcements').select('*').eq('id', id).single()
      if (data) setAnn(data)
      setLoading(false)
    }
    if (id) fetchAd()
  }, [id])

  if (loading) return <div className="p-10 text-center font-black uppercase text-xs">Caricamento in corso...</div>
  if (!ann) return <div className="p-10 text-center font-black uppercase text-xs text-red-500">Annuncio non trovato o rimosso.</div>

  return (
    <div className="min-h-screen bg-stone-50 p-6 font-sans flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm flex flex-col md:flex-row">
        
        {/* GALLERIA IMMAGINI */}
        <div className="md:w-1/2 bg-stone-100 p-6 flex flex-col gap-4">
           <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
             <img src={ann.image_url || "/usato.png"} className="w-full h-auto object-cover aspect-square" />
           </div>
           
           {/* Se ci sono più immagini allegate, le mostra sotto in griglia */}
           {ann.image_urls && ann.image_urls.length > 1 && (
             <div className="flex gap-2 overflow-x-auto pb-2">
               {ann.image_urls.map((img: string, i: number) => (
                  <img key={i} src={img} className="w-20 h-20 rounded-lg object-cover border border-stone-200 shadow-sm" />
               ))}
             </div>
           )}
        </div>

        {/* DETTAGLI ACQUISTO */}
        <div className="md:w-1/2 p-8 flex flex-col justify-between bg-white">
           <div>
              <div className="flex justify-between items-start mb-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{ann.category} • {ann.condition}</p>
                 {ann.type === 'offered' && <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded uppercase shadow-sm">Regalo</span>}
              </div>
              
              <h1 className="text-3xl font-black uppercase italic text-stone-900 mb-2">{ann.title}</h1>
              <p className="text-2xl font-black text-emerald-600 mb-8">{ann.type === 'offered' ? 'GRATIS' : `€ ${ann.price}`}</p>
              
              <div className="space-y-4 mb-8">
                 {ann.brand && (
                   <div><p className="text-[9px] font-black uppercase text-stone-400">Marca</p><p className="text-sm font-bold text-stone-800">{ann.brand}</p></div>
                 )}
                 <div><p className="text-[9px] font-black uppercase text-stone-400">Quantità Disponibile</p><p className="text-sm font-bold text-stone-800">{ann.quantity || 1}</p></div>
                 
                 <div className="pt-4 border-t border-stone-100">
                   <p className="text-[9px] font-black uppercase text-stone-400 mb-1">Descrizione / Note</p>
                   <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{ann.notes || 'Nessuna descrizione fornita dal venditore.'}</p>
                 </div>
              </div>
           </div>

           {/* PULSANTI DI AZIONE */}
           <div className="space-y-3 pt-6 border-t border-stone-100">
              <button 
                onClick={() => router.push(`/chat`)} 
                className="w-full bg-stone-900 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all shadow-md"
              >
                Contatta il Venditore (Vai alla Chat)
              </button>
              <Link href="/" className="block text-center w-full bg-stone-100 text-stone-800 p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-200 transition-all">
                ← Torna alla Vetrina
              </Link>
           </div>
        </div>

      </div>
    </div>
  )
}
