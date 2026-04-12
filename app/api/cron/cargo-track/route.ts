/**
 * GET /api/cron/cargo-track
 * Vercel Cron Job — her 2 saatte bir kargodaki siparişlerin durumunu günceller.
 *
 * Vercel'de korumalı: CRON_SECRET env değişkeni ile doğrulanır.
 * vercel.json'da tanımlı: { "path": "/api/cron/cargo-track", "schedule": "0 */2 * * *" }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trackShipment } from "@/lib/cargo";
import { notifyOrderStatus } from "@/lib/notifications";
import type { CargoProvider } from "@/lib/cargo";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Pro: max 300s, Hobby: 60s

export async function GET(req: NextRequest) {
  // Vercel Cron doğrulaması
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Kargodaki tüm siparişleri bul (SHIPPED, takip numarası olan)
  const shippedOrders = await prisma.order.findMany({
    where: {
      status:        "SHIPPED",
      trackingNumber: { not: null },
      cargoProvider:  { not: null },
    },
    select: {
      id:            true,
      userId:        true,
      trackingNumber: true,
      cargoProvider:  true,
      cargoCreatedAt: true,
    },
  });

  if (shippedOrders.length === 0) {
    return NextResponse.json({ checked: 0, delivered: 0 });
  }

  let deliveredCount = 0;
  const errors: string[] = [];

  for (const order of shippedOrders) {
    // 60 günden eski kargo — takip bırak
    if (order.cargoCreatedAt) {
      const daysOld = (Date.now() - order.cargoCreatedAt.getTime()) / 86_400_000;
      if (daysOld > 60) continue;
    }

    try {
      const result = await trackShipment(
        order.cargoProvider as CargoProvider,
        order.trackingNumber!
      );

      if (result.success && result.delivered) {
        await prisma.order.update({
          where: { id: order.id },
          data:  { status: "DELIVERED" },
        });

        await notifyOrderStatus(order.id, order.userId, "DELIVERED").catch(console.error);
        deliveredCount++;
      }
    } catch (err) {
      errors.push(`${order.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`[cargo-track] checked=${shippedOrders.length} delivered=${deliveredCount} errors=${errors.length}`);

  return NextResponse.json({
    checked:   shippedOrders.length,
    delivered: deliveredCount,
    errors,
  });
}
