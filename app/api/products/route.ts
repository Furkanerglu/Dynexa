import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "20");

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
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
