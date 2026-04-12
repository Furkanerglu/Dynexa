"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Package, XCircle, ChevronDown, ChevronUp, Zap, Scan, CheckCircle2, ShoppingCart, Clock, Wrench, BoxIcon, Truck, CircleCheck, ExternalLink } from "lucide-react";
import Link from "next/link";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Onay Bekliyor",           color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  CONFIRMED: { label: "Hazırlanıyor",            color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  PREPARING: { label: "Hazır, Kargoya Verilecek", color: "text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/30" },
  SHIPPED:   { label: "Kargoda",                 color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  DELIVERED: { label: "Teslim Edildi",            color: "text-[#00D4AA] bg-[#00D4AA]/10 border-[#00D4AA]/30" },
  CANCELLED: { label: "İptal Edildi",             color: "text-red-400 bg-red-400/10 border-red-400/30" },
};

// Adım bazlı takip (CANCELLED hariç)
const ORDER_STEPS = [
  { status: "PENDING",   icon: Clock,       label: "Onay Bekliyor" },
  { status: "CONFIRMED", icon: Wrench,      label: "Hazırlanıyor" },
  { status: "PREPARING", icon: BoxIcon,     label: "Kargoya Hazır" },
  { status: "SHIPPED",   icon: Truck,       label: "Kargoda" },
  { status: "DELIVERED", icon: CircleCheck, label: "Teslim Edildi" },
];
const STEP_ORDER = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"];

