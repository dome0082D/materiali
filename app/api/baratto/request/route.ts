import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Inizializza Stripe con la tua chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
  apiVersion: '2025-03-25.dahlia' 
});

// Inizializza Supabase (Usa la Service Role Key per fare query sicure lato server)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userA_id, userB_id, item_id } = await req.json();

    // 1. Crea il PaymentIntent Manuale per Utente A
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 250, // 2.50€ in centesimi
      currency: 'eur',
      payment_method_types: ['card'],
      capture_method: 'manual', // FONDAMENTALE: Solo Pre-autorizzazione!
      metadata: { 
        type: 'baratto_auth',
        item_id: item_id, 
        user_a: userA_id 
      },
    });

    // 2. Salva la richiesta di baratto nel tuo Database Supabase
    const { error } = await supabase.from('baratti').insert({
      item_id: item_id,
      user_a_id: userA_id,
      user_b_id: userB_id,
      stripe_pi_user_a: paymentIntent.id, // Salviamo l'ID per catturarlo dopo
      status: 'pending_user_b' // In attesa dell'Utente B
    });

    if (error) throw error;

    // Ritorna il client_secret. Nel frontend userai questo segreto 
    // dentro Stripe Elements per far inserire la carta all'Utente A
    return NextResponse.json({ 
      success: true, 
      clientSecret: paymentIntent.client_secret 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}