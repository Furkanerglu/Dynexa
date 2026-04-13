"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, X, ChevronDown, ChevronRight } from "lucide-react";

type Color = {
  id: string;
  name: string;
  hex: string;
  inStock: boolean;
  sortOrder: number;
};

type Material = {
  id: string;
  name: string;
  description: string;
  pricePerGram: number;
  inStock: boolean;
  sortOrder: number;
  colors: Color[];
};

const DEFAULT_MATERIALS = [
  {
    name: "PLA",
    description: "Kolay baskı, genel amaçlı",
    pricePerGram: 7,
    colors: [
      { name: "Siyah",   hex: "#111111" },
      { name: "Beyaz",   hex: "#f5f5f5" },
      { name: "Kırmızı", hex: "#e53e3e" },
      { name: "Mavi",    hex: "#3182ce" },
    ],
  },
  {
    name: "PETG",
    description: "Dayanıklı, hafif esnek",
    pricePerGram: 7,
    colors: [
      { name: "Siyah",   hex: "#111111" },
      { name: "Beyaz",   hex: "#f5f5f5" },
      { name: "Şeffaf",  hex: "#e8f4f8" },
    ],
  },
  {
    name: "ABS",
    description: "Isıya dayanıklı, sert",
    pricePerGram: 10,
    colors: [
      { name: "Siyah",   hex: "#111111" },
      { name: "Beyaz",   hex: "#f5f5f5" },
      { name: "Gri",     hex: "#888888" },
    ],
  },
  {
    name: "TPU",
    description: "Esnek, lastik benzeri",
    pricePerGram: 12,
    colors: [
      { name: "Siyah",   hex: "#111111" },
      { name: "Beyaz",   hex: "#f5f5f5" },
    ],
  },
  {
    name: "ASA",
    description: "UV dayanımlı, dış mekan",
    pricePerGram: 10,
    colors: [
      { name: "Siyah",   hex: "#111111" },
      { name: "Beyaz",   hex: "#f5f5f5" },
      { name: "Gri",     hex: "#888888" },
    ],
  },
];

