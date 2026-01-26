import { Resend } from 'resend';

// Check if API key is present
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not set in environment variables!');
  console.error('Please add RESEND_API_KEY to your Render dashboard');
} else {
  console.log('✅ RESEND_API_KEY found (length:', process.env.RESEND_API_KEY.length, 'chars)');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log(`[RESEND] Attempting to send email to: ${to}`);
    console.log(`[RESEND] Subject: ${subject}`);

    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Stocky <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    });

    console.log('✅ Email sent successfully via Resend');
    console.log('📧 Full Resend response:', JSON.stringify(data, null, 2));
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Resend email send failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    throw error;
  }
};

console.log('✅ Resend Email Service Initialized');
