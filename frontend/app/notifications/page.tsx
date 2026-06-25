"use client";

import { useNotifications } from "@/lib/hooks";
import NotificationHeader from "@/components/NotificationHeader";
import NotificationTabs from "@/components/NotificationTabs";
import NotificationList from "@/components/NotificationList";

export default function NotificationsPage() {
  const {
    loading,
    unreadCount,
    total,
    tab,
    filtered,
    hasMore,
    loadingMore,
    setTab,
    loadMore,
    handleMarkRead,
    handleMarkAllRead,
  } = useNotifications();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-400">
        Memuat notifikasi...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <NotificationHeader
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
      />

      <NotificationTabs
        tab={tab}
        total={total}
        unreadCount={unreadCount}
        onTabChange={setTab}
      />

      <NotificationList
        items={filtered}
        tab={tab}
        hasMore={hasMore}
        loading={loadingMore}
        onLoadMore={loadMore}
        onMarkRead={handleMarkRead}
      />
    </main>
  );
}
