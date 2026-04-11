export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft, Package } from "lucide-react";

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: { include: { product: { select: { name: true; images: true } } } } };
}>;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Beklemede", color: "text-yellow-400 bg-yellow-400/10" },
  CONFIRMED: { label: "Onaylandı", color: "text-blue-400 bg-blue-400/10" },
  PREPARING: { label: "Hazırlanıyor", color: "text-[#FF6B35] bg-[#FF6B35]/10" },
  SHIPPED: { label: "Kargoda", color: "text-purple-400 bg-purple-400/10" },
  DELIVERED: { label: "Teslim Edildi", color: "text-[#00D4AA] bg-[#00D4AA]/10" },
  CANCELLED: { label: "İptal Edildi", color: "text-red-400 bg-red-400/10" },
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  let orders: OrderWithItems[] = [];
  try {
    orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: { include: { product: { select: { name: true, images: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB bağlantısı yoksa boş liste
  }

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

        {orders.length === 0 ? (
          <div className="text-center py-24">
            <Package size={64} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/40 mb-6">Henüz sipariş vermediniz</p>
            <Link href="/shop" className="px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-semibold">
              Alışverişe Başla
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = STATUS_LABELS[order.status];
              return (
                <div key={order.id} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div>
                      <p className="text-white font-medium text-sm">
                        Sipariş #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-white font-bold">{formatPrice(Number(order.totalAmount))}</span>
                    </div>
                  </div>

                  <div className="px-6 py-4 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-white/60">{item.product.name} <span className="text-white/30">×{item.quantity}</span></span>
                        <span className="text-white/80">{formatPrice(Number(item.price) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
