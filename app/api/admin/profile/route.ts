import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}

export async function PATCH(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!name || !/^\S+@\S+\.\S+$/.test(email))
    return NextResponse.json({ message: "Enter a valid name and email address." }, { status: 400 });

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name, email },
    });
    return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email });
  } catch {
    return NextResponse.json({ message: "That email address is already in use." }, { status: 409 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");
  if (!currentPassword || newPassword.length < 8)
    return NextResponse.json({ message: "Use your current password and a new password with at least 8 characters." }, { status: 400 });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
    return NextResponse.json({ message: "Your current password is incorrect." }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });
  return NextResponse.json({ message: "Password changed successfully." });
}