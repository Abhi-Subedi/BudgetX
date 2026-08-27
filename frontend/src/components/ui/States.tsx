"use client";

import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-sunken ${className}`} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3.5 ${i === lines - 1 ? "w-2/5" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="py-10 text-center">
      <p className="text-[15px] text-ink2">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 transition-colors hover:decoration-brand"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, body, action, icon }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-sm py-14 text-center">
      {icon ? <div className="mb-4 flex justify-center text-ink3">{icon}</div> : null}
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink2">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
