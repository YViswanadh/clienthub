import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initializing the Resend SDK. Fallback placeholder avoids crashes during skeleton verification
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export const sendEmail = async ({ to, subject, html, attachments }) => {
  try {
    const data = await resend.emails.send({
      from: 'ClientHub <noreply@clienthub.dev>',
      to,
      subject,
      html,
      attachments,
    });
    return data;
  } catch (error) {
    console.error('Resend email dispatch error:', error.message);
    throw error;
  }
};
