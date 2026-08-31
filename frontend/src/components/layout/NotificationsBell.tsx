"use client";

import { useEffect, useRef, useState } from "react";

import { get, post } from "../../lib/api";
import type { AppNotification } from "../../types";
import { Icon } from "../icons";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await get<{ items: AppNotification[]; unread: number }>("/notifications");
        if (!cancelled) {
          setItems(data.items.slice(0, 12));
          setUnread(data.unread);
        }
      } catch {
        /* silent for bell */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAllRead = async () => {
    setItems((list) => list.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    await post("/notifications/read-all").catch(() => undefined);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        className="relative grid size-9 place-items-center rounded-md text-ink2 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <Icon name="bell" className="size-[18px]" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-neg text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-[-85vw] bottom-3 z-50 w-80 overflow-hidden rounded-lg border border-line bg-surface shadow-lift animate-pop-in">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 ? (
              <button onClick={markAllRead} className="text-xs font-medium text-brand hover:underline">
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink3">You’re all caught up.</p>
            ) : (
              <ul className="divide-y divide-line/70">
                {items.map((n) => (
                  <li key={n.id} className={`px-4 py-3 ${n.is_read ? "" : "bg-brand-fade/60"}`}>
                    <p className="text-[13px] font-medium leading-snug">{n.title}</p>
                    {n.body ? <p className="mt-0.5 text-xs leading-relaxed text-ink2">{n.body}</p> : null}
                    <p className="mt-1 text-[11px] text-ink3">{timeAgo(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
