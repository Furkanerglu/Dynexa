"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Package, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Beklemede",      color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  CONFIRMED: { label: "Onaylandı",      color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  PREPARING: { label: "Hazırlanıyor",   color: "text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/30" },
  SHIPPED:   { label: "Kargoda",        color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  DELIVERED: { label: "Teslim Edildi",  color: "text-[#00D4AA] bg-[#00D4AA]/10 border-[#00D4AA]/30" },
  CANCELLED: { label: "İptal Edildi",   color: "text-red-400 bg-red-400/10 border-red-400/30" },
};

// İptal edilebilir durumlar
const CANCELLABLE = ["PENDING", "CONFIRMED"];

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; images: string[] };
};

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  items: OrderItem[];
};

function OrderCard({ order, onCancel }: { order: Order; onCancel: (id: string) => Promise<void> }) {
  const [open,          setOpen]          = useState(false);
  const [cancelling,    setCancelling]    = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.PENDING;
  const canCancel = CANCELLABLE.includes(order.status);

  async function handleCancel() {
    if (!confirmCancel) { setConfirmCancel(true); return; }
    setCancelling(true);
    setConfirmCancel(false);
    try {
      await onCancel(order.id);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${open ? "border-white/20 bg-white/[0.03]" : "border-white/10 bg-white/[0.02]"}`}>
      {/* Başlık */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${status.color}`}>
              {status.label}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
              order.paymentStatus === "PAID"     ? "text-[#00D4AA] bg-[#00D4AA]/10 border-[#00D4AA]/30" :
              order.paymentStatus === "FAILED"   ? "text-red-400 bg-red-400/10 border-red-400/30" :
              order.paymentStatus === "REFUNDED" ? "text-blue-400 bg-blue-400/10 border-blue-400/30" :
                                                   "text-white/30 bg-white/5 border-white/10"
            }`}>
              {order.paymentStatus === "PAID"     ? "Ödendi"    :
               order.paymentStatus === "FAILED"   ? "Ödeme Hatalı" :
               order.paymentStatus === "REFUNDED" ? "İade"      : "Ödeme Bekliyor"}
            </span>
          </div>
          <p className="text-white font-medium text-sm">
            Sipariş #{order.id.slice(-8).toUpperCase()}
          </p>
          <p className="text-white/30 text-xs">
            {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-white font-bold text-sm">{formatPrice(order.totalAmount)}</span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-white/30 hover:text-white transition-colors p-1"
          >
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Detay */}
      {open && (
        <div className="border-t border-white/5 px-5 py-4 space-y-4">
          {/* Ürünler */}
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-white/60">
                  {item.product.name}
                  <span className="text-white/30 ml-1">×{item.quantity}</span>
                </span>
                <span className="text-white/80">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 border-t border-white/5">
              <span className="text-white/40">Toplam</span>
              <span className="text-white font-bold">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {order.notes && (
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-[11px] text-white/30 mb-1">Sipariş Notu</p>
              <p className="text-white/60 text-sm">{order.notes}</p>
            </div>
          )}

          {/* İptal butonu */}
          {canCancel && (
            <div className="pt-1">
              {confirmCancel ? (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl">
                  <p className="flex-1 text-red-300 text-xs">Siparişi iptal etmek istediğinizden emin misiniz?</p>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {cancelling ? "İptal ediliyor..." : "Evet, İptal Et"}
                  </button>
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="text-xs text-white/40 hover:text-white px-2 py-1.5 transition-colors"
                  >
                    Vazgeç
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                >
                  <XCircle size={13} />
                  Siparişi İptal Et
                </button>
              )}
              <p className="text-[10px] text-white/20 mt-1.5">
                * Hazırlanmaya başlayan siparişler iptal edilemez
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="flex justify-between pt-1 border-t border-white/5">
            <span className="text-[11px] text-white/20 font-mono">#{order.id.slice(-8).toUpperCase()}</span>
            <span className="text-[11px] text-white/20">
              Güncellendi: {new Date(order.updatedAt).toLocaleDateString("tr-TR")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  async function handleCancel(id: string) {
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);

      setOrders((prev) =>
        prev.map((o) => (o.id !== id ? o : { ...o, status: "CANCELLED", updatedAt: data.updatedAt ?? o.updatedAt }))
      );
      toast.success("Siparişiniz iptal edildi.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
      throw err;
    }
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-24">
        <Package size={64} className="mx-auto text-white/10 mb-4" />
        <p className="text-white/40 mb-6">Henüz sipariş vermediniz</p>
        <Link href="/shop" className="px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-semibold">
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} onCancel={handleCancel} />
      ))}
    </div>
  );
}
