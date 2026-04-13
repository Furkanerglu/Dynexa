"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { CreditCard, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

// ─── Tipler ──────────────────────────────────────────────────────────────────

type ServiceInfo = {
  id:          string;
  title:       string;
  type:        string;
  description: string;
  price:       number;
  specs:       Record<string, unknown> | null;
  adminNotes:  string | null;
};

// ─── Validasyon ───────────────────────────────────────────────────────────────

const paymentSchema = z.object({
  cardHolder: z.string().min(3, "Kart sahibi adını giriniz"),
  cardNumber: z.string().regex(/^\d{16}$/, "16 haneli kart numarası giriniz"),
  expiry:     z.string().regex(/^\d{2}\/\d{2}$/, "AA/YY formatında giriniz"),
  cvv:        z.string().regex(/^\d{3,4}$/, "CVV giriniz"),
});

type PaymentForm = z.infer<typeof paymentSchema>;

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm transition-colors";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/40 text-xs mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = {
  PRINT:    "3D Baskı Hizmeti",
  SCANNING: "3D Tarama Hizmeti",
};

// ─── Ana Component ────────────────────────────────────────────────────────────

export default function ServiceCheckoutClient({ service }: { service: ServiceInfo }) {
  const router     = useRouter();
  const [done,     setDone]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
  });

  const submit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/services/${service.id}/payment`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error ?? "Ödeme başarısız");
        return;
      }
      setDone(true);
      toast.success("Ödeme alındı! Talebiniz işleme alındı.");
    } catch {
      toast.error("Ödeme sırasında bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  });

  // ── Başarı ekranı ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#00D4AA]/15 border border-[#00D4AA]/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-[#00D4AA]" />
          </div>
          <h2 className="text-white text-2xl font-black mb-2">Ödeme Alındı!</h2>
          <p className="text-white/40 text-sm mb-6">
            Talebiniz ekibimize iletildi. En kısa sürede işleme alınacak.
          </p>
          <Link
            href="/account/orders"
            className="inline-block px-6 py-3 bg-[#FF6B35] hover:bg-[#e55a28] text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Taleplerime Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Geri butonu */}
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={15} /> Taleplerime Dön
        </Link>

        <h1 className="text-3xl font-black tracking-tighter text-white mb-8">Servis Ödemesi</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── Sol — ödeme formu ── */}
          <div className="lg:col-span-3">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-semibold flex items-center gap-2 mb-2">
                <CreditCard size={18} className="text-[#FF6B35]" />
                Kart Bilgileri
              </h2>

              <Field label="Kart Sahibi" error={errors.cardHolder?.message}>
                <input {...register("cardHolder")} placeholder="Ad Soyad" className={inputCls} />
              </Field>

              <Field label="Kart Numarası" error={errors.cardNumber?.message}>
                <input
                  {...register("cardNumber")}
                  placeholder="0000000000000000"
                  maxLength={16}
                  className={`${inputCls} font-mono tracking-widest`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Son Kullanma" error={errors.expiry?.message}>
                  <input {...register("expiry")} placeholder="AA/YY" maxLength={5} className={inputCls} />
                </Field>
                <Field label="CVV" error={errors.cvv?.message}>
                  <input
                    {...register("cvv")}
                    placeholder="•••"
                    maxLength={4}
                    type="password"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="p-3 bg-white/5 rounded-lg flex items-center gap-2">
                <span className="text-white/40 text-xs">🔒 İyzico güvenli ödeme altyapısı</span>
              </div>

              <button
                onClick={submit}
                disabled={submitting}
                className="w-full py-4 bg-[#FF6B35] hover:bg-[#ff5a1f] disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {formatPrice(service.price)} Öde ve Onayla
              </button>
            </div>
          </div>

          {/* ── Sağ — talep özeti ── */}
          <div className="lg:col-span-2">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sticky top-24 space-y-4">
              <h2 className="text-white font-bold text-sm uppercase tracking-wide mb-3">Talep Özeti</h2>

              <div className="space-y-1">
                <p className="text-[10px] text-white/30 uppercase tracking-wide">{TYPE_LABEL[service.type] ?? service.type}</p>
                <p className="text-white font-semibold text-sm leading-snug">{service.title}</p>
              </div>

              <p className="text-white/45 text-xs leading-relaxed line-clamp-3">{service.description}</p>

              {service.specs && Object.keys(service.specs).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(service.specs).map(([k, v]) => (
                    <div key={k} className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1">
                      <span className="text-[9px] text-white/30">{k}: </span>
                      <span className="text-white/60 text-[10px] font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}

              {service.adminNotes && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-[10px] text-white/30 uppercase tracking-wide mb-1">Yetkili Notu</p>
                  <p className="text-white/60 text-xs">{service.adminNotes}</p>
                </div>
              )}

              <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                <span className="text-white/50 text-sm">Toplam</span>
                <span className="text-[#FF6B35] font-black text-xl">{formatPrice(service.price)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
