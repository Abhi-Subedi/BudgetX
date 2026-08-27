const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  NPR: "रु",
  AUD: "A$",
  CAD: "C$"
};

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "INR", "NPR", "AUD", "CAD"];

export function formatMoney(
  amount: number,
  currency = "USD",
  locale = "en-US",
  opts: { signed?: boolean; compact?: boolean } = {}
): string {
  const abs = Math.abs(amount);
  const hasCents = Math.round(abs * 100) % 100 !== 0;
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: opts.compact && abs >= 100000 ? "compact" : "standard",
      maximumFractionDigits: hasCents ? 2 : 0,
      minimumFractionDigits: hasCents ? 2 : 0
    }).format(abs);
  } catch {
    const symbol = CURRENCY_SYMBOLS[currency] ?? "";
    formatted = `${symbol}${abs.toLocaleString(locale)}`;
  }
  if (!opts.signed) return formatted;
  return amount < 0 ? `−${formatted}` : `+${formatted}`;
}

export function formatNumber(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function parseISO(dateStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): string {
  return isoOf(new Date());
}

export function isoOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthKeyOf(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(monthKey: string, long = false): string {
  const [yearStr, monthStr] = monthKey.split("-").map(Number);
  const d = new Date(yearStr, (monthStr ?? 1) - 1, 1);
  const monthName = new Intl.DateTimeFormat("en-US", { month: long ? "long" : "short" }).format(d);
  return long ? `${monthName} ${yearStr}` : monthName;
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parseISO(dateStr));
}

export function formatDateLong(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parseISO(dateStr));
}

export function relativeDay(dateStr: string, locale = "en-US"): string | null {
  const d = parseISO(dateStr);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(d);
}

export function daysUntil(dateStr: string): number {
  const target = parseISO(dateStr);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((startOf(target) - startOf(now)) / 86400000);
}

export function deadlineLabel(dateStr: string | null): string {
  if (!dateStr) return "";
  const days = daysUntil(dateStr);
  if (days < 0) return "Past due";
  if (days === 0) return "Due today";
  if (days <= 30) return `${days} ${days === 1 ? "day" : "days"} left`;
  return `By ${formatDateLong(dateStr)}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
