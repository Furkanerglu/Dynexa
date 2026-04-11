export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Package, Wrench, User, ChevronRight } from "lucide-react";

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [orders, serviceRequests] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.serviceRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const ORDER_STATUS_LABELS: Record<string, string> = {
    PENDING: "Beklemede",
    CONFIRMED: "Onaylandı",
    PREPARING: "Hazırlanıyor",
    SHIPPED: "Kargoda",
    DELIVERED: "Teslim Edildi",
    CANCELLED: "İptal Edildi",
  };

  const SERVICE_STATUS_LABELS: Record<string, string> = {
    PENDING: "Beklemede",
    REVIEWING: "İnceleniyor",
    QUOTED: "Fiyat Verildi",
    CONFIRMED: "Onaylandı",
    IN_PROGRESS: "İşlemde",
    COMPLETED: "Tamamlandı",
    CANCELLED: "İptal",
  };

  return (
    <div className="min-h-screen bg-[#020202] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center">
            <User size={24} className="text-[#FF6B35]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{session.user.name}</h1>
            <p className="text-white/40 text-sm">{session.user.email}</p>
          </div>
        </div>

        {/* Son Siparişler */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Package size={18} className="text-[#FF6B35]" />
              Son Siparişler
            </h2>
            <Link href="/account/orders" className="text-[#FF6B35] text-sm hover:underline flex items-center gap-1">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-white/40">
              Henüz sipariş yok
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">
                      Sipariş #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      {order.items.length} ürün · {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      order.status === "DELIVERED" ? "bg-[#00D4AA]/10 text-[#00D4AA]" :
                      order.status === "CANCELLED" ? "bg-red-500/10 text-red-400" :
                      "bg-[#FF6B35]/10 text-[#FF6B35]"
                    }`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <span className="text-white font-semibold">
                      {formatPrice(Number(order.totalAmount))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Servis Talepleri */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Wrench size={18} className="text-[#FF6B35]" />
              Servis Talepleri
            </h2>
            <Link href="/account/service-requests" className="text-[#FF6B35] text-sm hover:underline flex items-center gap-1">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          {serviceRequests.length === 0 ? (
            <div className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-white/40">
              Henüz servis talebi yok
            </div>
          ) : (
            <div className="space-y-3">
              {serviceRequests.map((sr) => (
                <div key={sr.id} className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{sr.title}</p>
                    <p className="text-white/40 text-xs mt-1">
                      {sr.type} · {new Date(sr.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    sr.status === "COMPLETED" ? "bg-[#00D4AA]/10 text-[#00D4AA]" :
                    sr.status === "CANCELLED" ? "bg-red-500/10 text-red-400" :
                    sr.status === "QUOTED" ? "bg-blue-500/10 text-blue-400" :
                    "bg-[#FF6B35]/10 text-[#FF6B35]"
                  }`}>
                    {SERVICE_STATUS_LABELS[sr.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
