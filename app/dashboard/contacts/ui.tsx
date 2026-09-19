"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { ContactsIcon, DownloadIcon, EditIcon, PlusIcon, SearchIcon, SortIcon, TrashIcon } from "@/components/Icons";

type Contact = { id: string; email: string; name: string | null; company: string | null; consentedAt: string; unsubscribedAt: string | null };
type FormState = { email: string; name: string; company: string };
const emptyForm: FormState = { email: "", name: "", company: "" };

export default function ContactsPanel() {
  const [items, setItems] = useState<Contact[]>([]), [total, setTotal] = useState(0);
  const [page, setPage] = useState(1), [search, setSearch] = useState(""), [sort, setSort] = useState("createdAt"), [order, setOrder] = useState("desc");
  const [selected, setSelected] = useState<string[]>([]), [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  const pageSize = 10, pages = Math.max(1, Math.ceil(total / pageSize));

  async function load() {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize), search, sort, order });
    const response = await fetch(`/api/admin/contacts?${query}`);
    if (response.ok) { const data = await response.json(); setItems(data.items); setTotal(data.total); }
  }
  useEffect(() => { void load(); }, [page, search, sort, order]);
  function updateForm(key: keyof FormState, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  function beginEdit(contact: Contact) { setEditing(contact); setForm({ email: contact.email, name: contact.name ?? "", company: contact.company ?? "" }); }
  function toggleSort() { setOrder((current) => current === "asc" ? "desc" : "asc"); }
  async function importContacts(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch("/api/admin/outreach", { method: "POST", body: formData });
    const result = await response.json();
    setNotice(response.ok ? `${result.imported} contacts imported.` : result.message);
    event.target.value = "";
    if (response.ok) { setPage(1); await load(); }
    setBusy(false);
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    const response = await fetch("/api/admin/contacts", { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(editing ? { ...form, id: editing.id } : form) });
    const result = await response.json(); setNotice(response.ok ? (editing ? "Contact updated." : "Contact added.") : result.message);
    if (response.ok) { setForm(emptyForm); setEditing(null); await load(); }
    setBusy(false);
  }
  async function remove(ids: string[]) {
    if (!ids.length || !window.confirm(`Delete ${ids.length} contact${ids.length === 1 ? "" : "s"}?`)) return;
    setBusy(true); const response = await fetch("/api/admin/contacts", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids }) });
    const result = await response.json(); setNotice(response.ok ? `${result.deleted} contact${result.deleted === 1 ? "" : "s"} deleted.` : result.message); setSelected([]); await load(); setBusy(false);
  }
  function toggleAll() { setSelected(selected.length === items.length ? [] : items.map((item) => item.id)); }

  return <div className="min-h-screen bg-[#f5f7fb] lg:flex"><Sidebar /><main className="min-w-0 flex-1 px-5 pb-12 pt-20 md:px-8 lg:px-10 lg:pt-9"><div className="mx-auto max-w-[1440px]">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#0e7490]"><ContactsIcon className="h-4 w-4" />Audience</div><h1 className="text-3xl font-semibold tracking-[-.04em] text-slate-950 md:text-4xl">Contacts</h1><p className="mt-2 text-sm text-slate-500">Manage the people who can receive your outreach.</p></div><div className="flex flex-wrap gap-2"><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"><DownloadIcon className="h-4 w-4" />{busy ? "Working..." : "Import contacts"}<input className="hidden" type="file" accept=".csv,.json" onChange={importContacts} disabled={busy} /></label><button onClick={() => { setEditing(null); setForm(emptyForm); }} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-[#0e7490]"><PlusIcon className="h-4 w-4" />Add contact</button></div></header>
    {notice && <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>}
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,.05)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><div className="relative min-w-[240px] flex-1"><SearchIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search contacts" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-cyan-500 focus:bg-white" /></div>{selected.length > 0 && <button disabled={busy} onClick={() => void remove(selected)} className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"><TrashIcon className="h-4 w-4" />Delete {selected.length}</button>}</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400"><tr><th className="w-12 p-4"><input type="checkbox" checked={items.length > 0 && selected.length === items.length} onChange={toggleAll} aria-label="Select all contacts" /></th><th className="p-4">Contact</th><th>Company</th><th>Status</th><th><button onClick={() => { setSort("createdAt"); toggleSort(); }} className="flex items-center gap-1">Added <SortIcon className="h-3 w-3" /></button></th><th /></tr></thead><tbody>{items.map((contact) => <tr key={contact.id} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="p-4"><input type="checkbox" checked={selected.includes(contact.id)} onChange={() => setSelected((current) => current.includes(contact.id) ? current.filter((id) => id !== contact.id) : [...current, contact.id])} aria-label={`Select ${contact.email}`} /></td><td className="p-4"><b className="font-semibold text-slate-800">{contact.name || "Unnamed contact"}</b><br /><span className="text-slate-500">{contact.email}</span></td><td>{contact.company || "—"}</td><td><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${contact.unsubscribedAt ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>{contact.unsubscribedAt ? "unsubscribed" : "subscribed"}</span></td><td>{new Date(contact.consentedAt).toLocaleDateString()}</td><td className="pr-4 text-right"><button onClick={() => beginEdit(contact)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label={`Edit ${contact.email}`}><EditIcon className="h-4 w-4" /></button><button onClick={() => void remove([contact.id])} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${contact.email}`}><TrashIcon className="h-4 w-4" /></button></td></tr>)}</tbody></table>{!items.length && <p className="p-12 text-center text-sm text-slate-500">No contacts match your search.</p>}</div>
      <Pagination page={page} pages={pages} total={total} onPage={setPage} /></section>
      <form onSubmit={save} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,.05)]"><h2 className="text-lg font-semibold text-slate-950">{editing ? "Edit contact" : "Add contact"}</h2><p className="mt-1 text-sm text-slate-500">Only add people who opted in to receive mail.</p>{(["email", "name", "company"] as const).map((field) => <label key={field} className="mt-4 block text-sm font-semibold capitalize text-slate-700">{field}<input required={field === "email"} type={field === "email" ? "email" : "text"} value={form[field]} onChange={(event) => updateForm(field, event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-normal outline-none focus:border-cyan-500 focus:bg-white" /></label>)}<div className="mt-5 flex gap-2"><button disabled={busy} className="flex-1 rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60">{editing ? "Save changes" : "Add contact"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600">Cancel</button>}</div></form>
    </div></div></main></div>;
}

function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (page: number) => void }) {
  return <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs font-medium text-slate-500"><span>{total ? `Page ${page} of ${pages} · ${total} contacts` : "0 contacts"}</span><div className="flex gap-2"><button disabled={page === 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button><button disabled={page === pages} onClick={() => onPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button></div></div>;
}