'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert("Errore: " + error.message)
    else alert("Controlla la tua email per confermare!")
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 md:p-2 lg:p-3 flex flex-col items-center">
      <div className="bg-[#fafafa] w-full max-w-[1920px] mx-auto md:rounded-2xl border-slate-200/80 md:border shadow-sm min-h-screen md:min-h-[calc(100vh-1.5rem)] overflow-hidden flex items-center justify-center p-6">
        
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-serif text-slate-800 tracking-tight mb-2">MATERIALI</h1>
            <p className="text-slate-400 text-sm font-light">Accedi o crea un account</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 ml-1">Indirizzo Email</label>
              <input 
                type="email" 
                className="w-full p-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-1 focus:ring-sky-300 outline-none transition-all text-slate-700 text-sm font-light" 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 ml-1">Password</label>
              <input 
                type="password" 
                className="w-full p-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-1 focus:ring-sky-300 outline-none transition-all text-slate-700 text-sm font-light" 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-sky-500 text-white py-2.5 rounded-full text-xs font-medium hover:bg-sky-400 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Attendi...' : 'Registrati / Accedi'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-slate-400 text-xs font-light hover:text-slate-600 transition">
              ← Torna alla Home
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
