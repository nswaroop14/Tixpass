import html2pdf from "html2pdf.js";

function getAppOrigin(): string {
  return window.location.origin;
}

export async function generateTicketPdf(bookingId: string): Promise<Blob> {
  const htmlUrl = `${getAppOrigin()}/api/public/bookings/${bookingId}/ticket-html`;
  const res = await fetch(htmlUrl);
  if (!res.ok) throw new Error("Failed to fetch ticket HTML");
  const html = await res.text();

  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "520px";
  document.body.appendChild(container);

  await new Promise<void>((resolve) => {
    const images = container.querySelectorAll("img");
    let loaded = 0;
    const total = images.length;
    if (total === 0) return resolve();
    images.forEach((img) => {
      if (img.complete) {
        loaded++;
        if (loaded >= total) resolve();
      } else {
        img.onload = () => {
          loaded++;
          if (loaded >= total) resolve();
        };
        img.onerror = () => {
          loaded++;
          if (loaded >= total) resolve();
        };
      }
    });
  });

  const opt = {
    margin: 0,
    filename: `TixPass-Ticket-${bookingId}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#f0f0f3",
      logging: false,
      windowWidth: 520,
    },
    jsPDF: {
      unit: "mm",
      format: [52, 148],
      orientation: "portrait" as const,
    },
    pagebreak: { mode: ["avoid-all"] },
  };

  const pdfBlob = await html2pdf().set(opt).from(container).outputPdf("blob");

  document.body.removeChild(container);

  return pdfBlob;
}

export async function downloadTicketPdf(bookingId: string, filename?: string): Promise<void> {
  const blob = await generateTicketPdf(bookingId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `TixPass-Ticket-${bookingId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareTicketPdf(bookingId: string, eventTitle: string): Promise<boolean> {
  const blob = await generateTicketPdf(bookingId);
  const file = new File([blob], `TixPass-Ticket-${bookingId}.pdf`, { type: "application/pdf" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: `${eventTitle} - Ticket`,
        text: `Your ticket for ${eventTitle}`,
        files: [file],
      });
      return true;
    } catch {
      return false;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TixPass-Ticket-${bookingId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
