import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey && process.env.NODE_ENV !== 'production') {
  // Helpful reminder during development
  console.info(
    '[Resend Info] RESEND_API_KEY is not set in environment variables. Email service will run in simulated mode.'
  );
}

export const resend = apiKey ? new Resend(apiKey) : null;

export const DEFAULT_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'Tiệm Nhỏ <onboarding@resend.dev>';