export default function PrintOptionsClient({
  initialMaterials,
}: {
  initialMaterials: Material[];
}) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // ─── New material modal ────────────────────────────────────────────────────
  const [showMatModal, setShowMatModal] = useState(false);
  const [newMat, setNewMat] = useState({ name: "", description: "", pricePerGram: 7 });

  // ─── New color modal ───────────────────────────────────────────────────────
  const [colorModalFor, setColorModalFor] = useState<string | null>(null); // materialId
  const [newColor, setNewColor] = useState({ name: "", hex: "#888888" });

  // ─── Accordion toggle ──────────────────────────────────────────────────────
  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ─── Toggle material inStock ───────────────────────────────────────────────
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

  // ─── Toggle color inStock ──────────────────────────────────────────────────
  async function toggleColor(materialId: string, colorId: string, inStock: boolean) {
    setLoading(colorId);
    try {
      const res = await fetch(`/api/admin/print-options/${colorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "color", inStock }),
      });
      if (!res.ok) throw new Error();
      setMaterials(prev => prev.map(m =>
        m.id === materialId
          ? { ...m, colors: m.colors.map(c => c.id === colorId ? { ...c, inStock } : c) }
          : m
      ));
      toast.success(inStock ? "Stoka alındı" : "Stoktan çıkarıldı");
    } catch { toast.error("Güncelleme başarısız"); }
    finally { setLoading(null); }
  }

  // ─── Delete material ───────────────────────────────────────────────────────
  async function deleteMaterial(id: string) {
    if (!confirm("Bu malzemeyi ve tüm renklerini silmek istediğinizden emin misiniz?")) return;
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

  // ─── Delete color ──────────────────────────────────────────────────────────
  async function deleteColor(materialId: string, colorId: string) {
    if (!confirm("Bu rengi silmek istediğinizden emin misiniz?")) return;
    setLoading(colorId);
    try {
      const res = await fetch(`/api/admin/print-options/${colorId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "color" }),
      });
      if (!res.ok) throw new Error();
      setMaterials(prev => prev.map(m =>
        m.id === materialId
          ? { ...m, colors: m.colors.filter(c => c.id !== colorId) }
          : m
      ));
      toast.success("Renk silindi");
    } catch { toast.error("Silme başarısız"); }
    finally { setLoading(null); }
  }

  // ─── Add material ──────────────────────────────────────────────────────────
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
      setMaterials(prev => [...prev, { ...item, colors: item.colors ?? [] }]);
      setNewMat({ name: "", description: "", pricePerGram: 7 });
      setShowMatModal(false);
      toast.success("Malzeme eklendi");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Hata"); }
    finally { setLoading(null); }
  }

  // ─── Add color to material ─────────────────────────────────────────────────
  async function addColor() {
    if (!colorModalFor) return;
    if (!newColor.name.trim()) { toast.error("Renk adı giriniz"); return; }
    setLoading("add-color");
    const mat = materials.find(m => m.id === colorModalFor);
    try {
      const res = await fetch("/api/admin/print-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "color",
          materialId: colorModalFor,
          ...newColor,
          sortOrder: mat?.colors.length ?? 0,
        }),
      });
      const item = await res.json();
      if (!res.ok) throw new Error(item.error);
      setMaterials(prev => prev.map(m =>
        m.id === colorModalFor ? { ...m, colors: [...m.colors, item] } : m
      ));
      setNewColor({ name: "", hex: "#888888" });
      setColorModalFor(null);
      toast.success("Renk eklendi");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Hata"); }
    finally { setLoading(null); }
  }

  // ─── Seed defaults ─────────────────────────────────────────────────────────
  async function seedDefaults() {
    setLoading("seed");
    const existingNames = new Set(materials.map(m => m.name));
    let added = 0;

    for (const def of DEFAULT_MATERIALS) {
      if (existingNames.has(def.name)) continue;

      const matRes = await fetch("/api/admin/print-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "material",
          name: def.name,
          description: def.description,
          pricePerGram: def.pricePerGram,
          sortOrder: added,
        }),
      });
      if (!matRes.ok) continue;
      const matItem = await matRes.json();

      const addedColors: Color[] = [];
      for (let ci = 0; ci < def.colors.length; ci++) {
        const colRes = await fetch("/api/admin/print-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "color",
            materialId: matItem.id,
            name: def.colors[ci].name,
            hex: def.colors[ci].hex,
            sortOrder: ci,
          }),
        });
        if (colRes.ok) addedColors.push(await colRes.json());
      }

      setMaterials(prev => [...prev, { ...matItem, colors: addedColors }]);
      added++;
    }

    setLoading(null);
    toast.success(added > 0 ? `${added} malzeme ve renkleri eklendi` : "Malzemeler zaten mevcut");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Filament Stok Yönetimi</h1>
        <div className="flex gap-2">
          {materials.length === 0 && (
            <button
              onClick={seedDefaults}
              disabled={loading === "seed"}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-white/50 hover:text-white rounded-xl text-xs transition-colors"
            >
              {loading === "seed" ? <Loader2 size={13} className="animate-spin" /> : null}
              Varsayılanları Ekle
            </button>
          )}
          <button
            onClick={() => setShowMatModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#FF6B35] hover:bg-[#ff5a1f] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus size={15} /> Malzeme Ekle
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-4 mb-6 text-sm text-white/40">
        <span>
          <span className="text-[#00D4AA] font-semibold">{materials.filter(m => m.inStock).length}</span> malzeme stokta
        </span>
        <span>
          <span className="text-red-400 font-semibold">{materials.filter(m => !m.inStock).length}</span> stok dışı
        </span>
        <span>
          <span className="text-white/60 font-semibold">
            {materials.reduce((s, m) => s + m.colors.filter(c => c.inStock).length, 0)}
          </span> renk stokta
        </span>
      </div>

      {/* Material accordion list */}
      <div className="space-y-2">
        {materials.map(m => {
          const isOpen = expanded.has(m.id);
          return (
            <div key={m.id} className="border border-white/10 rounded-2xl overflow-hidden">
              {/* Material row */}
              <div className="flex items-center gap-3 px-5 py-4 bg-white/[0.03]">
                {/* Expand toggle */}
                <button
                  type="button"
                  onClick={() => toggleExpand(m.id)}
                  className="text-white/30 hover:text-white transition-colors flex-shrink-0"
                >
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(m.id)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-bold text-sm">{m.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      m.inStock ? "bg-[#00D4AA]/15 text-[#00D4AA]" : "bg-red-500/15 text-red-400"
                    }`}>
                      {m.inStock ? "Stokta" : "Stok Dışı"}
                    </span>
                    <span className="text-white/25 text-[11px]">
                      {m.colors.filter(c => c.inStock).length}/{m.colors.length} renk stokta
                    </span>
                  </div>
                  {m.description && <p className="text-white/35 text-xs mt-0.5">{m.description}</p>}
                </div>

                <span className="text-white/50 text-sm font-mono flex-shrink-0">{m.pricePerGram}₺/g</span>

                {/* Material inStock toggle */}
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

                <button
                  onClick={() => deleteMaterial(m.id)}
                  disabled={loading === m.id}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/30 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Colors section (expanded) */}
              {isOpen && (
                <div className="px-5 py-4 border-t border-white/5 bg-black/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Renkler</span>
                    <button
                      onClick={() => {
                        setColorModalFor(m.id);
                        setNewColor({ name: "", hex: "#888888" });
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded-lg text-xs transition-colors"
                    >
                      <Plus size={12} /> Renk Ekle
                    </button>
                  </div>

                  {m.colors.length === 0 ? (
                    <p className="text-white/25 text-xs py-3 text-center">
                      Henüz renk eklenmedi. "Renk Ekle" ile başlayın.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                      {m.colors.map(c => (
                        <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl">
                          <div
                            className="w-7 h-7 rounded-lg border border-white/20 flex-shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-white/80 text-sm font-medium">{c.name}</span>
                              <span className={`text-[9px] px-1 py-0.5 rounded-full ${
                                c.inStock ? "bg-[#00D4AA]/15 text-[#00D4AA]" : "bg-red-500/15 text-red-400"
                              }`}>
                                {c.inStock ? "Stokta" : "Dışı"}
                              </span>
                            </div>
                            <span className="text-white/20 text-[10px] font-mono">{c.hex}</span>
                          </div>

                          {/* Color toggle */}
                          <button
                            type="button"
                            onClick={() => toggleColor(m.id, c.id, !c.inStock)}
                            disabled={loading === c.id}
                            className={`relative inline-flex flex-shrink-0 w-9 h-5 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${
                              c.inStock ? "bg-[#00D4AA]" : "bg-white/10"
                            }`}
                          >
                            {loading === c.id
                              ? <Loader2 size={10} className="absolute inset-0 m-auto animate-spin text-white" />
                              : <span className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform self-center ${c.inStock ? "translate-x-4" : "translate-x-0.5"}`} />
                            }
                          </button>

                          <button
                            onClick={() => deleteColor(m.id, c.id)}
                            disabled={loading === c.id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/30 transition-colors flex-shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {materials.length === 0 && (
          <div className="text-center py-16 text-white/25 text-sm">
            Henüz malzeme eklenmedi. "Varsayılanları Ekle" ile PLA, PETG, ABS… ekleyin.
          </div>
        )}
      </div>

      {/* ─── Malzeme Ekle Modal ─────────────────────────────────────────────── */}
      {showMatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold">Yeni Malzeme</h3>
              <button onClick={() => setShowMatModal(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-white/50 text-xs mb-1 block">Malzeme Adı *</label>
                <input
                  value={newMat.name}
                  onChange={e => setNewMat(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ör. SILK, CF, PA..."
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Açıklama</label>
                <input
                  value={newMat.description}
                  onChange={e => setNewMat(p => ({ ...p, description: e.target.value }))}
                  placeholder="Kısa açıklama..."
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Gram Fiyatı (₺)</label>
                <input
                  type="number" min={0} step={0.5} value={newMat.pricePerGram}
                  onChange={e => setNewMat(p => ({ ...p, pricePerGram: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#FF6B35] focus:outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowMatModal(false)} className="flex-1 py-2.5 border border-white/10 text-white/50 rounded-xl text-sm">İptal</button>
              <button
                onClick={addMaterial}
                disabled={loading === "add-mat"}
                className="flex-1 py-2.5 bg-[#FF6B35] text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading === "add-mat" && <Loader2 size={14} className="animate-spin" />}
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Renk Ekle Modal ────────────────────────────────────────────────── */}
      {colorModalFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-bold">Yeni Renk</h3>
              <button onClick={() => setColorModalFor(null)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <p className="text-white/30 text-xs mb-4">
              {materials.find(m => m.id === colorModalFor)?.name} malzemesine renk ekleniyor
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-white/50 text-xs mb-1 block">Renk Adı *</label>
                <input
                  value={newColor.name}
                  onChange={e => setNewColor(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ör. Lacivert, Açık Mavi..."
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Renk Kodu</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color" value={newColor.hex}
                    onChange={e => setNewColor(p => ({ ...p, hex: e.target.value }))}
                    className="w-12 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer p-1"
                  />
                  <input
                    value={newColor.hex}
                    onChange={e => setNewColor(p => ({ ...p, hex: e.target.value }))}
                    placeholder="#888888"
                    className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm font-mono"
                  />
                  <div className="w-10 h-10 rounded-lg border border-white/20 flex-shrink-0" style={{ backgroundColor: newColor.hex }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setColorModalFor(null)} className="flex-1 py-2.5 border border-white/10 text-white/50 rounded-xl text-sm">İptal</button>
              <button
                onClick={addColor}
                disabled={loading === "add-color"}
                className="flex-1 py-2.5 bg-[#FF6B35] text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
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
