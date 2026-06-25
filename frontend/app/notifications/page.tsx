"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCheck, Bell } from "lucide-react";
import api from "@/lib/api";
import { NotificationItem } from "@/lib/utils";
import NotificationCard from "@/components/NotificationCard";
import InfiniteScroll from "@/components/InfiniteScroll";

type Tab = "all" | "unread";

const LIMIT = 5;

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const userEmail = "user2@example.com";

  const mountedRef = useRef(true);

  /* ── Fetch paginated ── */
  const fetchPage = useCallback(async (pageNum: number) => {
    setLoadingMore(true);
    try {
      const { data } = await api.get("/api/notifications", {
        params: { user_email: userEmail, page: pageNum, limit: LIMIT },
      });
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
    const url = `/api/notifications/stream?user_email=${encodeURIComponent(userEmail)}`;
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
  const markRead = async (id: number) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      console.error("Gagal tandai dibaca");
    }
  };

  /* ── Mark all as read ── */
  const markAllRead = async () => {
    try {
      await api.patch("/api/notifications/read-all", null, {
        params: { user_email: userEmail },
      });
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      console.error("Gagal tandai semua dibaca");
    }
  };

  /* ── Filtered data ── */
  const filtered =
    tab === "unread" ? notifs.filter((n) => !n.is_read) : notifs;

  const hasMore = notifs.length < total;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-400">
        Memuat notifikasi...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
            <Bell className="h-6 w-6" />
            Notifikasi
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Anda memiliki{" "}
            <span className="font-semibold text-neutral-700">
              {unreadCount}
            </span>{" "}
            pesan yang belum terbaca.
          </p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCheck className="h-4 w-4" />
          Tandai Semua Dibaca
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setTab("all")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab === "all"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Semua Pesan
          <span
            className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
              tab === "all"
                ? "bg-white/20 text-white"
                : "bg-neutral-300 text-neutral-700"
            }`}
          >
            {total}
          </span>
        </button>

        <button
          onClick={() => setTab("unread")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab === "unread"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Belum Terbaca
          <span
            className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
              unreadCount > 0 ? "animate-pulse" : ""
            } ${
              tab === "unread"
                ? "bg-red-500 text-white"
                : "bg-red-100 text-red-700"
            }`}
          >
            {unreadCount}
          </span>
        </button>
      </div>

      {/* List with infinite scroll */}
      <div className="mt-4">
        <InfiniteScroll
          loadMore={loadMore}
          hasMore={hasMore}
          loading={loadingMore}
        >
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-400">
              {tab === "unread"
                ? "Tidak ada pesan yang belum terbaca."
                : "Belum ada notifikasi."}
            </p>
          ) : (
            filtered.map((n) => (
              <NotificationCard key={n.id} notif={n} onMarkRead={markRead} />
            ))
          )}
        </InfiniteScroll>
      </div>
    </main>
  );
}
