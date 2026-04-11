"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, CreditCard, MapPin, ShoppingBag } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  fullName: z.string().min(3, "Ad soyad giriniz"),
  phone: z.string().min(10, "Geçerli telefon giriniz"),
  city: z.string().min(2, "Şehir giriniz"),
  district: z.string().min(2, "İlçe giriniz"),
  line: z.string().min(5, "Adres giriniz"),
  addressTitle: z.string().min(2, "Adres başlığı giriniz"),
  cardHolder: z.string().min(3, "Kart sahibi adını giriniz"),
  cardNumber: z.string().regex(/^\d{16}$/, "16 haneli kart numarası giriniz"),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "MM/YY formatında giriniz"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV giriniz"),
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"address" | "payment">("address");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!session) {
    return (
      <div className="min-h-screen bg-[#020202] pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 mb-4">Ödeme yapmak için giriş yapmanız gerekiyor</p>
          <Link href="/login" className="px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-semibold">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#020202] pt-24 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto text-white/10 mb-4" />
          <p className="text-white/40 mb-4">Sepetiniz boş</p>
          <Link href="/shop" className="px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-semibold">
            Alışverişe Başla
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity, price: i.price })),
          address: {
            title: data.addressTitle,
            fullName: data.fullName,
            phone: data.phone,
            city: data.city,
            district: data.district,
            line: data.line,
          },
          payment: {
            cardHolder: data.cardHolder,
            cardNumber: data.cardNumber,
            expiry: data.expiry,
            cvv: data.cvv,
          },
          totalAmount: totalPrice(),
        }),
      });

      if (!res.ok) throw new Error();

      clearCart();
      toast.success("Siparişiniz alındı! Teşekkürler.");
      router.push("/account/orders");
    } catch {
      toast.error("Ödeme işlemi başarısız, lütfen tekrar deneyin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black tracking-tighter text-white mb-10">
          Ödeme
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            {/* Steps */}
            <div className="flex gap-4 mb-8">
              {[
                { key: "address", icon: MapPin, label: "Adres" },
                { key: "payment", icon: CreditCard, label: "Ödeme" },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setStep(key as "address" | "payment")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    step === key
                      ? "bg-[#FF6B35]/10 border border-[#FF6B35]/40 text-[#FF6B35]"
                      : "bg-white/5 border border-white/10 text-white/40"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {step === "address" && (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <MapPin size={18} className="text-[#FF6B35]" />
                    Teslimat Adresi
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input {...register("addressTitle")} placeholder="Adres Başlığı (Ev, İş...)" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
                      {errors.addressTitle && <p className="text-red-400 text-xs mt-1">{errors.addressTitle.message}</p>}
                    </div>
                    <div>
                      <input {...register("fullName")} placeholder="Ad Soyad" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
                      {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
                    </div>
                    <div>
                      <input {...register("phone")} placeholder="Telefon" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
                      {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                    <div>
                      <input {...register("city")} placeholder="Şehir" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
                      {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city.message}</p>}
                    </div>
                    <div>
                      <input {...register("district")} placeholder="İlçe" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
                      {errors.district && <p className="text-red-400 text-xs mt-1">{errors.district.message}</p>}
                    </div>
                  </div>

                  <div>
                    <textarea {...register("line")} rows={2} placeholder="Açık adres..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm resize-none" />
                    {errors.line && <p className="text-red-400 text-xs mt-1">{errors.line.message}</p>}
                  </div>

                  <button type="button" onClick={() => setStep("payment")} className="w-full py-3 bg-[#FF6B35] hover:bg-[#ff5a1f] text-white font-semibold rounded-xl transition-colors">
                    Ödemeye Geç
                  </button>
                </div>
              )}

              {step === "payment" && (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <CreditCard size={18} className="text-[#FF6B35]" />
                    Kart Bilgileri
                  </h2>

                  <div>
                    <input {...register("cardHolder")} placeholder="Kart Sahibinin Adı" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
                    {errors.cardHolder && <p className="text-red-400 text-xs mt-1">{errors.cardHolder.message}</p>}
                  </div>

                  <div>
                    <input {...register("cardNumber")} placeholder="Kart Numarası (16 hane)" maxLength={16} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm font-mono tracking-widest" />
                    {errors.cardNumber && <p className="text-red-400 text-xs mt-1">{errors.cardNumber.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input {...register("expiry")} placeholder="AA/YY" maxLength={5} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
                      {errors.expiry && <p className="text-red-400 text-xs mt-1">{errors.expiry.message}</p>}
                    </div>
                    <div>
                      <input {...register("cvv")} placeholder="CVV" maxLength={4} type="password" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm" />
                      {errors.cvv && <p className="text-red-400 text-xs mt-1">{errors.cvv.message}</p>}
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg flex items-center gap-2">
                    <span className="text-white/40 text-xs">🔒 İyzico güvenli ödeme altyapısı</span>
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-4 bg-[#FF6B35] hover:bg-[#ff5a1f] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {formatPrice(totalPrice())} Öde
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sticky top-24">
              <h2 className="text-white font-bold mb-4">Sipariş ({items.length} ürün)</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-white/60 truncate max-w-[160px]">
                      {item.name} <span className="text-white/30">×{item.quantity}</span>
                    </span>
                    <span className="text-white flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="text-white font-semibold">Toplam</span>
                <span className="text-[#FF6B35] font-black text-lg">{formatPrice(totalPrice())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
