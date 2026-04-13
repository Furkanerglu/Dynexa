export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "./AddToCartButton";
import { ProductImageGallery } from "./ProductImageGallery";
import { ProductFeatures } from "./ProductFeatures";
import type { FeatureSection } from "./ProductFeatures";
import { Package, Star, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return { title: "Ürün Bulunamadı" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
  };
}


export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!product) notFound();

  const rawSpecs = product.specs as Record<string, unknown> | null;
  // features'ı specs'ten ayır — ürün sayfasında ayrı render edilecek
  const features: FeatureSection[] = Array.isArray(rawSpecs?.features)
    ? (rawSpecs!.features as FeatureSection[])
    : [];
  const specs = rawSpecs
    ? Object.fromEntries(Object.entries(rawSpecs).filter(([k]) => k !== "features"))
    : null;

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : null;

  return (
    <div className="min-h-screen bg-[#020202] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-white/40">
          <Link href="/shop" className="hover:text-white flex items-center gap-1">
            <ChevronLeft size={14} />
            Mağaza
          </Link>
          <span>/</span>
          <span className="text-white/60">{product.category.name}</span>
          <span>/</span>
          <span className="text-white truncate max-w-xs">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* ── İnteraktif Görsel Galerisi ── */}
          <div>
            <ProductImageGallery images={product.images} name={product.name} />
          </div>

          {/* ── Ürün Detayları ── */}
          <div className="space-y-6">
            {product.brand && (
              <p className="text-[#FF6B35] text-sm font-medium uppercase tracking-wider">
                {product.brand}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white">
              {product.name}
            </h1>

            {/* Puan */}
            {avgRating && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={star <= Math.round(avgRating) ? "text-[#FF6B35] fill-[#FF6B35]" : "text-white/20"}
                    />
                  ))}
                </div>
                <span className="text-white/40 text-sm">
                  {avgRating.toFixed(1)} ({product.reviews.length} yorum)
                </span>
              </div>
            )}

            {/* Fiyat */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-white">
                {formatPrice(product.salePrice ? Number(product.salePrice) : Number(product.price))}
              </span>
              {product.salePrice && (
                <span className="text-white/30 text-lg line-through">
                  {formatPrice(Number(product.price))}
                </span>
              )}
            </div>

            {/* Stok */}
            <div className="flex items-center gap-2">
              <Package size={16} className={product.stock > 0 ? "text-[#00D4AA]" : "text-white/30"} />
              <span className={`text-sm ${product.stock > 0 ? "text-[#00D4AA]" : "text-white/30"}`}>
                {product.stock > 0 ? `${product.stock} adet stokta` : "Stokta yok"}
              </span>
            </div>

            {/* Sepete Ekle */}
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: product.salePrice ? Number(product.salePrice) : Number(product.price),
                image: product.images[0],
                slug: product.slug,
                stock: product.stock,
              }}
            />

            {/* Açıklama */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-white font-semibold mb-2">Ürün Açıklaması</h3>
              <p className="text-white/60 text-sm leading-relaxed">{product.description}</p>
            </div>

            {/* Teknik Özellikler (key-value) */}
            {specs && Object.keys(specs).length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-white font-semibold mb-3">Teknik Özellikler</h3>
                <div className="space-y-2">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-white/40 capitalize">{key}</span>
                      <span className="text-white/80">
                        {Array.isArray(value) ? value.join(", ") : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Ürün Özellikleri Bölümleri ── */}
        <ProductFeatures sections={features} />

        {/* ── Yorumlar ── */}
        {product.reviews.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-white mb-6">
              Müşteri Yorumları ({product.reviews.length})
            </h2>
            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div key={review.id} className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{review.user.name}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} className={s <= review.rating ? "text-[#FF6B35] fill-[#FF6B35]" : "text-white/20"} />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-white/60 text-sm">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
