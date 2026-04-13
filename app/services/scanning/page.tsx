"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Scan, Camera, Box, FileOutput } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const schema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  description: z.string().min(20, "Açıklama en az 20 karakter olmalıdır"),
  objectSize: z.enum(["small", "medium", "large", "xlarge"]),
  outputFormat: z.enum(["stl", "obj", "step", "all"]),
});

type FormData = z.infer<typeof schema>;

const SIZE_LABELS = {
  small: "Küçük (< 10cm) — ₺500",
  medium: "Orta (10-30cm) — ₺900",
  large: "Büyük (30-100cm) — ₺1800",
  xlarge: "Çok Büyük (> 100cm) — Fiyat bildirilir",
};

const FORMAT_LABELS = {
  stl: "STL (3D baskı için)",
  obj: "OBJ (animasyon/render için)",
  step: "STEP (CAD/mühendislik için)",
  all: "Tüm formatlar",
};

const steps = [
  { icon: Camera, title: "Fotoğraf Gönderin", desc: "Nesnenizin fotoğraflarını yükleyin" },
  { icon: Scan, title: "Tarama Randevusu", desc: "Size en uygun saatte randevu ayarlıyoruz" },
  { icon: Box, title: "3D Tarama", desc: "Profesyonel ekipmanlarla tarama yapıyoruz" },
  { icon: FileOutput, title: "Dosya Teslimi", desc: "Dijital dosyalarınızı teslim ediyoruz" },
];

export default function ScanningServicePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { objectSize: "medium", outputFormat: "stl" },
  });

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
          type: "SCANNING",
          title: data.title,
          description: data.description,
          specs: { objectSize: data.objectSize, outputFormat: data.outputFormat },
          files: [],
        }),
      });

      if (!res.ok) throw new Error();
      toast.success("Tarama talebiniz alındı! Randevu için sizi arayacağız.");
      router.push("/account/orders");
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[#00D4AA] text-sm font-medium tracking-widest uppercase mb-4">Hizmet</p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4">
            3D Tarama Hizmeti
          </h1>
          <p className="text-white/40 max-w-lg mx-auto">
            Fiziksel nesnelerinizi hassas 3D modellere dönüştürüyoruz.
          </p>
        </div>

        {/* Süreç adımları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative p-4 bg-white/[0.03] border border-white/10 rounded-xl text-center">
                <div className="w-8 h-8 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20 flex items-center justify-center mx-auto mb-3">
                  <Icon size={16} className="text-[#00D4AA]" />
                </div>
                <p className="text-white text-sm font-medium">{step.title}</p>
                <p className="text-white/40 text-xs mt-1">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-[1px] bg-white/10" />
                )}
              </div>
            );
          })}
        </div>

        {/* Form */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
          <h2 className="text-white font-bold text-xl mb-6">Tarama Talebi Oluştur</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Proje Başlığı</label>
              <input
                {...register("title")}
                placeholder="Heykel taraması, endüstriyel parça..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#00D4AA] focus:outline-none text-sm"
              />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Nesne Açıklaması</label>
              <textarea
                {...register("description")}
                rows={4}
                placeholder="Nesnenin malzemesi, boyutları, yüzey detayları, kullanım amacı..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#00D4AA] focus:outline-none text-sm resize-none"
              />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Nesne Boyutu</label>
                <select
                  {...register("objectSize")}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#00D4AA] focus:outline-none text-sm"
                >
                  {Object.entries(SIZE_LABELS).map(([val, label]) => (
                    <option key={val} value={val} className="bg-[#0a0a0a]">{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Çıktı Formatı</label>
                <select
                  {...register("outputFormat")}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#00D4AA] focus:outline-none text-sm"
                >
                  {Object.entries(FORMAT_LABELS).map(([val, label]) => (
                    <option key={val} value={val} className="bg-[#0a0a0a]">{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#00D4AA] hover:bg-[#00bfa0] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Tarama Talebi Gönder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
