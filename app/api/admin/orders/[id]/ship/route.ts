/**
 * POST /api/admin/orders/[id]/ship
 * Admin: siparişi kargoya ver, takip numarası oluştur
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createShipment } from "@/lib/cargo";
import { notifyOrderStatus } from "@/lib/notifications";

const schema = z.object({
  provider:  z.enum(["YURTICI", "HEPSIJET"]),
  weightKg:  z.number().positive(),
  desi:      z.number().positive().optional(),
  /** Manuel takip no — API'siz çalışırken */
  manualTrackingNumber: z.string().optional(),
});

/** Mağaza gönderici bilgileri (env'den al) */
const SENDER = {
  fullName: process.env.STORE_SENDER_NAME     ?? "Dynexa",
  phone:    process.env.STORE_SENDER_PHONE    ?? "05000000000",
  city:     process.env.STORE_SENDER_CITY     ?? "İstanbul",
  district: process.env.STORE_SENDER_DISTRICT ?? "Kadıköy",
  address:  process.env.STORE_SENDER_ADDRESS  ?? "Dynexa Depo Adresi",
};

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
    const { provider, weightKg, desi, manualTrackingNumber } = parsed.data;

    // Siparişi adres ile birlikte getir
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        address: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });

    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      return NextResponse.json({ error: "Bu sipariş zaten kargoya verilmiş" }, { status: 400 });
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "İptal edilmiş sipariş kargoya verilemez" }, { status: 400 });
    }

    let trackingNumber: string;

    if (manualTrackingNumber) {
      // Admin manuel takip numarası girdi
      trackingNumber = manualTrackingNumber;
    } else {
      // API üzerinden kargo oluştur
      const result = await createShipment({
        provider,
        orderId: order.id,
        receiver: {
          fullName: order.address.fullName,
          phone:    order.address.phone,
          city:     order.address.city,
          district: order.address.district,
          address:  order.address.line,
        },
        sender: SENDER,
        package: { weightKg, desi },
      });

      if (!result.success || !result.trackingNumber) {
        return NextResponse.json(
          { error: result.error ?? "Kargo oluşturulamadı" },
          { status: 502 }
        );
      }

      trackingNumber = result.trackingNumber;
    }

    // Siparişi güncelle: SHIPPED + takip numarası
    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        status:         "SHIPPED",
        cargoProvider:  provider,
        trackingNumber,
        cargoCreatedAt: new Date(),
      },
    });

    // Müşteriye bildirim
    await notifyOrderStatus(params.id, order.userId, "SHIPPED").catch(console.error);

    return NextResponse.json({
      success:       true,
      trackingNumber,
      provider,
      status:        updated.status,
    });
  } catch (err) {
    console.error("[ship] error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