const SR_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:     { label: "Beklemede",     color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  REVIEWING:   { label: "İnceleniyor",   color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  QUOTED:      { label: "Fiyat Verildi", color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  CONFIRMED:   { label: "Onaylandı",     color: "text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/30" },
  IN_PROGRESS: { label: "İşlemde",       color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  COMPLETED:   { label: "Tamamlandı",    color: "text-[#00D4AA] bg-[#00D4AA]/10 border-[#00D4AA]/30" },
  CANCELLED:   { label: "İptal",         color: "text-red-400 bg-red-400/10 border-red-400/30" },
};

const CANCELLABLE_ORDER = ["PENDING", "CONFIRMED", "PREPARING"];

// ─── Tipler ──────────────────────────────────────────────────────────────────

type OrderItem = { id: string; quantity: number; price: number; product: { name: string; images: string[] } };
type Order = { id: string; status: string; paymentStatus: string; totalAmount: number; createdAt: string; updatedAt: string; notes: string | null; items: OrderItem[]; cargoProvider: string | null; trackingNumber: string | null };

const CARGO_NAMES: Record<string, string> = {
  YURTICI:  "Yurtiçi Kargo",
  HEPSIJET: "HepsiJet",
};
const CARGO_TRACKING_URLS: Record<string, string> = {
  YURTICI:  "https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgulama?code=",
  HEPSIJET: "https://www.hepsijet.com/gonderi-takip?trackingNumber=",
};
type SR    = { id: string; type: string; status: string; title: string; description: string; files: string[]; specs: Record<string, unknown> | null; price: number | null; notes: string | null; adminNotes: string | null; createdAt: string; updatedAt: string };

// ─── Ürün Sipariş Kartı ───────────────────────────────────────────────────────

function OrderStepper({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 py-3">
        <XCircle size={14} className="text-red-400 flex-shrink-0" />
        <span className="text-red-400 text-xs font-medium">Sipariş iptal edildi</span>
      </div>
    );
  }
  const currentIdx = STEP_ORDER.indexOf(status);
  return (
    <div className="flex items-center gap-0 py-3 overflow-x-auto">
      {ORDER_STEPS.map((step, idx) => {
        const Icon     = step.icon;
        const done     = idx < currentIdx;
        const active   = idx === currentIdx;
        const isLast   = idx === ORDER_STEPS.length - 1;
        return (
          <div key={step.status} className="flex items-center min-w-0">
            {/* Adım */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                done    ? "bg-[#00D4AA]/20 text-[#00D4AA] border border-[#00D4AA]/40" :
                active  ? "bg-[#FF6B35] text-white shadow-[0_0_12px_rgba(255,107,53,0.5)]" :
                          "bg-white/5 text-white/20 border border-white/10"
              }`}>
                {done ? <CheckCircle2 size={14} /> : <Icon size={13} />}
              </div>
              <span className={`text-[9px] font-medium text-center leading-tight max-w-[56px] ${
                done ? "text-[#00D4AA]/70" : active ? "text-[#FF6B35]" : "text-white/20"
              }`}>
                {step.label}
              </span>
            </div>
            {/* Bağlantı çizgisi */}
            {!isLast && (
              <div className={`h-[2px] w-8 mx-1 flex-shrink-0 rounded-full mb-4 transition-all ${
                idx < currentIdx ? "bg-[#00D4AA]/40" : "bg-white/8"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order, onCancel }: { order: Order; onCancel: (id: string) => Promise<void> }) {
  const [open, setOpen]             = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirm, setConfirm]       = useState(false);
  const status    = ORDER_STATUS[order.status] ?? ORDER_STATUS.PENDING;
  const canCancel = CANCELLABLE_ORDER.includes(order.status);

  async function handleCancel() {
    if (!confirm) { setConfirm(true); return; }
    setCancelling(true); setConfirm(false);
    try { await onCancel(order.id); } finally { setCancelling(false); }
  }

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${open ? "border-white/20 bg-white/[0.03]" : "border-white/10 bg-white/[0.02]"}`}>
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${status.color}`}>{status.label}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
              order.paymentStatus === "PAID"     ? "text-[#00D4AA] bg-[#00D4AA]/10 border-[#00D4AA]/30" :
              order.paymentStatus === "FAILED"   ? "text-red-400 bg-red-400/10 border-red-400/30" :
              order.paymentStatus === "REFUNDED" ? "text-blue-400 bg-blue-400/10 border-blue-400/30" :
                                                   "text-white/30 bg-white/5 border-white/10"
            }`}>
              {order.paymentStatus === "PAID" ? "Ödendi" : order.paymentStatus === "FAILED" ? "Ödeme Hatalı" : order.paymentStatus === "REFUNDED" ? "İade" : "Ödeme Bekliyor"}
            </span>
          </div>
          <p className="text-white font-medium text-sm">Sipariş #{order.id.slice(-8).toUpperCase()}</p>
          <p className="text-white/30 text-xs">{new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-white font-bold text-sm">{formatPrice(order.totalAmount)}</span>
          <button onClick={() => setOpen(v => !v)} className="text-white/30 hover:text-white transition-colors p-1">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Sipariş takip adımları — her zaman görünür */}
      <div className="px-5 pb-3 border-t border-white/5">
        <OrderStepper status={order.status} />
      </div>

      {open && (
        <div className="border-t border-white/5 px-5 py-4 space-y-4">
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-white/60">{item.product.name} <span className="text-white/30">×{item.quantity}</span></span>
                <span className="text-white/80">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 border-t border-white/5">
              <span className="text-white/40">Toplam</span>
              <span className="text-white font-bold">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
          {order.notes && <div className="p-3 bg-white/5 rounded-xl"><p className="text-[11px] text-white/30 mb-1">Not</p><p className="text-white/60 text-sm">{order.notes}</p></div>}

          {/* Kargo takip bilgisi */}
          {order.trackingNumber && order.cargoProvider && (
            <div className="p-3 bg-purple-400/[0.06] border border-purple-400/20 rounded-xl">
              <p className="text-[11px] text-purple-300/60 uppercase tracking-wide mb-2">Kargo Takip</p>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white/50 text-xs">{CARGO_NAMES[order.cargoProvider] ?? order.cargoProvider}</p>
                  <p className="text-purple-200 font-mono text-sm font-semibold">{order.trackingNumber}</p>
                </div>
                <a
                  href={`${CARGO_TRACKING_URLS[order.cargoProvider] ?? "#"}${order.trackingNumber}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-purple-400/15 hover:bg-purple-400/25 border border-purple-400/30 text-purple-200 px-3 py-2 rounded-xl transition-colors flex-shrink-0"
                >
                  <Truck size={13} /> Kargoyu Takip Et <ExternalLink size={11} />
                </a>
              </div>
            </div>
          )}

          {canCancel && (
            <div className="pt-1">
              {confirm ? (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl">
                  <p className="flex-1 text-red-300 text-xs">Siparişi iptal etmek istediğinizden emin misiniz?</p>
                  <button onClick={handleCancel} disabled={cancelling} className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                    {cancelling ? "İptal ediliyor..." : "Evet, İptal Et"}
                  </button>
                  <button onClick={() => setConfirm(false)} className="text-xs text-white/40 hover:text-white px-2 py-1.5 transition-colors">Vazgeç</button>
                </div>
              ) : (
                <button onClick={handleCancel} disabled={cancelling}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 px-3 py-2 rounded-xl transition-all disabled:opacity-50">
                  <XCircle size={13} /> Siparişi İptal Et
                </button>
              )}
              <p className="text-[10px] text-white/20 mt-1.5">* Kargoya verilen siparişler iptal edilemez</p>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-white/5">
            <span className="text-[11px] text-white/20 font-mono">#{order.id.slice(-8).toUpperCase()}</span>
            <span className="text-[11px] text-white/20">Güncellendi: {new Date(order.updatedAt).toLocaleDateString("tr-TR")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Baskı / Tarama Kartı ─────────────────────────────────────────────────────

function SRCard({ sr, onRespond }: { sr: SR; onRespond: (id: string, action: "approve" | "reject") => Promise<void> }) {
  const [open,    setOpen]    = useState(sr.status === "QUOTED");
  const [loading, setLoading] = useState(false);
  const status   = SR_STATUS[sr.status] ?? SR_STATUS.PENDING;
  const isQuoted = sr.status === "QUOTED";

  async function handle(action: "approve" | "reject") {
    setLoading(true);
    try { await onRespond(sr.id, action); } finally { setLoading(false); }
  }

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${isQuoted ? "border-purple-400/40 bg-purple-400/[0.04]" : "border-white/10 bg-white/[0.02]"} ${loading ? "opacity-60 pointer-events-none" : ""}`}>
      {isQuoted && (
        <div className="bg-purple-400/10 border-b border-purple-400/20 px-5 py-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <p className="text-purple-300 text-xs font-medium">Fiyat teklifi hazır — onayınızı bekliyoruz</p>
        </div>
      )}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="mb-0.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${status.color}`}>{status.label}</span>
          </div>
          <p className="text-white font-medium text-sm truncate">{sr.title}</p>
          <p className="text-white/30 text-xs">{new Date(sr.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {sr.price !== null && <span className={`font-bold text-sm ${isQuoted ? "text-purple-300" : "text-[#FF6B35]"}`}>{formatPrice(sr.price)}</span>}
          <button onClick={() => setOpen(v => !v)} className="text-white/30 hover:text-white transition-colors p-1">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/5 px-5 py-4 space-y-4">
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">Açıklama</p>
            <p className="text-white/60 text-sm leading-relaxed">{sr.description}</p>
          </div>
          {sr.specs && Object.keys(sr.specs).length > 0 && (
            <div>
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">Özellikler</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(sr.specs).map(([k, v]) => (
                  <div key={k} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                    <span className="text-[10px] text-white/30">{k}: </span>
                    <span className="text-white/70 text-xs font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {sr.adminNotes && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">Yetkili Notu</p>
              <p className="text-white/70 text-sm">{sr.adminNotes}</p>
            </div>
          )}
          {isQuoted && sr.price !== null && (
            <div className="bg-purple-400/[0.06] border border-purple-400/25 rounded-2xl p-4 space-y-3">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-0.5">Fiyat Teklifi</p>
                <p className="text-2xl font-black text-purple-300">{formatPrice(sr.price)}</p>
              </div>
              <p className="text-white/40 text-xs">Fiyatı onaylarsanız talebiniz işleme alınır. Reddederseniz talep iptal edilir.</p>
              <div className="flex gap-2">
                <button onClick={() => handle("approve")} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#00D4AA] hover:bg-[#00bfa0] text-black font-bold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  <CheckCircle2 size={16} /> Onayla
                </button>
                <button onClick={() => handle("reject")} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-semibold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  <XCircle size={16} /> Reddet
                </button>
              </div>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-white/5">
            <span className="text-[11px] text-white/20 font-mono">#{sr.id.slice(-8).toUpperCase()}</span>
            <span className="text-[11px] text-white/20">Güncellendi: {new Date(sr.updatedAt).toLocaleDateString("tr-TR")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ana Component ────────────────────────────────────────────────────────────

export default function OrdersClient({ initialOrders, initialPrint, initialScan }: {
  initialOrders: Order[];
  initialPrint:  SR[];
  initialScan:   SR[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [print,  setPrint]  = useState<SR[]>(initialPrint);
  const [scan,   setScan]   = useState<SR[]>(initialScan);
  const [tab, setTab]       = useState<"orders" | "print" | "scan">(() => {
    const hasQuotedPrint = initialPrint.some(r => r.status === "QUOTED");
    const hasQuotedScan  = initialScan.some(r  => r.status === "QUOTED");
    if (hasQuotedPrint) return "print";
    if (hasQuotedScan)  return "scan";
    return "orders";
  });

  const quotedPrint = print.filter(r => r.status === "QUOTED").length;
  const quotedScan  = scan.filter(r  => r.status === "QUOTED").length;

  const sortedPrint = useMemo(() => [...print].sort((a, b) => {
    if (a.status === "QUOTED" && b.status !== "QUOTED") return -1;
    if (a.status !== "QUOTED" && b.status === "QUOTED") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }), [print]);

  const sortedScan = useMemo(() => [...scan].sort((a, b) => {
    if (a.status === "QUOTED" && b.status !== "QUOTED") return -1;
    if (a.status !== "QUOTED" && b.status === "QUOTED") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }), [scan]);

  async function handleCancel(id: string) {
    const res  = await fetch(`/api/orders/${id}/cancel`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { toast.error(data?.error ?? "Hata"); throw new Error(data?.error); }
    setOrders(prev => prev.map(o => o.id !== id ? o : { ...o, status: "CANCELLED", updatedAt: data.updatedAt ?? o.updatedAt }));
    toast.success("Siparişiniz iptal edildi.");
  }

  async function handleRespond(id: string, action: "approve" | "reject", setter: typeof setPrint) {
    const res  = await fetch(`/api/services/${id}/respond`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const data = await res.json();
    if (!res.ok) { toast.error(data?.error ?? "Hata"); throw new Error(data?.error); }
    setter(prev => prev.map(r => r.id !== id ? r : { ...r, status: data.status ?? r.status, updatedAt: data.updatedAt ?? r.updatedAt }));
    toast[action === "approve" ? "success" : "message"](action === "approve" ? "Fiyat onaylandı! İşleme alındı." : "Talep iptal edildi.");
  }

  const TABS = [
    { key: "orders", label: "Ürün Siparişleri", icon: ShoppingCart, badge: 0,           activeCls: "border-white/20 bg-white/[0.06] text-white",          emptyHref: "/shop",             emptyLabel: "Alışverişe Başla" },
    { key: "print",  label: "3D Baskı",          icon: Zap,          badge: quotedPrint, activeCls: "border-[#FF6B35]/50 bg-[#FF6B35]/10 text-[#FF6B35]", emptyHref: "/services/print",   emptyLabel: "3D Baskı Talebi" },
    { key: "scan",   label: "3D Tarama",          icon: Scan,         badge: quotedScan,  activeCls: "border-[#00D4AA]/50 bg-[#00D4AA]/10 text-[#00D4AA]", emptyHref: "/services/scanning", emptyLabel: "Tarama Talebi" },
  ] as const;

  return (
    <div>
      {/* Sekmeler */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-0">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-t border-x text-sm font-medium transition-all -mb-px ${
                isActive ? `${t.activeCls} border-white/15` : "border-transparent text-white/40 hover:text-white/70"
              }`}>
              <Icon size={14} className={isActive ? "" : "opacity-60"} />
              {t.label}
              {t.badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-400/20 text-purple-300">{t.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Ürün Siparişleri */}
      {tab === "orders" && (
        orders.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/40 mb-4">Henüz sipariş vermediniz</p>
            <Link href="/shop" className="inline-flex px-6 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-semibold">Alışverişe Başla</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(o => <OrderCard key={o.id} order={o} onCancel={handleCancel} />)}
          </div>
        )
      )}

      {/* 3D Baskı */}
      {tab === "print" && (
        sortedPrint.length === 0 ? (
          <div className="text-center py-16">
            <Zap size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/40 mb-4">Henüz 3D baskı talebiniz yok</p>
            <Link href="/services/print" className="inline-flex px-6 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-semibold">3D Baskı Talebi Oluştur</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPrint.map(r => <SRCard key={r.id} sr={r} onRespond={(id, a) => handleRespond(id, a, setPrint)} />)}
          </div>
        )
      )}

      {/* 3D Tarama */}
      {tab === "scan" && (
        sortedScan.length === 0 ? (
          <div className="text-center py-16">
            <Scan size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/40 mb-4">Henüz 3D tarama talebiniz yok</p>
            <Link href="/services/scanning" className="inline-flex px-6 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-semibold">Tarama Talebi Oluştur</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedScan.map(r => <SRCard key={r.id} sr={r} onRespond={(id, a) => handleRespond(id, a, setScan)} />)}
          </div>
        )
      )}
    </div>
  );
}
