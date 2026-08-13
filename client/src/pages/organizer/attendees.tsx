import { useRoute, useParams } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useDeleteBooking, useEventTickets } from "@/hooks/use-organizer";
import { format } from "date-fns";
import { User, CheckCircle2, Clock, Loader2, ArrowLeft, Search, RefreshCw, AlertCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { PageHeader } from "@/components/organizer/page-header";
import { StatusBadge } from "@/components/organizer/status-badge";
import { EmptyState } from "@/components/organizer/empty-state";

export default function AttendeeList(props: { id?: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const params = useParams();
  const eventId = props.id || params?.id || "";
  const { data: attendees, isLoading, isRefetching, error } = useEventTickets(eventId);
  const deleteBooking = useDeleteBooking();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "scanned" | "unused">("all");

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [api.organizer.events.tickets.path, eventId] });
  };

  const filteredAttendees = useMemo(() => {
    if (!attendees) return [];
    return attendees.filter((item: any) => {
      const matchesSearch =
        item.booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ticket.uniqueTicketCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "scanned" && item.ticket.scanStatus === "scanned") ||
        (filterStatus === "unused" && item.ticket.scanStatus === "unused");

      return matchesSearch && matchesFilter;
    });
  }, [attendees, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    if (!attendees) return { total: 0, scanned: 0, pending: 0, percent: 0 };
    const total = attendees.length;
    const scanned = attendees.filter((a: any) => a.ticket.scanStatus === "scanned").length;
    return {
      total,
      scanned,
      pending: total - scanned,
      percent: total > 0 ? Math.round((scanned / total) * 100) : 0,
    };
  }, [attendees]);

  if (!eventId) {
    return (
      <DashboardLayout role="organizer">
        <div className="max-w-2xl mx-auto py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">No Event Selected</h2>
          <p className="text-sm text-gray-500 mt-2">Please go back to your events and select an event to view attendees.</p>
          <Link href="/organizer/events">
            <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Events
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout role="organizer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="organizer">
        <div className="max-w-2xl mx-auto py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Error Loading Attendees</h2>
          <p className="text-sm text-gray-500 mt-2">{error instanceof Error ? error.message : "Something went wrong while fetching data."}</p>
          <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleRefresh()}>
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="organizer">
      {/* Back link */}
      <Link href="/organizer/events">
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </span>
      </Link>

      <PageHeader title="Attendee List" subtitle="Track check-ins and manage ticket holders.">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="h-9 border-gray-200 text-gray-600 gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isRefetching ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </PageHeader>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-900">
            {stats.scanned} of {stats.total} Checked In
          </p>
          <span className="text-sm font-bold text-emerald-600">{stats.percent}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${stats.percent}%` }}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Total Tickets</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-[11px] text-emerald-600 font-medium uppercase tracking-wider">Checked In</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.scanned}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-[11px] text-amber-600 font-medium uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Search & Filter */}
        <div className="p-4 border-b border-gray-50 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email or ticket code..."
              className="pl-9 h-9 bg-gray-50 border-gray-200 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {[
              { key: "all" as const, label: "All" },
              { key: "scanned" as const, label: "Checked In" },
              { key: "unused" as const, label: "Pending" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === tab.key
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {filteredAttendees.length === 0 ? (
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="No attendees found"
            description="No attendees match your search or filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Attendee</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Ticket Code</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Checked In At</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.map((item: any) => (
                  <tr key={item.ticket.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-[13px] truncate">{item.booking.customerName}</p>
                          <p className="text-[11px] text-gray-500 truncate">{item.booking.customerEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">#{item.ticket.uniqueTicketCode}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={item.ticket.scanStatus === "scanned" ? "scanned" : "unused"} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell">
                      {item.ticket.scanStatus === "scanned" ? format(new Date(item.ticket.updatedAt), "MMM d, h:mm a") : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs"
                        onClick={async () => {
                          if (!window.confirm("Delete this attendee's booking? This frees tickets for the event.")) return;
                          try {
                            await deleteBooking.mutateAsync({ id: item.booking.id, eventId });
                            toast({ title: "Deleted", description: "Attendee booking removed and capacity updated." });
                          } catch (err: any) {
                            toast({ title: "Error", description: err.message || "Failed to delete booking", variant: "destructive" });
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
