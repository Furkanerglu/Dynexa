"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2, CreditCard, MapPin, ShoppingBag,
  CheckCircle2, Plus, ChevronRight,
} from "lucide-react";
import Link from "next/link";

// ─── Tipler ──────────────────────────────────────────────────────────────────

type Address = {
  id: string; title: string; fullName: string; phone: string;
  city: string; district: string; line: string; isDefault: boolean;
};

// ─── Şemalar ─────────────────────────────────────────────────────────────────

const newAddressSchema = z.object({
  title:    z.string().min(1, "Adres başlığı giriniz"),
  fullName: z.string().min(3, "Ad soyad giriniz"),
  phone:    z.string().min(10, "Geçerli telefon giriniz"),
  city:     z.string().min(2, "Şehir giriniz"),
  district: z.string().min(2, "İlçe giriniz"),
  line:     z.string().min(5, "Açık adres giriniz"),
});

const paymentSchema = z.object({
  cardHolder: z.string().min(3, "Kart sahibi adını giriniz"),
  cardNumber: z.string().regex(/^\d{16}$/, "16 haneli kart numarası giriniz"),
  expiry:     z.string().regex(/^\d{2}\/\d{2}$/, "AA/YY formatında giriniz"),
  cvv:        z.string().regex(/^\d{3,4}$/, "CVV giriniz"),
});

type NewAddressForm = z.infer<typeof newAddressSchema>;
type PaymentForm    = z.infer<typeof paymentSchema>;

