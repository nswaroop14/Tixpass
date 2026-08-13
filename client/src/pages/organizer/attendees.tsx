import { useRoute, useParams } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useDeleteBooking, useEventTickets } from "@/hooks/use-organizer";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { User, CheckCircle2, Clock, Loader2, ArrowLeft, Search, Filter, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";

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
    if (!attendees) return { total: 0, scanned: 0, pending: 0 };
    const total = attendees.length;
    const scanned = attendees.filter((a: any) => a.ticket.scanStatus === 'scanned').length;
    return {
      total,
      scanned,
      pending: total - scanned,
      percent: total > 0 ? Math.round((scanned / total) * 100) : 0
    };
  }, [attendees]);

  if (!eventId) {
    return (
      <DashboardLayout role="organizer">
        <div className="max-w-2xl mx-auto py-20 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold">No Event Selected</h2>
          <p className="text-muted-foreground mt-2">Please go back to your events and select an event to view attendees.</p>
          <Link href="/organizer/events">
            <Button className="mt-6">Back to Events</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout role="organizer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="organizer">
        <div className="max-w-2xl mx-auto py-20 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Error Loading Attendees</h2>
          <p className="text-muted-foreground mt-2">{error instanceof Error ? error.message : 'Something went wrong while fetching data.'}</p>
          <Button className="mt-6" onClick={() => handleRefresh()}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="organizer">
      <div className="mb-8">
        <Link href="/organizer/events">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold">Attendee List</h2>
            <p className="text-muted-foreground mt-1">Track check-ins and manage ticket holders.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefetching}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              {isRefetching ? 'Refreshing...' : 'Refresh'}
            </Button>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{stats.scanned} of {stats.total} Checked In</p>
                <div className="w-32 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>
              </div>
              <Badge variant="outline" className="px-3 py-1 text-sm bg-emerald-50 text-emerald-700 border-emerald-200">
                {stats.percent}% Checked In
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Tickets</p>
          <p className="text-3xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-emerald-600">Checked In</p>
          <p className="text-3xl font-bold mt-2 text-emerald-600">{stats.scanned}</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-amber-600">Pending</p>
          <p className="text-3xl font-bold mt-2 text-amber-600">{stats.pending}</p>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/20 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email or ticket code..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={filterStatus === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button 
                variant={filterStatus === 'scanned' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('scanned')}
              >
                Scanned
              </Button>
              <Button 
                variant={filterStatus === 'unused' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('unused')}
              >
                Pending
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Attendee</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Ticket Code</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Checked In At</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAttendees.length > 0 ? (
                filteredAttendees.map((item: any) => (
                  <tr key={item.ticket.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.booking.customerName}</p>
                          <p className="text-xs text-muted-foreground">{item.booking.customerEmail}</p>
                        </div>
                      </div>
                  </td>
                    <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                      #{item.ticket.uniqueTicketCode}
                    </td>
                    <td className="px-6 py-4">
                      {item.ticket.scanStatus === 'scanned' ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {item.ticket.scanStatus === 'scanned' 
                        ? format(new Date(item.ticket.updatedAt), 'MMM d, h:mm a')
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
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
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No attendees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
