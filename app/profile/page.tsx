'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>({
    first_name: '',
    last_name: '',
    nation: '',
    country_state: '',
    city: '',
    full_address: '',
    user_serial_id: ''
  })
  const [myAds, setMyAds] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    // Carica dati dal database (tabella profiles)
    const { data: profData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profData) setProfile(profData)

    // Carica i tuoi annunci
    const ads = await supabase.from('announcements').select('*').eq('user_id', user.id)
    if (ads.data) setMyAds(ads.data)

    // Carica le tue recensioni
    const revs = await supabase.from('reviews').select('*').eq('receiver_id', user.id)
    if (revs.data) setReviews(revs.data)
  }

  async function updateProfile() {
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        nation: profile.nation,
        country_state: profile.country_state,
        city: profile.city,
        full_address: profile.full_address,
        updated_at: new Date()
      })

    if (error) {
      alert("Errore: " + error.message)
    } else {
      setIsEditing(false)
      alert("Profilo aggiornato con successo!")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* SCHEDA PROFILO E DATI PERSONALI */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h1 className="text-2xl font-black uppercase italic text-stone-900">Profilo Utente</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] font-black uppercase text-stone-400 bg-stone-100 px-2 py-1 rounded">ID Fisso:</span>
                <span className="text-[10px] font-bold text-stone-900">{profile.user_serial_id || 'Generazione in corso...'}</span>
              </div>
              <p className="text-xs font-bold text-emerald-600 mt-1">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className="text-[9px] font-black uppercase bg-stone-900 text-white px-5 py-3 rounded-xl hover:bg-emerald-600 transition-all shadow-sm"
              >
                {isEditing ? 'Annulla' : 'Modifica Profilo'}
              </button>
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-[9px] font-black uppercase bg-stone-100 px-5 py-3 rounded-xl hover:bg-stone-200 transition-all">Logout</button>
            </div>
          </div>

          {/* GRIGLIA DATI UTENTE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 block ml-1">Nome</label>
              {isEditing ? (
                <input type="text" className="w-full p-4 mt-1 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-400" 
                  value={profile.first_name || ''} onChange={e => setProfile({...profile, first_name: e.target.value})} />
              ) : (
                <p className="text-sm font-bold text-stone-800 mt-2 px-1">{profile.first_name || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 block ml-1">Cognome</label>
              {isEditing ? (
                <input type="text" className="w-full p-4 mt-1 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-400" 
                  value={profile.last_name || ''} onChange={e => setProfile({...profile, last_name: e.target.value})} />
              ) : (
                <p className="text-sm font-bold text-stone-800 mt-2 px-1">{profile.last_name || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 block ml-1">Nazione</label>
              {isEditing ? (
                <input type="text" className="w-full p-4 mt-1 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-400" 
                  value={profile.nation || ''} onChange={e => setProfile({...profile, nation: e.target.value})} />
              ) : (
                <p className="text-sm font-bold text-stone-800 mt-2 px-1">{profile.nation || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 block ml-1">Paese / Regione</label>
              {isEditing ? (
                <input type="text" className="w-full p-4 mt-1 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-400" 
                  value={profile.country_state || ''} onChange={e => setProfile({...profile, country_state: e.target.value})} />
              ) : (
                <p className="text-sm font-bold text-stone-800 mt-2 px-1">{profile.country_state || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 block ml-1">Città</label>
              {isEditing ? (
                <input type="text" className="w-full p-4 mt-1 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-400" 
                  value={profile.city || ''} onChange={e => setProfile({...profile, city: e.target.value})} />
              ) : (
                <p className="text-sm font-bold text-stone-800 mt-2 px-1">{profile.city || '-'}</p>
              )}
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-[9px] font-black uppercase text-stone-400 block ml-1">Indirizzo Completo</label>
              {isEditing ? (
                <input type="text" className="w-full p-4 mt-1 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-400" 
                  value={profile.full_address || ''} onChange={e => setProfile({...profile, full_address: e.target.value})} />
              ) : (
                <p className="text-sm font-bold text-stone-800 mt-2 px-1">{profile.full_address || '-'}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <button disabled={loading} onClick={updateProfile} className="mt-8 w-full bg-emerald-500 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all shadow-md">
              {loading ? 'Salvataggio...' : 'Salva Modifiche Profilo'}
            </button>
          )}
        </div>

        {/* LISTA ANNUNCI PROPRI */}
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 border-b border-stone-200 pb-2">I miei annunci</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {myAds.map(ad => (
            <div key={ad.id} className="bg-white p-5 rounded-2xl border border-stone-200 flex items-center justify-between shadow-sm">
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase truncate text-stone-800">{ad.title}</span>
                <span className="text-[9px] font-bold text-stone-400 uppercase mt-1">ID: {ad.id.slice(0, 8)}</span>
              </div>
              <button onClick={async () => { if(confirm("Vuoi davvero eliminare questo annuncio?")){ await supabase.from('announcements').delete().eq('id', ad.id); loadData() } }} className="text-red-500 text-[9px] font-black uppercase bg-red-50 px-3 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all">Elimina</button>
            </div>
          ))}
          {myAds.length === 0 && <p className="text-xs text-stone-300 font-bold uppercase py-4">Nessun oggetto pubblicato.</p>}
        </div>

        {/* RECENSIONI RICEVUTE */}
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 border-b border-stone-200 pb-2">Feedback e Recensioni</h2>
        <div className="space-y-3 mb-12">
          {reviews.map(r => (
            <div key={r.id} className="bg-white p-5 rounded-2xl border border-stone-200 text-xs italic shadow-sm">
              <div className="text-emerald-500 mb-2">{'★'.repeat(r.rating)}</div>
              <p className="text-stone-700">"{r.comment}"</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-xs text-stone-300 font-bold uppercase py-4">Nessun feedback ricevuto.</p>}
        </div>

        {/* AREA PERICOLO */}
        <div className="pt-12 border-t border-stone-200 text-center">
          <button onClick={async () => { if(confirm("CANCELLAZIONE DEFINITIVA: Procedere?")){ await supabase.from('profiles').delete().eq('id', user.id); await supabase.auth.signOut(); router.push('/') } }} className="text-[9px] font-black uppercase text-red-300 hover:text-red-600 transition-colors">
            Cancellazione definitiva account e dati
          </button>
          <Link href="/" className="block text-[10px] font-black uppercase text-stone-400 mt-8 hover:text-stone-900 transition-colors">
            ← Torna alla vetrina principale
          </Link>
        </div>
      </div>
    </div>
  )
}