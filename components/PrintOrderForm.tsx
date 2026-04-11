"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const QUALITY_MULTIPLIERS: Record<string, number> = {
  draft: 1,
  standard: 1.5,
  fine: 2.2,
  ultra: 3.5,
};

const MATERIAL_PRICES: Record<string, number> = {
  PLA: 8,
  PETG: 10,
  ABS: 11,
  TPU: 15,
  ASA: 13,
};

const schema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  description: z.string().min(20, "Açıklama en az 20 karakter olmalıdır"),
  material: z.enum(["PLA", "PETG", "ABS", "TPU", "ASA"]),
  quality: z.enum(["draft", "standard", "fine", "ultra"]),
  color: z.string().min(1, "Renk seçiniz"),
  estimatedWeight: z.coerce.number().min(1, "Tahmini ağırlık giriniz"),
});

type FormData = z.infer<typeof schema>;

const QUALITY_LABELS = {
  draft: "Taslak (0.3mm) — Hızlı, düşük kalite",
  standard: "Standart (0.2mm) — Dengeli kalite",
  fine: "İnce (0.1mm) — Yüksek kalite",
  ultra: "Ultra (0.05mm) — Mükemmel detay",
};

const COLORS = [
  "Siyah", "Beyaz", "Gri", "Kırmızı", "Mavi", "Yeşil", "Sarı", "Turuncu", "Mor", "Kahverengi",
];

export function PrintOrderForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      material: "PLA",
      quality: "standard",
      color: "Siyah",
      estimatedWeight: 50,
    },
  });

  const watchedMaterial = watch("material");
  const watchedQuality = watch("quality");
  const watchedWeight = watch("estimatedWeight");

  const estimatedPrice =
    (MATERIAL_PRICES[watchedMaterial] || 8) *
    (QUALITY_MULTIPLIERS[watchedQuality] || 1.5) *
    (watchedWeight || 50);

  const onSubmit = async (data: FormData) => {
    if (!session) {
      toast.error("Lütfen önce giriş yapın");
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PRINT",
          title: data.title,
          description: data.description,
          specs: {
            material: data.material,
            quality: data.quality,
            color: data.color,
            estimatedWeight: data.estimatedWeight,
          },
          files: [],
        }),
      });

      if (!res.ok) throw new Error("Talep gönderilemedi");

      toast.success("Baskı talebiniz alındı! En kısa sürede fiyat teklifi sunacağız.");
      router.push("/account/service-requests");
    } catch {
      toast.error("Bir hata oluştu, lütfen tekrar deneyin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dosya yükleme */}
      <div>
        <label className="text-white/60 text-sm mb-2 block">
          STL Dosyası (isteğe bağlı)
        </label>
        <div
          className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-[#FF6B35]/40 transition-colors cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dropped = Array.from(e.dataTransfer.files).filter(
              (f) => f.name.endsWith(".stl")
            );
            setFiles((prev) => [...prev, ...dropped]);
          }}
        >
          <Upload size={32} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/40 text-sm">
            STL dosyanızı buraya sürükleyin
          </p>
          <label className="mt-3 inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 cursor-pointer hover:bg-white/10 transition-colors">
            Dosya Seç
            <input
              type="file"
              accept=".stl"
              multiple
              className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                setFiles((prev) => [...prev, ...selected]);
              }}
            />
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg"
              >
                <FileText size={16} className="text-[#FF6B35]" />
                <span className="text-white/70 text-sm flex-1 truncate">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-white/30 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Başlık */}
      <div>
        <label className="text-white/60 text-sm mb-1.5 block">Proje Başlığı</label>
        <input
          {...register("title")}
          placeholder="Drone gövdesi, robot kolu parçası..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none transition-colors text-sm"
        />
        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
      </div>

      {/* Açıklama */}
      <div>
        <label className="text-white/60 text-sm mb-1.5 block">Açıklama</label>
        <textarea
          {...register("description")}
          rows={4}
          placeholder="Parçanın boyutları, kullanım amacı, özel gereksinimler..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none transition-colors text-sm resize-none"
        />
        {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Malzeme */}
        <div>
          <label className="text-white/60 text-sm mb-2 block">Malzeme</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(MATERIAL_PRICES).map((mat) => (
              <label key={mat} className="cursor-pointer">
                <input {...register("material")} type="radio" value={mat} className="sr-only" />
                <div
                  className={`px-3 py-2 rounded-lg text-center text-sm font-medium transition-all border ${
                    watchedMaterial === mat
                      ? "bg-[#FF6B35]/10 border-[#FF6B35] text-[#FF6B35]"
                      : "border-white/10 text-white/50 hover:border-white/30"
                  }`}
                >
                  {mat}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Kalite */}
        <div>
          <label className="text-white/60 text-sm mb-2 block">Kalite</label>
          <select
            {...register("quality")}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#FF6B35] focus:outline-none text-sm"
          >
            {Object.entries(QUALITY_LABELS).map(([val, label]) => (
              <option key={val} value={val} className="bg-[#0a0a0a]">
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Renk */}
        <div>
          <label className="text-white/60 text-sm mb-2 block">Renk</label>
          <select
            {...register("color")}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#FF6B35] focus:outline-none text-sm"
          >
            {COLORS.map((c) => (
              <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>
            ))}
          </select>
        </div>

        {/* Ağırlık */}
        <div>
          <label className="text-white/60 text-sm mb-2 block">
            Tahmini Ağırlık (gram)
          </label>
          <input
            {...register("estimatedWeight")}
            type="number"
            min={1}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#FF6B35] focus:outline-none text-sm"
          />
          {errors.estimatedWeight && (
            <p className="text-red-400 text-xs mt-1">{errors.estimatedWeight.message}</p>
          )}
        </div>
      </div>

      {/* Tahmini Fiyat */}
      <div className="p-4 bg-[#FF6B35]/5 border border-[#FF6B35]/20 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">Tahmini Fiyat</span>
          <span className="text-[#FF6B35] text-xl font-bold">
            ≈ ₺{estimatedPrice.toFixed(2)}
          </span>
        </div>
        <p className="text-white/30 text-xs mt-1">
          * Kesin fiyat inceleme sonrası bildirilecektir
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-[#FF6B35] hover:bg-[#ff5a1f] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        Talebi Gönder
      </button>
    </form>
  );
}
