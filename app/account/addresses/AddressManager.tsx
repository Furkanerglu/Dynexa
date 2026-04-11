"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Star, MapPin, Loader2, X, Check } from "lucide-react";

const addressSchema = z.object({
  title: z.string().min(1, "Başlık gereklidir (Ev, İş vb.)"),
  fullName: z.string().min(2, "Ad soyad gereklidir"),
  phone: z.string().min(10, "Geçerli telefon numarası giriniz"),
  city: z.string().min(1, "Şehir giriniz"),
  district: z.string().min(1, "İlçe giriniz"),
  line: z.string().min(5, "Adres detayını giriniz"),
  isDefault: z.boolean().optional(),
});

type AddressData = z.infer<typeof addressSchema>;

interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  line: string;
  isDefault: boolean;
}

interface Props {
  initialAddresses: Address[];
}

export default function AddressManager({ initialAddresses }: Props) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddressData>({ resolver: zodResolver(addressSchema) });

  const openAddForm = () => {
    reset({ title: "", fullName: "", phone: "", city: "", district: "", line: "", isDefault: false });
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (address: Address) => {
    setValue("title", address.title);
    setValue("fullName", address.fullName);
    setValue("phone", address.phone);
    setValue("city", address.city);
    setValue("district", address.district);
    setValue("line", address.line);
    setValue("isDefault", address.isDefault);
    setEditingId(address.id);
    setShowForm(true);
  };

  const onSubmit = async (data: AddressData) => {
    setLoading(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/user/addresses/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setAddresses((prev) =>
          prev.map((a) => {
            if (data.isDefault && a.id !== editingId) return { ...a, isDefault: false };
            if (a.id === editingId) return json;
            return a;
          })
        );
        toast.success("Adres güncellendi");
      } else {
        const res = await fetch("/api/user/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        if (data.isDefault || addresses.length === 0) {
          setAddresses((prev) => [...prev.map((a) => ({ ...a, isDefault: false })), json]);
        } else {
          setAddresses((prev) => [...prev, json]);
        }
        toast.success("Adres eklendi");
      }
      setShowForm(false);
      setEditingId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme başarısız");
      const deleted = addresses.find((a) => a.id === id);
      const remaining = addresses.filter((a) => a.id !== id);
      if (deleted?.isDefault && remaining.length > 0) {
        remaining[0].isDefault = true;
      }
      setAddresses(remaining);
      toast.success("Adres silindi");
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error();
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
      toast.success("Varsayılan adres güncellendi");
    } catch {
      toast.error("Bir hata oluştu");
    }
  };

  return (
    <div className="space-y-4">
      {/* Adres Listesi */}
      {addresses.length === 0 && !showForm && (
        <div className="text-center py-16 bg-white/[0.02] border border-white/10 rounded-2xl">
          <MapPin size={48} className="mx-auto text-white/10 mb-4" />
          <p className="text-white/40 mb-6">Henüz kayıtlı adresiniz yok</p>
        </div>
      )}

      {addresses.map((address) => (
        <div key={address.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-semibold text-sm">{address.title}</span>
                {address.isDefault && (
                  <span className="text-xs px-2 py-0.5 bg-[#FF6B35]/10 text-[#FF6B35] rounded-full font-medium flex items-center gap-1">
                    <Star size={10} fill="currentColor" />
                    Varsayılan
                  </span>
                )}
              </div>
              <p className="text-white/70 text-sm">{address.fullName}</p>
              <p className="text-white/50 text-sm">{address.phone}</p>
              <p className="text-white/50 text-sm mt-1">{address.line}, {address.district} / {address.city}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {!address.isDefault && (
                <button
                  onClick={() => handleSetDefault(address.id)}
                  title="Varsayılan Yap"
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/30 hover:text-[#FF6B35] hover:border-[#FF6B35]/30 transition-colors"
                >
                  <Star size={14} />
                </button>
              )}
              <button
                onClick={() => openEditForm(address)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => handleDelete(address.id)}
                disabled={deletingId === address.id}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-50"
              >
                {deletingId === address.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Form */}
      {showForm && (
        <div className="bg-white/[0.03] border border-[#FF6B35]/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold">
              {editingId ? "Adresi Düzenle" : "Yeni Adres Ekle"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm mb-1.5 block">Başlık</label>
                <input
                  {...register("title")}
                  placeholder="Ev, İş, Diğer..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none transition-colors text-sm"
                />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="text-white/60 text-sm mb-1.5 block">Ad Soyad</label>
                <input
                  {...register("fullName")}
                  placeholder="Alıcı adı"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none transition-colors text-sm"
                />
                {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Telefon</label>
              <input
                {...register("phone")}
                type="tel"
                placeholder="05XX XXX XX XX"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none transition-colors text-sm"
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm mb-1.5 block">Şehir</label>
                <input
                  {...register("city")}
                  placeholder="İstanbul"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none transition-colors text-sm"
                />
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <label className="text-white/60 text-sm mb-1.5 block">İlçe</label>
                <input
                  {...register("district")}
                  placeholder="Kadıköy"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none transition-colors text-sm"
                />
                {errors.district && <p className="text-red-400 text-xs mt-1">{errors.district.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Adres Detayı</label>
              <textarea
                {...register("line")}
                rows={2}
                placeholder="Mahalle, sokak, bina no, daire..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none transition-colors text-sm resize-none"
              />
              {errors.line && <p className="text-red-400 text-xs mt-1">{errors.line.message}</p>}
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input type="checkbox" {...register("isDefault")} className="sr-only peer" />
                <div className="w-5 h-5 rounded border border-white/20 peer-checked:bg-[#FF6B35] peer-checked:border-[#FF6B35] transition-all flex items-center justify-center">
                  <Check size={12} className="text-white opacity-0 peer-checked:opacity-100 absolute" />
                </div>
              </div>
              <span className="text-white/60 text-sm group-hover:text-white/80 transition-colors">
                Varsayılan adres olarak ayarla
              </span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#FF6B35] hover:bg-[#ff5a1f] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {editingId ? "Güncelle" : "Adresi Kaydet"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-white/20 text-white/60 hover:text-white rounded-xl transition-colors text-sm"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Yeni Adres Ekle butonu */}
      {!showForm && (
        <button
          onClick={openAddForm}
          className="w-full py-4 border border-dashed border-white/20 rounded-2xl text-white/40 hover:text-white hover:border-[#FF6B35]/40 transition-all flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus size={18} />
          Yeni Adres Ekle
        </button>
      )}
    </div>
  );
}
