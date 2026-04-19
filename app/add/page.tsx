'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function AddPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([]) 
  const [coords, setCoords] = useState<{lat: number, lon: number} | null>(null)
  
  const [formData, setFormData] = useState({ 
    title: '', 
    category: 'Casa', 
    brand: '',
    quantity: '1',
    price: mode === 'gift' ? '0' : '', 
    notes: '', 
    condition: mode === 'new' ? 'Nuovo' : 'Usato' 
  })

  // Rileva la posizione GPS al caricamento
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      });
    }
  }, []);

  async function handleSubmit(e: any) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert("Accedi per pubblicare"); setLoading(false); return }

    // 1. Caricamento immagini nello Storage
    let uploadedUrls: string[] = [];
    if (files.length > 0) {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
        if (!uploadError) {
           const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(filePath);
           uploadedUrls.push(publicUrlData.publicUrl);
        }
      }
    }

    const mainImageUrl = uploadedUrls.length > 0 ? uploadedUrls[0] : '';

    // 2. Creazione payload con coordinate PostGIS
    const payload = {
      title: formData.title,
      category: formData.category,
      brand: formData.brand,
      quantity: parseInt(formData.quantity) || 1,
      price: parseFloat(formData.price) || 0,
      notes: formData.notes,
      image_url: mainImageUrl, 
      image_urls: uploadedUrls, 
      condition: formData.condition,
      type: mode === 'gift' ? 'offered' : 'sell',
      user_id: user.id,
      contact_email: user.email,
      location: coords ? `POINT(${coords.lon} ${coords.lat})` : null
    }

    const { error } = await supabase.from('announcements').insert([payload])
    if (error) alert(error.message); else router.push('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 border border-stone-200 shadow-sm">
        <h2 className="text-2xl font-black uppercase italic mb-6">Pubblica Annuncio</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Titolo" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-400" onChange={e => setFormData({...formData, title: e.target.value})} />
          <select className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none" onChange={e => setFormData({...formData, category: e.target.value})}>
            <option>Casa</option><option>Elettronica</option><option>Libri</option><option>Sport</option><option>Altro</option>
          </select>
          <input placeholder="Marca" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-400" onChange={e => setFormData({...formData, brand: e.target.value})} />
          <input required type="number" min="1" placeholder="Quantità" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-400" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
          {mode !== 'gift' ? (
            <input required type="number" step="0.01" min="0" placeholder="Prezzo (€)" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-400" onChange={e => setFormData({...formData, price: e.target.value})} />
          ) : (
             <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-black uppercase text-center rounded-xl">Regalo: Prezzo 0€</div>
          )}
          <textarea placeholder="Note e descrizione..." className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-400 min-h-[100px]" onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
          <div className="p-4 bg-stone-50 border border-stone-100 rounded-xl">
             <label className="text-[9px] font-black uppercase text-stone-400 block mb-2">Allega Immagini</label>
             <input type="file" multiple accept="image/*" className="w-full text-xs outline-none" onChange={e => setFiles(Array.from(e.target.files || []))} />
          </div>
          <button disabled={loading} className="w-full bg-stone-900 text-white p-4 rounded-2xl font-black uppercase text-xs hover:bg-emerald-600 transition-all">{loading ? 'Caricamento...' : 'Conferma'}</button>
          <Link href="/" className="block text-center text-[9px] font-black uppercase text-stone-300 pt-2 hover:text-stone-900 transition-colors">Annulla</Link>
        </form>
      </div>
    </div>
  )
}
export default function AddPage() { return <Suspense><AddPageContent /></Suspense> }
