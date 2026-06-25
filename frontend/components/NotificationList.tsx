"use client";

import type { NotificationItem } from "@/lib/type";
import NotificationCard from "@/components/NotificationCard";
import InfiniteScroll from "@/components/InfiniteScroll";

interface Props {
  items: NotificationItem[];
  tab: "all" | "unread";
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  onMarkRead: (id: number) => void;
}

export default function NotificationList({
  items,
  tab,
  hasMore,
  loading,
  onLoadMore,
  onMarkRead,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="mt-4">
        <p className="py-12 text-center text-sm text-neutral-400">
          {tab === "unread"
            ? "Tidak ada pesan yang belum terbaca."
            : "Belum ada notifikasi."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <InfiniteScroll
        loadMore={onLoadMore}
        hasMore={hasMore}
        loading={loading}
      >
        {items.map((n) => (
          <NotificationCard key={n.id} notif={n} onMarkRead={onMarkRead} />
        ))}
      </InfiniteScroll>
    </div>
  );
}
