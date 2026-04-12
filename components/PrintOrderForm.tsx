"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, FileText, Loader2, X, AlertTriangle, Clock, Info, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing-client";

// ─── Fiyatlandırma ───────────────────────────────────────────────────────────
const MATERIAL_PRICES: Record<string, number> = {
  PLA:  7,
  PETG: 7,
  ABS:  10,
  TPU:  12,
  ASA:  10,
};

const MATERIAL_DESC: Record<string, string> = {
  PLA:  "Kolay baskı, genel amaçlı",
  PETG: "Dayanıklı, hafif esnek",
  ABS:  "Isıya dayanıklı, sert",
  TPU:  "Esnek, lastik benzeri",
  ASA:  "UV dayanımlı, dış mekan",
};

const QUALITY_MULTIPLIERS: Record<string, number> = {
  draft:    1.0,
  standard: 1.5,
  fine:     2.2,
  ultra:    3.5,
};

const QUALITY_LABELS: Record<string, string> = {
  draft:    "Taslak (0.3mm) — Hızlı, düşük kalite",
  standard: "Standart (0.2mm) — Dengeli kalite",
  fine:     "İnce (0.1mm) — Yüksek kalite",
  ultra:    "Ultra (0.05mm) — Mükemmel detay",
};

const COLORS = [
  "Siyah", "Beyaz", "Gri", "Kırmızı", "Mavi", "Yeşil",
  "Sarı", "Turuncu", "Mor", "Kahverengi",
];

