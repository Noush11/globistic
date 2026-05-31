"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      await refresh();
      router.push("/account");
    } else {
      setError(json.error || json.issues?.[0]?.message || "Registration failed");
    }
  }

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="container-px flex min-h-[70vh] items-center justify-center py-12">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Save designs, track orders, and reorder fast.</p>
        <div className="mt-6 space-y-4">
          <Input label="Full name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          <Input label="Phone (optional)" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <Input label="Password" type="password" required value={form.password} onChange={(e) => set("password", e.target.value)} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>Sign up</Button>
        </div>
        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
