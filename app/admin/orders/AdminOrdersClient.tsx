"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "PENDING",   label: "Beklemede",       color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  { value: "CONFIRMED", label: "Onaylandı",        color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  { value: "PREPARING", label: "Hazırlanıyor",     color: "text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/20" },
  { value: "SHIPPED",   label: "Kargoya Verildi",  color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  { value: "DELIVERED", label: "Teslim Edildi",    color: "text-[#00D4AA] bg-[#00D4AA]/10 border-[#00D4AA]/20" },
  { value: "CANCELLED", label: "İptal Edildi",     color: "text-red-400 bg-red-400/10 border-red-400/20" },
];

function statusMeta(value: string) {
  return STATUS_OPTIONS.find((s) => s.value === value) ?? STATUS_OPTIONS[0];
}

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string | Date;
  user: { name: string | null; email: string };
  items: { product: { name: string }; quantity: number }[];
};

export default function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function updateStatus(orderId: string, newStatus: string) {
    setLoadingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Güncelleme başarısız");

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success("Sipariş durumu güncellendi, müşteriye email gönderildi.");
    } catch {
      toast.error("Durum güncellenemedi. Tekrar deneyin.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-8">Siparişler</h1>

      {orders.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-white/40">Henüz sipariş yok.</p>
        </div>
      ) : (
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
                const meta = statusMeta(order.status);
                const isLoading = loadingId === order.id;

                return (
                  <tr
                    key={order.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 text-white/70 text-sm font-mono">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{order.user.name ?? "—"}</p>
                      <p className="text-white/30 text-xs">{order.user.email}</p>
                    </td>

                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-white/60 text-xs truncate">
                        {order.items
                          .map((i) => `${i.product.name} ×${i.quantity}`)
                          .join(", ")}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-white text-sm font-medium">
                      {formatPrice(Number(order.totalAmount))}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          order.paymentStatus === "PAID"
                            ? "bg-[#00D4AA]/10 text-[#00D4AA]"
                            : order.paymentStatus === "FAILED"
                            ? "bg-red-500/10 text-red-400"
                            : order.paymentStatus === "REFUNDED"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-white/10 text-white/40"
                        }`}
                      >
                        {order.paymentStatus === "PAID"
                          ? "Ödendi"
                          : order.paymentStatus === "FAILED"
                          ? "Başarısız"
                          : order.paymentStatus === "REFUNDED"
                          ? "İade"
                          : "Bekliyor"}
                      </span>
                    </td>

                    {/* Durum dropdown */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={order.status}
                          disabled={isLoading}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`
                            text-xs px-2 py-1 pr-6 rounded-full border appearance-none cursor-pointer
                            bg-transparent outline-none transition-opacity
                            ${meta.color}
                            ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:brightness-125"}
                          `}
                          style={{ backgroundImage: "none" }}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option
                              key={opt.value}
                              value={opt.value}
                              className="bg-[#0a0a0a] text-white"
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {isLoading && (
                          <span className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3">
                            <svg
                              className="animate-spin text-white/50"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
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
      )}
    </div>
  );
}
