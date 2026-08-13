import { Resend } from "resend";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Easer email] to=${to} subject=${subject}`);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from:
      process.env.EMAIL_FROM ||
      "Easer Financial Planner <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  await send(
    to,
    "Verify your Easer Financial Planner email",
    `<p>Welcome to Easer Financial Planner.</p>
     <p><a href="${url}">Verify your email</a></p>
     <p>If you did not create an account, you can ignore this message.</p>`
  );
}

export async function sendResetEmail(to: string, token: string) {
  const url = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  await send(
    to,
    "Reset your Easer Financial Planner password",
    `<p><a href="${url}">Reset your password</a></p>
     <p>This link expires in 1 hour. If you did not request a reset, ignore this email.</p>`
  );
}
