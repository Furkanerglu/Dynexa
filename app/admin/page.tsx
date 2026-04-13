import { formatPrice } from "@/lib/utils";
import { TrendingUp, ShoppingCart, Wrench, Users } from "lucide-react";

export const dynamic = "force-dynamic";

async function getAdminStats() {
  try {
    const { prisma } = await import("@/lib/prisma");

    const [totalRevenue, totalOrders, pendingServices, totalUsers, recentOrders, recentServices] =
      await Promise.all([
        prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalAmount: true } }),
        prisma.order.count(),
        prisma.serviceRequest.count({ where: { status: "PENDING", type: "TECHNICAL" } }),
        prisma.user.count({ where: { role: "USER" } }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, email: true } } },
        }),
        prisma.serviceRequest.findMany({
          take: 5,
          where:   { type: "TECHNICAL" },
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        }),
      ]);

    return {
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      totalOrders,
      pendingServices,
      totalUsers,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        userName: o.user.name ?? "-",
        userEmail: o.user.email,
        totalAmount: Number(o.totalAmount),
        status: o.status,
      })),
      recentServices: recentServices.map((s) => ({
        id: s.id,
        title: s.title,
        userName: s.user.name ?? "-",
        type: s.type,
        status: s.status,
      })),
    };
  } catch {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      pendingServices: 0,
      totalUsers: 0,
      recentOrders: [],
      recentServices: [],
    };
  }
}

const ORDER_STATUS: Record<string, string> = {
  PENDING: "Beklemede", CONFIRMED: "Onaylandı", PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda", DELIVERED: "Teslim Edildi", CANCELLED: "İptal",
};

const SERVICE_STATUS: Record<string, string> = {
  PENDING: "Beklemede", REVIEWING: "İnceleniyor", QUOTED: "Fiyat Verildi",
  IN_PROGRESS: "İşlemde", COMPLETED: "Tamamlandı", CANCELLED: "İptal",
};

export default async function AdminDashboard() {
  const { totalRevenue, totalOrders, pendingServices, totalUsers, recentOrders, recentServices } =
    await getAdminStats();

  const stats = [
    { label: "Toplam Gelir", value: formatPrice(totalRevenue), icon: TrendingUp, color: "#FF6B35" },
    { label: "Toplam Sipariş", value: totalOrders.toString(), icon: ShoppingCart, color: "#00D4AA" },
    { label: "Bekleyen Teknik Servis", value: pendingServices.toString(), icon: Wrench, color: "#FF6B35" },
    { label: "Toplam Kullanıcı", value: totalUsers.toString(), icon: Users, color: "#00D4AA" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/50 text-sm">{stat.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                  <Icon size={16} style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-2xl font-black text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div>
          <h2 className="text-white font-bold mb-4">Son Siparişler</h2>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            {recentOrders.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-10">Henüz sipariş yok</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Müşteri</th>
                    <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Tutar</th>
                    <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-white text-sm">{order.userName}</p>
                        <p className="text-white/30 text-xs">{order.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-white text-sm">{formatPrice(order.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.status === "DELIVERED" ? "bg-[#00D4AA]/10 text-[#00D4AA]" :
                          order.status === "CANCELLED" ? "bg-red-500/10 text-red-400" :
                          "bg-[#FF6B35]/10 text-[#FF6B35]"
                        }`}>
                          {ORDER_STATUS[order.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-white font-bold mb-4">Son Teknik Servis Talepleri</h2>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            {recentServices.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-10">Henüz servis talebi yok</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Başlık</th>
                    <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Tür</th>
                    <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {recentServices.map((sr) => (
                    <tr key={sr.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-white text-sm truncate max-w-[120px]">{sr.title}</p>
                        <p className="text-white/30 text-xs">{sr.userName}</p>
                      </td>
                      <td className="px-4 py-3 text-white/60 text-xs">{sr.type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          sr.status === "COMPLETED" ? "bg-[#00D4AA]/10 text-[#00D4AA]" :
                          sr.status === "CANCELLED" ? "bg-red-500/10 text-red-400" :
                          "bg-[#FF6B35]/10 text-[#FF6B35]"
                        }`}>
                          {SERVICE_STATUS[sr.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
