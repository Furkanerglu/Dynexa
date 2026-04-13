"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Wrench, CheckCircle2, XCircle, ChevronDown, ChevronUp, Download } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { parseFileEntry, downloadFile } from "@/lib/fileEntry";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING:     "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  REVIEWING:   "text-blue-400 bg-blue-400/10 border-blue-400/30",
  QUOTED:      "text-purple-400 bg-purple-400/10 border-purple-400/30",
  CONFIRMED:   "text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/30",
  IN_PROGRESS: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  COMPLETED:   "text-[#00D4AA] bg-[#00D4AA]/10 border-[#00D4AA]/30",
  CANCELLED:   "text-red-400 bg-red-400/10 border-red-400/30",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:     "Beklemede",
  REVIEWING:   "İnceleniyor",
  QUOTED:      "Fiyat Teklifi Hazır",
  CONFIRMED:   "Onaylandı",
  IN_PROGRESS: "İşlemde",
  COMPLETED:   "Tamamlandı",
  CANCELLED:   "İptal",
};

type SR = {
  id: string; type: string; status: string; title: string; description: string;
  files: string[]; specs: Record<string, unknown> | null;
  price: number | null; notes: string | null; adminNotes: string | null;
  createdAt: string; updatedAt: string;
};

// ─── Tek Kart ─────────────────────────────────────────────────────────────────

function ServiceCard({ sr, onRespond }: {
  sr: SR;
  onRespond: (id: string, action: "approve" | "reject") => Promise<void>;
}) {
  const [open,    setOpen]    = useState(sr.status === "QUOTED");
  const [loading, setLoading] = useState(false);

  const statusLabel = STATUS_LABELS[sr.status] ?? sr.status;
  const statusColor = STATUS_COLORS[sr.status] ?? STATUS_COLORS.PENDING;
  const isQuoted    = sr.status === "QUOTED";

  async function handleApprove() {
    setLoading(true);
    try { await onRespond(sr.id, "approve"); } finally { setLoading(false); }
  }

  async function handleReject() {
    setLoading(true);
    try { await onRespond(sr.id, "reject"); } finally { setLoading(false); }
  }

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${isQuoted ? "border-purple-400/40 bg-purple-400/[0.04]" : "border-white/10 bg-white/[0.02]"} ${loading ? "opacity-60 pointer-events-none" : ""}`}>
      {isQuoted && (
        <div className="bg-purple-400/10 border-b border-purple-400/20 px-5 py-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <p className="text-purple-300 text-xs font-medium">
            Fiyat teklifi hazır — onayınızı bekliyoruz
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="mb-0.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusColor}`}>{statusLabel}</span>
          </div>
          <p className="text-white font-medium text-sm truncate">{sr.title}</p>
          <p className="text-white/30 text-xs">
            {new Date(sr.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {sr.price !== null && (
            <span className={`font-bold text-sm ${isQuoted ? "text-purple-300" : "text-[#FF6B35]"}`}>{formatPrice(sr.price)}</span>
          )}
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

          {sr.files.length > 0 && (
            <div>
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">
                Dosyalar <span className="text-white/20 normal-case">({sr.files.length})</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {sr.files.map((entry, i) => {
                  const { url, name } = parseFileEntry(entry);
                  return (
                    <button key={i} type="button"
                      onClick={() => downloadFile(url, name).catch(() => toast.error("İndirme başarısız"))}
                      className="flex items-center gap-1.5 text-xs text-[#FF6B35] bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-2.5 py-1.5 rounded-lg hover:bg-[#FF6B35]/20 transition-colors max-w-[220px]">
                      <Download size={11} className="flex-shrink-0" />
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sr.adminNotes && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">Yetkili Notu</p>
              <p className="text-white/70 text-sm">{sr.adminNotes}</p>
            </div>
          )}

          {/* ── Fiyat teklifi aksiyon bloğu (sadece TECHNICAL) ── */}
          {isQuoted && sr.price !== null && (
            <div className="bg-purple-400/[0.06] border border-purple-400/25 rounded-2xl p-4 space-y-3">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-0.5">Fiyat Teklifi</p>
                <p className="text-2xl font-black text-purple-300">{formatPrice(sr.price)}</p>
              </div>
              <p className="text-white/40 text-xs">Fiyatı onaylarsanız talebiniz işleme alınır. Reddederseniz talep iptal edilir.</p>
              <div className="flex gap-2">
                <button onClick={handleApprove} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#00D4AA] hover:bg-[#00bfa0] text-black font-bold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  <CheckCircle2 size={16} /> Onayla
                </button>
                <button onClick={handleReject} disabled={loading}
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
  const [items, setItems] = useState<SR[]>(initialRequests);

  const sorted = [...items].sort((a, b) => {
    if (a.status === "QUOTED" && b.status !== "QUOTED") return -1;
    if (a.status !== "QUOTED" && b.status === "QUOTED") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const quotedCount = items.filter(r => r.status === "QUOTED").length;

  async function handleRespond(id: string, action: "approve" | "reject") {
    const res  = await fetch(`/api/services/${id}/respond`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const data = await res.json();
    if (!res.ok) { toast.error(data?.error ?? "Hata"); throw new Error(data?.error); }
    setItems(prev => prev.map(r => r.id !== id ? r : { ...r, status: data.status ?? r.status, updatedAt: data.updatedAt ?? r.updatedAt }));
    toast[action === "approve" ? "success" : "message"](action === "approve" ? "Fiyat onaylandı! Talebiniz işleme alındı." : "Talep iptal edildi.");
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <Wrench size={64} className="mx-auto text-white/10 mb-4" />
        <p className="text-white/40 mb-6">Henüz teknik servis talebiniz yok</p>
        <Link href="/services/technical" className="px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-semibold">
          Teknik Servis Talebi Oluştur
        </Link>
      </div>
    );
  }

  return (
    <div>
      {quotedCount > 0 && (
        <div className="mb-5 p-3.5 bg-purple-400/[0.07] border border-purple-400/25 rounded-2xl flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
          <p className="text-purple-300 text-sm">
            <span className="font-bold">{quotedCount}</span> talebiniz için fiyat teklifi hazır — lütfen inceleyin.
          </p>
        </div>
      )}
      <div className="space-y-4">
        {sorted.map(req => <ServiceCard key={req.id} sr={req} onRespond={handleRespond} />)}
      </div>
    </div>
  );
}
