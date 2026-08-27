"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Icon } from "../components/icons";

interface Toast {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
}

interface ToastContextValue {
  toast: (message: string, tone?: Toast["tone"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[70] flex w-full max-w-xs flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2.5 rounded-md border border-line bg-sunken px-3.5 py-3 text-sm text-paper shadow-modal animate-pop-in"
          >
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full ${
                t.tone === "error" ? "bg-neg/25 text-negtint" : t.tone === "info" ? "bg-white/15" : "bg-emerald-400/25 text-emerald-200"
              }`}
            >
              <Icon name={t.tone === "error" ? "alert" : "check"} className="size-3.5" />
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
