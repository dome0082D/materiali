'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function RealtimeNotifications() {
  const [popupMessage, setPopupMessage] = useState<string | null>(null)

  useEffect(() => {
    let channel: any;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return;

      // Ci mettiamo in ascolto della tabella 'notifications'
      channel = supabase.channel('custom-notification-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}` // Ascoltiamo SOLO le notifiche di questo utente!
          },
          (payload) => {
            // EUREKA! È arrivata una notifica! Mostriamo il popup!
            setPopupMessage(payload.new.message);
            
            // Lo facciamo sparire da solo dopo 6 secondi
            setTimeout(() => {
              setPopupMessage(null);
            }, 6000);
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    }
  }, [])

  if (!popupMessage) return null;

  return (
    <div className="fixed top-24 right-4 z-[9999] bg-stone-900 text-white p-5 rounded-2xl shadow-2xl animate-in slide-in-from-right flex items-center gap-4 border border-rose-500">
      <div className="text-3xl animate-bounce">🔔</div>
      <div>
        <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-1">Nuovo Avviso</h4>
        <p className="text-sm font-black text-white">{popupMessage}</p>
      </div>
      <button onClick={() => setPopupMessage(null)} className="ml-4 text-stone-400 hover:text-white transition-colors">
        ✕
      </button>
    </div>
  )
}