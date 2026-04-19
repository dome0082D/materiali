'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ChatDetailPage() {
  const { id: receiver_id } = useParams()
  const searchParams = useSearchParams()
  const ann_id = searchParams.get('ann')
  
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [myId, setMyId] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { 
    setup()
    // Autoscroll alla fine dei messaggi
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function setup() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setMyId(user.id)

    const { data } = await supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    
    if (data) setMessages(data)
  }

  async function sendMessage() {
    if (!newMsg.trim()) return
    const { data, error } = await supabase.from('messages').insert([{
      sender_id: myId, 
      receiver_id: receiver_id,
      announcement_id: ann_id, 
      content: newMsg
    }]).select()

    if (!error && data) {
      setMessages([...messages, data[0]])
      setNewMsg('')
    }
  }

  return (
    <div className="min-h-screen bg-stone-200 p-4 md:p-10 font-sans flex flex-col items-center">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden border">
        
        {/* HEADER CHAT */}
        <div className="p-6 border-b bg-stone-900 text-white flex justify-between items-center">
          <Link href="/chat" className="text-[10px] font-black uppercase text-stone-400 hover:text-white transition-colors">← Indietro</Link>
          <span className="font-black uppercase text-xs tracking-widest italic text-emerald-400">Canale Sicuro</span>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        </div>
        
        {/* AREA MESSAGGI */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-stone-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender_id === myId ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-bold shadow-sm ${m.sender_id === myId ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-stone-800 rounded-tl-none border'}`}>
                {m.content}
                <span className="block text-[8px] mt-2 opacity-50 text-right uppercase font-black">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* INPUT INVIO */}
        <div className="p-6 border-t bg-white flex gap-3">
          <input 
            className="flex-grow p-4 bg-stone-100 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all" 
            placeholder="Scrivi un messaggio..." 
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} className="bg-stone-900 text-white px-8 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all">Invia</button>
        </div>
      </div>
    </div>
  )
}
