import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const emailPattern = /^\S+@\S+\.\S+$/;

async function permitted() {
  return Boolean(await getServerSession(authOptions));
}
function parse(text: string, fileName: string): Record<string, unknown>[] {
  if (fileName.endsWith(".json")) {
    const json: unknown = JSON.parse(text);
    if (!Array.isArray(json)) throw new Error("JSON must be an array.");
    return json.map((row) =>
      typeof row === "string"
        ? { email: row }
        : (row as Record<string, unknown>),
    );
  }
  const [header, ...rows] = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean);
  if (!header) return [];
  const columns = header.split(",").map((value) => value.trim().toLowerCase());
  return rows.map((row) =>
    Object.fromEntries(
      columns.map((column, index) => [
        column,
        row.split(",")[index]?.trim().replace(/^"|"$/g, "") ?? "",
      ]),
    ),
  );
}

export async function GET() {
  if (!(await permitted()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const [recipients, all, subscribed, campaigns] = await Promise.all([
    prisma.outreachRecipient.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.outreachRecipient.count(),
    prisma.outreachRecipient.count({ where: { unsubscribedAt: null } }),
    prisma.outreachCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { deliveries: true } } },
    }),
  ]);
  return NextResponse.json({ recipients, all, subscribed, campaigns });
}

export async function POST(request: NextRequest) {
  if (!(await permitted()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || !/\.(csv|json)$/i.test(file.name))
    return NextResponse.json(
      { message: "Upload a CSV or JSON file." },
      { status: 400 },
    );
  try {
    const seen = new Set<string>();
    const contacts = parse(await file.text(), file.name).flatMap((row) => {
      const email = String(row.email ?? "")
        .trim()
        .toLowerCase();
      if (!emailPattern.test(email) || seen.has(email)) return [];
      seen.add(email);
      return [
        {
          email,
          name: String(row.name ?? "").trim() || null,
          company: String(row.name ?? "").trim() || null,
          consentedAt: new Date(),
        },
      ];
    });
    if (!contacts.length)
      return NextResponse.json(
        { message: "No valid email addresses were found." },
        { status: 400 },
      );
    let imported = 0;
    for (const contact of contacts) {
      const existing = await prisma.outreachRecipient.findUnique({
        where: { email: contact.email },
      });
      if (!existing) {
        await prisma.outreachRecipient.create({ data: contact });
        imported += 1;
      }
    }
    return NextResponse.json({ imported, skipped: contacts.length - imported });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Import failed." },
      { status: 400 },
    );
  }
}
