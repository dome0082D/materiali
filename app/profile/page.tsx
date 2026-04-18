'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>({ first_name: '', last_name: '', dob: '', residence_city: '' })
  const [userSerialId, setUserSerialId] = useState('')
  const [myAnnouncements, setMyAnnouncements] = useState<any[]>([])
  
  const [isStaff, setIsStaff] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => { getProfile() }, [])

  async function getProfile() {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { router.push('/register'); return; }
    setUser(u)

    const staffMode = u.email === 'dome0082@gmail.com'
    setIsStaff(staffMode)

    let { data: pData } = await supabase.from('profiles').select('*').eq('id', u.id).single()
    if (pData) { setProfile(pData); setUserSerialId(pData.user_serial_id); }

    const { data: annData } = await supabase.from('announcements').select('*').eq('user_id', u.id)
    if (annData) setMyAnnouncements(annData)

    if (staffMode) {
      const { data: usersData } = await supabase.from('profiles').select('*').order('user_serial_id', { ascending: true })
      if (usersData) setAllUsers(usersData)
    }
    setLoading(false)
  }

  async function deleteUserProfile(id: string) {
    if(!confirm("STAFF: Sicuro di voler cancellare questo profilo e i suoi annunci?")) return
    await supabase.from('announcements').delete().eq('user_id', id)
    await supabase.from('profiles').delete().eq('id', id)
    setAllUsers(allUsers.filter(u => u.id !== id))
  }

  if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center font-black uppercase text-xs tracking-widest">Caricamento...</div>

  return (
    <div className="min-h-screen bg-slate-200 p-4 md:p-10 font-sans text-slate-800">
      <main className="bg-white max-w-4xl mx-auto rounded-3xl shadow-2xl overflow-hidden border">
        
        <div className="bg-slate-800 p-10 text-white flex justify-between items-center">
          <div>
            <Link href="/" className="text-[10px] font-black text-slate-400 hover:text-white uppercase mb-4 block tracking-widest">← Home</Link>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Area Personale</h1>
          </div>
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700 text-center">
            <span className="block text-[9px] font-black uppercase text-slate-500 mb-1">ID UNIVOCO</span>
            <span className={`text-2xl font-mono font-bold ${isStaff ? 'text-red-500' : 'text-sky-400'}`}>{userSerialId || '---'}</span>
          </div>
        </div>

        <div className="p-10 space-y-12">
          {isStaff && (
            <div className="p-6 bg-slate-900 rounded-2xl shadow-xl border border-slate-700">
              <h3 className="text-white font-black uppercase text-xl mb-4">👑 STAFF: Lista Utenti ({allUsers.length})</h3>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {allUsers.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-4 bg-slate-800 rounded-xl border border-slate-700 text-white">
                    <div>
                      <span className="font-black text-sky-400 mr-4 w-16 inline-block">{u.user_serial_id}</span>
                      <span className="text-xs font-bold uppercase">{u.first_name} {u.last_name || 'Senza Nome'}</span>
                    </div>
                    {u.user_serial_id !== 'USR-1' && (
                       <button onClick={() => deleteUserProfile(u.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-red-800 transition-colors">Banna Utente</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ... Qui ci sarebbero i tuoi input anagrafici standard, li ho ostruiti per brevità ma il concetto è lo stesso del messaggio precedente ... */}
        </div>
      </main>
    </div>
  )
}
