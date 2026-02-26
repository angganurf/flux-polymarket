import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PlaceBetVars {
  eventId: string;
  choice: "yes" | "no";
  amount: number;
}

interface ResolveEventVars {
  eventId: string;
  result: "yes" | "no";
}

export function usePlaceBet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: PlaceBetVars) => {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to place bet");
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["prediction-event", vars.eventId] });
      queryClient.invalidateQueries({ queryKey: ["prediction-events"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
  });
}

export function useResolveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: ResolveEventVars) => {
      const res = await fetch(`/api/events/${vars.eventId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: vars.result }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resolve event");
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["prediction-event", vars.eventId] });
      queryClient.invalidateQueries({ queryKey: ["prediction-events"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { title: string; description?: string; category?: string; endDate: string }) => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create event");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prediction-events"] });
    },
  });
}
