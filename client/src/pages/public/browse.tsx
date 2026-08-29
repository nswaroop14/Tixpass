import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, MapPin, Loader2, Clock, ArrowLeft } from "lucide-react";
import { formatEventDate, formatEventTime } from "@/lib/date-utils";

export default function BrowseEvents() {
  const [, setLocation] = useLocation();

  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/public/events-list"],
    queryFn: async () => {
      const res = await fetch("/api/public/events-list");
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <PublicLayout>
      <div className="flex-1 p-6 bg-gradient-to-b from-zinc-50 to-white">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>

          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-zinc-950 mb-3">Browse Events</h1>
            <p className="text-zinc-500 text-lg">Discover and book tickets for upcoming events</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(({ event, organizerName }: any) => (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                  onClick={() => setLocation(`/event/${event.slug || event.id}`)}
                >
                  {event.bannerUrl && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={event.bannerUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {!event.bannerUrl && (
                    <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Ticket className="w-12 h-12 text-white/60" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {event.ticketTypes}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        {organizerName}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 line-clamp-2 mb-3 flex-1">{event.title}</h3>
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatEventDate(event.eventDate, "EEE, MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatEventTime(event.eventDate, "h:mm a")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-1">{event.venue}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-xl font-bold text-zinc-900">€{(event.ticketPrice / 100).toFixed(2)}</span>
                        <span className="text-xs text-zinc-400 ml-1">per ticket</span>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-full px-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/event/${event.slug || event.id}`);
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-400">
              <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No events available right now. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
