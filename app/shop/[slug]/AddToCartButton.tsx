"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { ShoppingCart, Check } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  stock: number;
}

export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
    });
    toast.success(`${product.name} sepete eklendi`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (product.stock === 0) {
    return (
      <button
        disabled
        className="w-full py-4 bg-white/5 border border-white/10 text-white/30 rounded-xl cursor-not-allowed font-semibold"
      >
        Stokta Yok
      </button>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleAdd}
        className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
          added
            ? "bg-[#00D4AA] text-white"
            : "bg-[#FF6B35] hover:bg-[#ff5a1f] text-white"
        }`}
      >
        {added ? (
          <>
            <Check size={20} />
            Sepete Eklendi
          </>
        ) : (
          <>
            <ShoppingCart size={20} />
            Sepete Ekle
          </>
        )}
      </button>
    </div>
  );
}
