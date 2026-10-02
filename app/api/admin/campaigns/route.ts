import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  appUrl,
  parseBatchSize,
  sendPendingDeliveries,
  settleCampaign,
} from "@/lib/outreach";

export const runtime = "nodejs";

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function loadCampaign(id: string) {
  return prisma.outreachCampaign.findUnique({
    where: { id },
    include: { _count: { select: { deliveries: true } } },
  });
}

/** Sends the next batch of a campaign and reports whether work remains. */
async function runCampaignBatch(id: string) {
  const campaign = await loadCampaign(id);
  if (!campaign)
    return NextResponse.json({ message: "Campaign not found." }, { status: 404 });

  if (!appUrl())
    return NextResponse.json(
      { message: "Set NEXTAUTH_URL before sending outreach emails." },
      { status: 500 },
    );

  try {
    const summary = await sendPendingDeliveries(id, campaign.batchSize);
    const pending = await prisma.outreachDelivery.count({
      where: { campaignId: id, status: { in: ["PENDING", "SENDING"] } },
    });

    return NextResponse.json({
      campaignId: id,
      batchSize: campaign.batchSize,
      processed: summary.processed,
      sent: summary.sent,
      failed: summary.failed,
      skipped: summary.skipped,
      remaining: pending,
      status: pending === 0 ? "COMPLETE" : "RUNNING",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to run campaign.",
      },
      { status: 500 },
    );
  }
}

/** Resets failed/skipped deliveries so they can be picked up again. */
async function retryCampaign(id: string) {
  const campaign = await loadCampaign(id);
  if (!campaign)
    return NextResponse.json({ message: "Campaign not found." }, { status: 404 });

  await prisma.outreachDelivery.updateMany({
    where: {
      campaignId: id,
      status: { in: ["FAILED", "SKIPPED"] },
      recipient: { unsubscribedAt: null },
    },
    data: { status: "PENDING", lastError: null },
  });

  await prisma.outreachCampaign.updateMany({
    where: { id },
    data: { status: "RUNNING", completedAt: null },
  });

  return runCampaignBatch(id);
}

export async function GET(request: NextRequest) {
  if (!(await getServerSession(authOptions)))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const params = request.nextUrl.searchParams;
  const pageSize = Math.min(50, positiveInteger(params.get("pageSize"), 10));
  const page = positiveInteger(params.get("page"), 1);
  const search = params.get("search")?.trim() ?? "";
  const sort = params.get("sort") === "status" ? "status" : "createdAt";
  const order = params.get("order") === "asc" ? "asc" : "desc";
  const where = search
    ? { OR: [{ name: { contains: search } }, { subject: { contains: search } }] }
    : undefined;
  const [items, total, subscribed] = await Promise.all([
    prisma.outreachCampaign.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { deliveries: true } } },
    }),
    prisma.outreachCampaign.count({ where }),
    prisma.outreachRecipient.count({ where: { unsubscribedAt: null } }),
  ]);

  // Per-campaign delivery breakdown so the table can show real progress.
  const progress = await prisma.outreachDelivery.groupBy({
    by: ["campaignId", "status"],
    where: { campaignId: { in: items.map((item) => item.id) } },
    _count: { _all: true },
  });

  const totals = new Map<string, { sent: number; pending: number; failed: number }>();
  for (const row of progress) {
    const entry = totals.get(row.campaignId) ?? { sent: 0, pending: 0, failed: 0 };
    if (row.status === "SENT") entry.sent += row._count._all;
    else if (row.status === "PENDING" || row.status === "SENDING")
      entry.pending += row._count._all;
    else if (row.status === "FAILED") entry.failed += row._count._all;
    totals.set(row.campaignId, entry);
  }

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      progress: totals.get(item.id) ?? { sent: 0, pending: 0, failed: 0 },
    })),
    total,
    page,
    pageSize,
    subscribed,
  });
}

export async function POST(request: NextRequest) {
  if (!(await getServerSession(authOptions)))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (body.action === "retry") return retryCampaign(String(body.id ?? ""));
  if (body.action === "run") return runCampaignBatch(String(body.id ?? ""));

  const name = String(body.name ?? "").trim(),
    subject = String(body.subject ?? "").trim(),
    bodyHtml = String(body.bodyHtml ?? "").trim(),
    recipientCount =
      body.recipientCount === "all" || body.recipientCount == null
        ? null
        : Number(body.recipientCount),
    batchSize = parseBatchSize(body.batchSize);

  if (!name || !subject || !bodyHtml)
    return NextResponse.json(
      { message: "Campaign name, subject, and message are required." },
      { status: 400 },
    );
  if (recipientCount !== null && (!Number.isInteger(recipientCount) || recipientCount < 1))
    return NextResponse.json(
      { message: "Recipient count must be a positive whole number or all." },
      { status: 400 },
    );
  if (batchSize === "invalid")
    return NextResponse.json(
      { message: "Contacts per run must be a positive whole number or all." },
      { status: 400 },
    );

  const recipients = await prisma.outreachRecipient.findMany({
    where: { unsubscribedAt: null },
    orderBy: { createdAt: "asc" },
    ...(recipientCount === null ? {} : { take: recipientCount }),
    select: { id: true },
  });

  if (!recipients.length)
    return NextResponse.json(
      { message: "No subscribed recipients found." },
      { status: 400 },
    );

  if (!appUrl())
    return NextResponse.json(
      { message: "Set NEXTAUTH_URL before sending outreach emails." },
      { status: 500 },
    );

  const campaign = await prisma.outreachCampaign.create({
    data: {
      name,
      subject,
      bodyHtml,
      batchSize,
      deliveries: {
        create: recipients.map((recipient) => ({ recipientId: recipient.id })),
      },
    },
  });

  const summary = await sendPendingDeliveries(campaign.id, batchSize);
  const remaining = await settleCampaign(campaign.id);

  return NextResponse.json(
    {
      campaignId: campaign.id,
      batchSize,
      queued: recipients.length,
      processed: summary.processed,
      sent: summary.sent,
      failed: summary.failed,
      skipped: summary.skipped,
      remaining,
      status: remaining === 0 ? "COMPLETE" : "RUNNING",
    },
    { status: 201 },
  );
}

export async function PATCH(request: NextRequest) {
  if (!(await getServerSession(authOptions)))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const id = String(body.id ?? "");
  const name = String(body.name ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const bodyHtml = String(body.bodyHtml ?? "").trim();

  if (!id || !name || !subject || !bodyHtml)
    return NextResponse.json({ message: "Campaign fields are required." }, { status: 400 });

  const hasBatch = Object.prototype.hasOwnProperty.call(body, "batchSize");
  const batchSize = hasBatch ? parseBatchSize(body.batchSize) : null;
  if (batchSize === "invalid")
    return NextResponse.json(
      { message: "Contacts per run must be a positive whole number or all." },
      { status: 400 },
    );

  try {
    const item = await prisma.outreachCampaign.update({
      where: { id },
      data: {
        name,
        subject,
        bodyHtml,
        ...(hasBatch ? { batchSize: batchSize as number | null } : {}),
      },
      include: { _count: { select: { deliveries: true } } },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ message: "Unable to update this campaign." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await getServerSession(authOptions)))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
  if (!ids.length)
    return NextResponse.json({ message: "Select at least one campaign." }, { status: 400 });
  const result = await prisma.outreachCampaign.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ deleted: result.count });
}
