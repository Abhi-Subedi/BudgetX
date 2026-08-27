"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Field, Select } from "../components/ui/Input";
import { ApiError } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { SUPPORTED_CURRENCIES } from "../lib/format";
import AuthLayout, { AuthHeading } from "./AuthLayout";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setBusy(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, currency });
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Could not create your account. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand">
            Sign in
          </Link>
        </>
      }
    >
      <AuthHeading title="Create your BudgetX" sub="A calm, considered home for your money." />

      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field
          label="Your name"
          name="name"
          required
          placeholder="Asha Rai"
          autoComplete="name"
          value={name}
          error={fieldErrors.name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="Email"
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          error={fieldErrors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          name="password"
          required
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={password}
          error={fieldErrors.password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Select label="Currency" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        {error ? (
          <p role="alert" className="rounded-md bg-negtint px-3.5 py-2.5 text-sm text-neg animate-fade-in">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="h-11 w-full rounded-md bg-brand text-[15px] font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {busy ? "Creating…" : "Create Account"}
        </button>

        <p className="text-xs leading-relaxed text-ink3">
          We'll start you with a Cash account and a sensible set of categories. Everything stays yours.
        </p>
      </form>
    </AuthLayout>
  );
}
