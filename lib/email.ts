import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend && process.env.RESEND_API_KEY) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL =
  process.env.EMAIL_FROM || "PredictFlow <notifications@predictflow.app>";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return null;
  }

  try {
    const { data, error } = await getResend()!.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    if (error) {
      console.error("Email send error:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Email send failed:", err);
    return null;
  }
}

// Email templates

export function betResultEmailHtml(params: {
  userName: string;
  eventTitle: string;
  won: boolean;
  payout?: number;
  link: string;
}) {
  const { userName, eventTitle, won, payout, link } = params;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://predictflow.app";
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">PredictFlow</h2>
      <p>Hi ${escapeHtml(userName || "there")},</p>
      ${
        won
          ? `<p style="color: #22c55e; font-size: 18px; font-weight: bold;">You won${payout ? ` ${payout} points` : ""}!</p>`
          : `<p style="color: #ef4444; font-size: 18px; font-weight: bold;">Better luck next time</p>`
      }
      <p>The prediction "<strong>${escapeHtml(eventTitle)}</strong>" has been resolved.</p>
      <a href="${baseUrl}${link}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">View Details</a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #888; font-size: 12px;">You received this because you have email notifications enabled. <a href="${baseUrl}/en/notifications">Manage preferences</a></p>
    </div>
  `;
}

export function commentReplyEmailHtml(params: {
  userName: string;
  commenterName: string;
  eventTitle: string;
  comment: string;
  link: string;
}) {
  const { userName, commenterName, eventTitle, comment, link } = params;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://predictflow.app";
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">PredictFlow</h2>
      <p>Hi ${escapeHtml(userName || "there")},</p>
      <p><strong>${escapeHtml(commenterName)}</strong> commented on your prediction "<strong>${escapeHtml(eventTitle)}</strong>":</p>
      <blockquote style="border-left: 3px solid #6366f1; padding: 8px 16px; margin: 16px 0; color: #555;">${escapeHtml(comment)}</blockquote>
      <a href="${baseUrl}${link}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">View Comment</a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #888; font-size: 12px;">You received this because you have email notifications enabled. <a href="${baseUrl}/en/notifications">Manage preferences</a></p>
    </div>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
