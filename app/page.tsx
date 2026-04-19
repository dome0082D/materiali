'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const SkeletonCard = () => (
  <div className="bg-stone-100 animate-pulse rounded-2xl h-[400px] w-full border border-stone-200"></div>
)

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(15)
  const [wishlist, setWishlist] = useState<string[]>([])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [searchBrand, setSearchBrand] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [category, setCategory] = useState('all')
  const [condition, setCondition] = useState('all')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const IS_STAFF = user?.email === 'dome0082@gmail.com';

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    let res = [...announcements];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      res = res.filter(a => String(a?.title || '').toLowerCase().includes(term) || String(a?.brand || '').toLowerCase().includes(term));
      const matches = new Set<string>();
      announcements.forEach(a => { if (a?.title?.toLowerCase().includes(term)) matches.add(a.title); });
      setSuggestions(Array.from(matches).slice(0, 5));
    } else setSuggestions([]);

    if (searchBrand) res = res.filter(a => String(a?.brand || '').toLowerCase().includes(searchBrand.toLowerCase()));
    if (activeType !== 'all') res = res.filter(a => a?.type === activeType);
    if (category !== 'all') res = res.filter(a => a?.category === category);
    if (condition !== 'all') res = res.filter(a => (a?.condition || 'Usato') === condition);
    if (maxPrice) res = res.filter(a => (Number(a?.price) || 0) <= parseFloat(maxPrice));

    if (sortBy === 'price_asc') res.sort((a, b) => (Number(a?.price) || 0) - (Number(b?.price) || 0));
    else if (sortBy === 'price_desc') res.sort((a, b) => (Number(b?.price) || 0) - (Number(a?.price) || 0));
    else res.sort((a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime());
    
    setFiltered(res);
  }, [searchTerm, searchBrand, activeType, category, condition, maxPrice, sortBy, announcements])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (data) { setAnnouncements(data); setFiltered(data); }
    if (u) {
      const { data: w } = await supabase.from('wishlist').select('announcement_id').eq('user_id', u.id)
      if (w) setWishlist(w.map((item: any) => item.announcement_id))
    }
    setLoading(false)
  }

  const toggleWishlist = async (annId: string) => {
    if (!user) return alert("Accedi per i preferiti!");
    if (wishlist.includes(annId)) {
      setWishlist(wishlist.filter(id => id !== annId));
      await supabase.from('wishlist').delete().match({ user_id: user.id, announcement_id: annId });
    } else {
      setWishlist([...wishlist, annId]);
      await supabase.from('wishlist').insert([{ user_id: user.id, announcement_id: annId }]);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 overflow-x-hidden">
      {IS_STAFF && (
        <>
          <button onClick={() => setIsStaffMenuOpen(true)} className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white w-14 h-14 rounded-full shadow-lg font-black text-xl hover:scale-110">👑</button>
          <div className={`fixed top-0 right-0 h-full w-80 bg-stone-900 z-[60] transform transition-transform duration-500 ease-out ${isStaffMenuOpen ? 'translate-x-0' : 'translate-x-full'} p-6 text-stone-100 shadow-2xl`}>
             <div className="flex justify-between border-b border-stone-800 pb-4 mb-8">
               <span className="font-bold uppercase tracking-widest text-xs tracking-tighter">Pannello Controllo</span>
               <button onClick={() => setIsStaffMenuOpen(false)}>✕</button>
             </div>
             <Link href="/staff/users" className="block p-4 bg-stone-800 rounded-lg font-bold hover:bg-emerald-600 mb-4 text-center uppercase text-[10px] tracking-widest">Lista Utenti</Link>
             <Link href="/chat" className="block p-4 bg-stone-800 rounded-lg font-bold hover:bg-emerald-600 text-center uppercase text-[10px] tracking-widest">Chat Globali</Link>
          </div>
          {isStaffMenuOpen && <div onClick={() => setIsStaffMenuOpen(false)} className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[55]"></div>}
        </>
      )}

      <main className="max-w-[1400px] mx-auto bg-white min-h-screen shadow-2xl flex flex-col">
        <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black italic uppercase text-stone-800 tracking-widest">MATERIALI</Link>
          <div className="flex gap-4 items-center">
            {user ? (
              <>
                <Link href="/chat" className="text-stone-600 hover:text-emerald-600 text-[11px] font-black uppercase p-2 bg-stone-100 rounded-md">💬 Chat</Link>
                <Link href="/profile" className="text-stone-600 hover:text-emerald-600 text-[11px] font-black uppercase p-2 bg-stone-100 rounded-md">👤 Profilo</Link>
                <Link href="/add" className="bg-emerald-600 text-white px-6 py-2.5 rounded-md text-[11px] font-black uppercase shadow-md hover:bg-emerald-700">+ Pubblica</Link>
              </>
            ) : (
              <Link href="/register" className="bg-stone-900 text-white px-8 py-3 rounded-md text-[11px] font-black uppercase shadow-md">Accedi</Link>
            )}
          </div>
        </nav>

        <div className="px-6 mt-6">
          <div className="relative h-[400px] rounded-3xl overflow-visible border shadow-lg z-30">
            <img src="/gazebo.jpg" alt="Hero" className="absolute inset-0 w-full h-full object-cover rounded-3xl" />
            <div className="absolute inset-0 bg-stone-900/60 flex flex-col items-center justify-center p-8 text-center rounded-3xl">
              <h1 className="text-4xl md:text-6xl font-black text-white mb-8 italic uppercase drop-shadow-lg tracking-tighter">Recupera, Regala, Vendi</h1>
              <div className="w-full max-w-2xl relative">
                <input type="text" value={searchTerm} placeholder="Cosa ti serve oggi?" className="w-full p-5 pl-14 rounded-2xl bg-white shadow-2xl outline-none text-lg" onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} />
                <span className="absolute left-5 top-5 text-2xl opacity-40">🔍</span>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border overflow-hidden text-left z-50">
                    {suggestions.map((s, i) => (
                      <div key={i} className="p-4 hover:bg-stone-50 cursor-pointer font-bold border-b last:border-0" onClick={() => { setSearchTerm(s); setShowSuggestions(false); }}>🔍 {s}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-6 mt-10 p-6 bg-stone-50 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" value={searchTerm} placeholder="Cerca parola..." className="p-3 bg-white border border-stone-200 rounded-lg text-sm font-bold outline-none" onChange={(e)=>setSearchTerm(e.target.value)} />
            <input type="text" value={searchBrand} placeholder="Filtra per Marca" className="p-3 bg-white border border-stone-200 rounded-lg text-sm font-bold outline-none" onChange={(e)=>setSearchBrand(e.target.value)} />
            <select value={category} onChange={(e)=>setCategory(e.target.value)} className="p-3 bg-white border border-stone-200 rounded-lg text-[11px] font-black uppercase outline-none text-stone-700">
              <option value="all">Tutte le Categorie</option><option value="Edilizia">Edilizia</option><option value="Elettricità">Elettricità</option><option value="Idraulica">Idraulica</option><option value="Attrezzi">Attrezzi</option><option value="Altro">Altro</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 pt-4 border-t border-stone-200">
            {['all', 'sell', 'offered', 'wanted'].map(f => (
              <button key={f} onClick={()=>setActiveType(f)} className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeType === f ? 'bg-stone-800 text-white shadow-md' : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-100'}`}>
                {f === 'all' ? 'Tutti' : f === 'sell' ? 'Vendi' : f === 'offered' ? 'Regala' : 'Cerco'}
              </button>
            ))}
            <div className="ml-auto flex gap-4">
              <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="p-2 bg-transparent text-[10px] font-black uppercase text-stone-500 outline-none">
                <option value="recent">🕒 Più Recenti</option><option value="price_asc">💶 Prezzo Min</option><option value="price_desc">💶 Prezzo Max</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-10 flex-grow pb-32">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {loading ? (
              Array(10).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              filtered.slice(0, visibleCount).map((ann) => (
                <div key={ann.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col group relative">
                  <button onClick={() => toggleWishlist(ann.id)} className="absolute top-2 left-2 z-20 bg-white/90 p-2 rounded-full shadow-md hover:scale-110">
                    {wishlist.includes(ann.id) ? '❤️' : '🤍'}
                  </button>
                  <Link href={`/announcement/${ann.id}`} className="block h-44 bg-stone-100 overflow-hidden">
                    <img src={ann.image_url || "/gazebo.jpg"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={ann.title} />
                  </Link>
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-black text-stone-900 uppercase truncate mb-1">{ann.title}</h4>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">{ann.brand} {ann.model}</p>
                      <p className="text-[9px] font-bold text-stone-400 uppercase mb-2">Quantità: {ann.quantity || 1}</p>
                    </div>
                    <div className="mt-5 pt-4 border-t flex justify-between items-center">
                      <span className="font-black text-stone-900 text-sm">€{ann.price}</span>
                      <Link href={`/announcement/${ann.id}`} className="bg-stone-100 text-stone-700 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-sm">Vedi</Link>
                    </div>
                  </div>
                  {IS_STAFF && <button onClick={async ()=>{if(confirm("Cancello?")){await supabase.from('announcements').delete().eq('id', ann.id); fetchData()}}} className="absolute top-10 left-2 z-20 bg-red-600 text-white px-2 py-1 rounded-md text-[8px] font-black shadow-lg">ELIMINA</button>}
                </div>
              ))
            )}
          </div>
          {visibleCount < filtered.length && !loading && (
            <div className="mt-12 text-center">
              <button onClick={() => setVisibleCount(v => v + 15)} className="bg-stone-900 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-stone-800 transition-all">Mostra altri annunci</button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
