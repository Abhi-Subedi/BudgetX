const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  NPR: "रु",
  AUD: "A$",
  CAD: "C$",
};

export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "NPR",
  "AUD",
  "CAD",
];

/* =========================================================
   MONEY
   ========================================================= */

export function formatMoney(
  amount: number,
  currency = "USD",
  locale = "en-US",
  opts: {
    signed?: boolean;
    compact?: boolean;
  } = {}
): string {
  // Protect against null/undefined/NaN coming from APIs
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  const abs = Math.abs(safeAmount);
  const hasCents = Math.round(abs * 100) % 100 !== 0;

  let formatted: string;

  try {
    formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation:
        opts.compact && abs >= 100000 ? "compact" : "standard",
      maximumFractionDigits: hasCents ? 2 : 0,
      minimumFractionDigits: hasCents ? 2 : 0,
    }).format(abs);
  } catch {
    const symbol = CURRENCY_SYMBOLS[currency] ?? "";

    formatted = `${symbol}${abs.toLocaleString(locale)}`;
  }

  if (!opts.signed) {
    return formatted;
  }

  return safeAmount < 0
    ? `−${formatted}`
    : `+${formatted}`;
}

/* =========================================================
   NUMBERS
   ========================================================= */

export function formatNumber(
  value: number,
  locale = "en-US"
): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat(locale).format(safeValue);
}

export function formatPercent(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  return `${Math.round(safeValue)}%`;
}

/* =========================================================
   DATE PARSING
   ========================================================= */

/**
 * Safely parses a YYYY-MM-DD date.
 *
 * Returns null instead of throwing when:
 * - date is missing
 * - date is not a string
 * - date has an invalid format
 * - date does not represent a real calendar date
 *
 * Example:
 * parseISO("2026-08-28") -> Date
 * parseISO(undefined) -> null
 * parseISO("2026-02-31") -> null
 */
export function parseISO(
  dateStr?: string | null
): Date | null {
  if (!dateStr || typeof dateStr !== "string") {
    return null;
  }

  const value = dateStr.trim().slice(0, 10);

  // Must be exactly YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [y, m, d] = value.split("-").map(Number);

  if (
    !Number.isInteger(y) ||
    !Number.isInteger(m) ||
    !Number.isInteger(d)
  ) {
    return null;
  }

  // Basic month/day validation
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return null;
  }

  const date = new Date(y, m - 1, d);

  // Protect against invalid dates such as:
  // 2026-02-31
  // 2026-04-31
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }

  return date;
}

/* =========================================================
   DATE FORMATTING
   ========================================================= */

export function formatDateLong(
  dateStr?: string | null
): string {
  const date = parseISO(dateStr);

  // IMPORTANT:
  // parseISO can return null.
  // Never pass null to Intl.DateTimeFormat.format().
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function relativeDay(
  dateStr?: string | null,
  locale = "en-US"
): string | null {
  const date = parseISO(dateStr);

  if (!date) {
    return null;
  }

  const today = new Date();

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const diffDays = Math.round(
    (startOfDate.getTime() - startOfToday.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === -1) {
    return "Yesterday";
  }

  if (diffDays === 1) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== today.getFullYear()
      ? { year: "numeric" as const }
      : {}),
  }).format(date);
}

/* =========================================================
   DATE HELPERS
   ========================================================= */

export function todayISO(): string {
  return isoOf(new Date());
}

export function isoOf(d: Date): string {
  const y = d.getFullYear();

  const m = String(
    d.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    d.getDate()
  ).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

export function monthKeyOf(
  d: Date = new Date()
): string {
  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;
}

export function monthLabel(
  monthKey: string,
  long = false
): string {
  if (!monthKey || typeof monthKey !== "string") {
    return "—";
  }

  const match = monthKey
    .trim()
    .match(/^(\d{4})-(\d{2})$/);

  if (!match) {
    return "—";
  }

  const yearStr = match[1];
  const monthStr = match[2];

  const year = Number(yearStr);
  const month = Number(monthStr);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return "—";
  }

  const d = new Date(year, month - 1, 1);

  const monthName = new Intl.DateTimeFormat(
    "en-US",
    {
      month: long ? "long" : "short",
    }
  ).format(d);

  return long
    ? `${monthName} ${year}`
    : monthName;
}

/**
 * Short date:
 * "Aug 28"
 *
 * Returns "—" for missing/invalid dates.
 */
export function formatDate(
  dateStr?: string | null
): string {
  const date = parseISO(dateStr);

  // FIX for TS2769:
  // Intl.format() requires a Date, not Date | null.
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

/* =========================================================
   DATE DIFFERENCE
   ========================================================= */

/**
 * Returns number of calendar days between today and date.
 *
 * Invalid/missing dates return 0.
 */
export function daysUntil(
  dateStr?: string | null
): number {
  const target = parseISO(dateStr);

  // FIX for TS2345:
  // target can be null, so don't pass it to startOf().
  if (!target) {
    return 0;
  }

  const now = new Date();

  const startOf = (x: Date): number =>
    new Date(
      x.getFullYear(),
      x.getMonth(),
      x.getDate()
    ).getTime();

  return Math.round(
    (startOf(target) - startOf(now)) /
      86400000
  );
}

/* =========================================================
   DEADLINES
   ========================================================= */

export function deadlineLabel(
  dateStr: string | null | undefined
): string {
  if (!dateStr) {
    return "";
  }

  const parsed = parseISO(dateStr);

  if (!parsed) {
    return "";
  }

  const days = daysUntil(dateStr);

  if (days < 0) {
    return "Past due";
  }

  if (days === 0) {
    return "Due today";
  }

  if (days <= 30) {
    return `${days} ${
      days === 1 ? "day" : "days"
    } left`;
  }

  return `By ${formatDateLong(dateStr)}`;
}

/* =========================================================
   GENERAL
   ========================================================= */

export function greeting(): string {
  const h = new Date().getHours();

  if (h < 12) {
    return "Good morning";
  }

  if (h < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

export function firstName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.split(/\s+/)[0] ?? trimmed;
}