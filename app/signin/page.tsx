"use client";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
export default function SigninPage() {
  const router = useRouter(),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setBusy(false);
    if (result?.error) return setError(result.error);
    router.push("/dashboard");
  }
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#0b1740] p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-[#2f6bff]/30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <b className="grid h-10 w-10 place-items-center rounded-lg bg-[#2f6bff]">
            ID
          </b>
          <strong>Immortify Digital</strong>
        </div>
        <div className="relative my-auto max-w-xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[.22em] text-blue-300">
            Business systems, made practical
          </p>
          <h1 className="text-5xl font-bold leading-tight">
            A smarter digital foundation for growing businesses.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            We build ecommerce experiences, web applications, and automations
            that keep products, customers, and operations connected.
          </p>
        </div>
        <p className="relative text-sm text-slate-400">
          © {new Date().getFullYear()} Immortify Digital · Ahmedabad, India
        </p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="mb-9">
            <p className="mb-3 text-sm font-bold uppercase tracking-[.18em] text-[#1d4ed8]">
              Immortify Digital
            </p>
            <h2 className="text-3xl font-bold">Welcome back</h2>
            <p className="mt-2 text-[#4a5266]">
              Sign in to manage your outreach.
            </p>
          </div>
          <label className="mb-5 block text-sm font-semibold">
            Email address
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-2 h-11 w-full rounded-md border border-[#dde2ee] px-3 outline-none focus:border-[#1d4ed8]"
            />
          </label>
          <label className="mb-5 block text-sm font-semibold">
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-2 h-11 w-full rounded-md border border-[#dde2ee] px-3 outline-none focus:border-[#1d4ed8]"
            />
          </label>
          {error && (
            <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="h-11 w-full rounded-md bg-[#1d4ed8] font-semibold text-white hover:bg-[#0b1740] disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="mt-7 text-center text-sm text-[#4a5266]">
            Need help?{" "}
            <a
              className="font-semibold text-[#1d4ed8]"
              href="mailto:contact@immortifydigital.com"
            >
              Contact us
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}
