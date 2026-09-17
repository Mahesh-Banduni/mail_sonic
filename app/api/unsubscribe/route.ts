import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email)
    return new NextResponse("This unsubscribe link is invalid.", {
      status: 400,
    });
  await prisma.outreachRecipient.updateMany({
    where: { email },
    data: { unsubscribedAt: new Date() },
  });
  return new NextResponse(
    "You have been unsubscribed from Immortify Digital updates.",
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}
