"use client";

import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#020202] pt-24 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-white/10 mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Sepetiniz boş</h1>
          <p className="text-white/40 mb-8">Alışverişe başlayın, harika ürünler sizi bekliyor!</p>
          <Link
            href="/shop"
            className="px-6 py-3 bg-[#FF6B35] hover:bg-[#ff5a1f] text-white font-semibold rounded-xl transition-colors inline-flex items-center gap-2"
          >
            Mağazaya Git
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-black tracking-tighter text-white">
            Sepetim <span className="text-white/30 text-xl font-normal">({items.length})</span>
          </h1>
          <button
            onClick={clearCart}
            className="text-white/30 hover:text-white text-sm transition-colors"
          >
            Sepeti Temizle
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-white/[0.03] border border-white/10 rounded-2xl"
              >
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                  <Image
                    src={item.image || "/images/placeholder.jpg"}
                    alt={item.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/shop/${item.slug}`}
                    className="text-white font-medium hover:text-[#FF6B35] transition-colors line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <p className="text-[#FF6B35] font-bold mt-1">
                    {formatPrice(item.price)}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-white font-medium w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                    <span className="text-white/40 text-sm ml-2">
                      = {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-white/20 hover:text-white transition-colors self-start"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sticky top-24">
              <h2 className="text-white font-bold text-lg mb-6">Sipariş Özeti</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Ara toplam</span>
                  <span className="text-white">{formatPrice(totalPrice())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Kargo</span>
                  <span className="text-[#00D4AA]">Ücretsiz</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-semibold">Toplam</span>
                  <span className="text-white text-xl font-black">
                    {formatPrice(totalPrice())}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full py-4 bg-[#FF6B35] hover:bg-[#ff5a1f] text-white text-center font-semibold rounded-xl transition-colors"
              >
                Ödemeye Geç
              </Link>

              <Link
                href="/shop"
                className="block w-full py-3 text-white/40 text-center text-sm mt-3 hover:text-white transition-colors"
              >
                Alışverişe Devam Et
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
