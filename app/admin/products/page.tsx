export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import AdminProductsClient from "./AdminProductsClient";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AdminProductsClient
      initialProducts={products.map((p) => ({
        ...p,
        price:     Number(p.price),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        specs:     (p.specs as Record<string, unknown>) ?? null,
      }))}
      categories={categories}
    />
  );
}
