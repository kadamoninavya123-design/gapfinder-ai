"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@gapfinder.ai");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) router.push("/dashboard");
    else setError("Wrong email or password.");
  }

  return (
    <main className="min-h-screen bg-[#0d1320] text-white flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-[#151d2e] border border-[#27334b] rounded-xl p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold">GapFinder AI</h1>
        <p className="text-sm text-slate-400">
          Demo login is filled in. Just press Log in.
        </p>
        <input
          className="w-full rounded-lg bg-[#1b2539] border border-[#27334b] p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-lg bg-[#1b2539] border border-[#27334b] p-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="w-full rounded-lg bg-[#7aa2ff] text-[#0d1320] font-bold p-2">
          Log in
        </button>
      </form>
    </main>
  );
}