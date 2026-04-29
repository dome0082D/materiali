'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SupportoPage() {
  const [user, setUser] = useState<any>(null)
  const [reason, setReason] = useState('Informazioni generali')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
    }
    checkUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)

    // Usiamo la tabella 'disputes' come Help Desk centralizzato per lo Staff
    const { error } = await supabase.from('disputes').insert([{
      buyer_id: user.id,
      // Nessun venditore e nessuna transazione, è una richiesta generica allo staff
      seller_id: null, 
      transaction_id: null,
      reason: `SUPPORTO: ${reason}`,
      description: message,
      status: 'Aperta'
    }])

    if (!error) {
      setSuccess(true)
      setMessage('')
    } else {
      alert('Errore durante l\'invio: ' + error.message)
    }
    setLoading(false)
  }

  if (!user) return null // Il redirect a /login lo gestisce l'useEffect

  return (
    <div className="min-h-screen bg-white font-sans text-stone-900 pb-32">
      {/* HEADER */}
      <div className="w-full py-16 bg-stone-50 border-b border-stone-100 flex items-center justify-center relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl">💬</div>
         <div className="text-center max-w-2xl px-6 relative z-10">
            <h1 className="text-4xl font-black uppercase italic text-stone-900 tracking-tighter mb-2">Supporto Re-love</h1>
            <p className="text-rose-500 font-bold text-[10px] uppercase tracking-[0.3em]">Siamo qui per aiutarti</p>
         </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-12">
        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-[3rem] p-12 text-center animate-in zoom-in duration-300">
            <span className="text-6xl block mb-4">📨</span>
            <h2 className="text-2xl font-black uppercase text-stone-900 mb-2">Messaggio Inviato!</h2>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-8">
              Il nostro Staff ha ricevuto la tua richiesta e ti risponderà il prima possibile.
            </p>
            <button 
              onClick={() => setSuccess(false)} 
              className="bg-stone-900 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-all shadow-md"
            >
              Invia un altro messaggio
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3rem] border border-stone-200 shadow-sm space-y-6">
            <div className="text-center mb-8">
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Compila il modulo sottostante</p>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Argomento</label>
              <select 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl font-bold text-sm outline-none mt-1 focus:border-rose-400 cursor-pointer"
              >
                <option>Informazioni generali</option>
                <option>Problema tecnico col sito</option>
                <option>Segnalazione di un utente/annuncio</option>
                <option>Domanda sui pagamenti Stripe</option>
                <option>Altro</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-2">Il tuo messaggio</label>
              <textarea 
                required
                rows={6} 
                placeholder="Scrivi qui la tua domanda o il tuo problema..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl font-medium text-sm outline-none mt-1 resize-none focus:border-rose-400"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-rose-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-stone-900 transition-all disabled:opacity-50 mt-4 shadow-md"
            >
              {loading ? 'Invio in corso...' : 'Invia Messaggio allo Staff'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}