"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="container-px flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        {sent ? (
          <p className="mt-4 text-sm text-slate-500">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" className="w-full" loading={loading}>Send reset link</Button>
          </form>
        )}
        <Link href="/login" className="mt-4 block text-center text-sm text-brand-600 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
