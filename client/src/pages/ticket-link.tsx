import { useRoute } from "wouter";
import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";

export default function TicketLink() {
  const [, params] = useRoute("/t/:ticketCode");
  const ticketCode = params?.ticketCode || "";
  const [html, setHtml] = useState("");
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!ticketCode) return;
    fetch(`/api/public/ticket-link/${ticketCode}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.text();
      })
      .then(setHtml)
      .catch(() => setError(true));
  }, [ticketCode]);

  useEffect(() => {
    if (html && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <h1 style={{ fontSize: 20, color: "#18181b", marginBottom: 8 }}>Ticket not found</h1>
          <p style={{ fontSize: 14, color: "#71717a" }}>This ticket link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div style={{ background: "#f0f0f3", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <iframe
        ref={iframeRef}
        sandbox="allow-same-origin"
        style={{ border: "none", width: "380px", minHeight: "100vh" }}
        title="Ticket"
      />
    </div>
  );
}
