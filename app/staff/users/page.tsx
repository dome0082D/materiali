'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// 1. Definisco i tipi per rimuovere l'errore TypeScript "any"
interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
}

export default function StaffUsersList() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfiles() {
      try {
        setLoading(true)
        
        // 2. Ordinato per 'id' invece di 'created_at' per evitare crash con Supabase
        const { data, error } = await supabase.from('profiles').select('*').order('id', { ascending: false })
        
        if (error) {
          console.warn("Errore Supabase profili:", error)
          setErrorMsg(error.message)
        } else {
          setUsers(data as Profile[] || [])
        }
      } catch (err: unknown) {
        console.error("Crash recupero profili:", err)
        const e = err as Error;
        setErrorMsg(e.message || "Si è verificato un errore imprevisto.")
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [])

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black uppercase italic text-stone-900">Gestione Utenti</h1>
          <Link href="/" className="text-xs font-bold uppercase bg-stone-200 px-4 py-2 rounded-xl hover:bg-stone-300 transition-colors">Torna alla Home</Link>
        </div>

        {loading ? (
          <p className="animate-pulse font-bold text-stone-400 uppercase text-xs">Caricamento database...</p>
        ) : errorMsg ? (
          <div className="bg-red-50 p-6 rounded-2xl border border-red-200 shadow-sm">
            <p className="text-red-600 font-bold uppercase text-[11px] tracking-widest mb-2">⚠️ Impossibile caricare gli utenti</p>
            <p className="text-red-500 font-medium text-xs mb-4">{errorMsg}</p>
            <p className="text-stone-500 text-[10px] uppercase font-bold tracking-wider">
              Controllo: Assicurati di aver creato la tabella "profiles" su Supabase.
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center shadow-sm">
            <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Nessun utente trovato nella tabella profili</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {users.map((u) => (
              <div key={u.id} className="bg-white p-6 rounded-3xl border border-stone-200 flex justify-between items-center shadow-sm hover:border-rose-300 transition-all">
                <div>
                  <p className="text-xs font-black uppercase text-stone-400 tracking-widest">Utente</p>
                  {/* 3. Mostriamo Nome e Cognome, perché la Mail non è nella tabella profiles! */}
                  <p className="font-bold text-stone-900">
                    {(u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}` : 'Profilo Incompleto'}
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono mt-1">ID: {u.id.substring(0, 8)}...</p>
                </div>
                <Link href={`/staff/users/${u.id}`} className="bg-stone-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 transition-all shadow-md hover:-translate-y-1">
                  Gestisci
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}