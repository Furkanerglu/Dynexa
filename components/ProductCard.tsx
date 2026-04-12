"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Package } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  image: string;
  stock: number;
  brand?: string | null;
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  salePrice,
  image,
  stock,
  brand,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id,
      name,
      price: salePrice || price,
      image,
      slug,
    });
    toast.success(`${name} sepete eklendi`);
  };

  const displayPrice = salePrice || price;

  return (
    <Link href={`/shop/${slug}`} className="group block">
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 group-hover:border-[#FF6B35]/40 group-hover:shadow-[0_0_30px_rgba(255,107,53,0.1)]">
        {/* Image */}
        <div className="relative h-52 overflow-hidden bg-white rounded-t-2xl">
          <Image
            src={image || "/images/placeholder.jpg"}
            alt={name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
          {/* Kartın koyu rengiyle yumuşak geçiş */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
          {stock === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white/60 text-sm font-medium">Stokta Yok</span>
            </div>
          )}
          {stock > 0 && stock <= 5 && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-[#FF6B35]/20 border border-[#FF6B35]/30 rounded-full">
              <span className="text-[#FF6B35] text-xs">Son {stock} adet</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {brand && (
            <p className="text-white/30 text-xs font-medium uppercase tracking-wider mb-1">
              {brand}
            </p>
          )}
          <h3 className="text-white text-sm font-medium leading-snug line-clamp-2 mb-3 group-hover:text-[#FF6B35] transition-colors">
            {name}
          </h3>

          {/* Price + Cart */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-bold">
                {formatPrice(displayPrice)}
              </span>
              {salePrice && (
                <span className="text-white/30 text-sm line-through ml-2">
                  {formatPrice(price)}
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={stock === 0}
              className="w-9 h-9 rounded-xl bg-[#FF6B35]/10 hover:bg-[#FF6B35] border border-[#FF6B35]/20 hover:border-[#FF6B35] text-[#FF6B35] hover:text-white flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
