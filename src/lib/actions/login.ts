
'use server';


import { sendEmail } from '@/lib/email';
import { isAllowedDomain } from '@/lib/types';
import { redirect } from 'next/navigation';

export async function signInWithMagicLink(email: string) {
  if (!isAllowedDomain(email)) {
    return { success: false, error: 'Only @fleapo.com emails are allowed' };
  }

  // Create admin client with service role key for admin operations
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
  
  // Generate OTP/Initial Link
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: {
       redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/auth/confirm`
    }
  });

  if (error) {
    console.error('Error generating link:', error);
    return { success: false, error: error.message };
  }

  const { properties } = data;
  const magicLink = properties?.action_link;

  if (!magicLink) {
     return { success: false, error: 'Failed to generate magic link' };
  }

  // Send via Resend
  const emailResult = await sendEmail({
    to: email,
    subject: 'Sign in to Fleapo Docs',
    html: `
      <h1>Welcome back!</h1>
      <p>Click the link below to sign in to Fleapo Docs:</p>
      <a href="${magicLink}" style="display: inline-block; background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Sign In</a>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `
  });

  if (!emailResult.success) {
    return { success: false, error: 'Failed to send email. please try again.' };
  }

  return { success: true };
}
