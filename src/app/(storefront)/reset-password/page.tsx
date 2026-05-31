"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } else {
      setError(json.error || "Reset failed");
    }
  }

  if (!token) {
    return <p className="text-sm text-red-500">Missing or invalid reset token.</p>;
  }

  return done ? (
    <p className="text-sm text-green-600">Password updated! Redirecting to login…</p>
  ) : (
    <form onSubmit={submit} className="space-y-4">
      <Input label="New password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" loading={loading}>Update password</Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container-px flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
            <ResetForm />
          </Suspense>
        </div>
        <Link href="/login" className="mt-4 block text-center text-sm text-brand-600 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
