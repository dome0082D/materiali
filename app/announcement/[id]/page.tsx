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

  // STATI PER LE RECENSIONI
  const [reviews, setReviews] = useState<any[]>([])
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)

    // 1. Carica Annuncio
    const { data: a } = await supabase.from('announcements').select('*').eq('id', id).single()
    if (!a) { router.push('/'); return; }
    setAnn(a)

    // 2. Carica Profilo Venditore
    const { data: p } = await supabase.from('profiles').select('*').eq('id', a.user_id).single()
    if (p) {
      setSeller(p)
      
      // 3. Carica le Recensioni di questo venditore
      const { data: revs } = await supabase.from('reviews')
        .select('*')
        .eq('reviewed_id', p.id)
        .order('created_at', { ascending: false })
      if (revs) setReviews(revs)
    }

    setLoading(false)
  }

  // CALCOLO MEDIA RECENSIONI
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : 'Nessuna'

  // INVIA UNA NUOVA RECENSIONE
  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { alert("Devi accedere per lasciare una recensione."); return; }
    setSubmittingReview(true)

    const { data, error } = await supabase.from('reviews').insert([{
      reviewer_id: user.id,
      reviewed_id: seller.id,
      rating: newRating,
      comment: newComment
    }]).select()

    if (error) {
      alert("Errore: " + error.message)
    } else if (data) {
      setReviews([data[0], ...reviews])
      setNewComment('')
      alert("Recensione pubblicata con successo!")
    }
    setSubmittingReview(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-xs tracking-widest text-stone-400">Apertura Cantiere...</div>

  const allImages = [ann.image_url, ...(ann.gallery || [])].filter(Boolean)

  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-20">
      {/* HEADER NAV */}
      <nav className="bg-white border-b p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-sm font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">← Torna alla Ricerca</Link>
          <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{ann.category}</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* COLONNA SINISTRA: GALLERIA FOTOGRAFICA */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-white border border-stone-200 shadow-xl">
            <img src={allImages[activeImg] || "/gazebo.jpg"} className="w-full h-full object-cover transition-all duration-500" alt={ann.title} />
            <div className="absolute top-4 right-4 bg-stone-900/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black">
              {activeImg + 1} / {allImages.length}
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {allImages.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)} className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeImg === i ? 'border-emerald-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* COLONNA DESTRA: INFO E AZIONI */}
        <div className="flex flex-col h-full space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xl space-y-6">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-md text-white ${ann.type === 'sell' ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                  {ann.type === 'sell' ? 'In Vendita' : ann.type === 'offered' ? 'In Regalo' : 'Cerco'}
                </span>
                <span className="text-[10px] font-bold text-stone-400 italic">Pubblicato il {new Date(ann.created_at).toLocaleDateString()}</span>
              </div>
              <h1 className="text-4xl font-black text-stone-900 uppercase italic leading-tight">{ann.title}</h1>
              <p className="text-emerald-600 font-black text-xl mt-2 italic">€ {ann.price}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <span className="text-[9px] font-black text-stone-400 uppercase block mb-1">Disponibilità</span>
                  <span className="text-sm font-bold">{ann.quantity || 1} Pezzi</span>
               </div>
               <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <span className="text-[9px] font-black text-stone-400 uppercase block mb-1">Marca/Modello</span>
                  <span className="text-sm font-bold truncate block">{ann.brand || '-'} {ann.model}</span>
               </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-widest border-b pb-2">Descrizione Materiale</h3>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">{ann.description || 'Nessuna descrizione fornita.'}</p>
            </div>

            {/* BOX VENDITORE CON VALUTAZIONE */}
            {seller && (
              <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center text-emerald-400 font-black text-xs">
                      {seller.user_serial_id?.slice(0, 3)}
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-stone-400 uppercase">Venditore</p>
                      <p className="font-bold text-stone-900 uppercase">{seller.first_name || 'Anonimo'} • {seller.user_serial_id}</p>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase">📍 {seller.residence_city || 'Località non specificata'}</p>
                   </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-400 text-lg">
                    {averageRating !== 'Nessuna' ? '⭐⭐⭐⭐⭐'.slice(0, Math.round(Number(averageRating))) : '⭐'}
                  </div>
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{averageRating} / 5 ({reviews.length} Voti)</span>
                </div>
              </div>
            )}

            {/* TASTO AZIONE PRINCIPALE */}
            <div className="pt-6">
              <Link 
                href={user ? `/chat/${ann.user_id}?ann=${ann.id}` : '/register'} 
                className="w-full bg-stone-900 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
              >
                💬 {user?.id === ann.user_id ? 'Vedi la tua Chat' : 'Contatta il Venditore'}
              </Link>
            </div>
          </div>

          {/* SEZIONE RECENSIONI (SOTTO L'ANNUNCIO) */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase text-stone-900 tracking-widest border-b pb-4">Recensioni Venditore</h3>
            
            {/* MODULO PER LASCIARE UNA RECENSIONE (Solo se non sei il venditore) */}
            {user && user.id !== ann.user_id && (
              <form onSubmit={submitReview} className="bg-stone-50 p-4 rounded-2xl border border-stone-100 space-y-4">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Lascia un feedback</p>
                <div className="flex items-center gap-4">
                  <select value={newRating} onChange={(e) => setNewRating(Number(e.target.value))} className="p-3 bg-white border border-stone-200 rounded-lg text-sm font-bold outline-none cursor-pointer">
                    <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value="4">⭐⭐⭐⭐ (4/5)</option>
                    <option value="3">⭐⭐⭐ (3/5)</option>
                    <option value="2">⭐⭐ (2/5)</option>
                    <option value="1">⭐ (1/5)</option>
                  </select>
                </div>
                <textarea 
                  placeholder="Scrivi un commento su questo venditore (es. Veloce, preciso, materiale ottimo...)" 
                  value={newComment} onChange={(e) => setNewComment(e.target.value)} 
                  className="w-full p-4 bg-white border border-stone-200 rounded-xl outline-none text-sm h-20"
                  required
                />
                <button type="submit" disabled={submittingReview} className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors">
                  {submittingReview ? 'Invio...' : 'Pubblica Recensione'}
                </button>
              </form>
            )}

            {/* LISTA DELLE RECENSIONI */}
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {reviews.map((r, i) => (
                <div key={i} className="p-4 border-b border-stone-100 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-amber-400 text-sm">{'⭐'.repeat(r.rating)}</span>
                    <span className="text-[9px] font-bold text-stone-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-stone-700 italic">"{r.comment}"</p>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Nessuna recensione presente.</p>}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  )
}
