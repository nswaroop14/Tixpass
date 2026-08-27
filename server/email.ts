import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { Booking, Event, Ticket } from '../shared/schema.js';

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getAppUrl = () => {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:5000';
};

const APP_URL = getAppUrl();

export async function sendActivationEmail(toEmail: string, organizerName: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP not configured. Skipping activation email to:', toEmail);
    return;
  }
  const mailOptions = {
    from: process.env.SMTP_FROM || '"TixPass" <no-reply@tixpass.com>',
    to: toEmail,
    subject: 'Your Organizer Account is Activated',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fafafa;">
        <h2 style="color: #000; text-align: center;">Welcome, ${organizerName}!</h2>
        <p style="text-align: center; font-size: 16px;">Your organizer account has been approved and activated.</p>
        <p style="text-align: center;">You can log in here:</p>
        <p style="text-align: center; margin-top: 10px;">
          <a href="${APP_URL}/login" style="display:inline-block;padding:10px 16px;background:#000;color:#fff;border-radius:8px;text-decoration:none;">Go to Organizer Login</a>
        </p>
      </div>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Failed to send activation email:', error);
  }
}

export async function sendEventBankUpdateEmail(toEmail: string, organizerName: string, eventLabel: string, details: any, changedAt: Date) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP not configured. Skipping event bank update email to:', toEmail);
    return;
  }
  const mailOptions = {
    from: process.env.SMTP_FROM || '"TixPass" <no-reply@tixpass.com>',
    to: toEmail,
    subject: `Bank Details Updated – ${eventLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; background-color: #fafafa;">
        <h2 style="color: #000; text-align: center; margin-bottom: 12px;">Bank Details Changed</h2>
        <p style="text-align: center; margin: 0 0 18px 0;">${organizerName} • ${eventLabel}</p>
        <p style="text-align:center; font-size:12px; color:#666;">Changed at: ${changedAt.toLocaleString()}</p>
        <div style="background:#fff; border:1px solid #eee; border-radius:10px; padding:16px; margin-top:12px;">
          <p><strong>Bank Name:</strong> ${details.bankName || "—"}</p>
          <p><strong>Account Holder:</strong> ${details.accountHolder || "—"}</p>
          <p><strong>Account Number:</strong> ${details.accountNumber || "—"}</p>
          <p><strong>Routing Number:</strong> ${details.routingNumber || "—"}</p>
          <p><strong>Account Type:</strong> ${details.accountType || "—"}</p>
        </div>
        <p style="text-align:center; font-size:12px; color:#999; margin-top: 18px;">If you did not make this change, please contact support immediately.</p>
      </div>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Failed to send event bank update email:', error);
  }
}
export async function sendPasswordResetEmail(toEmail: string, organizerName: string, tempPassword: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP not configured. Skipping password reset email to:', toEmail);
    return;
  }
  const mailOptions = {
    from: process.env.SMTP_FROM || '"TixPass" <no-reply@tixpass.com>',
    to: toEmail,
    subject: 'Your Organizer Password Has Been Reset',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fafafa;">
        <h2 style="color: #000; text-align: center;">Hi ${organizerName},</h2>
        <p style="text-align: center; font-size: 16px;">Your organizer account password has been reset.</p>
        <div style="margin: 20px auto; max-width: 360px; padding: 12px; border: 1px dashed #999; border-radius: 8px; background:#fff; text-align:center;">
          <p style="margin:0 0 6px 0; font-size: 12px; color: #666;">Temporary Password</p>
          <p style="margin:0; font-size: 18px; font-weight: bold; letter-spacing: 0.5px;">${tempPassword}</p>
        </div>
        <p style="text-align: center;">Please log in and change your password immediately.</p>
        <p style="text-align: center; margin-top: 10px;">
          <a href="${APP_URL}/login" style="display:inline-block;padding:10px 16px;background:#000;color:#fff;border-radius:8px;text-decoration:none;">Go to Organizer Login</a>
        </p>
      </div>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
  }
}

const formatEventDate = (date: Date, text?: string | null) => {
  if (text) return text;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date).replace(',', '').replace(/ (AM|PM)/, ' $1').replace(/(\d{4}) /, '$1 • ');
};

const formatEventDateParts = (date: Date) => {
  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
  return { dateStr, timeStr };
};

function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
}

export async function sendTicketsEmail(
  customerEmail: string,
  customerName: string,
  event: Event,
  tickets: Ticket[],
  organizerName?: string
) {
  const brandName = "TixPass";
  console.log(`📧 Attempting to send tickets email to ${customerEmail} using ${process.env.SMTP_USER}...`);
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP not configured. Skipping ticket email to:', customerEmail);
    console.log('Ticket links that would have been sent:');
    tickets.forEach(t => console.log(`${APP_URL}/ticket/${t.id}`));
    return;
  }

  const ticketCount = tickets.length;
  const ticketPrice = event.ticketPrice / 100;
  const totalPrice = ticketPrice * ticketCount;
  const { dateStr, timeStr } = formatEventDateParts(new Date(event.eventDate));

  const customerGreeting = customerName ? `Hi ${customerName},` : "Hi there,";

  const ticketCode = tickets.length > 0 ? tickets[0].uniqueTicketCode : "";

  // Handle poster image - convert base64 to CID attachment or use external URL
  const attachments: any[] = [];
  let posterHtml = '';
  const bannerUrl = event.bannerUrl || '';

  if (bannerUrl.startsWith('data:')) {
    const parsed = parseDataUrl(bannerUrl);
    if (parsed) {
      attachments.push({
        filename: 'poster.jpg',
        content: parsed.buffer,
        contentType: parsed.mimeType,
        cid: 'event-poster'
      });
      posterHtml = `<img src="cid:event-poster" alt="${event.title}" width="520" style="display:block;width:100%;height:auto;max-height:280px;object-fit:cover;" />`;
    }
  } else if (bannerUrl.startsWith('http')) {
    posterHtml = `<img src="${bannerUrl}" alt="${event.title}" width="520" style="display:block;width:100%;height:auto;max-height:280px;object-fit:cover;" />`;
  }

  if (!posterHtml) {
    posterHtml = `<div style="width:100%;height:180px;background:linear-gradient(135deg,#1e1b4b 0%,#6d28d9 100%);display:flex;align-items:center;justify-content:center;"><span style="font-size:48px;font-weight:800;color:rgba(255,255,255,0.15);letter-spacing:8px;">TIXPASS</span></div>`;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || `"${organizerName || brandName}" <no-reply@tixpass.com>`,
    to: customerEmail,
    subject: `🎬 Booking Confirmed — ${event.title} | TixPass`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f0f3;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f0f0f3;">
  <tr><td align="center" style="padding:24px 12px 40px 12px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:520px;">

      <!-- HEADER -->
      <tr><td style="padding:0 0 20px 0;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#18181b;letter-spacing:-0.5px;">${organizerName || brandName}</div>
      </td></tr>

      <!-- CONFIRMATION BANNER -->
      <tr><td style="padding:0 0 16px 0;text-align:center;">
        <div style="font-size:13px;font-weight:600;color:#16a34a;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:4px;">&#10003; Booking Confirmed</div>
        <div style="font-size:14px;color:#52525b;">${customerGreeting}</div>
      </td></tr>

      <!-- TICKET CARD -->
      <tr><td>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- POSTER -->
          <tr><td style="padding:0;">
            ${posterHtml}
          </td></tr>

          <!-- EVENT INFO -->
          <tr><td style="padding:24px 28px 0 28px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#18181b;line-height:1.3;margin-bottom:6px;">${event.title}</div>
            <div style="font-size:13px;color:#71717a;font-weight:500;letter-spacing:0.3px;">${event.ticketTypes}</div>
          </td></tr>

          <!-- SHOW INFO GRID -->
          <tr><td style="padding:20px 28px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f9fafb;border-radius:12px;">
              <tr>
                <td width="33%" style="padding:14px 8px;text-align:center;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:20px;margin-bottom:4px;">📅</div>
                  <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px;">DATE</div>
                  <div style="font-size:12px;font-weight:700;color:#18181b;line-height:1.4;">${dateStr}</div>
                </td>
                <td width="33%" style="padding:14px 8px;text-align:center;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:20px;margin-bottom:4px;">⏱</div>
                  <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px;">TIME</div>
                  <div style="font-size:12px;font-weight:700;color:#18181b;line-height:1.4;">${timeStr}</div>
                </td>
                <td width="34%" style="padding:14px 8px;text-align:center;border-bottom:1px solid #e5e7eb;">
                  ${event.screen ? `<div style="font-size:20px;margin-bottom:4px;">🎬</div>
                  <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px;">SCREEN</div>
                  <div style="font-size:12px;font-weight:700;color:#18181b;line-height:1.4;">${event.screen}</div>` : '&nbsp;'}
                </td>
              </tr>
              <tr>
                <td width="33%" style="padding:14px 8px;text-align:center;border-right:1px solid #e5e7eb;">
                  <div style="font-size:20px;margin-bottom:4px;">📍</div>
                  <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px;">VENUE</div>
                  <div style="font-size:12px;font-weight:700;color:#18181b;line-height:1.4;">${event.venue}</div>
                </td>
                <td width="33%" style="padding:14px 8px;text-align:center;border-right:1px solid #e5e7eb;">
                  ${event.language ? `<div style="font-size:20px;margin-bottom:4px;">🌐</div>
                  <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px;">AUDIO</div>
                  <div style="font-size:12px;font-weight:700;color:#18181b;line-height:1.4;">${event.language}</div>` : '&nbsp;'}
                </td>
                <td width="34%" style="padding:14px 8px;text-align:center;">
                  ${event.subtitle ? `<div style="font-size:20px;margin-bottom:4px;">💬</div>
                  <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px;">SUBTITLES</div>
                  <div style="font-size:12px;font-weight:700;color:#18181b;line-height:1.4;">${event.subtitle}</div>` : '&nbsp;'}
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- PERFORATION DIVIDER -->
          <tr><td style="padding:0 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="border-top:2px dashed #d4d4d8;"></td>
                <td style="width:24px;text-align:center;font-size:10px;color:#d4d4d8;vertical-align:top;padding-top:6px;">&#9679; &#9679; &#9679;</td>
                <td style="border-top:2px dashed #d4d4d8;"></td>
              </tr>
            </table>
          </td></tr>

          <!-- TICKET COUNT -->
          <tr><td style="padding:20px 28px 0 28px;text-align:center;">
            <div style="font-size:11px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Tickets</div>
            <div style="font-size:16px;font-weight:700;color:#18181b;">${ticketCount} ${ticketCount === 1 ? 'Ticket' : 'Tickets'}</div>
            <div style="font-size:13px;color:#71717a;margin-top:2px;">${event.ticketTypes}</div>
          </td></tr>

          <!-- QR CODE -->
          <tr><td style="padding:24px 28px;text-align:center;">
            <div style="display:inline-block;background:#ffffff;border:2px solid #e5e7eb;border-radius:16px;padding:20px;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticketCode)}" alt="QR Code" width="180" height="180" style="display:block;width:180px;height:180px;" />
            </div>
            <div style="margin-top:12px;font-size:11px;color:#71717a;letter-spacing:0.3px;">Scan this QR code at the entrance</div>
          </td></tr>

          <!-- BOOKING ID -->
          <tr><td style="padding:0 28px 24px 28px;text-align:center;">
            <div style="display:inline-block;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 20px;">
              <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:2px;">Booking ID</div>
              <div style="font-size:18px;font-weight:800;color:#18181b;letter-spacing:2px;font-family:'Courier New',monospace;">${ticketCode}</div>
            </div>
          </td></tr>

          <!-- PERFORATION DIVIDER -->
          <tr><td style="padding:0 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="border-top:2px dashed #d4d4d8;"></td>
                <td style="width:24px;text-align:center;font-size:10px;color:#d4d4d8;vertical-align:top;padding-top:6px;">&#9679; &#9679; &#9679;</td>
                <td style="border-top:2px dashed #d4d4d8;"></td>
              </tr>
            </table>
          </td></tr>

          <!-- PRICE BREAKDOWN -->
          <tr><td style="padding:20px 28px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr><td style="padding:4px 0;font-size:13px;color:#52525b;">Ticket(s) (${ticketCount} × €${ticketPrice.toFixed(2)})</td><td style="text-align:right;padding:4px 0;font-size:13px;color:#52525b;">€${totalPrice.toFixed(2)}</td></tr>
              <tr><td style="padding:4px 0;font-size:13px;color:#52525b;">Convenience Fee</td><td style="text-align:right;padding:4px 0;font-size:13px;color:#52525b;">€0.00</td></tr>
              <tr><td style="padding:4px 0;font-size:13px;color:#52525b;">Discount</td><td style="text-align:right;padding:4px 0;font-size:13px;color:#52525b;">- €0.00</td></tr>
              <tr><td colspan="2" style="padding:8px 0;"><div style="border-top:1px solid #e5e7eb;"></div></td></tr>
              <tr><td style="padding:4px 0;font-size:14px;font-weight:700;color:#18181b;">Total Amount</td><td style="text-align:right;padding:4px 0;font-size:16px;font-weight:800;color:#6d28d9;">€${totalPrice.toFixed(2)}</td></tr>
            </table>
          </td></tr>

          <!-- PAID BADGE -->
          <tr><td style="padding:0 28px 24px 28px;text-align:center;">
            <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:6px 16px;">
              <span style="font-size:12px;font-weight:700;color:#16a34a;">&#10003; PAID</span>
            </div>
          </td></tr>

        </table>
      </td></tr>

      <!-- IMPORTANT INFORMATION -->
      ${event.notes ? `
      <tr><td style="padding:16px 0 0 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
          <tr><td style="padding:20px 24px;">
            <div style="font-size:12px;font-weight:700;color:#18181b;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Important Information</div>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              ${event.notes.split("\n").filter((n: string) => n.trim()).map((note: string) => `
              <tr>
                <td style="padding:3px 0;font-size:13px;color:#52525b;line-height:1.5;vertical-align:top;width:16px;">•</td>
                <td style="padding:3px 0;font-size:13px;color:#52525b;line-height:1.5;">${note.trim()}</td>
              </tr>
              `).join('')}
            </table>
          </td></tr>
        </table>
      </td></tr>
      ` : ''}

      <!-- FOOTER -->
      <tr><td style="padding:28px 0 0 0;text-align:center;">
        <div style="font-size:22px;font-weight:800;color:#18181b;letter-spacing:-0.5px;">T<span style="color:#6d28d9;">ix</span>Pass</div>
        <div style="font-size:12px;color:#a1a1aa;margin-top:4px;font-style:italic;">Your ticket. Your experience.</div>
        <div style="font-size:11px;color:#d4d4d8;margin-top:12px;">&copy; ${new Date().getFullYear()} TixPass. All rights reserved.</div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`,
    text: [
      `TIXPASS`,
      ``,
      `Booking Confirmed`,
      ``,
      `Hi ${customerName || "there"},`,
      `Your booking for ${ticketCount} ticket(s) to ${event.title} has been confirmed!`,
      ``,
      `EVENT DETAILS`,
      `Date: ${dateStr}`,
      `Time: ${timeStr}`,
      `Venue: ${event.venue}`,
      event.screen ? `Screen: ${event.screen}` : '',
      event.language ? `Audio: ${event.language}` : '',
      event.subtitle ? `Subtitles: ${event.subtitle}` : '',
      `Type: ${event.ticketTypes}`,
      ``,
      `TICKET`,
      `${ticketCount} × ${event.ticketTypes}`,
      ``,
      `QR CODE`,
      `Scan this QR code at the entrance.`,
      `Booking ID: ${ticketCode}`,
      ``,
      `PRICE BREAKDOWN`,
      `Ticket(s): €${totalPrice.toFixed(2)}`,
      `Convenience Fee: €0.00`,
      `Discount: - €0.00`,
      `Total: €${totalPrice.toFixed(2)}`,
      `Status: PAID`,
      event.notes ? `` : '',
      event.notes ? `Important Information:` : '',
      event.notes ? event.notes.split("\n").filter((n: string) => n.trim()).map((n: string) => `• ${n.trim()}`).join("\n") : '',
      ``,
      `Your ticket. Your experience.`,
      `© ${new Date().getFullYear()} TixPass`
    ].filter(Boolean).join("\n"),
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Ticket email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Failed to send ticket email:', error);
    throw error;
  }
}

export async function sendAdminAlert(subject: string, message: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ADMIN_EMAIL) {
    console.warn('⚠️ Admin alert not sent. SMTP or ADMIN_EMAIL missing.', { subject });
    return;
  }
  const mailOptions = {
    from: process.env.SMTP_FROM || '"TixPass Alerts" <no-reply@tixpass.com>',
    to: process.env.ADMIN_EMAIL,
    subject,
    text: message,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('📣 Admin alert sent:', subject);
  } catch (err) {
    console.error('❌ Failed to send admin alert:', err);
  }
}

export async function sendDailyBookingsReportEmail(toEmail: string, organizerName: string, dateLabel: string, summary: { total: number; paid: number; submitted: number; pending: number; revenueCents: number; }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP not configured. Skipping daily report email to:', toEmail);
    return;
  }
  const mailOptions = {
    from: process.env.SMTP_FROM || '"TixPass" <no-reply@tixpass.com>',
    to: toEmail,
    subject: `Daily Bookings Report – ${dateLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; background-color: #fafafa;">
        <h2 style="color: #000; text-align: center; margin-bottom: 12px;">Daily Bookings Report</h2>
        <p style="text-align: center; margin: 0 0 18px 0;">${organizerName} • ${dateLabel}</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom: 20px;">
          <div style="background:#fff; border:1px solid #eee; border-radius:10px; padding:12px; text-align:center;">
            <div style="font-size:12px; color:#666;">Total</div>
            <div style="font-size:20px; font-weight:bold;">${summary.total}</div>
          </div>
          <div style="background:#fff; border:1px solid #eee; border-radius:10px; padding:12px; text-align:center;">
            <div style="font-size:12px; color:#666;">Paid</div>
            <div style="font-size:20px; font-weight:bold; color:#0a0;">${summary.paid}</div>
          </div>
          <div style="background:#fff; border:1px solid #eee; border-radius:10px; padding:12px; text-align:center;">
            <div style="font-size:12px; color:#666;">Submitted</div>
            <div style="font-size:20px; font-weight:bold; color:#f90;">${summary.submitted}</div>
          </div>
          <div style="background:#fff; border:1px solid #eee; border-radius:10px; padding:12px; text-align:center;">
            <div style="font-size:12px; color:#666;">Pending</div>
            <div style="font-size:20px; font-weight:bold; color:#c00;">${summary.pending}</div>
          </div>
        </div>
        <p style="text-align:center; font-size:16px; font-weight:bold; margin-top: 10px;">Estimated Revenue: €${(summary.revenueCents / 100).toFixed(2)}</p>
        <p style="text-align:center; font-size:12px; color:#999; margin-top: 18px;">This is an automated report generated by TixPass.</p>
      </div>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Failed to send daily report email:', error);
  }
}
