"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "n":
          e.preventDefault();
          router.push("/transactions?modal=expense");
          break;
        case "t":
          e.preventDefault();
          router.push("/transactions?modal=transfer");
          break;
        case "b":
          e.preventDefault();
          router.push("/budgets");
          break;
        case "g":
          e.preventDefault();
          router.push("/goals");
          break;
        case "a":
          e.preventDefault();
          router.push("/analytics");
          break;
        case "/":
          e.preventDefault();
          router.push("/transactions?q=search");
          break;
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);
}
