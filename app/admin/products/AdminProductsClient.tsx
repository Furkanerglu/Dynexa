"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Loader2, X, Image as ImageIcon, Upload } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  brand: string | null;
  isActive: boolean;
  images: string[];
  categoryId: string;
  category: Category;
}

interface Props {
  initialProducts: Product[];
  categories: Category[];
}

const productSchema = z.object({
  name: z.string().min(2, "En az 2 karakter"),
  description: z.string().min(5, "Açıklama gerekli"),
  price: z.number({ invalid_type_error: "Geçerli fiyat girin" }).positive("Pozitif olmalı"),
  salePrice: z.union([z.number().positive(), z.literal("")]).optional(),
  stock: z.number({ invalid_type_error: "Geçerli stok girin" }).int().min(0),
  categoryId: z.string().min(1, "Kategori seçin"),
  brand: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ProductForm = z.infer<typeof productSchema>;

export default function AdminProductsClient({ initialProducts, categories }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { isActive: true, stock: 0 },
  });

  const openCreate = () => {
    setEditingProduct(null);
    setImages([]);
    reset({ name: "", description: "", price: 0, salePrice: "", stock: 0, categoryId: "", brand: "", isActive: true });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setImages(p.images);
    reset({
      name: p.name,
      description: p.description,
      price: p.price,
      salePrice: p.salePrice ?? "",
      stock: p.stock,
      categoryId: p.categoryId,
      brand: p.brand ?? "",
      isActive: p.isActive,
    });
    setShowModal(true);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data: ProductForm) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        price: Number(data.price),
        salePrice: data.salePrice !== "" && data.salePrice ? Number(data.salePrice) : null,
        stock: Number(data.stock),
        images,
      };

      let res: Response;
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      if (editingProduct) {
        setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? {
          ...json, price: Number(json.price), salePrice: json.salePrice ? Number(json.salePrice) : null
        } : p));
        toast.success("Ürün güncellendi");
      } else {
        setProducts((prev) => [{ ...json, price: Number(json.price), salePrice: json.salePrice ? Number(json.salePrice) : null }, ...prev]);
        toast.success("Ürün eklendi");
      }
      setShowModal(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
      toast.success(product.isActive ? "Ürün pasife alındı" : "Ürün aktife alındı");
    } catch {
      toast.error("Güncelleme başarısız");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Silme başarısız");

      if (json.softDeleted) {
        // Siparişe bağlı ürün — pasife alındı, listeden kaldır
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.info("Ürün siparişlerde kullanıldığı için pasife alındı");
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Ürün silindi");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Silme başarısız");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Ürünler <span className="text-white/30 text-lg font-normal">({products.length})</span></h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#ff5a1f] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={16} />
          Ürün Ekle
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Ürün adı, kategori veya marka ara..."
        className="w-full mb-4 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm"
      />

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Ürün</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Kategori</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Fiyat</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">İndirimli</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Stok</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Durum</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-white/5" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                          <ImageIcon size={16} className="text-white/20" />
                        </div>
                      )}
                      <div>
                        <p className="text-white text-sm font-medium max-w-[160px] truncate">{product.name}</p>
                        {product.brand && <p className="text-white/30 text-xs">{product.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/60 text-sm">{product.category.name}</td>
                  <td className="px-4 py-3 text-white text-sm">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">
                    {product.salePrice ? (
                      <span className="text-[#FF6B35] text-sm font-medium">{formatPrice(product.salePrice)}</span>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${product.stock === 0 ? "text-red-400" : product.stock <= 5 ? "text-yellow-400" : "text-[#00D4AA]"}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(product)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                        product.isActive
                          ? "bg-[#00D4AA]/10 text-[#00D4AA] hover:bg-red-500/10 hover:text-red-400"
                          : "bg-white/10 text-white/30 hover:bg-[#00D4AA]/10 hover:text-[#00D4AA]"
                      }`}
                    >
                      {product.isActive ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        disabled={deletingId === product.id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-50"
                      >
                        {deletingId === product.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">
                    Ürün bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#0a0a0a] z-10">
              <h2 className="text-white font-bold text-lg">
                {editingProduct ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Ürün Adı */}
              <div>
                <label className="text-white/60 text-sm mb-1.5 block">Ürün Adı *</label>
                <input
                  {...register("name")}
                  placeholder="Ürün adını girin"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Açıklama */}
              <div>
                <label className="text-white/60 text-sm mb-1.5 block">Açıklama *</label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Ürün açıklaması..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm resize-none"
                />
                {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
              </div>

              {/* Kategori & Marka */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm mb-1.5 block">Kategori *</label>
                  <select
                    {...register("categoryId")}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#FF6B35] focus:outline-none text-sm"
                  >
                    <option value="" className="bg-black">Kategori seçin</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-black">{c.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1.5 block">Marka</label>
                  <input
                    {...register("brand")}
                    placeholder="Ör. Bambu Lab, Creality..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Fiyat, İndirimli Fiyat, Stok */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-white/60 text-sm mb-1.5 block">Fiyat (₺) *</label>
                  <input
                    {...register("price", { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm"
                  />
                  {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1.5 block">İndirimli Fiyat (₺)</label>
                  <input
                    {...register("salePrice", { setValueAs: (v) => v === "" ? "" : Number(v) })}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Boş bırakın"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1.5 block">Stok *</label>
                  <input
                    {...register("stock", { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm"
                  />
                  {errors.stock && <p className="text-red-400 text-xs mt-1">{errors.stock.message}</p>}
                </div>
              </div>

              {/* Resimler */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Ürün Görselleri <span className="text-white/30">(max 8 adet, 4MB)</span>
                </label>

                {/* Yüklenen görseller */}
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {images.map((url, idx) => (
                      <div key={idx} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl bg-white/5 border border-white/10" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} className="text-white" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 text-[9px] bg-[#FF6B35] text-white px-1 rounded">Ana</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload butonu */}
                <div className="border border-dashed border-white/20 rounded-xl p-4 bg-white/[0.02] hover:border-[#FF6B35]/40 transition-colors">
                  <UploadButton<OurFileRouter, "productImage">
                    endpoint="productImage"
                    onUploadBegin={() => setUploading(true)}
                    onClientUploadComplete={(res) => {
                      setUploading(false);
                      const urls = res.map((f) => f.url);
                      setImages((prev) => [...prev, ...urls]);
                      toast.success(`${urls.length} görsel yüklendi`);
                    }}
                    onUploadError={(err) => {
                      setUploading(false);
                      toast.error("Yükleme hatası: " + err.message);
                    }}
                    appearance={{
                      button: "bg-[#FF6B35] hover:bg-[#ff5a1f] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors ut-uploading:opacity-50 ut-uploading:cursor-not-allowed w-full",
                      allowedContent: "text-white/30 text-xs mt-1",
                      container: "flex flex-col items-center gap-1 w-full",
                    }}
                    content={{
                      button: uploading
                        ? "Yükleniyor..."
                        : images.length > 0
                        ? "Daha Fazla Görsel Ekle"
                        : "Görsel Seç (JPG, PNG, WebP)",
                      allowedContent: "JPG, PNG, WebP — max 4MB",
                    }}
                  />
                </div>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#FF6B35] hover:bg-[#ff5a1f] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {editingProduct ? "Güncelle" : "Ürün Ekle"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-white/20 text-white/60 hover:text-white rounded-xl transition-colors"
                >
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
