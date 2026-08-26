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

export async function sendTicketsEmail(
  customerEmail: string,
  customerName: string,
  event: Event,
  tickets: Ticket[],
  organizerName?: string
) {
  const brandName = organizerName || "TixPass";
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

  const ticketStubs = tickets.map((t, idx) => `
    <tr><td style="padding:0 0 16px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="padding:20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td width="90" valign="top">
                ${event.bannerUrl ? `<img src="${event.bannerUrl}" alt="${event.title}" width="80" height="100" style="display:block;border-radius:8px;object-fit:cover;" />` : `<div style="width:80px;height:100px;background:#e4e4e7;border-radius:8px;display:flex;align-items:center;justify-content:center;"><span style="font-size:10px;color:#71717a;">No Image</span></div>`}
              </td>
              <td style="padding-left:16px;" valign="top">
                <div style="font-size:16px;font-weight:700;color:#18181b;line-height:1.3;margin-bottom:4px;">${event.title}</div>
                ${event.language ? `<div style="font-size:12px;color:#71717a;margin-bottom:2px;">${event.language}${event.screen ? `, ${event.screen}` : ''}</div>` : ''}
                <div style="font-size:12px;color:#71717a;margin-bottom:2px;">${formatEventDate(new Date(event.eventDate), event.eventDateText)}</div>
                <div style="font-size:12px;color:#71717a;">${event.venue}</div>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 20px 20px 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f4f5;border-radius:12px;padding:16px;">
            <tr><td style="text-align:center;padding:8px 0;">
              <div style="font-size:12px;color:#71717a;margin-bottom:4px;">${ticketCount} Ticket(s)</div>
              ${event.screen ? `<div style="font-size:14px;font-weight:600;color:#18181b;margin-bottom:2px;">${event.screen}</div>` : ''}
              <div style="font-size:12px;color:#71717a;">${event.ticketTypes}</div>
            </td></tr>
            <tr><td style="text-align:center;padding:16px 0;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(t.uniqueTicketCode)}" alt="QR Code" width="140" height="140" style="display:block;margin:0 auto;width:140px;height:140px;" />
            </td></tr>
            <tr><td style="text-align:center;padding:0 0 8px 0;">
              <div style="font-size:13px;font-weight:700;color:#18181b;letter-spacing:1px;">BOOKING ID: ${t.uniqueTicketCode}</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 20px 20px 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;">
            <tr><td style="padding:10px 12px;font-size:11px;color:#854d0e;text-align:center;">
              Cancellation unavailable: cut-off time of 20 minutes before showtime has passed
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="border-top:1px solid #e5e7eb;padding:16px 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:13px;color:#52525b;">
            <tr><td style="padding:4px 0;font-weight:600;color:#18181b;">Total Amount</td><td style="text-align:right;padding:4px 0;font-weight:700;color:#18181b;">€${totalPrice.toFixed(2)}</td></tr>
            <tr><td style="padding:4px 0;">Ticket(s) price (${ticketCount})</td><td style="text-align:right;padding:4px 0;">€${ticketPrice.toFixed(2)}</td></tr>
            <tr><td style="padding:4px 0;">Convenience fee</td><td style="text-align:right;padding:4px 0;">€0.00</td></tr>
            <tr><td style="padding:4px 0;">Discount</td><td style="text-align:right;padding:4px 0;">- €0.00</td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  `).join('');

  const ticketLinks = tickets.map(t =>
    `- ${t.uniqueTicketCode}: ${APP_URL}/ticket/${t.id}`
  ).join('\n');

  const mailOptions = {
    from: process.env.SMTP_FROM || '"TixPass" <no-reply@tixpass.com>',
    to: customerEmail,
    subject: `Your Tickets for ${event.title}`,
    html: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-family:Arial,Helvetica,sans-serif;background:#f4f4f5;">
        <tr><td align="center" style="padding:24px 12px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:480px;">
            <tr><td style="background:#18181b;border-radius:16px 16px 0 0;padding:24px 20px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#fff;margin-bottom:4px;">${brandName}</div>
              <div style="font-size:12px;color:#a1a1aa;">Your Ticket</div>
            </td></tr>
            <tr><td style="background:#fff;padding:24px 20px;border-radius:0 0 16px 16px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${ticketStubs}
              </table>
            </td></tr>
            <tr><td style="padding:16px 0;text-align:center;">
              <span style="font-size:11px;color:#a1a1aa;">Powered by TixPass</span>
            </td></tr>
          </table>
        </td></tr>
      </table>
    `,
    text: [
      `Hi ${customerName},`,
      ``,
      `Your payment for ${tickets.length} ticket(s) to ${event.title} has been confirmed!`,
      ``,
      `EVENT DETAILS`,
      `Date: ${formatEventDate(new Date(event.eventDate), event.eventDateText)}`,
      `Venue: ${event.venue}`,
      event.screen ? `Screen: ${event.screen}` : '',
      event.language ? `Language: ${event.language}` : '',
      `Type: ${event.ticketTypes}`,
      event.notes ? `\nNote: ${event.notes}` : '',
      ``,
      `TICKETS`,
      ...tickets.map(t => `Code: ${t.uniqueTicketCode}`),
      ``,
      `View your tickets online:`,
      ticketLinks,
      ``,
      `Show the QR code at the entrance for scanning.`,
      ``,
      `If you have any questions, contact the event organizer.`
    ].filter(Boolean).join("\n"),
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
