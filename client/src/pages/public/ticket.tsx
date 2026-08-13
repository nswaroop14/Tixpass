import { useRoute } from "wouter";
import { PublicLayout } from "@/components/layout/public-layout";
import { usePublicTicket } from "@/hooks/use-public";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { Calendar, MapPin, Loader2, AlertCircle, User, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PublicTicket() {
  const [, params] = useRoute("/ticket/:ticketId");
  const ticketId = params?.ticketId || "";
  
  const { data, isLoading, error } = usePublicTicket(ticketId);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !data) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Ticket Not Found</h2>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            This ticket link is invalid or the event may have been updated. Please contact the event organizer if you believe this is an error.
          </p>
        </div>
      </PublicLayout>
    );
  }

  const { ticket, event } = data;
  const isScanned = ticket.scanStatus === 'scanned';

  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-4 py-12 bg-zinc-50">
        
        {/* Ticket Stub Design */}
        <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden relative">
          
          {/* Top colored section */}
          <div className="bg-zinc-950 text-white p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            
            <Badge className="bg-white/10 hover:bg-white/20 text-white border-white/10 mb-4 px-3 py-1">
              {event.ticketTypes}
            </Badge>
            <h1 className="text-2xl font-display font-bold leading-tight line-clamp-2">
              {event.title}
            </h1>
          </div>

          {/* Dotted separator */}
          <div className="relative h-8 flex items-center bg-white">
            <div className="absolute left-[-16px] w-8 h-8 bg-zinc-50 rounded-full border-r border-zinc-200 shadow-inner"></div>
            <div className="absolute right-[-16px] w-8 h-8 bg-zinc-50 rounded-full border-l border-zinc-200 shadow-inner"></div>
            <div className="w-full border-t-2 border-dashed border-zinc-300 mx-6"></div>
          </div>

          {/* Event Details */}
          <div className="p-8 pt-4 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{format(new Date(event.eventDate), 'MMM d, yyyy')}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(event.eventDate), 'h:mm a')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{event.venue}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Ticket Holder</p>
                  <p className="font-bold text-sm">Admit One</p>
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center pt-4">
              <div className={`p-4 bg-white rounded-2xl shadow-sm border ${isScanned ? 'border-red-200' : 'border-zinc-200'} relative`}>
                <QRCodeSVG 
                  value={ticket.uniqueTicketCode} 
                  size={180} 
                  level="Q"
                  className={isScanned ? "opacity-30" : ""}
                />
                
                {isScanned && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-500 text-white font-bold px-6 py-2 rounded-full rotate-[-15deg] text-lg shadow-lg border-2 border-white uppercase tracking-wider">
                      Used
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-4 uppercase tracking-widest">
                {ticket.uniqueTicketCode}
              </p>
            </div>
            
            {isScanned && (
              <div className="text-center p-3 bg-amber-50 text-amber-800 rounded-xl text-sm font-medium">
                This ticket has already been scanned at the venue.
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
