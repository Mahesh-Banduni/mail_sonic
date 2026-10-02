import { prisma } from "@/lib/prisma";
import { sendOutreachMail } from "@/lib/mail";

export type SendSummary = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
};

export function appUrl() {
  return process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
}

/**
 * Normalises the `batchSize` value coming from a request body.
 * Returns `null` when the value means "no limit".
 */
export function parseBatchSize(value: unknown): number | null | "invalid" {
  if (value === null || value === undefined || value === "" || value === "all")
    return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return "invalid";
  return parsed;
}

/**
 * Marks a campaign as COMPLETE once it has no PENDING/SENDING deliveries left.
 */
export async function settleCampaign(campaignId: string) {
  const remaining = await prisma.outreachDelivery.count({
    where: {
      campaignId,
      status: { in: ["PENDING", "SENDING"] },
    },
  });

  if (remaining === 0) {
    await prisma.outreachCampaign.updateMany({
      where: { id: campaignId, status: "RUNNING" },
      data: { status: "COMPLETE", completedAt: new Date() },
    });
  }

  return remaining;
}

/**
 * Sends pending deliveries for a campaign (or across every running campaign),
 * never processing more than `batchSize` contacts per run.
 */
export async function sendPendingDeliveries(
  campaignId?: string,
  batchSize?: number | null,
): Promise<SendSummary> {
  const base = appUrl();
  if (!base)
    throw new Error("Set NEXTAUTH_URL before sending outreach emails.");

  const take =
    batchSize === undefined || batchSize === null ? undefined : batchSize;

  const deliveries = await prisma.outreachDelivery.findMany({
    where: {
      status: "PENDING",
      recipient: { unsubscribedAt: null },
      ...(campaignId ? { campaignId } : {}),
    },
    orderBy: { createdAt: "asc" },
    ...(take ? { take } : {}),
    include: { campaign: true, recipient: true },
  });

  const summary: SendSummary = { processed: 0, sent: 0, failed: 0, skipped: 0 };
  const touched = new Set<string>();

  for (const delivery of deliveries) {
    // Atomically claim the delivery so concurrent runs never double-send.
    const claim = await prisma.outreachDelivery.updateMany({
      where: { id: delivery.id, status: "PENDING" },
      data: { status: "SENDING", attempts: { increment: 1 } },
    });
    if (!claim.count) continue;

    touched.add(delivery.campaignId);
    summary.processed += 1;

    if (delivery.recipient.unsubscribedAt) {
      await prisma.outreachDelivery.update({
        where: { id: delivery.id },
        data: { status: "SKIPPED" },
      });
      summary.skipped += 1;
      continue;
    }

    try {
      await sendOutreachMail({
        to: delivery.recipient.email,
        name: delivery.recipient.name,
        subject: delivery.campaign.subject,
        bodyHtml: delivery.campaign.bodyHtml,
        unsubscribeUrl: `${base}/api/unsubscribe?email=${encodeURIComponent(delivery.recipient.email)}`,
      });
      await prisma.outreachDelivery.update({
        where: { id: delivery.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      summary.sent += 1;
    } catch (error) {
      await prisma.outreachDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
          lastError: error instanceof Error ? error.message : "Mail error",
        },
      });
      summary.failed += 1;
    }
  }

  const settleIds =
    campaignId && !touched.has(campaignId) ? [campaignId] : [...touched];
  await Promise.all(settleIds.map((id) => settleCampaign(id)));

  return summary;
}