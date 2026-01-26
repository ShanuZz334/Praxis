import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Stocky <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    });

    console.log('✅ Email sent successfully via Resend:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Resend email send failed:', error);
    throw error;
  }
};

console.log('✅ Resend Email Service Initialized');
