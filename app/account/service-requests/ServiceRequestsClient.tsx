"use client";

import { useState } from "react";
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

const TYPE_ICONS: Record<string, typeof Wrench> = {
  PRINT:     Zap,
  SCANNING:  Scan,
  TECHNICAL: Wrench,
};

const TYPE_LABELS: Record<string, string> = {
  PRINT:     "3D Baskı",
  SCANNING:  "3D Tarama",
  TECHNICAL: "Teknik Servis",
};

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
  const [open, setOpen]       = useState(sr.status === "QUOTED"); // QUOTED ise otomatik açık
  const [loading, setLoading] = useState(false);

  const Icon   = TYPE_ICONS[sr.type] || Wrench;
  const status = STATUS[sr.status] ?? STATUS.PENDING;
  const isQuoted = sr.status === "QUOTED";

  async function handle(action: "approve" | "reject") {
    setLoading(true);
    try {
      await onRespond(sr.id, action);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all ${
        isQuoted
          ? "border-purple-400/40 bg-purple-400/[0.04]"
          : "border-white/10 bg-white/[0.02]"
      } ${loading ? "opacity-60 pointer-events-none" : ""}`}
    >
      {/* QUOTED uyarı bandı */}
      {isQuoted && (
        <div className="bg-purple-400/10 border-b border-purple-400/20 px-5 py-2.5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <p className="text-purple-300 text-xs font-medium">
            Fiyat teklifi hazır — onaylamanızı bekliyoruz
          </p>
        </div>
      )}

      {/* Başlık satırı */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center flex-shrink-0">
          <Icon size={18} className="text-[#FF6B35]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[11px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {TYPE_LABELS[sr.type]}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-white font-medium text-sm truncate">{sr.title}</p>
          <p className="text-white/30 text-xs">
            {new Date(sr.createdAt).toLocaleDateString("tr-TR", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {sr.price !== null && (
            <span className={`font-bold text-sm ${isQuoted ? "text-purple-300" : "text-[#FF6B35]"}`}>
              {formatPrice(sr.price)}
            </span>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-white/30 hover:text-white transition-colors p-1"
          >
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Genişletilmiş panel */}
      {open && (
        <div className="border-t border-white/5 px-5 py-4 space-y-4">
          {/* Açıklama */}
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">Açıklama</p>
            <p className="text-white/60 text-sm leading-relaxed">{sr.description}</p>
          </div>

          {/* Specs */}
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

          {/* Dosyalar */}
          {sr.files.length > 0 && (
            <div>
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">Dosyalar</p>
              <div className="flex flex-wrap gap-2">
                {sr.files.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#FF6B35] bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-2.5 py-1 rounded-lg hover:underline"
                  >
                    Dosya {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin Notu */}
          {sr.adminNotes && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">Yetkili Notu</p>
              <p className="text-white/70 text-sm">{sr.adminNotes}</p>
            </div>
          )}

          {/* ─── QUOTED: Fiyat Onay Kutusu ──────────────────────────────── */}
          {isQuoted && sr.price !== null && (
            <div className="bg-purple-400/[0.06] border border-purple-400/25 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wide mb-0.5">Fiyat Teklifi</p>
                  <p className="text-2xl font-black text-purple-300">{formatPrice(sr.price)}</p>
                </div>
                {sr.adminNotes && (
                  <div className="text-right max-w-[180px]">
                    <p className="text-white/30 text-[10px] uppercase tracking-wide mb-0.5">Not</p>
                    <p className="text-white/55 text-xs line-clamp-2">{sr.adminNotes}</p>
                  </div>
                )}
              </div>

              <p className="text-white/40 text-xs">
                Fiyatı onaylarsanız talebiniz işleme alınır. Reddederseniz talep iptal edilir.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handle("approve")}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#00D4AA] hover:bg-[#00bfa0] text-black font-bold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  Onayla
                </button>
                <button
                  onClick={() => handle("reject")}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-semibold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Reddet
                </button>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex justify-between pt-1 border-t border-white/5">
            <span className="text-[11px] text-white/20 font-mono">
              #{sr.id.slice(-8).toUpperCase()}
            </span>
            <span className="text-[11px] text-white/20">
              Güncellendi: {new Date(sr.updatedAt).toLocaleDateString("tr-TR")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ana Component ────────────────────────────────────────────────────────────

export default function ServiceRequestsClient({
  initialRequests,
}: {
  initialRequests: SR[];
}) {
  const [items, setItems] = useState<SR[]>(initialRequests);

  // QUOTED olan talepler en üste
  const sorted = [...items].sort((a, b) => {
    if (a.status === "QUOTED" && b.status !== "QUOTED") return -1;
    if (a.status !== "QUOTED" && b.status === "QUOTED") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  async function handleRespond(id: string, action: "approve" | "reject") {
    try {
      const res = await fetch(`/api/services/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);

      setItems((prev) =>
        prev.map((r) =>
          r.id !== id
            ? r
            : {
                ...r,
                status:    data.status    ?? r.status,
                updatedAt: data.updatedAt ?? r.updatedAt,
              }
        )
      );

      if (action === "approve") {
        toast.success("Fiyat onaylandı! Talebiniz işleme alındı.");
      } else {
        toast("Talep iptal edildi.", { icon: "✕" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Hata: ${msg}`);
      throw err;
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <Wrench size={64} className="mx-auto text-white/10 mb-4" />
        <p className="text-white/40 mb-6">Henüz servis talebiniz yok</p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/services/print"
            className="px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-semibold"
          >
            3D Baskı
          </Link>
          <Link
            href="/services/technical"
            className="px-4 py-2 border border-white/20 text-white rounded-xl text-sm font-semibold"
          >
            Teknik Servis
          </Link>
        </div>
      </div>
    );
  }

  const quotedCount = items.filter((r) => r.status === "QUOTED").length;

  return (
    <div>
      {/* Onay bekleyen uyarısı */}
      {quotedCount > 0 && (
        <div className="mb-5 p-4 bg-purple-400/[0.07] border border-purple-400/25 rounded-2xl flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
          <p className="text-purple-300 text-sm">
            <span className="font-bold">{quotedCount}</span> talebiniz için fiyat teklifi hazır — onayınızı bekliyoruz.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {sorted.map((req) => (
          <ServiceCard key={req.id} sr={req} onRespond={handleRespond} />
        ))}
      </div>
    </div>
  );
}
