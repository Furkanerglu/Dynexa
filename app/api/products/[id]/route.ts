import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  salePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  brand: z.string().optional(),
  isActive: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  specs: z.record(z.unknown()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: { include: { user: { select: { name: true } } } },
      },
    });
    if (!product) return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.salePrice !== undefined) updateData.salePrice = data.salePrice;
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.brand !== undefined) updateData.brand = data.brand;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.specs !== undefined) updateData.specs = data.specs;

  const product = await prisma.product.update({ where: { id }, data: updateData, include: { category: true } });
  return NextResponse.json(product);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;

    // Ürünün siparişe bağlı orderItem'ı var mı kontrol et
    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });

    if (orderItemCount > 0) {
      // Sipariş geçmişini korumak için soft delete
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ success: true, softDeleted: true });
    }

    // Siparişi olmayan ürün — tamamen sil
    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.review.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true, softDeleted: false });
  } catch (err) {
    console.error("DELETE /api/products/[id] error:", err);
    return NextResponse.json({ error: "Silme işlemi başarısız" }, { status: 500 });
  }
}
