export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Beklemede", color: "text-yellow-400 bg-yellow-400/10" },
  CONFIRMED: { label: "Onaylandı", color: "text-blue-400 bg-blue-400/10" },
  PREPARING: { label: "Hazırlanıyor", color: "text-[#FF6B35] bg-[#FF6B35]/10" },
  SHIPPED: { label: "Kargoda", color: "text-purple-400 bg-purple-400/10" },
  DELIVERED: { label: "Teslim Edildi", color: "text-[#00D4AA] bg-[#00D4AA]/10" },
  CANCELLED: { label: "İptal", color: "text-red-400 bg-red-400/10" },
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-8">Siparişler</h1>
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Sipariş No</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Müşteri</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Ürünler</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Tutar</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Ödeme</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Durum</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const status = STATUS_LABELS[order.status];
              return (
                <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/70 text-sm font-mono">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{order.user.name}</p>
                    <p className="text-white/30 text-xs">{order.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white/60 text-xs">
                      {order.items.map((i) => `${i.product.name} (×${i.quantity})`).join(", ").slice(0, 40)}
                      {order.items.length > 1 && "..."}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-white text-sm font-medium">
                    {formatPrice(Number(order.totalAmount))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.paymentStatus === "PAID" ? "bg-[#00D4AA]/10 text-[#00D4AA]" :
                      order.paymentStatus === "FAILED" ? "bg-red-500/10 text-red-400" :
                      "bg-white/10 text-white/40"
                    }`}>
                      {order.paymentStatus === "PAID" ? "Ödendi" :
                       order.paymentStatus === "FAILED" ? "Başarısız" :
                       order.paymentStatus === "REFUNDED" ? "İade" : "Bekliyor"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
