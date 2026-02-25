import { useQuery } from "@tanstack/react-query";

interface PredictionEvent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  endDate: string;
  status: string;
  result: string | null;
  creator: { id: string; name: string | null; image: string | null };
  createdAt: string;
  yesProbability: number;
  noProbability: number;
  totalVolume: number;
  totalBets: number;
}

interface EventDetail extends PredictionEvent {
  bets: Array<{
    id: string;
    userId: string;
    choice: string;
    amount: number;
    payout: number | null;
    createdAt: string;
    user: { id: string; name: string | null; image: string | null };
  }>;
  yesVolume: number;
  noVolume: number;
}

async function fetchPredictionEvents(params?: {
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<PredictionEvent[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.category && params.category !== "all") searchParams.set("category", params.category);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));

  const res = await fetch(`/api/events?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

async function fetchPredictionEvent(id: string): Promise<EventDetail> {
  const res = await fetch(`/api/events/${id}`);
  if (!res.ok) throw new Error("Failed to fetch event");
  return res.json();
}

export function usePredictionEvents(params?: {
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["prediction-events", params],
    queryFn: () => fetchPredictionEvents(params),
    staleTime: 30_000,
  });
}

export function usePredictionEvent(id: string) {
  return useQuery({
    queryKey: ["prediction-event", id],
    queryFn: () => fetchPredictionEvent(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}
