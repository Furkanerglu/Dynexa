import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusEmail } from "@/lib/email";
import { z } from "zod";

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

    // Mevcut siparişi getir (email için müşteri bilgileri dahil)
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { email: true, name: true } },
        items: {
          include: { product: { select: { name: true } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    // Durumu güncelle
    const updated = await prisma.order.update({
      where: { id: params.id },
      data: { status },
    });

    // Müşteriye email gönder (hata olsa bile response'u engelleme)
    sendOrderStatusEmail({
      to: order.user.email,
      customerName: order.user.name ?? "Müşteri",
      orderId: order.id,
      status,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
    }).catch((err) => console.error("[OrderStatus Email] Gönderilemedi:", err));

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
    }
    console.error("[Admin Order PATCH]", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}
