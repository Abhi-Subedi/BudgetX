import { describe, expect, it } from "vitest";

import {
  daysUntil,
  formatMoney,
  firstName,
  greeting,
  isoOf,
  monthKeyOf,
  monthLabel,
  parseISO,
  relativeDay,
} from "./format";

describe("formatMoney", () => {
  it("formats USD without cents for whole amounts", () => {
    expect(formatMoney(1250, "USD", "en-US")).toBe("$1,250");
  });

  it("keeps two decimals when needed", () => {
    expect(formatMoney(1250.5, "USD", "en-US")).toBe("$1,250.50");
  });

  it("signs negative amounts with a minus", () => {
    expect(formatMoney(-320, "USD", "en-US", { signed: true })).toBe("−$320");
  });

  it("signs positive amounts with a plus", () => {
    expect(formatMoney(45000, "NPR", "ne-NP", { signed: true })).toContain("+");
  });
});

describe("dates", () => {
  it("round-trips ISO dates", () => {
    const d = new Date(2026, 7, 23);
    expect(parseISO(isoOf(d)).getDate()).toBe(23);
  });

  it("builds a month key", () => {
    expect(monthKeyOf(new Date(2026, 11, 5))).toBe("2026-12");
  });

  it("labels months long form", () => {
    expect(monthLabel("2026-08", true)).toBe("August 2026");
    expect(monthLabel("2026-08")).toBe("Aug");
  });

  it("marks today and yesterday", () => {
    const now = new Date();
    expect(relativeDay(isoOf(now))).toBe("Today");
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    expect(relativeDay(isoOf(y))).toBe("Yesterday");
  });

  it("counts days until deadlines", () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(daysUntil(isoOf(future))).toBe(10);
  });
});

describe("text helpers", () => {
  it("extracts first names", () => {
    expect(firstName("Asha Kumari Rai")).toBe("Asha");
  });

  it("greets by time of day", () => {
    expect(["Good morning", "Good afternoon", "Good evening"]).toContain(greeting());
  });
});
