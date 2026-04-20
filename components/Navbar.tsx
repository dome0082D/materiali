'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Funzioni dal tuo store globale
  const { items, isCartOpen, openCart, closeCart, removeItem } = useCartStore()
  const total = items.reduce((acc, i) => acc + (Number(i.price) * i.quantity), 0)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: cats } = await supabase.from('categories').select('*').order('name')
      setCategories(cats || [])
    }
    getData()
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null))
    return () => authListener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleCheckout = async () => {
    if (!user) { alert("Accedi per acquistare"); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, buyerId: user.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { alert("Errore checkout"); setLoading(false); }
    } catch { setLoading(false); }
  };

  return (
    <>
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-[100] shadow-sm flex justify-between items-center h-20 px-6">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsSidebarOpen(true)} className="text-3xl p-2 hover:bg-stone-50 rounded-2xl transition-all">☰</button>
          <Link href="/" className="text-3xl font-black uppercase italic tracking-tighter text-stone-900">Materiali</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/add" className="hidden md:block bg-emerald-500 text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md">➕ Pubblica Annuncio</Link>
          <button onClick={openCart} className="relative text-3xl p-3 hover:bg-stone-50 rounded-2xl transition-all">
            🛒 {items.length > 0 && <span className="absolute top-1 right-1 bg-emerald-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-black border-2 border-white shadow-sm">{items.length}</span>}
          </button>
        </div>
      </nav>

      {/* SIDEBAR SINISTRA: AREA UTENTE COMPLETA + CATEGORIE */}
      <div className={`fixed top-0 left-0 h-full w-full max-w-[350px] bg-white z-[120] shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 bg-stone-900 text-white">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-xl font-black italic">
                {user?.email ? user.email[0].toUpperCase() : 'M'}
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="text-stone-400 hover:text-white text-2xl">✕</button>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Account Marketplace</p>
            <p className="font-bold truncate text-sm">{user?.email || 'Benvenuto, Ospite'}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            <section>
              <h3 className="text-[10px] font-black uppercase text-stone-400 mb-6 tracking-widest border-b pb-2">Il mio Menu</h3>
              <div className="grid gap-2">
                <Link href="/profile" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-4 p-3 text-sm font-bold text-stone-800 hover:bg-stone-50 rounded-2xl">👤 Profilo e Modifica</Link>
                <Link href="/dashboard/annunci" onClick={() => setIsSidebarOpen(false)} className="p-3 text-sm font-bold text-stone-800 hover:bg-stone-50 rounded-2xl">📝 I miei Annunci</Link>
                <Link href="/dashboard/acquisti" onClick={() => setIsSidebarOpen(false)} className="p-3 text-sm font-bold text-stone-800 hover:bg-stone-50 rounded-2xl">📦 Ordini ed Escrow</Link>
                <Link href="/chat" onClick={() => setIsSidebarOpen(false)} className="p-3 text-sm font-bold text-stone-800 hover:bg-stone-50 rounded-2xl flex justify-between">💬 Messaggi <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black">NEW</span></Link>
                <Link href="/dashboard/preferiti" onClick={() => setIsSidebarOpen(false)} className="p-3 text-sm font-bold text-stone-800 hover:bg-stone-50 rounded-2xl">❤️ Preferiti</Link>
                {user && <button onClick={handleLogout} className="w-full text-left p-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl mt-4 italic">← Esci dall'account</button>}
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black uppercase text-stone-400 mb-6 tracking-widest border-b pb-2">Categorie</h3>
              <div className="grid gap-1">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/?cat=${cat.slug}`} onClick={() => setIsSidebarOpen(false)} className="p-3 text-sm font-bold text-stone-700 hover:text-emerald-600 rounded-xl transition-all">{cat.name}</Link>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black uppercase text-stone-400 mb-4 border-b pb-2">Supporto</h3>
              <Link href="/protezione" onClick={() => setIsSidebarOpen(false)} className="block p-3 text-xs font-bold text-stone-500 hover:text-stone-900">🛡️ Protezione Acquisti</Link>
              <Link href="/come-funziona" onClick={() => setIsSidebarOpen(false)} className="block p-3 text-xs font-bold text-stone-500 hover:text-stone-900">Come Funziona</Link>
            </section>
          </div>
        </div>
      </div>

      {/* CARRELLO DESTRO (Full logic) */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[380px] bg-white z-[120] shadow-2xl transition-transform duration-300 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex justify-between items-center mb-10 border-b pb-6">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Carrello</h2>
            <button onClick={closeCart} className="text-stone-400 text-2xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {items.length === 0 ? <p className="text-center text-stone-400 py-10 italic">Il carrello è vuoto</p> : 
              items.map(item => (
                <div key={item.id} className="flex gap-4 items-center bg-stone-50 p-4 rounded-3xl border border-stone-100 relative">
                  <button onClick={() => removeItem(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] font-bold shadow-md">✕</button>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase truncate">{item.title}</p>
                    <p className="text-xs text-emerald-600 font-black mt-1">€ {item.price} <span className="text-stone-400 ml-1">x {item.quantity}</span></p>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="mt-auto pt-8 border-t border-stone-200">
            <div className="flex justify-between items-center mb-8">
              <span className="font-black text-xs uppercase text-stone-400 tracking-widest">Totale</span>
              <span className="text-3xl font-black text-stone-900">€ {total.toFixed(2)}</span>
            </div>
            <button onClick={handleCheckout} disabled={items.length === 0 || loading} className="w-full bg-stone-900 text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all disabled:opacity-30">
              {loading ? 'Elaborazione...' : 'Conferma e Paga'}
            </button>
          </div>
        </div>
      </div>

      {(isSidebarOpen || isCartOpen) && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110]" onClick={() => { setIsSidebarOpen(false); closeCart(); }} />}
    </>
  )
}
