import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  useBookings,
  useApproveBooking,
  useEvents,
  useManualCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
  useResendTickets,
} from "@/hooks/use-organizer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Ticket, CheckCircle2, XCircle, Loader2, PlusCircle, Edit3, Trash2, Filter, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function OrganizerBookings() {
  const { data: bookings, isLoading: isBookingsLoading } = useBookings();
  const { data: events, isLoading: isEventsLoading } = useEvents();
  const approve = useApproveBooking();
  const manualCreate = useManualCreateBooking();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();
  const resendTickets = useResendTickets();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    eventId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    ticketQuantity: "1",
  });

  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [isResendConfirmOpen, setIsResendConfirmOpen] = useState(false);
  const [bookingToResend, setBookingToResend] = useState<any | null>(null);

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    if (!selectedEventId || selectedEventId === "all") return bookings;
    return bookings.filter((row: any) => row.event.id === selectedEventId);
  }, [bookings, selectedEventId]);

  const isLoadingState = isBookingsLoading || isEventsLoading;
  const isEmptyState = !filteredBookings || filteredBookings.length === 0;
  const handleDownloadCsv = async () => {
    try {
      const token = localStorage.getItem("token");
      const q = selectedEventId && selectedEventId !== "all" ? `?eventId=${selectedEventId}` : "";
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
      a.download = `bookings${selectedEventId && selectedEventId !== "all" ? `_${selectedEventId}` : ""}.csv`;
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
        ticketQuantity: parseInt(formData.ticketQuantity)
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

  const openResendConfirm = (row: any) => {
    setBookingToResend(row);
    setIsResendConfirmOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Paid & Approved</Badge>;
      case 'payment_submitted': return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Verification Needed</Badge>;
      case 'pending_payment': return <Badge variant="secondary">Awaiting Payment</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout role="organizer">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Bookings & Orders</h2>
          <p className="text-muted-foreground mt-1">Review customer orders and verify payments.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {events?.map((event: any) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleDownloadCsv} className="flex-1 sm:flex-none">Download CSV</Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="hover-elevate gap-2">
              <PlusCircle className="w-4 h-4" /> Manual Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Manual Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleManualCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Event</Label>
                <Select value={formData.eventId} onValueChange={(val) => setFormData({...formData, eventId: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events?.map((event: any) => (
                      <SelectItem key={event.id} value={event.id} disabled={event.remainingCapacity <= 0}>
                        {event.title} ({event.remainingCapacity} left)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Customer Email</Label>
                <Input required type="email" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Customer Phone</Label>
                <Input required type="tel" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Ticket Quantity</Label>
                <Input required type="number" min="1" value={formData.ticketQuantity} onChange={e => setFormData({...formData, ticketQuantity: e.target.value})} />
              </div>
              <Button type="submit" className="w-full" disabled={manualCreate.isPending}>
                {manualCreate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Tickets"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Booking</DialogTitle>
            </DialogHeader>
            {editingBooking && (
              <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    required
                    value={editingBooking.booking.customerName}
                    onChange={(e) =>
                      setEditingBooking({
                        ...editingBooking,
                        booking: { ...editingBooking.booking, customerName: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Email</Label>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Phone</Label>
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
                  />
                </div>
                <Button type="submit" className="w-full" disabled={updateBooking.isPending}>
                  {updateBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoadingState ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : isEmptyState ? (
          <div className="p-12 text-center text-muted-foreground">
            <Ticket className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No bookings have been made yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left table-fixed">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-2 md:px-3 py-3 font-medium w-[28%]">Customer</th>
                  <th className="px-2 md:px-3 py-3 font-medium w-[28%]">Event</th>
                  <th className="px-2 md:px-3 py-3 font-medium hidden lg:table-cell w-[14%]">Mobile</th>
                  <th className="px-2 md:px-3 py-3 font-medium text-center w-[5%]">Qty</th>
                  <th className="px-2 md:px-3 py-3 font-medium w-[8%]">Total</th>
                  <th className="px-2 md:px-3 py-3 font-medium w-[10%]">Status</th>
                  <th className="px-2 md:px-3 py-3 font-medium hidden xl:table-cell w-[7%]">Ref #</th>
                  <th className="px-2 md:px-3 py-3 font-medium text-right w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBookings.map((row: any) => (
                  <tr key={row.booking.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-2 md:px-3 py-3 break-words">
                      <p className="font-medium text-foreground">{row.booking.customerName}</p>
                      <p className="text-xs text-muted-foreground break-all">{row.booking.customerEmail}</p>
                    </td>
                    <td className="px-2 md:px-3 py-3 break-words">{row.event.title}</td>
                    <td className="px-2 md:px-3 py-3 hidden lg:table-cell break-words">{row.booking.customerPhone}</td>
                    <td className="px-2 md:px-3 py-3 font-medium text-center">{row.booking.ticketQuantity}</td>
                    <td className="px-2 md:px-3 py-3 font-medium text-primary whitespace-nowrap">
                      €{((row.event.ticketPrice * row.booking.ticketQuantity) / 100).toFixed(2)}
                    </td>
                    <td className="px-2 md:px-3 py-3">{getStatusBadge(row.booking.status)}</td>
                    <td className="px-2 md:px-3 py-3 font-mono text-xs hidden xl:table-cell break-all">{row.booking.transactionReference || '-'}</td>
                    <td className="px-2 md:px-3 py-3 text-right">
                      <div className="flex justify-end gap-1 md:gap-2 flex-wrap">
                        {row.booking.status === 'payment_submitted' && (
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            onClick={() => approve.mutate(row.booking.id)}
                            disabled={approve.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4" /><span className="hidden sm:inline ml-1">Approve</span>
                          </Button>
                        )}
                        {row.booking.status === 'paid' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openResendConfirm(row)}
                            disabled={resendTickets.isPending}
                          >
                            <Mail className="w-4 h-4" /><span className="hidden sm:inline ml-1">Resend</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(row)}
                        >
                          <Edit3 className="w-4 h-4" /><span className="hidden sm:inline ml-1">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteBooking(row)}
                        >
                          <Trash2 className="w-4 h-4" /><span className="hidden sm:inline ml-1">Del</span>
                        </Button>
                      </div>
                      {row.booking.status === 'paid' && (
                        <span className="text-xs text-emerald-600 font-medium flex justify-end items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3" /> <span className="hidden sm:inline">Tickets Sent</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={isResendConfirmOpen} onOpenChange={setIsResendConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Resend Tickets</DialogTitle>
            <DialogDescription>
              This will re-send the original confirmation email with all tickets to <strong>{bookingToResend?.booking.customerEmail}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <p><strong>Customer:</strong> {bookingToResend?.booking.customerName}</p>
              <p><strong>Event:</strong> {bookingToResend?.event.title}</p>
              <p><strong>Quantity:</strong> {bookingToResend?.booking.ticketQuantity} tickets</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResendConfirmOpen(false)}>Cancel</Button>
            <Button 
              className="gap-2" 
              onClick={handleResendTickets}
              disabled={resendTickets.isPending}
            >
              {resendTickets.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Confirm Resend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
