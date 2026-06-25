"use client";

import { useCallback, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  loadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  children: React.ReactNode;
}

export default function InfiniteScroll({
  loadMore,
  hasMore,
  loading,
  children,
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevLoading = useRef(loading);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      loadMore();
    }
  }, [loadMore, loading, hasMore]);

  /* auto-load when content is shorter than container */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    if (prevLoading.current && !loading) {
      if (el.scrollHeight <= el.clientHeight + 10) {
        loadMore();
      }
    }
    prevLoading.current = loading;
  }, [loading, hasMore, loadMore]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="max-h-[400px] space-y-3 overflow-y-auto pr-1 scrollbar-thin"
    >
      {children}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-neutral-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat lebih banyak...
        </div>
      )}
      {!loading && !hasMore && (
        <p className="py-4 text-center text-xs text-neutral-300">
          Semua notifikasi telah dimuat.
        </p>
      )}
    </div>
  );
}
