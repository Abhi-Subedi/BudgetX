import type { Metadata, Viewport } from "next";

import { Providers } from "./providers";
import "./index.css";

export const metadata: Metadata = {
  title: "BudgetX — Money, considered",
  description:
    "Track spending, budgets, goals and shared finances — a calm, considered home for your money.",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
