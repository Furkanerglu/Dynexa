import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Yetkisiz");
}

// GET — tüm malzeme ve renkler (admin)
export async function GET() {
  try {
    await requireAdmin();
    const [materials, colors] = await Promise.all([
      prisma.printMaterial.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.printColor.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);
    return NextResponse.json({ materials, colors });
  } catch {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}

// POST — yeni malzeme veya renk ekle
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { kind, ...data } = body; // kind: "material" | "color"

    if (kind === "material") {
      const item = await prisma.printMaterial.create({
        data: {
          name:        data.name,
          description: data.description ?? "",
          pricePerGram: Number(data.pricePerGram) || 7,
          inStock:     data.inStock ?? true,
          sortOrder:   data.sortOrder ?? 0,
        },
      });
      return NextResponse.json(item);
    }

    if (kind === "color") {
      const item = await prisma.printColor.create({
        data: {
          name:      data.name,
          hex:       data.hex ?? "#888888",
          inStock:   data.inStock ?? true,
          sortOrder: data.sortOrder ?? 0,
        },
      });
      return NextResponse.json(item);
    }

    return NextResponse.json({ error: "Geçersiz tür" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Hata";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
