import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOutreachMail } from "@/lib/mail";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 60;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const hasCronSecret =
    !!process.env.CRON_SECRET &&
    request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

  if (!session && !hasCronSecret)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let sent = 0,
    failed = 0;
  for (let index = 0; index < 9; index += 1) {
    const delivery = await prisma.outreachDelivery.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { campaign: true, recipient: true },
    });
    if (!delivery) break;
    const claim = await prisma.outreachDelivery.updateMany({
      where: { id: delivery.id, status: "PENDING" },
      data: { status: "SENDING", attempts: { increment: 1 } },
    });
    if (!claim.count) continue;
    if (delivery.recipient.unsubscribedAt) {
      await prisma.outreachDelivery.update({
        where: { id: delivery.id },
        data: { status: "SKIPPED" },
      });
      continue;
    }
    try {
      const appUrl =
        process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) throw new Error("Set NEXTAUTH_URL.");
      const response = await sendOutreachMail({
        to: delivery.recipient.email,
        name: delivery.recipient.name,
        subject: delivery.campaign.subject,
        bodyHtml: delivery.campaign.bodyHtml,
        unsubscribeUrl: `${appUrl}/api/unsubscribe?email=${encodeURIComponent(delivery.recipient.email)}`,
      });
      console.log("Response: ",response);
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
    if (index < 8) await delay(6000);
  }
  const active = await prisma.outreachCampaign.findMany({
    where: { status: "RUNNING" },
    select: { id: true },
  });
  await Promise.all(
    active.map(async ({ id }) => {
      if (
        !(await prisma.outreachDelivery.count({
          where: { campaignId: id, status: { in: ["PENDING", "SENDING"] } },
        }))
      )
        await prisma.outreachCampaign.update({
          where: { id },
          data: { status: "COMPLETE", completedAt: new Date() },
        });
    }),
  );
  return NextResponse.json({ sent, failed });
}
