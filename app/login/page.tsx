'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const router = useRouter();

  // Funzione per la Registrazione (Nuovo utente)
  const handleSignUp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Registrazione completata! Controlla la tua email per confermare.', type: 'success' });
    }
    setLoading(false);
  };

  // Funzione per il Login (Utente esistente)
  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ text: 'Credenziali non valide o email non confermata.', type: 'error' });
    } else {
      setMessage({ text: 'Accesso effettuato!', type: 'success' });
      router.push('/'); // Riporta l'utente alla Home Page dopo il login
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/">
          <h2 className="text-center text-4xl font-extrabold text-gray-900 cursor-pointer tracking-tighter">
            MATERIALI
          </h2>
        </Link>
        <h2 className="mt-6 text-center text-xl text-gray-700 font-medium">
          Accedi o crea un account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-8 shadow-xl sm:rounded-xl border border-gray-100">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Indirizzo Email</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Messaggi di Errore o Successo */}
            {message.text && (
              <div className={`p-4 text-sm rounded-md border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Attendere...' : 'Accedi'}
              </button>
              
              <button
                onClick={handleSignUp}
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-sky-600 rounded-md shadow-sm text-sm font-medium text-sky-600 bg-white hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-colors"
              >
                Registrati
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
