import { useRoute } from "wouter";
import { PublicLayout } from "@/components/layout/public-layout";
import { usePublicTicket } from "@/hooks/use-public";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { Calendar, MapPin, Loader2, AlertCircle, User, Check, Ticket } from "lucide-react";

export default function PublicTicket() {
  const [, params] = useRoute("/ticket/:ticketId");
  const ticketId = params?.ticketId || "";

  const { data, isLoading, error } = usePublicTicket(ticketId);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading ticket...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !data) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Ticket Not Found</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
            This ticket link is invalid or the event may have been updated. Please contact the event organizer.
          </p>
        </div>
      </PublicLayout>
    );
  }

  const { ticket, event } = data;
  const isScanned = ticket.scanStatus === "scanned";

  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Digital Ticket */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Top: Event Header */}
            <div className="bg-gray-950 text-white p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider mb-3">
                  {event.ticketTypes}
                </div>
                <h1 className="text-xl font-display font-bold leading-tight line-clamp-2">{event.title}</h1>
              </div>
            </div>

            {/* Dotted Separator */}
            <div className="relative h-6 flex items-center bg-white">
              <div className="absolute left-[-12px] w-6 h-6 bg-gray-50 rounded-full border-r border-gray-200" />
              <div className="absolute right-[-12px] w-6 h-6 bg-gray-50 rounded-full border-l border-gray-200" />
              <div className="w-full border-t-2 border-dashed border-gray-200 mx-6" />
            </div>

            {/* Ticket Details */}
            <div className="p-6 space-y-5">
              {/* Date & Venue */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{format(new Date(event.eventDate), "EEEE, MMMM d, yyyy")}</p>
                    <p className="text-xs text-gray-500">{format(new Date(event.eventDate), "h:mm a")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{event.venue}</p>
                  </div>
                </div>
                {event.language && (
                  <div className="flex items-start gap-3">
                    <span className="w-4 h-4 text-gray-400 mt-0.5 text-xs font-bold">🌐</span>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Audio</p>
                      <p className="text-sm font-semibold text-gray-900">{event.language}</p>
                    </div>
                  </div>
                )}
                {event.subtitle && (
                  <div className="flex items-start gap-3">
                    <span className="w-4 h-4 text-gray-400 mt-0.5 text-xs font-bold">💬</span>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Subtitles</p>
                      <p className="text-sm font-semibold text-gray-900">{event.subtitle}</p>
                    </div>
                  </div>
                )}
                {event.screen && (
                  <div className="flex items-start gap-3">
                    <span className="w-4 h-4 text-gray-400 mt-0.5 text-xs font-bold">🎬</span>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Screen</p>
                      <p className="text-sm font-semibold text-gray-900">{event.screen}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Ticket Holder */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Ticket Holder</p>
                    <p className="text-xs font-bold text-gray-900">Admit One</p>
                  </div>
                </div>
                {isScanned && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> Checked In
                  </span>
                )}
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center pt-2">
                <div className={`p-3 bg-white rounded-xl border ${isScanned ? "border-red-200" : "border-gray-200"} relative`}>
                  <QRCodeSVG
                    value={ticket.uniqueTicketCode}
                    size={180}
                    level="Q"
                    className={isScanned ? "opacity-30" : ""}
                  />
                  {isScanned && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-red-500 text-white font-bold px-4 py-1 rounded-full -rotate-12 text-sm shadow-lg border-2 border-white uppercase tracking-wider">
                        Used
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-mono text-gray-400 mt-3 uppercase tracking-widest">{ticket.uniqueTicketCode}</p>
              </div>

              {isScanned && (
                <div className="text-center p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-medium border border-amber-200">
                  This ticket has already been scanned at the venue.
                </div>
              )}

              {event.notes && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{event.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Show this at entry */}
          <p className="text-center text-xs text-gray-400 mt-4">Show this QR code at the venue entrance</p>
        </div>
      </div>
    </PublicLayout>
  );
}
