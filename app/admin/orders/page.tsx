export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import AdminOrdersClient from "./AdminOrdersClient";

export default async function AdminOrdersPage() {
  const [orders, printReqs, scanReqs] = await Promise.all([
    prisma.order.findMany({
      include: {
        user:  { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.serviceRequest.findMany({
      where:   { type: "PRINT" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.serviceRequest.findMany({
      where:   { type: "SCANNING" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serializedOrders = orders.map((o) => ({
    ...o,
    totalAmount:    Number(o.totalAmount),
    items:          o.items.map((i) => ({ ...i, price: Number(i.price) })),
    createdAt:      o.createdAt.toISOString(),
    updatedAt:      o.updatedAt.toISOString(),
    cargoProvider:  o.cargoProvider  ?? null,
    trackingNumber: o.trackingNumber ?? null,
    cargoCreatedAt: o.cargoCreatedAt?.toISOString() ?? null,
  }));

  const serializeSR = (r: typeof printReqs[0]) => ({
    ...r,
    price:     r.price != null ? Number(r.price) : null,
    specs:     (r.specs as Record<string, unknown>) ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  });

  return (
    <AdminOrdersClient
      initialOrders={serializedOrders}
      initialPrint={printReqs.map(serializeSR)}
      initialScan={scanReqs.map(serializeSR)}
    />
  );
}
