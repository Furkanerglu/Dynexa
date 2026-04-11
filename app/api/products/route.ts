import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const type = searchParams.get("type");
    const all = searchParams.get("all"); // admin için aktif olmayanlar da
    const limit = parseInt(searchParams.get("limit") || "50");

    const products = await prisma.product.findMany({
      where: {
        ...(all !== "true" ? { isActive: true } : {}),
        ...(category ? { category: { slug: category } } : {}),
        ...(brand ? { brand } : {}),
        ...(type ? { category: { type: type as "PARTS" | "FILAMENT" } } : {}),
      },
      include: { category: { select: { name: true, slug: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır"),
  description: z.string().min(5, "Açıklama gereklidir"),
  price: z.number().positive("Fiyat pozitif olmalıdır"),
  salePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0),
  categoryId: z.string().min(1, "Kategori seçiniz"),
  brand: z.string().optional(),
  images: z.array(z.string()).default([]),
  specs: z.record(z.unknown()).optional(),
  isActive: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { name, description, price, salePrice, stock, categoryId, brand, images, specs, isActive } = parsed.data;

  // Slug oluştur
  const baseSlug = name
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const slug = `${baseSlug}-${Date.now()}`;

  const product = await prisma.product.create({
    data: {
      name, description, slug, price, salePrice, stock, categoryId,
      brand, images, isActive,
      ...(specs ? { specs: specs as import("@prisma/client").Prisma.InputJsonValue } : {}),
    },
    include: { category: true },
  });

  return NextResponse.json(product, { status: 201 });
}
