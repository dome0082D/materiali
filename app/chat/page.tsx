'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({})
  const [activeChatPair, setActiveChatPair] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const router = useRouter()
  
  const IS_STAFF = user?.email === 'dome0082@gmail.com';

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) { router.push('/login'); return }
    setUser(currentUser)

    // Carica tutti i profili per visualizzare i nomi
    const { data: profs } = await supabase.from('profiles').select('id, first_name, last_name, user_serial_id')
    const pMap: Record<string, any> = {}
    if (profs) profs.forEach(p => pMap[p.id] = p)
    setProfilesMap(pMap)

    // Carica messaggi
    let query = supabase.from('messages').select('*').order('created_at', { ascending: true })
    if (currentUser.email !== 'dome0082@gmail.com') {
       query = query.or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
    }
    const { data: msgs } = await query
    if (msgs) setMessages(msgs)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeChatPair) return
    
    // Identifica il destinatario a partire dalla coppia attiva
    const usersInChat = activeChatPair.split('_')
    const receiverId = usersInChat.find(u => u !== user.id) || usersInChat[0]

    await supabase.from('messages').insert([{ content: newMessage, sender_id: user.id, receiver_id: receiverId }])
    setNewMessage('')
    loadData()
  }

  // LOGICA DI RAGGRUPPAMENTO CHAT PER CONVERSAZIONE/UTENTI
  const conversations: Record<string, any[]> = {}
  messages.forEach(m => {
     if (!m.sender_id || !m.receiver_id) return
     // Crea una chiave univoca per la coppia di utenti a prescindere da chi ha iniziato
     const pair = [m.sender_id, m.receiver_id].sort().join('_')
     if (!conversations[pair]) conversations[pair] = []
     conversations[pair].push(m)
  })

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <div className="bg-white p-6 border-b border-stone-200 flex justify-between items-center shadow-sm z-10">
        <h1 className="text-xl font-black uppercase italic text-stone-900">
           {activeChatPair ? 'Conversazione' : 'Tutte le Chat'}
        </h1>
        <div className="flex gap-4 items-center">
          {IS_STAFF && <span className="text-[8px] bg-emerald-500 text-white px-3 py-1 rounded uppercase font-black tracking-widest">Modalità Staff</span>}
          {activeChatPair ? (
             <button onClick={() => setActiveChatPair(null)} className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-900">← Indietro</button>
          ) : (
             <Link href="/" className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-900">← Home</Link>
          )}
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto max-w-3xl mx-auto w-full">
        
        {/* VISTA 1: LISTA DELLE CONVERSAZIONI */}
        {!activeChatPair && (
          <div className="space-y-3">
             {Object.entries(conversations).map(([pairKey, msgs]) => {
                const u1 = pairKey.split('_')[0]
                const u2 = pairKey.split('_')[1]
                const name1 = profilesMap[u1]?.first_name || 'Utente Sconosciuto'
                const name2 = profilesMap[u2]?.first_name || 'Utente Sconosciuto'
                const lastMsg = msgs[msgs.length - 1]

                return (
                  <div key={pairKey} onClick={() => setActiveChatPair(pairKey)} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-stone-400 transition-all cursor-pointer">
                     <p className="text-[10px] font-black uppercase text-stone-400 mb-2">Conversazione tra:</p>
                     <h3 className="text-sm font-bold text-stone-800 uppercase mb-2">{name1} & {name2}</h3>
                     <p className="text-xs text-stone-500 truncate italic">Ultimo msg: "{lastMsg.content}"</p>
                  </div>
                )
             })}
             {Object.keys(conversations).length === 0 && <p className="text-xs text-stone-400 font-bold uppercase text-center mt-10">Nessuna conversazione attiva.</p>}
          </div>
        )}

        {/* VISTA 2: MESSAGGI DELLA CHAT SELEZIONATA */}
        {activeChatPair && (
          <div className="space-y-4 pb-20">
            {conversations[activeChatPair]?.map(m => {
              const isMe = m.sender_id === user?.id
              const senderName = profilesMap[m.sender_id]?.first_name || 'Utente'
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[8px] font-black uppercase text-stone-400 mb-1 ml-1">{senderName}</span>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-bold shadow-sm ${isMe ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-800'}`}>
                    {m.content}
                  </div>
                  {IS_STAFF && <button onClick={async () => { await supabase.from('messages').delete().eq('id', m.id); loadData() }} className="text-[7px] font-black text-red-500 uppercase mt-1 opacity-50 hover:opacity-100">Cancella (Staff)</button>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* BARRA DI TESTO (Visibile solo se si è dentro una chat) */}
      {activeChatPair && (
        <div className="p-4 bg-white border-t border-stone-200 fixed bottom-0 w-full left-0">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} type="text" placeholder="Scrivi un messaggio..." className="flex-grow p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none focus:border-stone-400" />
            <button onClick={sendMessage} className="bg-stone-900 text-white px-8 rounded-2xl font-black uppercase text-[10px] hover:bg-emerald-600 transition-colors">Invia</button>
          </div>
        </div>
      )}
    </div>
  )
}
