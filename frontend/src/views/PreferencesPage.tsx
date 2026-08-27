"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import * as api from "../lib/api";
import { ApiError } from "../lib/api";
import { SUPPORTED_CURRENCIES } from "../lib/format";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ne", label: "नेपाली (Nepali)" },
  { value: "hi", label: "हिन्दी (Hindi)" }
];

const TIMEZONES = [
  "UTC",
  "Asia/Kathmandu",
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Australia/Sydney",
  "Pacific/Auckland"
];

const THEMES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" }
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" }
];

const NUMBER_FORMATS = [
  { value: "1,234.56", label: "1,234.56 (US)" },
  { value: "1.234,56", label: "1.234,56 (EU)" }
];

interface Preferences {
  language: string;
  currency: string;
  timezone: string;
  theme: string;
  date_format: string;
  number_format: string;
}

export default function PreferencesPage() {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const [prefs, setPrefs] = useState<Preferences>({
    language: "en",
    currency: "USD",
    timezone: "UTC",
    theme: "system",
    date_format: "DD/MM/YYYY",
    number_format: "1,234.56"
  });

  const initialized = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Preferences>("/preferences");
        setPrefs({
          language: res.language ?? "en",
          currency: res.currency ?? "USD",
          timezone: res.timezone ?? "UTC",
          theme: res.theme ?? "system",
          date_format: res.date_format ?? "DD/MM/YYYY",
          number_format: res.number_format ?? "1,234.56"
        });
      } catch {
        // use defaults
      } finally {
        initialized.current = true;
      }
    };
    load();
  }, []);

  const update = (key: keyof Preferences, value: string) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put("/preferences", prefs);
      // Apply theme locally
      if (prefs.theme !== "system") {
        const isDark = prefs.theme === "dark";
        document.documentElement.classList.toggle("dark", isDark);
        localStorage.setItem("budgetx.theme", prefs.theme);
      } else {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", isDark);
        localStorage.removeItem("budgetx.theme");
      }
      await refreshUser();
      toast("Preferences saved");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save preferences.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Preferences" subtitle="Customize your experience." />

      <form onSubmit={save} className="max-w-lg space-y-6">
        <Select
          label="Language"
          value={prefs.language}
          onChange={(e) => update("language", e.target.value)}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </Select>

        <Select
          label="Currency"
          value={prefs.currency}
          onChange={(e) => update("currency", e.target.value)}
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        <Select
          label="Timezone"
          value={prefs.timezone}
          onChange={(e) => update("timezone", e.target.value)}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </Select>

        <Select
          label="Theme"
          value={prefs.theme}
          onChange={(e) => update("theme", e.target.value)}
        >
          {THEMES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>

        <Select
          label="Date Format"
          value={prefs.date_format}
          onChange={(e) => update("date_format", e.target.value)}
        >
          {DATE_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </Select>

        <Select
          label="Number Format"
          value={prefs.number_format}
          onChange={(e) => update("number_format", e.target.value)}
        >
          {NUMBER_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </Select>

        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save Preferences"}
        </Button>
      </form>
    </div>
  );
}
