export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "./AddToCartButton";
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

  const specs = product.specs as Record<string, string | number | boolean | string[]> | null;
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
          {/* Image */}
          <div className="space-y-4">
            <div className="relative h-96 bg-white/5 rounded-2xl overflow-hidden border border-white/10">
              <Image
                src={product.images[0] || "/images/placeholder.jpg"}
                alt={product.name}
                fill
                className="object-contain p-8"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.slice(1).map((img, i) => (
                  <div key={i} className="relative w-20 h-20 bg-white/5 rounded-xl overflow-hidden border border-white/10">
                    <Image src={img} alt={`${product.name} - ${i + 2}`} fill className="object-contain p-2" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {product.brand && (
              <p className="text-[#FF6B35] text-sm font-medium uppercase tracking-wider">
                {product.brand}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white">
              {product.name}
            </h1>

            {/* Rating */}
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

            {/* Price */}
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

            {/* Stock */}
            <div className="flex items-center gap-2">
              <Package size={16} className={product.stock > 0 ? "text-[#00D4AA]" : "text-white/30"} />
              <span className={`text-sm ${product.stock > 0 ? "text-[#00D4AA]" : "text-white/30"}`}>
                {product.stock > 0 ? `${product.stock} adet stokta` : "Stokta yok"}
              </span>
            </div>

            {/* Add to Cart */}
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

            {/* Description */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-white font-semibold mb-2">Ürün Açıklaması</h3>
              <p className="text-white/60 text-sm leading-relaxed">{product.description}</p>
            </div>

            {/* Specs */}
            {specs && Object.keys(specs).length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-white font-semibold mb-3">Teknik Özellikler</h3>
                <div className="space-y-2">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
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

        {/* Reviews */}
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
