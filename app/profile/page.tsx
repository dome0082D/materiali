'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>({ 
    first_name: '', last_name: '', residence_country: '', residence_region: '', 
    residence_city: '', residence_street: '', residence_number: '', residence_zip: '' 
  })
  
  // STATI PER ANNUNCI E PREFERITI
  const [myAds, setMyAds] = useState<any[]>([])
  const [wishlistAds, setWishlistAds] = useState<any[]>([])
  
  const router = useRouter()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { router.push('/register'); return; }
    setUser(u)

    // Carica Profilo
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
    if (p) setProfile(p)

    // Carica i Miei Annunci
    const { data: ads } = await supabase.from('announcements').select('*').eq('user_id', u.id).order('created_at', { ascending: false })
    if (ads) setMyAds(ads)

    // Carica i Preferiti (Wishlist)
    const { data: w } = await supabase.from('wishlist').select('announcement_id').eq('user_id', u.id)
    if (w && w.length > 0) {
      const ids = w.map((item: any) => item.announcement_id)
      const { data: wAds } = await supabase.from('announcements').select('*').in('id', ids)
      if (wAds) setWishlistAds(wAds)
    }

    setLoading(false)
  }

  // SALVATAGGIO PROFILO
  async function update() {
    setLoading(true)
    const { error } = await supabase.from('profiles').upsert({ 
      id: user.id, 
      ...profile, 
      updated_at: new Date().toISOString() 
    })
    if (error) alert("Errore durante il salvataggio: " + error.message)
    else alert("Dati aggiornati e salvati con successo!")
    setLoading(false)
  }

  // LOGOUT
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // ELIMINA MIO ANNUNCIO
  async function deleteMyAd(id: string) {
    if(!confirm("Sei sicuro di voler eliminare definitivamente questo annuncio?")) return
    await supabase.from('announcements').delete().eq('id', id)
    setMyAds(myAds.filter(a => a.id !== id))
  }

  // RIMUOVI DAI PREFERITI
  async function removeFromWishlist(annId: string) {
    await supabase.from('wishlist').delete().match({ user_id: user.id, announcement_id: annId })
    setWishlistAds(wishlistAds.filter(a => a.id !== annId))
  }

  if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center font-bold uppercase tracking-widest text-[10px] text-stone-400">Caricamento Profilo...</div>

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden">
        
        {/* HEADER PROFILO */}
        <div className="bg-stone-900 p-8 text-white flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-light uppercase tracking-[0.2em]">Area Personale</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-2">ID: {profile.user_serial_id || 'In elaborazione...'}</p>
          </div>
          <div className="flex gap-3 items-center">
            <Link href="/" className="text-[10px] border border-stone-700 px-4 py-2.5 rounded-md font-bold uppercase hover:bg-stone-800 transition-colors">Torna al Sito</Link>
            <button onClick={handleLogout} className="text-[10px] bg-red-600/90 text-white px-4 py-2.5 rounded-md font-bold uppercase hover:bg-red-600 transition-colors shadow-sm">Esci (Logout)</button>
          </div>
        </div>

        <div className="p-8 space-y-12">
          
          {/* SEZIONE 1: DATI E INDIRIZZO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 border-b border-stone-100 pb-2">Dati Personali</h3>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Nome" className="p-3 bg-stone-50 border border-stone-100 rounded-lg text-sm focus:bg-white focus:border-emerald-500 transition-colors outline-none w-full" value={profile.first_name || ''} onChange={(e)=>setProfile({...profile, first_name: e.target.value})} />
                <input placeholder="Cognome" className="p-3 bg-stone-50 border border-stone-100 rounded-lg text-sm focus:bg-white focus:border-emerald-500 transition-colors outline-none w-full" value={profile.last_name || ''} onChange={(e)=>setProfile({...profile, last_name: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 border-b border-stone-100 pb-2">Luogo di Residenza / Ritiro Merce</h3>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Nazione" className="p-3 bg-stone-50 border border-stone-100 rounded-lg text-sm outline-none" value={profile.residence_country || ''} onChange={(e)=>setProfile({...profile, residence_country: e.target.value})} />
                <input placeholder="Regione" className="p-3 bg-stone-50 border border-stone-100 rounded-lg text-sm outline-none" value={profile.residence_region || ''} onChange={(e)=>setProfile({...profile, residence_region: e.target.value})} />
                <input placeholder="Città" className="col-span-2 p-3 bg-stone-50 border border-stone-100 rounded-lg text-sm outline-none" value={profile.residence_city || ''} onChange={(e)=>setProfile({...profile, residence_city: e.target.value})} />
                <input placeholder="Via / Piazza" className="p-3 bg-stone-50 border border-stone-100 rounded-lg text-sm outline-none" value={profile.residence_street || ''} onChange={(e)=>setProfile({...profile, residence_street: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Civico" className="p-3 bg-stone-50 border border-stone-100 rounded-lg text-sm outline-none" value={profile.residence_number || ''} onChange={(e)=>setProfile({...profile, residence_number: e.target.value})} />
                  <input placeholder="CAP" className="p-3 bg-stone-50 border border-stone-100 rounded-lg text-sm outline-none" value={profile.residence_zip || ''} onChange={(e)=>setProfile({...profile, residence_zip: e.target.value})} />
                </div>
              </div>
              <button onClick={update} className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-sm">Salva Indirizzo e Dati</button>
            </div>
          </div>

          <hr className="border-stone-100" />

          {/* SEZIONE 2: I MIEI ANNUNCI (CON TASTO MODIFICA) */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 border-b border-stone-100 pb-2">I Miei Annunci ({myAds.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myAds.map(ad => (
                <div key={ad.id} className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className={`px-2 py-1 text-[7px] font-black tracking-widest rounded-sm text-white ${ad.type === 'wanted' ? 'bg-amber-500' : 'bg-emerald-600'}`}>{ad.type}</span>
                    <h4 className="text-sm font-bold uppercase text-stone-800 mt-2 truncate">{ad.title}</h4>
                    <p className="text-[11px] font-black text-stone-900 mt-1">€{ad.price} <span className="font-normal text-stone-400 ml-2">Qta: {ad.quantity || 1}</span></p>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-stone-200">
                    <Link href={`/edit/${ad.id}`} className="flex-1 text-center bg-white border border-stone-200 text-stone-700 hover:text-emerald-600 hover:border-emerald-600 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">✏️ Modifica</Link>
                    <button onClick={() => deleteMyAd(ad.id)} className="bg-red-50 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-red-100 hover:border-red-600">Elimina</button>
                  </div>
                </div>
              ))}
              {myAds.length === 0 && <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Non hai ancora pubblicato nessun annuncio.</p>}
            </div>
          </div>

          <hr className="border-stone-100" />

          {/* SEZIONE 3: I MIEI PREFERITI (WISHLIST) */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 border-b border-stone-100 pb-2">I Miei Preferiti ❤️ ({wishlistAds.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlistAds.map(ad => (
                <div key={ad.id} className="p-4 bg-white border border-stone-200 rounded-xl flex flex-col justify-between shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold uppercase text-stone-800 truncate">{ad.title}</h4>
                      <p className="text-[11px] font-black text-emerald-600 mt-1">€{ad.price}</p>
                    </div>
                    <button onClick={() => removeFromWishlist(ad.id)} className="text-stone-300 hover:text-red-500 text-xl transition-colors">❤️</button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-stone-50 text-right">
                    <Link href={`/chat/${ad.user_id}?ann=${ad.id}`} className="text-emerald-600 hover:text-emerald-800 text-[10px] font-black uppercase tracking-widest transition-colors">Vai in Chat →</Link>
                  </div>
                </div>
              ))}
              {wishlistAds.length === 0 && <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Nessun annuncio salvato nei preferiti.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
