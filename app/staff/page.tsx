'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Transaction {
  id: string;
  created_at: string;
  status: string;
  buyer_id: string;
  seller_id: string;
  stripe_payment_intent_id: string;
  barter_confirmed_buyer: boolean;
  barter_confirmed_seller: boolean;
  announcements: {
    id: string;
    title: string;
    price: number;
    condition: string;
    image_url: string;
  };
  buyer?: { email: string };
  seller?: { email: string };
}

// Nuova interfaccia per gli utenti
interface Profile {
  id: string;
  email: string;
}

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([]) // Stato per gli utenti
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const ADMIN_EMAIL = 'dome0082@gmail.com'

  useEffect(() => {
    checkAdminAndFetchData()
  }, [])

  async function checkAdminAndFetchData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Controllo di sicurezza spietato: se non sei tu, ti sbatte fuori
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push('/')
      return
    }

    // 1. Recuperiamo tutte le transazioni
    const { data: txs } = await supabase
      .from('transactions')
      .select('*, announcements(id, title, price, condition, image_url)')
      .order('created_at', { ascending: false })

    // 2. Recuperiamo tutti gli utenti (Profili)
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, email')

    if (profs) {
      setProfiles(profs as Profile[])
    }

    if (txs) {
      // Arricchiamo i dati con le email di compratori e venditori per farti capire chi sono
      const enrichedTxs = await Promise.all(txs.map(async (tx) => {
        const { data: buyerData } = await supabase.from('profiles').select('email').eq('id', tx.buyer_id).single()
        const { data: sellerData } = await supabase.from('profiles').select('email').eq('id', tx.seller_id).single()
        return { ...tx, buyer: buyerData, seller: sellerData }
      }))
      setTransactions(enrichedTxs as unknown as Transaction[])
    }
    setLoading(false)
  }

  // --- FUNZIONI TRANSAZIONI ---
  const forceStatus = async (txId: string, newStatus: string) => {
    if (!window.confirm(`Sei sicuro di forzare lo stato a: ${newStatus}?`)) return;
    
    setLoading(true)
    const { error } = await supabase.from('transactions').update({ status: newStatus }).eq('id', txId)
    
    if (!error) {
      alert(`Status aggiornato a ${newStatus}!`)
      checkAdminAndFetchData()
    } else {
      alert("Errore aggiornamento: " + error.message)
      setLoading(false)
    }
  }

  // --- NUOVE FUNZIONI SICUREZZA (ELIMINA PROFILI E CHAT) ---
  const deleteChats = async (userId: string) => {
    if (!window.confirm("Sei sicuro di voler ELIMINARE TUTTE LE CHAT di questo utente? L'azione è irreversibile.")) return;
    setLoading(true)
    
    const { error } = await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    
    if (!error) {
      alert("Tutte le chat dell'utente sono state spazzate via.")
      checkAdminAndFetchData()
    } else {
      alert("Errore durante l'eliminazione delle chat: " + error.message)
      setLoading(false)
    }
  }

  const deleteProfile = async (userId: string) => {
    if (!window.confirm("ATTENZIONE NUCLEARE: Vuoi davvero ELIMINARE questo profilo? Verranno cancellati anche i suoi annunci e messaggi dal sito.")) return;
    setLoading(true)
    
    // Eliminiamo a cascata dal database pubblico (Messaggi -> Annunci -> Profilo)
    await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    await supabase.from('announcements').delete().eq('user_id', userId)
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    
    if (!error) {
      alert("Profilo e dati connessi eliminati con successo. L'utente è stato rimosso dalla piattaforma.")
      checkAdminAndFetchData()
    } else {
      alert("Errore durante l'eliminazione del profilo: " + error.message)
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-stone-900 flex justify-center items-center font-black uppercase tracking-widest text-rose-500 text-xs">Accesso Admin in corso...</div>

  return (
    <div className="min-h-screen bg-stone-900 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER ADMIN */}
        <div className="flex justify-between items-center mb-10 border-b border-stone-800 pb-6">
          <div>
            <span className="bg-rose-500 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-2 inline-block">Admin Mode</span>
            <h1 className="text-3xl font-black uppercase italic text-white">Stanza dei Bottoni</h1>
          </div>
          <button onClick={() => router.push('/')} className="text-[10px] font-bold text-stone-400 uppercase hover:text-white transition-colors">
            ← Torna al Sito
          </button>
        </div>

        {/* STATISTICHE */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-stone-800 p-6 rounded-3xl border border-stone-700">
            <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Totale Transazioni</h3>
            <p className="text-3xl font-black text-white">{transactions.length}</p>
          </div>
          <div className="bg-stone-800 p-6 rounded-3xl border border-stone-700">
            <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Dispute / Rimborsi</h3>
            <p className="text-3xl font-black text-rose-500">{transactions.filter(t => t.status === 'Rimborsato' || t.status === 'In_Contestazione').length}</p>
          </div>
          <div className="bg-stone-800 p-6 rounded-3xl border border-stone-700">
            <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Fondi Congelati</h3>
            <p className="text-3xl font-black text-orange-400">{transactions.filter(t => t.status === 'Pagato').length}</p>
          </div>
          <div className="bg-stone-800 p-6 rounded-3xl border border-stone-700">
            <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Conclusi con successo</h3>
            <p className="text-3xl font-black text-emerald-400">{transactions.filter(t => t.status === 'Concluso' || t.status === 'Ricevuto').length}</p>
          </div>
        </div>

        {/* TABELLA TRANSAZIONI */}
        <div className="bg-stone-800 rounded-[2rem] border border-stone-700 overflow-hidden shadow-2xl mb-10">
          <div className="p-6 border-b border-stone-700 bg-stone-900/50">
            <h2 className="text-lg font-black uppercase italic text-white">💰 Gestione Transazioni</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-300">
              <thead className="text-[10px] font-black text-stone-400 uppercase tracking-widest bg-stone-900/50">
                <tr>
                  <th className="px-6 py-4">Annuncio</th>
                  <th className="px-6 py-4">Modalità</th>
                  <th className="px-6 py-4">Compratore</th>
                  <th className="px-6 py-4">Venditore</th>
                  <th className="px-6 py-4">Status DB</th>
                  <th className="px-6 py-4 text-right">Azioni Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-700/50">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-stone-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={tx.announcements.image_url} className="w-10 h-10 rounded-lg object-cover" alt="item" />
                        <span className="font-bold text-white truncate max-w-[150px] block">{tx.announcements.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${tx.announcements.condition === 'Baratto' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {tx.announcements.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px]">{tx.buyer?.email || tx.buyer_id.substring(0,8)}</td>
                    <td className="px-6 py-4 text-[11px]">{tx.seller?.email || tx.seller_id.substring(0,8)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                        tx.status === 'Pagato' ? 'bg-orange-500/20 text-orange-400' :
                        tx.status === 'Ricevuto' || tx.status === 'Concluso' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => forceStatus(tx.id, 'Rimborsato')} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">
                        Forza Rimborso
                      </button>
                      <button onClick={() => forceStatus(tx.id, 'Ricevuto')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">
                        Sblocca Fondi
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Nessuna transazione trovata nel database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABELLA UTENTI E SICUREZZA */}
        <div className="bg-stone-800 rounded-[2rem] border border-rose-900/50 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-stone-700 bg-stone-900/50">
            <h2 className="text-lg font-black uppercase italic text-rose-500">🛡️ Gestione Utenti e Sicurezza</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-300">
              <thead className="text-[10px] font-black text-stone-400 uppercase tracking-widest bg-stone-900/50">
                <tr>
                  <th className="px-6 py-4">ID Utente</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-right">Azioni Sicurezza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-700/50">
                {profiles.map(p => (
                  <tr key={p.id} className="hover:bg-stone-700/20 transition-colors">
                    <td className="px-6 py-4 text-[10px] font-mono text-stone-500">{p.id}</td>
                    <td className="px-6 py-4 font-bold text-white">{p.email}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => deleteChats(p.id)} className="bg-orange-500/10 border border-orange-500/50 hover:bg-orange-500 text-orange-400 hover:text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                        Svuota Chat
                      </button>
                      <button onClick={() => deleteProfile(p.id)} className="bg-rose-500/10 border border-rose-500/50 hover:bg-rose-600 text-rose-500 hover:text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                        Elimina Profilo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}