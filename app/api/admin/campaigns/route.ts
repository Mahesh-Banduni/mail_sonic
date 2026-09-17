import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOutreachMail } from "@/lib/mail";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!(await getServerSession(authOptions)))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = String(body.name ?? "").trim(),
    subject = String(body.subject ?? "").trim(),
    bodyHtml = String(body.bodyHtml ?? "").trim();

  if (!name || !subject || !bodyHtml)
    return NextResponse.json(
      { message: "Campaign name, subject, and message are required." },
      { status: 400 },
    );

  const recipients = await prisma.outreachRecipient.findMany({
    where: { unsubscribedAt: null },
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
    const delivery = await prisma.outreachDelivery.findFirst({
      where: { campaignId: campaign.id, recipientId: recipient.id },
      select: { id: true },
    });

    if (!delivery) continue;

    try {
      console.log("[campaign] sending to recipient", {
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

      console.log("[campaign] mail response", response);

      await prisma.outreachDelivery.update({
        where: { id: delivery.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      sent += 1;
    } catch (error) {
      console.error("[campaign] failed recipient delivery", {
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
