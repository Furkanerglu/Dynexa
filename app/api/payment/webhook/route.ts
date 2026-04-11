import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // İyzico webhook doğrulaması yapılmalı
    // TODO: Webhook signature doğrulaması

    if (body.status === "success" && body.paymentId) {
      await prisma.order.updateMany({
        where: { paymentId: body.paymentId },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
      });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook işlenemedi" }, { status: 500 });
  }
}
