import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAnalytics, useBookings, useEvents } from "@/hooks/use-organizer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Euro,
  Calendar,
  TrendingUp,
  Ticket,
  CalendarDays,
  ScanLine,
  BarChart3,
  ArrowRight,
  Clock,
  Users,
  Image,
} from "lucide-react";
import { Link } from "wouter";

export default function OrganizerDashboard() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: bookings, isLoading: bookingsLoading } = useBookings();
  const { data: events, isLoading: eventsLoading } = useEvents();

  const isLoading = analyticsLoading || bookingsLoading || eventsLoading;

  const summary = analytics?.summary;
  const recentBookings = bookings?.slice(0, 5) || [];
  const upcomingEvents = events
    ?.filter((e: any) => new Date(e.eventDate) >= new Date() && e.status === "active")
    ?.sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    ?.slice(0, 3) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
            Paid
          </span>
        );
      case "payment_submitted":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
            Verification
          </span>
        );
      case "pending_payment":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
            Pending
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-indigo-100 text-indigo-700",
      "bg-sky-100 text-sky-700",
      "bg-violet-100 text-violet-700",
      "bg-rose-100 text-rose-700",
      "bg-amber-100 text-amber-700",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <DashboardLayout role="organizer">
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-gray-100 rounded-lg animate-pulse" />
          </div>

          {/* KPI cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-6 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom section skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-36 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="space-y-1.5 text-right">
                    <div className="h-3.5 w-14 bg-gray-100 rounded animate-pulse" />
                    <div className="h-5 w-12 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="organizer">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening with your events today.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Euro className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Revenue</p>
                <p className="text-xl font-bold text-gray-900 tracking-tight">
                  €{((summary?.totalRevenue || 0) / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Bookings */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Bookings</p>
                <p className="text-xl font-bold text-gray-900 tracking-tight">
                  {summary?.totalBookings || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Active Events */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Active Events</p>
                <p className="text-xl font-bold text-gray-900 tracking-tight">
                  {summary?.activeEvents || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Attendance */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Attendance</p>
                <p className="text-xl font-bold text-gray-900 tracking-tight">
                  {summary?.avgAttendance || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/organizer/events">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Events</p>
                  <p className="text-xs text-gray-500">Manage events</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/organizer/bookings">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Bookings</p>
                  <p className="text-xs text-gray-500">View orders</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/organizer/analytics">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-500">View stats</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/organizer/scan">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ScanLine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Scan</p>
                  <p className="text-xs text-gray-500">Check-in guests</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Bottom Section: Recent Bookings + Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-0">
              <h3 className="text-sm font-semibold text-gray-900">Recent Bookings</h3>
              <Link href="/organizer/bookings">
                <span className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer transition-colors">
                  View all →
                </span>
              </Link>
            </div>
            <div className="p-5">
              {recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <Ticket className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No bookings yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Bookings will appear here once customers start purchasing tickets.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentBookings.map((row: any) => (
                    <div
                      key={row.booking.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${getAvatarColor(
                          row.booking.customerName
                        )}`}
                      >
                        {getInitials(row.booking.customerName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {row.booking.customerName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {row.event.title}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900">
                          €{((row.event.ticketPrice * row.booking.ticketQuantity) / 100).toFixed(2)}
                        </p>
                        {getStatusBadge(row.booking.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-0">
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Events</h3>
              <Link href="/organizer/events">
                <span className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer transition-colors">
                  View all →
                </span>
              </Link>
            </div>
            <div className="p-5">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No upcoming events</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create your first event to start selling tickets.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event: any) => {
                    const sold = event.totalCapacity - event.remainingCapacity;
                    const pct =
                      event.totalCapacity > 0
                        ? Math.round((sold / event.totalCapacity) * 100)
                        : 0;
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        {/* Poster or placeholder */}
                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                          {event.imageUrl ? (
                            <img
                              src={event.imageUrl}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image className="w-6 h-6 text-gray-300" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(new Date(event.eventDate), "d MMM yyyy")} ·{" "}
                              {format(new Date(event.eventDate), "hh:mm a")}
                            </span>
                          </div>
                          {event.venue && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              📍 {event.venue}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-medium text-gray-600">
                            {sold}/{event.totalCapacity}
                          </span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">Tickets Sold</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
