import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { fetchWithAuth } from "@/lib/fetch";
import { z } from "zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

type LoginInput = z.infer<typeof api.auth.login.input>;

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const meQuery = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!localStorage.getItem("token")) return null;
      try {
        const path = api?.auth?.me?.path || "/api/auth/me";
        return await fetchWithAuth(path);
      } catch (err) {
        localStorage.removeItem("token");
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const path = api?.auth?.login?.path || "/api/auth/login";
      const method = api?.auth?.login?.method || "POST";
      const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        let msg = res.statusText;
        try {
          const err = ct.includes("application/json") ? await res.json() : await res.text();
          msg = (err && err.message) ? err.message : (typeof err === "string" ? err : msg);
        } catch {}
        throw new Error(msg || "Failed to login");
      }
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(text || "Unexpected non-JSON response from server");
      }
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      queryClient.setQueryData([api.auth.me.path], { user: data.user, organizer: data.organizer });
      toast({ title: "Welcome back!", description: "You have successfully logged in." });
      
      if (data.user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/organizer");
      }
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  });

  const logout = () => {
    localStorage.removeItem("token");
    queryClient.setQueryData([api.auth.me.path], null);
    setLocation("/login");
  };

  return {
    user: meQuery.data?.user,
    organizer: meQuery.data?.organizer,
    isLoading: meQuery.isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout,
  };
}
