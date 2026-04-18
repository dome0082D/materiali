'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AddMaterialPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert("Accedi prima!"); return; }

      let imageUrl = ''
      if (image) {
        const fileName = `${Math.random()}-${image.name}`
        const { error: upErr } = await supabase.storage.from('materiali-images').upload(fileName, image)
        if (upErr) throw upErr
        const { data } = supabase.storage.from('materiali-images').getPublicUrl(fileName)
        imageUrl = data.publicUrl
      }

      const { error: insErr } = await supabase.from('announcements').insert([{
        title, description, price: parseFloat(price), image_url: imageUrl, user_id: user.id, contact_email: user.email
      }])
      if (insErr) throw insErr

      alert("Materiale caricato con successo!")
      router.push('/')
    } catch (err: any) {
      alert("Errore: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 md:p-2 lg:p-3 flex flex-col items-center">
      <div className="bg-[#fafafa] w-full max-w-[1920px] mx-auto md:rounded-2xl border-slate-200/80 md:border shadow-sm min-h-screen md:min-h-[calc(100vh-1.5rem)] overflow-hidden flex flex-col items-center justify-center p-6">
        
        <Link href="/" className="mb-6 text-xl font-serif text-slate-800 tracking-tight hover:opacity-70 transition">
          MATERIALI
        </Link>
        
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
          <h1 className="text-2xl font-serif text-slate-800 mb-2 tracking-tight">Nuovo Annuncio</h1>
          <p className="text-slate-400 mb-6 text-sm font-light">Inserisci i dettagli del materiale da condividere.</p>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 ml-1">Titolo dell'annuncio</label>
              <input 
                type="text" 
                placeholder="es: 20 mq di Parquet Rovere" 
                className="w-full p-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-1 focus:ring-sky-300 outline-none transition-all text-slate-700 text-sm font-light" 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 ml-1">Descrizione dettagliata</label>
              <textarea 
                placeholder="Descrivi lo stato, dove si trova..." 
                className="w-full p-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-1 focus:ring-sky-300 outline-none transition-all text-slate-700 text-sm font-light h-24 resize-none" 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 ml-1">Prezzo (€)</label>
                <input 
                  type="number" 
                  placeholder="0 = Gratis" 
                  className="w-full p-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-1 focus:ring-sky-300 outline-none transition-all text-slate-700 text-sm font-light" 
                  onChange={(e) => setPrice(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 ml-1">Foto (opzionale)</label>
                <label className="flex items-center justify-center w-full p-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 cursor-pointer hover:bg-slate-100 transition-all text-slate-500 text-sm font-light">
                  <span>{image ? "✅ Presa" : "📸 Scegli File"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)} />
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-slate-700 text-white py-2.5 rounded-full text-xs font-medium shadow-sm hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Caricamento...' : 'Pubblica Annuncio'}
              </button>
            </div>
            
            <Link href="/" className="block text-center text-slate-400 text-xs mt-4 hover:text-slate-600 transition font-light">
              Annulla
            </Link>
          </form>
        </div>

      </div>
    </div>
  )
}
