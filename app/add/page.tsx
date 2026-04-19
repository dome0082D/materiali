'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function AddPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') // 'new', 'used', 'gift'

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: 'Casa',
    price: mode === 'gift' ? '0' : '',
    image_url: '',
    condition: mode === 'new' ? 'Nuovo' : 'Usato'
  })

  useEffect(() => {
    if (!mode) router.push('/')
  }, [mode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert("Accedi per pubblicare"); return }

    const { error } = await supabase.from('announcements').insert([{
      ...formData,
      price: parseFloat(formData.price),
      type: mode === 'gift' ? 'offered' : 'sell',
      user_id: user.id,
      contact_email: user.email
    }])

    if (error) alert(error.message)
    else router.push('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 border border-stone-200 shadow-sm">
        <h2 className="text-2xl font-black uppercase italic mb-2">Pubblica</h2>
        <p className="text-[10px] font-bold uppercase text-stone-400 mb-8 tracking-widest">
          {mode === 'gift' ? 'Percorso Regalo: Niente soldi, solo recupero' : `Percorso ${mode}`}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[9px] font-black uppercase ml-1">Titolo Oggetto</label>
            <input required type="text" className="w-full p-4 mt-1 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-400" 
              onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div>
            <label className="text-[9px] font-black uppercase ml-1">Categoria</label>
            <select className="w-full p-4 mt-1 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none cursor-pointer"
              onChange={e => setFormData({...formData, category: e.target.value})}>
              <option>Casa</option><option>Elettronica</option><option>Libri</option><option>Sport</option><option>Altro</option>
            </select>
          </div>

          {mode !== 'gift' && (
            <div>
              <label className="text-[9px] font-black uppercase ml-1">Prezzo (€)</label>
              <input required type="number" className="w-full p-4 mt-1 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-400" 
                onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
          )}

          <div>
            <label className="text-[9px] font-black uppercase ml-1">Link Immagine (URL)</label>
            <input type="text" placeholder="https://..." className="w-full p-4 mt-1 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-400" 
              onChange={e => setFormData({...formData, image_url: e.target.value})} />
          </div>

          <button disabled={loading} className="w-full bg-stone-900 text-white p-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all mt-4">
            {loading ? 'Caricamento...' : 'Conferma e Pubblica'}
          </button>
          
          <Link href="/" className="block text-center text-[9px] font-black uppercase text-stone-300 hover:text-stone-900 mt-4">Annulla</Link>
        </form>
      </div>
    </div>
  )
}

export default function AddPage() {
  return <Suspense fallback={<p>Caricamento...</p>}><AddPageContent /></Suspense>
}