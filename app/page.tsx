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
  const [activeType, setActiveType] = useState('all')
  const [category, setCategory] = useState('all')
  
  // STAFF STATES
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false)
  const IS_STAFF = user?.email === 'dome0082@gmail.com';

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    let results = announcements
    if (searchTerm) results = results.filter(ann => ann.title.toLowerCase().includes(searchTerm.toLowerCase()))
    if (activeType !== 'all') results = results.filter(ann => ann.type === activeType)
    if (category !== 'all') results = results.filter(ann => ann.category === category)
    setFilteredAnnouncements(results)
  }, [searchTerm, activeType, category, announcements])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (data) { setAnnouncements(data); setFilteredAnnouncements(data); }
    setLoading(false)
  }

  const deleteStaff = async (id: string) => {
    if(!confirm("STAFF: Vuoi eliminare questo annuncio di un utente?")) return
    await supabase.from('announcements').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      
      {/* MENU FISSO A SCOMPARSA (SOLO PER STAFF) */}
      {IS_STAFF && (
        <>
          <button onClick={() => setIsStaffMenuOpen(true)} className="fixed bottom-6 right-6 z-50 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:bg-red-700 hover:scale-110 transition-all font-black text-2xl">
            👑
          </button>
          
          <div className={`fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-700 shadow-2xl z-[60] transform transition-transform duration-500 ease-in-out ${isStaffMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 flex justify-between items-center border-b border-slate-700">
              <h2 className="text-white font-black uppercase tracking-widest text-lg">Menu Staff</h2>
              <button onClick={() => setIsStaffMenuOpen(false)} className="text-slate-400 hover:text-white text-2xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-6">Pannello Amministratore</p>
              <Link href="/profile" className="block w-full bg-slate-800 text-white p-4 rounded-lg text-[11px] font-black uppercase text-center hover:bg-red-600 transition-colors">🗑️ Gestione Utenti</Link>
              <Link href="/chat" className="block w-full bg-slate-800 text-white p-4 rounded-lg text-[11px] font-black uppercase text-center hover:bg-red-600 transition-colors">👁️ Spia Tutte le Chat</Link>
              <div className="pt-6 border-t border-slate-800">
                <p className="text-xs text-slate-400 font-bold">Puoi eliminare qualsiasi annuncio cliccando sul tasto rosso direttamente sulle foto nella Home.</p>
              </div>
            </div>
          </div>
          {/* Overlay scuro quando il menu è aperto */}
          {isStaffMenuOpen && <div onClick={() => setIsStaffMenuOpen(false)} className="fixed inset-0 bg-black/50 z-[55] backdrop-blur-sm transition-opacity"></div>}
        </>
      )}

      <main className="bg-white max-w-[1600px] mx-auto min-h-screen flex flex-col shadow-2xl border-x relative">
        <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b px-8 py-5 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black italic tracking-tighter uppercase text-slate-800">MATERIALI</Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/chat" className="bg-slate-100 p-2.5 rounded-lg hover:bg-sky-100 font-black text-[10px]">💬 CHAT</Link>
                <Link href="/profile" className="text-[10px] font-black uppercase bg-slate-100 px-5 py-2.5 rounded-lg">Profilo</Link>
                <Link href="/add" className="bg-sky-600 text-white px-6 py-2.5 rounded-lg text-[10px] font-black uppercase shadow-lg hover:bg-sky-500">+ Pubblica</Link>
              </>
            ) : (
              <Link href="/register" className="bg-slate-800 text-white px-8 py-3 rounded-lg text-[10px] font-black uppercase">Accedi</Link>
            )}
          </div>
        </nav>

        <div className="px-6 mt-6">
          <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
            <img src="/gazebo.jpg" alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 flex flex-col items-center justify-center p-8 text-center">
              <h1 className="text-4xl md:text-7xl font-black text-white mb-8 italic uppercase drop-shadow-2xl">Recupera, Regala, Vendi.</h1>
              <div className="w-full max-w-2xl relative">
                <input type="text" placeholder="Cerca materiali..." className="w-full p-5 pl-14 rounded-2xl bg-white shadow-2xl outline-none text-lg" onChange={(e) => setSearchTerm(e.target.value)} />
                <span className="absolute left-5 top-5 text-2xl opacity-40">🔍</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-12 flex-grow">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {filteredAnnouncements.map((ann) => (
              <div key={ann.id} className="bg-white rounded-2xl shadow-sm border flex flex-col group relative overflow-hidden">
                {IS_STAFF && (
                  <button onClick={() => deleteStaff(ann.id)} className="absolute top-2 left-2 z-20 bg-red-600 text-white p-2 rounded-lg text-[8px] font-black shadow-lg hover:scale-105">ELIMINA (STAFF)</button>
                )}
                <div className="h-44 relative bg-slate-50">
                  <img src={ann.image_url || "/gazebo.jpg"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <span className="absolute top-2 right-2 px-2 py-1 rounded text-[8px] font-black text-white bg-indigo-600">{ann.type?.toUpperCase()}</span>
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase truncate mb-1">{ann.title}</h4>
                  <div className="mt-auto pt-3 border-t flex justify-between items-center">
                    <span className="font-black text-slate-900 text-sm">€{ann.price}</span>
                    <Link href={`/chat/${ann.user_id}?ann=${ann.id}`} className="bg-sky-50 text-sky-600 px-4 py-2 rounded-lg text-[9px] font-black uppercase">Chat</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
