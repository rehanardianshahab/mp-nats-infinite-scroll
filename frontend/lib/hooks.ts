"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationItem, Tab } from "./type";
import { fetchNotifications, markRead, markAllRead } from "./service";

const LIMIT = 5;
const USER_EMAIL = "user2@example.com";

export function useNotifications() {
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<Tab>("all");

  const mountedRef = useRef(true);

  /* ── Fetch paginated ── */
  const fetchPage = useCallback(async (pageNum: number) => {
    setLoadingMore(true);
    try {
      const data = await fetchNotifications(USER_EMAIL, pageNum, LIMIT);
      if (!mountedRef.current) return;
      setNotifs((prev) => {
        const map = new Map<number, NotificationItem>();
        if (pageNum !== 1) {
          for (const n of prev) map.set(n.id, n);
        }
        for (const n of data.notifications) map.set(n.id, n);
        return Array.from(map.values());
      });
      setTotal(data.total);
      setPage(data.page);
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error("Gagal mengambil notifikasi", err);
    } finally {
      setLoadingMore(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  /* ── Load more callback ── */
  const loadMore = useCallback(() => {
    if (!loadingMore && notifs.length < total) {
      fetchPage(page + 1);
    }
  }, [loadingMore, notifs.length, total, page, fetchPage]);

  /* ── SSE stream ── */
  useEffect(() => {
    mountedRef.current = true;
    const url = `/api/notifications/stream?user_email=${encodeURIComponent(USER_EMAIL)}`;
    const es = new EventSource(url);

    es.addEventListener("notification", (event) => {
      if (!mountedRef.current) return;
      try {
        const newNotif: NotificationItem = JSON.parse(event.data);
        setNotifs((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
        setTotal((prev) => prev + 1);
      } catch {
        console.warn("Gagal parse SSE data");
      }
    });

    return () => {
      mountedRef.current = false;
      es.close();
    };
  }, []);

  /* ── Mark single as read ── */
  const handleMarkRead = useCallback(async (id: number) => {
    try {
      await markRead(id);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      console.error("Gagal tandai dibaca");
    }
  }, []);

  /* ── Mark all as read ── */
  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllRead(USER_EMAIL);
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      console.error("Gagal tandai semua dibaca");
    }
  }, []);

  /* ── Derived ── */
  const filtered =
    tab === "unread" ? notifs.filter((n) => !n.is_read) : notifs;
  const hasMore =
    tab === "unread"
      ? filtered.length < unreadCount && page * LIMIT < total
      : filtered.length < total;

  return {
    notifs,
    unreadCount,
    total,
    loading,
    loadingMore,
    tab,
    filtered,
    hasMore,
    setTab,
    loadMore,
    handleMarkRead,
    handleMarkAllRead,
  };
}
