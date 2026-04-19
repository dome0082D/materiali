'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditAnnouncement() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uiMode, setUiMode] = useState('sell_used')
  const [title, setTitle] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [category, setCategory] = useState('Edilizia')

  useEffect(() => { loadAd() }, [])

  async function loadAd() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: ad } = await supabase.from('announcements').select('*').eq('id', id).single()
    
    if (!ad || !user || (ad.user_id !== user.id && user.email !== 'dome0082@gmail.com')) return router.push('/')

    setTitle(ad.title || '');
    setBrand(ad.brand || '');
    setModel(ad.model || '');
    setDescription(ad.description || '');
    setPrice(ad.price?.toString() || '0');
    setQuantity(ad.quantity?.toString() || '1');
    setCategory(ad.category || 'Edilizia');

    // Imposta la UI in base ai dati del DB
    if (ad.type === 'sell' && ad.condition === 'Nuovo') setUiMode('sell_new')
    else if (ad.type === 'sell' && ad.condition === 'Usato') setUiMode('sell_used')
    else if (ad.type === 'offered') setUiMode('offered')
    else if (ad.type === 'wanted') setUiMode('wanted')

    setLoading(false);
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    let dbType = 'sell'
    let dbCondition = 'Usato'
    if (uiMode === 'sell_new') { dbType = 'sell'; dbCondition = 'Nuovo'; }
    if (uiMode === 'sell_used') { dbType = 'sell'; dbCondition = 'Usato'; }
    if (uiMode === 'offered') { dbType = 'offered'; dbCondition = 'Usato'; }
    if (uiMode === 'wanted') { dbType = 'wanted'; dbCondition = 'Usato'; }

    await supabase.from('announcements').update({ 
      title, brand, model, description, category, 
      type: dbType, condition: dbCondition,
      price: parseFloat(price) || 0, quantity: parseInt(quantity) || 1
    }).eq('id', id)

    router.push('/profile')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-xs">Caricamento...</div>

  return (
    <div className="min-h-screen bg-stone-50 p-4 flex items-center justify-center font-sans">
      <main className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 md:p-10 border">
        <h1 className="text-3xl font-black mb-8 uppercase text-emerald-600 italic">Modifica Annuncio</h1>
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1 bg-stone-100 rounded-2xl">
            {[{ id: 'sell_new', label: 'Vendi Nuovo' }, { id: 'sell_used', label: 'Vendi Usato' }, { id: 'offered', label: 'Regala' }, { id: 'wanted', label: 'Cerco' }].map((mode) => (
              <button key={mode.id} type="button" onClick={() => setUiMode(mode.id)} className={`py-4 rounded-xl text-[9px] font-black uppercase transition-all ${uiMode === mode.id ? 'bg-white text-emerald-600 shadow-md' : 'text-stone-500'}`}>{mode.label}</button>
            ))}
          </div>
          <input type="text" value={title} className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-sm outline-none" onChange={(e)=>setTitle(e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
             <input type="text" value={brand} placeholder="Marca" className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-sm" onChange={(e)=>setBrand(e.target.value)} />
             <input type="text" value={model} placeholder="Modello" className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-sm" onChange={(e)=>setModel(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full p-4 bg-stone-50 border rounded-xl text-xs font-black uppercase outline-none">
                <option value="Edilizia">Edilizia</option><option value="Elettricità">Elettricità</option><option value="Idraulica">Idraulica</option><option value="Attrezzi">Attrezzi</option><option value="Altro">Altro</option>
             </select>
             <div className="grid grid-cols-2 gap-2">
                <input type="number" step="0.01" value={price} className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-sm" onChange={(e)=>setPrice(e.target.value)} required={uiMode.includes('sell')} />
                <input type="number" min="1" value={quantity} className="w-full p-4 bg-stone-50 border rounded-xl font-bold text-sm" onChange={(e)=>setQuantity(e.target.value)} required />
             </div>
          </div>
          <textarea value={description} className="w-full p-4 bg-stone-50 border rounded-xl h-32 text-sm" onChange={(e)=>setDescription(e.target.value)} />
          <button type="submit" disabled={saving} className="w-full bg-emerald-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase shadow-xl">
            {saving ? 'SALVATAGGIO...' : 'AGGIORNA ANNUNCIO'}
          </button>
        </form>
        <Link href="/profile" className="block text-center mt-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-stone-600">← Annulla</Link>
      </main>
    </div>
  )
}