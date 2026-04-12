"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { ChevronDown, ChevronUp, Check, X, Zap, Wrench, Scan } from "lucide-react";

// ─── Sabitler ───────────────────────────────────────────────────────────────���

const STATUS_LIST = [
  { value: "PENDING",     label: "Beklemede",      cls: "text-yellow-400  bg-yellow-400/10  border-yellow-400/30"  },
  { value: "REVIEWING",   label: "İnceleniyor",    cls: "text-blue-400    bg-blue-400/10    border-blue-400/30"    },
  { value: "QUOTED",      label: "Fiyat Verildi",  cls: "text-purple-400  bg-purple-400/10  border-purple-400/30"  },
  { value: "CONFIRMED",   label: "Onaylandı",      cls: "text-[#FF6B35]   bg-[#FF6B35]/10   border-[#FF6B35]/30"   },
  { value: "IN_PROGRESS", label: "İşlemde",        cls: "text-orange-400  bg-orange-400/10  border-orange-400/30"  },
  { value: "COMPLETED",   label: "Tamamlandı",     cls: "text-[#00D4AA]   bg-[#00D4AA]/10   border-[#00D4AA]/30"   },
  { value: "CANCELLED",   label: "İptal",          cls: "text-red-400     bg-red-400/10     border-red-400/30"     },
];

const TABS = [
  { type: "PRINT",     label: "3D Baskı",      icon: Zap,    color: "text-[#FF6B35]",   activeBg: "border-[#FF6B35]/50 bg-[#FF6B35]/10 text-[#FF6B35]"  },
  { type: "TECHNICAL", label: "Teknik Servis", icon: Wrench, color: "text-blue-400",    activeBg: "border-blue-400/50  bg-blue-400/10  text-blue-400"    },
  { type: "SCANNING",  label: "3D Tarama",     icon: Scan,   color: "text-[#00D4AA]",   activeBg: "border-[#00D4AA]/50 bg-[#00D4AA]/10 text-[#00D4AA]"   },
];

const ACTIVE_STATUSES = ["PENDING", "REVIEWING", "QUOTED", "CONFIRMED", "IN_PROGRESS"];

function getStatus(v: string) { return STATUS_LIST.find(s => s.value === v) ?? STATUS_LIST[0]; }

type SR = {
  id: string; type: string; status: string; title: string; description: string;
  files: string[]; specs: Record<string, unknown> | null;
  price: number | null; notes: string | null; adminNotes: string | null;
  createdAt: string; updatedAt: string;
  user: { name: string | null; email: string };
};

// ─── Durum Dropdown ───────────────────────────────────────────────────────────

