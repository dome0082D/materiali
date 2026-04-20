import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' as any });

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event;
  try {
    // In produzione aggiungerai STRIPE_WEBHOOK_SECRET nel file .env.local
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Se il pagamento è andato a buon fine
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Per sicurezza leggiamo sia announcementId che productId (a seconda di come l'avevi chiamato)
    const announcementId = session.metadata?.announcementId || session.metadata?.productId;
    const buyerId = session.metadata?.buyerId;
    const sellerId = session.metadata?.sellerId;

    if (announcementId && buyerId) {
       // 1. Salva la transazione nel DB (Lo storico per "I miei acquisti/vendite")
       await supabase.from('transactions').insert([{
         announcement_id: announcementId,
         buyer_id: buyerId,
         seller_id: sellerId || null,
         stripe_payment_intent_id: session.payment_intent,
         amount: session.amount_total ? session.amount_total / 100 : 0,
         status: 'held' 
       }]);

       // 2. SCALA LA QUANTITÀ DELL'OGGETTO VENDUTO IN AUTOMATICO
       // Prima legge quanti ce ne sono nel database
       const { data: ann } = await supabase
         .from('announcements')
         .select('quantity')
         .eq('id', announcementId)
         .single();

       if (ann) {
         // Sottrae 1 alla quantità (e si assicura di non scendere mai sotto lo zero)
         const nuovaQuantita = Math.max(0, (ann.quantity || 1) - 1);
         
         // Aggiorna l'oggetto nel database con la nuova scorta
         await supabase
           .from('announcements')
           .update({ quantity: nuovaQuantita })
           .eq('id', announcementId);
       }
    }
  }

  return NextResponse.json({ received: true });
}
