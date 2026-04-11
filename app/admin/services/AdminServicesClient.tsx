"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import {
  ChevronDown, ChevronUp, Filter, X,
  FileText, Scan, Wrench, Clock, Check,
} from "lucide-react";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "PENDING",     label: "Beklemede",      badge: "text-yellow-400  bg-yellow-400/10  border border-yellow-400/30"  },
  { value: "REVIEWING",   label: "İnceleniyor",    badge: "text-blue-400    bg-blue-400/10    border border-blue-400/30"    },
  { value: "QUOTED",      label: "Fiyat Verildi",  badge: "text-purple-400  bg-purple-400/10  border border-purple-400/30"  },
  { value: "CONFIRMED",   label: "Onaylandı",      badge: "text-[#FF6B35]   bg-[#FF6B35]/10   border border-[#FF6B35]/30"   },
  { value: "IN_PROGRESS", label: "İşlemde",        badge: "text-orange-400  bg-orange-400/10  border border-orange-400/30"  },
  { value: "COMPLETED",   label: "Tamamlandı",     badge: "text-[#00D4AA]   bg-[#00D4AA]/10   border border-[#00D4AA]/30"   },
  { value: "CANCELLED",   label: "İptal Edildi",   badge: "text-red-400     bg-red-400/10     border border-red-400/30"     },
];

const TYPE_OPTIONS = [
  { value: "PRINT",     label: "3D Baskı",    Icon: FileText },
  { value: "SCANNING",  label: "3D Tarama",   Icon: Scan     },
  { value: "TECHNICAL", label: "Teknik Servis", Icon: Wrench  },
];

const ACTIVE_STATUSES = ["PENDING", "REVIEWING", "QUOTED", "CONFIRMED", "IN_PROGRESS"];
const DONE_STATUSES   = ["COMPLETED", "CANCELLED"];

function statusMeta(v: string) {
  return STATUS_OPTIONS.find((s) => s.value === v) ?? STATUS_OPTIONS[0];
}
function typeMeta(v: string) {
  return TYPE_OPTIONS.find((t) => t.value === v) ?? TYPE_OPTIONS[0];
}

// ─── Tipler ──────────────────────────────────────────────────────────────────

type ServiceRequest = {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  files: string[];
  specs: Record<string, unknown> | null;
  price: number | null;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; email: string };
};

// ─── Status Dropdown ─────────────────────────────────────────────────────────

