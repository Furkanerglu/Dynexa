import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // Sadece PENDING veya CONFIRMED siparişler iptal edilebilir
  if (!["PENDING", "CONFIRMED"].includes(order.status)) {
    return NextResponse.json(
      { error: "Bu sipariş artık iptal edilemez. Hazırlanma veya kargo aşamasındaki siparişler için iletişime geçin." },
      { status: 400 }
    );
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json(updated);
}
