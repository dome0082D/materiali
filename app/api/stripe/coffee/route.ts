export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { 
  apiVersion: '2023-10-16' as any 
});

export async function POST(req: Request) {
  try {
    // RECUPERO I DATI MANDATI DAL FRONTEND (Fondamentale!)
    const { announcementId, buyerId } = await req.json();

    if (!announcementId || !buyerId) {
      return NextResponse.json({ error: "Dati annuncio o utente mancanti" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { 
              name: 'Sblocco Chat Re-love', 
              description: 'Accesso illimitato alla chat per questo annuncio' 
            },
            unit_amount: 250, // 2.50€
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // AGGIUNTO METADATA: Senza questi il Webhook non sblocca nulla!
      metadata: {
        type: 'chat_unlock',
        announcementId: announcementId,
        buyerId: buyerId,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/announcement/${announcementId}?unlocked=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/announcement/${announcementId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Errore Stripe Sblocco Chat:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}