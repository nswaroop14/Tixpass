import { useState, useMemo, useRef } from "react";
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
import { Plus, Calendar, Loader2, Search, Upload, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FilterTab = "all" | "active" | "paused" | "draft" | "past";

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
    language: "",
    screen: "",
    venue: "",
    eventDate: "",
    ticketTypes: "General Admission",
    ticketPrice: "",
    totalCapacity: "100",
    notes: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All Events" },
    { key: "active", label: "Active" },
    { key: "paused", label: "Paused" },
    { key: "draft", label: "Draft" },
    { key: "past", label: "Past" },
  ];

  const tabCounts = useMemo(() => {
    if (!events) return {};
    const now = new Date();
    const counts: Record<string, number> = { all: events.length };
    events.forEach((e: any) => {
      if (new Date(e.eventDate) < now) {
        counts["past"] = (counts["past"] || 0) + 1;
      } else {
        counts[e.status] = (counts[e.status] || 0) + 1;
      }
    });
    return counts;
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    let result = events;
    if (activeTab === "past") {
      result = result.filter((e: any) => new Date(e.eventDate) < now);
    } else if (activeTab !== "all") {
      result = result.filter((e: any) => e.status === activeTab && new Date(e.eventDate) >= now);
    } else {
      result = events;
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
    const statusOrder: Record<string, number> = { active: 0, paused: 1, draft: 2 };
    return [...result].sort((a: any, b: any) => {
      if (activeTab === "past") {
        return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
      }
      const sa = statusOrder[a.status] ?? 5;
      const sb = statusOrder[b.status] ?? 5;
      if (sa !== sb) return sa - sb;
      return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    });
  }, [events, activeTab, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.venue || !formData.eventDate || !formData.ticketTypes) {
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
      setFormData({ title: "", description: "", bannerUrl: "", language: "", screen: "", venue: "", eventDate: "", ticketTypes: "General Admission", ticketPrice: "", totalCapacity: "100", notes: "" });
      setImagePreview(null);
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
      language: event.language || "",
      screen: event.screen || "",
      venue: event.venue,
      eventDate: format(new Date(event.eventDate), "yyyy-MM-dd'T'HH:mm"),
      ticketTypes: event.ticketTypes,
      ticketPrice: (event.ticketPrice / 100).toString(),
      totalCapacity: event.totalCapacity.toString(),
      notes: event.notes || "",
    });
    setImagePreview(event.bannerUrl || null);
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
                setFormData({ title: "", description: "", bannerUrl: "", language: "", screen: "", venue: "", eventDate: "", ticketTypes: "General Admission", ticketPrice: "", totalCapacity: "100", notes: "" });
                setImagePreview(null);
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
                      <Label className="text-sm">Event Name *</Label>
                      <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="h-9" placeholder="e.g. Dhurandhar 2: The Revenge" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Description</Label>
                      <Textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="text-sm" />
                    </div>
                    {/* Image Upload */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Poster Image</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) {
                            toast({ title: "Image too large", description: "Please use an image under 10MB.", variant: "destructive" });
                            return;
                          }
                          const img = new window.Image();
                          img.onload = () => {
                            const MAX_W = 1200;
                            const MAX_H = 675;
                            let w = img.width;
                            let h = img.height;
                            if (w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
                            if (h > MAX_H) { w = Math.round(w * MAX_H / h); h = MAX_H; }
                            const canvas = document.createElement("canvas");
                            canvas.width = w;
                            canvas.height = h;
                            canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
                            const resized = canvas.toDataURL("image/jpeg", 0.8);
                            setFormData({ ...formData, bannerUrl: resized });
                            setImagePreview(resized);
                          };
                          img.src = URL.createObjectURL(file);
                        }}
                      />
                      {imagePreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200">
                          <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                          <button
                            type="button"
                            onClick={() => { setFormData({ ...formData, bannerUrl: "" }); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                        >
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 font-medium">Click to upload poster</p>
                          <p className="text-[11px] text-gray-400 mt-1">JPEG, PNG or WebP. Max 5MB. Recommended: 1200×675px (16:9)</p>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Schedule & Venue */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Schedule & Venue</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Date & Time *</Label>
                      <Input required type="datetime-local" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Venue *</Label>
                      <Input required value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="h-9" placeholder="e.g. K Cineplex - Nicosia" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Language</Label>
                      <Input value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })} className="h-9" placeholder="e.g. Hindi, English" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Screen</Label>
                      <Input value={formData.screen} onChange={(e) => setFormData({ ...formData, screen: e.target.value })} className="h-9" placeholder="e.g. Screen 1, IMAX" />
                    </div>
                  </div>
                </div>

                {/* Ticketing */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ticketing</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Ticket Type *</Label>
                      <Input required value={formData.ticketTypes} onChange={(e) => setFormData({ ...formData, ticketTypes: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Price (EUR) *</Label>
                      <Input required type="number" min="0" step="0.01" value={formData.ticketPrice} onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Capacity *</Label>
                      <Input required type="number" min="1" value={formData.totalCapacity} onChange={(e) => setFormData({ ...formData, totalCapacity: e.target.value })} className="h-9" />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Additional Notes</h4>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Notes (optional)</Label>
                    <Textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="text-sm" placeholder="e.g. No outside food allowed. ID required at entry." />
                    <p className="text-[11px] text-gray-400">These notes will be included in the ticket emails sent to customers.</p>
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
