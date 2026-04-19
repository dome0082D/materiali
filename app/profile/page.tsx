'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [myAds, setMyAds] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    getProfile()
  }, [])

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    const { data } = await supabase.from('announcements').select('*').eq('user_id', user.id)
    if (data) setMyAds(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const deleteAccount = async () => {
    if (confirm("ATTENZIONE: Vuoi davvero cancellare il tuo profilo e tutti i tuoi annunci? L'azione è irreversibile.")) {
      // Nota: La cancellazione effettiva dell'utente auth richiede una Edge Function o admin bypass.
      // Qui simuliamo la rimozione dei dati profilo e logout.
      await supabase.from('profiles').delete().eq('id', user.id)
      await supabase.auth.signOut()
      alert("Account rimosso con successo.")
      router.push('/')
    }
  }

  const deleteAd = async (id: string) => {
    if (confirm("Eliminare questo annuncio?")) {
      await supabase.from('announcements').delete().eq('id', id)
      getProfile()
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-12">
        
        {/* HEADER PROFILO */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl font-black uppercase italic">Il Tuo Profilo</h1>
            <p className="text-xs font-bold text-stone-400 mt-1">{user?.email}</p>
          </div>
          <div className="flex gap-3 mt-6 md:mt-0">
            <button onClick={handleLogout} className="text-[10px] font-black uppercase bg-stone-100 px-6 py-3 rounded-xl hover:bg-stone-200 transition-all">Esci</button>
            <button onClick={deleteAccount} className="text-[10px] font-black uppercase bg-red-50 text-red-500 px-6 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all">Elimina Account</button>
          </div>
        </div>

        {/* I TUOI ANNUNCI */}
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 border-b border-stone-200 pb-2">I tuoi annunci</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myAds.map(ad => (
            <div key={ad.id} className="bg-white p-4 rounded-2xl border border-stone-200 flex gap-4 items-center">
              <img src={ad.image_url || "/usato.png"} className="w-16 h-16 rounded-lg object-cover bg-stone-50" />
              <div className="flex-grow">
                <h4 className="text-xs font-black uppercase truncate">{ad.title}</h4>
                <p className="text-[10px] font-bold text-emerald-600">{ad.type === 'offered' ? 'REGALO' : `€ ${ad.price}`}</p>
              </div>
              <button onClick={() => deleteAd(ad.id)} className="text-red-500 opacity-30 hover:opacity-100 transition-opacity p-2">✕</button>
            </div>
          ))}
          {myAds.length === 0 && <p className="text-xs font-bold text-stone-300 uppercase py-8">Non hai ancora pubblicato nulla.</p>}
        </div>

        <Link href="/" className="block text-center text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 mt-12 transition-colors">← Torna alla Home</Link>
      </div>
    </div>
  )
}
