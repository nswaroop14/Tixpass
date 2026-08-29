import QRCode from "qrcode";
import { formatEventDate, formatEventTime } from "./date-utils";

interface TicketImageData {
  eventTitle: string;
  eventDate: string;
  venue: string;
  ticketType: string;
  ticketCode: string;
  ticketId: string;
  screen?: string;
  language?: string;
  subtitle?: string;
  customerName?: string;
}

const COLORS = {
  bg: "#0f172a",
  card: "#ffffff",
  accent: "#4f46e5",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  border: "#e2e8f0",
  lightBg: "#f8fafc",
  badge: "#eef2ff",
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
): number {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== "") {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(line.trim() + "...", x, y);
        return y + lineHeight;
      }
      ctx.fillText(line.trim(), x, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
  return y + lineHeight;
}

export async function generateTicketImage(
  ticket: TicketImageData
): Promise<Blob> {
  const W = 600;
  const HEADER_H = 120;
  const DETAIL_H = 200;
  const QR_H = 260;
  const FOOTER_H = 50;
  const TOTAL_H = HEADER_H + DETAIL_H + QR_H + FOOTER_H;

  const canvas = document.createElement("canvas");
  canvas.width = W * 2;
  canvas.height = TOTAL_H * 2;
  canvas.style.width = W + "px";
  canvas.style.height = TOTAL_H + "px";

  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);
  ctx.textBaseline = "top";

  // --- Header ---
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, HEADER_H);

  // Badge
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  roundRect(ctx, 20, 16, ctx.measureText(ticket.ticketType.toUpperCase()).width + 24, 22, 4);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px sans-serif";
  ctx.fillText(ticket.ticketType.toUpperCase(), 32, 20);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  wrapText(ctx, ticket.eventTitle, 20, 50, W - 40, 24, 2);

  // --- Dotted separator ---
  ctx.strokeStyle = COLORS.border;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(20, HEADER_H);
  ctx.lineTo(W - 20, HEADER_H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Circle cutouts
  ctx.fillStyle = "#f1f5f9";
  ctx.beginPath();
  ctx.arc(0, HEADER_H, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W, HEADER_H, 10, 0, Math.PI * 2);
  ctx.fill();

  // --- Details Section ---
  const detailsY = HEADER_H + 16;
  ctx.fillStyle = COLORS.lightBg;
  roundRect(ctx, 16, detailsY, W - 32, DETAIL_H - 20, 10);
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  const colW = (W - 64) / 3;
  const details = [
    { label: "DATE", value: formatEventDate(ticket.eventDate, "EEE, MMM d") },
    { label: "TIME", value: formatEventTime(ticket.eventDate, "h:mm a") },
    { label: "VENUE", value: ticket.venue },
  ];

  if (ticket.screen) {
    details.push({ label: "SCREEN", value: ticket.screen });
  }

  details.forEach((d, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const dx = 24 + col * colW;
    const dy = detailsY + 12 + row * 60;

    ctx.fillStyle = COLORS.accent;
    ctx.font = "bold 9px sans-serif";
    ctx.fillText(d.label, dx, dy);

    ctx.fillStyle = COLORS.textPrimary;
    ctx.font = "bold 13px sans-serif";
    wrapText(ctx, d.value, dx, dy + 14, colW - 12, 16, 2);
  });

  // --- QR Section ---
  const qrY = HEADER_H + DETAIL_H;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, qrY, W, QR_H);

  // Generate QR code
  const qrDataUrl = await QRCode.toDataURL(ticket.ticketCode, {
    width: 180,
    margin: 1,
    color: { dark: COLORS.bg, light: "#ffffff" },
  });

  const qrImg = new Image();
  await new Promise<void>((resolve) => {
    qrImg.onload = () => resolve();
    qrImg.src = qrDataUrl;
  });

  const qrSize = 140;
  const qrX = (W - qrSize) / 2;
  ctx.drawImage(qrImg, qrX, qrY + 20, qrSize, qrSize);

  // Ticket code
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = "600 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(ticket.ticketCode, W / 2, qrY + qrSize + 30);
  ctx.textAlign = "left";

  // --- Footer ---
  ctx.fillStyle = COLORS.lightBg;
  ctx.fillRect(0, qrY + QR_H, W, FOOTER_H);
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Show this QR code at the venue entrance", W / 2, qrY + QR_H + 16);
  ctx.textAlign = "left";

  // Convert to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to generate ticket image"));
    }, "image/png");
  });
}

export async function generateAllTicketImages(
  tickets: TicketImageData[]
): Promise<Blob[]> {
  const blobs: Blob[] = [];
  for (const t of tickets) {
    const blob = await generateTicketImage(t);
    blobs.push(blob);
  }
  return blobs;
}

export async function shareTicketImage(
  ticket: TicketImageData,
  customerName?: string
): Promise<boolean> {
  const blob = await generateTicketImage(ticket);
  const file = new File([blob], `ticket-${ticket.ticketCode}.png`, {
    type: "image/png",
  });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: `${ticket.eventTitle} - Ticket`,
        text: `Here's your ticket for ${ticket.eventTitle}`,
        files: [file],
      });
      return true;
    } catch {
      return false;
    }
  }

  // Fallback: download the image
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ticket-${ticket.ticketCode}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
