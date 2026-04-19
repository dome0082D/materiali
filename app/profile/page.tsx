'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stripeLoading, setStripeLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      router.push('/login')
      return
    }
    setUser(currentUser)

    const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
    setProfile(data)
    setLoading(false)
  }

  // FUNZIONE PER L'ONBOARDING DI STRIPE (COLLEGARE IBAN)
  async function handleStripeOnboarding() {
    setStripeLoading(true)
    try {
      const res = await fetch('/api/stripe/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email })
      })
      const data = await res.json()
      
      if (data.url) {
        // Prima di andare su Stripe, salviamo l'accountId nel DB se non c'è
        if (!profile.stripe_account_id) {
          await supabase.from('profiles').update({ stripe_account_id: data.accountId }).eq('id', user.id)
        }
        window.location.href = data.url
      } else {
        alert("Errore Stripe: " + data.error)
      }
    } catch (err) {
      alert("Errore durante il collegamento a Stripe.")
    } finally {
      setStripeLoading(false)
    }
  }

  if (loading) return <div className="p-10 text-center font-black uppercase text-xs">Caricamento profilo...</div>

  return (
    <div className="min-h-screen bg-stone-50 p-6 font-sans text-stone-900">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* INTESTAZIONE E DATI PERSONALI */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-stone-900"></div>
          <h1 className="text-3xl font-black uppercase italic text-stone-900 mb-6">Il Mio Profilo</h1>
          
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-black uppercase text-stone-400">Nome Completo</p>
              <p className="text-sm font-bold">{profile?.first_name} {profile?.last_name}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-stone-400">Email di contatto</p>
              <p className="text-sm font-bold">{user?.email}</p>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-[9px] font-black uppercase text-stone-400">Città</p>
                <p className="text-sm font-bold uppercase">{profile?.city || 'Non specificata'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-stone-400">ID Utente</p>
                <p className="text-sm font-bold">#{profile?.user_serial_id || '---'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SEZIONE PAGAMENTI (STRIPE CONNECT) */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm">
          <h2 className="text-lg font-black uppercase italic text-stone-900 mb-2">Ricezione Pagamenti</h2>
          <p className="text-[10px] text-stone-500 mb-6 uppercase font-bold leading-relaxed">
            Per vendere oggetti e ricevere i soldi sul tuo conto, devi configurare il tuo portafoglio Stripe.
          </p>

          {profile?.stripe_onboarding_complete ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-700">Conto Stripe Collegato</p>
                <p className="text-[9px] text-emerald-600 font-bold">Sei pronto a ricevere pagamenti sicuri.</p>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleStripeOnboarding}
              disabled={stripeLoading}
              className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all shadow-md"
            >
              {stripeLoading ? 'Connessione a Stripe...' : 'Attiva Ricezione Pagamenti'}
            </button>
          )}
        </div>

        {/* MENU RAPIDO NAVIGAZIONE */}
        <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/acquisti" className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:border-stone-900 transition-all group">
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">📦</span>
                <p className="text-[10px] font-black uppercase text-stone-900">I Miei Acquisti</p>
            </Link>
            <Link href="/dashboard/preferiti" className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:border-stone-900 transition-all group">
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">❤️</span>
                <p className="text-[10px] font-black uppercase text-stone-900">I Miei Preferiti</p>
            </Link>
        </div>

        <div className="pt-8 text-center">
          <Link href="/" className="text-[10px] font-black uppercase text-stone-300 hover:text-stone-900 transition-colors">← Torna alla Vetrina</Link>
        </div>

      </div>
    </div>
  )
}
