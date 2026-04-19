'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isStaffOpen, setIsStaffOpen] = useState(false)

  const IS_STAFF = user?.email === 'dome0082@gmail.com';

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (data) setAnnouncements(data)
  }

  const showcaseNew = announcements.filter(a => a.condition === 'Nuovo').slice(0, 5);
  const others = announcements.filter(a => showcaseNew.every(s => s.id !== a.id));

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 pb-20">
      
      {/* 👑 ADMIN BUTTON */}
      {IS_STAFF && (
        <button onClick={() => setIsStaffOpen(true)} className="fixed bottom-6 right-6 z-50 bg-stone-900 text-emerald-400 w-14 h-14 rounded-full shadow-2xl font-black flex items-center justify-center border-2 border-emerald-400 hover:scale-110 transition-all">👑</button>
      )}

      {/* 🌤️ HERO SLIM */}
      <div className="bg-white border-b flex flex-col items-center justify-center p-8 text-center shadow-sm">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-stone-800">Seconda Vita</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600 mt-2">Niente si butta, tutto si recupera</p>
          <div className="mt-6 w-full max-w-lg relative">
            <input type="text" placeholder="Cosa cerchi oggi?" className="w-full p-4 pl-12 rounded-2xl bg-stone-50 border border-stone-200 outline-none text-sm focus:border-emerald-500 transition-all" onChange={(e)=>setSearchTerm(e.target.value)} />
            <span className="absolute left-4 top-4 opacity-30 text-lg">🔍</span>
          </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* 🔘 I 3 RIQUADRI PROTAGONISTI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/add?mode=new" className="bg-white p-6 rounded-[2rem] shadow-md border border-stone-100 hover:-translate-y-1 transition-all group">
            <h3 className="text-lg font-black uppercase italic text-stone-800 group-hover:text-emerald-600 transition-colors">Vendi Nuovo</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase mt-1 tracking-widest">Mai aperto, mai usato</p>
          </Link>
          <Link href="/add?mode=used" className="bg-stone-800 p-6 rounded-[2rem] shadow-md hover:-translate-y-1 transition-all">
            <h3 className="text-lg font-black uppercase italic text-white">Vendi Usato</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase mt-1 tracking-widest">Dai valore a ciò che hai</p>
          </Link>
          <Link href="/add?mode=gift" className="bg-emerald-600 p-6 rounded-[2rem] shadow-md hover:-translate-y-1 transition-all">
            <h3 className="text-lg font-black uppercase italic text-white leading-tight">Non sai cosa fartene e non vuoi i soldi?<br/>Regalalo</h3>
          </Link>
        </div>

        {/* ✨ VETRINA NUOVO */}
        <section className="mt-12 bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-6 border-b pb-2">Vetrina Oggetti Nuovi</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {showcaseNew.map(ann => (
              <Link href={`/announcement/${ann.id}`} key={ann.id} className="group">
                <div className="aspect-square rounded-2xl overflow-hidden bg-stone-50 mb-2">
                  <img src={ann.image_url || "/placeholder.jpg"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <h4 className="text-[10px] font-bold uppercase truncate">{ann.title}</h4>
                <p className="text-emerald-600 font-black text-[11px] mt-1">€ {ann.price}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ♻️ FEED GENERALE (TUTTO IL RESTO) */}
        <section className="mt-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-4 ml-2">Feed Recupero & Usato</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {others.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase())).map(ann => (
              <Link href={`/announcement/${ann.id}`} key={ann.id} className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md transition-all group">
                <div className="h-28 bg-stone-50 overflow-hidden relative">
                  <img src={ann.image_url || "/placeholder.jpg"} className="w-full h-full object-cover" />
                  {ann.type === 'offered' && <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase">Regalo</span>}
                </div>
                <div className="p-3">
                  <h4 className="text-[9px] font-bold uppercase truncate text-stone-700">{ann.title}</h4>
                  <p className="text-[10px] font-black mt-1">{ann.type === 'offered' ? 'GRATIS' : `€ ${ann.price}`}</p>
                  {IS_STAFF && <button onClick={async (e)=>{e.preventDefault(); if(confirm("Eliminare?")){await supabase.from('announcements').delete().eq('id', ann.id); fetchData()}}} className="mt-2 text-[7px] font-black text-red-500 uppercase bg-red-50 px-2 py-1 rounded w-full">Staff: Elimina</button>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* 🖥️ STAFF DASHBOARD (POP-UP) */}
      {isStaffOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative">
             <button onClick={() => setIsStaffOpen(false)} className="absolute top-6 right-6 text-stone-300 font-black">✕</button>
             <h2 className="text-xl font-black uppercase italic mb-6">Staff Command</h2>
             <div className="space-y-3">
                <Link href="/staff/users" className="block w-full p-4 bg-stone-50 rounded-xl font-black uppercase text-[10px] text-center border hover:bg-stone-900 hover:text-white transition-all">👥 Gestione Utenti</Link>
                <Link href="/chat" className="block w-full p-4 bg-stone-50 rounded-xl font-black uppercase text-[10px] text-center border hover:bg-stone-900 hover:text-white transition-all">💬 Monitoraggio Chat</Link>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
