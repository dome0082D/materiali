'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function HomePageContent() {
  const [user, setUser] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  
  // STATI PER FILTRI AVANZATI (Bordi snelli)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchCategory, setSearchCategory] = useState('all')
  const [condition, setCondition] = useState('all')
  
  // STATI PER POP-UP STAFF E AUTH
  const [isStaffOpen, setIsStaffOpen] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()

  const IS_STAFF = user?.email === 'dome0082@gmail.com';

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    // 1. Carica Utente
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)

    // 2. Carica Annunci (Memoria permanente)
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (data) setAnnouncements(data)
  }

  // LOGICA FILTRI IN TEMPO REALE
  const filteredAnnouncements = announcements.filter(a => {
    const matchSearch = String(a.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = searchCategory === 'all' || a.category === searchCategory;
    const matchCond = condition === 'all' || a.condition === condition;
    return matchSearch && matchCat && matchCond;
  });

  // VETRINA OGGETTI NUOVI (sotto i 3 riquadri)
  const showcaseNew = filteredAnnouncements.filter(a => a.condition === 'Nuovo').slice(0, 5);
  // FEED GENERALE
  const others = filteredAnnouncements.filter(a => showcaseNew.every(s => s.id !== a.id));

  // LOGICA LOGOUT (Nuovo)
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    fetchData(); // Ricarica lo stato
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 pb-20 selection:bg-emerald-50">
      
      {/* 👑 TASTO STAFF FLOAT (POP-UP) */}
      {IS_STAFF && (
        <button onClick={() => setIsStaffOpen(true)} className="fixed bottom-6 right-6 z-50 bg-stone-900 text-emerald-400 w-14 h-14 rounded-full shadow-lg font-black flex items-center justify-center border border-emerald-400 hover:scale-110 transition-all">👑</button>
      )}

      {/* ☀️ INTESTAZIONE SLIM "MATERIALI" CON IMMAGINE COMMUNITY BLENDED */}
      <div className="relative h-[220px] flex flex-col items-center justify-center p-6 text-center overflow-hidden border-b border-stone-100">
          <img src="/testata.png" className="absolute inset-0 w-full h-full object-cover opacity-20 blended-header" alt="Materiali Community" />
          <div className="relative z-10 w-full max-w-lg">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter blended-title text-stone-800">Materiali</h1>
            
            {/* BARRA DI RICERCA CENTRALIZZATA */}
            <div className="mt-6 w-full relative">
              <input type="text" placeholder="Cerca materiale..." className="w-full p-4 pl-12 rounded-2xl bg-white border border-stone-200 outline-none text-sm focus:border-emerald-500 transition-all shadow-sm" onChange={(e)=>setSearchTerm(e.target.value)} value={searchTerm} />
              <span className="absolute left-4 top-4 opacity-30 text-lg">🔍</span>
            </div>

            {/* LOGIN/LOGOUT (visibile se non staff) */}
            <div className="mt-4 text-[9px] font-black uppercase flex justify-center gap-4 text-stone-500">
               {user ? (
                 <button onClick={handleLogout} className="hover:text-red-500">Esci Sessione</button>
               ) : (
                 <Link href="/login" className="hover:text-emerald-600">Accedi con Email Verificata</Link>
               )}
            </div>
          </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* 🔍 BARRA FILTRI AVANZATI (Design Esatto) */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="text" value={searchTerm} placeholder="Cerca parola chiave..." className="p-4 bg-white border border-stone-200 rounded-xl text-xs font-bold outline-none focus:border-stone-400" onChange={(e)=>setSearchTerm(e.target.value)} />
          <select value={searchCategory} onChange={(e)=>setSearchCategory(e.target.value)} className="p-4 bg-white border border-stone-200 rounded-xl text-[9px] font-black uppercase outline-none cursor-pointer">
            <option value="all">Tutte le Categorie</option>
            <option value="Casa">Casa</option><option value="Elettronica">Elettronica</option><option value="Libri">Libri</option><option value="Sport">Sport</option><option value="Altro">Altro</option>
          </select>
          <select value={condition} onChange={(e)=>setCondition(e.target.value)} className="p-4 bg-white border border-stone-200 rounded-xl text-[9px] font-black uppercase outline-none cursor-pointer">
            <option value="all">Tutte le Condizioni</option>
            <option value="Nuovo">Solo Nuovo</option>
            <option value="Usato">Usato / Regalo</option>
          </select>
        </section>

        {/* 🔘 I 3 RIQUADRI (Bordi Snelli, Mantenuti, con le tue Immagini) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* VENDI NUOVO */}
          <Link href="/add?mode=new" className="group relative h-48 rounded-2xl border border-stone-200 overflow-hidden bg-white hover:border-stone-400 transition-all shadow-sm flex items-center">
             <img src="/nuovo.png" className="absolute right-0 bottom-0 w-1/2 h-full object-cover opacity-10 group-hover:opacity-30 transition-all duration-700 blended-box" />
             <div className="relative p-8 h-full flex flex-col justify-center">
                <h3 className="text-xl font-black uppercase italic leading-none text-stone-900 blended-title">Vendi Nuovo</h3>
                <p className="text-[10px] font-bold text-stone-400 uppercase mt-2 tracking-widest blended-subtitle">Mai aperto</p>
             </div>
          </Link>

          {/* VENDI USATO */}
          <Link href="/add?mode=used" className="group relative h-48 rounded-2xl border border-stone-200 overflow-hidden bg-white hover:border-stone-400 transition-all shadow-sm flex items-center">
             <img src="/usato.png" className="absolute right-0 bottom-0 w-1/2 h-full object-cover opacity-10 group-hover:opacity-30 transition-all duration-700 blended-box" />
             <div className="relative p-8 h-full flex flex-col justify-center">
                <h3 className="text-xl font-black uppercase italic leading-none text-stone-900 blended-title">Vendi Usato</h3>
                <p className="text-[10px] font-bold text-stone-400 uppercase mt-2 tracking-widest blended-subtitle">Dai valore</p>
             </div>
          </Link>

          {/* REGALALO (LA TUA FILOSOFIA - Bordi Emerald) */}
          <Link href="/add?mode=gift" className="group relative h-48 rounded-2xl border-2 border-emerald-500 overflow-hidden bg-white hover:bg-emerald-50 transition-all shadow-md flex items-center">
             <img src="/regalo.png" className="absolute right-0 bottom-0 w-1/2 h-full object-cover opacity-20 group-hover:opacity-40 transition-all duration-700 blended-box" />
             <div className="relative p-8 h-full flex flex-col justify-center">
                <h3 className="text-lg font-black uppercase italic leading-tight text-emerald-800 blended-title">Non sai cosa fartene e non vuoi i soldi? Regalalo</h3>
             </div>
          </Link>

        </div>

        {/* ✨ VETRINA OGGETTI NUOVI (Card Slim) */}
        {showcaseNew.length > 0 && (
          <section className="mt-16">
            <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 mb-6 border-b border-stone-200 pb-2">Vetrina Nuovo</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
              {showcaseNew.map(ann => (
                <Link href={`/announcement/${ann.id}`} key={ann.id} className="group bg-white p-2 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md hover:border-emerald-500 transition-all">
                  <div className="aspect-square rounded-xl overflow-hidden bg-stone-50 border border-stone-100 mb-2">
                    <img src={ann.image_url || "/nuovo.png"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase truncate px-1 text-stone-800 blended-subtitle">{ann.title}</h4>
                  <p className="text-emerald-600 font-black text-[11px] mt-1 px-1Blended blended-subtitle">€ {ann.price}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ♻️ FEED GENERALE (TUTTO IL RESTO) - GRIGLIA FITTA */}
        <section className="mt-12">
          <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 mb-6 border-b border-stone-200 pb-2">Tutti gli Oggetti</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {others.map(ann => (
              <Link href={`/announcement/${ann.id}`} key={ann.id} className="bg-white rounded-xl overflow-hidden border border-stone-100 hover:border-emerald-200 transition-all group flex flex-col">
                <div className="h-28 bg-stone-50 overflow-hidden relative border-b border-stone-100">
                  <img src={ann.image_url || "/usato.png"} className="w-full h-full object-cover blended-box" />
                  {ann.type === 'offered' && <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase shadow-lg blended-title">Regalo</span>}
                </div>
                <div className="p-2 flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="text-[9px] font-bold uppercase truncate text-stone-700 blended-subtitle">{ann.title}</h4>
                    <p className="text-[10px] font-black mt-1 blended-title">{ann.type === 'offered' ? 'GRATIS' : `€ ${ann.price}`}</p>
                  </div>
                  {/* MODERAZIONE STAFF SULLA CARD */}
                  {IS_STAFF && <button onClick={async (e)=>{e.preventDefault(); if(confirm("Eliminare definitivamente dal DB?")){await supabase.from('announcements').delete().eq('id', ann.id); fetchData()}}} className="mt-2 text-[7px] font-black text-red-500 uppercase bg-red-50 px-2 py-1.5 rounded w-full hover:bg-red-500 hover:text-white transition-colors text-center border border-red-100">Staff: Elimina</button>}
                </div>
              </Link>
            ))}
            {others.length === 0 && <p className="text-xs font-bold text-stone-300 uppercase col-span-full py-16 text-center">Nessun oggetto trovato.</p>}
          </div>
        </section>
      </main>

      {/* 🛡️ STAFF POP-UP (MODAL CENTRALIZZATO - NESSUN CAMBIO PAGINA) */}
      {isStaffOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative border border-stone-100 text-center space-y-3">
             <button onClick={() => setIsStaffOpen(false)} className="absolute top-6 right-6 text-stone-300 font-black hover:text-stone-900">✕</button>
             <h2 className="text-xl font-black uppercase italic mb-8 border-b pb-4 text-stone-800 blended-title">Area Staff</h2>
             <div className="space-y-3">
                <Link href="/staff/users" className="block w-full p-4 bg-stone-50 rounded-2xl font-black uppercase text-[10px] border border-stone-100 hover:bg-stone-900 hover:text-white transition-all text-stone-700 blended-subtitle">👥 Gestione Profili</Link>
                <Link href="/chat" className="block w-full p-4 bg-stone-50 rounded-2xl font-black uppercase text-[10px] border border-stone-100 hover:bg-stone-900 hover:text-white transition-all text-stone-700 blended-subtitle">💬 Monitoraggio Chat</Link>
             </div>
          </div>
        </div>
      )}
      
      {/* CSS LOCALE PER FEDELTÀ ALL'IMMAGINE (Fonts e stili slim) */}
      <style jsx global>{`
         .blended-header { mix-blend-mode: overlay; filter: grayscale(100%); opacity: 0.15; }
         .blended-title { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; font-style: italic; text-shadow: 0 1px 1px rgba(0,0,0,0.1); }
         .blended-subtitle { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-weight: 800; }
         .blended-box { filter: contrast(110%) brightness(105%); }
      `}</style>
    </div>
  )
}

// PROTEZIONE SUSPENSE PER VERCEL (Anti-errore)
export default function HomePage() {
   return <Suspense fallback={<div className="p-10 font-black uppercase text-xs text-center">Apertura Cantiere Materiali...</div>}><HomePageContent /></Suspense>
}
