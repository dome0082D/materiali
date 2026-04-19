import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' as any });

export async function POST(req: Request) {
  try {
    const { transactionId, buyerId } = await req.json();

    // 1. Verifica che la transazione esista, sia in sospeso e appartenga all'acquirente
    const { data: trx, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('buyer_id', buyerId)
      .eq('status', 'held')
      .single();

    if (error || !trx) {
      return NextResponse.json({ error: "Transazione non trovata o già sbloccata." }, { status: 400 });
    }

    // 2. Comunica a Stripe di rilasciare i fondi.
    // N.B: Questo esegue in automatico il Transfer al venditore e ti lascia il 10% di Fee 
    // in base alle regole che abbiamo settato in fase di Checkout.
    await stripe.paymentIntents.capture(trx.stripe_payment_intent_id);

    // 3. Aggiorna lo stato nel database su 'completato' (come richiesto)
    await supabase
      .from('transactions')
      .update({ status: 'completato' })
      .eq('id', transactionId);

    return NextResponse.json({ success: true, message: "Fondi sbloccati e inviati al venditore." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
