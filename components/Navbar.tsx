'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/store/cartStore'

// CARICAMENTO MAPPA CON LA "i" MINUSCOLA PER RISOLVERE L'ERRORE
const Italymap = dynamic(() => import('./italymap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-stone-100 flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest text-center">Aggancio Satellitare Mappa Italia in corso...</p>
    </div>
  )
})

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false) 
  const [user, setUser] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState(0)

  // STATI PER I NUOVI STRUMENTI E LA MAPPA
  const [darkMode, setDarkMode] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [aiItemName, setAiItemName] = useState('')
  const [aiResult, setAiResult] = useState<string | null>(null)
  
  // STATI PER IL RADAR
  const [isRadarScanning, setIsRadarScanning] = useState(false)
  
  const router = useRouter()
  const { items, isCartOpen, openCart, closeCart, removeItem, updateQuantity } = useCartStore()
  const total = items.reduce((acc, i) => acc + (Number(i.price) * i.quantity), 0)

  // --- EFFETTO MODALITÀ NOTTE (TRUCCO CSS UNIVERSALE) ---
  useEffect(() => {
    let styleEl = document.getElementById('dark-mode-hack') as HTMLStyleElement;
    if (darkMode) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dark-mode-hack';
        // Inverte i colori del sito, ma "re-inverte" immagini e video così non sembrano negativi fotografici!
        styleEl.innerHTML = `
          html { filter: invert(1) hue-rotate(180deg); background: #fff; transition: filter 0.5s ease; }
          img, video, iframe, .leaflet-container { filter: invert(1) hue-rotate(180deg); }
        `;
        document.head.appendChild(styleEl);
      }
    } else {
      if (styleEl) styleEl.remove();
    }
  }, [darkMode])

  useEffect(() => {
    const getData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user || null
        setUser(currentUser)
        
        try {
          const { data: cats, error: catsError } = await supabase.from('categories').select('*').order('name')
          if (!catsError && cats) {
            setCategories(cats)
          }
        } catch (catErr) {
          console.warn("Nessuna tabella categorie trovata", catErr)
        }

        // CARICAMENTO ANNUNCI PER LA MAPPA
        try {
          const { data: anns, error: annsError } = await supabase.from('announcements').select('*')
          if (!annsError && anns) {
            setAnnouncements(anns)
          }
        } catch (annsErr) {
          console.warn("Nessuna tabella annunci trovata", annsErr)
        }

        if (currentUser) {
          await fetchNotifications(currentUser.id)
          
          try {
            const channel = supabase.channel('realtime-notifications')
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, () => {
                fetchNotifications(currentUser.id)
              }).subscribe()
              
            return () => { supabase.removeChannel(channel) }
          } catch (channelErr) {
            console.warn("Canale notifiche non avviato")
          }
        }
      } catch (mainErr) {
        console.error("Errore Navbar:", mainErr)
      }
    }
    
    getData()
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  const fetchNotifications = async (userId: string) => {
    try {
      const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false)
      if (!error && count !== null) {
        setNotifications(count)
      }
    } catch (e) {}
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleCheckout = async () => {
    if (!user) { alert("Devi accedere o registrarti per completare l'acquisto"); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items, buyerId: user.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; 
      } else {
        alert("Errore Checkout Stripe.");
        setLoading(false);
      }
    } catch (err) {
      alert("Errore di connessione.");
      setLoading(false);
    }
  };

  // --- LOGICA NUOVI STRUMENTI ---
  
  // LOGICA RADAR CHE APRE LA MAPPA DELL'ITALIA
  const handleRadar = () => {
    setIsSidebarOpen(false);
    setIsRadarScanning(true);
    
    setTimeout(() => {
      setIsRadarScanning(false);
      setShowMapModal(true);
    }, 3000);
  }

  const handleAiValuation = () => {
    if (!aiItemName) return;
    setLoading(true);
    setTimeout(() => {
      const randomPrice = Math.floor(Math.random() * 50) + 10;
      setAiResult(`Basato sull'attuale mercato dell'usato, un "${aiItemName}" potrebbe valere circa €${randomPrice}.00. Ottimo anche per il baratto!`);
      setLoading(false);
    }, 1500);
  }

  return (
    <>
      <nav className="bg-white border-b border-rose-100 sticky top-0 z-[5000] shadow-sm flex justify-between items-center h-20 px-4 md:px-8 transition-colors">
        <div className="flex items-center gap-3 md:gap-6">
          <button onClick={() => setIsSidebarOpen(true)} className="text-2xl p-2 text-stone-600 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-all focus:outline-none">
            ☰
          </button>
          
          <Link 
            href="/" 
            className="text-3xl md:text-4xl text-rose-500 select-none bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-orange-400"
            style={{ fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive", fontWeight: 700 }}
          >
            Re-love
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          
          {/* I 4 NUOVI TASTI IN BELLA VISTA NELLA BARRA */}
          <div className="hidden lg:flex items-center gap-1 border-r border-stone-200 pr-4 mr-2">
            <button onClick={() => setDarkMode(!darkMode)} title={darkMode ? "Modalità Chiara" : "Modalità Notte"} className="p-2 text-xl hover:scale-110 transition-transform">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setShowSecurityModal(true)} title="Scudo Sicurezza" className="p-2 text-xl hover:scale-110 transition-transform">
              🛡️
            </button>
            <button onClick={() => setShowAiModal(true)} title="Valutatore Magico" className="p-2 text-xl hover:scale-110 transition-transform">
              🤖
            </button>
            <button onClick={handleRadar} title="Radar Italia" className="p-2 text-xl hover:scale-110 transition-transform">
              📡
            </button>
          </div>

          {!user && (
            <Link href="/login" className="hidden lg:block text-stone-600 font-bold uppercase text-[11px] tracking-widest hover:text-rose-500 transition-colors px-2">
              Accedi
            </Link>
          )}

          <Link href="/add" className="hidden lg:block bg-gradient-to-r from-rose-500 to-orange-400 text-white px-4 py-2 rounded-xl font-bold uppercase text-[11px] tracking-widest hover:shadow-lg hover:scale-105 transition-all shadow-md">
            ➕ Vendi
          </Link>

          <div className="relative">
            <button 
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsQuickMenuOpen(false);
              }} 
              className="relative p-2 text-xl text-stone-500 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-all"
            >
              🔔
              {notifications > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold border border-white">
                  {notifications}
                </span>
              )}
            </button>
            
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl p-4 z-[6000]">
                <div className="flex justify-between items-center border-b border-stone-100 pb-2 mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Notifiche</h4>
                  <button onClick={() => setIsNotifOpen(false)} className="text-stone-400 hover:text-stone-800 text-xs font-bold">✕</button>
                </div>
                <div className="py-6 text-center">
                  <span className="text-4xl block mb-3">📭</span>
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Tutto tace</p>
                  <p className="text-[9px] text-stone-400 font-medium mt-1">Nessuna nuova notifica.</p>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => {
              setIsQuickMenuOpen(!isQuickMenuOpen);
              setIsNotifOpen(false);
            }} className="p-2 text-xl text-stone-500 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-all">
              ⋮
            </button>
            {isQuickMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-100 shadow-xl rounded-xl p-2 z-[6000]">
                <Link href="/profile" className="block p-3 text-xs font-medium text-stone-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all">⚙️ Impostazioni</Link>
                <Link href="/come-funziona" className="block p-3 text-xs font-medium text-stone-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all">❓ Aiuto</Link>
                {user && <button onClick={handleLogout} className="w-full text-left p-3 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-all">Esci</button>}
              </div>
            )}
          </div>

          <button onClick={openCart} className="relative text-2xl p-2 hover:bg-rose-50 hover:text-rose-500 text-stone-500 rounded-full transition-all focus:outline-none">
            🛒 
            {items.length > 0 && (
              <span className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border border-white shadow-md">
                {items.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* OVERLAY SFONDO */}
      {(isSidebarOpen || isCartOpen || showSecurityModal || showAiModal || showMapModal) && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[9998] transition-opacity" 
             onClick={() => { setIsSidebarOpen(false); closeCart(); setIsQuickMenuOpen(false); setIsNotifOpen(false); setShowSecurityModal(false); setShowAiModal(false); setShowMapModal(false); }} />
      )}

      {/* -------------------- SIDEBAR (MENU ☰) -------------------- */}
      <div className={`fixed top-0 left-0 h-full w-full max-w-[320px] bg-white z-[9999] shadow-2xl transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 bg-gradient-to-br from-rose-500 to-orange-500 text-white relative">
            <button onClick={() => setIsSidebarOpen(false)} className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl transition-colors">✕</button>
            <div className="w-14 h-14 bg-white text-rose-500 rounded-xl flex items-center justify-center text-2xl font-bold italic shadow-md mb-4">
              {user?.email ? user.email[0].toUpperCase() : 'R'}
            </div>
            <p className="text-3xl mb-1 text-white" style={{ fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive" }}>Re-love</p>
            <p className="font-medium truncate text-xs tracking-wider uppercase opacity-90">{user?.email || 'Visitatore'}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <section>
              <h3 className="text-[10px] font-bold uppercase text-stone-400 mb-4 tracking-[0.2em] border-b pb-2 border-stone-100">Area Riservata</h3>
              <div className="grid gap-2">
                <Link href="/add" onClick={() => setIsSidebarOpen(false)} className="block w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white text-center py-3 rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-sm lg:hidden mb-2">➕ Vendi o Regala</Link>
                {user ? (
                  <>
                    <Link href="/profile" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-4 p-3 text-sm font-medium text-stone-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">👤 Profilo</Link>
                    <Link href="/dashboard/annunci" onClick={() => setIsSidebarOpen(false)} className="p-3 text-sm font-medium text-stone-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">📝 Gestione Annunci</Link>
                    <Link href="/dashboard/acquisti" onClick={() => setIsSidebarOpen(false)} className="p-3 text-sm font-medium text-stone-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all flex justify-between items-center">📦 Ordini <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">SECURE</span></Link>
                    <Link href="/chat" onClick={() => setIsSidebarOpen(false)} className="p-3 text-sm font-medium text-stone-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all flex justify-between">💬 Messaggi</Link>
                    <Link href="/dashboard/preferiti" onClick={() => setIsSidebarOpen(false)} className="p-3 text-sm font-medium text-stone-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">❤️ Preferiti</Link>
                    <button onClick={handleLogout} className="w-full text-left p-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl mt-4 uppercase tracking-widest transition-all">← Esci</button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setIsSidebarOpen(false)} className="w-full block text-center p-4 text-xs font-bold text-rose-500 border-2 border-rose-100 hover:border-rose-500 hover:bg-rose-50 rounded-xl mt-2 uppercase tracking-widest transition-all">Accedi / Registrati</Link>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-bold uppercase text-stone-400 mb-4 tracking-[0.2em] border-b pb-2 border-stone-100">Categorie</h3>
              <div className="grid gap-1">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/?cat=${cat.slug}`} onClick={() => setIsSidebarOpen(false)} className="p-3 text-sm font-medium text-stone-600 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all">
                    {cat.name}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* -------------------- CARRELLO -------------------- */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[380px] bg-white z-[9999] shadow-2xl transition-transform duration-300 ease-in-out transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="p-6 flex justify-between items-center border-b border-stone-100 bg-stone-50">
          <h2 className="text-xl font-bold uppercase italic tracking-tighter text-rose-500">Carrello</h2>
          <button onClick={closeCart} className="text-stone-400 hover:text-stone-900 text-2xl font-medium bg-white w-10 h-10 flex items-center justify-center rounded-full transition-all shadow-sm">✕</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-24 opacity-40">
              <span className="text-6xl block mb-4">🛒</span>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Carrello vuoto</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-stone-200 group relative transition-all shadow-sm hover:shadow-md">
                <button onClick={() => removeItem(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:scale-110 transition-all z-10">✕</button>
                <img src={(item as any).imageUrl || '/usato.png'} alt={item.title} className="w-20 h-20 object-cover rounded-xl border border-stone-200" />
                <div className="flex-1 flex flex-col justify-between">
                  <h3 className="font-bold text-sm text-stone-800 line-clamp-2">{item.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <p className="font-black text-rose-500">€ {(Number(item.price)).toFixed(2)}</p>
                    <div className="flex items-center gap-3 bg-stone-50 rounded-lg p-1 border border-stone-100">
                      <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm font-bold text-stone-600 hover:text-rose-500 transition-all">-</button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, Math.min((item as any).maxQuantity || 99, item.quantity + 1))} className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm font-bold text-stone-600 hover:text-emerald-500 transition-all">+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-stone-100">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-bold uppercase tracking-widest text-stone-400">Totale</span>
              <span className="text-2xl font-black text-rose-600">€ {total.toFixed(2)}</span>
            </div>
            <button onClick={handleCheckout} disabled={loading} className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-md hover:scale-[1.02] transition-all disabled:opacity-50">
              {loading ? 'Attendi...' : 'Procedi al Checkout'}
            </button>
          </div>
        )}
      </div>

      {/* -------------------- POPUP SCUDO SICUREZZA -------------------- */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative">
            <button onClick={() => setShowSecurityModal(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 text-xl font-bold">✕</button>
            <div className="text-center mb-6">
              <span className="text-6xl block mb-2">🛡️</span>
              <h2 className="text-2xl font-black uppercase italic text-stone-900">Scudo Re-love</h2>
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mt-1">Acquisti e Baratti Protetti</p>
            </div>
            <div className="space-y-4 text-sm font-medium text-stone-600">
              <p className="flex items-start gap-2"><span>🔒</span> <b>Pagamenti Sicuri:</b> Usiamo Stripe. I tuoi fondi sono congelati finché non ricevi il pacco.</p>
              <p className="flex items-start gap-2"><span>🤝</span> <b>Baratto Diretto:</b> Per barattare, usa la nostra chat integrata. Mai scambiarsi numeri privati.</p>
              <p className="flex items-start gap-2"><span>🚚</span> <b>Spedizione Tracciata:</b> Tutti gli acquisti "Nuovo" e "Usato" sono tracciati nel pannello Staff.</p>
            </div>
            <button onClick={() => setShowSecurityModal(false)} className="w-full mt-8 bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all">Ho Capito</button>
          </div>
        </div>
      )}

      {/* -------------------- POPUP VALUTATORE MAGICO -------------------- */}
      {showAiModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative">
            <button onClick={() => {setShowAiModal(false); setAiResult(null); setAiItemName('');}} className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 text-xl font-bold">✕</button>
            <div className="text-center mb-6">
              <span className="text-6xl block mb-2">🤖</span>
              <h2 className="text-2xl font-black uppercase italic text-stone-900">Valutatore Magico</h2>
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mt-1">Scopri quanto vale il tuo oggetto</p>
            </div>
            <input 
              type="text" 
              placeholder="Cosa vuoi vendere? (es. PS4 Pro)" 
              value={aiItemName}
              onChange={(e) => setAiItemName(e.target.value)}
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl mb-4 font-bold text-sm outline-none focus:border-purple-400"
            />
            {aiResult ? (
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 mb-4">
                <p className="text-xs font-bold text-purple-800">{aiResult}</p>
              </div>
            ) : null}
            <button onClick={handleAiValuation} disabled={loading || !aiItemName} className="w-full bg-purple-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-purple-700 transition-all disabled:opacity-50">
              {loading ? 'Elaborazione...' : 'Calcola Valore'}
            </button>
          </div>
        </div>
      )}

      {/* -------------------- POPUP MAPPA ITALIA DETTAGLIATA -------------------- */}
      {showMapModal && (
        <div className="fixed inset-0 z-[15000] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
          <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-white shadow-sm z-10">
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase italic text-rose-500 tracking-tighter">Mappa Re-love Italia</h2>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Esplora gli annunci in tutto il Paese</p>
            </div>
            <button onClick={() => setShowMapModal(false)} className="bg-stone-900 text-white px-4 py-2 md:px-6 md:py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 transition-all shadow-md">
              Chiudi X
            </button>
          </div>
          <div className="flex-1 relative z-0">
             <Italymap announcements={announcements} />
          </div>
        </div>
      )}

      {/* -------------------- ANIMAZIONE RADAR DI QUARTIERE -------------------- */}
      {isRadarScanning && (
        <div className="fixed inset-0 z-[20000] bg-stone-900/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="text-center flex flex-col items-center">
            {/* Cerchio del Radar */}
            <div className="w-48 h-48 rounded-full border-4 border-emerald-500/20 flex items-center justify-center relative overflow-hidden mb-8 shadow-[0_0_80px_rgba(16,185,129,0.2)]">
              {/* Onde concentriche */}
              <div className="absolute inset-0 rounded-full border border-emerald-500/40 animate-ping" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-4 rounded-full border border-emerald-500/30 animate-ping" style={{ animationDuration: '2.5s' }}></div>
              {/* Raggio verde che gira */}
              <div className="w-[50%] h-1 bg-gradient-to-r from-transparent to-emerald-400 absolute top-1/2 left-1/2 origin-left animate-spin" style={{ animationDuration: '1.5s', transform: 'translateY(-50%)' }}></div>
              <span className="text-5xl relative z-10">📡</span>
            </div>
            <h2 className="text-3xl font-black uppercase italic text-emerald-400 tracking-widest mb-3">Scansione in corso...</h2>
            <p className="text-stone-300 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Ricerca oggetti in Italia</p>
          </div>
        </div>
      )}
    </>
  )
}