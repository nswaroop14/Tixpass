import { useState, useRef, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useScanTicket, useEventTickets } from "@/hooks/use-organizer";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ScanLine, Loader2, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { PageHeader } from "@/components/organizer/page-header";

export default function OrganizerScan() {
  const queryClient = useQueryClient();
  const scanTicket = useScanTicket();
  const [lastScan, setLastScan] = useState<{
    code: string;
    status: "success" | "error";
    message: string;
    timestamp: number;
    eventId?: string;
    eventTitle?: string;
  } | null>(null);
  const isProcessingRef = useRef(false);

  const { data: attendees } = useEventTickets(lastScan?.eventId || "");

  const stats = useMemo(() => {
    if (!attendees) return null;
    const total = attendees.length;
    const scanned = attendees.filter((a: any) => a.ticket.scanStatus === "scanned").length;
    return { total, scanned, percent: Math.round((scanned / total) * 100) };
  }, [attendees]);

  const handleScan = async (text: string) => {
    if (isProcessingRef.current) return;

    if (lastScan && lastScan.code === text && Date.now() - lastScan.timestamp < 1200) {
      return;
    }

    isProcessingRef.current = true;
    try {
      const res = await scanTicket.mutateAsync({ uniqueTicketCode: text });
      setLastScan({
        code: text,
        status: "success",
        message: res.message,
        timestamp: Date.now(),
        eventId: res.eventId,
        eventTitle: res.eventTitle,
      });

      if (res.eventId) {
        queryClient.invalidateQueries({ queryKey: [api.organizer.events.tickets.path, res.eventId] });
      }
    } catch (err: any) {
      setLastScan({ code: text, status: "error", message: err.message, timestamp: Date.now() });
    } finally {
      isProcessingRef.current = false;
    }
  };

  return (
    <DashboardLayout role="organizer">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Scan Tickets" subtitle="Scan QR codes at the entrance to verify tickets." />

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden p-5 md:p-8">
          {/* Scanner Area */}
          <div className="aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-gray-950 relative">
            <Scanner
              onScan={(result) => handleScan(result[0].rawValue)}
              scanDelay={1000}
              formats={["qr_code"]}
              components={{
                audio: false,
                finder: false,
              }}
              styles={{
                video: { objectFit: "cover" },
              }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none z-10 flex items-center justify-center">
              <div className="w-full h-full border-2 border-white/50 rounded-xl" />
            </div>

            {scanTicket.isPending && (
              <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="font-medium text-sm">Verifying ticket...</p>
              </div>
            )}
          </div>

          {/* Result Area */}
          <div className="mt-6 min-h-[120px] space-y-4">
            {lastScan ? (
              <>
                {/* Attendance Stats */}
                {stats && (
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Checking into</p>
                        <p className="font-semibold text-sm text-gray-900 line-clamp-1">{lastScan.eventTitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">
                        {stats.scanned} / {stats.total}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Attendees In</p>
                    </div>
                  </div>
                )}

                {/* Scan Result */}
                <div
                  className={`p-6 rounded-2xl border text-center transition-all ${
                    lastScan.status === "success" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                  }`}
                >
                  {lastScan.status === "success" ? (
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                      <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                  )}
                  <h3 className={`font-bold text-lg mb-1 ${lastScan.status === "success" ? "text-emerald-900" : "text-red-900"}`}>
                    {lastScan.message}
                  </h3>
                  <p className={`text-sm font-mono break-all ${lastScan.status === "success" ? "text-emerald-700" : "text-red-700"}`}>
                    {lastScan.code}
                  </p>

                  <div className="flex items-center justify-center gap-4 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-gray-500 hover:text-gray-700"
                      onClick={() => setLastScan(null)}
                    >
                      Clear
                    </Button>
                    {lastScan.eventId && (
                      <a
                        href={`/organizer/events/${lastScan.eventId}/attendees`}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        View List →
                      </a>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl">
                <div className="text-center">
                  <ScanLine className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm font-medium">Ready to scan</p>
                  <p className="text-gray-400 text-xs mt-1">Position the QR code within the frame</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
