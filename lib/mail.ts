// lib/mail.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendReLoveEmail = async (to: string, subject: string, title: string, body: string, buttonText?: string, buttonUrl?: string) => {
  try {
    await resend.emails.send({
      from: 'Re-love <onboarding@resend.dev>', // Poi potrai configurare il tuo dominio (es. info@re-love.it)
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 24px; overflow: hidden;">
          <div style="background: linear-gradient(to right, #f43f5e, #fb923c); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; text-transform: uppercase; font-style: italic; margin: 0; letter-spacing: -1px;">Re-love</h1>
          </div>
          <div style="padding: 40px; background-color: white;">
            <h2 style="color: #1c1917; text-transform: uppercase; font-style: italic; font-size: 20px;">${title}</h2>
            <p style="color: #78716c; line-height: 1.6; font-size: 14px;">${body}</p>
            ${buttonText ? `
              <div style="margin-top: 30px; text-align: center;">
                <a href="${buttonUrl}" style="background-color: #1c1917; color: white; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 900; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">${buttonText}</a>
              </div>
            ` : ''}
          </div>
          <div style="background-color: #fafaf9; padding: 20px; text-align: center; border-top: 1px solid #f5f5f4;">
            <p style="color: #a8a29e; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0;">
              Re-love: Riusa, Scambia, Regala.
            </p>
          </div>
        </div>
      `
    });
  } catch (error) {
    console.error("Errore invio email:", error);
  }
};