"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  emailSent: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  limit: number;
  offset: number;
}

interface NotificationPreferences {
  id: string;
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  betResults: boolean;
  eventResolved: boolean;
  commentReplies: boolean;
  systemAlerts: boolean;
}

async function fetchNotifications(
  limit = 20,
  offset = 0
): Promise<NotificationsResponse> {
  const res = await fetch(
    `/api/notifications?limit=${limit}&offset=${offset}`
  );
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

async function fetchPreferences(): Promise<NotificationPreferences> {
  const res = await fetch("/api/notifications/preferences");
  if (!res.ok) throw new Error("Failed to fetch preferences");
  return res.json();
}

/**
 * Hook to fetch paginated notifications with polling.
 */
export function useNotifications(limit = 5, offset = 0) {
  return useQuery({
    queryKey: ["notifications", limit, offset],
    queryFn: () => fetchNotifications(limit, offset),
    refetchInterval: 30_000, // Poll every 30 seconds
    staleTime: 15_000,
  });
}

/**
 * Hook to fetch unread count only (lightweight polling for the bell badge).
 * Reuses the same query key pattern so invalidation works.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", 1, 0],
    queryFn: () => fetchNotifications(1, 0),
    refetchInterval: 30_000,
    staleTime: 15_000,
    select: (data) => data.unreadCount,
  });
}

/**
 * Mutation to mark a single notification as read.
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Mutation to mark all notifications as read.
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Hook to fetch notification preferences.
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: fetchPreferences,
    staleTime: 60_000,
  });
}

/**
 * Mutation to update notification preferences.
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) => {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update preferences");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-preferences"],
      });
    },
  });
}
