"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "./icons";
import type { IconName } from "./icons";

interface Command {
  id: string;
  icon: IconName;
  label: string;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: Command[] = useMemo(
    () => [
      {
        id: "add-expense",
        icon: "arrow-down",
        label: "Add Expense",
        shortcut: "N",
        action: () => {
          setOpen(false);
          router.push("/transactions?modal=expense");
        },
      },
      {
        id: "add-income",
        icon: "arrow-up",
        label: "Add Income",
        action: () => {
          setOpen(false);
          router.push("/transactions?modal=income");
        },
      },
      {
        id: "transfer",
        icon: "arrows-right-left",
        label: "Transfer",
        shortcut: "T",
        action: () => {
          setOpen(false);
          router.push("/transactions?modal=transfer");
        },
      },
      {
        id: "view-budgets",
        icon: "target",
        label: "View Budgets",
        shortcut: "B",
        action: () => {
          setOpen(false);
          router.push("/budgets");
        },
      },
      {
        id: "view-goals",
        icon: "flag",
        label: "View Goals",
        shortcut: "G",
        action: () => {
          setOpen(false);
          router.push("/goals");
        },
      },
      {
        id: "view-analytics",
        icon: "chart",
        label: "View Analytics",
        shortcut: "A",
        action: () => {
          setOpen(false);
          router.push("/analytics");
        },
      },
      {
        id: "settings",
        icon: "settings",
        label: "Settings",
        action: () => {
          setOpen(false);
          router.push("/settings");
        },
      },
      {
        id: "search",
        icon: "search",
        label: "Search Transactions",
        shortcut: "/",
        action: () => {
          setOpen(false);
          router.push("/transactions?q=search");
        },
      },
    ],
    [router],
  );

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const scrollSelectedIntoView = useCallback((index: number) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index] as HTMLElement | undefined;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => {
          const next = i < filtered.length - 1 ? i + 1 : 0;
          scrollSelectedIntoView(next);
          return next;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => {
          const next = i > 0 ? i - 1 : filtered.length - 1;
          scrollSelectedIntoView(next);
          return next;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center pt-[20vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="absolute inset-0 bg-ink/35 animate-fade-in backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-modal animate-pop-in">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Icon name="search" className="size-5 shrink-0 text-ink3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-ink3"
          />
          <kbd className="hidden rounded border border-line bg-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink3 sm:inline-block">
            ESC
          </kbd>
        </div>
        <div ref={listRef} className="max-h-72 overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink3">
              No commands found.
            </p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  i === selectedIndex
                    ? "bg-brand/10 text-white"
                    : "text-ink2 hover:bg-sunken"
                }`}
              >
                <Icon name={cmd.icon} className="size-[18px] shrink-0" />
                <span className="flex-1 font-medium">{cmd.label}</span>
                {cmd.shortcut ? (
                  <kbd className="rounded border border-line bg-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink3">
                    {cmd.shortcut}
                  </kbd>
                ) : null}
              </button>
            ))
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[11px] text-ink3">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line bg-sunken px-1 py-0.5 text-[10px]">
              ↑↓
            </kbd>{" "}
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line bg-sunken px-1 py-0.5 text-[10px]">
              ↵
            </kbd>{" "}
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line bg-sunken px-1 py-0.5 text-[10px]">
              ESC
            </kbd>{" "}
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
