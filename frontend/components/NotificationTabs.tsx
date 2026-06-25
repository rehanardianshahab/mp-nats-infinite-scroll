"use client";

import type { Tab } from "@/lib/type";

interface Props {
  tab: Tab;
  total: number;
  unreadCount: number;
  onTabChange: (tab: Tab) => void;
}

export default function NotificationTabs({
  tab,
  total,
  unreadCount,
  onTabChange,
}: Props) {
  return (
    <div className="mt-6 flex gap-3">
      <button
        onClick={() => onTabChange("all")}
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
        onClick={() => onTabChange("unread")}
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
  );
}
