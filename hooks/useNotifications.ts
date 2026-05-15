"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher-client";

export type NotificationType =
  | "INFO"
  | "NOUVEAU_RENDEZ_VOUS"
  | "RENDEZ_VOUS_CONFIRME"
  | "RENDEZ_VOUS_ANNULE"
  | "RENDEZ_VOUS_MODIFIE"
  | "PAIEMENT_RECU";

interface NotificationAppointment {
  id: number;
  appointment_date: string;
  time: string;
  status: string;
}

export interface Notification {
  id: number;
  user_id: string;
  sender_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  read_at: string | null;
  appointment_id: number | null;
  appointment: NotificationAppointment | null;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nonLues, setNonLues] = useState(0);

  useEffect(() => {
    if (!userId) return;

    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setNonLues(data.nonLues ?? 0);
      })
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-user-${userId}`);

    channel.bind("nouvelle-notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setNonLues((prev) => prev + 1);
    });

    return () => {
      pusher.unsubscribe(`private-user-${userId}`);
      pusher.disconnect();
    };
  }, [userId]);

  const marquerLu = useCallback(async (id: number) => {
    await fetch(`/api/notifications/${id}/lire`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
      )
    );
    setNonLues((prev) => Math.max(0, prev - 1));
  }, []);

  const marquerToutLu = useCallback(async () => {
    await fetch("/api/notifications/lire-tout", { method: "PATCH" });
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, read_at: now }))
    );
    setNonLues(0);
  }, []);

  return { notifications, nonLues, marquerLu, marquerToutLu };
}
