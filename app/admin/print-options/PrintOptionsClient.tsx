"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, X, Layers, Palette } from "lucide-react";

type Material = { id: string; name: string; description: string; pricePerGram: number; inStock: boolean; sortOrder: number };
type Color    = { id: string; name: string; hex: string; inStock: boolean; sortOrder: number };

const DEFAULT_COLORS = [
  { name: "Siyah",      hex: "#111111" },
  { name: "Beyaz",      hex: "#f5f5f5" },
  { name: "Gri",        hex: "#888888" },
  { name: "Kırmızı",    hex: "#e53e3e" },
  { name: "Mavi",       hex: "#3182ce" },
  { name: "Yeşil",      hex: "#38a169" },
  { name: "Sarı",       hex: "#ecc94b" },
  { name: "Turuncu",    hex: "#ed8936" },
  { name: "Mor",        hex: "#805ad5" },
  { name: "Kahverengi", hex: "#975a16" },
  { name: "Pembe",      hex: "#ed64a6" },
  { name: "Gümüş",      hex: "#a0aec0" },
];

const DEFAULT_MATERIALS = [
  { name: "PLA",  description: "Kolay baskı, genel amaçlı", pricePerGram: 7  },
  { name: "PETG", description: "Dayanıklı, hafif esnek",    pricePerGram: 7  },
  { name: "ABS",  description: "Isıya dayanıklı, sert",     pricePerGram: 10 },
  { name: "TPU",  description: "Esnek, lastik benzeri",      pricePerGram: 12 },
  { name: "ASA",  description: "UV dayanımlı, dış mekan",   pricePerGram: 10 },
];

