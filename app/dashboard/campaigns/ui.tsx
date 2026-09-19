"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  CampaignsIcon,
  EditIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  SortIcon,
  TrashIcon,
} from "@/components/Icons";

type Campaign = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  status: string;
  createdAt: string;
  _count: { deliveries: number };
};
type FormState = { name: string; subject: string; bodyHtml: string };
const emptyForm: FormState = { name: "", subject: "", bodyHtml: "" };

export default function CampaignsPanel() {
  const [items, setItems] = useState<Campaign[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [subscribed, setSubscribed] = useState(0);
  const [search, setSearch] = useState(""),
    [order, setOrder] = useState("desc"),
    [selected, setSelected] = useState<string[]>([]),
    [editing, setEditing] = useState<Campaign | null>(null),
    [form, setForm] = useState(emptyForm),
    [recipientCount, setRecipientCount] = useState("all"),
    [customCount, setCustomCount] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const pageSize = 10,
    pages = Math.max(1, Math.ceil(total / pageSize));
  async function load() {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      search,
      sort: "createdAt",
      order,
    });
    const response = await fetch(`/api/admin/campaigns?${query}`);
    if (response.ok) {
      const data = await response.json();
      setItems(data.items);
      setTotal(data.total);
      setSubscribed(data.subscribed);
    }
  }
  useEffect(() => {
    void load();
  }, [page, search, order]);
  function beginEdit(item: Campaign) {
    setEditing(item);
    setForm({
      name: item.name,
      subject: item.subject,
      bodyHtml: item.bodyHtml,
    });
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/admin/campaigns", {
      method: editing ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        editing
          ? { ...form, id: editing.id }
          : {
              ...form,
              recipientCount:
                recipientCount === "all" ? "all" : customCount,
            },
      ),
    });
    const result = await response.json();
    setNotice(
      response.ok
        ? editing
          ? "Campaign updated."
          : `Campaign sent to ${result.queued} contacts.`
        : result.message,
    );
    if (response.ok) {
      setEditing(null);
      setForm(emptyForm);
      await load();
    }
    setBusy(false);
  }
  async function remove(ids: string[]) {
    if (
      !ids.length ||
      !window.confirm(
        `Delete ${ids.length} campaign${ids.length === 1 ? "" : "s"}?`,
      )
    )
      return;
    setBusy(true);
    const response = await fetch("/api/admin/campaigns", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    setNotice(
      response.ok
        ? `${result.deleted} campaign${result.deleted === 1 ? "" : "s"} deleted.`
        : result.message,
    );
    setSelected([]);
    await load();
    setBusy(false);
  }
  async function retry(item: Campaign) {
    if (!window.confirm(`Retry ${item.name} for contacts who have not received it?`)) return;
    setBusy(true);
    const response = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "retry", id: item.id }),
    });
    const result = await response.json();
    setNotice(
      response.ok
        ? `Campaign retry complete: ${result.sent} sent, ${result.failed} failed.`
        : result.message,
    );
    await load();
    setBusy(false);
  }
  function toggleAll() {
    setSelected(
      selected.length === items.length ? [] : items.map((item) => item.id),
    );
  }
  return (
    <div className="min-h-screen bg-[#f5f7fb] lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 pb-12 pt-20 md:px-8 lg:px-10 lg:pt-9">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#0e7490]">
                <CampaignsIcon className="h-4 w-4" />
                Outreach
              </div>
              <h1 className="text-3xl font-semibold tracking-[-.04em] text-slate-950 md:text-4xl">
                Campaigns
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Review, refine, and remove campaigns from your workspace.
              </p>
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
                setRecipientCount("all");
                setCustomCount("");
              }}
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-[#0e7490]"
            >
              <PlusIcon className="h-4 w-4" />
              New campaign
            </button>
          </header>
          {notice && (
            <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {notice}
            </div>
          )}
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div className="relative min-w-[240px] flex-1">
                  <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search campaigns"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
                {selected.length > 0 && (
                  <button
                    disabled={busy}
                    onClick={() => void remove(selected)}
                    className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete {selected.length}
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
                    <tr>
                      <th className="w-12 p-4">
                        <input
                          type="checkbox"
                          checked={
                            items.length > 0 && selected.length === items.length
                          }
                          onChange={toggleAll}
                          aria-label="Select all campaigns"
                        />
                      </th>
                      <th className="p-4">Campaign</th>
                      <th>Recipients</th>
                      <th>
                        <button
                          onClick={() =>
                            setOrder((current) =>
                              current === "asc" ? "desc" : "asc",
                            )
                          }
                          className="flex items-center gap-1"
                        >
                          Created <SortIcon className="h-3 w-3" />
                        </button>
                      </th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-slate-100 hover:bg-slate-50/70"
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selected.includes(item.id)}
                            onChange={() =>
                              setSelected((current) =>
                                current.includes(item.id)
                                  ? current.filter((id) => id !== item.id)
                                  : [...current, item.id],
                              )
                            }
                            aria-label={`Select ${item.name}`}
                          />
                        </td>
                        <td className="p-4">
                          <b className="font-semibold text-slate-800">
                            {item.name}
                          </b>
                          <br />
                          <span className="text-slate-500">{item.subject}</span>
                        </td>
                        <td>{item._count.deliveries}</td>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            {item.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="pr-4 text-right">
                          <button
                            disabled={busy}
                            onClick={() => void retry(item)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-40"
                            aria-label={`Retry ${item.name}`}
                            title="Retry for contacts who have not received this campaign"
                          >
                            <SendIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => beginEdit(item)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                            aria-label={`Edit ${item.name}`}
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void remove([item.id])}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${item.name}`}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!items.length && (
                  <p className="p-12 text-center text-sm text-slate-500">
                    No campaigns match your search.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs font-medium text-slate-500">
                <span>
                  {total
                    ? `Page ${page} of ${pages} · ${total} campaigns`
                    : "0 campaigns"}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === pages}
                    onClick={() => setPage(page + 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
            <form
              onSubmit={save}
              className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,.05)]"
            >
              <h2 className="text-lg font-semibold text-slate-950">
                {editing ? "Edit campaign" : "Create campaign"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {editing
                  ? "Update the campaign content without sending new mail."
                  : "Choose how many subscribed contacts should receive this campaign."}
              </p>
              {(["name", "subject"] as const).map((field) => (
                <label
                  key={field}
                  className="mt-4 block text-sm font-semibold capitalize text-slate-700"
                >
                  {field}
                  <input
                    required
                    value={form[field]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-normal outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </label>
              ))}
              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Message
                <textarea
                  required
                  value={form.bodyHtml}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bodyHtml: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-48 w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 font-mono text-xs leading-5 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </label>
              {!editing && (
                <>
                  <label className="mt-4 block text-sm font-semibold text-slate-700">
                    Recipients
                    <select
                      value={recipientCount}
                      onChange={(event) => setRecipientCount(event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-normal outline-none focus:border-cyan-500 focus:bg-white"
                    >
                      <option value="all">All subscribed contacts</option>
                      <option value="custom">Custom number of contacts</option>
                    </select>
                  </label>
                  {recipientCount === "custom" && (
                    <label className="mt-3 block text-sm font-semibold text-slate-700">
                      Number of contacts
                      <input
                        required
                        type="number"
                        min="1"
                        max={subscribed || undefined}
                        value={customCount}
                        onChange={(event) => setCustomCount(event.target.value)}
                        placeholder={`1-${subscribed}`}
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-normal outline-none focus:border-cyan-500 focus:bg-white"
                      />
                    </label>
                  )}
                </>
              )}
              <button
                disabled={
                  busy ||
                  (!editing &&
                    (recipientCount === "custom" &&
                      (!customCount || Number(customCount) < 1)))
                }
                className="mt-5 w-full rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                {editing ? "Save changes" : "Create & send campaign"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
