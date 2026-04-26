import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' as any });

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const announcementId = session.metadata?.announcementId || session.metadata?.productId;
    const buyerId = session.metadata?.buyerId;
    const sellerId = session.metadata?.sellerId;
    const checkoutType = session.metadata?.type;

    // ==========================================
    // LOGICA 1: SPONSORIZZAZIONE VETRINA
    // ==========================================
    if (checkoutType === 'sponsorship' && announcementId) {
      const days = 7;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      await supabase
        .from('announcements')
        .update({ is_sponsored: true, sponsored_until: expiryDate.toISOString() })
        .eq('id', announcementId);

      return NextResponse.json({ received: true, sponsorship: true });
    }

    // ==========================================
    // LOGICA 2: SBLOCCO CHAT (CAFFÈ) - AGGIUNTA!
    // ==========================================
    if (checkoutType === 'chat_unlock' && announcementId && buyerId) {
      await supabase
        .from('unlocked_chats')
        .insert([{ 
          user_id: buyerId, 
          announcement_id: announcementId 
        }]);

      console.log(`🔓 Chat sbloccata per l'utente ${buyerId}`);
      return NextResponse.json({ received: true, chat_unlocked: true });
    }

    // ==========================================
    // LOGICA 3: VENDITA OGGETTO (Modificata per non confondersi)
    // ==========================================
    if (announcementId && buyerId && checkoutType !== 'chat_unlock' && checkoutType !== 'sponsorship') {
       // Salva la transazione
       await supabase.from('transactions').insert([{
         announcement_id: announcementId,
         buyer_id: buyerId,
         seller_id: sellerId || null,
         stripe_payment_intent_id: session.payment_intent,
         amount: session.amount_total ? session.amount_total / 100 : 0,
         status: 'held' 
       }]);

       // Scala la quantità
       const { data: ann } = await supabase
         .from('announcements')
         .select('quantity')
         .eq('id', announcementId)
         .single();

       if (ann) {
         const nuovaQuantita = Math.max(0, (ann.quantity || 1) - 1);
         await supabase
           .from('announcements')
           .update({ quantity: nuovaQuantita })
           .eq('id', announcementId);
       }
    }
  }

  return NextResponse.json({ received: true });
}