import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAnalytics } from "@/hooks/use-organizer";
import { Loader2, Euro, Calendar, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#18181b", "#71717a", "#d4d4d8", "#f4f4f5"];

const FUNNEL_COLORS: Record<string, string> = {
  paid: "#22c55e",
  payment_submitted: "#f59e0b",
  pending_payment: "#a1a1aa",
  cancelled: "#ef4444",
};

export default function OrganizerAnalytics() {
  const { data, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <DashboardLayout role="organizer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout role="organizer">
        <div className="text-center py-20 text-muted-foreground">
          Failed to load analytics. Please try again later.
        </div>
      </DashboardLayout>
    );
  }

  const { summary, revenueByEvent, funnel, salesOverTime, eventPerformance, attendance } = data;

  const revenueConfig: ChartConfig = {
    revenue: { label: "Revenue", color: "#18181b" },
  };

  const funnelData = [
    { name: "Paid", value: funnel.paid, fill: FUNNEL_COLORS.paid },
    { name: "Awaiting Verification", value: funnel.payment_submitted, fill: FUNNEL_COLORS.payment_submitted },
    { name: "Awaiting Payment", value: funnel.pending_payment, fill: FUNNEL_COLORS.pending_payment },
    { name: "Cancelled", value: funnel.cancelled, fill: FUNNEL_COLORS.cancelled },
  ].filter(d => d.value > 0);

  const funnelConfig: ChartConfig = {
    Paid: { label: "Paid", color: FUNNEL_COLORS.paid },
    "Awaiting Verification": { label: "Awaiting Verification", color: FUNNEL_COLORS.payment_submitted },
    "Awaiting Payment": { label: "Awaiting Payment", color: FUNNEL_COLORS.pending_payment },
    Cancelled: { label: "Cancelled", color: FUNNEL_COLORS.cancelled },
  };

  const salesConfig: ChartConfig = {
    count: { label: "Tickets Sold", color: "#18181b" },
  };

  const perfConfig: ChartConfig = {
    sold: { label: "Sold", color: "#18181b" },
    remaining: { label: "Remaining", color: "#d4d4d8" },
  };

  const attendanceConfig: ChartConfig = {
    scanned: { label: "Checked In", color: "#18181b" },
    notScanned: { label: "Not Checked In", color: "#d4d4d8" },
  };

  return (
    <DashboardLayout role="organizer">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold">Analytics</h2>
        <p className="text-muted-foreground mt-1">Overview of your events, bookings, and revenue.</p>
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
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold">€{(summary.totalRevenue / 100).toFixed(2)}</p>
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
                <p className="text-xs text-muted-foreground">Total Bookings</p>
                <p className="text-xl font-bold">{summary.totalBookings}</p>
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
                <p className="text-xl font-bold">{summary.activeEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Attendance</p>
                <p className="text-xl font-bold">{summary.avgAttendance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Event */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Event</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByEvent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No revenue data yet.</p>
            ) : (
              <ChartContainer config={revenueConfig} className="h-[250px]">
                <BarChart data={revenueByEvent} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `€${(v / 100).toFixed(0)}`} fontSize={12} />
                  <YAxis type="category" dataKey="title" width={120} fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => `€${(Number(v) / 100).toFixed(2)}`} />} />
                  <Bar dataKey="revenue" fill="#18181b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Booking Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No bookings yet.</p>
            ) : (
              <ChartContainer config={funnelConfig} className="h-[250px]">
                <PieChart>
                  <Pie data={funnelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Over Time */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Tickets Sold — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {salesOverTime.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No sales data in the last 30 days.</p>
          ) : (
            <ChartContainer config={salesConfig} className="h-[220px]">
              <LineChart data={salesOverTime} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="#18181b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Event Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {eventPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No events yet.</p>
            ) : (
              <ChartContainer config={perfConfig} className="h-[250px]">
                <BarChart data={eventPerformance} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="title" width={120} fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="sold" stackId="a" fill="#18181b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="remaining" stackId="a" fill="#d4d4d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Check-in Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No attendance data yet.</p>
            ) : (
              <div className="space-y-4">
                {attendance.map((a) => {
                  const notScanned = a.total - a.scanned;
                  const pct = a.total > 0 ? Math.round((a.scanned / a.total) * 100) : 0;
                  const attData = [
                    { name: "Checked In", value: a.scanned, fill: "#18181b" },
                    { name: "Not Checked In", value: notScanned, fill: "#d4d4d8" },
                  ].filter(d => d.value > 0);
                  return (
                    <div key={a.eventId} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.scanned}/{a.total} checked in ({pct}%)</p>
                      </div>
                      <div className="w-16 h-16 shrink-0">
                        <ChartContainer config={attendanceConfig} className="h-full w-full">
                          <PieChart>
                            <Pie data={attData} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={28} strokeWidth={0}>
                              {attData.map((entry, i) => (
                                <Cell key={i} fill={entry.fill} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ChartContainer>
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
