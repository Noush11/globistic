import nodemailer from "nodemailer";
import { env, isEmailConfigured } from "./env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.password }
    });
  }
  return transporter;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
}

// Sends an email; in dev (or when SMTP is unconfigured) it logs instead.
export async function sendMail({ to, subject, html }: MailInput): Promise<void> {
  if (!isEmailConfigured()) {
    console.info(`[email:dev] To: ${to} | Subject: ${subject}`);
    return;
  }
  await getTransporter().sendMail({ from: env.smtp.from, to, subject, html });
}

// ─── Templated transactional emails ────────────────────────────

function layout(title: string, body: string) {
  return `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
    <div style="background:#1f59e0;padding:20px 24px;border-radius:12px 12px 0 0">
      <h1 style="color:#fff;margin:0;font-size:20px">Globistic</h1>
    </div>
    <div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 12px 12px">
      <h2 style="margin-top:0">${title}</h2>
      ${body}
      <p style="color:#888;font-size:12px;margin-top:32px">
        Globistic Custom Apparel · This is an automated message.
      </p>
    </div>
  </div>`;
}

export async function sendOrderConfirmation(opts: {
  to: string;
  name: string;
  orderNumber: string;
  total: string;
}) {
  await sendMail({
    to: opts.to,
    subject: `Order confirmed — ${opts.orderNumber}`,
    html: layout(
      "Thanks for your order!",
      `<p>Hi ${opts.name},</p>
       <p>We've received your order <strong>${opts.orderNumber}</strong> and started getting it ready.</p>
       <p><strong>Total paid:</strong> ${opts.total}</p>
       <p>We'll email you again when it ships.</p>`
    )
  });
}

export async function sendPaymentConfirmation(opts: {
  to: string;
  orderNumber: string;
  total: string;
}) {
  await sendMail({
    to: opts.to,
    subject: `Payment received — ${opts.orderNumber}`,
    html: layout(
      "Payment received",
      `<p>We've successfully processed your payment of <strong>${opts.total}</strong> for order <strong>${opts.orderNumber}</strong>.</p>`
    )
  });
}

export async function sendShippingUpdate(opts: {
  to: string;
  orderNumber: string;
  status: string;
  trackingNumber?: string | null;
}) {
  await sendMail({
    to: opts.to,
    subject: `Update on your order ${opts.orderNumber}`,
    html: layout(
      "Order update",
      `<p>Your order <strong>${opts.orderNumber}</strong> is now <strong>${opts.status}</strong>.</p>
       ${opts.trackingNumber ? `<p>Tracking number: <strong>${opts.trackingNumber}</strong></p>` : ""}`
    )
  });
}

export async function sendPasswordReset(opts: { to: string; resetUrl: string }) {
  await sendMail({
    to: opts.to,
    subject: "Reset your Globistic password",
    html: layout(
      "Reset your password",
      `<p>We received a request to reset your password.</p>
       <p><a href="${opts.resetUrl}" style="background:#1f59e0;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Reset password</a></p>
       <p style="color:#888;font-size:12px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>`
    )
  });
}
