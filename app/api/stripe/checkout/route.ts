export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase'; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-03-25.dahlia" as any,
});

export async function POST(req: Request) {
  try {
    const { items, buyerId } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Il carrello è vuoto" }, { status: 400 });
    }

    // Recupero dell'account Stripe del venditore
    const firstItemId = items[0].id;
    
    const { data: announcement } = await supabase
      .from('announcements')
      .select('user_id')
      .eq('id', firstItemId)
      .single();

    if (!announcement) {
      return NextResponse.json({ error: "Annuncio non trovato nel database" }, { status: 404 });
    }

    // Verifichiamo che il venditore possa ricevere soldi (abbia configurato Stripe)
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', announcement.user_id)
      .single();

    const destinationAccountId = sellerProfile?.stripe_account_id;

    if (!destinationAccountId) {
      return NextResponse.json({ error: "Il venditore non ha ancora abilitato la ricezione dei pagamenti." }, { status: 400 });
    }

    // Creiamo i prodotti per il checkout
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.title,
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: Math.round(item.price * 100), // Conversione in centesimi
      },
      quantity: item.quantity,
    }));

    // CREAZIONE SESSIONE (Modalità Cassaforte / Congelamento Fondi)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      payment_intent_data: {
        // Fondamentale: "Etichettiamo" questo pagamento per poter sbloccare i fondi in futuro
        transfer_group: firstItemId, 
      },
      // Passiamo tutti i dati utili al Webhook
      metadata: {
        type: 'purchase',
        buyerId: buyerId,
        sellerId: announcement.user_id,
        announcementId: firstItemId,
      },
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Errore Stripe Checkout:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}