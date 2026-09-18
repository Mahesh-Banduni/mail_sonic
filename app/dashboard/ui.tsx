"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { ChangeEvent, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import {
  ActivityIcon,
  CheckCircleIcon,
  ClockIcon,
  ContactsIcon,
  DownloadIcon,
  FileTextIcon,
  MailIcon,
  PlusIcon,
  SendIcon,
  UsersIcon,
} from "@/components/Icons";
type Recipient = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  consentedAt: string;
  unsubscribedAt: string | null;
};
type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  createdAt: string;
  _count: { deliveries: number };
};
type Data = {
  recipients: Recipient[];
  all: number;
  subscribed: number;
  campaigns: Campaign[];
};
// const template = `<p>Immortify Digital creates refined digital experiences for ambitious businesses ready to move forward.</p><p>We craft bespoke ecommerce platforms and high-performance web applications designed around the way your business operates. From products and orders to inventory, payments, customers, and automation, we bring every essential element together through thoughtful technology and seamless digital experiences.</p><p>Whether you're launching a distinctive ecommerce brand, transforming your operations, or developing a sophisticated web application, we combine strategy, design, and engineering to create digital solutions that are built to perform — and designed to leave a lasting impression.</p>`;
// const template = `<p>Immortify Digital creates refined digital experiences for ambitious businesses ready to move forward.</p><p>We design and engineer bespoke web applications and digital platforms built around the unique needs of your business. From customer experiences and internal systems to complex workflows, integrations, automation, and scalable digital products, we bring strategy, design, and technology together with purpose.</p><p>Whether you're launching a new digital product, transforming the way your business operates, or building a sophisticated web application from the ground up, we combine thoughtful strategy, distinctive design, and robust engineering to create digital solutions that perform exceptionally — and leave a lasting impression.</p>`;
const template =`<p>Immortify Digital creates thoughtful digital experiences for ambitious businesses ready to grow.</p><p>We design and build custom web/ecommerce applications and digital platforms tailored to your business. From customer-facing websites and internal tools to complex workflows, integrations, automation, and scalable digital products, we bring strategy, design, and technology together to solve real business needs.</p><p>Whether you're launching a new digital product, improving how your business works, or building a web application from scratch, we combine smart strategy, distinctive design, and reliable technology to create digital solutions that work well and make a lasting impression.</p>`
export default function DashboardClient() {
  const [data, setData] = useState<Data | null>(null),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState(""),
    [name, setName] = useState("Immortify Digital introduction"),
    [subject, setSubject] = useState(
      "A strong opportunity to improve your digital presence",
    ),
    [body, setBody] = useState(template),
    [busy, setBusy] = useState(false);
  const load = async () => {
    const response = await fetch("/api/admin/outreach");
    if (response.ok) setData(await response.json());
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, []);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/admin/outreach", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    setNotice(
      response.ok ? `${result.imported} contacts imported.` : result.message,
    );
    setBusy(false);
    await load();
  }
  async function queue() {
    setBusy(true);
    const response = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, subject, bodyHtml: body }),
    });
    const result = await response.json();
    setNotice(
      response.ok
        ? `Campaign queued for ${result.queued} contacts.`
        : result.message,
    );
    setBusy(false);
    await load();
  }
  async function sendQueuedMails() {
    setBusy(true);
    const response = await fetch("/api/cron/outreach");
    const result = await response.json();
    setNotice(
      response.ok
        ? `Queued mail run complete: ${result.sent ?? 0} sent, ${result.failed ?? 0} failed.`
        : result.message || "Failed to send queued mails.",
    );
    setBusy(false);
    await load();
  }
  return (
    <div className="min-h-screen bg-[#f5f7fb] lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 pb-12 pt-20 md:px-8 lg:px-10 lg:pt-9">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#0e7490]"><span className="h-2 w-2 rounded-full bg-emerald-400" />Workspace overview</div>
              <h1 className="text-3xl font-semibold tracking-[-.04em] text-slate-950 md:text-4xl">Good morning, Immortify.</h1>
              <p className="mt-2 text-sm text-slate-500">Keep your outreach moving with a clear view of today&apos;s activity.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => signOut({ callbackUrl: "/signin" })} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950">Sign out</button>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-[#0e7490]">
                <DownloadIcon className="h-4 w-4" />
                {busy ? "Working..." : "Import contacts"}
              <input
                className="hidden"
                type="file"
                accept=".csv,.json"
                onChange={upload}
              />
              </label>
            </div>
          </header>
          {notice && <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><CheckCircleIcon className="h-5 w-5" />{notice}</div>}
          <div className="mb-7 grid gap-4 sm:grid-cols-3">
            <Metric icon={<UsersIcon className="h-5 w-5" />} label="Total contacts" value={data?.all ?? "—"} detail="Across your workspace" />
            <Metric icon={<CheckCircleIcon className="h-5 w-5" />} label="Subscribed" value={data?.subscribed ?? "—"} detail="Eligible to receive mail" accent />
            <Metric icon={<ActivityIcon className="h-5 w-5" />} label="Campaigns" value={data?.campaigns.length ?? "—"} detail="Created to date" />
          </div>
          <div className="mb-7 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,.05)]">
              <div className="flex items-start justify-between border-b border-slate-100 p-6">
                <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#0e7490]"><PlusIcon className="h-4 w-4" />Create</div><h2 className="text-xl font-semibold tracking-tight text-slate-950">New campaign</h2></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Draft</span>
              </div>
              <div className="p-6">
              <p className="mb-5 text-sm leading-6 text-slate-500">
              Every email contains an unsubscribe link and is sent one by one,
              six seconds apart.
            </p>
            <label className="block text-sm font-semibold text-slate-700">
              Campaign name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Subject line
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Email message (HTML supported)
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-2 min-h-52 w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 font-mono text-xs leading-5 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
              />
            </label>
            <button
              disabled={busy || !data?.subscribed}
              onClick={queue}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 disabled:opacity-60"
            >
              <SendIcon className="h-4 w-4" />
              Queue for {data?.subscribed ?? 0} subscribed contacts
            </button>
            <button
              disabled={busy}
              onClick={sendQueuedMails}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
              <ClockIcon className="h-4 w-4" />
              Send queued mails now
            </button>
              </div>
          </section>
            <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,.05)]">
            <div className="flex items-center justify-between border-b border-slate-100 p-6"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#0e7490]"><MailIcon className="h-4 w-4" />Activity</div><h2 className="text-xl font-semibold tracking-tight text-slate-950">Recent campaigns</h2></div><span className="text-xs font-medium text-slate-400">Latest first</span>
            </div>
            {loading ? (
                <p className="p-6 text-sm text-slate-500">Loading campaign activity...</p>
            ) : data?.campaigns.length ? (
              data.campaigns.map((c) => (
                <div key={c.id} className="border-b border-slate-100 p-6 last:border-0">
                  <div className="flex justify-between gap-3">
                    <strong className="text-sm font-semibold text-slate-900">{c.name}</strong>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      {c.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{c.subject}</p>
                  <p className="mt-3 text-xs font-medium text-slate-400">
                    {c._count.deliveries} recipients ·{" "}
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-10 text-center"><FileTextIcon className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-500">No campaigns yet.</p></div>
            )}
          </section>
        </div>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#0e7490]"><ContactsIcon className="h-4 w-4" />Audience</div><h2 className="text-xl font-semibold tracking-tight text-slate-950">Contacts</h2>
            <p className="mt-1 text-sm text-slate-500">
              CSV fields: email, name, company. Import only people who opted in.
            </p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">{data?.subscribed ?? 0} subscribed</span></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
                <tr>
                  <th className="p-4">Contact</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {data?.recipients.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                    <td className="p-4"><b className="font-semibold text-slate-800">{r.name ?? "—"}</b><br /><span className="text-slate-500">{r.email}</span>
                    </td>
                    <td>{r.company ?? "—"}</td>
                    <td>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        {r.unsubscribedAt ? "unsubscribed" : "subscribed"}
                      </span>
                    </td>
                    <td>{new Date(r.consentedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !data?.recipients.length && (
              <p className="p-10 text-center text-sm text-slate-500">
                No contacts yet.
              </p>
            )}
          </div>
        </section>
        </div>
      </main>
    </div>
  );
}
function Metric({ icon, label, value, detail, accent }: { icon: React.ReactNode; label: string; value: string | number; detail: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,.04)]">
      <div className={`mb-5 grid h-10 w-10 place-items-center rounded-xl ${accent ? "bg-cyan-50 text-cyan-600" : "bg-slate-100 text-slate-600"}`}>{icon}</div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}
