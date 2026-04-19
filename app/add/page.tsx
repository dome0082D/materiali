'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AddAnnouncement() {
  const [title, setTitle] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [category, setCategory] = useState('Edilizia')
  const [files, setFiles] = useState<File[]>([])
  const [type, setType] = useState('sell')
  const [condition, setCondition] = useState('Usato')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files).slice(0, 4))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Accedi!")

    let galleryUrls: string[] = []
    let imageUrl = ""

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const name = `${Math.random()}-${file.name}`
      const { error } = await supabase.storage.from('announcements').upload(name, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('announcements').getPublicUrl(name)
        galleryUrls.push(publicUrl)
        if (i === 0) imageUrl = publicUrl
      }
    }

    const { error } = await supabase.from('announcements').insert([{ 
      title, brand, model, description, category, condition,
      price: parseFloat(price) || 0, 
      quantity: parseInt(quantity) || 1, 
      image_url: imageUrl, gallery: galleryUrls,
      type, user_id: user.id, contact_email: user.email 
    }])

    if (error) alert(error.message)
    else router.push('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 flex items-center justify-center font-sans">
      <main className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 md:p-10 border">
        <h1 className="text-3xl font-black mb-8 uppercase text-stone-900 italic">Nuovo Annuncio</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100 rounded-xl">
            {['sell', 'offered', 'wanted'].map(t => (
              <button key={t} type="button" onClick={() => setType(t)} className={`py-3 rounded-lg text-[10px] font-black uppercase transition-all ${type === t ? 'bg-white text-emerald-600 shadow-md' : 'text-stone-500'}`}>
                {t === 'sell' ? 'Vendi' : t === 'offered' ? 'Regala' : 'Cerco'}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Nome dell'oggetto" className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-sm" onChange={(e)=>setTitle(e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Marca" className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-sm" onChange={(e)=>setBrand(e.target.value)} />
            <input type="text" placeholder="Modello" className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-sm" onChange={(e)=>setModel(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select onChange={(e)=>setCategory(e.target.value)} className="w-full p-4 bg-stone-50 border rounded-xl text-xs font-black uppercase">
              <option value="Edilizia">Edilizia</option><option value="Elettricità">Elettricità</option><option value="Idraulica">Idraulica</option><option value="Attrezzi">Attrezzi</option><option value="Altro">Altro</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.01" placeholder="Prezzo (€)" className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-sm" onChange={(e)=>setPrice(e.target.value)} required={type === 'sell'} />
              <input type="number" min="1" value={quantity} className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-sm" onChange={(e)=>setQuantity(e.target.value)} required />
            </div>
          </div>
          <select onChange={(e)=>setCondition(e.target.value)} className="w-full p-4 bg-stone-50 border rounded-xl text-xs font-black uppercase">
            <option value="Usato">Usato</option><option value="Nuovo">Nuovo</option>
          </select>
          <div className="relative">
            <input type="file" accept="image/*" multiple className="hidden" id="file-upload" onChange={handleFileChange} />
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-2xl cursor-pointer bg-stone-50 text-[10px] font-black text-stone-500 uppercase">
              {files.length > 0 ? `✅ ${files.length} Foto Caricate` : '📸 Inserisci fino a 4 Foto'}
            </label>
          </div>
          <textarea placeholder="Descrizione materiale..." className="w-full p-4 bg-stone-50 border rounded-xl h-32 text-sm" onChange={(e)=>setDescription(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase shadow-xl hover:bg-emerald-700 transition-all">
            {loading ? 'SALVATAGGIO...' : 'PUBBLICA ANNUNCIO'}
          </button>
        </form>
        <Link href="/" className="block text-center mt-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Annulla</Link>
      </main>
    </div>
  )
}
