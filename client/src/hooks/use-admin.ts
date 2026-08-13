import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { fetchWithAuth } from "@/lib/fetch";
import { z } from "zod";

export function useOrganizers() {
  return useQuery({
    queryKey: [api.admin.organizers.list.path],
    queryFn: () => fetchWithAuth(api.admin.organizers.list.path),
  });
}

export function useOrganizerApplications() {
  return useQuery({
    queryKey: [api.admin.organizerApplications.list.path],
    queryFn: () => fetchWithAuth(api.admin.organizerApplications.list.path),
  });
}

export function useCreateOrganizer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: z.infer<typeof api.admin.organizers.create.input>) => 
      fetchWithAuth(api.admin.organizers.create.path, {
        method: api.admin.organizers.create.method,
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admin.organizers.list.path] }),
  });
}

export function useUpdateOrganizerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string, status: "active" | "paused" }) => {
      const url = buildUrl(api.admin.organizers.updateStatus.path, { id });
      return fetchWithAuth(url, {
        method: api.admin.organizers.updateStatus.method,
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admin.organizers.list.path] }),
  });
}

export function useDeleteOrganizer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const url = buildUrl(api.admin.organizers.delete.path, { id });
      return fetchWithAuth(url, { method: api.admin.organizers.delete.method });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admin.organizers.list.path] }),
  });
}

export function useResetOrganizerPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) => {
      const url = buildUrl(api.admin.organizers.resetPassword.path, { id });
      return fetchWithAuth(url, {
        method: api.admin.organizers.resetPassword.method,
        body: JSON.stringify({ newPassword }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admin.organizers.list.path] }),
  });
}
export function useApproveOrganizerApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const url = buildUrl(api.admin.organizerApplications.approve.path, { id });
      return fetchWithAuth(url, { method: api.admin.organizerApplications.approve.method });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.organizerApplications.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.organizers.list.path] });
    },
  });
}

export function useRejectOrganizerApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => {
      const url = buildUrl(api.admin.organizerApplications.reject.path, { id });
      return fetchWithAuth(url, {
        method: api.admin.organizerApplications.reject.method,
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admin.organizerApplications.list.path] }),
  });
}
