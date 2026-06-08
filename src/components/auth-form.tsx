"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      const message = data.error ?? "Something went wrong";
      setError(message);
      toast.error(message);
      return;
    }
    toast.success(mode === "login" ? "Logged in successfully" : "Account created successfully");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-8 shadow-soft">
        <div className="mb-8">
          <p className="text-sm font-semibold text-brand-600">QuantPOS</p>
          <h1 className="mt-2 text-3xl font-semibold">{mode === "login" ? "Welcome back" : "Create your shop"}</h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "login" ? "Sign in to manage sales, stock, staff, and reports." : "Start with a shop owner account and your first store profile."}
          </p>
        </div>
        <form onSubmit={submit} className="grid gap-4">
          {mode === "register" ? <Field label="Full name" name="name" required placeholder="Aarav Sharma" /> : null}
          <Field label="Email" name="email" type="email" required placeholder="owner@shop.com" />
          <Field label="Password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" />
          {mode === "register" ? (
            <>
              <Field label="Business name" name="shopName" required placeholder="My Retail Shop" />
              <Field label="Phone" name="phone" placeholder="+91 98765 43210" />
            </>
          ) : null}
          {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">{error}</div> : null}
          <Button disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}</Button>
        </form>
        <div className="mt-6 flex items-center justify-between text-sm">
          <Link className="font-medium text-brand-600" href={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Create account" : "I already have an account"}
          </Link>
          {mode === "login" ? <Link className="text-muted hover:text-ink" href="/forgot-password">Forgot password?</Link> : null}
        </div>
      </div>
    </div>
  );
}
