import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notifyOrderStatus } from "@/lib/notifications";

const schema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json(
      { error: `Yetkisiz — rol: ${(session.user as { role?: string }).role ?? "yok"}` },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { status } = schema.parse(body);

    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: { status },
    });

    // Durum değiştiyse müşteriye bildirim gönder
    if (order.status !== status) {
      await notifyOrderStatus(params.id, order.userId, status).catch(console.error);
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
    }
    console.error("[Admin Order PATCH]", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}
