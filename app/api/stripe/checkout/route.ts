export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
// AGGIUNTA: Importiamo Supabase per trovare l'account del venditore
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

    // --- INIZIO AGGIUNTA: Recupero dell'account Stripe del venditore ---
    // Prendiamo l'ID del primo prodotto nel carrello per capire chi lo sta vendendo
    const firstItemId = items[0].id;
    
    // Cerchiamo l'annuncio nel database per trovare l'ID del venditore
    const { data: announcement } = await supabase
      .from('announcements')
      .select('user_id')
      .eq('id', firstItemId)
      .single();

    if (!announcement) {
      return NextResponse.json({ error: "Annuncio non trovato nel database" }, { status: 404 });
    }

    // Cerchiamo il profilo del venditore per recuperare il suo ID Stripe
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', announcement.user_id)
      .single();

    const destinationAccountId = sellerProfile?.stripe_account_id;

    // Se il venditore non ha mai configurato Stripe dal suo profilo, blocchiamo la vendita
    if (!destinationAccountId) {
      return NextResponse.json({ error: "Il venditore non ha ancora abilitato la ricezione dei pagamenti." }, { status: 400 });
    }
    // --- FINE AGGIUNTA ---

    // Trasformiamo i prodotti del tuo cartStore in formato Stripe
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

    // Calcolo del 10% di commissione per la piattaforma
    const totalAmount = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const platformFee = Math.round(totalAmount * 10); // 10% del totale in centesimi

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      payment_intent_data: {
        // Questa è la tua commissione che resta sul tuo account Stripe
        application_fee_amount: platformFee,
        // --- INIZIO AGGIUNTA: Invio dei fondi ---
        // Diciamo a Stripe a chi mandare i soldi (al netto della tua commissione)
        transfer_data: {
          destination: destinationAccountId,
        },
        // --- FINE AGGIUNTA ---
      },
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/`,
      metadata: {
        buyerId,
        productIds: items.map((i: any) => i.id).join(','),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Errore Stripe Checkout:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}