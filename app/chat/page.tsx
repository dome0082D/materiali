'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({})
  const [activeChatPair, setActiveChatPair] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  const IS_STAFF = user?.email === 'dome0082@gmail.com';

  useEffect(() => { 
    loadInitialData() 
  }, [])

  // SOTTOSCRIZIONE REALTIME: Ascolta nuovi messaggi in diretta
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', table: 'messages', schema: 'public' }, 
        (payload) => {
          setMessages((current) => [...current, payload.new])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Auto-scroll all'ultimo messaggio
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChatPair])

  async function loadInitialData() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) { router.push('/login'); return }
    setUser(currentUser)

    const { data: profs } = await supabase.from('profiles').select('id, first_name, user_serial_id')
    const pMap: Record<string, any> = {}
    if (profs) profs.forEach(p => pMap[p.id] = p)
    setProfilesMap(pMap)

    let query = supabase.from('messages').select('*').order('created_at', { ascending: true })
    if (currentUser.email !== 'dome0082@gmail.com') {
       query = query.or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
    }
    const { data: msgs } = await query
    if (msgs) setMessages(msgs)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeChatPair) return
    const usersInChat = activeChatPair.split('_')
    const receiverId = usersInChat.find(u => u !== user.id) || usersInChat[0]

    await supabase.from('messages').insert([{ 
        content: newMessage, 
        sender_id: user.id, 
        receiver_id: receiverId 
    }])
    setNewMessage('')
  }

  const conversations: Record<string, any[]> = {}
  messages.forEach(m => {
     if (!m.sender_id || !m.receiver_id) return
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
          {activeChatPair ? (
             <button onClick={() => setActiveChatPair(null)} className="text-[10px] font-black uppercase text-stone-400">← Indietro</button>
          ) : (
             <Link href="/" className="text-[10px] font-black uppercase text-stone-400">← Home</Link>
          )}
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto max-w-3xl mx-auto w-full">
        {!activeChatPair && (
          <div className="space-y-3">
             {Object.entries(conversations).map(([pairKey, msgs]) => {
                const u1 = pairKey.split('_')[0]; const u2 = pairKey.split('_')[1];
                const otherUserId = u1 === user?.id ? u2 : u1;
                const otherName = profilesMap[otherUserId]?.first_name || 'Utente';
                const lastMsg = msgs[msgs.length - 1];

                return (
                  <div key={pairKey} onClick={() => setActiveChatPair(pairKey)} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-stone-400 transition-all cursor-pointer flex justify-between items-center">
                     <div>
                        <h3 className="text-sm font-bold text-stone-800 uppercase">{otherName}</h3>
                        <p className="text-xs text-stone-500 truncate italic">"{lastMsg.content}"</p>
                     </div>
                     <span className="text-[18px]">💬</span>
                  </div>
                )
             })}
          </div>
        )}

        {activeChatPair && (
          <div className="space-y-4 pb-24">
            {conversations[activeChatPair]?.map(m => {
              const isMe = m.sender_id === user?.id
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-bold shadow-sm ${isMe ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-800'}`}>
                    {m.content}
                  </div>
                </div>
              )
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {activeChatPair && (
        <div className="p-4 bg-white border-t border-stone-200 fixed bottom-0 w-full left-0">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input value={newMessage} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} onChange={e => setNewMessage(e.target.value)} type="text" placeholder="Scrivi un messaggio..." className="flex-grow p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none focus:border-stone-400" />
            <button onClick={sendMessage} className="bg-stone-900 text-white px-8 rounded-2xl font-black uppercase text-[10px]">Invia</button>
          </div>
        </div>
      )}
    </div>
  )
}
