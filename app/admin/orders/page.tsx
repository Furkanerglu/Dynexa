export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import AdminOrdersClient from "./AdminOrdersClient";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Prisma Decimal → number dönüşümü (client'a serialize edilebilsin)
  const serialized = orders.map((o) => ({
    ...o,
    totalAmount: Number(o.totalAmount),
    items: o.items.map((i) => ({
      ...i,
      price: Number(i.price),
    })),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  return <AdminOrdersClient initialOrders={serialized} />;
}
