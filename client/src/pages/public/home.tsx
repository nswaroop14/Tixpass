import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Ticket,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  Zap,
  Smartphone,
  Shield,
  CheckCircle2,
  QrCode,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { formatEventDate, formatEventTime } from "@/lib/date-utils";

function useActiveEvents() {
  return useQuery({
    queryKey: ["/api/public/events-list"],
    queryFn: async () => {
      const res = await fetch("/api/public/events-list");
      if (!res.ok) return [];
      const data = await res.json();
      return data;
    },
  });
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: events, isLoading } = useActiveEvents();

  const featuredEvents = events?.slice(0, 6) || [];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative bg-gray-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-gray-950 to-gray-950" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-violet-300">Discover &amp; Book Experiences</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold text-white leading-[1.05] tracking-tight mb-6">
              Your next experience
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                starts here.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-10 leading-relaxed">
              Discover movies, events and unforgettable experiences. Book in seconds with TixPass.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="h-14 px-8 text-base font-semibold rounded-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
                onClick={() => setLocation("/browse")}
              >
                Explore Events <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base font-semibold rounded-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                onClick={() => setLocation("/organizer/signup")}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </section>

      {/* Trust Strip */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Ticket, label: "Easy Booking", sub: "Book in seconds" },
              { icon: Zap, label: "Fast Checkout", sub: "Secure & seamless" },
              { icon: Smartphone, label: "Digital Tickets", sub: "Always on your phone" },
              { icon: Shield, label: "Secure Payments", sub: "Multiple methods" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-2">What's happening</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-950 mb-3">
              Find something worth showing up for
            </h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto">
              Explore upcoming events, movies and experiences near you.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : featuredEvents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredEvents.map(({ event, organizerName }: any) => (
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
              <div className="text-center mt-10">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 gap-2 border-gray-200 text-gray-700 hover:text-violet-700 hover:border-violet-200"
                  onClick={() => setLocation("/browse")}
                >
                  View All Events <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-violet-300" />
              </div>
              <p className="text-lg text-gray-500 font-medium">No events available right now</p>
              <p className="text-sm text-gray-400 mt-1">Check back soon for exciting experiences!</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-2">How it works</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-950">
              Three steps to your next experience
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "01",
                title: "Discover",
                desc: "Find an event you want to attend from our curated selection.",
                icon: Ticket,
              },
              {
                step: "02",
                title: "Book",
                desc: "Choose your tickets and pay securely in seconds.",
                icon: CreditCard,
              },
              {
                step: "03",
                title: "Enjoy",
                desc: "Show your digital ticket at the entrance and enjoy the show.",
                icon: QrCode,
              },
            ].map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto md:mx-0 mb-5">
                  <item.icon className="w-7 h-7 text-violet-600" />
                </div>
                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Step {item.step}</span>
                <h3 className="text-xl font-bold text-gray-950 mt-2 mb-2">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why TixPass */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-2">Why TixPass</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-950">
              Built for modern events
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: QrCode,
                title: "QR Check-in",
                desc: "Scan and verify tickets instantly at the venue entrance.",
              },
              {
                icon: Zap,
                title: "Instant Booking",
                desc: "Customers book and receive digital tickets in seconds.",
              },
              {
                icon: CreditCard,
                title: "Multiple Payments",
                desc: "Accept PayPal, bank transfers, Revolut and more.",
              },
              {
                icon: BarChart3,
                title: "Organizer Analytics",
                desc: "Track bookings, revenue and attendee insights in real time.",
              },
              {
                icon: Smartphone,
                title: "Mobile First",
                desc: "Digital tickets that live on your phone. No paper needed.",
              },
              {
                icon: Shield,
                title: "Secure & Reliable",
                desc: "Your data and transactions are protected at every step.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="text-base font-bold text-gray-950 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-6 leading-tight">
            Ready for your next experience?
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-lg mx-auto">
            Explore upcoming events and book your tickets in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-14 px-8 text-base font-semibold rounded-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
              onClick={() => setLocation("/browse")}
            >
              Explore Events <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base font-semibold rounded-full border-white/20 text-white hover:bg-white/10 hover:text-white"
              onClick={() => setLocation("/organizer/signup")}
            >
              Get Started as Organizer
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
