'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { User } from '@supabase/supabase-js'

// 1. Definiamo l'interfaccia per gli annunci
interface Announcement {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  category_id?: string;
  category?: string;
  condition: string;
  type?: string;
  image_url: string;
  image_urls?: string[];
  user_id: string;
  created_at: string;
  is_sponsored?: boolean;
}

function HomePageContent() {
  const [user, setUser] = useState<User | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  // STATI PER LA RICERCA
  const [mainSearch, setMainSearch] = useState('') 
  const [searchCategory, setSearchCategory] = useState('all')
  const [condition, setSearchCondition] = useState('all')
  const [distance, setDistance] = useState(0) 
  
  // STATO PER LA PAGINAZIONE
  const [visibleCount, setVisibleCount] = useState(12)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const catFilter = searchParams.get('cat')
  const typeFilter = searchParams.get('type')
  const IS_STAFF = user?.email === 'dome0082@gmail.com';

  useEffect(() => { 
    fetchInitialData() 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchInitialData() {
    setLoading(true)
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    
    const { data: ads, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && ads) {
      setAnnouncements(ads as Announcement[])
    }
    
    if (u) {
      const { data: favs } = await supabase.from('favorites').select('announcement_id').eq('user_id', u.id)
      if (favs) setFavorites(favs.map(f => f.announcement_id))
    }
    setLoading(false)
  }

  const handleNearbySearch = () => {
    if (distance > 0) { 
      setDistance(0)
      fetchInitialData() 
    } else {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        setDistance(20) 
        const { data, error } = await supabase.rpc('get_nearby_announcements', {
          user_lat: pos.coords.latitude, 
          user_lon: pos.coords.longitude, 
          radius_meters: 20000
        })
        if (!error && data) {
          setAnnouncements(data as Announcement[])
        }
      })
    }
  }

  async function handleToggleFavorite(e: React.MouseEvent, announcementId: string) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { alert("Devi accedere per salvare i tuoi preferiti ❤️"); return; }
    
    if (favorites.includes(announcementId)) {
      const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('announcement_id', announcementId)
      if (!error) setFavorites(favorites.filter(id => id !== announcementId))
    } else {
      const { error } = await supabase.from('favorites').insert([{ user_id: user.id, announcement_id: announcementId }])
      if (!error) setFavorites([...favorites, announcementId])
    }
  }

  const filteredData = announcements.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(mainSearch.toLowerCase())
    const categoryMatch = catFilter ? item.category_id?.toString() === catFilter : (searchCategory === 'all' || item.category === searchCategory)
    const conditionMatch = condition === 'all' || item.condition === condition
    const typeMatch = !typeFilter || item.type === typeFilter
    const availableMatch = item.quantity > 0 
    return titleMatch && categoryMatch && conditionMatch && typeMatch && availableMatch
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (a.is_sponsored && !b.is_sponsored) return -1;
    if (!a.is_sponsored && b.is_sponsored) return 1;
    return 0; 
  })

  const topItems = sortedData.filter(i => i.condition === 'Nuovo').slice(0, 5)
  const regularItems = sortedData.filter(i => !topItems.find(t => t.id === i.id))

  if (loading) {
    return <div className="min-h-screen bg-transparent flex items-center justify-center font-bold uppercase tracking-widest text-stone-400 text-xs">Caricamento Vetrina...</div>
  }

  return (
    <div className="min-h-screen bg-transparent font-sans text-stone-900 pb-20">
      
      {IS_STAFF && (
        <Link href="/staff" className="fixed bottom-8 right-8 z-[99] bg-stone-900 text-rose-400 w-16 h-16 rounded-full shadow-lg font-bold flex items-center justify-center border-2 border-rose-400 hover:scale-105 active:scale-95 transition-all text-2xl">
          👑
        </Link>
      )}

      {/* --- HERO SECTION: SOSTITUITA CON TEATRO.JPEG --- */}
      <div className="relative w-full h-[400px] md:h-[650px] flex flex-col items-center overflow-hidden">
          {/* Immagine Teatro dedicata all'Hero */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/teatro.jpeg" 
              alt="Re-love Hero"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 w-full h-full max-w-4xl px-4 flex flex-col justify-center pb-16 items-center">
            <div className="relative group w-full max-w-2xl shadow-2xl rounded-3xl">
              <input 
                type="text" 
                placeholder="Cerca vestiti, elettronica, arredamento..." 
                className="w-full p-5 pl-14 rounded-3xl bg-white/60 backdrop-blur-md border border-white/50 outline-none text-sm font-black focus:border-rose-400 focus:bg-white/90 transition-all placeholder:text-stone-600" 
                onChange={(e) => setMainSearch(e.target.value)} 
              />
              <span className="absolute left-5 top-5 text-xl">🔍</span>
            </div>
          </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 -mt-16 relative z-20">
        
        {/* Filtri resi semi-trasparenti */}
        <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/40 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-xl border border-white/30 items-center">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black uppercase text-stone-900 ml-2 tracking-widest">Categoria</label>
            <select onChange={(e) => setSearchCategory(e.target.value)} className="p-3 bg-white/50 rounded-xl text-[11px] font-black uppercase tracking-wide outline-none border border-white/50 hover:bg-white transition-colors cursor-pointer text-stone-900">
              <option value="all">Tutte le Categorie</option>
              <option value="Abbigliamento e Accessori">👕 Abbigliamento e Accessori</option>
              <option value="Elettronica e Informatica">💻 Elettronica e Informatica</option>
              <option value="Casa, Arredamento e Giardino">🛋️ Casa, Arredo, Giardino</option>
              <option value="Alimentari e Bevande">🍎 Alimentari e Bevande</option>
              <option value="Libri, Film e Musica">📚 Libri, Film e Musica</option>
              <option value="Salute e Bellezza">💄 Salute e Bellezza</option>
              <option value="Sport e Tempo Libero">⚽ Sport e Tempo Libero</option>
              <option value="Motori e Veicoli">🚗 Motori e Veicoli</option>
              <option value="Altro / Varie">📦 Altro / Varie</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black uppercase text-stone-900 ml-2 tracking-widest">Condizione Oggetto</label>
            <select onChange={(e) => setSearchCondition(e.target.value)} className="p-3 bg-white/50 rounded-xl text-[11px] font-black uppercase tracking-wide outline-none border border-white/50 hover:bg-white transition-colors cursor-pointer text-stone-900">
              <option value="all">Tutte le Condizioni</option>
              <option value="Nuovo">✨ Nuovo</option>
              <option value="Usato">♻️ Usato</option>
              <option value="Regalo">🎁 In Regalo</option>
              <option value="Baratto">🤝 Baratto</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 pt-5">
            <button onClick={handleNearbySearch} className={`p-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 ${distance > 0 ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-rose-200' : 'bg-stone-900 text-white hover:bg-rose-500'}`}>
              {distance > 0 ? '📍 Filtro 20km Attivo' : '📍 Cerca Vicino a me'}
            </button>
          </div>
        </section>

        {!catFilter && !typeFilter && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <Link href="/add?mode=new" className="group flex flex-col rounded-[2.5rem] border border-white/40 overflow-hidden bg-white/30 backdrop-blur-md hover:bg-white/60 transition-all shadow-lg text-center">
               <div className="relative h-40 w-full overflow-hidden">
                 <img src="/nuovo.png" className="w-full h-full object-contain p-4 group-hover:scale-110 transition-all duration-[0.5s]" alt="Nuovo" />
               </div>
               <div className="p-4 flex-1 flex flex-col justify-center">
                 <h3 className="text-xl font-black uppercase italic text-stone-900 leading-tight">Vendi Nuovo</h3>
               </div>
            </Link>
            
            <Link href="/add?mode=used" className="group flex flex-col rounded-[2.5rem] border border-white/40 overflow-hidden bg-white/30 backdrop-blur-md hover:bg-white/60 transition-all shadow-lg text-center">
               <div className="relative h-40 w-full overflow-hidden">
                 <img src="/usato.png" className="w-full h-full object-contain p-4 group-hover:scale-110 transition-all duration-[0.5s]" alt="Usato" />
               </div>
               <div className="p-4 flex-1 flex flex-col justify-center">
                 <h3 className="text-xl font-black uppercase italic text-stone-900 leading-tight">Vendi Usato</h3>
               </div>
            </Link>
            
            <Link href="/add?mode=gift" className="group flex flex-col rounded-[2.5rem] border border-white/40 overflow-hidden bg-white/30 backdrop-blur-md hover:bg-white/60 transition-all shadow-lg text-center">
               <div className="relative h-40 w-full overflow-hidden">
                 <img src="/regalo.png" className="w-full h-full object-contain p-4 group-hover:scale-110 transition-all duration-[0.5s]" alt="Regalo" />
               </div>
               <div className="p-4 flex-1 flex flex-col justify-center">
                 <h3 className="text-xl font-black uppercase italic text-stone-900 leading-tight">Regalo</h3>
               </div>
            </Link>

            <Link href="/add?mode=barter" className="group flex flex-col rounded-[2.5rem] border border-white/40 overflow-hidden bg-white/30 backdrop-blur-md hover:bg-white/60 transition-all shadow-lg text-center">
               <div className="relative h-40 w-full overflow-hidden">
                 <img src="/baratto.png" className="w-full h-full object-contain p-4 group-hover:scale-110 transition-all duration-[0.5s]" alt="Baratto" />
               </div>
               <div className="p-4 flex-1 flex flex-col justify-center">
                 <h3 className="text-xl font-black uppercase italic text-stone-900 leading-tight">Baratto</h3>
               </div>
            </Link>
          </div>
        )}

        <section className="mb-20">
          <div className="flex justify-between items-end mb-8 border-b border-stone-900/10 pb-4">
            <h2 className="text-[14px] font-black uppercase tracking-[0.4em] text-stone-900">Vetrina Top Nuovo</h2>
            <Link href="/?condition=Nuovo" className="text-[10px] font-black uppercase text-rose-600 hover:text-stone-900 transition-colors">Vedi tutti →</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {topItems.map(item => (
              <div key={item.id} className={`group bg-white/80 backdrop-blur-sm p-4 rounded-[2rem] shadow-lg border ${item.is_sponsored ? 'border-orange-400 ring-2 ring-orange-400/20' : 'border-white/50'} hover:bg-white transition-all relative overflow-hidden`}>
                {item.is_sponsored && (
                  <div className="absolute top-0 left-0 bg-gradient-to-r from-rose-500 to-orange-400 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-br-2xl z-40 tracking-widest shadow-md">
                    TOP ✨
                  </div>
                )}
                <button onClick={(e) => handleToggleFavorite(e, item.id)} className="absolute top-6 right-6 z-30 bg-white/90 w-8 h-8 flex items-center justify-center rounded-full shadow-md text-lg hover:scale-110 transition-all">{favorites.includes(item.id) ? '❤️' : '🤍'}</button>
                <Link href={`/announcement/${item.id}`}>
                  <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100 mb-4 relative border border-stone-200">
                    <img src={item.image_url || "/nuovo.png"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[0.8s]" alt={item.title} />
                  </div>
                  <h4 className="text-[12px] font-black uppercase truncate text-stone-900 mb-1">{item.title}</h4>
                  <p className="text-xl font-black text-rose-600 italic">€ {item.price}</p>
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-end mb-8 border-b border-stone-900/10 pb-4">
            <h2 className="text-[14px] font-black uppercase tracking-[0.4em] text-stone-900 opacity-50">Tutti gli Annunci</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {regularItems.slice(0, visibleCount).map(item => (
              <div key={item.id} className={`group bg-white/70 backdrop-blur-sm rounded-3xl overflow-hidden shadow-md border ${item.is_sponsored ? 'border-orange-400' : 'border-white/40'} hover:bg-white transition-all flex flex-col relative`}>
                {item.is_sponsored && (
                  <div className="absolute top-0 left-0 bg-gradient-to-r from-rose-500 to-orange-400 text-white text-[7px] font-black uppercase px-2 py-1 rounded-br-xl z-40 tracking-widest shadow-sm">
                    TOP 🌟
                  </div>
                )}
                <Link href={`/announcement/${item.id}`} className="aspect-square bg-stone-100 relative block overflow-hidden">
                  <button onClick={(e) => handleToggleFavorite(e, item.id)} className="absolute top-2 right-2 z-30 bg-white/80 w-6 h-6 flex items-center justify-center rounded-full shadow-sm text-xs hover:scale-110 transition-all">{favorites.includes(item.id) ? '❤️' : '🤍'}</button>
                  <img src={item.image_url || "/usato.png"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[0.8s]" alt={item.title} />
                </Link>
                <div className="p-3 flex flex-col justify-between flex-grow">
                  <div>
                    <h4 className="text-[10px] font-black uppercase line-clamp-2 text-stone-800 leading-tight mb-1">{item.title}</h4>
                    <p className="text-[14px] font-black text-rose-600 italic">
                      {item.condition === 'Regalo' || item.condition === 'Baratto' ? '€ 0' : `€ ${item.price}`}
                    </p>
                  </div>
                  <Link href={`/announcement/${item.id}`} className="mt-3 block text-center w-full bg-stone-900 text-white text-[9px] font-black uppercase py-2 rounded-xl hover:bg-rose-500 transition-all">
                    {item.condition === 'Baratto' ? 'Baratta' : item.condition === 'Regalo' ? 'Ricevi' : 'Acquista'}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {regularItems.length > visibleCount && (
            <div className="mt-12 flex justify-center w-full">
              <button 
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="bg-stone-900 text-white px-10 py-4 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all shadow-xl"
              >
                ↓ Carica Altri ({regularItems.length - visibleCount})
              </button>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent flex items-center justify-center font-bold uppercase tracking-widest text-stone-400 text-xs">Caricamento Vetrina...</div>}>
      <HomePageContent />
    </Suspense>
  )
}