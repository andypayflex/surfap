import { Resend } from 'resend';
import * as React from 'react';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'SurfsUp <onboarding@resend.dev>';

interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResend().emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      react,
    });

    if (error) {
      console.error(`Resend error sending to ${to}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Email send failed for ${to}:`, message);
    return { success: false, error: message };
  }
}
