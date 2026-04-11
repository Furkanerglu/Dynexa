export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-white">Ürünler</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#ff5a1f] text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus size={16} />
          Ürün Ekle
        </button>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Ürün</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Kategori</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Fiyat</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Stok</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Durum</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="text-white text-sm font-medium truncate max-w-[200px]">{product.name}</p>
                  {product.brand && <p className="text-white/30 text-xs">{product.brand}</p>}
                </td>
                <td className="px-4 py-3 text-white/60 text-sm">{product.category.name}</td>
                <td className="px-4 py-3">
                  <p className="text-white text-sm">{formatPrice(Number(product.price))}</p>
                  {product.salePrice && (
                    <p className="text-[#FF6B35] text-xs">{formatPrice(Number(product.salePrice))}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${product.stock === 0 ? "text-red-400" : product.stock <= 5 ? "text-yellow-400" : "text-[#00D4AA]"}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${product.isActive ? "bg-[#00D4AA]/10 text-[#00D4AA]" : "bg-white/10 text-white/30"}`}>
                    {product.isActive ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/shop/${product.slug}`} className="text-[#FF6B35] text-xs hover:underline">
                    Görüntüle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
