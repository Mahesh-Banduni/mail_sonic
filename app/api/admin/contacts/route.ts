import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const emailPattern = /^\S+@\S+\.\S+$/;

async function permitted() {
  return Boolean(await getServerSession(authOptions));
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  if (!(await permitted()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const pageSize = Math.min(50, positiveInteger(params.get("pageSize"), 10));
  const page = positiveInteger(params.get("page"), 1);
  const search = params.get("search")?.trim() ?? "";
  const sort = params.get("sort") === "email" ? "email" : "createdAt";
  const order = params.get("order") === "asc" ? "asc" : "desc";
  const where = search
    ? {
        OR: [
          { email: { contains: search } },
          { name: { contains: search } },
          { company: { contains: search } },
        ],
      }
    : undefined;

  const [items, total] = await Promise.all([
    prisma.outreachRecipient.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.outreachRecipient.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  if (!(await permitted()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim() || null;
  const company = String(body.company ?? "").trim() || null;

  if (!emailPattern.test(email))
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });

  try {
    const item = await prisma.outreachRecipient.create({
      data: { email, name, company, consentedAt: new Date() },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ message: "A contact with that email already exists." }, { status: 409 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await permitted()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const id = String(body.id ?? "");
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!id || !emailPattern.test(email))
    return NextResponse.json({ message: "Contact id and a valid email are required." }, { status: 400 });

  try {
    const item = await prisma.outreachRecipient.update({
      where: { id },
      data: {
        email,
        name: String(body.name ?? "").trim() || null,
        company: String(body.company ?? "").trim() || null,
      },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ message: "Unable to update this contact." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await permitted()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
  if (!ids.length)
    return NextResponse.json({ message: "Select at least one contact." }, { status: 400 });

  const result = await prisma.outreachRecipient.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ deleted: result.count });
}