// ─── Input bileşeni ───────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/40 text-xs mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none text-sm transition-colors";

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();

  const [step,            setStep]            = useState<"address" | "payment">("address");
  const [addresses,       setAddresses]       = useState<Address[]>([]);
  const [selectedId,      setSelectedId]      = useState<string | null>(null);
  const [showNewForm,     setShowNewForm]     = useState(false);
  const [loadingAddr,     setLoadingAddr]     = useState(true);
  const [savingAddr,      setSavingAddr]      = useState(false);
  const [submitting,      setSubmitting]      = useState(false);

  // ─── Adresleri çek ───────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    fetch("/api/user/addresses")
      .then((r) => r.json())
      .then((data: Address[]) => {
        setAddresses(data);
        // Varsayılan adresi seç
        const def = data.find((a) => a.isDefault) ?? data[0];
        if (def) setSelectedId(def.id);
        else setShowNewForm(true); // Hiç adres yoksa formu aç
      })
      .catch(() => setShowNewForm(true))
      .finally(() => setLoadingAddr(false));
  }, [session]);

  // ─── Form hook'ları ───────────────────────────────────────────────
  const addrForm = useForm<NewAddressForm>({ resolver: zodResolver(newAddressSchema) });
  const payForm  = useForm<PaymentForm>({  resolver: zodResolver(paymentSchema) });

  // ─── Guard'lar ────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen bg-[#020202] pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 mb-4">Ödeme yapmak için giriş yapmanız gerekiyor</p>
          <Link href="/login" className="px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-semibold">Giriş Yap</Link>
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
          <Link href="/shop" className="px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-semibold">Alışverişe Başla</Link>
        </div>
      </div>
    );
  }

  // ─── Yeni adres kaydet ────────────────────────────────────────────
  const saveNewAddress = addrForm.handleSubmit(async (data) => {
    setSavingAddr(true);
    try {
      const res  = await fetch("/api/user/addresses", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...data, isDefault: addresses.length === 0 }),
      });
      if (!res.ok) throw new Error();
      const saved: Address = await res.json();
      setAddresses((prev) => [...prev, saved]);
      setSelectedId(saved.id);
      setShowNewForm(false);
      addrForm.reset();
      toast.success("Adres kaydedildi");
    } catch {
      toast.error("Adres kaydedilemedi");
    } finally {
      setSavingAddr(false);
    }
  });

  // ─── Adres adımını onayla → ödemeye geç ──────────────────────────
  const proceedToPayment = () => {
    if (!selectedId) { toast.error("Lütfen bir teslimat adresi seçin"); return; }
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Siparişi tamamla ─────────────────────────────────────────────
  const submitOrder = payForm.handleSubmit(async (data) => {
    if (!selectedId) { setStep("address"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items:       items.map((i) => ({ productId: i.id, quantity: i.quantity, price: i.price })),
          addressId:   selectedId,
          payment:     data,
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
      setSubmitting(false);
    }
  });

  const selectedAddress = addresses.find((a) => a.id === selectedId);

  return (
    <div className="min-h-screen bg-[#020202] pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black tracking-tighter text-white mb-10">Ödeme</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Sol — form alanı ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Step tabs */}
            <div className="flex items-center gap-3 mb-6">
              {[
                { key: "address", icon: MapPin,     label: "Adres"  },
                { key: "payment", icon: CreditCard, label: "Ödeme"  },
              ].map(({ key, icon: Icon, label }, idx) => {
                const active = step === key;
                const done   = step === "payment" && key === "address";
                return (
                  <button
                    key={key}
                    onClick={() => key === "address" && setStep("address")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      active ? "bg-[#FF6B35]/10 border border-[#FF6B35]/40 text-[#FF6B35]"
                      : done  ? "bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-[#00D4AA]"
                      :         "bg-white/5 border border-white/10 text-white/30"
                    }`}
                  >
                    {done ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                    {label}
                  </button>
                );
              })}
            </div>

            {/* ══ ADRES ADIMI ══════════════════════════════════════════ */}
            {step === "address" && (
              <div className="space-y-4">
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                  <h2 className="text-white font-semibold flex items-center gap-2 mb-5">
                    <MapPin size={18} className="text-[#FF6B35]" />
                    Teslimat Adresi
                  </h2>

                  {loadingAddr ? (
                    <div className="flex items-center gap-2 text-white/30 text-sm py-4">
                      <Loader2 size={16} className="animate-spin" />
                      Adresler yükleniyor...
                    </div>
                  ) : (
                    <>
                      {/* Kayıtlı adresler */}
                      {addresses.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {addresses.map((addr) => {
                            const sel = selectedId === addr.id;
                            return (
                              <button
                                key={addr.id}
                                type="button"
                                onClick={() => { setSelectedId(addr.id); setShowNewForm(false); }}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                  sel
                                    ? "border-[#FF6B35]/60 bg-[#FF6B35]/[0.07]"
                                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-white text-sm font-semibold">{addr.title}</span>
                                      {addr.isDefault && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/20">
                                          Varsayılan
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-white/60 text-xs">{addr.fullName} · {addr.phone}</p>
                                    <p className="text-white/40 text-xs mt-0.5 truncate">
                                      {addr.line}, {addr.district} / {addr.city}
                                    </p>
                                  </div>
                                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                                    sel ? "border-[#FF6B35] bg-[#FF6B35]" : "border-white/20"
                                  }`}>
                                    {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Yeni adres ekle butonu */}
                      {!showNewForm && (
                        <button
                          type="button"
                          onClick={() => { setShowNewForm(true); setSelectedId(null); }}
                          className="w-full flex items-center justify-center gap-2 p-3.5 border border-dashed border-white/20 rounded-xl text-white/40 hover:text-white hover:border-white/40 transition-all text-sm"
                        >
                          <Plus size={15} />
                          Yeni Adres Ekle
                        </button>
                      )}

                      {/* Yeni adres formu */}
                      {showNewForm && (
                        <div className="border border-white/15 rounded-xl p-5 space-y-4 bg-white/[0.02]">
                          <div className="flex items-center justify-between">
                            <p className="text-white text-sm font-medium">Yeni Adres</p>
                            {addresses.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNewForm(false);
                                  setSelectedId(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null);
                                }}
                                className="text-white/30 hover:text-white text-xs transition-colors"
                              >
                                İptal
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Adres Başlığı" error={addrForm.formState.errors.title?.message}>
                              <input {...addrForm.register("title")} placeholder="Ev, İş..." className={inputCls} />
                            </Field>
                            <Field label="Ad Soyad" error={addrForm.formState.errors.fullName?.message}>
                              <input {...addrForm.register("fullName")} placeholder="Ad Soyad" className={inputCls} />
                            </Field>
                            <Field label="Telefon" error={addrForm.formState.errors.phone?.message}>
                              <input {...addrForm.register("phone")} placeholder="05xx xxx xx xx" className={inputCls} />
                            </Field>
                            <Field label="Şehir" error={addrForm.formState.errors.city?.message}>
                              <input {...addrForm.register("city")} placeholder="İstanbul" className={inputCls} />
                            </Field>
                            <Field label="İlçe" error={addrForm.formState.errors.district?.message}>
                              <input {...addrForm.register("district")} placeholder="Kadıköy" className={inputCls} />
                            </Field>
                          </div>
                          <Field label="Açık Adres" error={addrForm.formState.errors.line?.message}>
                            <textarea {...addrForm.register("line")} rows={2} placeholder="Sokak, bina no, daire..." className={`${inputCls} resize-none`} />
                          </Field>

                          <button
                            type="button"
                            onClick={saveNewAddress}
                            disabled={savingAddr}
                            className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {savingAddr ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            Adresi Kaydet ve Seç
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={proceedToPayment}
                  disabled={!selectedId}
                  className="w-full py-4 bg-[#FF6B35] hover:bg-[#ff5a1f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Ödemeye Geç
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* ══ ÖDEME ADIMI ══════════════════════════════════════════ */}
            {step === "payment" && (
              <div className="space-y-4">
                {/* Seçili adres özeti */}
                {selectedAddress && (
                  <div className="bg-[#00D4AA]/[0.05] border border-[#00D4AA]/20 rounded-xl p-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[#00D4AA] text-xs font-medium mb-1 flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        Teslimat Adresi
                      </p>
                      <p className="text-white text-sm font-medium">{selectedAddress.title} — {selectedAddress.fullName}</p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {selectedAddress.line}, {selectedAddress.district} / {selectedAddress.city}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep("address")}
                      className="text-white/30 hover:text-white text-xs transition-colors flex-shrink-0"
                    >
                      Değiştir
                    </button>
                  </div>
                )}

                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <CreditCard size={18} className="text-[#FF6B35]" />
                    Kart Bilgileri
                  </h2>

                  <Field label="Kart Sahibi" error={payForm.formState.errors.cardHolder?.message}>
                    <input {...payForm.register("cardHolder")} placeholder="Ad Soyad" className={inputCls} />
                  </Field>
                  <Field label="Kart Numarası" error={payForm.formState.errors.cardNumber?.message}>
                    <input {...payForm.register("cardNumber")} placeholder="0000 0000 0000 0000" maxLength={16} className={`${inputCls} font-mono tracking-widest`} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Son Kullanma" error={payForm.formState.errors.expiry?.message}>
                      <input {...payForm.register("expiry")} placeholder="AA/YY" maxLength={5} className={inputCls} />
                    </Field>
                    <Field label="CVV" error={payForm.formState.errors.cvv?.message}>
                      <input {...payForm.register("cvv")} placeholder="•••" maxLength={4} type="password" className={inputCls} />
                    </Field>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg flex items-center gap-2">
                    <span className="text-white/40 text-xs">🔒 İyzico güvenli ödeme altyapısı</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => submitOrder()}
                    disabled={submitting}
                    className="w-full py-4 bg-[#FF6B35] hover:bg-[#ff5a1f] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 size={18} className="animate-spin" />}
                    {formatPrice(totalPrice())} Öde
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Sağ — sipariş özeti ── */}
          <div className="lg:col-span-1">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sticky top-24">
              <h2 className="text-white font-bold mb-4">Sipariş ({items.length} ürün)</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-white/60 truncate max-w-[160px]">
                      {item.name} <span className="text-white/30">×{item.quantity}</span>
                    </span>
                    <span className="text-white flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
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
