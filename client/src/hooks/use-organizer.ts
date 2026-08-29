import { api, buildUrl } from "@shared/routes";
import { fetchWithAuth } from "@/lib/fetch";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useOrganizerProfile() {
  return useQuery({
    queryKey: ["/api/organizer/profile"],
    queryFn: () => fetchWithAuth("/api/organizer/profile"),
  });
}

export function useSaveBookingFilterPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { eventId?: string; status?: string }) =>
      fetchWithAuth("/api/organizer/booking-filter-preferences", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizer/profile"] });
    },
  });
}

export function useEvents() {
  const path = api?.organizer?.events?.list?.path || "/api/organizer/events";
  return useQuery({
    queryKey: [path],
    queryFn: () => fetchWithAuth(path),
  });
}

export function useOrganizerBankDetails() {
  const path = api?.organizer?.bank?.get?.path || "/api/organizer/bank";
  return useQuery({
    queryKey: [path],
    queryFn: () => fetchWithAuth(path),
  });
}

export function useSaveOrganizerBankDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: z.infer<typeof api.organizer.bank.save.input>) => {
      const path = api?.organizer?.bank?.save?.path || "/api/organizer/bank";
      const method = api?.organizer?.bank?.save?.method || "POST";
      return fetchWithAuth(path, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      const getPath = api?.organizer?.bank?.get?.path || "/api/organizer/bank";
      queryClient.invalidateQueries({ queryKey: [getPath] });
    },
  });
}

export function useToggleBankLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: z.infer<typeof api.organizer.bank.lock.input>) => {
      const path = api?.organizer?.bank?.lock?.path || "/api/organizer/bank/lock";
      const method = api?.organizer?.bank?.lock?.method || "POST";
      return fetchWithAuth(path, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      const getPath = api?.organizer?.bank?.get?.path || "/api/organizer/bank";
      const mePath = api?.auth?.me?.path || "/api/auth/me";
      queryClient.invalidateQueries({ queryKey: [getPath] });
      queryClient.invalidateQueries({ queryKey: [mePath] });
    },
  });
}
export function useEventBankDetails(id: string) {
  const path = api?.organizer?.events?.bank?.get?.path || "/api/organizer/events/:id/bank";
  return useQuery({
    queryKey: [path, id],
    queryFn: () => {
      const url = buildUrl(path, { id });
      return fetchWithAuth(url);
    },
    enabled: !!id,
  });
}

export function useSaveEventBankDetails() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      const path = api?.organizer?.events?.bank?.update?.path || "/api/organizer/events/:id/bank";
      const method = api?.organizer?.events?.bank?.update?.method || "PUT";
      const url = buildUrl(path, { id });
      return fetchWithAuth(url, {
        method,
        body: JSON.stringify(data),
      });
    },
  });
}
export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: z.infer<typeof api.organizer.events.create.input>) => {
      const path = api?.organizer?.events?.create?.path || "/api/organizer/events";
      const method = api?.organizer?.events?.create?.method || "POST";
      return fetchWithAuth(path, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      const listPath = api?.organizer?.events?.list?.path || "/api/organizer/events";
      queryClient.invalidateQueries({ queryKey: [listPath] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<z.infer<typeof api.organizer.events.update.input>> }) => {
      const path = api?.organizer?.events?.update?.path || "/api/organizer/events/:id";
      const method = api?.organizer?.events?.update?.method || "PUT";
      const url = buildUrl(path, { id });
      return fetchWithAuth(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      const listPath = api?.organizer?.events?.list?.path || "/api/organizer/events";
      queryClient.invalidateQueries({ queryKey: [listPath] });
    },
  });
}

export function useSaveBankDetails() {
  return useMutation({
    mutationFn: (data: {
      bankName: string;
      accountHolder: string;
      accountNumber: string;
      routingNumber: string;
      accountType: string;
    }) =>
      fetchWithAuth((api?.organizer?.bank?.save?.path || "/api/organizer/bank"), {
        method: (api?.organizer?.bank?.save?.method || "POST"),
        body: JSON.stringify(data),
      }),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const path = api?.organizer?.events?.delete?.path || "/api/organizer/events/:id";
      const method = api?.organizer?.events?.delete?.method || "DELETE";
      const url = buildUrl(path, { id });
      return fetchWithAuth(url, { method: api.organizer.events.delete.method });
    },
    onSuccess: () => {
      const listPath = api?.organizer?.events?.list?.path || "/api/organizer/events";
      queryClient.invalidateQueries({ queryKey: [listPath] });
    },
  });
}

export function useEventTickets(id: string) {
  return useQuery({
    queryKey: [(api?.organizer?.events?.tickets?.path || "/api/organizer/events/:id/tickets"), id],
    queryFn: () => {
      const path = api?.organizer?.events?.tickets?.path || "/api/organizer/events/:id/tickets";
      const url = buildUrl(path, { id });
      return fetchWithAuth(url);
    },
    enabled: !!id,
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time attendee tracking
  });
}

