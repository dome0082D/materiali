export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-03-25.dahlia' as any,
});

export async function POST(req: Request) {
  try {
    const { transactionId, action, userId, userRole } = await req.json();

    if (!transactionId || !action || !userId) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    // 1. Recuperiamo i dettagli della transazione
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*, announcements(condition)')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: "Transazione non trovata" }, { status: 404 });
    }

    // ==========================================
    // AZIONE 1: CONFERMA RICEZIONE (SBLOCCO FONDI VENDITA)
    // ==========================================
    if (action === 'confirm_receipt' && userRole === 'buyer') {
      
      // Controllo di sicurezza: solo se i fondi sono bloccati (held) o spediti
      if (transaction.status !== 'Pagato' && transaction.status !== 'Spedito') {
        return NextResponse.json({ error: "L'ordine non è nello stato corretto per essere confermato." }, { status: 400 });
      }

      // Se l'oggetto aveva un prezzo maggiore di 0, sblocchiamo i fondi su Stripe
      if (transaction.amount > 0 && transaction.seller_id) {
        
        // Cerchiamo l'ID Stripe del venditore
        const { data: seller } = await supabase
          .from('profiles')
          .select('stripe_account_id')
          .eq('id', transaction.seller_id)
          .single();

        if (!seller?.stripe_account_id) {
          return NextResponse.json({ error: "Il venditore non ha un account Stripe collegato." }, { status: 400 });
        }

        // Calcoliamo il 90% (Trasformando i test in centesimi per Stripe)
        // Esempio: Se costa 10€, transaction.amount è 10. Il 90% è 9€. In centesimi è 900.
        const sellerShareCents = Math.round((transaction.amount * 0.90) * 100);

        try {
          // Creiamo il Trasferimento verso il venditore!
          await stripe.transfers.create({
            amount: sellerShareCents,
            currency: 'eur',
            destination: seller.stripe_account_id,
            transfer_group: transaction.announcement_id, // Colleghiamo il trasferimento al pagamento originale
          });
          console.log(`Fondi sbloccati: €${sellerShareCents / 100} inviati al venditore.`);
        } catch (stripeErr: any) {
          console.error("Errore sblocco fondi Stripe:", stripeErr);
          return NextResponse.json({ error: "Errore durante il trasferimento dei fondi al venditore." }, { status: 500 });
        }
      }

      // Aggiorniamo lo stato nel database
      await supabase
        .from('transactions')
        .update({ status: 'Concluso' })
        .eq('id', transactionId);

      return NextResponse.json({ success: true, message: "Pacco confermato! I fondi sono stati inviati al venditore." });
    }

    // ==========================================
    // AZIONE 2: CONFERMA BARATTO
    // ==========================================
    if (action === 'confirm_barter') {
      const updateData = userRole === 'buyer' 
        ? { barter_confirmed_buyer: true } 
        : { barter_confirmed_seller: true };

      await supabase.from('transactions').update(updateData).eq('id', transactionId);

      // Verifichiamo se ora l'hanno confermato entrambi
      const { data: checkTx } = await supabase.from('transactions').select('*').eq('id', transactionId).single();
      
      if (checkTx.barter_confirmed_buyer && checkTx.barter_confirmed_seller) {
        await supabase.from('transactions').update({ status: 'Concluso' }).eq('id', transactionId);
        return NextResponse.json({ success: true, message: "Entrambi avete confermato! Scambio concluso." });
      }

      return NextResponse.json({ success: true, message: "Conferma inviata. In attesa dell'altro utente." });
    }

    // ==========================================
    // AZIONE 3: RICHIESTA RIMBORSO / RECLAMO
    // ==========================================
    if (action === 'request_refund') {
      await supabase
        .from('transactions')
        .update({ status: 'In Contestazione' })
        .eq('id', transactionId);

      return NextResponse.json({ success: true, message: "Reclamo aperto. Il team di Re-love analizzerà la situazione. I fondi restano bloccati." });
    }

    return NextResponse.json({ error: "Azione non valida" }, { status: 400 });

  } catch (error: any) {
    console.error("Errore API Ordini:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}