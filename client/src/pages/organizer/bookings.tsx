import { useMemo, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  useBookings,
  useApproveBooking,
  useEvents,
  useManualCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
  useResendTickets,
  useOrganizerProfile,
  useSaveBookingFilterPreferences,
  useTicketsByBooking,
} from "@/hooks/use-organizer";
import { Button } from "@/components/ui/button";
import { formatEventDateTime, parseWallClock } from "@/lib/date-utils";
import { shareTicketPdf } from "@/lib/ticket-pdf";
import { CheckCircle2, Loader2, Plus, Edit3, Trash2, Send, Download, Filter, Ticket, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/organizer/page-header";
import { StatusBadge } from "@/components/organizer/status-badge";
import { EmptyState } from "@/components/organizer/empty-state";

export default function OrganizerBookings() {
  const { data: bookings, isLoading: isBookingsLoading } = useBookings();
  const { data: events, isLoading: isEventsLoading } = useEvents();
  const { data: profile, isLoading: isProfileLoading } = useOrganizerProfile();
  const approve = useApproveBooking();
  const manualCreate = useManualCreateBooking();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();
  const resendTickets = useResendTickets();
  const fetchTicketsByBooking = useTicketsByBooking();
  const saveFilterPreferences = useSaveBookingFilterPreferences();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [whatsAppSending, setWhatsAppSending] = useState(false);
  const [formData, setFormData] = useState({
    eventId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    ticketQuantity: "1",
  });

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [isResendConfirmOpen, setIsResendConfirmOpen] = useState(false);
  const [bookingToResend, setBookingToResend] = useState<any | null>(null);

  // Load saved filter preferences from profile
  useEffect(() => {
    if (profile?.bookingFilterPreferences) {
      const { eventId, status } = profile.bookingFilterPreferences;
      if (eventId) setSelectedEventId(eventId);
      if (status) setSelectedStatus(status);
    }
  }, [profile]);

  // Save filter preferences when they change (debounced)
  useEffect(() => {
    if (isProfileLoading) return;
    const timeout = setTimeout(() => {
      saveFilterPreferences.mutate({ eventId: selectedEventId, status: selectedStatus });
    }, 500);
    return () => clearTimeout(timeout);
  }, [selectedEventId, selectedStatus, saveFilterPreferences, isProfileLoading]);

  // Auto-select event when dialog opens and only one active event exists
  useEffect(() => {
    if (isOpen) {
      const activeEvents = events?.filter((e: any) => e.status === "active" && e.remainingCapacity > 0) || [];
      if (activeEvents.length === 1) {
        setFormData(prev => ({ ...prev, eventId: activeEvents[0].id }));
      }
    }
  }, [isOpen, events]);

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    let result = bookings;
    // When no specific event is selected, only show bookings for active events
    if (!selectedEventId) {
      result = result.filter((row: any) => row.event.status === "active");
    } else {
      result = result.filter((row: any) => row.event.id === selectedEventId);
    }
    if (selectedStatus) {
      result = result.filter((row: any) => row.booking.status === selectedStatus);
    }
    return [...result].sort((a: any, b: any) => parseWallClock(b.booking.createdAt).getTime() - parseWallClock(a.booking.createdAt).getTime());
  }, [bookings, selectedEventId, selectedStatus]);

  const isLoadingState = isBookingsLoading || isEventsLoading;
  const isEmptyState = !filteredBookings || filteredBookings.length === 0;

  const handleDownloadCsv = async () => {
    try {
      const token = localStorage.getItem("token");
      const q = selectedEventId ? `?eventId=${selectedEventId}` : "";
      const res = await fetch(`/api/organizer/bookings/export${q}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings${selectedEventId ? `_${selectedEventId}` : ""}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "CSV downloaded", description: "Your bookings export has started." });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    }
  };

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await manualCreate.mutateAsync({
        ...formData,
        ticketQuantity: parseInt(formData.ticketQuantity),
      });
      setIsOpen(false);
      setFormData({ eventId: "", customerName: "", customerEmail: "", customerPhone: "", ticketQuantity: "1" });
      toast({ title: "Success", description: "Manual ticket created successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openEditDialog = (row: any) => {
    setEditingBooking(row);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    try {
      await updateBooking.mutateAsync({
        id: editingBooking.booking.id,
        data: {
          customerName: editingBooking.booking.customerName,
          customerEmail: editingBooking.booking.customerEmail,
          customerPhone: editingBooking.booking.customerPhone,
        },
      });
      setIsEditOpen(false);
      setEditingBooking(null);
      toast({ title: "Updated", description: "Booking details updated successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteBooking = async (row: any) => {
    if (!window.confirm("Are you sure you want to delete this booking? This will free up the tickets.")) {
      return;
    }
    try {
      await deleteBooking.mutateAsync({ id: row.booking.id, eventId: row.event.id });
      toast({ title: "Deleted", description: "Booking deleted successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleResendTickets = async () => {
    if (!bookingToResend) return;
    try {
      await resendTickets.mutateAsync(bookingToResend.booking.id);
      setIsResendConfirmOpen(false);
      setBookingToResend(null);
      toast({ title: "Resent", description: "Tickets resent successfully to " + bookingToResend.booking.customerEmail });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleWhatsAppShare = async (row: any) => {
    if (!row.booking.customerPhone) return;
    setWhatsAppSending(true);
    try {
      const phone = row.booking.customerPhone?.replace(/\D/g, '') || '';
      const success = await shareTicketPdf(row.booking.id, row.event.title);
      if (!success && phone) {
        const phoneMsg = encodeURIComponent(`Your ticket for ${row.event.title} is confirmed!\n\nPlease check your email for the ticket PDF.`);
        window.open(`https://wa.me/${phone}?text=${phoneMsg}`, "_blank");
        toast({ title: "PDF downloaded", description: "Ticket PDF downloaded. Attach it in the WhatsApp chat." });
      }
    } catch (err: any) {
      console.error('WhatsApp share error:', err);
      toast({ title: "Error", description: err?.message || "Failed to generate ticket PDF", variant: "destructive" });
    } finally {
      setWhatsAppSending(false);
    }
  };

  const openResendConfirm = (row: any) => {
    setBookingToResend(row);
    setIsResendConfirmOpen(true);
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

  return (
    <DashboardLayout role="organizer">
      <PageHeader
        title="Bookings"
        subtitle="Review customer orders and verify payments."
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <Select value={selectedEventId || "all"} onValueChange={(v) => setSelectedEventId(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 bg-white border-gray-200 text-sm">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events?.filter((event: any) => event.status === "active").map((event: any) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus || "all"} onValueChange={(v) => setSelectedStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 bg-white border-gray-200 text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="payment_submitted">Pending Review</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCsv}
              className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 text-sm w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>

            <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) {
                setFormData({ eventId: "", customerName: "", customerEmail: "", customerPhone: "", ticketQuantity: "1" });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-9 text-sm">
                <Plus className="w-4 h-4" />
                Manual Ticket
              </Button>
            </DialogTrigger>
<DialogContent className="sm:max-w-[425px] max-w-[calc(100%-1rem)] sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Create Manual Ticket</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleManualCreate} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Select Event</Label>
                  <Select value={formData.eventId} onValueChange={(val) => setFormData({ ...formData, eventId: val })}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events?.filter((event: any) => event.status === "active").map((event: any) => (
                        <SelectItem key={event.id} value={event.id} disabled={event.remainingCapacity <= 0}>
                          {event.title} ({event.remainingCapacity} left)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Customer Name</Label>
                  <Input required value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Customer Email</Label>
                  <Input required type="email" value={formData.customerEmail} onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Customer Phone</Label>
                  <Input required type="tel" value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Ticket Quantity</Label>
                  <Input required type="number" min="1" value={formData.ticketQuantity} onChange={(e) => setFormData({ ...formData, ticketQuantity: e.target.value })} className="h-9" />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={manualCreate.isPending}>
                  {manualCreate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Tickets"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </PageHeader>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoadingState ? (
          <div className="p-12 flex justify-center">
            <div className="space-y-4 w-full max-w-2xl">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : isEmptyState ? (
            <EmptyState
              icon={<Ticket className="w-7 h-7" />}
              title={selectedEventId ? "No bookings for this event" : "No bookings yet"}
              description={selectedEventId ? "No bookings have been made yet for this event." : "When customers book tickets, their orders will appear here."}
            />
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden">
              {filteredBookings.map((row: any) => (
                <div key={row.booking.id} className="border-b border-gray-100 p-4 last:border-0 bg-white">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 ${getAvatarColor(row.booking.customerName)}`}>
                      {getInitials(row.booking.customerName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-900 truncate text-sm">{row.booking.customerName}</p>
                        <StatusBadge status={row.booking.status} />
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{row.booking.customerEmail}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{row.event.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatEventDateTime(row.event.eventDate, "MMM d, yyyy")}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Booked: {formatEventDateTime(row.booking.createdAt, "MMM d, yyyy · h:mm a")}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5" />
                      Qty: {row.booking.ticketQuantity}
                    </span>
                    <span className="font-semibold text-gray-900">
                      €{((row.event.ticketPrice * row.booking.ticketQuantity) / 100).toFixed(2)}
                    </span>
                    {row.booking.status === "paid" && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        Sent
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {row.booking.status === "payment_submitted" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                        onClick={() => approve.mutate(row.booking.id)}
                        disabled={approve.isPending}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </Button>
                    )}
                    {row.booking.status === "paid" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 gap-1"
                        onClick={() => openResendConfirm(row)}
                        disabled={resendTickets.isPending}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Resend
                      </Button>
                    )}
                    {row.booking.status === "paid" && row.booking.customerPhone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 gap-1"
                        onClick={() => handleWhatsAppShare(row)}
                        disabled={whatsAppSending || resendTickets.isPending}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </Button>
                    )}
                    {row.booking.status === "paid" && !row.booking.customerPhone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-gray-300 cursor-not-allowed gap-1"
                        disabled
                        title="No WhatsApp number in booking"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 gap-1"
                      onClick={() => openEditDialog(row)}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 gap-1"
                      onClick={() => handleDeleteBooking(row)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Booked</th>
                  <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Sent</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((row: any) => (
                  <tr key={row.booking.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${getAvatarColor(row.booking.customerName)}`}>
                          {getInitials(row.booking.customerName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate text-[13px]">{row.booking.customerName}</p>
                          <p className="text-[11px] text-gray-500 truncate">{row.booking.customerEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900 line-clamp-1 text-[13px]">{row.event.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{formatEventDateTime(row.event.eventDate, "MMM d, yyyy")}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[11px] text-gray-500">{formatEventDateTime(row.booking.createdAt, "MMM d, yyyy · h:mm a")}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center font-medium text-gray-900">{row.booking.ticketQuantity}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                      €{((row.event.ticketPrice * row.booking.ticketQuantity) / 100).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={row.booking.status} />
                    </td>
                    <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                      {row.booking.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-medium">Yes</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end items-center gap-1">
                        {row.booking.status === "payment_submitted" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Approve"
                            onClick={() => approve.mutate(row.booking.id)}
                            disabled={approve.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        {row.booking.status === "paid" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Resend tickets"
                            onClick={() => openResendConfirm(row)}
                            disabled={resendTickets.isPending}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {row.booking.status === "paid" && row.booking.customerPhone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Send via WhatsApp"
                            onClick={() => handleWhatsAppShare(row)}
                            disabled={whatsAppSending || resendTickets.isPending}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}
                        {row.booking.status === "paid" && !row.booking.customerPhone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-300 cursor-not-allowed"
                            title="No WhatsApp number in booking"
                            disabled
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          title="Edit"
                          onClick={() => openEditDialog(row)}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete"
                          onClick={() => handleDeleteBooking(row)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Booking</DialogTitle>
          </DialogHeader>
          {editingBooking && (
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Customer Name</Label>
                <Input
                  required
                  value={editingBooking.booking.customerName}
                  onChange={(e) =>
                    setEditingBooking({
                      ...editingBooking,
                      booking: { ...editingBooking.booking, customerName: e.target.value },
                    })
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Customer Email</Label>
                <Input
                  required
                  type="email"
                  value={editingBooking.booking.customerEmail}
                  onChange={(e) =>
                    setEditingBooking({
                      ...editingBooking,
                      booking: { ...editingBooking.booking, customerEmail: e.target.value },
                    })
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Customer Phone</Label>
                <Input
                  required
                  type="tel"
                  value={editingBooking.booking.customerPhone}
                  onChange={(e) =>
                    setEditingBooking({
                      ...editingBooking,
                      booking: { ...editingBooking.booking, customerPhone: e.target.value },
                    })
                  }
                  className="h-9"
                />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={updateBooking.isPending}>
                {updateBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Resend Dialog */}
      <Dialog open={isResendConfirmOpen} onOpenChange={setIsResendConfirmOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Resend Tickets</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              This will re-send the confirmation email with all tickets to <strong>{bookingToResend?.booking.customerEmail}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <p>
                <span className="text-gray-500">Customer:</span> <span className="font-medium text-gray-900">{bookingToResend?.booking.customerName}</span>
              </p>
              <p>
                <span className="text-gray-500">Event:</span> <span className="font-medium text-gray-900">{bookingToResend?.event.title}</span>
              </p>
              <p>
                <span className="text-gray-500">Quantity:</span> <span className="font-medium text-gray-900">{bookingToResend?.booking.ticketQuantity} tickets</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResendConfirmOpen(false)} className="border-gray-200 text-gray-600">
              Cancel
            </Button>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleResendTickets} disabled={resendTickets.isPending}>
              {resendTickets.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Confirm Resend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
