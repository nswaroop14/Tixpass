import { useRoute } from "wouter";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function TicketLink() {
  const [, params] = useRoute("/t/:ticketCode");
  const ticketCode = params?.ticketCode || "";
  const [html, setHtml] = useState("");
  const [error, setError] = useState(false);

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

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
