import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAnalytics } from "@/hooks/use-organizer";
import { Loader2, Euro, Calendar, Users, TrendingUp } from "lucide-react";
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
import { PageHeader } from "@/components/organizer/page-header";
import { EmptyState } from "@/components/organizer/empty-state";

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
        <PageHeader title="Analytics" subtitle="Overview of your events, bookings, and revenue." />
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-6 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="h-5 w-32 bg-gray-100 rounded animate-pulse mb-4" />
                <div className="h-[250px] bg-gray-50 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout role="organizer">
        <PageHeader title="Analytics" subtitle="Overview of your events, bookings, and revenue." />
        <div className="bg-white rounded-2xl border border-gray-100">
          <EmptyState
            icon={<TrendingUp className="w-7 h-7" />}
            title="Failed to load analytics"
            description="Please try again later."
          />
        </div>
      </DashboardLayout>
    );
  }

  const { summary, revenueByEvent, funnel, salesOverTime, eventPerformance, attendance } = data;

  const revenueConfig: ChartConfig = {
    revenue: { label: "Revenue", color: "#6366f1" },
  };

  const funnelData = [
    { name: "Paid", value: funnel.paid, fill: FUNNEL_COLORS.paid },
    { name: "Awaiting Verification", value: funnel.payment_submitted, fill: FUNNEL_COLORS.payment_submitted },
    { name: "Awaiting Payment", value: funnel.pending_payment, fill: FUNNEL_COLORS.pending_payment },
    { name: "Cancelled", value: funnel.cancelled, fill: FUNNEL_COLORS.cancelled },
  ].filter((d) => d.value > 0);

  const funnelConfig: ChartConfig = {
    Paid: { label: "Paid", color: FUNNEL_COLORS.paid },
    "Awaiting Verification": { label: "Awaiting Verification", color: FUNNEL_COLORS.payment_submitted },
    "Awaiting Payment": { label: "Awaiting Payment", color: FUNNEL_COLORS.pending_payment },
    Cancelled: { label: "Cancelled", color: FUNNEL_COLORS.cancelled },
  };

  const salesConfig: ChartConfig = {
    count: { label: "Tickets Sold", color: "#6366f1" },
  };

  const perfConfig: ChartConfig = {
    sold: { label: "Sold", color: "#6366f1" },
    remaining: { label: "Remaining", color: "#e5e7eb" },
  };

  const attendanceConfig: ChartConfig = {
    scanned: { label: "Checked In", color: "#6366f1" },
    notScanned: { label: "Not Checked In", color: "#e5e7eb" },
  };

  const stats = [
    { label: "Total Revenue", value: `€${(summary.totalRevenue / 100).toFixed(2)}`, icon: Euro, color: "bg-indigo-50 text-indigo-600" },
    { label: "Total Bookings", value: summary.totalBookings, icon: TrendingUp, color: "bg-sky-50 text-sky-600" },
    { label: "Active Events", value: summary.activeEvents, icon: Calendar, color: "bg-amber-50 text-amber-600" },
    { label: "Avg Attendance", value: `${summary.avgAttendance}%`, icon: Users, color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <DashboardLayout role="organizer">
      <PageHeader title="Analytics" subtitle="Overview of your events, bookings, and revenue." />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Event */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 pt-5 pb-0">
            <h3 className="text-sm font-semibold text-gray-900">Revenue by Event</h3>
          </div>
          <div className="p-5">
            {revenueByEvent.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">No revenue data yet.</p>
            ) : (
              <ChartContainer config={revenueConfig} className="h-[250px]">
                <BarChart data={revenueByEvent} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tickFormatter={(v) => `€${(v / 100).toFixed(0)}`} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="title" width={120} fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => `€${(Number(v) / 100).toFixed(2)}`} />} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* Booking Funnel */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 pt-5 pb-0">
            <h3 className="text-sm font-semibold text-gray-900">Booking Funnel</h3>
          </div>
          <div className="p-5">
            {funnelData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">No bookings yet.</p>
            ) : (
              <ChartContainer config={funnelConfig} className="h-[250px]">
                <PieChart>
                  <Pie
                    data={funnelData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    fontSize={11}
                  >
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </div>
        </div>
      </div>

      {/* Sales Over Time */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 pt-5 pb-0">
          <h3 className="text-sm font-semibold text-gray-900">Tickets Sold — Last 30 Days</h3>
        </div>
        <div className="p-5">
          {salesOverTime.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">No sales data in the last 30 days.</p>
          ) : (
            <ChartContainer config={salesConfig} className="h-[220px]">
              <LineChart data={salesOverTime} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: "#6366f1" }} />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Performance */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 pt-5 pb-0">
            <h3 className="text-sm font-semibold text-gray-900">Event Performance</h3>
          </div>
          <div className="p-5">
            {eventPerformance.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">No events yet.</p>
            ) : (
              <ChartContainer config={perfConfig} className="h-[250px]">
                <BarChart data={eventPerformance} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="title" width={120} fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="sold" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="remaining" stackId="a" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* Attendance */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 pt-5 pb-0">
            <h3 className="text-sm font-semibold text-gray-900">Check-in Attendance</h3>
          </div>
          <div className="p-5">
            {attendance.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">No attendance data yet.</p>
            ) : (
              <div className="space-y-4">
                {attendance.map((a) => {
                  const notScanned = a.total - a.scanned;
                  const pct = a.total > 0 ? Math.round((a.scanned / a.total) * 100) : 0;
                  const attData = [
                    { name: "Checked In", value: a.scanned, fill: "#6366f1" },
                    { name: "Not Checked In", value: notScanned, fill: "#e5e7eb" },
                  ].filter((d) => d.value > 0);
                  return (
                    <div key={a.eventId} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                        <p className="text-xs text-gray-500">
                          {a.scanned}/{a.total} checked in ({pct}%)
                        </p>
                      </div>
                      <div className="w-14 h-14 shrink-0">
                        <ChartContainer config={attendanceConfig} className="h-full w-full">
                          <PieChart>
                            <Pie data={attData} dataKey="value" cx="50%" cy="50%" innerRadius={16} outerRadius={26} strokeWidth={0}>
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
