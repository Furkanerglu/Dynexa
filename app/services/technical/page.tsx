"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Wrench } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const schema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır"),
  description: z.string().min(30, "Lütfen sorunu daha detaylı açıklayın"),
  printerModel: z.string().min(2, "Yazıcı modelini giriniz"),
  issueType: z.enum(["calibration", "extruder", "hotend", "electronics", "mechanical", "software", "other"]),
});

type FormData = z.infer<typeof schema>;

const ISSUE_TYPES = {
  calibration: "Kalibrasyon Sorunu",
  extruder: "Ekstruder Sorunu",
  hotend: "Hotend / Nozzle Sorunu",
  electronics: "Elektronik Arıza",
  mechanical: "Mekanik Arıza",
  software: "Yazılım / Firmware",
  other: "Diğer",
};

const common_printers = [
  "Bambu Lab X1 Carbon", "Bambu Lab P1S", "Bambu Lab A1",
  "Creality Ender 3", "Creality Ender 3 V2", "Creality Ender 3 Pro",
  "Creality Ender 5", "Prusa MK3S+", "Prusa MINI+",
  "Voron 2.4", "Voron Trident", "RatRig V-Core 3",
];

export default function TechnicalServicePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { issueType: "other" },
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
          type: "TECHNICAL",
          title: data.title,
          description: data.description,
          specs: { printerModel: data.printerModel, issueType: data.issueType },
          files: [],
        }),
      });

      if (!res.ok) throw new Error();
      toast.success("Servis talebiniz alındı! En kısa sürede sizinle iletişime geçeceğiz.");
      router.push("/account/service-requests");
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[#FF6B35] text-sm font-medium tracking-widest uppercase mb-4">Servis</p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4">
            Teknik Servis
          </h1>
          <p className="text-white/40 max-w-lg mx-auto">
            Yazıcınızla ilgili herhangi bir sorun mu yaşıyorsunuz? Uzman ekibimiz yardımcı olacak.
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center">
              <Wrench size={20} className="text-[#FF6B35]" />
            </div>
            <h2 className="text-white font-bold text-xl">Servis Talebi Oluştur</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-white/60 text-sm mb-1.5 block">Yazıcı Modeli</label>
                <input
                  {...register("printerModel")}
                  list="printer-list"
                  placeholder="Ender 3, Bambu X1C..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm"
                />
                <datalist id="printer-list">
                  {common_printers.map((p) => <option key={p} value={p} />)}
                </datalist>
                {errors.printerModel && <p className="text-red-400 text-xs mt-1">{errors.printerModel.message}</p>}
              </div>

              <div>
                <label className="text-white/60 text-sm mb-1.5 block">Sorun Tipi</label>
                <select
                  {...register("issueType")}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#FF6B35] focus:outline-none text-sm"
                >
                  {Object.entries(ISSUE_TYPES).map(([val, label]) => (
                    <option key={val} value={val} className="bg-[#0a0a0a]">{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Sorun Başlığı</label>
              <input
                {...register("title")}
                placeholder="Ekstruder filament çekmiy or, Z ekseni titreşiyor..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm"
              />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Sorunu Detaylı Açıklayın</label>
              <textarea
                {...register("description")}
                rows={5}
                placeholder="Sorunun ne zaman başladığı, hangi koşullarda ortaya çıktığı, daha önce denedikleriniz..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm resize-none"
              />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
              <p className="text-white/60 text-sm">
                💡 <strong className="text-white">İpucu:</strong> Sorunu mümkün olduğunca detaylı açıklarsanız daha hızlı çözüm sunabiliriz. Video veya fotoğraf paylaşmak isterseniz iletişime geçebilirsiniz.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#FF6B35] hover:bg-[#ff5a1f] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Servis Talebi Gönder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
