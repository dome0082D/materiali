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
    // CONTENITORE ESTERNO (Sfondo grigio che crea l'effetto bordo)
    <div className="min-h-screen bg-slate-100 md:p-4 lg:p-6">
      
      {/* CORPO DEL SITO (Effetto "foglio" bianco centrato) */}
      <main className="bg-[#fafafa] max-w-[1600px] mx-auto md:rounded-3xl border-slate-200/60 md:border shadow-sm min-h-screen md:min-h-[calc(100vh-3rem)] overflow-hidden flex flex-col relative">
        
        {/* NAVBAR */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
          <div className="mx-auto flex justify-between items-center">
            {/* Logo compatto */}
            <Link href="/" className="text-xl font-serif text-slate-800 tracking-tight hover:opacity-70 transition">
              MATERIALI
            </Link>

            <div className="flex items-center gap-6">
              {user ? (
                <>
                  {/* Link al Profilo - Novità */}
                  <Link href="/profile" className="text-xs font-medium text-slate-500 hover:text-sky-500 transition-colors">
                    Il mio Profilo
                  </Link>
                  
                  <Link href="/add" className="hidden md:flex bg-slate-800 text-white px-5 py-2 rounded-full text-xs font-medium hover:bg-slate-700 transition-all shadow-sm items-center gap-2">
                    <span className="font-light">+</span> Pubblica
                  </Link>
                  
                  <button 
                    onClick={() => supabase.auth.signOut().then(() => window.location.reload())} 
                    className="text-slate-400 hover:text-red-400 text-[11px] font-medium transition-colors"
                  >
                    Esci
                  </button>
                </>
              ) : (
                <Link href="/register" className="bg-sky-500 text-white px-6 py-2 rounded-full text-xs font-medium hover:bg-sky-400 transition-all shadow-sm">
                  Accedi
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* HERO SECTION (Immagine professionale e ricerca) */}
        <div className="px-4 md:px-8 mt-6 w-full">
          <div className="relative h-[300px] md:h-[400px] rounded-[2.5rem] overflow-hidden shadow-sm group">
            <img 
              src="https://images.unsplash.com/photo-1503387762-5929c69d3978?q=80&w=1920&auto=format&fit=crop" 
              alt="Architettura moderna" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-slate-900/30 flex flex-col items-center justify-center text-center p-6">
              <h2 className="text-3xl md:text-5xl font-serif text-white mb-4 tracking-tight drop-shadow-sm">
                Costruisci con intelligenza.
              </h2>
              <p className="mb-8 text-sky-50/90 max-w-lg mx-auto text-sm md:text-base font-light">
                Recupera, regala o vendi materiali edili. Meno sprechi, più valore al tuo cantiere.
              </p>
              
              {/* Barra di ricerca delicata */}
              <div className="w-full max-w-lg relative">
                <input 
                  type="text" 
                  placeholder="Cerca legno, mattoni, attrezzi..." 
                  className="w-full p-4 pl-12 rounded-full text-slate-700 shadow-2xl outline-none focus:ring-2 focus:ring-sky-200 transition-all text-sm font-light border-none"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-5 top-4 opacity-40 text-lg">🔍</span>
              </div>
            </div>
          </div>
        </div>

        {/* GRIGLIA CONTENUTI */}
        <div className="px-4 md:px-10 py-12 flex-grow">
          
          {/* BOTTONI FILTRO PICCOLI */}
          <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
            <button 
              onClick={() => setActiveFilter('all')} 
              className={`px-5 py-2 rounded-full text-[11px] font-medium transition-all border ${activeFilter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
            >
              Tutti
            </button>
            <button 
              onClick={() => setActiveFilter('free')} 
              className={`px-5 py-2 rounded-full text-[11px] font-medium transition-all border ${activeFilter === 'free' ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
            >
              In regalo
            </button>
            <button 
              onClick={() => setActiveFilter('paid')} 
              className={`px-5 py-2 rounded-full text-[11px] font-medium transition-all border ${activeFilter === 'paid' ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
            >
              In vendita
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-slate-300"></div>
            </div>
          ) : filteredAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredAnnouncements.map((ann) => (
                <div key={ann.id} className="bg-white rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-slate-100 flex flex-col h-full group">
                  <div className="relative p-3">
                    <img 
                      src={ann.image_url || "https://images.unsplash.com/photo-1581094128547-138325033c5a?q=80&w=500"} 
                      alt={ann.title} 
                      className="w-full h-48 object-cover rounded-2xl" 
                    />
                    <div className="absolute top-6 left-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest shadow-sm backdrop-blur-md ${ann.price === 0 ? 'bg-teal-500/90 text-white' : 'bg-white/90 text-slate-700'}`}>
                        {ann.price === 0 ? 'GRATIS' : `€ ${ann.price}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-grow">
                    <h4 className="text-base font-serif text-slate-800 mb-2 truncate tracking-tight">{ann.title}</h4>
                    <p className="text-slate-400 text-xs mb-6 line-clamp-2 font-light leading-relaxed">
                      {ann.description || "Contatta l'inserzionista per maggiori dettagli su questo materiale."}
                    </p>
                    <div className="mt-auto">
                      <a 
                        href={`mailto:${ann.contact_email}?subject=Interessato a: ${ann.title}`}
                        className="block text-center w-full bg-slate-50 text-slate-600 py-2.5 rounded-xl text-[10px] font-semibold hover:bg-slate-800 hover:text-white transition-all"
                      >
                        CONTATTA
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm max-w-lg mx-auto px-6">
              <p className="text-slate-400 text-sm font-light">Nessun materiale disponibile in questa categoria.</p>
            </div>
          )}
        </div>

        {/* PULSANTE AGGIUNGI (Mobile) */}
        {user && (
          <Link href="/add" className="md:hidden fixed bottom-8 right-8 bg-slate-800 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-50">
            <span className="text-2xl font-light">+</span>
          </Link>
        )}

      </main>

      {/* FOOTER SEMPLICE */}
      <footer className="text-center py-8">
        <p className="text-[10px] text-slate-400 font-light tracking-widest uppercase">© 2026 Materiali Edili Hub</p>
      </footer>

    </div>
  )
}
