import { Resend } from 'resend';

// You need to add RESEND_API_KEY to your .env.local
// Get one for free at https://resend.com
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const data = await resend.emails.send({
      from: 'Fleapo Docs <onboarding@resend.dev>', // Default testing domain. Verify your own domain for production.
      to,
      subject,
      html,
      text,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
