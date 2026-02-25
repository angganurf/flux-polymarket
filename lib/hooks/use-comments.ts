import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

async function fetchComments(eventId: string): Promise<Comment[]> {
  const res = await fetch(`/api/events/${eventId}/comments`);
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

export function useComments(eventId: string) {
  return useQuery({
    queryKey: ["comments", eventId],
    queryFn: () => fetchComments(eventId),
    enabled: !!eventId,
    staleTime: 30_000,
  });
}

export function usePostComment(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post comment");
      }
      return res.json() as Promise<Comment>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", eventId] });
    },
  });
}
