"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Wrench, Zap, Scan, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING:     { label: "Beklemede",      color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  REVIEWING:   { label: "İnceleniyor",    color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  QUOTED:      { label: "Fiyat Verildi",  color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  CONFIRMED:   { label: "Onaylandı",      color: "text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/30" },
  IN_PROGRESS: { label: "İşlemde",        color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  COMPLETED:   { label: "Tamamlandı",     color: "text-[#00D4AA] bg-[#00D4AA]/10 border-[#00D4AA]/30" },
  CANCELLED:   { label: "İptal",          color: "text-red-400 bg-red-400/10 border-red-400/30" },
};

const TABS = [
  {
    type:     "PRINT",
    label:    "3D Baskı",
    icon:     Zap,
    active:   "border-[#FF6B35]/50 bg-[#FF6B35]/10 text-[#FF6B35]",
    emptyHref: "/services/print",
    emptyLabel: "3D Baskı Talebi",
  },
  {
    type:     "TECHNICAL",
    label:    "Teknik Servis",
    icon:     Wrench,
    active:   "border-blue-400/50 bg-blue-400/10 text-blue-400",
    emptyHref: "/services/technical",
    emptyLabel: "Teknik Servis Talebi",
  },
  {
    type:     "SCANNING",
    label:    "3D Tarama",
    icon:     Scan,
    active:   "border-[#00D4AA]/50 bg-[#00D4AA]/10 text-[#00D4AA]",
    emptyHref: "/services/scanning",
    emptyLabel: "Tarama Talebi",
  },
] as const;

type TabType = "PRINT" | "TECHNICAL" | "SCANNING";

type SR = {
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
};

// ─── Tek Kart ─────────────────────────────────────────────────────────────────

function ServiceCard({
  sr,
  onRespond,
}: {
  sr: SR;
  onRespond: (id: string, action: "approve" | "reject") => Promise<void>;
}) {
  const [open,    setOpen]    = useState(sr.status === "QUOTED");
  const [loading, setLoading] = useState(false);

  const status   = STATUS[sr.status] ?? STATUS.PENDING;
  const isQuoted = sr.status === "QUOTED";

  async function handle(action: "approve" | "reject") {
    setLoading(true);
    try { await onRespond(sr.id, action); }
    finally { setLoading(false); }
  }

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${
      isQuoted ? "border-purple-400/40 bg-purple-400/[0.04]" : "border-white/10 bg-white/[0.02]"
    } ${loading ? "opacity-60 pointer-events-none" : ""}`}>

      {/* QUOTED uyarı bandı */}
      {isQuoted && (
        <div className="bg-purple-400/10 border-b border-purple-400/20 px-5 py-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <p className="text-purple-300 text-xs font-medium">Fiyat teklifi hazır — onayınızı bekliyoruz</p>
        </div>
      )}

      {/* Başlık */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${status.color}`}>{status.label}</span>
          </div>
          <p className="text-white font-medium text-sm truncate">{sr.title}</p>
          <p className="text-white/30 text-xs">
            {new Date(sr.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {sr.price !== null && (
            <span className={`font-bold text-sm ${isQuoted ? "text-purple-300" : "text-[#FF6B35]"}`}>
              {formatPrice(sr.price)}
            </span>
          )}
          <button onClick={() => setOpen(v => !v)} className="text-white/30 hover:text-white transition-colors p-1">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Detay */}
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

          {sr.adminNotes && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">Yetkili Notu</p>
              <p className="text-white/70 text-sm">{sr.adminNotes}</p>
            </div>
          )}

          {/* Fiyat onay kutusu */}
          {isQuoted && sr.price !== null && (
            <div className="bg-purple-400/[0.06] border border-purple-400/25 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wide mb-0.5">Fiyat Teklifi</p>
                  <p className="text-2xl font-black text-purple-300">{formatPrice(sr.price)}</p>
                </div>
              </div>
              <p className="text-white/40 text-xs">
                Fiyatı onaylarsanız talebiniz işleme alınır. Reddederseniz talep iptal edilir.
              </p>
              <div className="flex gap-2 pt-1">
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

export default function ServiceRequestsClient({ initialRequests }: { initialRequests: SR[] }) {
  const [items,     setItems]     = useState<SR[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // QUOTED olan varsa o sekmeyi aç
    const quoted = initialRequests.find(r => r.status === "QUOTED");
    return (quoted?.type as TabType) ?? "PRINT";
  });

  const counts = {
    PRINT:     items.filter(r => r.type === "PRINT"     && r.status === "QUOTED").length,
    TECHNICAL: items.filter(r => r.type === "TECHNICAL" && r.status === "QUOTED").length,
    SCANNING:  items.filter(r => r.type === "SCANNING"  && r.status === "QUOTED").length,
  };

  const tabItems = useMemo(
    () => [...items.filter(r => r.type === activeTab)]
      .sort((a, b) => {
        if (a.status === "QUOTED" && b.status !== "QUOTED") return -1;
        if (a.status !== "QUOTED" && b.status === "QUOTED") return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [items, activeTab]
  );

  const totalQuoted = counts.PRINT + counts.TECHNICAL + counts.SCANNING;
  const currentTab  = TABS.find(t => t.type === activeTab)!;

  async function handleRespond(id: string, action: "approve" | "reject") {
    try {
      const res = await fetch(`/api/services/${id}/respond`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);

      setItems(prev => prev.map(r =>
        r.id !== id ? r : { ...r, status: data.status ?? r.status, updatedAt: data.updatedAt ?? r.updatedAt }
      ));
      toast[action === "approve" ? "success" : "message"](
        action === "approve" ? "Fiyat onaylandı! Talebiniz işleme alındı." : "Talep iptal edildi."
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  return (
    <div>
      {/* Toplu onay bekleyen uyarısı */}
      {totalQuoted > 0 && (
        <div className="mb-5 p-3.5 bg-purple-400/[0.07] border border-purple-400/25 rounded-2xl flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
          <p className="text-purple-300 text-sm">
            <span className="font-bold">{totalQuoted}</span> talebiniz için fiyat teklifi hazır — onayınızı bekliyoruz.
          </p>
        </div>
      )}

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-0">
        {TABS.map(tab => {
          const Icon     = tab.icon;
          const isActive = activeTab === tab.type;
          const q        = counts[tab.type];
          return (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-t border-x text-sm font-medium transition-all -mb-px ${
                isActive ? `${tab.active} border-white/15` : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              <Icon size={14} className={isActive ? "" : "opacity-60"} />
              {tab.label}
              {q > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/15" : "bg-purple-400/20 text-purple-300"}`}>
                  {q}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab içeriği */}
      {tabItems.length === 0 ? (
        <div className="text-center py-16">
          <currentTab.icon size={48} className="mx-auto text-white/10 mb-4" />
          <p className="text-white/40 mb-4">{currentTab.label} talebiniz yok</p>
          <Link href={currentTab.emptyHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-semibold">
            {currentTab.emptyLabel} Oluştur
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tabItems.map(req => (
            <ServiceCard key={req.id} sr={req} onRespond={handleRespond} />
          ))}
        </div>
      )}
    </div>
  );
}
