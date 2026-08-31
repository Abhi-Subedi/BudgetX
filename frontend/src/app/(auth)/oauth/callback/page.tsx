"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../../hooks/useAuth";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const provider = searchParams.get("provider") || "google";

    if (code) {
      loginWithOAuth(code, provider)
        .then(() => router.replace("/"))
        .catch((err) => {
          setError(err instanceof Error ? err.message : "OAuth failed");
          setTimeout(() => router.replace("/login"), 3000);
        });
    } else {
      router.replace("/login");
    }
  }, [searchParams, loginWithOAuth, router]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper">
        <div className="text-center">
          <p className="text-neg text-sm">{error}</p>
          <p className="text-ink3 text-xs mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper">
      <div className="text-center">
        <div className="size-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-ink2 text-sm mt-4">Completing sign in...</p>
      </div>
    </div>
  );
}
