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
  const [maxPrice, setMaxPrice] = useState('')

  const IS_STAFF = user?.email === 'dome0082@gmail.com';

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    let results = announcements
    if (searchTerm) results = results.filter(ann => ann.title.toLowerCase().includes(searchTerm.toLowerCase()))
    if (activeType !== 'all') results = results.filter(ann => ann.type === activeType)
    if (category !== 'all') results = results.filter(ann => ann.category === category)
    if (maxPrice) results = results.filter(ann => ann.price <= parseFloat(maxPrice))
    setFilteredAnnouncements(results)
  }, [searchTerm, activeType, category, maxPrice, announcements])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (data) { setAnnouncements(data); setFilteredAnnouncements(data); }
    setLoading(false)
  }

  const deleteStaff = async (id: string) => {
    if(!confirm("AZIONE STAFF: Vuoi eliminare questo annuncio?")) return
    await supabase.from('announcements').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <main className="bg-white max-w-[1600px] mx-auto min-h-screen flex flex-col shadow-2xl border-x">
        
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b px-8 py-5 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black italic tracking-tighter uppercase text-slate-800">Materiali.</Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/chat" className="bg-slate-100 p-2.5 rounded-lg hover:bg-sky-100 transition-all font-black text-[10px]">💬 CHAT</Link>
                <Link href="/profile" className="text-[10px] font-black uppercase bg-slate-100 px-5 py-2.5 rounded-lg">Profilo</Link>
                <Link href="/add" className="bg-sky-600 text-white px-6 py-2.5 rounded-lg text-[10px] font-black uppercase">+ Pubblica</Link>
              </>
            ) : (
              <Link href="/register" className="bg-slate-800 text-white px-8 py-3 rounded-lg text-[10px] font-black uppercase">Accedi</Link>
            )}
          </div>
        </nav>

        <div className="px-6 mt-6">
          <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl border">
            <img src="/gazebo.jpg" alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 flex flex-col items-center justify-center p-8 text-center">
              <h1 className="text-4xl md:text-7xl font-black text-white mb-8 italic uppercase drop-shadow-2xl">Recupera, Regala, Vendi.</h1>
              <div className="w-full max-w-2xl relative">
                <input 
                  type="text" placeholder="Cerca materiali..." 
                  className="w-full p-5 pl-14 rounded-2xl bg-white shadow-2xl outline-none text-lg"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-5 top-5 text-2xl opacity-40">🔍</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-6 mt-10 p-6 bg-slate-100/50 rounded-2xl border flex flex-wrap gap-4 items-center">
          <div className="flex-grow">
            <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Categoria</label>
            <select onChange={(e)=>setCategory(e.target.value)} className="w-full p-3 bg-white border rounded-lg text-xs font-bold uppercase">
              <option value="all">Tutte</option>
              <option value="Edilizia">🧱 Edilizia</option>
              <option value="Elettricità">⚡ Elettricità</option>
              <option value="Attrezzi">🛠️ Attrezzi</option>
            </select>
          </div>
          <div className="w-40">
            <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Budget Max</label>
            <input type="number" placeholder="€" className="w-full p-3 bg-white border rounded-lg text-sm font-bold" onChange={(e)=>setMaxPrice(e.target.value)} />
          </div>
          <div className="flex gap-2 self-end">
            {['all', 'sell', 'offered', 'wanted'].map(f => (
              <button key={f} onClick={()=>setActiveType(f)} className={`px-5 py-3 rounded-lg text-[9px] font-black uppercase border transition-all ${activeType === f ? 'bg-slate-800 text-white' : 'bg-white text-slate-400'}`}>
                {f === 'all' ? 'Tutti' : f === 'sell' ? 'Vendi' : f === 'offered' ? 'Regala' : 'Cerco'}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-12 flex-grow">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {filteredAnnouncements.map((ann) => (
              <div key={ann.id} className="bg-white rounded-2xl shadow-sm border flex flex-col group hover:shadow-2xl transition-all relative overflow-hidden">
                {IS_STAFF && (
                  <button onClick={() => deleteStaff(ann.id)} className="absolute top-2 left-2 z-20 bg-red-600 text-white p-2 rounded-lg text-[8px] font-black shadow-lg">ELIMINA STAFF</button>
                )}
                <div className="h-44 relative bg-slate-50">
                  <img src={ann.image_url || "/gazebo.jpg"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <span className={`absolute top-2 right-2 px-2 py-1 rounded text-[8px] font-black text-white ${ann.type === 'wanted' ? 'bg-orange-500' : 'bg-indigo-600'}`}>
                    {ann.type?.toUpperCase()}
                  </span>
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase truncate mb-1">{ann.title}</h4>
                  <div className="mt-auto pt-3 border-t flex justify-between items-center">
                    <span className="font-black text-slate-900 text-sm italic">€{ann.price}</span>
                    <Link href={`/chat/${ann.user_id}?ann=${ann.id}`} className="bg-sky-50 text-sky-600 px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-sky-600 hover:text-white transition-all">Chat</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="p-10 border-t bg-slate-50 flex flex-col items-center gap-4">
          <div className="flex gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Link href="/privacy">Privacy</Link>
            <Link href="/privacy">Termini</Link>
          </div>
          <p className="text-[9px] text-slate-300 font-black uppercase">Amministratore Staff: dome0082@gmail.com</p>
        </footer>
      </main>
    </div>
  )
}