export function useBookings() {
  const path = api?.organizer?.bookings?.list?.path || "/api/organizer/bookings";
  return useQuery({
    queryKey: [path],
    queryFn: () => fetchWithAuth(path),
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<z.infer<typeof api.organizer.bookings.update.input>> }) => {
      const path = api?.organizer?.bookings?.update?.path || "/api/organizer/bookings/:id";
      const method = api?.organizer?.bookings?.update?.method || "PATCH";
      const url = buildUrl(path, { id });
      return fetchWithAuth(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      const listPath = api?.organizer?.bookings?.list?.path || "/api/organizer/bookings";
      queryClient.invalidateQueries({ queryKey: [listPath] });
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, eventId }: { id: string; eventId: string }) => {
      const path = api?.organizer?.bookings?.delete?.path || "/api/organizer/bookings/:id";
      const method = api?.organizer?.bookings?.delete?.method || "DELETE";
      const url = buildUrl(path, { id });
      return fetchWithAuth(url, { method });
    },
    onSuccess: (_data, variables) => {
      const listPath = api?.organizer?.bookings?.list?.path || "/api/organizer/bookings";
      const eventsListPath = api?.organizer?.events?.list?.path || "/api/organizer/events";
      const ticketsPath = api?.organizer?.events?.tickets?.path || "/api/organizer/events/:id/tickets";
      queryClient.invalidateQueries({ queryKey: [listPath] });
      queryClient.invalidateQueries({ queryKey: [eventsListPath] });
      if (variables?.eventId) {
        queryClient.invalidateQueries({ queryKey: [ticketsPath, variables.eventId] });
      }
    },
  });
}

export function useApproveBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const path = api?.organizer?.bookings?.approve?.path || "/api/organizer/bookings/:id/approve";
      const method = api?.organizer?.bookings?.approve?.method || "POST";
      const url = buildUrl(path, { id });
      return fetchWithAuth(url, { method });
    },
    onSuccess: () => {
      const listPath = api?.organizer?.bookings?.list?.path || "/api/organizer/bookings";
      queryClient.invalidateQueries({ queryKey: [listPath] });
    },
  });
}

export function useResendTickets() {
  return useMutation({
    mutationFn: (id: string) => {
      const path = api?.organizer?.bookings?.resend?.path || "/api/organizer/bookings/:id/resend";
      const method = api?.organizer?.bookings?.resend?.method || "POST";
      const url = buildUrl(path, { id });
      return fetchWithAuth(url, { method });
    },
  });
}

export function useManualCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: z.infer<typeof api.organizer.bookings.manualCreate.input>) => 
      fetchWithAuth((api?.organizer?.bookings?.manualCreate?.path || "/api/organizer/bookings/manual"), {
        method: (api?.organizer?.bookings?.manualCreate?.method || "POST"),
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      const listPath = api?.organizer?.bookings?.list?.path || "/api/organizer/bookings";
      const eventsListPath = api?.organizer?.events?.list?.path || "/api/organizer/events";
      queryClient.invalidateQueries({ queryKey: [listPath] });
      queryClient.invalidateQueries({ queryKey: [eventsListPath] });
    },
  });
}

export function useScanTicket() {
  return useMutation({
    mutationFn: (data: z.infer<typeof api.organizer.tickets.scan.input>) => 
      fetchWithAuth((api?.organizer?.tickets?.scan?.path || "/api/organizer/tickets/scan"), {
        method: (api?.organizer?.tickets?.scan?.method || "POST"),
        body: JSON.stringify(data),
      }),
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["/api/organizer/analytics"],
    queryFn: () => fetchWithAuth("/api/organizer/analytics"),
  });
}

export function useOrganizerResetPassword() {
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.organizer.account.resetPassword.input>) => {
      const token = localStorage.getItem("token");
      const path = api?.organizer?.account?.resetPassword?.path || "/api/organizer/reset-password";
      const method = api?.organizer?.account?.resetPassword?.method || "POST";
      const res = await fetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update password");
      }
      if (!ct.includes("application/json")) {
        const text = await res.text();
        if (text) throw new Error(text);
        return { message: "Password updated" };
      }
      return res.json();
    },
  });
}

export function useUpdateReportSettings() {
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.organizer.account.setReportEmail.input> & { reportTime?: string; enabled?: boolean }) => {
      const token = localStorage.getItem("token");
      const res = await fetch(api.organizer.account.setReportEmail.path, {
        method: api.organizer.account.setReportEmail.method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update report settings");
      }
      return res.json();
    },
  });
}

export function useUpdateBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { brandName?: string; logoUrl?: string; phone?: string }) => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/organizer/branding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update branding");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizer/branding"] });
    },
  });
}

export function useTicketsByBooking() {
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetchWithAuth(`/api/organizer/bookings/${bookingId}/tickets`);
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return res.json();
    },
  });
}
