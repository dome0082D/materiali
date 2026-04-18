'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AddAnnouncement() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState('sell') // sell, offered, wanted
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert("Devi fare l'accesso prima!"); return; }

    let imageUrl = ""

    // LOGICA CARICAMENTO FOTO (se l'utente ha selezionato un file)
    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(fileName, file)
      
      if (!uploadError) {
        const { data: link } = supabase.storage.from('announcements').getPublicUrl(fileName)
        imageUrl = link.publicUrl
      } else {
        alert("Errore nel caricamento della foto: " + uploadError.message)
      }
    }

    const { error } = await supabase.from('announcements').insert([{ 
      title, 
      description, 
      price: parseFloat(price) || 0, 
      image_url: imageUrl, 
      type, 
      user_id: user.id, 
      contact_email: user.email 
    }])

    if (error) {
      alert(error.message)
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center font-sans">
      <main className="bg-white w-full max-w-xl rounded-xl shadow-2xl p-8 border border-gray-200">
        <h1 className="text-2xl font-black mb-6 uppercase tracking-tighter italic text-slate-800">Crea Annuncio</h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SELETTORE TRIPLO */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg">
            {['sell', 'offered', 'wanted'].map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} 
                className={`py-2 rounded-md text-[9px] font-black uppercase transition-all ${type === t ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-400'}`}>
                {t === 'sell' ? 'Vendi' : t === 'offered' ? 'Regala' : 'Cerca'}
              </button>
            ))}
          </div>

          <input type="text" placeholder="Titolo (es. Trapano, Mattoni...)" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm" onChange={(e)=>setTitle(e.target.value)} required />
          
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Prezzo (€) - Metti 0 se regali/cerchi" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm" onChange={(e)=>setPrice(e.target.value)} required />
            
            {/* PULSANTE ALLEGATO FOTO */}
            <div className="relative">
              <input type="file" accept="image/*" className="hidden" id="file-upload" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
              <label htmlFor="file-upload" className="flex items-center justify-center w-full h-full p-4 bg-sky-50 border border-dashed border-sky-300 rounded-lg cursor-pointer text-[10px] font-bold text-sky-600 uppercase hover:bg-sky-100 transition-colors">
                {file ? '✅ ' + file.name.substring(0, 15) + '...' : '📸 Allega Foto'}
              </label>
            </div>
          </div>

          <textarea placeholder="Descrizione dettagliata..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none h-32 text-sm" onChange={(e)=>setDescription(e.target.value)} />

          <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white py-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 transition-all">
            {loading ? 'CARICAMENTO IN CORSO...' : 'PUBBLICA ORA'}
          </button>
        </form>
        
        <Link href="/" className="block text-center mt-6 text-[9px] font-bold text-gray-400 uppercase tracking-widest hover:text-slate-600">← Annulla e torna alla Home</Link>
      </main>
    </div>
  )
}
