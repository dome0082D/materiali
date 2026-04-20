'use client'

/**
 * HOME PAGE PRINCIPALE - MARKETPLACE MATERIALI
 * Funzionalità integrate:
 * - Autenticazione Supabase
 * - Sistema Preferiti (Realtime-like)
 * - Geolocalizzazione (Filtro "Vicino a me")
 * - Filtri incrociati (Categoria, Condizione, Ricerca Testuale)
 * - Area Staff Protetta (Lucchetto email)
 * - Design multi-sezione con Tailwind CSS
 */

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function HomePageContent() {
  // --- STATI DI SISTEMA ---
  const [user, setUser] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  // --- STATI DI RICERCA E FILTRI ---
  const [mainSearch, setMainSearch] = useState('') 
  const [searchCategory, setSearchCategory] = useState('all')
  const [condition, setSearchCondition] = useState('all')
  const [distance, setDistance] = useState(0) // 0 = Tutte le distanze
  
  // --- STATI UI ---
  const [isStaffOpen, setIsStaffOpen] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Filtri URL (da Sidebar o tasti rapidi)
  const catFilter = searchParams.get('cat')
  const typeFilter = searchParams.get('type')

  // LOGICA STAFF: Verifica identità per funzioni amministrative
  const IS_STAFF = user?.email === 'dome0082@gmail.com';

  /**
   * Effetto iniziale: Recupero dati utente e catalogo
   */
  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    setLoading(true)
    
    // 1. Recupero Utente
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    
    // 2. Recupero Catalogo Completo (Ordinato per i più recenti)
    const { data: ads, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && ads) setAnnouncements(ads)
    
    // 3. Recupero Preferiti se l'utente è loggato
    if (u) {
      const { data: favs } = await supabase
        .from('favorites')
        .select('announcement_id')
        .eq('user_id', u.id)
      if (favs) setFavorites(favs.map(f => f.announcement_id))
    }
    
    setLoading(false)
  }

  /**
   * FUNZIONE: Cerca Vicino a me
   * Utilizza le coordinate del browser e una funzione RPC su Supabase
   */
  const handleNearbySearch = () => {
    if (distance > 0) { 
      setDistance(0)
      fetchInitialData() 
    } else {
      if (!navigator.geolocation) {
        alert("Geolocalizzazione non supportata dal tuo browser")
        return
      }
      
      navigator.geolocation.getCurrentPosition(async (pos) => {
        setDistance(20) // Imposta raggio a 20km
        const { data, error } = await supabase.rpc('get_nearby_announcements', {
          user_lat: pos.coords.latitude, 
          user_lon: pos.coords.longitude, 
          radius_meters: 20000
        })
        if (!error && data) setAnnouncements(data)
      })
    }
  }

  /**
   * FUNZIONE: Gestione Cuoricini (Preferiti)
   */
  async function handleToggleFavorite(e: any, announcementId: string) {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      alert("Devi effettuare l'accesso per salvare i tuoi preferiti ❤️")
      return
    }
    
    if (favorites.includes(announcementId)) {
      // Rimuovi
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('announcement_id', announcementId)
      
      if (!error) setFavorites(favorites.filter(id => id !== announcementId))
    } else {
      // Aggiungi
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: user.id, announcement_id: announcementId }])
      
      if (!error) setFavorites([...favorites, announcementId])
    }
  }

  /**
   * LOGICA DI FILTRAGGIO DINAMICO (Client-Side)
   */
  const filteredData = announcements.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(mainSearch.toLowerCase())
    
    // Gestione Categoria (da Select o da URL Sidebar)
    const categoryMatch = catFilter 
      ? item.category_id?.toString() === catFilter 
      : (searchCategory === 'all' || item.category === searchCategory)
      
    const conditionMatch = condition === 'all' || item.condition === condition
    const typeMatch = !typeFilter || item.type === typeFilter
    const availableMatch = item.quantity > 0 // Non mostriamo gli esauriti nella vetrina principale
    
    return titleMatch && categoryMatch && conditionMatch && typeMatch && availableMatch
  })

  // Divisione per sezioni visive
  const topItems = filteredData.filter(i => i.condition === 'Nuovo').slice(0, 5)
  const regularItems = filteredData.filter(i => !topItems.find(t => t.id === i.id))

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 pb-32">
      
      {/* --------------------------------------------------------- */}
      {/* 1. TASTO STAFF REALE (SOLO PER DOME0082)                */}
      {/* --------------------------------------------------------- */}
      {IS_STAFF && (
        <button 
          onClick={() => setIsStaffOpen(true)} 
          className="fixed bottom-12 right-12 z-[99] bg-stone-900 text-emerald-400 w-20 h-20 rounded-full shadow-[0_25px_50px_rgba(0,0,0,0.3)] font-black flex items-center justify-center border-2 border-emerald-400 hover:scale-110 active:scale-95 transition-all animate-pulse"
          title="Pannello Amministratore"
        >
          👑
        </button>
      )}

      {/* --------------------------------------------------------- */}
      {/* 2. HERO SECTION CON GAZEBO E RICERCA                    */}
      {/* --------------------------------------------------------- */}
      <div className="relative h-[520px] flex flex-col items-center justify-center p-8 text-center overflow-hidden border-b border-stone-200 bg-white">
          {/* Immagine Gazebo originale */}
          <img 
            src="/gazebo.jpg" 
            className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105 pointer-events-none" 
            alt="Background" 
          />
          
          <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center">
            <h1 className="text-[120px] font-black uppercase italic tracking-tighter text-stone-900 leading-none mb-4 drop-shadow-2xl">
              Materiali
            </h1>
            <p className="text-[14px] font-black uppercase tracking-[0.8em] text-stone-400 mb-14 ml-4">
              Vendi • Compra • Regala
            </p>
            
            {/* Input di ricerca gigante Amazon-style */}
            <div className="relative group w-full max-w-2xl">
              <input 
                type="text" 
                placeholder="Cerca tra migliaia di prodotti per l'edilizia..." 
                className="w-full p-8 pl-16 rounded-[3rem] bg-white border-2 border-stone-100 outline-none text-lg focus:border-emerald-500 shadow-[0_40px_80px_rgba(0,0,0,0.15)] transition-all placeholder:text-stone-300" 
                onChange={(e) => setMainSearch(e.target.value)} 
              />
              <span className="absolute left-7 top-8 opacity-30 text-3xl">🔍</span>
            </div>
          </div>
      </div>

      {/* --------------------------------------------------------- */}
      {/* 3. CONTENUTI PRINCIPALI                                 */}
      {/* --------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto px-8 -mt-20 relative z-20">
        
        {/* BARRA DEI FILTRI PROFESSIONALE */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-8 bg-white p-8 rounded-[4rem] shadow-2xl border border-stone-50 items-center">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Settore</label>
            <select 
              onChange={(e) => setSearchCategory(e.target.value)} 
              className="p-5 bg-stone-50 rounded-3xl text-[11px] font-black uppercase tracking-widest outline-none border-none hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <option value="all">Tutte le Categorie</option>
              <option value="Edilizia">🏗️ Edilizia</option>
              <option value="Elettricità">⚡ Elettricità</option>
              <option value="Idraulica">💧 Idraulica</option>
              <option value="Giardinaggio">🌿 Giardinaggio</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Stato Oggetto</label>
            <select 
              onChange={(e) => setSearchCondition(e.target.value)} 
              className="p-5 bg-stone-50 rounded-3xl text-[11px] font-black uppercase tracking-widest outline-none border-none hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <option value="all">Tutte le Condizioni</option>
              <option value="Nuovo">✨ Solo Articoli Nuovi</option>
              <option value="Usato">♻️ Usato / Seconda Mano</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 pt-6">
            <button 
              onClick={handleNearbySearch}
              className={`p-5 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 ${distance > 0 ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-stone-900 text-white hover:bg-emerald-600'}`}
            >
              {distance > 0 ? '📍 Filtro 20km Attivo' : '📍 Cerca Vicino a me'}
            </button>
          </div>
        </section>

        {/* BOX DELLE MACRO-AZIONI (IMMAGINI NUOVO/USATO/REGALO) */}
        {!catFilter && !typeFilter && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
            {/* Card Vendi Nuovo */}
            <Link href="/add?mode=new" className="group relative h-96 rounded-[4.5rem] border border-stone-200 overflow-hidden bg-white hover:border-emerald-500 transition-all shadow-sm flex items-center justify-center text-center">
               <img src="/nuovo.png" className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:scale-110 transition-transform duration-[1.5s]" alt="Nuovo" />
               <div className="relative z-10 p-8">
                 <h3 className="text-5xl font-black uppercase italic text-stone-900 leading-tight">Vendi<br/>Nuovo</h3>
                 <p className="text-[11px] font-bold uppercase mt-6 text-stone-400 tracking-[0.2em] max-w-[200px] mx-auto">Ideale per fondi di magazzino o eccedenze</p>
               </div>
            </Link>

            {/* Card Vendi Usato */}
            <Link href="/add?mode=used" className="group relative h-96 rounded-[4.5rem] border border-stone-200 overflow-hidden bg-white hover:border-blue-500 transition-all shadow-sm flex items-center justify-center text-center">
               <img src="/usato.png" className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:scale-110 transition-transform duration-[1.5s]" alt="Usato" />
               <div className="relative z-10 p-8">
                 <h3 className="text-5xl font-black uppercase italic text-stone-900 leading-tight">Vendi<br/>Usato</h3>
                 <p className="text-[11px] font-bold uppercase mt-6 text-stone-400 tracking-[0.2em] max-w-[200px] mx-auto">Dai una seconda vita alla tua attrezzatura</p>
               </div>
            </Link>

            {/* Card Regala */}
            <Link href="/add?mode=gift" className="group relative h-96 rounded-[4.5rem] border-[6px] border-emerald-500 overflow-hidden bg-white hover:bg-emerald-50 transition-all shadow-2xl flex items-center justify-center text-center">
               <img src="/regala.jpeg" className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:scale-110 transition-transform duration-[1.5s]" alt="Regalo" />
               <div className="relative z-10 p-10">
                 <h3 className="text-4xl font-black uppercase italic text-emerald-900 leading-none mb-2">Regalo<br/>Solidale</h3>
                 <span className="text-6xl block my-4">🎁</span>
                 <p className="text-[11px] font-black uppercase mt-4 text-emerald-600 tracking-[0.3em] leading-relaxed">Aiuta la comunità,<br/>libera spazio subito</p>
               </div>
            </Link>
          </div>
        )}

        {/* SEZIONE: VETRINA TOP NUOVO (Griglia 5 colonne) */}
        <section className="mb-32">
          <div className="flex justify-between items-end mb-16 border-b-4 border-stone-100 pb-10">
            <div className="flex flex-col gap-2">
              <h2 className="text-[16px] font-black uppercase tracking-[0.7em] text-stone-900">Vetrina Top Nuovo</h2>
              <div className="w-20 h-2 bg-emerald-500 rounded-full"></div>
            </div>
            <Link href="/?condition=Nuovo" className="text-[12px] font-black uppercase text-emerald-600 hover:tracking-[0.2em] transition-all flex items-center gap-2">
              Sfoglia il catalogo completo <span className="text-xl">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-12">
            {topItems.map(item => (
              <div key={item.id} className="group bg-white p-6 rounded-[3.5rem] shadow-sm border border-stone-100 hover:shadow-2xl transition-all relative">
                {/* Cuoricino dei preferiti */}
                <button 
                  onClick={(e) => handleToggleFavorite(e, item.id)} 
                  className="absolute top-8 right-8 z-30 bg-white/95 w-14 h-14 flex items-center justify-center rounded-full shadow-xl text-xl hover:scale-125 active:scale-90 transition-all"
                >
                  {favorites.includes(item.id) ? '❤️' : '🤍'}
                </button>

                <Link href={`/announcement/${item.id}`}>
                  <div className="aspect-square rounded-[2.5rem] overflow-hidden bg-stone-50 mb-8 relative border-4 border-white shadow-inner">
                    <img src={item.image_url || "/nuovo.png"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[0.8s]" alt="Product" />
                    <div className="absolute bottom-4 left-4 bg-stone-900/90 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                      {item.condition}
                    </div>
                  </div>
                  <h4 className="text-[14px] font-bold uppercase truncate text-stone-900 mb-2 px-2 italic">{item.title}</h4>
                  <p className="text-3xl font-black text-emerald-600 px-2 tracking-tighter">€ {item.price}</p>
                  <button className="mt-8 w-full bg-stone-900 text-white text-[11px] font-black uppercase py-5 rounded-[2rem] group-hover:bg-emerald-500 transition-all shadow-lg active:translate-y-1">
                    Vedi Dettagli
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* SEZIONE: TUTTI I MATERIALI (Griglia 6 colonne) */}
        <section>
          <div className="flex justify-between items-end mb-16 border-b-4 border-stone-100 pb-10">
            <div className="flex flex-col gap-2">
              <h2 className="text-[16px] font-black uppercase tracking-[0.7em] text-stone-400">Tutti i Materiali</h2>
              <div className="w-12 h-1.5 bg-stone-200 rounded-full"></div>
            </div>
            <p className="text-[12px] font-black uppercase text-stone-300 tracking-[0.4em]">{regularItems.length} Inserzioni caricate</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {regularItems.map(item => (
              <div key={item.id} className="group bg-white rounded-[3rem] overflow-hidden border-2 border-stone-100 shadow-sm hover:border-emerald-400 transition-all flex flex-col h-full relative">
                {/* Cuoricino Mini */}
                <button 
                  onClick={(e) => handleToggleFavorite(e, item.id)} 
                  className="absolute top-4 right-4 z-30 bg-white/80 w-10 h-10 flex items-center justify-center rounded-full text-xs shadow-md hover:scale-110 transition-all"
                >
                  {favorites.includes(item.id) ? '❤️' : '🤍'}
                </button>

                <Link href={`/announcement/${item.id}`} className="flex flex-col h-full">
                  <div className="h-52 bg-stone-100 relative overflow-hidden">
                    <img src={item.image_url || "/usato.png"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1s]" alt="Product" />
                  </div>
                  <div className="p-7 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[13px] font-bold uppercase truncate text-stone-900 mb-2">{item.title}</h4>
                      <p className="text-xl font-black text-stone-900 tracking-tighter">
                        {item.type === 'offered' ? 'GRATIS 🎁' : `€ ${item.price}`}
                      </p>
                    </div>
                    <button className="mt-6 w-full bg-stone-50 text-stone-900 text-[10px] font-black uppercase py-4 rounded-2xl group-hover:bg-stone-900 group-hover:text-white transition-all">
                      Scopri
                    </button>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Fallback se non ci sono risultati */}
          {filteredData.length === 0 && !loading && (
            <div className="py-40 text-center flex flex-col items-center gap-6 opacity-40">
              <span className="text-8xl">🔎</span>
              <p className="text-lg font-black uppercase tracking-[0.5em]">Nessun materiale trovato</p>
              <button 
                onClick={() => {setMainSearch(''); setSearchCategory('all'); setSearchCondition('all');}} 
                className="text-xs font-bold underline uppercase tracking-widest"
              >
                Resetta i filtri
              </button>
            </div>
          )}
        </section>
      </main>

      {/* --------------------------------------------------------- */}
      {/* 4. MODALE STAFF (PANNELLO AMMINISTRATORE)               */}
      {/* --------------------------------------------------------- */}
      {isStaffOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-8 bg-stone-900/90 backdrop-blur-2xl transition-all">
          <div className="bg-white w-full max-w-2xl rounded-[5rem] p-16 shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative text-center border-[8px] border-emerald-500">
             <button 
               onClick={() => setIsStaffOpen(false)} 
               className="absolute top-12 right-12 text-stone-400 hover:text-stone-900 font-black text-3xl transition-colors"
             >
               ✕
             </button>
             
             <div className="text-9xl mb-10 drop-shadow-xl animate-bounce">👑</div>
             <h2 className="text-5xl font-black uppercase italic mb-4 tracking-tighter text-stone-900">Admin Control</h2>
             <p className="text-stone-400 font-bold uppercase text-[12px] tracking-[0.5em] mb-16 border-b border-stone-100 pb-8">
               Accesso Riservato • Gestione Totale Marketplace
             </p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link 
                  href="/staff/users" 
                  className="group p-8 bg-stone-50 rounded-[2.5rem] font-black uppercase text-[13px] border-2 border-stone-100 hover:bg-stone-900 hover:text-white transition-all flex flex-col items-center gap-3"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform">👥</span>
                  Database Utenti
                </Link>
                <Link 
                  href="/staff/annunci" 
                  className="group p-8 bg-stone-50 rounded-[2.5rem] font-black uppercase text-[13px] border-2 border-stone-100 hover:bg-stone-900 hover:text-white transition-all flex flex-col items-center gap-3"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform">📝</span>
                  Moderazione
                </Link>
                <Link 
                  href="/chat" 
                  className="md:col-span-2 group p-8 bg-emerald-500 text-white rounded-[2.5rem] font-black uppercase text-[13px] shadow-[0_20px_40px_rgba(16,185,129,0.4)] hover:bg-emerald-600 transition-all flex flex-col items-center gap-3"
                >
                  <span className="text-3xl group-hover:rotate-12 transition-transform">💬</span>
                  Chat Assistenza Piattaforma (Realtime)
                </Link>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * WRAPPER DI CARICAMENTO (Next.js Suspense)
 */
export default function HomePage() {
   return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-10">
          <div className="w-20 h-20 border-8 border-stone-200 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-[1em] text-stone-300 animate-pulse">
            Sincronizzazione Marketplace Materiali...
          </p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
   )
}