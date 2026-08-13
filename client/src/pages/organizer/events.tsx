import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-organizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/organizer/page-header";
import { StatusBadge } from "@/components/organizer/status-badge";
import { EventCard } from "@/components/organizer/event-card";
import { EmptyState } from "@/components/organizer/empty-state";
import { format } from "date-fns";
import { Plus, Calendar, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FilterTab = "all" | "active" | "paused" | "draft" | "completed" | "cancelled";

export default function OrganizerEvents() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All Events" },
    { key: "active", label: "Active" },
    { key: "paused", label: "Paused" },
    { key: "draft", label: "Draft" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const tabCounts = useMemo(() => {
    if (!events) return {};
    const counts: Record<string, number> = { all: events.length };
    events.forEach((e: any) => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });
    return counts;
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let result = events;
    if (activeTab !== "all") {
      result = result.filter((e: any) => e.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e: any) =>
          e.title.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [events, activeTab, searchQuery]);

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
      eventDateText: format(eventDateObj, "MMM d, yyyy • h:mm a"),
      ticketPrice: Math.round(priceFloat * 100),
      totalCapacity: capacityInt,
    };

    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({ id: editingEvent.id, data });
        toast({ title: "Event updated", description: "Your changes have been saved." });
        setEditingEvent(null);
      } else {
        await createEvent.mutateAsync(data);
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
    toast({ title: "Link Copied", description: "Public event link copied to clipboard." });
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
      <PageHeader
        title="Events"
        subtitle="Manage your events, showtimes and ticket sales."
      >
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-56 h-9 bg-white border-gray-200 text-sm"
            />
          </div>

          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) {
                setEditingEvent(null);
                setFormData({ title: "", description: "", bannerUrl: "", venue: "", eventDate: "", ticketTypes: "General Admission", ticketPrice: "", totalCapacity: "100" });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-9 text-sm">
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  {editingEvent ? "Edit Event" : "Create New Event"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-5 mt-2">
                {/* Basic Information */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Basic Information</h4>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Event Title</Label>
                      <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Description</Label>
                      <Textarea required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Banner Image URL</Label>
                      <Input placeholder="https://images.unsplash.com/photo..." value={formData.bannerUrl} onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })} className="h-9" />
                    </div>
                  </div>
                </div>

                {/* Schedule & Venue */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Schedule & Venue</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Date & Time</Label>
                      <Input required type="datetime-local" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Venue</Label>
                      <Input required value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="h-9" />
                    </div>
                  </div>
                </div>

                {/* Ticketing */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ticketing</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Ticket Type</Label>
                      <Input required value={formData.ticketTypes} onChange={(e) => setFormData({ ...formData, ticketTypes: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Price (EUR)</Label>
                      <Input required type="number" min="0" step="0.01" value={formData.ticketPrice} onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Capacity</Label>
                      <Input required type="number" min="1" value={formData.totalCapacity} onChange={(e) => setFormData({ ...formData, totalCapacity: e.target.value })} className="h-9" />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={createEvent.isPending || updateEvent.isPending}>
                  {createEvent.isPending || updateEvent.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingEvent ? (
                    "Update Event"
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const count = tabCounts[tab.key] || 0;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="aspect-[16/9] bg-gray-100 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-5 w-12 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100">
          <EmptyState
            icon={<Calendar className="w-7 h-7" />}
            title={searchQuery || activeTab !== "all" ? "No events match your filters" : "No events yet"}
            description={
              searchQuery || activeTab !== "all"
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Create your first event to start selling tickets."
            }
            action={
              !searchQuery && activeTab === "all"
                ? { label: "Create Event", onClick: () => setIsOpen(true) }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEvents.map((event: any) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onCopyLink={handleCopyLink}
              copiedId={copiedId}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
