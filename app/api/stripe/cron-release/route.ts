import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase'; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' as any });

export async function GET(req: Request) {
   // Misura di sicurezza: assicurati che la chiamata provenga solo dal tuo Cron Job
   if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
       return NextResponse.json({ error: 'Accesso negato' }, { status: 401 });
   }

   try {
       // 1. Calcola la data limite (15 giorni fa)
       const timeLimit = new Date();
       timeLimit.setDate(timeLimit.getDate() - 15);

       // 2. Trova tutte le transazioni ancora in sospeso vecchie di 15 giorni
       const { data: transactions } = await supabase
           .from('transactions')
           .select('*')
           .eq('status', 'held')
           .lt('created_at', timeLimit.toISOString());

       if (!transactions || transactions.length === 0) {
           return NextResponse.json({ message: "Nessuna transazione scaduta da sbloccare." });
       }

       let releasedCount = 0;

       // 3. Esegui il ciclo per catturare i fondi e pagare i venditori in automatico
       for (const trx of transactions) {
           try {
               await stripe.paymentIntents.capture(trx.stripe_payment_intent_id);
               await supabase.from('transactions').update({ status: 'completato' }).eq('id', trx.id);
               releasedCount++;
           } catch (err) {
               console.error(`Errore sblocco transazione ${trx.id}:`, err);
           }
       }

       return NextResponse.json({ success: true, released: releasedCount });
   } catch (error: any) {
       return NextResponse.json({ error: error.message }, { status: 500 });
   }
}
