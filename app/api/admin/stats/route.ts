import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalRevenue, ordersToday, pendingServices, totalUsers] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.serviceRequest.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "USER" } }),
  ]);

  return NextResponse.json({
    totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
    ordersToday,
    pendingServices,
    totalUsers,
  });
}
