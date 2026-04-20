'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore' // Collegamento al tuo store

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Utilizziamo lo stato globale del tuo cartStore.ts
  const { items, isCartOpen, openCart, closeCart, removeItem } = useCartStore()
  
  const total = items.reduce((acc, i) => acc + (Number(i.price) * i.quantity), 0)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: cats } = await supabase.from('categories').select('*')
      setCategories(cats || [])
    }
    getData()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  // FUNZIONE PER AVVIARE IL PAGAMENTO
  const handleCheckout = async () => {
    if (!user) {
      alert("Devi accedere per completare l'acquisto");
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items,
          buyerId: user.id
        }),
      });

      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Errore Checkout: " + (data.error || "Riprova più tardi"));
        setLoading(false);
      }
    } catch (err) {
      alert("Errore di connessione al server");
      setLoading(false);
    }
  };

  return (
    <>
      {/* NAVBAR FISSA */}
      <nav className="bg-white border-b border-stone-200 p-4 sticky top-0 z-[100] shadow-sm flex justify-between items-center h-20 px-6">
        <button onClick={() => setIsSidebarOpen(true)} className="text-2xl hover:scale-110 transition-transform">☰</button>
        
        <Link href="/" className="text-3xl font-black uppercase italic tracking-tighter text-stone-900">
          Materiali
        </Link>

        <button onClick={openCart} className="relative text-2xl hover:scale-110 transition-transform">
          🛒
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white">
              {items.length}
            </span>
          )}
        </button>
      </nav>

      {/* OVERLAY (Sfondo scuro) */}
      {(isSidebarOpen || isCartOpen) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] animate-in fade-in duration-300" 
             onClick={() => { setIsSidebarOpen(false); closeCart(); }} />
      )}

      {/* SIDEBAR SINISTRA (Categorie & Utente) */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white z-[120] shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex justify-between items-center mb-10 border-b pb-4">
            <h2 className="text-xl font-black uppercase italic tracking-widest text-stone-900">Menu</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="text-stone-400 text-xl font-bold">✕</button>
          </div>

          <div className="space-y-8 overflow-y-auto">
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100">
              <p className="text-[10px] font-black uppercase text-stone-400 mb-1 tracking-widest">Utente Attivo</p>
              <p className="text-sm font-bold truncate text-stone-900">{user?.email || 'Ospite'}</p>
              {!user && <Link href="/login" onClick={() => setIsSidebarOpen(false)} className="text-xs text-emerald-600 font-bold uppercase mt-2 block">Accedi ora →</Link>}
            </div>

            <section>
              <h3 className="text-[10px] font-black uppercase text-stone-400 mb-4 tracking-widest border-l-2 border-emerald-500 pl-3">Categorie</h3>
              <div className="grid gap-2">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/?cat=${cat.slug}`} onClick={() => setIsSidebarOpen(false)} className="text-sm font-bold text-stone-700 hover:text-emerald-500 transition-colors p-3 hover:bg-stone-50 rounded-xl">
                    {cat.name}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* DRAWER DESTRO (Carrello gestito da Zustand) */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white z-[120] shadow-2xl transition-transform duration-300 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex justify-between items-center mb-10 border-b pb-4">
            <h2 className="text-xl font-black uppercase italic tracking-widest text-stone-900">Il tuo Carrello</h2>
            <button onClick={closeCart} className="text-stone-400 text-xl font-bold">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {items.length === 0 ? (
              <div className="text-center py-20 opacity-40">
                <span className="text-4xl block mb-4">🛒</span>
                <p className="text-xs font-bold uppercase tracking-widest">Carrello Vuoto</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4 items-center bg-stone-50 p-4 rounded-2xl border border-stone-100 group relative">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase truncate text-stone-900">{item.title}</p>
                    <p className="text-xs text-emerald-600 font-black mt-1">€ {item.price} <span className="text-stone-400 text-[10px] ml-1">x {item.quantity}</span></p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-xs text-red-400 hover:text-red-600 font-bold p-2">✕</button>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-8 border-t border-stone-200">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-xs uppercase tracking-widest text-stone-400">Totale Ordine</span>
              <span className="text-2xl font-black text-emerald-600">€ {total.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={items.length === 0 || loading} 
              className="w-full bg-stone-900 text-white p-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg hover:bg-emerald-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? 'Elaborazione...' : 'Procedi all\'Acquisto'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
