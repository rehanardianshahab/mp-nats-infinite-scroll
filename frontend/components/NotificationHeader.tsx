"use client";

import { Bell, CheckCheck } from "lucide-react";

interface Props {
  unreadCount: number;
  onMarkAllRead: () => void;
}

export default function NotificationHeader({
  unreadCount,
  onMarkAllRead,
}: Props) {
  return (
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
        onClick={onMarkAllRead}
        disabled={unreadCount === 0}
        className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <CheckCheck className="h-4 w-4" />
        Tandai Semua Dibaca
      </button>
    </div>
  );
}
