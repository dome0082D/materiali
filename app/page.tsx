'use client'
import { useEffect, useState } from 'react'
import { supabase } from './../lib/supabase'
import Link from 'next/link'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let results = announcements
    if (searchTerm) {
      results = results.filter(ann => 
        ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ann.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (activeFilter === 'free') results = results.filter(ann => ann.price === 0)
    else if (activeFilter === 'paid') results = results.filter(ann => ann.price > 0)
    setFilteredAnnouncements(results)
  }, [searchTerm, activeFilter, announcements])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) {
      setAnnouncements(data)
      setFilteredAnnouncements(data)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-3 md:p-6 font-sans">
      
      {/* CONTENITORE PRINCIPALE EFFETTO 3D SOLLEVATO */}
      <main className="bg-white max-w-[1400px] mx-auto rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-white/20 min-h-screen overflow-hidden flex flex-col relative">
        
        {/* NAVBAR */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-5">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-serif text-slate-800 tracking-tighter font-black hover:scale-105 transition-transform">
              MATERIALI
            </Link>

            <div className="flex items-center gap-5">
              {user ? (
                <>
                  <Link href="/profile" className="text-xs font-bold text-slate-500 hover:text-sky-500 transition-colors uppercase tracking-widest">
                    Profilo
                  </Link>
                  <Link href="/add" className="bg-slate-800 text-white px-6 py-2.5 rounded-2xl text-xs font-black hover:shadow-xl active:scale-95 transition-all shadow-md tracking-widest">
                    + PUBBLICA
                  </Link>
                  <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </button>
                </>
              ) : (
                <Link href="/register" className="bg-sky-500 text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-sky-400 shadow-[0_10px_25px_rgba(14,165,233,0.4)] transition-all active:scale-95 tracking-widest">
                  ACCEDI
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* HERO SECTION CON TUA FOTO E TESTO RICHIESTO */}
        <div className="px-6 md:px-10 mt-8">
          <div className="relative h-[380px] md:h-[500px] rounded-[3.5rem] overflow-hidden shadow-2xl group border-[6px] border-white">
            <img 
              src="/cantiere.jpg" 
              alt="Cantiere Edile" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-8">
              
              {/* Il tuo testo modificato */}
              <p className="text-3xl md:text-5xl font-serif text-white max-w-4xl mx-auto drop-shadow-[0_8px_8px_rgba(0,0,0,0.6)] font-bold italic leading-tight tracking-tight">
                Recupera, regala o vendi. <br className="hidden md:block" /> Il valore non si butta mai.
              </p>
              
              {/* Barra di ricerca 3D */}
              <div className="w-full max-w-xl mt-12 relative group/search">
                <input 
                  type="text" 
                  placeholder="Cerca materiali..." 
                  className="w-full p-6 pl-16 rounded-[2.5rem] text-slate-800 shadow-[0_25px_50px_rgba(0,0,0,0.3)] outline-none focus:ring-4 focus:ring-sky-400/30 transition-all text-lg font-medium border-none"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-6 top-5 text-3xl transition-transform group-focus-within/search:scale-110">🔍</span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENUTO PRINCIPALE */}
        <div className="px-6 md:px-14 py-16 flex-grow">
          
          {/* FILTRI STILE PILLOLA 3D */}
          <div className="flex gap-4 mb-14 overflow-x-auto pb-4 scrollbar-hide">
            {['all', 'free', 'paid'].map((f) => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)} 
                className={`px-10 py-3.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-md border ${
                  activeFilter === f 
                  ? 'bg-slate-800 text-white border-slate-800 shadow-[0_10px_20px_rgba(0,0,0,0.2)] -translate-y-1' 
                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600 hover:-translate-y-0.5'
                }`}
              >
                {f === 'all' ? 'Tutti' : f === 'free' ? 'In Regalo' : 'In Vendita'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-bounce text-5xl">🏗️</div></div>
          ) : filteredAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
              {filteredAnnouncements.map((ann) => (
                <div key={ann.id} className="bg-white rounded-[3rem] p-5 shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:-translate-y-4 transition-all duration-500 border border-slate-50 flex flex-col group">
                  
                  {/* Foto Card */}
                  <div className="relative mb-6 overflow-hidden rounded-[2.2rem] h-60 shadow-inner">
                    <img 
                      src={ann.image_url || "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=500"} 
                      alt={ann.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute bottom-5 left-5">
                      <span className={`px-6 py-2.5 rounded-2xl text-[11px] font-black tracking-widest shadow-xl backdrop-blur-md ${ann.price === 0 ? 'bg-teal-500 text-white' : 'bg-white text-slate-800'}`}>
                        {ann.price === 0 ? 'GRATIS' : `€ ${ann.price}`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Testo Card */}
                  <div className="px-3 pb-4 flex flex-col flex-grow">
                    <h4 className="text-2xl font-serif text-slate-800 mb-3 truncate font-bold tracking-tighter">{ann.title}</h4>
                    <p className="text-slate-400 text-xs mb-8 line-clamp-2 font-semibold leading-relaxed uppercase tracking-wider opacity-70">
                      {ann.description || "Materiale disponibile per il ritiro immediato."}
                    </p>
                    
                    <div className="mt-auto">
                      <a 
                        href={`mailto:${ann.contact_email}?subject=Interessato: ${ann.title}`}
                        className="block text-center w-full bg-slate-50 text-slate-700 py-4.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-sky-500 hover:text-white hover:shadow-[0_15px_30px_rgba(14,165,233,0.4)] hover:-translate-y-1 transition-all"
                      >
                        Invia Richiesta
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200">
              <p className="text-slate-300 text-sm font-black uppercase tracking-[0.3em] italic">Cantiere vuoto... prova altro!</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="mt-auto py-12 border-t border-slate-50 text-center">
          <p className="text-[10px] text-slate-300 font-black tracking-[0.5em] uppercase">© 2026 MATERIALI EDILI • ECO-BUILDING HUB</p>
        </footer>

      </main>
    </div>
  )
}
