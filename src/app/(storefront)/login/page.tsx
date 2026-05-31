"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      await refresh();
      router.push(json.data.user.role === "CUSTOMER" ? "/account" : "/admin");
    } else {
      setError(json.error || "Login failed");
    }
  }

  return (
    <div className="container-px flex min-h-[70vh] items-center justify-center py-12">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Log in to your Globistic account.</p>
        <div className="mt-6 space-y-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>Log in</Button>
        </div>
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/forgot-password" className="text-brand-600 hover:underline">Forgot password?</Link>
          <Link href="/register" className="text-brand-600 hover:underline">Create account</Link>
        </div>
      </form>
    </div>
  );
}
