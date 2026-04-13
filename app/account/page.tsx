export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Package, Wrench, User, ChevronRight, MapPin, Settings, Zap, Scan, ShoppingCart } from "lucide-react";

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: { include: { product: true } } };
}>;

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login");

  let orders: OrderWithItems[] = [];
  let printRequests: Prisma.ServiceRequestGetPayload<object>[] = [];
  let scanRequests:  Prisma.ServiceRequestGetPayload<object>[] = [];
  let technicalRequests: Prisma.ServiceRequestGetPayload<object>[] = [];

  try {
    [orders, printRequests, scanRequests, technicalRequests] = await Promise.all([
      prisma.order.findMany({
        where: { userId: session.user.id },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.serviceRequest.findMany({
        where: { userId: session.user.id, type: "PRINT" },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.serviceRequest.findMany({
        where: { userId: session.user.id, type: "SCANNING" },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.serviceRequest.findMany({
        where: { userId: session.user.id, type: "TECHNICAL" },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);
  } catch {
    // DB bağlantısı yoksa boş liste göster
  }

  // Sadece ürün siparişleri (son 4)
  const recentOrders = orders.slice(0, 4);

  // 3D Baskı + Tarama aktif sayıları
  const activePrintCount = printRequests.filter(r =>
    !["COMPLETED", "CANCELLED"].includes(r.status)
  ).length;
  const activeScanCount = scanRequests.filter(r =>
    !["COMPLETED", "CANCELLED"].includes(r.status)
  ).length;
  const totalServiceActive = activePrintCount + activeScanCount;

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
        <div className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center">
              <User size={24} className="text-[#FF6B35]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{session.user.name}</h1>
              <p className="text-white/40 text-sm">{session.user.email}</p>
            </div>
          </div>
          <Link
            href="/account/settings"
            className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-white/50 hover:text-white hover:border-white/30 transition-all text-sm"
          >
            <Settings size={15} />
            Ayarlar
          </Link>
        </div>

        {/* Hızlı Linkler */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link href="/account/addresses" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-[#FF6B35]/30 transition-all group">
            <MapPin size={20} className="text-[#FF6B35] mb-2" />
            <p className="text-white font-medium text-sm">Adreslerim</p>
            <p className="text-white/40 text-xs mt-0.5">Teslimat adreslerini yönet</p>
          </Link>
          <Link href="/account/settings" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-[#FF6B35]/30 transition-all group">
            <Settings size={20} className="text-[#FF6B35] mb-2" />
            <p className="text-white font-medium text-sm">Hesap Ayarları</p>
            <p className="text-white/40 text-xs mt-0.5">Bilgileri ve şifreyi güncelle</p>
          </Link>
        </div>

        {/* Son Ürün Siparişleri */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold flex items-center gap-2">
              <ShoppingCart size={18} className="text-[#FF6B35]" />
              Son Siparişler
            </h2>
            <Link href="/account/orders" className="text-[#FF6B35] text-sm hover:underline flex items-center gap-1">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-white/40">
              Henüz sipariş yok
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => {
                const statusLabel = ORDER_STATUS_LABELS[o.status] ?? o.status;
                const statusColor =
                  o.status === "DELIVERED" ? "bg-[#00D4AA]/10 text-[#00D4AA]" :
                  o.status === "CANCELLED" ? "bg-red-500/10 text-red-400" :
                  "bg-[#FF6B35]/10 text-[#FF6B35]";
                return (
                  <Link key={o.id} href="/account/orders" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between gap-3 hover:border-white/20 transition-colors block">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Package size={13} className="text-white/40" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium">Sipariş #{o.id.slice(-8).toUpperCase()}</p>
                        <p className="text-white/40 text-xs mt-0.5">
                          {o.items.length} ürün · {o.createdAt.toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>{statusLabel}</span>
                      <span className="text-white font-semibold text-sm">{formatPrice(Number(o.totalAmount))}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* 3D Baskı & Tarama Hizmetleri */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Zap size={18} className="text-[#FF6B35]" />
              3D Hizmetlerim
              {totalServiceActive > 0 && (
                <span className="text-[11px] bg-[#FF6B35]/20 text-[#FF6B35] px-2 py-0.5 rounded-full font-semibold">
                  {totalServiceActive} aktif
                </span>
              )}
            </h2>
            <Link href="/account/orders?tab=print" className="text-[#FF6B35] text-sm hover:underline flex items-center gap-1">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/account/orders?tab=print" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-[#FF6B35]/30 transition-all group">
              <div className="flex items-center justify-between mb-2">
                <Zap size={18} className="text-[#FF6B35]" />
                {activePrintCount > 0 && (
                  <span className="text-[10px] bg-[#FF6B35]/20 text-[#FF6B35] px-1.5 py-0.5 rounded-full font-bold">{activePrintCount} aktif</span>
                )}
              </div>
              <p className="text-white font-medium text-sm">3D Baskı</p>
              <p className="text-white/40 text-xs mt-0.5">
                {printRequests.length > 0 ? `${printRequests.length} talep` : "Talep yok"}
              </p>
            </Link>
            <Link href="/account/orders?tab=scan" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-[#00D4AA]/30 transition-all group">
              <div className="flex items-center justify-between mb-2">
                <Scan size={18} className="text-[#00D4AA]" />
                {activeScanCount > 0 && (
                  <span className="text-[10px] bg-[#00D4AA]/20 text-[#00D4AA] px-1.5 py-0.5 rounded-full font-bold">{activeScanCount} aktif</span>
                )}
              </div>
              <p className="text-white font-medium text-sm">3D Tarama</p>
              <p className="text-white/40 text-xs mt-0.5">
                {scanRequests.length > 0 ? `${scanRequests.length} talep` : "Talep yok"}
              </p>
            </Link>
          </div>
        </div>

        {/* Teknik Servis Talepleri */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Wrench size={18} className="text-[#FF6B35]" />
              Teknik Servis Talepleri
            </h2>
            <Link href="/account/service-requests" className="text-[#FF6B35] text-sm hover:underline flex items-center gap-1">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          {technicalRequests.length === 0 ? (
            <div className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-white/40">
              Henüz teknik servis talebi yok
            </div>
          ) : (
            <div className="space-y-3">
              {technicalRequests.map((sr) => (
                <div key={sr.id} className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{sr.title}</p>
                    <p className="text-white/40 text-xs mt-1">
                      {new Date(sr.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    sr.status === "COMPLETED" ? "bg-[#00D4AA]/10 text-[#00D4AA]" :
                    sr.status === "CANCELLED" ? "bg-red-500/10 text-red-400" :
                    sr.status === "QUOTED" ? "bg-purple-500/10 text-purple-400" :
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
