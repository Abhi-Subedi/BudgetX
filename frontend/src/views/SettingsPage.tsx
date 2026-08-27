"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Field, Select } from "../components/ui/Input";
import { Icon } from "../components/icons";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { patch, ApiError } from "../lib/api";
import { SUPPORTED_CURRENCIES } from "../lib/format";

const LOCALES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "ne-NP", label: "नेपाली (Nepal)" },
  { value: "de-DE", label: "Deutsch" },
  { value: "fr-FR", label: "Français" }
];

const SETTINGS_LINKS = [
  { href: "/profile-edit", label: "Edit Profile", description: "Name, avatar, bio, and personal info", icon: "pencil" },
  { href: "/security", label: "Security", description: "Password, 2FA, and active sessions", icon: "check" },
  { href: "/connected-accounts", label: "Connected Accounts", description: "Manage linked providers", icon: "users" },
  { href: "/preferences", label: "Preferences", description: "Language, currency, timezone, and theme", icon: "settings" },
  { href: "/notifications-prefs", label: "Notifications", description: "Control email and alert preferences", icon: "bell" },
  { href: "/audit-log", label: "Activity Log", description: "View your account activity history", icon: "activity" },
  { href: "/delete-account", label: "Delete Account", description: "Permanently delete your account", icon: "trash" }
] as const;

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [locale, setLocale] = useState("en-US");
  const [profileBusy, setProfileBusy] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const initialized = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("budgetx.theme");
    if (stored === "dark") {
      setDarkMode(true);
    } else if (stored === "light") {
      setDarkMode(false);
    } else {
      setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    if (user && !initialized.current) {
      setName(user.name);
      setCurrency(user.currency);
      setLocale(user.locale);
      initialized.current = true;
    }
  }, [user]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("budgetx.theme", next ? "dark" : "light");
      return next;
    });
  };

  const saveProfile = async (e?: FormEvent) => {
    e?.preventDefault();
    setProfileBusy(true);
    try {
      await patch("/users/me", { name: name.trim(), currency, locale });
      await refreshUser();
      toast("Profile updated");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not update your profile.", "error");
    } finally {
      setProfileBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your account, your preferences." />

      <div className="grid gap-x-14 gap-y-12 md:grid-cols-2">
        <form onSubmit={saveProfile} aria-label="Quick settings">
          <h2 className="eyebrow mb-4 border-b border-line pb-2">Quick Settings</h2>
          <div className="space-y-4">
            <Field label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
            <Field label="Email" value={user?.email ?? ""} disabled readOnly />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Select label="Locale & dates" value={locale} onChange={(e) => setLocale(e.target.value)}>
                {LOCALES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </Select>
            </div>
            <p className="text-[13px] text-ink3">
              Currency changes apply to new entries. Existing records keep the currency they were created with.
            </p>
            <Button type="submit" disabled={profileBusy}>
              {profileBusy ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </form>

        <div className="space-y-12">
          {/* Theme Toggle */}
          <section aria-label="Appearance">
            <h2 className="eyebrow mb-4 border-b border-line pb-2">Appearance</h2>
            <div className="flex items-center justify-between rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-ink">Dark Mode</p>
                <p className="text-xs text-ink3">Switch between light and dark themes</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={darkMode}
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  darkMode ? "bg-brand" : "bg-line"
                }`}
              >
                <span
                  className={`inline-block size-4 rounded-full bg-paper shadow transition-transform ${
                    darkMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Settings Navigation Links */}
          <section aria-label="Settings">
            <h2 className="eyebrow mb-4 border-b border-line pb-2">Account Settings</h2>
            <div className="space-y-1">
              {SETTINGS_LINKS.map((link) => {
                const isDanger = link.icon === "trash";
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-lg p-3 text-sm transition-colors ${
                      isDanger
                        ? "text-neg hover:bg-negtint/40"
                        : "text-ink2 hover:bg-sunken/60 hover:text-ink"
                    }`}
                  >
                    <Icon name={link.icon as any} className="size-4 shrink-0" />
                    <div>
                      <p className={`font-medium ${isDanger ? "text-neg" : ""}`}>{link.label}</p>
                      <p className="text-xs text-ink3">{link.description}</p>
                    </div>
                    <Icon name="chevron-right" className="ml-auto size-4 text-ink3" />
                  </Link>
                );
              })}
            </div>
          </section>

          {user?.is_admin && (
            <section aria-label="Admin">
              <h2 className="eyebrow mb-4 border-b border-line pb-2">Admin</h2>
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium text-ink2 transition-colors hover:bg-sunken/60 hover:text-ink"
              >
                <Icon name="crown" className="size-4" />
                Admin Dashboard
              </Link>
            </section>
          )}

          <section aria-label="Session">
            <h2 className="eyebrow mb-4 border-b border-line pb-2">Session</h2>
            <Button variant="ghost" onClick={logout}>
              Sign out of BudgetX
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
