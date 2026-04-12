"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { X } from "lucide-react";

interface FilterSidebarProps {
  categories: { id: string; name: string; slug: string }[];
  brands: string[];
  showMaterialFilter?: boolean;
}

export function FilterSidebar({ categories, brands, showMaterialFilter }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  const currentCategory = searchParams.get("category") || "";
  const currentBrand = searchParams.get("brand") || "";
  const currentMaterial = searchParams.get("material") || "";
  const inStock = searchParams.get("inStock") === "true";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  const hasFilters = currentCategory || currentBrand || currentMaterial || inStock || minPrice || maxPrice;

  const clearFilters = () => {
    router.push(pathname);
  };

  const materials = ["PLA", "PETG", "ABS", "ASA", "TPU", "PA", "CF"];

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-6 sticky top-24">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Filtreler</h3>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[#FF6B35] text-xs hover:underline"
            >
              <X size={12} />
              Temizle
            </button>
          )}
        </div>

        {/* Kategori */}
        {categories.length > 0 && (
          <div>
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">
              Kategori
            </p>
            <div className="space-y-1">
              <button
                onClick={() => router.push(`${pathname}?${createQueryString("category", "")}`)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !currentCategory
                    ? "bg-[#FF6B35]/10 text-[#FF6B35]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Tümü
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    router.push(`${pathname}?${createQueryString("category", cat.slug)}`)
                  }
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentCategory === cat.slug
                      ? "bg-[#FF6B35]/10 text-[#FF6B35]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Marka (filament sayfası için) */}
        {brands.length > 0 && (
          <div>
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">
              Marka
            </p>
            <div className="space-y-1">
              <button
                onClick={() => router.push(`${pathname}?${createQueryString("brand", "")}`)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !currentBrand
                    ? "bg-[#FF6B35]/10 text-[#FF6B35]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Tümü
              </button>
              {brands.map((brand) => (
                <button
                  key={brand}
                  onClick={() =>
                    router.push(`${pathname}?${createQueryString("brand", brand)}`)
                  }
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentBrand === brand
                      ? "bg-[#FF6B35]/10 text-[#FF6B35]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Malzeme (filament için) */}
        {showMaterialFilter && (
          <div>
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">
              Malzeme
            </p>
            <div className="flex flex-wrap gap-2">
              {materials.map((mat) => (
                <button
                  key={mat}
                  onClick={() =>
                    router.push(
                      `${pathname}?${createQueryString("material", currentMaterial === mat ? "" : mat)}`
                    )
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                    currentMaterial === mat
                      ? "bg-[#FF6B35]/10 border-[#FF6B35]/40 text-[#FF6B35]"
                      : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {mat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fiyat Aralığı */}
        <div>
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">
            Fiyat (₺)
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              defaultValue={minPrice}
              onBlur={(e) =>
                router.push(`${pathname}?${createQueryString("minPrice", e.target.value)}`)
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:border-[#FF6B35] focus:outline-none"
            />
            <input
              type="number"
              placeholder="Max"
              defaultValue={maxPrice}
              onBlur={(e) =>
                router.push(`${pathname}?${createQueryString("maxPrice", e.target.value)}`)
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:border-[#FF6B35] focus:outline-none"
            />
          </div>
        </div>

        {/* Stok */}
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              router.push(`${pathname}?${createQueryString("inStock", inStock ? "" : "true")}`)
            }
            className={`relative w-11 h-6 rounded-full transition-colors ${
              inStock ? "bg-[#FF6B35]" : "bg-white/10"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                inStock ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-white/60 text-sm">Sadece stokta olanlar</span>
        </div>
      </div>
    </aside>
  );
}
