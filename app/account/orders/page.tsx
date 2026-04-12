export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { ChevronLeft, Package } from "lucide-react";
import OrdersClient from "./OrdersClient";

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: { include: { product: { select: { name: true; images: true } } } } };
}>;

export default async function OrdersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [orders, printReqs, scanReqs] = await Promise.all([
    prisma.order.findMany({
      where:   { userId: session.user.id },
      include: { items: { include: { product: { select: { name: true, images: true } } } } },
      orderBy: { createdAt: "desc" },
    }).catch(() => [] as OrderWithItems[]),
    prisma.serviceRequest.findMany({
      where:   { userId: session.user.id, type: "PRINT" },
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    prisma.serviceRequest.findMany({
      where:   { userId: session.user.id, type: "SCANNING" },
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
  ]);

  const serializedOrders = orders.map((o) => ({
    ...o,
    totalAmount: Number(o.totalAmount),
    createdAt:   o.createdAt.toISOString(),
    updatedAt:   o.updatedAt.toISOString(),
    items: o.items.map((i) => ({ ...i, price: Number(i.price) })),
  }));

  const serializeSR = (r: typeof printReqs[0]) => ({
    ...r,
    price:     r.price != null ? Number(r.price) : null,
    specs:     (r.specs as Record<string, unknown>) ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  });

  return (
    <div className="min-h-screen bg-[#020202] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/account" className="text-white/40 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package size={22} className="text-[#FF6B35]" />
            Siparişlerim
          </h1>
        </div>

        <OrdersClient
          initialOrders={serializedOrders}
          initialPrint={printReqs.map(serializeSR)}
          initialScan={scanReqs.map(serializeSR)}
        />
      </div>
    </div>
  );
}
