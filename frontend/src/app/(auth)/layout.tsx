"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Splash } from "../../components/layout/Splash";
import { useAuth } from "../../hooks/useAuth";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, user, router]);

  if (!ready || user) return <Splash />;

  return <>{children}</>;
}
