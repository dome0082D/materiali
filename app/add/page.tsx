'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

interface ProfileData {
  stripe_account_id?: string;
  first_name?: string;
  last_name?: string;
}

const CATEGORIES = [
  'Abbigliamento e Accessori',
  'Elettronica e Informatica',
  'Casa, Arredamento e Giardino',
  'Alimentari e Bevande',
  'Libri, Film e Musica',
  'Salute e Bellezza',
  'Sport e Tempo Libero',
  'Motori e Veicoli',
  'Altro / Varie'
]

function AddAnnouncementForm() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'used' 

  // --- MAPPA DEGLI SFONDI DINAMICI (NOMI ESATTI DA VS CODE) ---
  const backgroundMap: Record<string, string> = {
    new: '/relove citta.jpeg',
    used: '/urbano.jpeg',
    gift: '/relove montagna.jpeg',
    barter: '/relove antico.jpeg'
  }

  const currentBackground = backgroundMap[mode] || '/urbano.jpeg'

  // Impostazioni iniziali in base al mode
  const initialCondition = mode === 'new' ? 'Nuovo' : mode === 'gift' ? 'Regalo' : mode === 'barter' ? 'Baratto' : 'Usato'
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [condition, setCondition] = useState(initialCondition)
  const [shippingCost, setShippingCost] = useState('0')
  const [quantity, setQuantity] = useState('1')
  const [allowLocalPickup, setAllowLocalPickup] = useState(false)
  const [exchangeItem, setExchangeItem] = useState('')

  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      
      const { data } = await supabase.from('profiles').select('stripe_account_id, first_name, last_name').eq('id', user.id).single()
      setProfile(data)
      setLoadingUser(false)
    }
    checkUser()
  }, [router])

  // Seleziona la condizione quando cambia il 'mode' nell'URL
  useEffect(() => {
    setCondition(mode === 'new' ? 'Nuovo' : mode === 'gift' ? 'Regalo' : mode === 'barter' ? 'Baratto' : 'Usato')
    if (mode === 'gift' || mode === 'barter') {
      setPrice('0')
    }
  }, [mode])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      if (images.length + selectedFiles.length > 5) {
         alert("Massimo 5 foto consentite.")
         return
      }
      setImages([...images, ...selectedFiles])
      
      const newUrls = selectedFiles.map(file => URL.createObjectURL(file))
      setImageUrls([...imageUrls, ...newUrls])
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)

    const newUrls = [...imageUrls]
    URL.revokeObjectURL(newUrls[index])
    newUrls.splice(index, 1)
    setImageUrls(newUrls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!profile?.stripe_account_id && condition !== 'Regalo' && condition !== 'Baratto') {
      alert("Per vendere oggetti e ricevere pagamenti, devi prima collegare il tuo conto Stripe dal tuo Profilo.")
      router.push('/profile')
      return
    }

    if (images.length === 0) {
      alert('Carica almeno una foto!')
      return
    }

    setUploading(true)
    try {
      const uploadedImageUrls: string[] = []

      for (const file of images) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage.from('announcements').upload(filePath, file)
        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('announcements').getPublicUrl(filePath)
        uploadedImageUrls.push(data.publicUrl)
      }

      const numPrice = condition === 'Regalo' || condition === 'Baratto' ? 0 : parseFloat(price)
      const numShipping = parseFloat(shippingCost) || 0
      const qty = parseInt(quantity) || 1

      const { data: insertedData, error } = await supabase.from('announcements').insert([
        {
          title,
          description,
          price: numPrice,
          category,
          condition,
          image_url: uploadedImageUrls[0],
          image_urls: uploadedImageUrls,
          user_id: user.id,
          shipping_cost: numShipping,
          quantity: qty,
          allow_local_pickup: allowLocalPickup,
          exchange_item: condition === 'Baratto' ? exchangeItem : null,
        }
      ]).select()

      if (error) throw error

      alert('Annuncio creato con successo! 🚀')
      router.push(`/announcement/${insertedData[0].id}`)
    } catch (error: any) {
      alert('Errore: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  if (loadingUser) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-stone-400 tracking-widest text-xs">Accesso in corso...</div>

  return (
    <div className="min-h-screen bg-transparent font-sans text-stone-900 pb-32 relative">
      
      {/* --- SFONDO IMMAGINE DIETRO A TUTTO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src={currentBackground} 
          alt="Sfondo Annuncio"
          className="w-full h-full object-cover object-center"
        />
        {/* Patina chiara per far risaltare il modulo bianco */}
        <div className="absolute inset-0 bg-stone-100/70 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10">
        {/* --- HEADER DINAMICO CON SFONDO PERSONALIZZATO (RIPRISTINATO) --- */}
        <div className="relative w-full h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden border-b border-stone-200">
           <div className="absolute inset-0 z-0">
              <img 
                src={currentBackground} 
                alt={`Sfondo ${mode}`}
                className="w-full h-full object-cover object-center opacity-90"
              />
              {/* Sfumatura per far leggere bene il testo bianco sopra l'immagine */}
              <div className="absolute inset-0 bg-stone-900/40"></div>
           </div>

           <div className="relative z-10 text-center max-w-2xl px-6">
              <h1 className="text-4xl md:text-5xl font-black uppercase italic text-white tracking-tighter mb-4 shadow-sm drop-shadow-lg">
                 {mode === 'new' && 'Vendi il tuo Nuovo'}
                 {mode === 'used' && 'Dai una Seconda Vita'}
                 {mode === 'gift' && 'Regalo Solidale'}
                 {mode === 'barter' && 'Inizia il Baratto'}
              </h1>
              <p className="text-stone-100 font-medium text-xs md:text-sm uppercase tracking-[0.2em] shadow-sm drop-shadow-md">
                 {mode === 'new' && 'Sigillato, intatto, mai aperto. Trasformalo in guadagno.'}
                 {mode === 'used' && 'Vendi ciò che non usi più, proteggi il pianeta.'}
                 {mode === 'gift' && 'Un piccolo gesto che può significare molto per qualcuno.'}
                 {mode === 'barter' && 'Scambia i tuoi oggetti senza bisogno di denaro.'}
              </p>
           </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 -mt-10 relative z-20">
          
          {(!profile?.stripe_account_id && mode !== 'gift' && mode !== 'barter') && (
            <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-[2rem] mb-8 text-center shadow-lg">
              <span className="text-4xl mb-4 block">⚠️</span>
              <h3 className="font-black uppercase text-orange-600 mb-2">Attenzione</h3>
              <p className="text-xs font-bold text-orange-500 mb-6 uppercase tracking-widest">Devi collegare Stripe prima di poter incassare i pagamenti degli annunci in vendita.</p>
              <Link href="/profile" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-stone-900 transition-colors">
                Configura Portafoglio
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-stone-200 space-y-10">
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-900">Le tue foto</h3>
                  <p className="text-[10px] font-bold uppercase text-stone-400 mt-1">Carica fino a 5 immagini (La prima sarà la copertina)</p>
                </div>
                <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded">{images.length}/5</span>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden border-2 border-stone-100 group">
                    <img src={url} className="w-full h-full object-cover" alt="Preview" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 bg-stone-900/80 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500">✕</button>
                    {i === 0 && <span className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 text-[8px] font-black uppercase rounded shadow-sm">Cover</span>}
                  </div>
                ))}
                
                {images.length < 5 && (
                  <label className="w-32 h-32 flex-shrink-0 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
                    <span className="text-2xl mb-1">+</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Aggiungi</span>
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-stone-100">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Cosa vuoi proporre?</label>
                 <input required type="text" placeholder="Es. Giacca Vintage anni 80" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none focus:bg-white focus:border-rose-400 transition-all" />
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Descrizione (Sii sincero sui difetti)</label>
                 <textarea required rows={4} placeholder="Descrivi taglia, marca, eventuali segni d'usura..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none focus:bg-white focus:border-rose-400 transition-all resize-none" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Categoria</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none focus:bg-white focus:border-rose-400 transition-all appearance-none cursor-pointer">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Condizione Selezionata</label>
                    <div className="w-full p-5 bg-stone-100 border border-stone-200 rounded-2xl font-black text-stone-600 uppercase">
                      {condition}
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-stone-100">
               {condition === 'Baratto' && (
               <div className="space-y-2 bg-blue-50 p-6 rounded-3xl border border-blue-100">
                   <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest ml-2">Cosa cerchi in cambio?</label>
                   <input required type="text" placeholder="Es. Cerco vinili rock, oppure libri fantasy..." value={exchangeItem} onChange={(e) => setExchangeItem(e.target.value)} className="w-full p-5 bg-white border border-blue-200 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all text-blue-900" />
                 </div>
               )}

               {condition !== 'Regalo' && condition !== 'Baratto' && (
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2 flex justify-between">
                        Prezzo
                        <span className="text-rose-500 bg-rose-50 px-1 rounded">-10% Comm.</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-stone-400">€</span>
                        <input required type="number" step="0.01" min="0.50" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-5 pl-10 bg-stone-50 border border-stone-100 rounded-2xl font-black outline-none focus:bg-white focus:border-rose-400 transition-all text-xl" placeholder="0.00" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest ml-2">Tu Guadagni</label>
                      <div className="w-full p-5 bg-emerald-50 border border-emerald-100 rounded-2xl font-black text-emerald-700 text-xl flex items-center h-[68px]">
                        € {price ? (parseFloat(price) * 0.90).toFixed(2) : '0.00'}
                      </div>
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Pezzi disponibili</label>
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl font-black outline-none focus:bg-white focus:border-rose-400 transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Spese Spedizione</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-stone-400">€</span>
                      <input type="number" step="0.10" min="0" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} className="w-full p-5 pl-10 bg-stone-50 border border-stone-100 rounded-2xl font-black outline-none focus:bg-white focus:border-rose-400 transition-all" placeholder="0.00 (Gratis)" />
                    </div>
                  </div>
               </div>

               <label className="flex items-center gap-4 p-5 bg-stone-50 border border-stone-100 rounded-2xl cursor-pointer hover:bg-stone-100 transition-colors">
                 <input type="checkbox" checked={allowLocalPickup} onChange={(e) => setAllowLocalPickup(e.target.checked)} className="w-6 h-6 accent-rose-500 rounded" />
                 <div className="flex flex-col">
                   <span className="text-xs font-black uppercase text-stone-800">Consenti Ritiro a Mano</span>
                   <span className="text-[9px] font-bold uppercase text-stone-400">Gli acquirenti vicini potranno non pagare la spedizione</span>
                 </div>
               </label>
            </div>

            <div className="pt-8">
              <button disabled={uploading || (!profile?.stripe_account_id && condition !== 'Regalo' && condition !== 'Baratto')} type="submit" className="w-full bg-stone-900 text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-rose-500 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100">
                {uploading ? 'Pubblicazione in corso...' : 'Pubblica il tuo annuncio 🚀'}
              </button>
              <p className="text-center mt-6 text-[10px] font-bold uppercase text-stone-400 tracking-widest">
                Cliccando accetti il manifesto etico di Re-love.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AddPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center font-black uppercase text-stone-400 tracking-widest text-xs animate-pulse">Re-love sta arrivando...</div>}>
      <AddAnnouncementForm />
    </Suspense>
  )
}