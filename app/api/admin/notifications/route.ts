import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { broadcastNotification, createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title:   z.string().min(1).max(120),
  body:    z.string().min(1).max(500),
  type:    z.enum(["ORDER_STATUS", "SERVICE_STATUS", "DISCOUNT", "INFO"]).default("INFO"),
  link:    z.string().optional(),
  // userId boşsa tüm müşterilere gönder
  userId:  z.string().optional(),
});

// POST /api/admin/notifications — bildirim gönder
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    if (data.userId) {
      // Tek kullanıcıya
      const user = await prisma.user.findUnique({ where: { id: data.userId } });
      if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

      await createNotification({
        userId: data.userId,
        title:  data.title,
        body:   data.body,
        type:   data.type,
        link:   data.link,
      });
      return NextResponse.json({ ok: true, sent: 1 });
    } else {
      // Tüm müşterilere
      const result = await broadcastNotification({
        title: data.title,
        body:  data.body,
        type:  data.type,
        link:  data.link,
      });
      return NextResponse.json({ ok: true, sent: result.count });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz veri", details: err.errors }, { status: 400 });
    }
    console.error("[Admin Notifications POST]", err);
    return NextResponse.json({ error: "Gönderilemedi" }, { status: 500 });
  }
}

// GET /api/admin/notifications — son gönderilen bildirimlerin listesi (istatistik)
export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  // Benzersiz (title, createdAt) gruplamak yerine son 100 bildirimi göster
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(notifications);
}
