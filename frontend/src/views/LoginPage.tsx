"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Field } from "../components/ui/Input";
import { ApiError } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import AuthLayout, { AuthHeading } from "./AuthLayout";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      footer={
        <>
          New to BudgetX?{" "}
          <Link href="/register" className="font-medium text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand">
            Create an account
          </Link>
        </>
      }
    >
      <AuthHeading title="Welcome back" sub="Sign in to pick up where your money left off." />

      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

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
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </AuthLayout>
  );
}
