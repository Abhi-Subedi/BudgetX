import type { SVGProps } from "react";

export type IconName =
  | "home"
  | "activity"
  | "target"
  | "chart"
  | "flag"
  | "wallet"
  | "users"
  | "settings"
  | "plus"
  | "close"
  | "chevron-down"
  | "chevron-right"
  | "chevron-left"
  | "search"
  | "calendar"
  | "repeat"
  | "bell"
  | "check"
  | "trash"
  | "pencil"
  | "logout"
  | "dots"
  | "arrow-up"
  | "arrow-down"
  | "copy"
  | "alert"
  | "crown"
  | "help"
  | "spark"
  | "tag"
  | "credit-card"
  | "arrows-right-left"
  | "heart"
  | "document-text"
  | "trending-up";

const PATHS: Record<IconName, JSX.Element> = {
  home: <path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z" />,
  activity: <path d="M3 12h4l2.5-6 5 12L17 12h4" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  chart: <path d="M4 20V9m5 11V4m5 16v-7m5 7V7" />,
  flag: <path d="M6 21V4m0 .5c4-2.5 8 2.5 13-.5v9c-5 3-9-2-13 .5" />,
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2.5" />
      <path d="M3 10h18M16.5 15h.01" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.25" />
      <path d="M3.5 20c.5-3.5 2.75-5.5 5.5-5.5s5 2 5.5 5.5M15.5 5.6a3.25 3.25 0 0 1 0 5.8m1.6 3.4c2 .6 3.3 2.4 3.65 5.2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9A7 7 0 0 0 14 5.6L13.7 3h-3.4L10 5.6a7 7 0 0 0-2.6 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.6 1.2l.3 2.6h3.4l.3-2.6a7 7 0 0 0 2.6-1.2l2.3.9 2-3.4-2-1.5c.06-.4.1-.8.1-1.2Z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.35-4.35" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M4 10.5h16M8.5 3.5v4m7-4v4" />
    </>
  ),
  repeat: <path d="M17 3.5 20.5 7 17 10.5M20.5 7H7.5A4 4 0 0 0 3.5 11m3.5 9.5L3.5 17 7 13.5M3.5 17h13a4 4 0 0 0 4-4" />,
  bell: <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.5 6 1.5 6h-15S6 14 6 9.5M10 19a2.2 2.2 0 0 0 4 0" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  trash: <path d="M5 7h14M9.5 7V4.5h5V7m-8 0 .8 13h9.4l.8-13M10 11v5m4-5v5" />,
  pencil: <path d="M4 20h4.5L20 8.5a2.1 2.1 0 0 0-3-3L5.5 17 4 20ZM14.5 8l3 3" />,
  logout: <path d="M14 4h5v16h-5m-5-4 5-4-5-4m5 4H4" />,
  dots: (
    <>
      <circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  "arrow-up": <path d="M7 17 17 7m0 0H8.5M17 7v8.5" />,
  "arrow-down": <path d="M7 7l10 10m0 0V8.5M17 17H8.5" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
      <path d="M5.5 15.5h-1a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 22 20H2L12 3.5Z" />
      <path d="M12 10v4.5m0 2.5v.01" />
    </>
  ),
  crown: <path d="M4 17.5h16M4.5 15.5 3 7l5 3.75L12 4.5l4 6.25L21 7l-1.5 8.5h-15Z" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.2a2.7 2.7 0 1 1 3.8 2.6c-.85.38-1.2 1-1.2 1.95m0 3.05v.01" />
    </>
  ),
  spark: <path d="M12 3v5m0 8v5m9-9h-5M8 12H3m14.5-6.5-3 3m-5 5-3 3m11 0-3-3m-5-5-3-3" />,
  tag: (
    <>
      <path d="M12.5 2.5 21 11a1.4 1.4 0 0 1 0 2L14 20a1.4 1.4 0 0 1-2 0L2.5 10.5a1.4 1.4 0 0 1 0-2L11 2.5a1.4 1.4 0 0 1 1.5 0Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  "credit-card": (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 10h20" />
    </>
  ),
  "arrows-right-left": (
    <>
      <path d="M8 3 4.5 7 8 11" />
      <path d="M4.5 7h15" />
      <path d="M16 21l3.5-4-3.5-4" />
      <path d="M19.5 17h-15" />
    </>
  ),
  heart: <path d="M12 21c-1-1-8-5.5-8-10.5A4.5 4.5 0 0 1 12 7.2a4.5 4.5 0 0 1 8 3.3c0 5-7 9.5-8 10.5Z" />,
  "document-text": (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </>
  ),
  "trending-up": <path d="M22 7 13.5 15.5 8.5 10.5 2 17M22 7h-6m6 0v6" />
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({ name, className = "size-5", ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
