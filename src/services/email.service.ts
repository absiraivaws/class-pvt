import nodemailer from "nodemailer";

const from = process.env.EMAIL_FROM || "no-reply@example.com";

async function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const transporter = await getTransporter();

  if (!transporter) {
    // Development fallback: log the email instead of sending.
    console.log("\n--------- [DEV EMAIL] ---------");
    console.log(`To:      ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Body:\n${payload.text}`);
    console.log("--------------------------------\n");
    return;
  }

  await transporter.sendMail({ from, ...payload });
}
