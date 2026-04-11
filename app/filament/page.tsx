import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { Suspense } from "react";
import {
  MOCK_FILAMENT_CATEGORIES,
  MOCK_FILAMENT_BRANDS,
  MOCK_FILAMENTS,
} from "@/lib/mockData";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Filament Shop | DYNEXA",
  description: "PLA, PETG, ABS, TPU, CF, PA ve daha fazlası. Premium markaların en iyi filamentleri.",
};

interface SearchParams {
  category?: string;
  brand?: string;
  material?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
}

async function getFilamentData() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { CategoryType } = await import("@prisma/client");

    const [categories, brandRows, products] = await Promise.all([
      prisma.category.findMany({
        where: { type: CategoryType.FILAMENT },
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        where: { category: { type: CategoryType.FILAMENT }, brand: { not: null } },
        select: { brand: true },
        distinct: ["brand"],
      }),
      prisma.product.findMany({
        where: { isActive: true, category: { type: CategoryType.FILAMENT } },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      categories,
      brands: brandRows.map((b) => b.brand!).filter(Boolean),
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        images: p.images,
        stock: p.stock,
        brand: p.brand,
        category: p.category,
        specs: p.specs as Record<string, string> | null,
      })),
    };
  } catch {
    return {
      categories: MOCK_FILAMENT_CATEGORIES,
      brands: MOCK_FILAMENT_BRANDS,
      products: MOCK_FILAMENTS.map((f) => ({
        ...f,
        specs: null,
        category: { id: f.category.slug, name: f.category.name, slug: f.category.slug, type: "FILAMENT" as const },
      })),
    };
  }
}

async function FilamentContent({ searchParams }: { searchParams: SearchParams }) {
  const { categories, brands, products: allProducts } = await getFilamentData();

  let products = allProducts;

  if (searchParams.category) {
    products = products.filter((p) => p.category.slug === searchParams.category);
  }
  if (searchParams.brand) {
    products = products.filter((p) => p.brand === searchParams.brand);
  }
  if (searchParams.inStock === "true") {
    products = products.filter((p) => p.stock > 0);
  }
  if (searchParams.material) {
    products = products.filter(
      (p) =>
        p.specs &&
        String((p.specs as Record<string, string>).material ?? "")
          .toLowerCase()
          .includes(searchParams.material!.toLowerCase())
    );
  }
  if (searchParams.minPrice) {
    products = products.filter((p) => p.price >= parseFloat(searchParams.minPrice!));
  }
  if (searchParams.maxPrice) {
    products = products.filter((p) => p.price <= parseFloat(searchParams.maxPrice!));
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <FilterSidebar categories={categories} brands={brands} showMaterialFilter />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <p className="text-white/40 text-sm">
            <span className="text-white font-medium">{products.length}</span> ürün bulundu
          </p>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-24 text-white/30">
            <p>Bu kriterlere uygun ürün bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                salePrice={product.salePrice}
                image={product.images[0]}
                stock={product.stock}
                brand={product.brand}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function FilamentPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="min-h-screen bg-[#020202] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-[#00D4AA] text-sm font-medium tracking-widest uppercase mb-2">
            Filament
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
            Premium Filament
          </h1>
          <p className="text-white/40 mt-2">
            PLA, PETG, ABS, TPU, CF, PA ve daha fazlası
          </p>
        </div>
        <Suspense fallback={<div className="text-white/40">Yükleniyor...</div>}>
          <FilamentContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
