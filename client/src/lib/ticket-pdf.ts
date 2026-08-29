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

function optimizeForPdf(doc: Document) {
  const body = doc.body;
  if (!body) return;

  const outerTable = body.querySelector("table");
  if (outerTable) {
    const outerTd = outerTable.querySelector(":scope > tbody > tr > td, :scope > tr > td");
    if (outerTd) {
      outerTd.style.padding = "10px 12px 14px 12px";
    }
  }

  const allImgs = Array.from(doc.querySelectorAll("img"));
  for (const img of allImgs) {
    const alt = img.getAttribute("alt") || "";
    if (alt === "QR Code") {
      (img as HTMLImageElement).style.width = "150px";
      (img as HTMLImageElement).style.height = "150px";
    } else if (alt === "TixPass" || alt === "Indian Cinema Connects") {
      // Keep logos at original size
    } else if (img.hasAttribute("width")) {
      (img as HTMLImageElement).style.maxHeight = "180px";
      (img as HTMLImageElement).style.objectFit = "cover";
    }
  }

  const allTables = Array.from(doc.querySelectorAll("table"));
  for (const table of allTables) {
    const style = table.getAttribute("style") || "";
    if (style.includes("border-radius:16px") || style.includes("border-radius: 16px")) {
      table.style.breakInside = "avoid";
      table.style.pageBreakInside = "avoid";
    }
  }

  const infoTables = Array.from(doc.querySelectorAll("table"));
  for (const table of infoTables) {
    const style = table.getAttribute("style") || "";
    if (style.includes("border-radius:12px") || style.includes("border-radius: 12px")) {
      const tds = Array.from(table.querySelectorAll("td"));
      for (const td of tds) {
        const tdStyle = td.getAttribute("style") || "";
        if (tdStyle.includes("padding:14px")) {
          td.setAttribute("style", tdStyle.replace(/padding:\s*14px/g, "padding:10px"));
        }
      }
    }
  }

  const perfDividers = Array.from(doc.querySelectorAll("table"));
  for (const table of perfDividers) {
    const style = table.getAttribute("style") || "";
    if (style.includes("border-top:2px dashed")) {
      const cells = Array.from(table.querySelectorAll("td"));
      for (const td of cells) {
        const s = td.getAttribute("style") || "";
        if (s.includes("padding-top:6px")) {
          td.setAttribute("style", s.replace(/padding-top:\s*6px/g, "padding-top:4px"));
        }
      }
    }
  }
}

export async function generateTicketPdf(bookingId: string): Promise<Blob> {
  const htmlUrl = `${getAppOrigin()}/api/public/bookings/${bookingId}/ticket-html`;
  const res = await fetch(htmlUrl);
  if (!res.ok) throw new Error("Failed to fetch ticket HTML");
  const html = await res.text();

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "520px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("Cannot access iframe document");
  }

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 520px; background: #f0f0f3; }
        img { max-width: 100%; height: auto; }
        @page { size: A5 portrait; margin: 0; }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `);
  iframeDoc.close();

  await new Promise((r) => setTimeout(r, 500));
  await waitForImages(iframeDoc.body);

  optimizeForPdf(iframeDoc);

  await new Promise((r) => setTimeout(r, 300));

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
      width: 520,
      windowWidth: 520,
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
