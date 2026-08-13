import { useState, useRef, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useScanTicket, useEventTickets } from "@/hooks/use-organizer";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ScanLine, Loader2, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export default function OrganizerScan() {
  const queryClient = useQueryClient();
  const scanTicket = useScanTicket();
  const [lastScan, setLastScan] = useState<{ code: string; status: 'success' | 'error'; message: string; timestamp: number; eventId?: string; eventTitle?: string } | null>(null);
  const isProcessingRef = useRef(false);

  // Stats for the last scanned event
  const { data: attendees } = useEventTickets(lastScan?.eventId || "");
  
  const stats = useMemo(() => {
    if (!attendees) return null;
    const total = attendees.length;
    const scanned = attendees.filter((a: any) => a.ticket.scanStatus === 'scanned').length;
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
        status: 'success', 
        message: res.message, 
        timestamp: Date.now(),
        eventId: res.eventId,
        eventTitle: res.eventTitle
      });

      // Update attendee list for this event
      if (res.eventId) {
        queryClient.invalidateQueries({ queryKey: [api.organizer.events.tickets.path, res.eventId] });
      }
    } catch (err: any) {
      setLastScan({ code: text, status: 'error', message: err.message, timestamp: Date.now() });
    } finally {
      isProcessingRef.current = false;
    }
  };

  return (
    <DashboardLayout role="organizer">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <ScanLine className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold">Ticket Scanner</h2>
          <p className="text-muted-foreground mt-2">Scan QR codes at the entrance to verify tickets.</p>
        </div>

        <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden p-4 md:p-8">
          <div className="aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-zinc-950 relative">
            <Scanner
              onScan={(result) => handleScan(result[0].rawValue)}
              scanDelay={1000}
              formats={['qr_code']}
              components={{
                audio: false,
                finder: false
              }}
              styles={{
                video: { objectFit: 'cover' }
              }}
            />
            {/* Overlay Grid */}
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none z-10 flex items-center justify-center">
              <div className="w-full h-full border-2 border-white/50 rounded-xl"></div>
            </div>
            
            {scanTicket.isPending && (
              <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="font-medium">Verifying ticket...</p>
              </div>
            )}
          </div>

          <div className="mt-8 min-h-[120px] space-y-4">
            {lastScan ? (
              <>
                {stats && (
                  <div className="bg-muted/50 p-4 rounded-2xl flex items-center justify-between border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Checking into</p>
                        <p className="font-bold text-sm line-clamp-1">{lastScan.eventTitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">{stats.scanned} / {stats.total}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Attendees In</p>
                    </div>
                  </div>
                )}

                <div className={`p-6 rounded-2xl border text-center transition-all ${
                  lastScan.status === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  {lastScan.status === 'success' ? (
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  ) : (
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  )}
                  <h3 className="font-bold text-lg mb-1">{lastScan.message}</h3>
                  <p className="text-sm font-mono opacity-80 break-all">{lastScan.code}</p>
                  
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-7"
                      onClick={() => setLastScan(null)}
                    >
                      Clear
                    </Button>
                    {lastScan.eventId && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-xs h-7 p-0 h-auto"
                        asChild
                      >
                        <a href={`/organizer/events/${lastScan.eventId}/attendees`}>View List</a>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-6 border-2 border-dashed border-border rounded-2xl">
                <p className="text-muted-foreground text-center font-medium">Ready to scan. Position the QR code within the frame.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
