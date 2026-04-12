import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyOrderStatus } from "@/lib/notifications";

// POST /api/orders/[id]/cancel — müşteri siparişi iptal eder
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });

  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  if (order.userId !== session.user.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  // Kargoya verilinceye kadar iptal edilebilir
  if (!["PENDING", "CONFIRMED", "PREPARING"].includes(order.status)) {
    return NextResponse.json(
      { error: "Kargoya verilen siparişler iptal edilemez. Destek için iletişime geçin." },
      { status: 400 }
    );
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });

  // İptal bildirimi gönder
  await notifyOrderStatus(params.id, session.user.id, "CANCELLED").catch(console.error);

  return NextResponse.json(updated);
}
