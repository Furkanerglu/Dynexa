"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { ChevronDown, ChevronUp, Check, ShoppingCart, Zap, Scan } from "lucide-react";

// ─── Tipler ──────────────────────────────────────────────────────────────────

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: { name: string | null; email: string };
  items: { product: { name: string }; quantity: number }[];
};

type SR = {
  id: string; type: string; status: string; title: string; description: string;
  files: string[]; specs: Record<string, unknown> | null;
  price: number | null; notes: string | null; adminNotes: string | null;
  createdAt: string; updatedAt: string;
  user: { name: string | null; email: string };
};

// ─── Sabitler ────────────────────────────────────────────────────────────────

const ORDER_STATUSES = [
  { value: "PENDING",   label: "Beklemede",      badge: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/30" },
  { value: "CONFIRMED", label: "Onaylandı",       badge: "text-blue-400 bg-blue-400/10 border border-blue-400/30" },
  { value: "PREPARING", label: "Hazırlanıyor",    badge: "text-[#FF6B35] bg-[#FF6B35]/10 border border-[#FF6B35]/30" },
  { value: "SHIPPED",   label: "Kargoya Verildi", badge: "text-purple-400 bg-purple-400/10 border border-purple-400/30" },
  { value: "DELIVERED", label: "Teslim Edildi",   badge: "text-[#00D4AA] bg-[#00D4AA]/10 border border-[#00D4AA]/30" },
  { value: "CANCELLED", label: "İptal Edildi",    badge: "text-red-400 bg-red-400/10 border border-red-400/30" },
];

const SR_STATUSES = [
  { value: "PENDING",     label: "Beklemede",      cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  { value: "REVIEWING",   label: "İnceleniyor",    cls: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  { value: "QUOTED",      label: "Fiyat Verildi",  cls: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  { value: "CONFIRMED",   label: "Onaylandı",      cls: "text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/30" },
  { value: "IN_PROGRESS", label: "İşlemde",        cls: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  { value: "COMPLETED",   label: "Tamamlandı",     cls: "text-[#00D4AA] bg-[#00D4AA]/10 border-[#00D4AA]/30" },
  { value: "CANCELLED",   label: "İptal",          cls: "text-red-400 bg-red-400/10 border-red-400/30" },
];

const ACTIVE_SR = ["PENDING", "REVIEWING", "QUOTED", "CONFIRMED", "IN_PROGRESS"];

function getOrderStatus(v: string) { return ORDER_STATUSES.find(s => s.value === v) ?? ORDER_STATUSES[0]; }
function getSRStatus(v: string)    { return SR_STATUSES.find(s => s.value === v)    ?? SR_STATUSES[0]; }

// ─── Ürün Sipariş: Durum Dropdown ────────────────────────────────────────────

function OrderStatusDropdown({ orderId, currentStatus, loading, onUpdate }: {
  orderId: string; currentStatus: string; loading: boolean;
  onUpdate: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = getOrderStatus(currentStatus);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" disabled={loading} onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all select-none whitespace-nowrap ${meta.badge} ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:brightness-125 active:scale-95"}`}>
        {meta.label}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-44 bg-[#111] border border-white/10 rounded-xl shadow-xl overflow-hidden">
          {ORDER_STATUSES.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => { setOpen(false); if (opt.value !== currentStatus) onUpdate(orderId, opt.value); }}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/5 ${opt.value === currentStatus ? "opacity-50 cursor-default" : "cursor-pointer"}`}>
              <span className={`flex-1 px-2 py-0.5 rounded-full inline-block ${opt.badge}`}>{opt.label}</span>
              {opt.value === currentStatus && <Check size={10} className="text-white/30" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Servis Sipariş: Durum Dropdown ──────────────────────────────────────────

function SRStatusPicker({ id, status, onSave }: { id: string; status: string; onSave: (id: string, val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = getSRStatus(status);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border cursor-pointer hover:brightness-125 active:scale-95 transition-all whitespace-nowrap ${cur.cls}`}>
        {cur.label}
        <ChevronDown size={11} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      {open && (
        <div className="absolute z-[100] left-0 top-[calc(100%+4px)] w-44 bg-[#0f0f0f] border border-white/15 rounded-xl shadow-2xl overflow-hidden">
          {SR_STATUSES.map(opt => (
            <button key={opt.value} onClick={() => { setOpen(false); if (opt.value !== status) onSave(id, opt.value); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left">
              <span className={`flex-1 px-2 py-0.5 rounded-full text-xs border ${opt.cls}`}>{opt.label}</span>
              {opt.value === status && <Check size={11} className="text-white/30 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Servis Sipariş Kartı ─────────────────────────────────────────────────────

function SRCard({ sr, onUpdate }: { sr: SR; onUpdate: (id: string, patch: object) => Promise<void> }) {
  const [open, setOpen]             = useState(false);
  const [saving, setSaving]         = useState(false);
  const [priceInput, setPriceInput] = useState(sr.price != null ? String(sr.price) : "");
  const [noteInput, setNoteInput]   = useState(sr.adminNotes ?? "");
  const st = getSRStatus(sr.status);

  async function changeStatus(id: string, val: string) { setSaving(true); await onUpdate(id, { status: val }); setSaving(false); }

  async function savePrice() {
    const n = parseFloat(priceInput.replace(",", "."));
    if (isNaN(n) || n < 0) { toast.error("Geçersiz fiyat"); return; }
    setSaving(true);
    const patch: Record<string, unknown> = { price: n };
    if (sr.status === "REVIEWING") patch.status = "QUOTED";
    await onUpdate(sr.id, patch);
    setSaving(false);
  }

  async function saveNote() { setSaving(true); await onUpdate(sr.id, { adminNotes: noteInput.trim() || null }); setSaving(false); }

  return (
    <div className={`border rounded-2xl overflow-visible transition-all ${open ? "border-white/20 bg-white/[0.04]" : "border-white/10 bg-white/[0.02]"} ${saving ? "opacity-60 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="mb-0.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
          </div>
          <p className="text-white font-medium text-sm truncate">{sr.title}</p>
          <p className="text-white/35 text-xs">{sr.user.name ?? "—"} · {sr.user.email} · {new Date(sr.createdAt).toLocaleDateString("tr-TR")}</p>
        </div>
        <div className="text-right flex-shrink-0">
          {sr.price != null ? <p className="text-[#FF6B35] font-bold text-sm">{formatPrice(sr.price)}</p> : <p className="text-white/25 text-xs">Fiyat yok</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SRStatusPicker id={sr.id} status={sr.status} onSave={changeStatus} />
          <button onClick={() => setOpen(v => !v)} className="text-white/30 hover:text-white transition-colors p-1">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/5 px-5 py-4 space-y-5">
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">Açıklama</p>
            <p className="text-white/65 text-sm leading-relaxed">{sr.description}</p>
          </div>

          {sr.specs && Object.keys(sr.specs).length > 0 && (
            <div>
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">Teknik Özellikler</p>
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

          {sr.files.length > 0 && (
            <div>
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">Dosyalar</p>
              <div className="flex flex-wrap gap-2">
                {sr.files.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    className="text-xs text-[#FF6B35] bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-2.5 py-1 rounded-lg hover:underline">
                    Dosya {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {sr.notes && (
            <div>
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">Müşteri Notu</p>
              <p className="text-white/55 text-sm italic">"{sr.notes}"</p>
            </div>
          )}

          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">Fiyat Teklifi</p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm select-none">₺</span>
                <input type="number" min="0" step="0.01" value={priceInput} onChange={e => setPriceInput(e.target.value)} placeholder="0.00"
                  className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white text-sm w-40 focus:outline-none focus:border-[#FF6B35]/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <button onClick={savePrice} disabled={saving}
                className="bg-[#FF6B35] hover:bg-[#e55a28] text-white text-xs px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
                {sr.status === "REVIEWING" ? "Fiyat Ver (QUOTED'a geç)" : "Kaydet"}
              </button>
            </div>
          </div>

          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">Admin Notu</p>
            <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)} rows={3}
              placeholder="Müşteriye iletmek istediğiniz not..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#FF6B35]/60 placeholder:text-white/20" />
            <button onClick={saveNote} disabled={saving}
              className="mt-2 bg-white/10 hover:bg-white/15 text-white text-xs px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
              Notu Kaydet
            </button>
          </div>

          <div className="flex justify-between pt-2 border-t border-white/5">
            <span className="text-[11px] text-white/20 font-mono">#{sr.id.slice(-8).toUpperCase()}</span>
            <span className="text-[11px] text-white/20">Güncellendi: {new Date(sr.updatedAt).toLocaleDateString("tr-TR")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ürün Siparişleri Tablosu ─────────────────────────────────────────────────

function ProductOrdersTab({ orders, onUpdateStatus }: {
  orders: Order[];
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function updateStatus(orderId: string, newStatus: string) {
    setLoadingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.error ?? "Güncelleme başarısız"); }
      onUpdateStatus(orderId, newStatus);
      toast.success("Durum güncellendi.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoadingId(null);
    }
  }

  if (orders.length === 0) return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 text-center">
      <p className="text-white/40">Henüz ürün siparişi yok.</p>
    </div>
  );

  return (
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
          {orders.map(order => (
            <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 text-white/70 text-sm font-mono">#{order.id.slice(-8).toUpperCase()}</td>
              <td className="px-4 py-3">
                <p className="text-white text-sm">{order.user.name ?? "—"}</p>
                <p className="text-white/30 text-xs">{order.user.email}</p>
              </td>
              <td className="px-4 py-3 max-w-[200px]">
                <p className="text-white/60 text-xs truncate">
                  {order.items.map(i => `${i.product.name} ×${i.quantity}`).join(", ")}
                </p>
              </td>
              <td className="px-4 py-3 text-white text-sm font-medium whitespace-nowrap">{formatPrice(Number(order.totalAmount))}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  order.paymentStatus === "PAID"     ? "bg-[#00D4AA]/10 text-[#00D4AA]" :
                  order.paymentStatus === "FAILED"   ? "bg-red-500/10 text-red-400"     :
                  order.paymentStatus === "REFUNDED" ? "bg-blue-500/10 text-blue-400"   :
                                                       "bg-white/10 text-white/40"
                }`}>
                  {order.paymentStatus === "PAID" ? "Ödendi" : order.paymentStatus === "FAILED" ? "Başarısız" : order.paymentStatus === "REFUNDED" ? "İade" : "Bekliyor"}
                </span>
              </td>
              <td className="px-4 py-3">
                <OrderStatusDropdown orderId={order.id} currentStatus={order.status} loading={loadingId === order.id} onUpdate={updateStatus} />
              </td>
              <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">
                {new Date(order.createdAt).toLocaleDateString("tr-TR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Servis Sipariş Listesi (Print / Scanning) ────────────────────────────────

function SRTab({ items, onUpdate }: { items: SR[]; onUpdate: (id: string, patch: object) => Promise<void> }) {
  const [showDone,     setShowDone]     = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const active = items.filter(r => ACTIVE_SR.includes(r.status));
  const done   = items.filter(r => !ACTIVE_SR.includes(r.status));

  const filtered = useMemo(() => items.filter(r => {
    if (!showDone && !ACTIVE_SR.includes(r.status)) return false;
    if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
    return true;
  }), [items, showDone, filterStatus]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <p className="text-white/40 text-xs mr-2">
          <span className="text-[#FF6B35] font-semibold">{active.length}</span> aktif ·{" "}
          <span className="text-white/25">{done.length}</span> tamamlandı/iptal
        </p>
        <button onClick={() => setShowDone(v => !v)}
          className={`text-xs px-3 py-1 rounded-full border transition-all ${showDone ? "border-[#00D4AA]/40 bg-[#00D4AA]/10 text-[#00D4AA]" : "border-white/15 bg-white/5 text-white/40 hover:text-white"}`}>
          {showDone ? "Tümü" : "Sadece Aktifler"}
        </button>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-white/60 text-xs focus:outline-none">
          <option value="ALL" className="bg-[#111]">Tüm Durumlar</option>
          {SR_STATUSES.map(s => <option key={s.value} value={s.value} className="bg-[#111]">{s.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-10 text-center">
          <p className="text-white/30 text-sm">Gösterilecek kayıt yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sr => <SRCard key={sr.id} sr={sr} onUpdate={onUpdate} />)}
        </div>
      )}
    </div>
  );
}

// ─── Ana Component ────────────────────────────────────────────────────────────

export default function AdminOrdersClient({
  initialOrders,
  initialPrint,
  initialScan,
}: {
  initialOrders: Order[];
  initialPrint:  SR[];
  initialScan:   SR[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [print,  setPrint]  = useState<SR[]>(initialPrint);
  const [scan,   setScan]   = useState<SR[]>(initialScan);
  const [tab,    setTab]    = useState<"orders" | "print" | "scan">("orders");

  const activePrint = print.filter(r => ACTIVE_SR.includes(r.status)).length;
  const activeScan  = scan.filter(r =>  ACTIVE_SR.includes(r.status)).length;

  function updateOrderStatus(id: string, status: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }

  async function handleSRUpdate(id: string, patch: object, setter: typeof setPrint): Promise<void> {
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setter(prev => prev.map(r => r.id !== id ? r : {
        ...r,
        status:     data.status     ?? r.status,
        price:      data.price != null ? Number(data.price) : r.price,
        adminNotes: data.adminNotes !== undefined ? data.adminNotes : r.adminNotes,
        updatedAt:  data.updatedAt  ?? r.updatedAt,
      }));
      toast.success("Kaydedildi.");
    } catch (err: unknown) {
      toast.error(`Hata: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  const TABS = [
    { key: "orders", label: "Ürün Siparişleri", icon: ShoppingCart, badge: null,        activeCls: "border-white/20 bg-white/[0.06] text-white" },
    { key: "print",  label: "3D Baskı",          icon: Zap,          badge: activePrint, activeCls: "border-[#FF6B35]/50 bg-[#FF6B35]/10 text-[#FF6B35]" },
    { key: "scan",   label: "3D Tarama",          icon: Scan,         badge: activeScan,  activeCls: "border-[#00D4AA]/50 bg-[#00D4AA]/10 text-[#00D4AA]" },
  ] as const;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Siparişler</h1>
      </div>

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
              <Icon size={15} className={isActive ? "" : "opacity-60"} />
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/15" : "bg-white/10 text-white/50"}`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "orders" && <ProductOrdersTab orders={orders} onUpdateStatus={updateOrderStatus} />}
      {tab === "print"  && <SRTab items={print} onUpdate={(id, p) => handleSRUpdate(id, p, setPrint)} />}
      {tab === "scan"   && <SRTab items={scan}  onUpdate={(id, p) => handleSRUpdate(id, p, setScan)}  />}
    </div>
  );
}
