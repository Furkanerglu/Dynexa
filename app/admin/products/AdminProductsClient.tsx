"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, Loader2, X, Image as ImageIcon,
  ChevronDown, ChevronUp, Layout, Grid3X3, Columns2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";
import type { FeatureSection, CardsSection, SplitSection } from "@/app/shop/[slug]/ProductFeatures";

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface Category { id: string; name: string; type: string; }

interface Product {
  id: string; name: string; slug: string; description: string;
  price: number; salePrice: number | null; stock: number;
  brand: string | null; isActive: boolean; images: string[];
  categoryId: string; category: Category;
  specs: Record<string, unknown> | null;
}

interface Props { initialProducts: Product[]; categories: Category[]; }

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const productSchema = z.object({
  name:        z.string().min(2, "En az 2 karakter"),
  description: z.string().min(5, "Açıklama gerekli"),
  price:       z.number({ invalid_type_error: "Geçerli fiyat girin" }).positive(),
  salePrice:   z.union([z.number().positive(), z.literal("")]).optional(),
  stock:       z.number({ invalid_type_error: "Geçerli stok girin" }).int().min(0),
  categoryId:  z.string().min(1, "Kategori seçin"),
  brand:       z.string().optional(),
  isActive:    z.boolean().default(true),
});
type ProductForm = z.infer<typeof productSchema>;

// ─── Upload Butonu Yardımcısı ─────────────────────────────────────────────────

