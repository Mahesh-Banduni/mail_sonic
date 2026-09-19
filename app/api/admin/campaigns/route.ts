import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOutreachMail } from "@/lib/mail";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function retryCampaign(id: string) {
  const campaign = await prisma.outreachCampaign.findUnique({ where: { id } });
  if (!campaign)
    return NextResponse.json({ message: "Campaign not found." }, { status: 404 });

  const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl)
    return NextResponse.json(
      { message: "Set NEXTAUTH_URL before sending outreach emails." },
      { status: 500 },
    );

  await prisma.outreachDelivery.updateMany({
    where: {
      campaignId: id,
      status: { in: ["PENDING", "FAILED", "SKIPPED"] },
      recipient: { unsubscribedAt: null },
    },
    data: { status: "PENDING", lastError: null },
  });

  let sent = 0;
  let failed = 0;
  const deliveries = await prisma.outreachDelivery.findMany({
    where: { campaignId: id, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { recipient: true },
  });

  for (const delivery of deliveries) {
    const claim = await prisma.outreachDelivery.updateMany({
      where: { id: delivery.id, status: "PENDING" },
      data: { status: "SENDING", attempts: { increment: 1 } },
    });
    if (!claim.count) continue;
    try {
      await sendOutreachMail({
        to: delivery.recipient.email,
        name: delivery.recipient.name,
        subject: campaign.subject,
        bodyHtml: campaign.bodyHtml,
        unsubscribeUrl: `${appUrl}/api/unsubscribe?email=${encodeURIComponent(delivery.recipient.email)}`,
      });
      await prisma.outreachDelivery.update({
        where: { id: delivery.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      sent += 1;
    } catch (error) {
      await prisma.outreachDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
          lastError: error instanceof Error ? error.message : "Mail error",
        },
      });
      failed += 1;
    }
  }

  await prisma.outreachCampaign.update({
    where: { id },
    data: { status: "COMPLETE", completedAt: new Date() },
  });
  return NextResponse.json({ campaignId: id, queued: deliveries.length, sent, failed });
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
  return NextResponse.json({ items, total, page, pageSize, subscribed });
}

export async function POST(request: NextRequest) {
  if (!(await getServerSession(authOptions)))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (body.action === "retry") return retryCampaign(String(body.id ?? ""));
  const name = String(body.name ?? "").trim(),
    subject = String(body.subject ?? "").trim(),
    bodyHtml = String(body.bodyHtml ?? "").trim(),
    recipientCount = body.recipientCount === "all" || body.recipientCount == null
      ? null
      : Number(body.recipientCount);

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

  const recipients = await prisma.outreachRecipient.findMany({
    where: { unsubscribedAt: null },
    orderBy: { createdAt: "asc" },
    ...(recipientCount === null ? {} : { take: recipientCount }),
    select: { id: true, email: true, name: true },
  });

  if (!recipients.length)
    return NextResponse.json(
      { message: "No subscribed recipients found." },
      { status: 400 },
    );

  const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { message: "Set NEXTAUTH_URL before sending outreach emails." },
      { status: 500 },
    );
  }

  const campaign = await prisma.outreachCampaign.create({
    data: {
      name,
      subject,
      bodyHtml,
      deliveries: {
        create: recipients.map((recipient) => ({ recipientId: recipient.id })),
      },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const claim = await prisma.outreachDelivery.updateMany({
      where: { campaignId: campaign.id, recipientId: recipient.id, status: "PENDING" },
      data: { status: "SENDING", attempts: { increment: 1 } },
    });

    if (!claim.count) continue;
    const delivery = await prisma.outreachDelivery.findUnique({
      where: { campaignId_recipientId: { campaignId: campaign.id, recipientId: recipient.id } },
      select: { id: true },
    });
    if (!delivery) continue;

    try {
      console.log(`[campaign] sending to recipient ${sent}`, {
        recipientId: recipient.id,
        email: recipient.email,
        campaignId: campaign.id,
      });

      const response = await sendOutreachMail({
        to: recipient.email,
        name: recipient.name,
        subject: campaign.subject,
        bodyHtml: campaign.bodyHtml,
        unsubscribeUrl: `${appUrl}/api/unsubscribe?email=${encodeURIComponent(recipient.email)}`,
      });

      await prisma.outreachDelivery.update({
        where: { id: delivery.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      sent += 1;

      console.log(`[campaign] mail response ${sent}`, response);
    } catch (error) {
      console.error(`[campaign] failed recipient delivery ${sent}`, {
        recipientId: recipient.id,
        email: recipient.email,
        campaignId: campaign.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      await prisma.outreachDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
          lastError: error instanceof Error ? error.message : "Mail error",
        },
      });
      failed += 1;
    }
  }

  await prisma.outreachCampaign.update({
    where: { id: campaign.id },
    data: { status: "COMPLETE", completedAt: new Date() },
  });

  return NextResponse.json({
    campaignId: campaign.id,
    queued: recipients.length,
    sent,
    failed,
  });
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
  try {
    const item = await prisma.outreachCampaign.update({
      where: { id },
      data: { name, subject, bodyHtml },
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
