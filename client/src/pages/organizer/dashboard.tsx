import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAnalytics, useBookings, useEvents } from "@/hooks/use-organizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Euro, Calendar, TrendingUp, Ticket, Plus, ScanLine, BarChart3, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";

export default function OrganizerDashboard() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: bookings, isLoading: bookingsLoading } = useBookings();
  const { data: events, isLoading: eventsLoading } = useEvents();

  const isLoading = analyticsLoading || bookingsLoading || eventsLoading;

  if (isLoading) {
    return (
      <DashboardLayout role="organizer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const summary = analytics?.summary;
  const recentBookings = bookings?.slice(0, 5) || [];
  const upcomingEvents = events
    ?.filter((e: any) => new Date(e.eventDate) >= new Date() && e.status === 'active')
    ?.sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    ?.slice(0, 3) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-xs">Paid</Badge>;
      case 'payment_submitted': return <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">Verification</Badge>;
      case 'pending_payment': return <Badge variant="secondary" className="text-xs">Pending</Badge>;
      case 'cancelled': return <Badge variant="outline" className="text-xs">Cancelled</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout role="organizer">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Euro className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">€{((summary?.totalRevenue || 0) / 100).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bookings</p>
                <p className="text-xl font-bold">{summary?.totalBookings || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Events</p>
                <p className="text-xl font-bold">{summary?.activeEvents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p className="text-xl font-bold">{summary?.avgAttendance || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Link href="/organizer/events">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Events</p>
                <p className="text-xs text-muted-foreground">Manage events</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/organizer/bookings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Bookings</p>
                <p className="text-xs text-muted-foreground">View orders</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/organizer/analytics">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Analytics</p>
                <p className="text-xs text-muted-foreground">View stats</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/organizer/scan">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <ScanLine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Scan</p>
                <p className="text-xs text-muted-foreground">Check-in tickets</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <div className="flex items-center justify-between p-4 pb-0">
            <h3 className="font-semibold">Recent Bookings</h3>
            <Link href="/organizer/bookings">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <CardContent className="p-4">
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((row: any) => (
                  <div key={row.booking.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{row.booking.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{row.event.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">€{((row.event.ticketPrice * row.booking.ticketQuantity) / 100).toFixed(2)}</p>
                      {getStatusBadge(row.booking.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <div className="flex items-center justify-between p-4 pb-0">
            <h3 className="font-semibold">Upcoming Events</h3>
            <Link href="/organizer/events">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <CardContent className="p-4">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event: any) => {
                  const sold = event.totalCapacity - event.remainingCapacity;
                  const pct = event.totalCapacity > 0 ? Math.round((sold / event.totalCapacity) * 100) : 0;
                  return (
                    <div key={event.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(event.eventDate), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{sold}/{event.totalCapacity}</p>
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
