"use client";

import { Mail, MailOpen, Clock } from "lucide-react";
import type { NotificationItem } from "@/lib/type";
import { relativeTime } from "@/lib/utils";

interface Props {
  notif: NotificationItem;
  onMarkRead: (id: number) => void;
}

export default function NotificationCard({ notif, onMarkRead }: Props) {
  const isUnread = !notif.is_read;

  return (
    <div
      onClick={() => {
        if (isUnread) onMarkRead(notif.id);
      }}
      className={`flex items-start gap-3 rounded-lg border p-4 transition ${
        isUnread
          ? "border-green-500 bg-green-50/40 cursor-pointer hover:bg-green-50"
          : "border-neutral-200 bg-white"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {isUnread ? (
          <Mail className="h-5 w-5 text-green-600" />
        ) : (
          <MailOpen className="h-5 w-5 text-neutral-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-neutral-900">
            {notif.type}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-neutral-400">
            <Clock className="h-3 w-3" />
            {relativeTime(notif.created_at)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">
          ({notif.sender_name})
        </p>
        <p className="mt-1 text-sm text-neutral-700 leading-snug">
          {notif.message}
        </p>
      </div>
    </div>
  );
}
