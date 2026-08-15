import { useState } from "react";
import { format } from "date-fns";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Ticket,
  Link as LinkIcon,
  Check,
  Users,
  Pause,
  Play,
  Trash2,
  Image,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EventCardProps {
  event: any;
  onEdit: (event: any) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (event: any) => void;
  onCopyLink: (id: string) => void;
  copiedId: string | null;
}

export function EventCard({
  event,
  onEdit,
  onDelete,
  onToggleStatus,
  onCopyLink,
  copiedId,
}: EventCardProps) {
  const sold = event.totalCapacity - event.remainingCapacity;
  const pct = event.totalCapacity > 0 ? Math.round((sold / event.totalCapacity) * 100) : 0;
  const isPast = new Date(event.eventDate) < new Date();

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col ${isPast ? "opacity-70" : ""}`}>
      {/* Poster */}
      <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-10 h-10 text-gray-300" />
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={event.status} />
        </div>
        {/* Price overlay */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1">
          <span className="text-sm font-bold text-gray-900">
            €{(event.ticketPrice / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">
          {event.title}
        </h3>
        {event.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Event info */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{format(new Date(event.eventDate), "d MMM yyyy · h:mm a")}</span>
          </div>
          {event.venue && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}
          {(event.language || event.screen) && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Ticket className="w-3.5 h-3.5 text-gray-400" />
              <span>
                {event.language}{event.language && event.screen ? " · " : ""}{event.screen}
              </span>
            </div>
          )}
          {event.ticketTypes && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Ticket className="w-3.5 h-3.5 text-gray-400" />
              <span>{event.ticketTypes}</span>
            </div>
          )}
        </div>

        {/* Ticket sales */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500">Tickets Sold</span>
            <span className="text-xs font-semibold text-gray-900">
              {sold} / {event.totalCapacity}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 text-right">{pct}% sold</p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-50 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
          onClick={() => onCopyLink(event.id)}
        >
          {copiedId === event.id ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <LinkIcon className="w-3.5 h-3.5" />
          )}
          <span className="ml-1.5 text-xs">Link</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50"
          onClick={() => onToggleStatus(event)}
        >
          {event.status === "active" ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </Button>

        <a href={`/organizer/events/${event.id}/attendees`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
          >
            <Users className="w-3.5 h-3.5" />
          </Button>
        </a>

        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEdit(event)} className="text-sm">
              Edit Event
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(event.id)}
              className="text-sm text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Event
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