export default function PrintOptionsClient({
  initialMaterials,
  initialColors,
}: {
  initialMaterials: Material[];
  initialColors: Color[];
}) {
  const [materials,  setMaterials]  = useState<Material[]>(initialMaterials);
  const [colors,     setColors]     = useState<Color[]>(initialColors);
  const [tab,        setTab]        = useState<"materials" | "colors">("materials");
  const [loading,    setLoading]    = useState<string | null>(null);

  // ─── Modal state ──────────────────────────────────────────────────────────
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showColorModal,    setShowColorModal]    = useState(false);
  const [newMat,  setNewMat]  = useState({ name: "", description: "", pricePerGram: 7 });
  const [newColor, setNewColor] = useState({ name: "", hex: "#888888" });

  // ─── Toggle inStock ───────────────────────────────────────────────────────
  async function toggleMaterial(id: string, inStock: boolean) {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/print-options/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "material", inStock }),
      });
      if (!res.ok) throw new Error();
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, inStock } : m));
      toast.success(inStock ? "Stoka alındı" : "Stoktan çıkarıldı");
    } catch { toast.error("Güncelleme başarısız"); }
    finally { setLoading(null); }
  }

  async function toggleColor(id: string, inStock: boolean) {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/print-options/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "color", inStock }),
      });
      if (!res.ok) throw new Error();
      setColors(prev => prev.map(c => c.id === id ? { ...c, inStock } : c));
      toast.success(inStock ? "Stoka alındı" : "Stoktan çıkarıldı");
    } catch { toast.error("Güncelleme başarısız"); }
    finally { setLoading(null); }
  }

  // ─── Sil ──────────────────────────────────────────────────────────────────
  async function deleteMaterial(id: string) {
    if (!confirm("Bu malzemeyi silmek istediğinizden emin misiniz?")) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/print-options/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "material" }),
      });
      if (!res.ok) throw new Error();
      setMaterials(prev => prev.filter(m => m.id !== id));
      toast.success("Malzeme silindi");
    } catch { toast.error("Silme başarısız"); }
    finally { setLoading(null); }
  }

  async function deleteColor(id: string) {
    if (!confirm("Bu rengi silmek istediğinizden emin misiniz?")) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/print-options/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "color" }),
      });
      if (!res.ok) throw new Error();
      setColors(prev => prev.filter(c => c.id !== id));
      toast.success("Renk silindi");
    } catch { toast.error("Silme başarısız"); }
    finally { setLoading(null); }
  }

  // ─── Ekle ─────────────────────────────────────────────────────────────────
  async function addMaterial() {
    if (!newMat.name.trim()) { toast.error("Malzeme adı giriniz"); return; }
    setLoading("add-mat");
    try {
      const res = await fetch("/api/admin/print-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "material", ...newMat, sortOrder: materials.length }),
      });
      const item = await res.json();
      if (!res.ok) throw new Error(item.error);
      setMaterials(prev => [...prev, item]);
      setNewMat({ name: "", description: "", pricePerGram: 7 });
      setShowMaterialModal(false);
      toast.success("Malzeme eklendi");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Hata"); }
    finally { setLoading(null); }
  }

  async function addColor() {
    if (!newColor.name.trim()) { toast.error("Renk adı giriniz"); return; }
    setLoading("add-color");
    try {
      const res = await fetch("/api/admin/print-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "color", ...newColor, sortOrder: colors.length }),
      });
      const item = await res.json();
      if (!res.ok) throw new Error(item.error);
      setColors(prev => [...prev, item]);
      setNewColor({ name: "", hex: "#888888" });
      setShowColorModal(false);
      toast.success("Renk eklendi");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Hata"); }
    finally { setLoading(null); }
  }

  // ─── Varsayılanları ekle ──────────────────────────────────────────────────
  async function seedDefaults(kind: "material" | "color") {
    setLoading("seed");
    const defaults = kind === "material" ? DEFAULT_MATERIALS : DEFAULT_COLORS;
    const existing = kind === "material"
      ? new Set(materials.map(m => m.name))
      : new Set(colors.map(c => c.name));

    let added = 0;
    for (const d of defaults) {
      if (existing.has(d.name)) continue;
      const res = await fetch("/api/admin/print-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...d, sortOrder: added }),
      });
      if (res.ok) {
        const item = await res.json();
        if (kind === "material") setMaterials(prev => [...prev, item]);
        else setColors(prev => [...prev, item]);
        added++;
      }
    }
    setLoading(null);
    toast.success(added > 0 ? `${added} varsayılan eklendi` : "Zaten mevcut");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Filament Stok Yönetimi</h1>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6">
        {([
          { key: "materials", label: "Malzemeler", icon: Layers, count: materials.length },
          { key: "colors",    label: "Renkler",     icon: Palette, count: colors.length },
        ] as const).map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                tab === t.key
                  ? "bg-[#FF6B35]/10 border-[#FF6B35]/40 text-[#FF6B35]"
                  : "border-white/10 text-white/40 hover:text-white"
              }`}>
              <Icon size={15} />
              {t.label}
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Malzemeler ─────────────────────────────────────────────────────── */}
      {tab === "materials" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/40 text-sm">
              <span className="text-[#00D4AA] font-semibold">{materials.filter(m => m.inStock).length}</span> stokta /
              <span className="text-red-400 font-semibold ml-1">{materials.filter(m => !m.inStock).length}</span> stok dışı
            </p>
            <div className="flex gap-2">
              {materials.length === 0 && (
                <button onClick={() => seedDefaults("material")} disabled={loading === "seed"}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-white/50 hover:text-white rounded-xl text-xs transition-colors">
                  Varsayılanları Ekle
                </button>
              )}
              <button onClick={() => setShowMaterialModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#FF6B35] hover:bg-[#ff5a1f] text-white text-sm font-semibold rounded-xl transition-colors">
                <Plus size={15} /> Malzeme Ekle
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {materials.map(m => (
              <div key={m.id} className="flex items-center gap-4 px-5 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm">{m.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      m.inStock ? "bg-[#00D4AA]/15 text-[#00D4AA]" : "bg-red-500/15 text-red-400"
                    }`}>
                      {m.inStock ? "Stokta" : "Stok Dışı"}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">{m.description}</p>
                </div>
                <span className="text-white/60 text-sm font-mono flex-shrink-0">{m.pricePerGram}₺/g</span>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleMaterial(m.id, !m.inStock)}
                  disabled={loading === m.id}
                  className={`relative inline-flex flex-shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${
                    m.inStock ? "bg-[#00D4AA]" : "bg-white/10"
                  }`}
                >
                  {loading === m.id
                    ? <Loader2 size={12} className="absolute inset-0 m-auto animate-spin text-white" />
                    : <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform self-center ${m.inStock ? "translate-x-6" : "translate-x-1"}`} />
                  }
                </button>

                <button onClick={() => deleteMaterial(m.id)} disabled={loading === m.id}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/30 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {materials.length === 0 && (
              <div className="text-center py-12 text-white/30 text-sm">
                Henüz malzeme eklenmedi. "Varsayılanları Ekle" ile PLA, PETG, ABS... ekleyin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Renkler ────────────────────────────────────────────────────────── */}
      {tab === "colors" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/40 text-sm">
              <span className="text-[#00D4AA] font-semibold">{colors.filter(c => c.inStock).length}</span> stokta /
              <span className="text-red-400 font-semibold ml-1">{colors.filter(c => !c.inStock).length}</span> stok dışı
            </p>
            <div className="flex gap-2">
              {colors.length === 0 && (
                <button onClick={() => seedDefaults("color")} disabled={loading === "seed"}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-white/50 hover:text-white rounded-xl text-xs transition-colors">
                  Varsayılanları Ekle
                </button>
              )}
              <button onClick={() => setShowColorModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#FF6B35] hover:bg-[#ff5a1f] text-white text-sm font-semibold rounded-xl transition-colors">
                <Plus size={15} /> Renk Ekle
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {colors.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl">
                {/* Renk önizleme */}
                <div className="w-8 h-8 rounded-lg border border-white/20 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm">{c.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      c.inStock ? "bg-[#00D4AA]/15 text-[#00D4AA]" : "bg-red-500/15 text-red-400"
                    }`}>
                      {c.inStock ? "Stokta" : "Stok Dışı"}
                    </span>
                  </div>
                  <p className="text-white/25 text-[11px] font-mono">{c.hex}</p>
                </div>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleColor(c.id, !c.inStock)}
                  disabled={loading === c.id}
                  className={`relative inline-flex flex-shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${
                    c.inStock ? "bg-[#00D4AA]" : "bg-white/10"
                  }`}
                >
                  {loading === c.id
                    ? <Loader2 size={12} className="absolute inset-0 m-auto animate-spin text-white" />
                    : <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform self-center ${c.inStock ? "translate-x-6" : "translate-x-1"}`} />
                  }
                </button>

                <button onClick={() => deleteColor(c.id)} disabled={loading === c.id}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/30 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {colors.length === 0 && (
              <div className="col-span-3 text-center py-12 text-white/30 text-sm">
                Henüz renk eklenmedi.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Malzeme Ekle Modal ─────────────────────────────────────────────── */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold">Yeni Malzeme</h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-white/50 text-xs mb-1 block">Malzeme Adı *</label>
                <input value={newMat.name} onChange={e => setNewMat(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ör. SILK, CF, PA..."
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Açıklama</label>
                <input value={newMat.description} onChange={e => setNewMat(p => ({ ...p, description: e.target.value }))}
                  placeholder="Kısa açıklama..."
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Gram Fiyatı (₺)</label>
                <input type="number" min={0} step={0.5} value={newMat.pricePerGram}
                  onChange={e => setNewMat(p => ({ ...p, pricePerGram: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#FF6B35] focus:outline-none text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowMaterialModal(false)} className="flex-1 py-2.5 border border-white/10 text-white/50 rounded-xl text-sm">İptal</button>
              <button onClick={addMaterial} disabled={loading === "add-mat"}
                className="flex-1 py-2.5 bg-[#FF6B35] text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {loading === "add-mat" && <Loader2 size={14} className="animate-spin" />}
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Renk Ekle Modal ────────────────────────────────────────────────── */}
      {showColorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold">Yeni Renk</h3>
              <button onClick={() => setShowColorModal(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-white/50 text-xs mb-1 block">Renk Adı *</label>
                <input value={newColor.name} onChange={e => setNewColor(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ör. Lacivert, Açık Mavi..."
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Renk Kodu</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={newColor.hex} onChange={e => setNewColor(p => ({ ...p, hex: e.target.value }))}
                    className="w-12 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer p-1" />
                  <input value={newColor.hex} onChange={e => setNewColor(p => ({ ...p, hex: e.target.value }))}
                    placeholder="#888888"
                    className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm font-mono" />
                  <div className="w-10 h-10 rounded-lg border border-white/20 flex-shrink-0" style={{ backgroundColor: newColor.hex }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowColorModal(false)} className="flex-1 py-2.5 border border-white/10 text-white/50 rounded-xl text-sm">İptal</button>
              <button onClick={addColor} disabled={loading === "add-color"}
                className="flex-1 py-2.5 bg-[#FF6B35] text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {loading === "add-color" && <Loader2 size={14} className="animate-spin" />}
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
