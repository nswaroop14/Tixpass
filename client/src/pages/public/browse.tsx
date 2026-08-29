import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, MapPin, Loader2, Clock, ArrowLeft, Search } from "lucide-react";
import { formatEventDate, formatEventTime } from "@/lib/date-utils";
import { useState, useMemo } from "react";

export default function BrowseEvents() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/public/events-list"],
    queryFn: async () => {
      const res = await fetch("/api/public/events-list");
      if (!res.ok) {
        console.error("Failed to fetch events:", res.status);
        return [];
      }
      const data = await res.json();
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!events) return [];
    const valid = events.filter(({ event }: any) => event && event.eventDate);
    if (!search.trim()) return valid;
    const q = search.toLowerCase();
    return valid.filter(
      ({ event, organizerName }: any) =>
        event.title?.toLowerCase().includes(q) ||
        event.venue?.toLowerCase().includes(q) ||
        event.ticketTypes?.toLowerCase().includes(q) ||
        organizerName?.toLowerCase().includes(q)
    );
  }, [events, search]);

  return (
    <PublicLayout>
      {/* Header */}
      <section className="bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-gray-950 to-gray-950" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <h1 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-3">
            Discover Events
          </h1>
          <p className="text-gray-400 text-lg max-w-lg mb-8">
            Find movies, shows and experiences worth going out for.
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events, venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
      </section>

      {/* Events Grid */}
      <section className="py-12 md:py-16 bg-gray-50 min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(({ event, organizerName }: any) => (
                <div
                  key={event.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col"
                  onClick={() => setLocation(`/event/${event.slug || event.id}`)}
                >
                  <div className="relative h-52 overflow-hidden">
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                        <Ticket className="w-14 h-14 text-white/40" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white rounded-lg text-[11px] font-semibold uppercase tracking-wider">
                        {event.ticketTypes}
                      </span>
                    </div>
                    {event.status === "active" && event.remainingCapacity > 0 && event.remainingCapacity <= 15 && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[11px] font-semibold">
                          Only {event.remainingCapacity} left
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-[11px] font-medium text-violet-600 mb-1">{organizerName}</p>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-3 group-hover:text-violet-700 transition-colors">
                      {event.title}
                    </h3>
                    <div className="space-y-1.5 mb-4 mt-auto">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        <span>{formatEventDate(event.eventDate, "EEE, MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        <span>{formatEventTime(event.eventDate, "h:mm a")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        <span className="line-clamp-1">{event.venue}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-xl font-bold text-gray-900">
                          €{(event.ticketPrice / 100).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">per ticket</span>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-full px-5 bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/event/${event.slug || event.id}`);
                        }}
                      >
                        Book Now <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-violet-300" />
              </div>
              <p className="text-lg text-gray-500 font-medium">
                {search ? "No events match your search" : "No events available right now"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {search ? "Try different keywords" : "Check back soon for exciting experiences!"}
              </p>
              {search && (
                <Button
                  variant="outline"
                  className="mt-6 rounded-full"
                  onClick={() => setSearch("")}
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