// ─── Schema ──────────────────────────────────────────────────────────────────
const schema = z.object({
  title:           z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  description:     z.string().min(20, "Açıklama en az 20 karakter olmalıdır"),
  material:        z.enum(["PLA", "PETG", "ABS", "TPU", "ASA"]),
  quality:         z.enum(["draft", "standard", "fine", "ultra"]),
  color:           z.string().min(1, "Renk seçiniz"),
  estimatedWeight: z.coerce.number().min(1, "Tahmini ağırlık giriniz"),
  estimatedHours:  z.coerce.number().min(0).optional(),
  needsSupports:   z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Component ───────────────────────────────────────────────────────────────
export function PrintOrderForm() {
  const { data: session } = useSession();
  const router = useRouter();

  // Seçilen dosyalar (henüz upload edilmemiş)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  // Upload tamamlanan URL'ler
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading,    setUploading]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [fileError,    setFileError]    = useState<string | null>(null);

  const { startUpload } = useUploadThing("serviceFiles");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      material:        "PLA",
      quality:         "standard",
      color:           "Siyah",
      estimatedWeight: 50,
      estimatedHours:  0,
      needsSupports:   false,
    },
  });

  const mat     = watch("material");
  const quality = watch("quality");
  const weight  = watch("estimatedWeight") || 0;
  const hours   = watch("estimatedHours")  || 0;
  const needs   = watch("needsSupports");

  const basePrice      = MATERIAL_PRICES[mat] * (QUALITY_MULTIPLIERS[quality] || 1.5) * weight;
  const estimatedPrice = basePrice;
  const overTimeNote   = hours > 2;

  const ALLOWED_EXTS = [".stl", ".3mf", ".step"];

  function isAllowed(file: File) {
    const name = file.name.toLowerCase();
    return ALLOWED_EXTS.some(ext => name.endsWith(ext));
  }

  // Dosya ekle (hem sürükle-bırak hem input)
  function addFiles(incoming: File[]) {
    const valid   = incoming.filter(isAllowed);
    const invalid = incoming.filter(f => !isAllowed(f));
    if (invalid.length > 0) {
      toast.error(`Desteklenmeyen uzantı: ${invalid.map(f => f.name).join(", ")} — Sadece .stl, .3mf, .step kabul edilir`);
    }
    if (valid.length === 0) return;
    setPendingFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !existing.has(f.name))];
    });
    setFileError(null);
    setUploadedUrls([]);
  }

  function removeFile(index: number) {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedUrls([]);
  }

  // Önce dosyaları UploadThing'e yükle, sonra form verisini gönder
  const onSubmit = async (data: FormData) => {
    if (!session) {
      toast.error("Lütfen önce giriş yapın");
      router.push("/login");
      return;
    }

    // STL zorunlu kontrolü
    if (pendingFiles.length === 0 && uploadedUrls.length === 0) {
      setFileError("En az bir STL dosyası yüklemeniz zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      let finalUrls = uploadedUrls;

      // Upload edilmemiş dosyalar varsa şimdi yükle
      if (pendingFiles.length > 0 && uploadedUrls.length === 0) {
        setUploading(true);
        const result = await startUpload(pendingFiles);
        setUploading(false);

        if (!result || result.length === 0) {
          toast.error("Dosya yüklenemedi, lütfen tekrar deneyin");
          setSubmitting(false);
          return;
        }

        // url + orijinal dosya adını birlikte sakla
        finalUrls = result.map((r, i) =>
          JSON.stringify({ url: r.url, name: r.name ?? pendingFiles[i]?.name ?? "dosya" })
        );
        setUploadedUrls(finalUrls);
      }

      const res = await fetch("/api/services", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:        "PRINT",
          title:       data.title,
          description: data.description,
          specs: {
            material:        data.material,
            quality:         data.quality,
            color:           data.color,
            estimatedWeight: data.estimatedWeight,
            estimatedHours:  data.estimatedHours ?? 0,
            needsSupports:   data.needsSupports ?? false,
          },
          files: finalUrls,
        }),
      });

      if (!res.ok) throw new Error("Talep gönderilemedi");
      toast.success("Baskı talebiniz alındı! En kısa sürede fiyat teklifi sunacağız.");
      router.push("/account/service-requests");
    } catch {
      toast.error("Bir hata oluştu, lütfen tekrar deneyin");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const isProcessing = uploading || submitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* ── STL Yükleme (Zorunlu) ──────────────────────────────────────────── */}
      <div>
        <label className="text-white/60 text-sm mb-2 flex items-center gap-1.5 block">
          STL Dosyası
          <span className="text-[#FF6B35] text-xs font-bold">*</span>
          <span className="text-white/25 text-xs">(zorunlu)</span>
        </label>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            fileError
              ? "border-red-500/50 bg-red-500/[0.03] hover:border-red-500/70"
              : pendingFiles.length > 0
              ? "border-[#FF6B35]/40 bg-[#FF6B35]/[0.03] hover:border-[#FF6B35]/60"
              : "border-white/10 hover:border-[#FF6B35]/40"
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(Array.from(e.dataTransfer.files));
          }}
        >
          <Upload size={32} className={`mx-auto mb-3 ${pendingFiles.length > 0 ? "text-[#FF6B35]/60" : "text-white/20"}`} />
          <p className="text-white/40 text-sm">Dosyanızı buraya sürükleyin</p>
          <p className="text-white/20 text-xs mt-1">.stl · .3mf · .step · Maksimum 32 MB</p>
          <label className="mt-3 inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 cursor-pointer hover:bg-white/10 transition-colors">
            Dosya Seç
            <input
              type="file"
              accept=".stl,.3mf,.step"
              multiple
              className="hidden"
              onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
            />
          </label>
        </div>

        {fileError && (
          <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
            <AlertTriangle size={11} /> {fileError}
          </p>
        )}

        {/* Seçili dosya listesi */}
        {pendingFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {pendingFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg">
                <FileText size={16} className="text-[#FF6B35] flex-shrink-0" />
                <span className="text-white/70 text-sm flex-1 truncate">{file.name}</span>
                <span className="text-white/25 text-xs flex-shrink-0">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                {uploadedUrls.length > 0 ? (
                  <CheckCircle2 size={14} className="text-[#00D4AA] flex-shrink-0" />
                ) : (
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-white/30 hover:text-white flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            {uploadedUrls.length > 0 && (
              <p className="text-[#00D4AA] text-xs flex items-center gap-1">
                <CheckCircle2 size={11} /> Dosyalar yüklendi
              </p>
            )}
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

      {/* Malzeme */}
      <div>
        <label className="text-white/60 text-sm mb-2 block">Malzeme</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(MATERIAL_PRICES).map(([m, price]) => (
            <label key={m} className="cursor-pointer">
              <input {...register("material")} type="radio" value={m} className="sr-only" />
              <div className={`px-3 py-2.5 rounded-xl border transition-all ${
                mat === m
                  ? "bg-[#FF6B35]/10 border-[#FF6B35] text-[#FF6B35]"
                  : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/70"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{m}</span>
                  <span className="text-xs font-bold">{price}₺/g</span>
                </div>
                <p className="text-[10px] mt-0.5 opacity-70">{MATERIAL_DESC[m]}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kalite */}
        <div>
          <label className="text-white/60 text-sm mb-2 block">Kalite</label>
          <select
            {...register("quality")}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#FF6B35] focus:outline-none text-sm"
          >
            {Object.entries(QUALITY_LABELS).map(([val, label]) => (
              <option key={val} value={val} className="bg-[#0a0a0a]">{label}</option>
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
            {COLORS.map((c) => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}
          </select>
        </div>

        {/* Tahmini Ağırlık */}
        <div>
          <label className="text-white/60 text-sm mb-2 block">Tahmini Ağırlık (gram)</label>
          <input
            {...register("estimatedWeight")}
            type="number"
            min={1}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#FF6B35] focus:outline-none text-sm"
          />
          {errors.estimatedWeight && <p className="text-red-400 text-xs mt-1">{errors.estimatedWeight.message}</p>}
        </div>

        {/* Tahmini Baskı Süresi */}
        <div>
          <label className="text-white/60 text-sm mb-2 flex items-center gap-1.5 block">
            <Clock size={13} />
            Tahmini Baskı Süresi (saat)
          </label>
          <input
            {...register("estimatedHours")}
            type="number"
            min={0}
            step={0.5}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#FF6B35] focus:outline-none text-sm"
          />
          <p className="text-white/25 text-[11px] mt-1">Bilmiyorsanız boş bırakabilirsiniz</p>
        </div>
      </div>

      {/* Destek yapısı */}
      <label className="flex items-start gap-3 cursor-pointer p-3 bg-white/[0.02] border border-white/10 rounded-xl hover:border-white/20 transition-colors">
        <input {...register("needsSupports")} type="checkbox" className="mt-0.5 accent-[#FF6B35]" />
        <div>
          <p className="text-white/70 text-sm">Tasarımın destek yapısı gerektirdiğini düşünüyorum</p>
          <p className="text-white/30 text-xs mt-0.5">Köprüler, çıkıntılar veya açısal yüzeyler içeren tasarımlar</p>
        </div>
      </label>

      {/* Uyarılar */}
      <div className="space-y-2">
        {needs && (
          <div className="flex gap-2.5 p-3 bg-yellow-400/[0.07] border border-yellow-400/20 rounded-xl">
            <AlertTriangle size={15} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-300/80 text-xs leading-relaxed">
              <span className="font-semibold">Destek yapısı:</span> Ek malzeme ve işlem süresi gerektirdiğinden fiyat tahminin üzerinde çıkabilir.
            </p>
          </div>
        )}
        {overTimeNote && (
          <div className="flex gap-2.5 p-3 bg-blue-400/[0.07] border border-blue-400/20 rounded-xl">
            <Clock size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-300/80 text-xs leading-relaxed">
              <span className="font-semibold">Uzun süreli baskı:</span> 2 saati aşan baskılarda makine kullanım ücreti ayrıca eklenir.
            </p>
          </div>
        )}
      </div>

      {/* Tahmini Fiyat */}
      <div className="p-4 bg-[#FF6B35]/5 border border-[#FF6B35]/20 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">Tahmini Malzeme Maliyeti</span>
          <span className="text-[#FF6B35] text-xl font-bold">≈ {estimatedPrice.toFixed(0)}₺</span>
        </div>
        <div className="text-[11px] text-white/30 space-y-0.5 border-t border-white/5 pt-2">
          <div className="flex justify-between">
            <span>{mat} birim fiyat</span>
            <span>{MATERIAL_PRICES[mat]}₺/gram</span>
          </div>
          <div className="flex justify-between">
            <span>Kalite çarpanı ({quality})</span>
            <span>×{QUALITY_MULTIPLIERS[quality]}</span>
          </div>
          <div className="flex justify-between">
            <span>Tahmini ağırlık</span>
            <span>{weight}g</span>
          </div>
        </div>
        <div className="flex gap-1.5 items-start pt-1 border-t border-white/5">
          <Info size={12} className="text-white/25 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-white/30">Kesin fiyat inceleme sonrası tarafınıza bildirilecektir.</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-4 bg-[#FF6B35] hover:bg-[#ff5a1f] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isProcessing && <Loader2 size={18} className="animate-spin" />}
        {uploading ? "Dosyalar yükleniyor..." : submitting ? "Gönderiliyor..." : "Talebi Gönder"}
      </button>
    </form>
  );
}