function ImgUpload({
  value, onUploaded, onRemove, label = "Görsel Yükle",
}: {
  value: string; onUploaded: (url: string) => void; onRemove: () => void; label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  if (value) {
    return (
      <div className="relative group w-full h-28 rounded-xl overflow-hidden border border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className="w-full h-full object-cover" />
        <button type="button" onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 bg-black/70 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors">
          <X size={11} className="text-white" />
        </button>
      </div>
    );
  }
  return (
    <div className="border border-dashed border-white/20 rounded-xl p-2 bg-white/[0.02] hover:border-[#FF6B35]/40 transition-colors">
      <UploadButton<OurFileRouter, "productImage">
        endpoint="productImage"
        onUploadBegin={() => setUploading(true)}
        onClientUploadComplete={res => { setUploading(false); if (res[0]) onUploaded(res[0].url); }}
        onUploadError={err => { setUploading(false); toast.error(err.message); }}
        appearance={{
          button: "bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ut-uploading:opacity-50 w-full",
          allowedContent: "text-white/20 text-[10px] mt-0.5",
          container: "flex flex-col items-center gap-0.5 w-full",
        }}
        content={{ button: uploading ? "Yükleniyor..." : label, allowedContent: "JPG, PNG, WebP — max 4MB" }}
      />
    </div>
  );
}

// ─── Bölüm Editörleri ─────────────────────────────────────────────────────────

function BannerEditor({ section, onChange }: {
  section: Extract<FeatureSection, { type: "banner" }>;
  onChange: (s: FeatureSection) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-white/40 text-xs mb-1 block">Başlık *</label>
        <input value={section.title}
          onChange={e => onChange({ ...section, title: e.target.value })}
          placeholder="Ör. CCF PLA HS: Yüksek Hızlı 3D Baskı Filamenti"
          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
      </div>
      <div>
        <label className="text-white/40 text-xs mb-1 block">Açıklama</label>
        <textarea value={section.description}
          onChange={e => onChange({ ...section, description: e.target.value })}
          rows={2} placeholder="Kısa açıklama..."
          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm resize-none" />
      </div>
      <div>
        <label className="text-white/40 text-xs mb-1 block">Arka Plan Görseli</label>
        <ImgUpload value={section.image ?? ""}
          onUploaded={url => onChange({ ...section, image: url })}
          onRemove={() => onChange({ ...section, image: "" })} />
      </div>
    </div>
  );
}

function CardsEditor({ section, onChange }: {
  section: CardsSection;
  onChange: (s: FeatureSection) => void;
}) {
  function updateItem(i: number, patch: Partial<CardsSection["items"][0]>) {
    const items = section.items.map((it, idx) => idx === i ? { ...it, ...patch } : it);
    onChange({ ...section, items });
  }
  function addItem() { onChange({ ...section, items: [...section.items, { title: "", description: "", image: "" }] }); }
  function removeItem(i: number) { onChange({ ...section, items: section.items.filter((_, idx) => idx !== i) }); }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-white/40 text-xs mb-1 block">Bölüm Başlığı</label>
        <input value={section.title}
          onChange={e => onChange({ ...section, title: e.target.value })}
          placeholder="Ör. Yüksek Hızlı Baskı Performansı"
          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
      </div>
      <div className="space-y-3">
        <label className="text-white/40 text-xs block">Kartlar ({section.items.length})</label>
        {section.items.map((item, i) => (
          <div key={i} className="border border-white/10 rounded-xl p-3 bg-white/[0.02] space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/30 text-[10px] uppercase tracking-wide">Kart {i + 1}</span>
              <button type="button" onClick={() => removeItem(i)}
                className="text-red-400/50 hover:text-red-400 transition-colors">
                <X size={13} />
              </button>
            </div>
            <input value={item.title} onChange={e => updateItem(i, { title: e.target.value })}
              placeholder="Kart başlığı"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
            <textarea value={item.description} onChange={e => updateItem(i, { description: e.target.value })}
              rows={2} placeholder="Kart açıklaması"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm resize-none" />
            <ImgUpload value={item.image ?? ""}
              onUploaded={url => updateItem(i, { image: url })}
              onRemove={() => updateItem(i, { image: "" })}
              label="Kart Görseli" />
          </div>
        ))}
        <button type="button" onClick={addItem}
          className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-white/15 hover:border-[#FF6B35]/40 text-white/30 hover:text-[#FF6B35] rounded-xl text-xs transition-colors">
          <Plus size={13} /> Kart Ekle
        </button>
      </div>
    </div>
  );
}

function SplitEditor({ section, onChange }: {
  section: SplitSection;
  onChange: (s: FeatureSection) => void;
}) {
  function updateItem(i: number, patch: Partial<SplitSection["items"][0]>) {
    const items = section.items.map((it, idx) => idx === i ? { ...it, ...patch } : it);
    onChange({ ...section, items });
  }
  function addItem() { onChange({ ...section, items: [...section.items, { title: "", description: "" }] }); }
  function removeItem(i: number) { onChange({ ...section, items: section.items.filter((_, idx) => idx !== i) }); }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-white/40 text-xs mb-1 block">Bölüm Başlığı</label>
        <input value={section.title}
          onChange={e => onChange({ ...section, title: e.target.value })}
          placeholder="Ör. Yüksek Akışkanlık Özellikleri"
          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-white/40 text-xs mb-1 block">Görsel Konumu</label>
          <div className="flex gap-2">
            {(["left", "right"] as const).map(pos => (
              <button key={pos} type="button"
                onClick={() => onChange({ ...section, imagePosition: pos })}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                  section.imagePosition === pos
                    ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                    : "border-white/10 text-white/40 hover:border-white/30"
                }`}>
                {pos === "left" ? "Sol" : "Sağ"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="text-white/40 text-xs mb-1 block">Bölüm Görseli</label>
        <ImgUpload value={section.image ?? ""}
          onUploaded={url => onChange({ ...section, image: url })}
          onRemove={() => onChange({ ...section, image: "" })} />
      </div>
      <div className="space-y-2">
        <label className="text-white/40 text-xs block">Özellik Listesi ({section.items.length})</label>
        {section.items.map((item, i) => (
          <div key={i} className="border border-white/10 rounded-xl p-3 bg-white/[0.02] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white/30 text-[10px] uppercase tracking-wide">Özellik {i + 1}</span>
              <button type="button" onClick={() => removeItem(i)}
                className="text-red-400/50 hover:text-red-400 transition-colors"><X size={13} /></button>
            </div>
            <input value={item.title} onChange={e => updateItem(i, { title: e.target.value })}
              placeholder="Özellik başlığı"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
            <input value={item.description} onChange={e => updateItem(i, { description: e.target.value })}
              placeholder="Kısa açıklama (opsiyonel)"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
          </div>
        ))}
        <button type="button" onClick={addItem}
          className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-white/15 hover:border-[#FF6B35]/40 text-white/30 hover:text-[#FF6B35] rounded-xl text-xs transition-colors">
          <Plus size={13} /> Özellik Ekle
        </button>
      </div>
    </div>
  );
}

// ─── Bölüm Tipi Seçici ────────────────────────────────────────────────────────

const SECTION_TYPES = [
  { type: "banner", label: "Banner", desc: "Tam genişlik, arka plan görseli", icon: Layout },
  { type: "cards",  label: "Kart Izgara", desc: "2–4 kart, görsel + başlık", icon: Grid3X3 },
  { type: "split",  label: "Bölünmüş Düzen", desc: "Görsel + özellik listesi", icon: Columns2 },
] as const;

function newSection(type: FeatureSection["type"]): FeatureSection {
  if (type === "banner") return { type, title: "", description: "", image: "" };
  if (type === "cards")  return { type, title: "", items: [] };
  return { type: "split", title: "", image: "", imagePosition: "left", items: [] };
}

// ─── Ana Component ────────────────────────────────────────────────────────────

export default function AdminProductsClient({ initialProducts, categories }: Props) {
  const [products,       setProducts]       = useState<Product[]>(initialProducts);
  const [showModal,      setShowModal]       = useState(false);
  const [editingProduct, setEditingProduct]  = useState<Product | null>(null);
  const [loading,        setLoading]         = useState(false);
  const [deletingId,     setDeletingId]      = useState<string | null>(null);
  const [images,         setImages]          = useState<string[]>([]);
  const [uploading,      setUploading]       = useState(false);
  const [search,         setSearch]          = useState("");

  // Features state
  const [features,      setFeatures]      = useState<FeatureSection[]>([]);
  const [featuresOpen,  setFeaturesOpen]  = useState(false);
  const [addTypeOpen,   setAddTypeOpen]   = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { isActive: true, stock: 0 },
  });

  function openCreate() {
    setEditingProduct(null); setImages([]); setFeatures([]); setFeaturesOpen(false); setAddTypeOpen(false);
    reset({ name: "", description: "", price: 0, salePrice: "", stock: 0, categoryId: "", brand: "", isActive: true });
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingProduct(p); setImages(p.images);
    const fs: FeatureSection[] = Array.isArray(p.specs?.features) ? (p.specs!.features as FeatureSection[]) : [];
    setFeatures(fs); setFeaturesOpen(fs.length > 0); setAddTypeOpen(false);
    reset({ name: p.name, description: p.description, price: p.price, salePrice: p.salePrice ?? "",
      stock: p.stock, categoryId: p.categoryId, brand: p.brand ?? "", isActive: p.isActive });
    setShowModal(true);
  }

  function addSection(type: FeatureSection["type"]) {
    setFeatures(prev => [...prev, newSection(type)]);
    setAddTypeOpen(false); setFeaturesOpen(true);
  }

  function updateSection(i: number, s: FeatureSection) { setFeatures(prev => prev.map((x, idx) => idx === i ? s : x)); }
  function removeSection(i: number) { setFeatures(prev => prev.filter((_, idx) => idx !== i)); }
  function moveSection(i: number, dir: -1 | 1) {
    setFeatures(prev => {
      const arr = [...prev]; const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]]; return arr;
    });
  }

  const onSubmit = async (data: ProductForm) => {
    setLoading(true);
    try {
      const existingSpecs = editingProduct?.specs
        ? Object.fromEntries(Object.entries(editingProduct.specs).filter(([k]) => k !== "features"))
        : {};
      const specsPayload = features.length > 0
        ? { ...existingSpecs, features }
        : Object.keys(existingSpecs).length > 0 ? existingSpecs : undefined;

      const payload = {
        ...data,
        price:     Number(data.price),
        salePrice: data.salePrice !== "" && data.salePrice ? Number(data.salePrice) : null,
        stock:     Number(data.stock),
        images,
        ...(specsPayload !== undefined ? { specs: specsPayload } : {}),
      };

      const res = await fetch(
        editingProduct ? `/api/products/${editingProduct.id}` : "/api/products",
        { method: editingProduct ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const normalized = { ...json, price: Number(json.price), salePrice: json.salePrice ? Number(json.salePrice) : null, specs: json.specs ?? null };
      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? normalized : p));
        toast.success("Ürün güncellendi");
      } else {
        setProducts(prev => [normalized, ...prev]);
        toast.success("Ürün eklendi");
      }
      setShowModal(false);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Hata"); }
    finally { setLoading(false); }
  };

  const toggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !product.isActive }) });
      if (!res.ok) throw new Error();
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
      toast.success(product.isActive ? "Pasife alındı" : "Aktife alındı");
    } catch { toast.error("Güncelleme başarısız"); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Silme başarısız");
      setProducts(prev => prev.filter(p => p.id !== id));
      toast[json.softDeleted ? "info" : "success"](json.softDeleted ? "Siparişlerde kullanıldığı için pasife alındı" : "Ürün silindi");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Silme başarısız"); }
    finally { setDeletingId(null); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const sectionTypeLabel = (type: string) =>
    SECTION_TYPES.find(t => t.type === type)?.label ?? type;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Ürünler <span className="text-white/30 text-lg font-normal">({products.length})</span></h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#ff5a1f] text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus size={16} /> Ürün Ekle
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ürün adı, kategori veya marka ara..."
        className="w-full mb-4 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />

      {/* Tablo */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {["Ürün","Kategori","Fiyat","İndirimli","Stok","Durum","İşlem"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-white/40 text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images[0]
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-contain bg-white border border-white/10 p-0.5" />
                        : <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"><ImageIcon size={16} className="text-white/20" /></div>
                      }
                      <div>
                        <p className="text-white text-sm font-medium max-w-[160px] truncate">{product.name}</p>
                        {product.brand && <p className="text-white/30 text-xs">{product.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/60 text-sm">{product.category.name}</td>
                  <td className="px-4 py-3 text-white text-sm">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">
                    {product.salePrice ? <span className="text-[#FF6B35] text-sm">{formatPrice(product.salePrice)}</span> : <span className="text-white/20 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${product.stock === 0 ? "text-red-400" : product.stock <= 5 ? "text-yellow-400" : "text-[#00D4AA]"}`}>{product.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(product)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${product.isActive ? "bg-[#00D4AA]/10 text-[#00D4AA] hover:bg-red-500/10 hover:text-red-400" : "bg-white/10 text-white/30 hover:bg-[#00D4AA]/10 hover:text-[#00D4AA]"}`}>
                      {product.isActive ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(product)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => deleteProduct(product.id)} disabled={deletingId === product.id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-50">
                        {deletingId === product.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">Ürün bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#0a0a0a] z-10">
              <h2 className="text-white font-bold text-lg">{editingProduct ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Ürün Adı */}
              <div>
                <label className="text-white/60 text-sm mb-1.5 block">Ürün Adı *</label>
                <input {...register("name")} placeholder="Ürün adını girin"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Açıklama */}
              <div>
                <label className="text-white/60 text-sm mb-1.5 block">Açıklama *</label>
                <textarea {...register("description")} rows={3} placeholder="Ürün açıklaması..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm resize-none" />
                {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
              </div>

              {/* Kategori & Marka */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm mb-1.5 block">Kategori *</label>
                  <select {...register("categoryId")} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#FF6B35] focus:outline-none text-sm">
                    <option value="" className="bg-black">Kategori seçin</option>
                    {categories.map(c => <option key={c.id} value={c.id} className="bg-black">{c.name}</option>)}
                  </select>
                  {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1.5 block">Marka</label>
                  <input {...register("brand")} placeholder="Ör. Bambu Lab, CCF..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
                </div>
              </div>

              {/* Fiyat, İndirimli, Stok */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Fiyat (₺) *", field: "price" as const, ph: "0.00" },
                  { label: "İndirimli (₺)", field: "salePrice" as const, ph: "Boş bırakın" },
                  { label: "Stok *", field: "stock" as const, ph: "0" },
                ].map(({ label, field, ph }) => (
                  <div key={field}>
                    <label className="text-white/60 text-sm mb-1.5 block">{label}</label>
                    <input {...register(field, field === "salePrice" ? { setValueAs: v => v === "" ? "" : Number(v) } : { valueAsNumber: true })}
                      type="number" step={field === "stock" ? "1" : "0.01"} min="0" placeholder={ph}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
                    {errors[field] && <p className="text-red-400 text-xs mt-1">{errors[field]?.message}</p>}
                  </div>
                ))}
              </div>

              {/* Ürün Görselleri */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Ürün Görselleri <span className="text-white/30">(max 8 adet, 4MB)</span></label>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {images.map((url, idx) => (
                      <div key={idx} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-20 h-20 object-contain rounded-xl bg-white border border-white/10 p-1" />
                        <button type="button" onClick={() => setImages(p => p.filter((_, i) => i !== idx))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={10} className="text-white" />
                        </button>
                        {idx === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-[#FF6B35] text-white px-1 rounded">Ana</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="border border-dashed border-white/20 rounded-xl p-4 bg-white/[0.02] hover:border-[#FF6B35]/40 transition-colors">
                  <UploadButton<OurFileRouter, "productImage">
                    endpoint="productImage"
                    onUploadBegin={() => setUploading(true)}
                    onClientUploadComplete={res => { setUploading(false); setImages(p => [...p, ...res.map(f => f.url)]); toast.success(`${res.length} görsel yüklendi`); }}
                    onUploadError={err => { setUploading(false); toast.error(err.message); }}
                    appearance={{ button: "bg-[#FF6B35] hover:bg-[#ff5a1f] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors ut-uploading:opacity-50 w-full", allowedContent: "text-white/30 text-xs mt-1", container: "flex flex-col items-center gap-1 w-full" }}
                    content={{ button: uploading ? "Yükleniyor..." : images.length > 0 ? "Daha Fazla Görsel Ekle" : "Görsel Seç", allowedContent: "JPG, PNG, WebP — max 4MB" }}
                  />
                </div>
              </div>

              {/* ── Ürün Özellikleri Bölümleri ─────────────────────────────── */}
              <div className="border border-white/10 rounded-2xl overflow-hidden">
                {/* Başlık */}
                <button type="button" onClick={() => setFeaturesOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-left">
                  <div>
                    <span className="text-white text-sm font-semibold">Ürün Özellikleri Bölümleri</span>
                    {features.length > 0 && (
                      <span className="ml-2 text-[10px] bg-[#FF6B35]/20 text-[#FF6B35] px-1.5 py-0.5 rounded-full">{features.length} bölüm</span>
                    )}
                    <p className="text-white/30 text-xs mt-0.5">Banner, Kart Izgara, Bölünmüş Düzen</p>
                  </div>
                  {featuresOpen ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                </button>

                {featuresOpen && (
                  <div className="p-4 space-y-3 border-t border-white/10">

                    {/* Mevcut bölümler */}
                    {features.map((section, i) => (
                      <div key={i} className="border border-white/10 rounded-xl bg-white/[0.02] overflow-hidden">
                        {/* Bölüm başlığı */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border-b border-white/5">
                          <span className="text-[10px] text-white/30 uppercase tracking-wide flex-1">
                            {i + 1}. {sectionTypeLabel(section.type)}
                          </span>
                          <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0}
                            className="text-white/20 hover:text-white disabled:opacity-20 transition-colors"><ChevronUp size={14} /></button>
                          <button type="button" onClick={() => moveSection(i, 1)} disabled={i === features.length - 1}
                            className="text-white/20 hover:text-white disabled:opacity-20 transition-colors"><ChevronDown size={14} /></button>
                          <button type="button" onClick={() => removeSection(i)}
                            className="text-red-400/50 hover:text-red-400 transition-colors"><X size={14} /></button>
                        </div>
                        {/* Bölüm formu */}
                        <div className="p-4">
                          {section.type === "banner" && <BannerEditor section={section} onChange={s => updateSection(i, s)} />}
                          {section.type === "cards"  && <CardsEditor  section={section} onChange={s => updateSection(i, s)} />}
                          {section.type === "split"  && <SplitEditor  section={section} onChange={s => updateSection(i, s)} />}
                        </div>
                      </div>
                    ))}

                    {features.length === 0 && (
                      <p className="text-white/25 text-sm text-center py-3">Henüz bölüm yok. Aşağıdan tür seçerek ekleyin.</p>
                    )}

                    {/* Yeni bölüm ekle */}
                    {addTypeOpen ? (
                      <div className="border border-white/10 rounded-xl p-3 bg-white/[0.02]">
                        <p className="text-white/40 text-xs mb-3">Bölüm türü seç:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {SECTION_TYPES.map(({ type, label, desc, icon: Icon }) => (
                            <button key={type} type="button" onClick={() => addSection(type)}
                              className="border border-white/10 hover:border-[#FF6B35]/50 rounded-xl p-3 text-left transition-all hover:bg-[#FF6B35]/5 group">
                              <Icon size={18} className="text-white/30 group-hover:text-[#FF6B35] mb-2 transition-colors" />
                              <p className="text-white text-xs font-semibold">{label}</p>
                              <p className="text-white/30 text-[10px] mt-0.5 leading-tight">{desc}</p>
                            </button>
                          ))}
                        </div>
                        <button type="button" onClick={() => setAddTypeOpen(false)}
                          className="mt-2 w-full text-white/30 hover:text-white text-xs py-1 transition-colors">İptal</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setAddTypeOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/15 hover:border-[#FF6B35]/40 text-white/30 hover:text-[#FF6B35] rounded-xl text-sm transition-colors">
                        <Plus size={14} /> Bölüm Ekle
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Aktif/Pasif */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" {...register("isActive")} className="sr-only peer" />
                  <div className="w-10 h-6 bg-white/10 rounded-full peer-checked:bg-[#FF6B35] transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                </div>
                <span className="text-white/60 text-sm">Ürün aktif (mağazada görünür)</span>
              </label>

              {/* Butonlar */}
              <div className="flex gap-3 pt-2 border-t border-white/10">
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 bg-[#FF6B35] hover:bg-[#ff5a1f] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {editingProduct ? "Güncelle" : "Ürün Ekle"}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-white/20 text-white/60 hover:text-white rounded-xl transition-colors">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
