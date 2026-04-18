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
    <div className="min-h-screen bg-slate-100 md:p-2 lg:p-3">
      <main className="bg-[#fafafa] max-w-[1920px] mx-auto md:rounded-2xl border-slate-200/80 md:border shadow-sm min-h-screen md:min-h-[calc(100vh-1.5rem)] overflow-hidden flex flex-col relative">
        
        {/* NAVBAR */}
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4">
          <div className="mx-auto flex justify-between items-center px-2 md:px-4">
            <Link href="/" className="text-xl font-serif text-slate-800 tracking-tight hover:opacity-70 transition">
              MATERIALI
            </Link>
            <div className="flex items-center gap-5">
              {user ? (
                <>
                  <span className="hidden lg:block text-xs font-light text-slate-500">{user.email}</span>
                  <Link href="/add" className="hidden md:flex bg-slate-700 text-white px-5 py-2 rounded-full text-xs font-medium hover:bg-slate-600 transition-colors shadow-sm items-center gap-2">
                    <span className="font-light">+</span> Pubblica
                  </Link>
                  <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-slate-400 hover:text-red-400 px-2 py-2 text-xs font-medium transition-colors">Esci</button>
                </>
              ) : (
                <Link href="/register" className="bg-sky-500 text-white px-6 py-2 rounded-full text-xs font-medium hover:bg-sky-400 transition-colors shadow-sm">Accedi</Link>
              )}
            </div>
          </div>
        </nav>

        {/* HERO SECTION */}
        <div className="mx-auto px-4 md:px-6 mt-4 w-full">
          <div className="relative h-[300px] md:h-[450px] rounded-3xl overflow-hidden shadow-sm group">
            <img 
              src="https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=1920&auto=format&fit=crop" 
              alt="Architettura pulita" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center text-center p-6 backdrop-blur-[1px]">
              <h2 className="text-3xl md:text-5xl font-serif text-white mb-5 tracking-tight drop-shadow-md">
                Costruisci con intelligenza.
              </h2>
              <p className="mb-10 text-sky-50/90 max-w-xl mx-auto text-sm md:text-base font-light drop-shadow-sm">
                Recupera, regala o vendi materiali edili. Meno sprechi, più valore al tuo lavoro.
              </p>
              
              <div className="w-full max-w-xl relative">
                <input 
                  type="text" 
                  placeholder="Cerca cemento, legno, attrezzi..." 
                  className="w-full p-4 pl-14 rounded-full text-slate-700 shadow-xl outline-none focus:ring-1 focus:ring-sky-300 transition-all text-sm font-light border-none"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-6 top-4 text-slate-400 opacity-70">🔍</span>
              </div>
            </div>
          </div>
        </div>

        {/* GRIGLIA ANNUNCI */}
        <div className="mx-auto px-4 md:px-8 py-12 w-full flex-grow">
          
          {/* FILTRI */}
          <div className="flex gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setActiveFilter('all')} className={`px-6 py-2 rounded-full text-xs font-medium transition-all border ${activeFilter === 'all' ? 'bg-slate-700 text-white border-slate-700' : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Tutti</button>
            <button onClick={() => setActiveFilter('free')} className={`px-6 py-2 rounded-full text-xs font-medium transition-all border ${activeFilter === 'free' ? 'bg-teal-500/90 text-white border-teal-500/90' : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50'}`}>In regalo</button>
            <button onClick={() => setActiveFilter('paid')} className={`px-6 py-2 rounded-full text-xs font-medium transition-all border ${activeFilter === 'paid' ? 'bg-sky-500/90 text-white border-sky-500/90' : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50'}`}>In vendita</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-300"></div></div>
          ) : filteredAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredAnnouncements.map((ann) => (
                <div key={ann.id} className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-slate-100 flex flex-col h-full group">
                  <div className="relative p-2">
                    <img 
                      src={ann.image_url || "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=500&auto=format&fit=crop"} 
                      alt={ann.title} 
                      className="w-full h-56 object-cover rounded-xl transition-transform duration-700 group-hover:scale-[1.02]" 
                    />
                    <div className="absolute top-5 left-5">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-medium shadow-sm backdrop-blur-md ${ann.price === 0 ? 'bg-teal-500/90 text-white' : 'bg-white/90 text-slate-700'}`}>
                        {ann.price === 0 ? 'GRATIS' : `€ ${ann.price}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-grow">
                    <h4 className="text-lg font-serif text-slate-800 mb-2 truncate tracking-tight">{ann.title}</h4>
                    <p className="text-slate-400 text-sm mb-6 line-clamp-2 leading-relaxed font-light">{ann.description || "Nessuna descrizione."}</p>
                    <div className="mt-auto">
                      <a 
                        href={`mailto:${ann.contact_email}?subject=Interessato a: ${ann.title}`}
                        className="block text-center w-full bg-transparent text-slate-500 border border-slate-200 py-2.5 rounded-full text-xs font-medium hover:bg-slate-50 hover:text-slate-800 transition-all"
                      >
                        Invia email
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-lg mx-auto">
              <p className="text-slate-400 text-sm font-light">Nessun materiale trovato al momento.</p>
            </div>
          )}
        </div>

        {/* TASTO MOBILE */}
        {user && (
          <Link href="/add" className="md:hidden fixed bottom-6 right-6 bg-slate-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50">
            <span className="text-2xl font-light">+</span>
          </Link>
        )}
      </main>
    </div>
  )
}
