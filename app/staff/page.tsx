'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// --- INTERFACCE DATI ---
interface Transaction {
  id: string;
  created_at: string;
  status: string;
  buyer_id: string;
  seller_id: string;
  stripe_payment_intent_id: string;
  courier_name?: string;      // AGGIUNTO: Corriere
  tracking_number?: string;   // AGGIUNTO: Tracking
  package_id_code?: string;   // AGGIUNTO: Codice interno
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

interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  address?: string;
  full_address?: string;
  created_at: string;
  stripe_account_id?: string;
  role?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer: { email: string };
  reviewed: { email: string };
}

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  
  // Stati per la modale di ispezione
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [userMessages, setUserMessages] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const router = useRouter()
  const ADMIN_EMAIL = 'dome0082@gmail.com'

  useEffect(() => {
    checkAdminAndFetchData()
  }, [])

  async function checkAdminAndFetchData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push('/')
      return
    }

    // 1. Recupero Transazioni con Annunci
    const { data: txs } = await supabase
      .from('transactions')
      .select('*, announcements(*)')
      .order('created_at', { ascending: false })

    // 2. Recupero Profili (per le email)
    const { data: profs } = await supabase.from('profiles').select('*')

    // 3. Recupero Recensioni con Join sui profili
    const { data: revs } = await supabase
      .from('reviews')
      .select('*, reviewer:reviewer_id(email), reviewed:reviewed_id(email)')

    if (profs) setProfiles(profs as Profile[])
    if (revs) setReviews(revs as unknown as Review[])
    
    if (txs && profs) {
      const enrichedTxs = txs.map(tx => ({
        ...tx,
        buyer: { email: profs.find(p => p.id === tx.buyer_id)?.email || 'N/D' },
        seller: { email: profs.find(p => p.id === tx.seller_id)?.email || 'N/D' }
      }))
      setTransactions(enrichedTxs as unknown as Transaction[])
    }
    
    setLoading(false)
  }

  // --- LOGICA AZIONI ADMIN ---

  const forceStatus = async (txId: string, newStatus: string) => {
    if (!confirm(`Vuoi forzare lo stato a: ${newStatus}?`)) return
    await supabase.from('transactions').update({ status: newStatus }).eq('id', txId)
    checkAdminAndFetchData()
  }

  // AGGIUNTO: Funzione per salvare i dati di spedizione
  const updateShipping = async (txId: string, courier: string, track: string, code: string) => {
    if (!confirm(`Vuoi salvare la spedizione con ${courier} e segnare l'ordine come Spedito?`)) return;
    
    const { error } = await supabase
      .from('transactions')
      .update({ 
        courier_name: courier, 
        tracking_number: track, 
        package_id_code: code,
        status: 'Spedito' 
      })
      .eq('id', txId);
      
    if (!error) {
      alert("Spedizione aggiornata!");
      checkAdminAndFetchData();
    } else {
      alert("Errore: " + error.message);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Eliminare definitivamente questa recensione?")) return
    await supabase.from('reviews').delete().eq('id', id)
    checkAdminAndFetchData()
  }

  // RISOLTO: Caricamento corretto dei messaggi per l'utente selezionato
  const viewUserDetails = async (profile: Profile) => {
    setSelectedUser(profile)
    setIsModalOpen(true)
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        // La sintassi .or() corretta per controllare sia mittente che destinatario
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        
      if (error) {
        console.error("Errore recupero messaggi:", error)
        setUserMessages([])
      } else {
        setUserMessages(data || [])
      }
    } catch (err) {
      console.error("Errore catch messaggi:", err)
    }
  }

  const deleteChats = async (userId: string) => {
    if (!confirm("Sei sicuro? Questa azione eliminerà TUTTE le chat (inviate e ricevute) di questo utente in modo irreversibile.")) return
    
    try {
      // Eliminiamo tutti i messaggi legati all'utente (sia come mittente che come destinatario)
      const { error } = await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      
      if (!error) {
        alert("Tutte le chat dell'utente sono state spazzate via con successo. 🌪️")
        // Svuotiamo l'array locale per aggiornare la modale in tempo reale
        setUserMessages([]) 
        if (selectedUser?.id === userId) {
          // Ricarichiamo per sicurezza
          viewUserDetails(selectedUser)
        }
      } else {
        alert("Errore durante l'eliminazione: " + error.message)
      }
    } catch (err: any) {
      alert("Errore: " + err.message)
    }
  }

  const deleteProfile = async (userId: string) => {
    if (!confirm("AZIONE NUCLEARE: Eliminare profilo, annunci e messaggi? Questa azione distrugge tutto l'account.")) return
    
    try {
      // 1. Elimina i messaggi
      await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      // 2. Elimina gli annunci
      await supabase.from('announcements').delete().eq('user_id', userId)
      // 3. Elimina il profilo
      await supabase.from('profiles').delete().eq('id', userId)
      
      alert("Utente rimosso completamente dal mondo Re-love. 💥")
      setIsModalOpen(false)
      checkAdminAndFetchData()
    } catch (err: any) {
      alert("Si è verificato un problema durante la procedura nucleare: " + err.message)
    }
  }

  // --- CALCOLI DASHBOARD ---
  const earnings = transactions
    .filter(t => t.status === 'Ricevuto' || t.status === 'Concluso')
    .reduce((acc, t) => acc + (t.announcements.price * 0.1), 0)

  if (loading && transactions.length === 0) return <div className="min-h-screen bg-stone-900 flex items-center justify-center font-black uppercase text-rose-500 tracking-widest animate-pulse">Caricamento Hub Re-love Staff...</div>

  return (
    <div className="min-h-screen bg-stone-900 p-6 md:p-12 font-sans text-stone-200">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-stone-800 pb-8">
          <div>
            <span className="bg-rose-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block shadow-lg shadow-rose-500/20">Staff Only</span>
            <h1 className="text-4xl font-black uppercase italic text-white tracking-tighter">Stanza dei Bottoni 👑</h1>
          </div>
          <button onClick={() => router.push('/')} className="bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-stone-700">← Torna al Sito</button>
        </div>

        {/* DASHBOARD FINANZIARIA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/20">
            <h3 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-2">💰 Commissioni Reali (10%)</h3>
            <p className="text-5xl font-black text-white italic">€ {earnings.toFixed(2)}</p>
          </div>
          <div className="bg-stone-800/50 p-8 rounded-[2.5rem] border border-stone-700">
            <h3 className="text-[10px] font-black uppercase text-stone-500 tracking-widest mb-2">📦 Ordini Gestiti</h3>
            <p className="text-5xl font-black text-white italic">{transactions.length}</p>
          </div>
          <div className="bg-stone-800/50 p-8 rounded-[2.5rem] border border-stone-700">
            <h3 className="text-[10px] font-black uppercase text-stone-500 tracking-widest mb-2">👤 Utenti Registrati</h3>
            <p className="text-5xl font-black text-white italic">{profiles.length}</p>
          </div>
        </div>

        {/* TABELLA TRANSAZIONI */}
        <div className="bg-stone-800/40 rounded-[2.5rem] border border-stone-800 overflow-hidden mb-12 backdrop-blur-sm shadow-2xl">
          <div className="p-8 bg-stone-900/40 border-b border-stone-800 flex justify-between items-center">
            <h2 className="text-lg font-black uppercase italic text-white">Gestione Flussi Cassa & Spedizioni</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-900/60 text-[10px] font-black uppercase text-stone-500 tracking-widest">
                <tr>
                  <th className="px-8 py-5">Annuncio</th>
                  <th className="px-8 py-5">Compratore</th>
                  <th className="px-8 py-5">Stato & Spedizione</th>
                  <th className="px-8 py-5 text-right">Intervento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/50">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={tx.announcements?.image_url} className="w-12 h-12 rounded-xl object-cover border border-stone-700" alt="img" />
                        <div>
                          <p className="font-black text-white uppercase text-sm italic">{tx.announcements?.title}</p>
                          <p className="text-[10px] text-stone-500 font-bold">€ {tx.announcements?.price}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-stone-400">{tx.buyer?.email}</p>
                      <p className="text-[9px] text-stone-600 mt-1 uppercase">Venditore: {tx.seller?.email}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-3">
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-md w-fit ${
                          tx.status === 'Pagato' ? 'bg-orange-500/20 text-orange-400' : 
                          tx.status === 'Spedito' ? 'bg-blue-500/20 text-blue-400' :
                          tx.status === 'Ricevuto' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>{tx.status}</span>
                        
                        {/* AGGIUNTO: Modulo Spedizione visibile se pagato o già spedito */}
                        {(tx.status === 'Pagato' || tx.status === 'Spedito') && (
                          <div className="flex flex-col gap-2 w-48">
                            <input id={`cour-${tx.id}`} defaultValue={tx.courier_name} placeholder="Corriere (es. BRT)" className="bg-stone-900 text-[10px] font-bold text-white p-2 rounded-lg border border-stone-700 outline-none focus:border-emerald-500" />
                            <input id={`track-${tx.id}`} defaultValue={tx.tracking_number} placeholder="N. Spedizione" className="bg-stone-900 text-[10px] font-bold text-white p-2 rounded-lg border border-stone-700 outline-none focus:border-emerald-500" />
                            <button 
                              onClick={() => {
                                const c = (document.getElementById(`cour-${tx.id}`) as HTMLInputElement).value;
                                const t = (document.getElementById(`track-${tx.id}`) as HTMLInputElement).value;
                                updateShipping(tx.id, c, t, "REV-" + tx.id.substring(0,8).toUpperCase());
                              }}
                              className="bg-stone-800 hover:bg-emerald-600 text-stone-400 hover:text-white text-[9px] font-black uppercase p-2 rounded-lg transition-colors border border-stone-700 hover:border-emerald-500 mt-1"
                            >
                              {tx.status === 'Spedito' ? 'Aggiorna Dati' : 'Salva & Segna Spedito'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right align-top">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => forceStatus(tx.id, 'Ricevuto')} className="bg-emerald-500 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase">Sblocca</button>
                        <button onClick={() => forceStatus(tx.id, 'Rimborsato')} className="bg-rose-500 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase">Refund</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* GESTIONE UTENTI */}
          <div className="bg-stone-800/40 rounded-[2.5rem] border border-stone-800 overflow-hidden">
            <div className="p-8 bg-stone-900/40 border-b border-stone-800"><h2 className="text-lg font-black uppercase italic text-white">Anagrafica & Sicurezza</h2></div>
            <div className="max-h-[600px] overflow-y-auto">
              {profiles.map(p => (
                <div key={p.id} className="p-6 border-b border-stone-800/50 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="font-black text-white text-sm">{p.email}</p>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">{p.city || 'Città non impostata'}</p>
                  </div>
                  <button onClick={() => viewUserDetails(p)} className="bg-blue-500/10 border border-blue-500/40 text-blue-400 hover:bg-blue-500 hover:text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all">Ispeziona</button>
                </div>
              ))}
            </div>
          </div>

          {/* GESTIONE RECENSIONI */}
          <div className="bg-stone-800/40 rounded-[2.5rem] border border-stone-800 overflow-hidden">
            <div className="p-8 bg-stone-900/40 border-b border-stone-800"><h2 className="text-lg font-black uppercase italic text-white">Feedback Community</h2></div>
            <div className="max-h-[600px] overflow-y-auto p-6 space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-stone-900/50 p-5 rounded-3xl border border-stone-700/50 relative group">
                  <button onClick={() => deleteReview(r.id)} className="absolute top-4 right-4 text-stone-600 hover:text-rose-500 text-xl transition-colors">&times;</button>
                  <p className="text-[9px] font-black uppercase text-stone-500 mb-2">Da: {r.reviewer?.email} → Per: {r.reviewed?.email}</p>
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < r.rating ? 'text-yellow-500' : 'text-stone-700'}>★</span>
                    ))}
                  </div>
                  <p className="text-xs text-stone-300 italic font-medium leading-relaxed">"{r.comment}"</p>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-center text-stone-600 text-xs py-10 uppercase font-black">Nessuna recensione da moderare.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* MODALE DI ISPEZIONE TOTALE (IL CUORE DELLO STAFF) */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-[3rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            
            <div className="p-10 border-b border-stone-800 flex justify-between items-center bg-stone-900">
              <div>
                <h2 className="text-3xl font-black uppercase italic text-white">Profilo Sotto Lente</h2>
                <p className="text-rose-500 text-xs font-bold uppercase tracking-[0.3em] mt-1">{selectedUser.email}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-500 hover:text-white text-5xl transition-colors leading-none">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              
              {/* Griglia Dati in Italiano */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { l: '📧 Indirizzo Email', v: selectedUser.email },
                  { l: '👤 Nome', v: selectedUser.first_name || 'Non inserito' },
                  { l: '👥 Cognome', v: selectedUser.last_name || 'Non inserito' },
                  { l: '🏙️ Città', v: selectedUser.city || 'Non inserito' },
                  { l: '📍 Indirizzo', v: selectedUser.address || 'Non inserito' },
                  { l: '📅 Data Iscrizione', v: new Date(selectedUser.created_at).toLocaleString('it-IT') },
                  { l: '🛡️ Ruolo Sistema', v: selectedUser.role || 'user' },
                  { l: '🆔 ID Database', v: selectedUser.id },
                  { l: '💳 Stripe Connect', v: selectedUser.stripe_account_id || 'Account non collegato' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-stone-800 p-5 rounded-2xl border border-stone-700/50">
                    <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-2">{item.l}</p>
                    <p className="text-sm font-bold text-white truncate">{item.v}</p>
                  </div>
                ))}
              </div>

              {/* Sezione Spy Chat */}
              <div>
                <h3 className="text-[11px] font-black uppercase text-blue-400 tracking-[0.3em] mb-6 flex items-center gap-3">
                  <span className="w-10 h-[1px] bg-blue-500/30"></span> 
                  Cronologia Chat (Sola Lettura)
                </h3>
                <div className="space-y-4">
                  {userMessages.length === 0 ? (
                    <p className="text-stone-600 text-xs italic text-center py-10 bg-stone-800/30 rounded-3xl border border-dashed border-stone-700">L'utente non ha ancora scambiato messaggi sulla piattaforma.</p>
                  ) : (
                    userMessages.map(msg => (
                      <div key={msg.id} className={`p-5 rounded-[2rem] text-sm border flex flex-col ${msg.sender_id === selectedUser.id ? 'bg-stone-800 border-stone-700 ml-12' : 'bg-stone-900 border-stone-800 mr-12'}`}>
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${msg.sender_id === selectedUser.id ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {msg.sender_id === selectedUser.id ? 'Messaggio Inviato' : 'Messaggio Ricevuto'}
                          </span>
                          <span className="text-[9px] font-bold text-stone-600 uppercase">{new Date(msg.created_at).toLocaleString('it-IT')}</span>
                        </div>
                        <p className="text-stone-200 font-medium leading-relaxed italic">"{msg.content}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Zona Pericolosa */}
              <div className="pt-10 border-t border-stone-800 flex flex-wrap gap-4">
                <button onClick={() => deleteChats(selectedUser.id)} className="bg-orange-500/10 border border-orange-500/40 text-orange-500 hover:bg-orange-500 hover:text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                  🔥 Svuota Chat
                </button>
                <button onClick={() => deleteProfile(selectedUser.id)} className="bg-rose-500 text-white hover:bg-rose-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20">
                  ⚠️ Elimina Utente a Cascata
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}