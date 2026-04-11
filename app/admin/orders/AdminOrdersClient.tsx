"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "PENDING",   label: "Beklemede",       badge: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/30" },
  { value: "CONFIRMED", label: "Onaylandı",        badge: "text-blue-400 bg-blue-400/10 border border-blue-400/30" },
  { value: "PREPARING", label: "Hazırlanıyor",     badge: "text-[#FF6B35] bg-[#FF6B35]/10 border border-[#FF6B35]/30" },
  { value: "SHIPPED",   label: "Kargoya Verildi",  badge: "text-purple-400 bg-purple-400/10 border border-purple-400/30" },
  { value: "DELIVERED", label: "Teslim Edildi",    badge: "text-[#00D4AA] bg-[#00D4AA]/10 border border-[#00D4AA]/30" },
  { value: "CANCELLED", label: "İptal Edildi",     badge: "text-red-400 bg-red-400/10 border border-red-400/30" },
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

function StatusDropdown({
  orderId,
  currentStatus,
  loading,
  onUpdate,
}: {
  orderId: string;
  currentStatus: string;
  loading: boolean;
  onUpdate: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = statusMeta(currentStatus);

  // Dışarı tıklanınca kapat
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className={`
          flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full
          transition-all select-none whitespace-nowrap
          ${meta.badge}
          ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:brightness-125 active:scale-95"}
        `}
      >
        {loading ? (
          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : null}
        {meta.label}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-44 bg-[#111] border border-white/10 rounded-xl shadow-xl overflow-hidden">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setOpen(false);
                if (opt.value !== currentStatus) onUpdate(orderId, opt.value);
              }}
              className={`
                w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-colors
                hover:bg-white/5
                ${opt.value === currentStatus ? "opacity-50 cursor-default" : "cursor-pointer"}
              `}
            >
              <span className={`flex-1 px-2 py-0.5 rounded-full inline-block ${opt.badge}`}>
                {opt.label}
              </span>
              {opt.value === currentStatus && (
                <span className="text-white/30 text-[10px]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Güncelleme başarısız");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success("Durum güncellendi — müşteriye bilgilendirme maili gönderildi.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      toast.error(`Güncelleme başarısız: ${msg}`);
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
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-visible">
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
              {orders.map((order) => (
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
                      {order.items.map((i) => `${i.product.name} ×${i.quantity}`).join(", ")}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-white text-sm font-medium whitespace-nowrap">
                    {formatPrice(Number(order.totalAmount))}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.paymentStatus === "PAID"     ? "bg-[#00D4AA]/10 text-[#00D4AA]"   :
                      order.paymentStatus === "FAILED"   ? "bg-red-500/10 text-red-400"        :
                      order.paymentStatus === "REFUNDED" ? "bg-blue-500/10 text-blue-400"      :
                                                           "bg-white/10 text-white/40"
                    }`}>
                      {order.paymentStatus === "PAID"     ? "Ödendi"     :
                       order.paymentStatus === "FAILED"   ? "Başarısız"  :
                       order.paymentStatus === "REFUNDED" ? "İade"       : "Bekliyor"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <StatusDropdown
                      orderId={order.id}
                      currentStatus={order.status}
                      loading={loadingId === order.id}
                      onUpdate={updateStatus}
                    />
                  </td>

                  <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