function StatusDropdown({
  id, current, loading, onUpdate,
}: { id: string; current: string; loading: boolean; onUpdate: (id: string, status: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = statusMeta(current);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${meta.badge} ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:brightness-125 active:scale-95"}`}
      >
        {loading && <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
        {meta.label}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`}/>
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-44 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setOpen(false); if (opt.value !== current) onUpdate(id, opt.value); }}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 transition-colors hover:bg-white/5 ${opt.value === current ? "opacity-50 cursor-default" : "cursor-pointer"}`}
            >
              <span className={`flex-1 px-2 py-0.5 rounded-full text-xs ${opt.badge}`}>{opt.label}</span>
              {opt.value === current && <Check size={12} className="text-white/30" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Servis Kartı ─────────────────────────────────────────────────────────────

function ServiceCard({
  sr, loading, onUpdate,
}: { sr: ServiceRequest; loading: boolean; onUpdate: (id: string, patch: Partial<{ status: string; price: number | null; adminNotes: string | null }>) => void }) {
  const [expanded, setExpanded]   = useState(false);
  const [editPrice, setEditPrice] = useState(false);
  const [priceVal, setPriceVal]   = useState(sr.price != null ? String(sr.price) : "");
  const [noteVal, setNoteVal]     = useState(sr.adminNotes ?? "");
  const [noteEdit, setNoteEdit]   = useState(false);

  const typeMt = typeMeta(sr.type);
  const TypeIcon = typeMt.Icon;

  function savePrice() {
    const n = parseFloat(priceVal.replace(",", "."));
    if (isNaN(n) || n < 0) { toast.error("Geçersiz fiyat"); return; }
    onUpdate(sr.id, { price: n, status: sr.status === "REVIEWING" ? "QUOTED" : sr.status });
    setEditPrice(false);
  }

  function saveNote() {
    onUpdate(sr.id, { adminNotes: noteVal || null });
    setNoteEdit(false);
  }

  return (
    <div className={`bg-white/[0.03] border rounded-2xl overflow-hidden transition-all ${loading ? "opacity-60" : ""} ${expanded ? "border-white/20" : "border-white/10"}`}>
      {/* Kart başlığı */}
      <div className="flex items-start gap-4 p-5">
        {/* Tip ikonu */}
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <TypeIcon size={16} className="text-[#FF6B35]" />
        </div>

        {/* Bilgiler */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-white font-semibold text-sm truncate">{sr.title}</span>
            <span className="text-white/30 text-[11px] px-2 py-0.5 bg-white/5 rounded-full border border-white/10 flex-shrink-0">
              {typeMt.label}
            </span>
            {sr.status === "CANCELLED" && (
              <span className="text-[11px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full border border-red-400/20 flex-shrink-0">
                İptal Edildi
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs mb-2">
            {sr.user.name ?? "—"} ·{" "}
            <span className="text-white/25">{sr.user.email}</span> ·{" "}
            <Clock size={10} className="inline mb-0.5" />{" "}
            {new Date(sr.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
          <p className="text-white/55 text-sm line-clamp-2">{sr.description}</p>
        </div>

        {/* Sağ panel: durum + fiyat */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusDropdown id={sr.id} current={sr.status} loading={loading} onUpdate={(id, s) => onUpdate(id, { status: s })} />

          {sr.price != null ? (
            <button
              type="button"
              onClick={() => { setEditPrice(true); setExpanded(true); }}
              className="text-[#FF6B35] font-bold text-sm hover:underline"
            >
              {formatPrice(sr.price)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setEditPrice(true); setExpanded(true); }}
              className="text-xs text-white/30 hover:text-[#FF6B35] border border-dashed border-white/20 hover:border-[#FF6B35]/40 px-2.5 py-0.5 rounded-full transition-colors"
            >
              + Fiyat Gir
            </button>
          )}
        </div>

        {/* Genişlet/Daralt */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-white/30 hover:text-white transition-colors flex-shrink-0 mt-1"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Genişletilmiş detay */}
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-4">
          {/* Tam açıklama */}
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Açıklama</p>
            <p className="text-white/70 text-sm leading-relaxed">{sr.description}</p>
          </div>

          {/* Specs */}
          {sr.specs && Object.keys(sr.specs).length > 0 && (
            <div>
              <p className="text-[11px] text-white/30 uppercase tracking-wider mb-2">Teknik Özellikler</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(sr.specs).map(([k, v]) => (
                  <div key={k} className="bg-white/5 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-white/30 capitalize">{k}</p>
                    <p className="text-white/80 text-xs font-medium">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dosyalar */}
          {sr.files.length > 0 && (
            <div>
              <p className="text-[11px] text-white/30 uppercase tracking-wider mb-2">Yüklenen Dosyalar</p>
              <div className="flex flex-wrap gap-2">
                {sr.files.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#FF6B35] hover:underline bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-2.5 py-1 rounded-lg"
                  >
                    Dosya {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Müşteri notu */}
          {sr.notes && (
            <div>
              <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Müşteri Notu</p>
              <p className="text-white/60 text-sm italic">"{sr.notes}"</p>
            </div>
          )}

          {/* Fiyat girişi */}
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wider mb-2">Fiyat Teklifi</p>
            {editPrice ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₺</span>
                  <input
                    type="text"
                    value={priceVal}
                    onChange={(e) => setPriceVal(e.target.value)}
                    placeholder="0.00"
                    className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-white text-sm w-36 focus:outline-none focus:border-[#FF6B35]/50"
                    onKeyDown={(e) => { if (e.key === "Enter") savePrice(); if (e.key === "Escape") setEditPrice(false); }}
                    autoFocus
                  />
                </div>
                <button onClick={savePrice} className="text-xs bg-[#FF6B35] text-white px-3 py-1.5 rounded-lg hover:bg-[#e55a28] transition-colors">Kaydet</button>
                <button onClick={() => setEditPrice(false)} className="text-xs text-white/40 hover:text-white px-2 py-1.5 transition-colors">İptal</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className={sr.price != null ? "text-[#FF6B35] font-bold text-lg" : "text-white/30 text-sm"}>
                  {sr.price != null ? formatPrice(sr.price) : "Henüz fiyat girilmedi"}
                </span>
                <button
                  type="button"
                  onClick={() => setEditPrice(true)}
                  className="text-xs text-white/40 hover:text-[#FF6B35] border border-dashed border-white/20 hover:border-[#FF6B35]/40 px-2.5 py-0.5 rounded-full transition-colors"
                >
                  {sr.price != null ? "Değiştir" : "Fiyat Gir"}
                </button>
              </div>
            )}
          </div>

          {/* Admin notu */}
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wider mb-2">Admin Notu (müşteriye gönderilir)</p>
            {noteEdit ? (
              <div className="space-y-2">
                <textarea
                  value={noteVal}
                  onChange={(e) => setNoteVal(e.target.value)}
                  rows={3}
                  placeholder="Müşteriye iletilecek notunuzu yazın..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#FF6B35]/50"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={saveNote} className="text-xs bg-[#FF6B35] text-white px-3 py-1.5 rounded-lg hover:bg-[#e55a28] transition-colors">Kaydet</button>
                  <button onClick={() => { setNoteVal(sr.adminNotes ?? ""); setNoteEdit(false); }} className="text-xs text-white/40 hover:text-white px-2 py-1.5 transition-colors">İptal</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setNoteEdit(true)}
                className="min-h-[40px] bg-white/[0.03] border border-dashed border-white/10 hover:border-white/25 rounded-xl px-3 py-2 cursor-text transition-colors"
              >
                {sr.adminNotes
                  ? <p className="text-white/60 text-sm">{sr.adminNotes}</p>
                  : <p className="text-white/25 text-sm italic">Not eklemek için tıklayın...</p>
                }
              </div>
            )}
          </div>

          {/* Talep ID + Son güncelleme */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-[11px] text-white/20 font-mono">#{sr.id.slice(-8).toUpperCase()}</span>
            <span className="text-[11px] text-white/20">
              Güncellendi: {new Date(sr.updatedAt).toLocaleDateString("tr-TR")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

export default function AdminServicesClient({ initialRequests }: { initialRequests: ServiceRequest[] }) {
  const [requests, setRequests]       = useState<ServiceRequest[]>(initialRequests);
  const [loadingId, setLoadingId]     = useState<string | null>(null);
  const [showDone, setShowDone]       = useState(false);
  const [filterType, setFilterType]   = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filtre uygula
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const isDone = DONE_STATUSES.includes(r.status);
      if (!showDone && isDone) return false;
      if (filterType !== "ALL" && r.type !== filterType) return false;
      if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
      if (dateFrom) {
        const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
        if (new Date(r.createdAt) < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
        if (new Date(r.createdAt) > to) return false;
      }
      return true;
    });
  }, [requests, showDone, filterType, filterStatus, dateFrom, dateTo]);

  const activeCount = requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;
  const doneCount   = requests.filter((r) => DONE_STATUSES.includes(r.status)).length;

  function clearFilters() {
    setFilterType("ALL");
    setFilterStatus("ALL");
    setDateFrom("");
    setDateTo("");
  }

  const hasActiveFilters = filterType !== "ALL" || filterStatus !== "ALL" || dateFrom || dateTo;

  async function handleUpdate(
    id: string,
    patch: Partial<{ status: string; price: number | null; adminNotes: string | null }>
  ) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? "Güncelleme başarısız");
      }

      const updated = await res.json();
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: updated.status ?? r.status,
                price: updated.price != null ? Number(updated.price) : r.price,
                adminNotes: updated.adminNotes ?? r.adminNotes,
                updatedAt: updated.updatedAt ?? r.updatedAt,
              }
            : r
        )
      );

      if (patch.status)     toast.success("Durum güncellendi — müşteriye bildirim gönderildi.");
      else if (patch.price != null) toast.success("Fiyat kaydedildi.");
      else                  toast.success("Not kaydedildi.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      toast.error(`Güncelleme başarısız: ${msg}`);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      {/* Başlık + sayaçlar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Servis Talepleri</h1>
          <p className="text-white/40 text-sm mt-0.5">
            <span className="text-[#FF6B35] font-semibold">{activeCount}</span> aktif ·{" "}
            <span className="text-white/30">{doneCount}</span> tamamlandı/iptal
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tamamlananları göster/gizle */}
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${showDone ? "border-[#00D4AA]/40 bg-[#00D4AA]/10 text-[#00D4AA]" : "border-white/15 bg-white/5 text-white/50 hover:text-white"}`}
          >
            {showDone ? <><Check size={11} /> Tamamlananlar Gösteriliyor</> : <><Clock size={11} /> Sadece Aktifler</>}
          </button>

          {/* Filtrele */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${showFilters || hasActiveFilters ? "border-[#FF6B35]/40 bg-[#FF6B35]/10 text-[#FF6B35]" : "border-white/15 bg-white/5 text-white/50 hover:text-white"}`}
          >
            <Filter size={11} />
            Filtrele
            {hasActiveFilters && <span className="w-4 h-4 rounded-full bg-[#FF6B35] text-white text-[10px] flex items-center justify-center">!</span>}
          </button>
        </div>
      </div>

      {/* Filtre paneli */}
      {showFilters && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-5">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Tür */}
            <div className="flex-1 min-w-[140px]">
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5">Hizmet Türü</p>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#FF6B35]/40"
              >
                <option value="ALL" className="bg-[#111]">Tümü</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value} className="bg-[#111]">{t.label}</option>
                ))}
              </select>
            </div>

            {/* Durum */}
            <div className="flex-1 min-w-[140px]">
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5">Durum</p>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#FF6B35]/40"
              >
                <option value="ALL" className="bg-[#111]">Tümü</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#111]">{s.label}</option>
                ))}
              </select>
            </div>

            {/* Tarih Aralığı */}
            <div className="flex-1 min-w-[140px]">
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5">Başlangıç Tarihi</p>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#FF6B35]/40 [color-scheme:dark]"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5">Bitiş Tarihi</p>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#FF6B35]/40 [color-scheme:dark]"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                <X size={12} /> Temizle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-white/40 mb-2">Gösterilecek talep yok.</p>
          {!showDone && <p className="text-white/25 text-sm">Tamamlanmış/iptal talepleri görmek için "Sadece Aktifler" butonuna tıklayın.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sr) => (
            <ServiceCard
              key={sr.id}
              sr={sr}
              loading={loadingId === sr.id}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
