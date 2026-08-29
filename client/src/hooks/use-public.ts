import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function usePublicEvent(identifier: string) {
  return useQuery({
    queryKey: [api.public.events.get.path, identifier],
    queryFn: async () => {
      const url = buildUrl(api.public.events.get.path, { identifier });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch event");
      return res.json();
    },
    enabled: !!identifier,
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.public.bookings.create.input>) => {
      const res = await fetch(api.public.bookings.create.path, {
        method: api.public.bookings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create booking");
      return res.json();
    },
  });
}

export function useSubmitPayment() {
  return useMutation({
    mutationFn: async ({ id, transactionReference }: { id: string, transactionReference: string }) => {
      const url = buildUrl(api.public.bookings.submitPayment.path, { id });
      const res = await fetch(url, {
        method: api.public.bookings.submitPayment.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionReference }),
      });
      if (!res.ok) throw new Error("Failed to submit payment");
      return res.json();
    },
  });
}

export function useConfirmPayPalPayment() {
  return useMutation({
    mutationFn: async ({ id, orderID }: { id: string, orderID: string }) => {
      const url = buildUrl(api.public.bookings.confirmPayPal.path, { id });
      const res = await fetch(url, {
        method: api.public.bookings.confirmPayPal.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID }),
      });
      if (!res.ok) throw new Error("Failed to confirm PayPal payment");
      return res.json();
    },
  });
}

export function useOrganizerApply() {
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.public.organizer.apply.input>) => {
      const res = await fetch(api.public.organizer.apply.path, {
        method: api.public.organizer.apply.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to submit application");
      }
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(text || "Unexpected non-JSON response from server");
      }
      return res.json();
    },
  });
}

export function usePublicTicket(id: string) {
  return useQuery({
    queryKey: [api.public.tickets.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.public.tickets.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch ticket");
      return res.json();
    },
    enabled: !!id,
  });
}
