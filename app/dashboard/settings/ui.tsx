"use client";

import { FormEvent, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { CheckCircleIcon, SettingsIcon } from "@/components/Icons";

type Profile = { name: string; email: string };

export default function SettingsPanel() {
  const [profile, setProfile] = useState<Profile>({ name: "", email: "" });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/profile").then(async (response) => {
      if (response.ok) setProfile(await response.json());
    });
  }, []);

  async function updateProfile(event: FormEvent) {
    event.preventDefault();
    await submit("PATCH", profile, "Profile updated successfully.");
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (await submit("PUT", { currentPassword, newPassword }, "Password changed successfully.")) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function submit(method: "PATCH" | "PUT", body: object, success: string) {
    setBusy(true);
    setNotice("");
    setError("");
    const response = await fetch("/api/admin/profile", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (response.ok) setNotice(result.message ?? success);
    else setError(result.message ?? "Unable to save your changes.");
    setBusy(false);
    return response.ok;
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 pb-12 pt-20 md:px-8 lg:px-10 lg:pt-9">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#0e7490]"><SettingsIcon className="h-4 w-4" />Account</div>
            <h1 className="text-3xl font-semibold tracking-[-.04em] text-slate-950 md:text-4xl">Settings</h1>
            <p className="mt-2 text-sm text-slate-500">Manage your profile and account security.</p>
          </header>
          {notice && <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><CheckCircleIcon className="h-5 w-5" />{notice}</div>}
          {error && <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          <div className="grid gap-6 md:grid-cols-2">
            <form onSubmit={updateProfile} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,.05)]">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Profile</h2>
              <p className="mt-1 text-sm text-slate-500">Update the details used for your account.</p>
              <label className="mt-6 block text-sm font-semibold text-slate-700">Name<input required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none focus:border-cyan-500 focus:bg-white" /></label>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Email<input required type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none focus:border-cyan-500 focus:bg-white" /></label>
              <button disabled={busy} className="mt-6 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0e7490] disabled:opacity-60">Save profile</button>
            </form>
            <form onSubmit={changePassword} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,.05)]">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Change password</h2>
              <p className="mt-1 text-sm text-slate-500">Use at least 8 characters for your new password.</p>
              <label className="mt-6 block text-sm font-semibold text-slate-700">Current password<input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none focus:border-cyan-500 focus:bg-white" /></label>
              <label className="mt-4 block text-sm font-semibold text-slate-700">New password<input required minLength={8} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none focus:border-cyan-500 focus:bg-white" /></label>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Confirm new password<input required minLength={8} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none focus:border-cyan-500 focus:bg-white" /></label>
              <button disabled={busy} className="mt-6 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60">Change password</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}