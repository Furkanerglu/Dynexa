/**
 * POST /api/admin/orders/[id]/ship
 * Admin: siparişi kargoya ver (manuel takip numarası)
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notifyOrderStatus } from "@/lib/notifications";

const schema = z.object({
  provider:      z.enum(["YURTICI", "HEPSIJET", "OTHER"]),
  trackingNumber: z.string().min(1, "Takip numarası zorunludur"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  try {
    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { provider, trackingNumber } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, userId: true },
    });

    if (!order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      return NextResponse.json({ error: "Bu sipariş zaten kargoya verilmiş" }, { status: 400 });
    }
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "İptal edilmiş sipariş kargoya verilemez" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        status:         "SHIPPED",
        cargoProvider:  provider,
        trackingNumber,
        cargoCreatedAt: new Date(),
      },
    });

    await notifyOrderStatus(params.id, order.userId, "SHIPPED").catch(console.error);

    return NextResponse.json({
      success:        true,
      trackingNumber: updated.trackingNumber,
      provider:       updated.cargoProvider,
      status:         updated.status,
    });
  } catch (err) {
    console.error("[ship] error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
