import { format } from "date-fns";

export function parseWallClock(isoString: string): Date {
  const clean = isoString.replace('Z', '').split('T');
  const [year, month, day] = clean[0].split('-').map(Number);
  const [hour = 0, minute = 0] = clean[1]?.split(':').map(Number) || [];
  return new Date(year, month - 1, day, hour, minute);
}

export function formatEventDate(isoString: string, pattern = "EEE, MMM d"): string {
  return format(parseWallClock(isoString), pattern);
}

export function formatEventTime(isoString: string, pattern = "h:mm a"): string {
  return format(parseWallClock(isoString), pattern);
}

export function formatEventDateTime(isoString: string, pattern = "d MMM yyyy · h:mm a"): string {
  return format(parseWallClock(isoString), pattern);
}

export function toDateTimeLocal(isoString: string): string {
  const d = parseWallClock(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// WhatsApp message formatter
interface WhatsAppEvent {
  title: string;
  eventDate: string;
  venue: string;
  ticketTypes: string;
}

interface WhatsAppBooking {
  customerPhone: string;
  ticketQuantity: number;
}

interface WhatsAppTicket {
  uniqueTicketCode: string;
  id: string;
}

export function formatWhatsAppMessage(
  event: WhatsAppEvent,
  booking: WhatsAppBooking,
  tickets: WhatsAppTicket[],
  baseUrl: string
): string {
  // Sanitize phone number: remove non-digits
  const phone = booking.customerPhone?.replace(/\D/g, '') || '';
  
  if (!phone) return '';
  
  const lines = [
    "🎫 *TICKET CONFIRMED*",
    "",
    `*Event:* ${event.title}`,
    `*Date:* ${formatEventDate(event.eventDate, "EEE, MMM d")}`,
    `*Time:* ${formatEventTime(event.eventDate, "h:mm a")}`,
    `*Venue:* ${event.venue}`,
    `*Type:* ${event.ticketTypes}`,
    `*Qty:* ${booking.ticketQuantity}`,
    "",
    `*Booking ID:* ${tickets[0]?.uniqueTicketCode || "N/A"}`,
    "*QR Codes:*",
    ...tickets.map(t => `${baseUrl}/ticket/${t.id}`),
    "",
    "Show QR codes at venue entrance."
  ];
  
  const message = lines.join("\n");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}