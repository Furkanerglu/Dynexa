import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications — kullanıcının bildirimleri
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

// PATCH /api/notifications — tümünü okundu işaretle
export async function PATCH() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
