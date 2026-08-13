import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-organizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, MapPin, Ticket, Loader2, Edit2, Trash2, Link, Check, Users, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link as WouterLink } from "wouter";

export default function OrganizerEvents() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    bannerUrl: "",
    venue: "",
    eventDate: "",
    ticketTypes: "General Admission",
    ticketPrice: "",
    totalCapacity: "100",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.venue || !formData.eventDate || !formData.ticketTypes) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    const priceFloat = parseFloat(formData.ticketPrice);
    const capacityInt = parseInt(formData.totalCapacity);
    const eventDateObj = new Date(formData.eventDate);
    if (Number.isNaN(priceFloat) || priceFloat < 0) {
      toast({ title: "Invalid price", description: "Enter a valid ticket price (e.g., 19.99).", variant: "destructive" });
      return;
    }
    if (!Number.isInteger(capacityInt) || capacityInt < 1) {
      toast({ title: "Invalid capacity", description: "Total capacity must be a positive integer.", variant: "destructive" });
      return;
    }
    if (isNaN(eventDateObj.getTime())) {
      toast({ title: "Invalid date", description: "Please select a valid event date & time.", variant: "destructive" });
      return;
    }
    const data = {
      ...formData,
      eventDate: eventDateObj,
      eventDateText: format(eventDateObj, 'MMM d, yyyy • h:mm a'),
      ticketPrice: Math.round(priceFloat * 100),
      totalCapacity: capacityInt
    };

    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({
          id: editingEvent.id,
          data
        });
        toast({ title: "Event updated", description: "Your changes have been saved." });
        setEditingEvent(null);
      } else {
        const created = await createEvent.mutateAsync(data);
        toast({ title: "Event created", description: "Your event has been created successfully." });
      }
      setIsOpen(false);
      setFormData({ title: "", description: "", bannerUrl: "", venue: "", eventDate: "", ticketTypes: "General Admission", ticketPrice: "", totalCapacity: "100" });
    } catch (err: any) {
      console.error("Create/Update event failed:", err);
      toast({ title: "Action failed", description: err?.message || "Unable to process your request.", variant: "destructive" });
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      bannerUrl: event.bannerUrl || "",
      venue: event.venue,
      eventDate: format(new Date(event.eventDate), "yyyy-MM-dd'T'HH:mm"),
      ticketTypes: event.ticketTypes,
      ticketPrice: (event.ticketPrice / 100).toString(),
      totalCapacity: event.totalCapacity.toString(),
    });
    setIsOpen(true);
  };

  const handleCopyLink = (eventId: string) => {
    const url = `${window.location.origin}/event/${eventId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(eventId);
    toast({
      title: "Link Copied",
      description: "Public event link copied to clipboard.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      await deleteEvent.mutateAsync(eventId);
    }
  };

  const handleToggleStatus = async (event: any) => {
    const next = event.status === "active" ? "paused" : "active";
    const ok = next === "paused"
      ? confirm("Pause this event? Buyers will see that bookings are closed.")
      : confirm("Activate this event? Buyers will be able to book tickets.");
    if (!ok) return;
    try {
      await updateEvent.mutateAsync({ id: event.id, data: { status: next } });
      toast({
        title: next === "paused" ? "Event paused" : "Event activated",
        description: next === "paused" ? "Bookings are closed for buyers." : "Bookings are open for buyers.",
      });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Unable to update event status.", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout role="organizer">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold">My Events</h2>
          <p className="text-muted-foreground mt-1">Manage your events and ticket sales.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingEvent(null);
            setFormData({ title: "", description: "", bannerUrl: "", venue: "", eventDate: "", ticketTypes: "General Admission", ticketPrice: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="hover-elevate gap-2">
              <Plus className="w-4 h-4" /> Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Event Title</Label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Banner Image URL</Label>
                <Input placeholder="https://images.unsplash.com/photo..." value={formData.bannerUrl} onChange={e => setFormData({...formData, bannerUrl: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input required type="datetime-local" value={formData.eventDate} onChange={e => setFormData({...formData, eventDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input required value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ticket Type</Label>
                  <Input required value={formData.ticketTypes} onChange={e => setFormData({...formData, ticketTypes: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Price (EUR)</Label>
                  <Input required type="number" min="0" step="0.01" value={formData.ticketPrice} onChange={e => setFormData({...formData, ticketPrice: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Total Capacity (Number of tickets)</Label>
                <Input required type="number" min="1" value={formData.totalCapacity} onChange={e => setFormData({...formData, totalCapacity: e.target.value})} />
              </div>
              <Button type="submit" className="w-full" disabled={createEvent.isPending || updateEvent.isPending}>
                {(createEvent.isPending || updateEvent.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingEvent ? "Update Event" : "Create Event")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : events?.length === 0 ? (
          <div className="col-span-full bg-card rounded-2xl border border-border p-16 text-center shadow-sm">
            <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-xl font-medium mb-2">No events yet</h3>
            <p className="text-muted-foreground">Create your first event to start selling tickets.</p>
          </div>
        ) : (
          events?.map((event: any) => (
            <div key={event.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              {event.bannerUrl && (
                <div className="h-40 w-full overflow-hidden">
                  <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant={event.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {event.status}
                  </Badge>
                  <span className="font-bold text-lg text-primary">€{(event.ticketPrice / 100).toFixed(2)}</span>
                </div>
                <h3 className="text-xl font-bold font-display mb-2 line-clamp-1">{event.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-6">{event.description}</p>
                
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center text-sm text-zinc-600">
                    <CalendarIcon className="w-4 h-4 mr-3 opacity-70" />
                    {format(new Date(event.eventDate), 'MMM d, yyyy • h:mm a')}
                  </div>
                  <div className="flex items-center text-sm text-zinc-600">
                    <MapPin className="w-4 h-4 mr-3 opacity-70" />
                    {event.venue}
                  </div>
                  <div className="flex items-center text-sm text-zinc-600">
                    <Ticket className="w-4 h-4 mr-3 opacity-70" />
                    {event.ticketTypes}
                  </div>
                  <div className="flex items-center text-sm font-medium text-primary bg-primary/5 p-2 rounded-lg">
                    <div className="flex-1">Tickets Sold</div>
                    <div className="text-right">{event.totalCapacity - event.remainingCapacity} / {event.totalCapacity}</div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-border bg-muted/20 flex flex-wrap justify-between items-center gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => handleCopyLink(event.id)}>
                    {copiedId === event.id ? <Check className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
                    Buyer Link
                  </Button>
                  <Button
                    variant={event.status === "active" ? "outline" : "secondary"}
                    size="sm"
                    className="h-8 gap-2"
                    onClick={() => handleToggleStatus(event)}
                    disabled={updateEvent.isPending}
                  >
                    {event.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {event.status === "active" ? "Pause" : "Activate"}
                  </Button>
                  <WouterLink href={`/organizer/events/${event.id}/attendees`}>
                    <Button variant="secondary" size="sm" className="h-8 gap-2">
                      <Users className="w-3.5 h-3.5" />
                      Attendees
                    </Button>
                  </WouterLink>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(event)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(event.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
