'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Star, MapPin, Package, CheckCircle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function VetrinaVenditore({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadVetrina() {
      // 1. Dati Profilo
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', params.id).single()
      setProfile(prof)

      // 2. Annunci Attivi
      const { data: anns } = await supabase.from('announcements').select('*').eq('user_id', params.id)
      setItems(anns || [])

      // 3. Recensioni
      const { data: revs } = await supabase.from('reviews').select('*').eq('reviewed_user_id', params.id).order('created_at', { ascending: false })
      setReviews(revs || [])
      setLoading(false)
    }
    loadVetrina()
  }, [params.id])

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-stone-400 animate-pulse">Apertura Vetrina...</div>

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "Nessuna"

  return (
    <div className="min-h-screen bg-stone-50 pb-32">
      <div className="bg-white border-b border-stone-200 py-20">
         <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="w-24 h-24 bg-rose-500 text-white rounded-3xl flex items-center justify-center text-4xl font-black italic mx-auto mb-6 shadow-xl">
               {profile?.first_name?.[0].toUpperCase() || 'R'}
            </div>
            <h1 className="text-4xl font-black uppercase italic text-stone-900 tracking-tighter">Vetrina di {profile?.first_name}</h1>
            <div className="flex justify-center items-center gap-6 mt-4">
               <p className="flex items-center gap-2 text-xs font-black uppercase text-stone-400"><MapPin size={16} /> {profile?.city || 'Italia'}</p>
               <p className="flex items-center gap-2 text-xs font-black uppercase text-yellow-500"><Star size={16} fill="#f59e0b" /> {avgRating} ({reviews.length})</p>
               <p className="flex items-center gap-2 text-xs font-black uppercase text-emerald-500"><ShieldCheck size={16} /> Verificato</p>
            </div>
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* LISTA OGGETTI */}
        <div className="lg:col-span-2">
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-stone-400 mb-8 flex items-center gap-3">
             <Package size={18} /> In Vendita ({items.length})
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map(item => (
                 <Link key={item.id} href={`/announcement/${item.id}`} className="bg-white p-4 rounded-[2rem] border border-stone-200 hover:shadow-xl transition-all group">
                    <img src={item.image_url} className="w-full h-48 object-cover rounded-2xl mb-4" />
                    <h3 className="font-black uppercase text-stone-900 truncate">{item.title}</h3>
                    <p className="font-black text-rose-500 italic mt-1">€ {item.price}</p>
                 </Link>
              ))}
           </div>
        </div>

        {/* FEEDBACK */}
        <div>
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-stone-400 mb-8">Cosa dicono</h2>
           <div className="space-y-4">
              {reviews.map(r => (
                 <div key={r.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                    <div className="flex gap-1 mb-2">
                       {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < r.rating ? "#f59e0b" : "none"} className={i < r.rating ? "text-yellow-500" : "text-stone-200"} />)}
                    </div>
                    <p className="text-xs text-stone-600 font-medium italic">"{r.comment}"</p>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}