function StatusPicker({ id, status, onSave }: { id: string; status: string; onSave: (id: string, val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = getStatus(status);

  useEffect(() => {
    function out(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
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
          {STATUS_LIST.map(opt => (
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

// ─── Servis Kartı ─────────────────────────────────────────────────────────────

function ServiceCard({ sr, onUpdate }: { sr: SR; onUpdate: (id: string, patch: object) => Promise<void> }) {
  const [open, setOpen]             = useState(false);
  const [saving, setSaving]         = useState(false);
  const [priceInput, setPriceInput] = useState(sr.price != null ? String(sr.price) : "");
  const [noteInput, setNoteInput]   = useState(sr.adminNotes ?? "");
  const st = getStatus(sr.status);

  async function changeStatus(id: string, val: string) {
    setSaving(true);
    await onUpdate(id, { status: val });
    setSaving(false);
  }

  async function savePrice() {
    const n = parseFloat(priceInput.replace(",", "."));
    if (isNaN(n) || n < 0) { toast.error("Geçersiz fiyat"); return; }
    setSaving(true);
    const patch: Record<string, unknown> = { price: n };
    if (sr.status === "REVIEWING") patch.status = "QUOTED";
    await onUpdate(sr.id, patch);
    setSaving(false);
  }

  async function saveNote() {
    setSaving(true);
    await onUpdate(sr.id, { adminNotes: noteInput.trim() || null });
    setSaving(false);
  }

  return (
    <div className={`border rounded-2xl overflow-visible transition-all ${open ? "border-white/20 bg-white/[0.04]" : "border-white/10 bg-white/[0.02]"} ${saving ? "opacity-60 pointer-events-none" : ""}`}>

      {/* Başlık satırı */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
          </div>
          <p className="text-white font-medium text-sm truncate">{sr.title}</p>
          <p className="text-white/35 text-xs">{sr.user.name ?? "—"} · {sr.user.email} · {new Date(sr.createdAt).toLocaleDateString("tr-TR")}</p>
        </div>

        <div className="text-right flex-shrink-0">
          {sr.price != null
            ? <p className="text-[#FF6B35] font-bold text-sm">{formatPrice(sr.price)}</p>
            : <p className="text-white/25 text-xs">Fiyat yok</p>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusPicker id={sr.id} status={sr.status} onSave={changeStatus} />
          <button onClick={() => setOpen(v => !v)} className="text-white/30 hover:text-white transition-colors p-1">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Genişletilmiş panel */}
      {open && (
        <div className="border-t border-white/5 px-5 py-4 space-y-5">

          {/* Açıklama */}
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">Açıklama</p>
            <p className="text-white/65 text-sm leading-relaxed">{sr.description}</p>
          </div>

          {/* Specs */}
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

          {/* Dosyalar */}
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

          {/* Müşteri notu */}
          {sr.notes && (
            <div>
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">Müşteri Notu</p>
              <p className="text-white/55 text-sm italic">"{sr.notes}"</p>
            </div>
          )}

          {/* Fiyat Girişi */}
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">Fiyat Teklifi</p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm select-none">₺</span>
                <input type="number" min="0" step="0.01" value={priceInput} onChange={e => setPriceInput(e.target.value)}
                  placeholder="0.00"
                  className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white text-sm w-40 focus:outline-none focus:border-[#FF6B35]/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <button onClick={savePrice} disabled={saving}
                className="bg-[#FF6B35] hover:bg-[#e55a28] text-white text-xs px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
                {sr.status === "REVIEWING" ? "Fiyat Ver (QUOTED'a geç)" : "Kaydet"}
              </button>
            </div>
          </div>

          {/* Admin Notu */}
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

          {/* Meta */}
          <div className="flex justify-between pt-2 border-t border-white/5">
            <span className="text-[11px] text-white/20 font-mono">#{sr.id.slice(-8).toUpperCase()}</span>
            <span className="text-[11px] text-white/20">Güncellendi: {new Date(sr.updatedAt).toLocaleDateString("tr-TR")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab İçeriği ──────────────────────────────────────────────────────────────

function TabContent({ items, onUpdate }: { items: SR[]; onUpdate: (id: string, patch: object) => Promise<void> }) {
  const [showDone,   setShowDone]   = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const active = items.filter(r => ACTIVE_STATUSES.includes(r.status));
  const done   = items.filter(r => !ACTIVE_STATUSES.includes(r.status));

  const filtered = useMemo(() => items.filter(r => {
    if (!showDone && !ACTIVE_STATUSES.includes(r.status)) return false;
    if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
    return true;
  }), [items, showDone, filterStatus]);

  return (
    <div>
      {/* Mini kontroller */}
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
          {STATUS_LIST.map(s => <option key={s.value} value={s.value} className="bg-[#111]">{s.label}</option>)}
        </select>
        {filterStatus !== "ALL" && (
          <button onClick={() => setFilterStatus("ALL")} className="flex items-center gap-1 text-xs text-white/30 hover:text-white">
            <X size={11} /> Temizle
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-10 text-center">
          <p className="text-white/30 text-sm">Gösterilecek talep yok.</p>
          {!showDone && active.length === 0 && done.length > 0 && (
            <button onClick={() => setShowDone(true)} className="text-white/25 text-xs mt-1 hover:text-white underline">
              Tamamlananları göster
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sr => <ServiceCard key={sr.id} sr={sr} onUpdate={onUpdate} />)}
        </div>
      )}
    </div>
  );
}

// ─── Ana Component ────────────────────────────────────────────────────────────

export default function AdminServicesClient({ initialRequests }: { initialRequests: SR[] }) {
  const [items,   setItems]   = useState<SR[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<"PRINT" | "TECHNICAL" | "SCANNING">("PRINT");

  const counts = {
    PRINT:     items.filter(r => r.type === "PRINT"     && ACTIVE_STATUSES.includes(r.status)).length,
    TECHNICAL: items.filter(r => r.type === "TECHNICAL" && ACTIVE_STATUSES.includes(r.status)).length,
    SCANNING:  items.filter(r => r.type === "SCANNING"  && ACTIVE_STATUSES.includes(r.status)).length,
  };

  const tabItems = useMemo(() => items.filter(r => r.type === activeTab), [items, activeTab]);

  async function handleUpdate(id: string, patch: object): Promise<void> {
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);

      setItems(prev => prev.map(r => r.id !== id ? r : {
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

  return (
    <div>
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Servis Talepleri</h1>
        <p className="text-white/40 text-sm mt-0.5">
          Toplam{" "}
          <span className="text-[#FF6B35] font-semibold">
            {counts.PRINT + counts.TECHNICAL + counts.SCANNING}
          </span>{" "}
          aktif talep
        </p>
      </div>

      {/* Sekme Navigasyonu */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-0">
        {TABS.map(tab => {
          const Icon    = tab.icon;
          const isActive = activeTab === tab.type;
          const count   = counts[tab.type as keyof typeof counts];
          return (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-t border-x text-sm font-medium transition-all -mb-px ${
                isActive
                  ? `${tab.activeBg} border-white/15`
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              <Icon size={15} className={isActive ? "" : "opacity-60"} />
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/15" : "bg-white/10 text-white/50"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab içeriği */}
      <TabContent key={activeTab} items={tabItems} onUpdate={handleUpdate} />
    </div>
  );
}
