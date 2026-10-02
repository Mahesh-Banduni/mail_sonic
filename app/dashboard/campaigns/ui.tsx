"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { FormEvent, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Modal from "@/components/Modal";
import {
  CampaignsIcon,
  EditIcon,
  InfoIcon,
  PlusIcon,
  RetryIcon,
  SearchIcon,
  SendIcon,
  SortIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/Icons";

type Campaign = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  batchSize: number | null;
  status: string;
  createdAt: string;
  _count: { deliveries: number };
  progress?: { sent: number; pending: number; failed: number };
};

type FormState = {
  name: string;
  subject: string;
  bodyHtml: string;
  recipientCount: string;
  recipientCustom: string;
  batchMode: string;
  batchCustom: string;
};

const emptyForm: FormState = {
  name: "",
  subject: "",
  bodyHtml: "",
  recipientCount: "all",
  recipientCustom: "",
  batchMode: "all",
  batchCustom: "",
};

export default function CampaignsPanel() {
  const [items, setItems] = useState<Campaign[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [subscribed, setSubscribed] = useState(0);
  const [search, setSearch] = useState(""),
    [order, setOrder] = useState("desc"),
    [selected, setSelected] = useState<string[]>([]),
    [editing, setEditing] = useState<Campaign | null>(null),
    [form, setForm] = useState<FormState>(emptyForm),
    [modalOpen, setModalOpen] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
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

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(item: Campaign) {
    setEditing(item);
    setForm({
      name: item.name,
      subject: item.subject,
      bodyHtml: item.bodyHtml,
      recipientCount: "all",
      recipientCustom: "",
      batchMode: item.batchSize ? "custom" : "all",
      batchCustom: item.batchSize ? String(item.batchSize) : "",
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setError("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const response = await fetch("/api/admin/campaigns", {
      method: editing ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        subject: form.subject,
        bodyHtml: form.bodyHtml,
        batchSize: form.batchMode === "all" ? "all" : form.batchCustom,
        ...(editing
          ? { id: editing.id }
          : {
              recipientCount:
                form.recipientCount === "all" ? "all" : form.recipientCustom,
            }),
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(result.message ?? "Unable to save the campaign.");
      setBusy(false);
      return;
    }

    setNotice(
      editing
        ? "Campaign updated."
        : result.remaining > 0
          ? `Queued ${result.queued} contacts · ${result.sent} sent now · ${result.remaining} waiting for the next run.`
          : `Campaign sent to ${result.sent} of ${result.queued} contacts.`,
    );
    closeModal();
    await load();
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

  async function runBatch(item: Campaign, action: "run" | "retry") {
    const verb =
      action === "retry"
        ? "Retry failed contacts in"
        : "Send the next batch of";
    if (!window.confirm(`${verb} ${item.name}?`)) return;

    setBusy(true);
    const response = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, id: item.id }),
    });
    const result = await response.json();

    setNotice(
      response.ok
        ? result.remaining > 0
          ? `Batch complete: ${result.sent} sent, ${result.failed} failed · ${result.remaining} contacts still queued.`
          : `Batch complete: ${result.sent} sent, ${result.failed} failed · campaign finished.`
        : result.message ?? "Unable to run this campaign.",
    );
    await load();
    setBusy(false);
  }

  function toggleAll() {
    setSelected(
      selected.length === items.length ? [] : items.map((item) => item.id),
    );
  }

  const invalidBatch =
    form.batchMode === "custom" &&
    (!form.batchCustom || Number(form.batchCustom) < 1);
  const invalidRecipients =
    !editing &&
    form.recipientCount === "custom" &&
    (!form.recipientCustom || Number(form.recipientCustom) < 1);

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
                Create campaigns, control how many contacts run at once, and
                track delivery progress.
              </p>
            </div>
            <button
              onClick={openCreate}
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {subscribed} subscribed contacts
                </span>
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
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
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
                    <th>Progress</th>
                    <th>Per run</th>
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
                  {items.map((item) => {
                    const deliveries = item._count.deliveries;
                    const sent = item.progress?.sent ?? 0;
                    const pending = item.progress?.pending ?? 0;
                    const failed = item.progress?.failed ?? 0;
                    const pct = deliveries
                      ? Math.round(((sent + failed) / deliveries) * 100)
                      : 0;
                    return (
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
                        <td className="min-w-[170px]">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-cyan-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="mt-1.5 block text-xs text-slate-500">
                            {sent}/{deliveries} sent
                            {pending > 0 && ` · ${pending} queued`}
                            {failed > 0 && ` · ${failed} failed`}
                          </span>
                        </td>
                        <td>
                          {item.batchSize ? (
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-700">
                              <UsersIcon className="h-3 w-3" />
                              {item.batchSize} / run
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Unlimited
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                              item.status === "COMPLETE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {item.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="pr-4 text-right whitespace-nowrap">
                          <button
                            disabled={busy || pending === 0}
                            onClick={() => void runBatch(item, "run")}
                            className="rounded-lg p-2 text-slate-400 hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-30"
                            aria-label={`Send next batch for ${item.name}`}
                            title="Send the next batch of queued contacts"
                          >
                            <SendIcon className="h-4 w-4" />
                          </button>
                          <button
                            disabled={busy || failed === 0}
                            onClick={() => void runBatch(item, "retry")}
                            className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-30"
                            aria-label={`Retry failed contacts for ${item.name}`}
                            title="Retry contacts that failed or were skipped"
                          >
                            <RetryIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEdit(item)}
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
                    );
                  })}
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
        </div>
      </main>

      <Modal
        open={modalOpen}
        title={editing ? "Edit campaign" : "Create campaign"}
        description={
          editing
            ? "Update the campaign content and how many contacts run at once."
            : "Set the audience and choose how many contacts this campaign runs at a time."
        }
        onClose={closeModal}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="campaign-form"
              disabled={busy || invalidBatch || invalidRecipients}
              className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50"
            >
              {busy ? "Saving..." : editing ? "Save changes" : "Create campaign"}
            </button>
          </>
        }
      >
        <form id="campaign-form" onSubmit={save} className="space-y-4">
          {error && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <label className="block text-sm font-semibold text-slate-700">
            Campaign name
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="e.g. September product launch"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-normal outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Subject line
            <input
              required
              value={form.subject}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
              placeholder="e.g. A quick idea for your business"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-normal outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
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
              placeholder="<p>Hello there…</p>"
              className="mt-2 min-h-48 w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 font-mono text-xs leading-5 outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          {!editing && (
            <>
              <label className="block text-sm font-semibold text-slate-700">
                Audience size
                <select
                  value={form.recipientCount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      recipientCount: event.target.value,
                    }))
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-normal outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="all">
                    All subscribed contacts ({subscribed})
                  </option>
                  <option value="custom">Custom number of contacts</option>
                </select>
              </label>

              {form.recipientCount === "custom" && (
                <label className="block text-sm font-semibold text-slate-700">
                  Number of contacts
                  <input
                    required
                    type="number"
                    min="1"
                    max={subscribed || undefined}
                    value={form.recipientCustom}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        recipientCustom: event.target.value,
                      }))
                    }
                    placeholder={`1-${subscribed}`}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-normal outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </label>
              )}
            </>
          )}

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
            <label className="block text-sm font-semibold text-slate-700">
              Contacts per run
              <select
                value={form.batchMode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    batchMode: event.target.value,
                  }))
                }
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-cyan-500"
              >
                <option value="all">All queued contacts in one run</option>
                <option value="custom">Limit contacts per run</option>
              </select>
            </label>

            {form.batchMode === "custom" && (
              <label className="mt-3 block text-sm font-semibold text-slate-700">
                How many contacts at a time?
                <input
                  required
                  type="number"
                  min="1"
                  value={form.batchCustom}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      batchCustom: event.target.value,
                    }))
                  }
                  placeholder="e.g. 50"
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-cyan-500"
                />
              </label>
            )}

            <p className="mt-3 flex gap-2 text-xs leading-5 text-slate-500">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
              {form.batchMode === "custom"
                ? `Each run sends at most ${form.batchCustom || "N"} contacts. The rest stay queued until you run this campaign again from the campaigns list.`
                : "This campaign processes every queued contact in a single run."}
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
}