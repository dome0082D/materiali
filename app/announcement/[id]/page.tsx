'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AnnouncementDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [ann, setAnn] = useState<any>(null)
  const [seller, setSeller] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [reviews, setReviews] = useState<any[]>([])
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    const { data: a } = await supabase.from('announcements').select('*').eq('id', id).single()
    if (!a) return router.push('/')
    setAnn(a)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', a.user_id).single()
    if (p) {
      setSeller(p)
      const { data: revs } = await supabase.from('reviews').select('*').eq('reviewed_id', p.id).order('created_at', { ascending: false })
      if (revs) setReviews(revs)
    }
    setLoading(false)
  }

  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : '5.0'

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return alert("Accedi per recensire!")
    const { data, error } = await supabase.from('reviews').insert([{ reviewer_id: user.id, reviewed_id: seller.id, rating: newRating, comment: newComment }]).select()
    if (!error && data) {
      setReviews([data[0], ...reviews])
      setNewComment('')
      alert("Recensione inviata!")
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-stone-300 uppercase tracking-widest text-xs">Apertura...</div>

  const allImages = [ann.image_url, ...(ann.gallery || [])].filter(Boolean)
  const mapUrl = `http://maps.google.com/?q=${encodeURIComponent(`${seller?.residence_city || ''} ${seller?.residence_street || ''}`)}`

  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-20">
      <nav className="bg-white/80 border-b p-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-[10px] font-black uppercase">
          <Link href="/" className="text-stone-400 hover:text-stone-900">← Torna alla Home</Link>
          <span className="text-emerald-600 font-bold">{ann.category}</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-white border shadow-2xl">
            <img src={allImages[activeImg]} className="w-full h-full object-cover" alt="Prodotto" />
          </div>
          <div className="flex gap-3 overflow-x-auto py-2">
            {allImages.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)} className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 ${activeImg === i ? 'border-emerald-500 scale-105 shadow-md' : 'border-transparent opacity-50'}`}>
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black text-stone-900 uppercase italic tracking-tighter leading-none">{ann.title}</h1>
                <p className="text-emerald-600 font-black text-2xl mt-4 italic">€ {ann.price}</p>
              </div>
              <div className="text-right bg-stone-50 p-3 rounded-2xl border">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Feedback</p>
                <p className="text-lg font-black text-stone-800">⭐ {averageRating}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-stone-50 rounded-2xl border">
                  <span className="text-[8px] font-black text-stone-400 uppercase block">Quantità</span>
                  <span className="text-sm font-bold">{ann.quantity} Pezzi</span>
               </div>
               <div className="p-4 bg-stone-50 rounded-2xl border">
                  <span className="text-[8px] font-black text-stone-400 uppercase block">Condizione</span>
                  <span className="text-sm font-bold uppercase">{ann.condition || 'Usato'}</span>
               </div>
            </div>
            <p className="text-stone-500 text-sm leading-relaxed whitespace-pre-wrap">{ann.description}</p>
            <div className="pt-6 border-t">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4 text-center">Indirizzo del Ritiro</p>
              <a href={mapUrl} target="_blank" className="block relative h-40 rounded-3xl overflow-hidden group">
                 <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500" />
                 <div className="absolute inset-0 bg-stone-900/40 flex flex-col items-center justify-center gap-2">
                    <span className="bg-white text-stone-900 px-6 py-2.5 rounded-full font-black text-[10px] uppercase shadow-2xl">Vedi Indirizzo su Maps 📍</span>
                    <span className="text-white font-black uppercase text-[10px] tracking-widest">{seller?.residence_city}</span>
                 </div>
              </a>
            </div>
            <Link href={user ? `/chat/${ann.user_id}?ann=${ann.id}` : '/register'} className="w-full bg-stone-900 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all block text-center">
              💬 {user?.id === ann.user_id ? 'Vedi le tue Chat' : 'Contatta il Venditore'}
            </Link>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest border-b pb-4">Recensioni Profilo</h3>
            {user && user.id !== ann.user_id && (
              <form onSubmit={submitReview} className="space-y-4">
                <select value={newRating} onChange={(e)=>setNewRating(Number(e.target.value))} className="p-3 bg-stone-50 border rounded-lg text-sm font-bold w-full outline-none">
                  <option value="5">⭐⭐⭐⭐⭐ Ottimo</option><option value="4">⭐⭐⭐⭐ Buono</option><option value="3">⭐⭐⭐ Normale</option><option value="2">⭐⭐ Scarso</option><option value="1">⭐ Pessimo</option>
                </select>
                <textarea placeholder="Scrivi un commento..." value={newComment} onChange={(e)=>setNewComment(e.target.value)} className="w-full p-4 border rounded-xl text-sm" required />
                <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase">Invia Recensione</button>
              </form>
            )}
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={i} className="p-4 border-b border-stone-100 last:border-0">
                  <span className="text-amber-400 text-xs">{'⭐'.repeat(r.rating)}</span>
                  <p className="text-xs text-stone-700 italic mt-1">"{r.comment}"</p>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Nessuna recensione.</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}