import Link from "next/link";

import { LogoMark, Wordmark } from "../components/layout/Logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-6">
      <div className="text-center">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <LogoMark />
          <Wordmark />
        </div>
        <p className="tnum font-display text-6xl font-extrabold tracking-tight text-brand">404</p>
        <h1 className="mt-4 font-display text-xl font-semibold tracking-tight">This page doesn’t exist</h1>
        <p className="text-pretty mt-2 text-[15px] text-ink2">
          The page you’re looking for was moved or never existed.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-[#06251C] transition-colors hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          Back to Overview
        </Link>
      </div>
    </div>
  );
}
