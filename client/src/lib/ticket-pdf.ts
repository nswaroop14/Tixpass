import html2pdf from "html2pdf.js";

function getAppOrigin(): string {
  return window.location.origin;
}

function waitForImages(el: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const images = Array.from(el.querySelectorAll("img"));
    let loaded = 0;
    const total = images.length;
    if (total === 0) return resolve();
    images.forEach((img) => {
      const check = () => {
        loaded++;
        if (loaded >= total) resolve();
      };
      if (img.complete && img.naturalWidth > 0) check();
      else {
        img.onload = check;
        img.onerror = check;
      }
    });
    setTimeout(resolve, 5000);
  });
}

export async function generateTicketPdf(bookingId: string): Promise<Blob> {
  const htmlUrl = `${getAppOrigin()}/api/public/bookings/${bookingId}/ticket-pdf-html`;
  const res = await fetch(htmlUrl);
  if (!res.ok) throw new Error("Failed to fetch ticket HTML");
  const html = await res.text();

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "320px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("Cannot access iframe document");
  }

  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${html}</body></html>`);
  iframeDoc.close();

  await new Promise((r) => setTimeout(r, 500));
  await waitForImages(iframeDoc.body);
  await new Promise((r) => setTimeout(r, 300));

  const opt = {
    margin: 0,
    filename: `TixPass-Ticket-${bookingId}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 320,
      windowWidth: 320,
    },
    jsPDF: {
      unit: "mm",
      format: "a5",
      orientation: "portrait" as const,
    },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };

  const pdfBlob = await html2pdf().set(opt).from(iframeDoc.body).outputPdf("blob");

  document.body.removeChild(iframe);

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
