'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ChatListPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isStaff, setIsStaff] = useState(false)

  useEffect(() => { loadChats() }, [])

  async function loadChats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const staffMode = user.email === 'dome0082@gmail.com'
    setIsStaff(staffMode)

    // Logica: Se sei Staff, carichi TUTTI i messaggi. Altrimenti solo i tuoi.
    let query = supabase.from('messages').select('*, announcement_id(title)').order('created_at', { ascending: false })
    if (!staffMode) {
      query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    }

    const { data } = await query
    
    if (data) {
      // Raggruppa i messaggi per mostrare solo l'ultimo per ogni annuncio/coppia
      const uniqueChats = data.reduce((acc: any[], current: any) => {
        const uniqueKey = `${current.announcement_id?.title}-${current.sender_id}-${current.receiver_id}`
        if (!acc.some(item => `${item.announcement_id?.title}-${item.sender_id}-${item.receiver_id}` === uniqueKey)) {
          acc.push(current)
        }
        return acc
      }, [])
      setConversations(uniqueChats)
    }
    setLoading(false)
  }

  async function deleteMessage(id: string) {
    if(!confirm("STAFF: Sicuro di voler cancellare questa chat?")) return
    await supabase.from('messages').delete().eq('id', id)
    setConversations(conversations.filter(c => c.id !== id))
  }

  return (
    <div className="min-h-screen bg-slate-200 p-4 md:p-10 font-sans">
      <main className="bg-white max-w-4xl mx-auto rounded-3xl shadow-2xl overflow-hidden border border-slate-200 min-h-[70vh]">
        <div className={`p-8 text-white flex justify-between items-center ${isStaff ? 'bg-red-700' : 'bg-slate-800'}`}>
          <div>
            <Link href="/" className="text-[9px] font-black text-slate-300 hover:text-white uppercase mb-4 block">← Home</Link>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">{isStaff ? 'STAFF: SPIA TUTTE LE CHAT' : 'I Miei Messaggi'}</h1>
          </div>
          {isStaff && <div className="bg-red-900 px-4 py-2 rounded-lg border border-red-500"><span className="text-[10px] font-black text-white uppercase tracking-widest">Modalità Spia</span></div>}
        </div>

        <div className="p-6 space-y-3">
          {loading ? (
             <div className="py-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest">Sincronizzazione...</div>
          ) : conversations.length > 0 ? (
            conversations.map((c, i) => (
              <div key={i} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${isStaff ? 'bg-red-50 border-red-100' : 'bg-slate-50 hover:border-sky-500'}`}>
                <div className="flex-grow">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase tracking-tight">Annuncio: <span className={isStaff ? 'text-red-600' : 'text-sky-600'}>{c.announcement_id?.title || 'Generico'}</span></span>
                    <span className="text-[9px] font-bold text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 italic">"{c.content}"</p>
                </div>
                {isStaff ? (
                  <button onClick={() => deleteMessage(c.id)} className="ml-4 bg-red-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-red-700">Elimina Chat</button>
                ) : (
                  <Link href={`/chat/${c.sender_id === myId ? c.receiver_id : c.sender_id}?ann=${c.announcement_id?.id}`} className="ml-4 bg-sky-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-sky-500">Rispondi</Link>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-slate-400 font-black uppercase py-20">Nessuna chat attiva</p>
          )}
        </div>
      </main>
    </div>
  )
}
