'use client'
import { useEffect, useState } from 'react'
import { supabase } from './../lib/supabase'
import Link from 'next/link'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [category, setCategory] = useState('all')
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false)

  const IS_STAFF = user?.email === 'dome0082@gmail.com';

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    let res = announcements
    if (searchTerm) res = res.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()))
    if (activeType !== 'all') res = res.filter(a => a.type === activeType)
    if (category !== 'all') res = res.filter(a => a.category === category)
    setFiltered(res)
  }, [searchTerm, activeType, category, announcements])

  const fetchData = async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (data) { setAnnouncements(data); setFiltered(data); }
    setLoading(false)
  }

  const deleteAd = async (id: string) => {
    if(!confirm("ELIMINA: Sei sicuro?")) return
    await supabase.from('announcements').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-emerald-200 overflow-x-hidden">
      
      {/* MENU STAFF FISSO A SCOMPARSA */}
      {IS_STAFF && (
        <>
          <button onClick={() => setIsStaffMenuOpen(true)} className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white w-12 h-12 rounded-full shadow-lg font-black text-lg hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-out flex items-center justify-center">👑</button>
          <div className={`fixed top-0 right-0 h-full w-80 bg-stone-900 z-[60] transform transition-transform duration-500 ease-out ${isStaffMenuOpen ? 'translate-x-0' : 'translate-x-full'} shadow-2xl p-6 text-stone-100`}>
            <div className="flex justify-between mb-8 border-b border-stone-800 pb-4 items-center">
              <span className="font-bold uppercase tracking-[0.2em] text-xs">Pannello Staff</span>
              <button onClick={() => setIsStaffMenuOpen(false)} className="text-stone-400 hover:text-white transition-colors">✕</button>
            </div>
            <div className="space-y-3">
              <Link href="/profile" className="block p-4 bg-stone-800 rounded-lg font-medium hover:bg-emerald-600 hover:text-white uppercase text-[10px] tracking-widest text-center transition-all duration-300">Gestione Utenti / Profili</Link>
              <Link href="/chat" className="block p-4 bg-stone-800 rounded-lg font-medium hover:bg-emerald-600 hover:text-white uppercase text-[10px] tracking-widest text-center transition-all duration-300">Spia Tutte le Chat</Link>
              <p className="text-[9px] text-stone-500 mt-10 uppercase tracking-widest">ID STAFF: USR-1</p>
            </div>
          </div>
          {isStaffMenuOpen && <div onClick={() => setIsStaffMenuOpen(false)} className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[55] animate-fade-in"></div>}
        </>
      )}

      <main className="max-w-[1400px] mx-auto bg-white min-h-screen shadow-2xl shadow-stone-200/50 relative">
        
        {/* NAVBAR SNELLA */}
        <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-stone-100 px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-medium tracking-[0.15em] uppercase text-stone-800">MATERIALI</Link>
          <div className="flex gap-3 items-center">
            {user ? (
              <>
                <Link href="/chat" className="text-stone-500 hover:text-emerald-600 text-[10px] font-bold uppercase tracking-widest transition-colors p-2">Chat</Link>
                <Link href="/profile" className="text-stone-500 hover:text-emerald-600 text-[10px] font-bold uppercase tracking-widest transition-colors p-2">Profilo</Link>
                <Link href="/add" className="bg-emerald-600 text-white px-5 py-2.5 rounded-md text-[10px] font-bold tracking-widest uppercase shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all duration-300">+ Pubblica</Link>
              </>
            ) : (
              <Link href="/register" className="bg-stone-900 text-white px-6 py-2.5 rounded-md text-[10px] font-bold tracking-widest uppercase hover:bg-stone-800 transition-all">Accedi</Link>
            )}
          </div>
        </nav>

        {/* HERO ELEGANTE */}
        <div className="px-6 mt-6HeroSection">
          <div className="relative h-[300px] rounded-2xl overflow-hidden group border border-stone-100 shadow-sm">
            <img src="/gazebo.jpg" className="absolute inset-0 w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-[10s] ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/40 to-transparent flex flex-col items-center justify-center p-8">
              <h1 className="text-3xl md:text-5xl font-light text-white mb-8 uppercase tracking-[0.1em] drop-shadow-md">Recupera. Regala. Vendi.</h1>
              <div className="w-full max-w-lg relative">
                <input type="text" placeholder="Cerca nel mercato edile..." className="w-full p-4 pl-12 rounded-lg bg-white/95 text-stone-800 shadow-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-sm" onChange={(e)=>setSearchTerm(e.target.value)} />
                <span className="absolute left-4 top-4 text-lg opacity-40">🔍</span>
              </div>
            </div>
          </div>
        </div>

        {/* DUE RIQUADRI PROMOZIONALI (REINSERITI E AGGIORNATI CON FOTO FORNITE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 mt-10">
          {/* Box Usato (Foto: image_10.png) */}
          <div className="relative h-[200px] md:h-[250px] rounded-2xl overflow-hidden group cursor-pointer border border-stone-100 hover:border-emerald-500 transition-all duration-300 shadow-xl shadow-stone-200/50">
            <img src="/image_10.png" alt="Mercatino Usato" className="absolute inset-0 w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-500 ease-out" />
            <div className="absolute inset-0 bg-stone-900/50 group-hover:bg-stone-900/60 transition-colors flex items-center justify-center p-6 text-center">
              <h3 className="text-xl md:text-2xl font-light text-white uppercase tracking-[0.1em] drop-shadow-lg italic">
                "Non buttare, magari ad un altro serve"
              </h3>
            </div>
          </div>
          
          {/* Box Nuovo (Foto: image_11.png) */}
          <div className="relative h-[200px] md:h-[250px] rounded-2xl overflow-hidden group cursor-pointer border border-stone-100 hover:border-emerald-500 transition-all duration-300 shadow-xl shadow-stone-200/50">
            <img src="/image_11.png" alt="Elettrodomestici Nuovi" className="absolute inset-0 w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-500 ease-out" />
            <div className="absolute inset-0 bg-stone-900/50 group-hover:bg-stone-900/60 transition-colors flex items-center justify-center p-6 text-center">
              <h3 className="text-xl md:text-2xl font-light text-white uppercase tracking-[0.1em] drop-shadow-lg italic">
                "È nuovo?, vendilo"
              </h3>
            </div>
          </div>
        </div>

        {/* FILTRI E CATALOGO (MANTENUTI ESISTENTI) */}
        {/* ... (resto del codice per filtri e catalogo, mantenendo lo stile snello e fluido) */}
        <div className="p-6 pb-20 mt-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 CatalogoSection">
          {filtered.map((ann) => (
            <div key={ann.id} className="bg-white border border-stone-100 rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out flex flex-col group relative">
              {IS_STAFF && <button onClick={()=>deleteAd(ann.id)} className="absolute top-2 left-2 z-20 bg-red-600/90 backdrop-blur-sm text-white px-2 py-1 rounded text-[8px] font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">ELIMINA STAFF</button>}
              <div className="h-36 bg-stone-100 relative overflow-hidden">
                <img src={ann.image_url || "/gazebo.jpg"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                <span className={`absolute top-2 right-2 px-2 py-1 text-[8px] font-bold tracking-widest rounded-sm text-white shadow-sm ${ann.type === 'wanted' ? 'bg-amber-500' : 'bg-emerald-600'}`}>{ann.type}</span>
              </div>
              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-tight line-clamp-1 mb-1">{ann.title}</h4>
                  <p className="text-[10px] text-stone-400 line-clamp-2 leading-relaxed">{ann.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-50 flex justify-between items-center">
                  <span className="font-medium text-stone-900 text-xs">€{ann.price}</span>
                  <Link href={`/chat/${ann.user_id}?ann=${ann.id}`} className="text-emerald-600 hover:text-emerald-700 text-[9px] font-bold uppercase tracking-widest transition-colors">Contatta →</Link>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center text-stone-400 text-xs font-bold uppercase tracking-widest">Nessun materiale trovato.</div>
          )}
        </div>
      </main>
    </div>
  )
}