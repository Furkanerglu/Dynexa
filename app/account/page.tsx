export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Package, Wrench, User, ChevronRight, MapPin, Settings, Zap, Scan } from "lucide-react";

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

  // Siparişler + 3D Baskı + 3D Tarama birleştir, tarihe göre sırala, son 4'ü al
  type OrderEntry = { kind: "order"; id: string; label: string; sub: string; status: string; amount: number | null; date: Date };
  type SREntry    = { kind: "print" | "scan"; id: string; label: string; sub: string; status: string; amount: number | null; date: Date };
  type AnyEntry   = OrderEntry | SREntry;

  const allOrderEntries: AnyEntry[] = [
    ...orders.map(o => ({
      kind:   "order" as const,
      id:     o.id,
      label:  `Sipariş #${o.id.slice(-8).toUpperCase()}`,
      sub:    `${o.items.length} ürün`,
      status: o.status,
      amount: Number(o.totalAmount),
      date:   o.createdAt,
    })),
    ...printRequests.map(r => ({
      kind:   "print" as const,
      id:     r.id,
      label:  r.title,
      sub:    "3D Baskı",
      status: r.status,
      amount: r.price !== null ? Number(r.price) : null,
      date:   r.createdAt,
    })),
    ...scanRequests.map(r => ({
      kind:   "scan" as const,
      id:     r.id,
      label:  r.title,
      sub:    "3D Tarama",
      status: r.status,
      amount: r.price !== null ? Number(r.price) : null,
      date:   r.createdAt,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 4);

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

        {/* Son Siparişler (Ürün + 3D Baskı + 3D Tarama) */}
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

          {allOrderEntries.length === 0 ? (
            <div className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-white/40">
              Henüz sipariş yok
            </div>
          ) : (
            <div className="space-y-3">
              {allOrderEntries.map((entry) => {
                const isOrder = entry.kind === "order";
                const isPrint = entry.kind === "print";
                const statusLabel = isOrder
                  ? ORDER_STATUS_LABELS[entry.status]
                  : SERVICE_STATUS_LABELS[entry.status];
                const statusColor =
                  entry.status === "DELIVERED" || entry.status === "COMPLETED"
                    ? "bg-[#00D4AA]/10 text-[#00D4AA]"
                    : entry.status === "CANCELLED"
                    ? "bg-red-500/10 text-red-400"
                    : entry.status === "QUOTED"
                    ? "bg-purple-500/10 text-purple-400"
                    : "bg-[#FF6B35]/10 text-[#FF6B35]";
                return (
                  <div key={entry.id} className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isOrder ? "bg-white/5" : isPrint ? "bg-[#FF6B35]/10" : "bg-[#00D4AA]/10"
                      }`}>
                        {isOrder
                          ? <Package size={13} className="text-white/40" />
                          : isPrint
                          ? <Zap size={13} className="text-[#FF6B35]" />
                          : <Scan size={13} className="text-[#00D4AA]" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{entry.label}</p>
                        <p className="text-white/40 text-xs mt-0.5">
                          {entry.sub} · {entry.date.toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>
                        {statusLabel}
                      </span>
                      {entry.amount !== null && (
                        <span className="text-white font-semibold text-sm">{formatPrice(entry.amount)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
