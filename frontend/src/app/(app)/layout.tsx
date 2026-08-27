"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "../../components/layout/AppShell";
import { CommandPalette } from "../../components/CommandPalette";
import { Splash } from "../../components/layout/Splash";
import { useAuth } from "../../hooks/useAuth";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useKeyboardShortcuts();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return <Splash />;

  return (
    <AppShell>
      <CommandPalette />
      {children}
    </AppShell>
  );
}
