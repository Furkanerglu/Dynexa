import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Yetkisiz");
}

// PUT — güncelle (inStock toggle dahil)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { kind, ...data } = body;

    if (kind === "material") {
      const item = await prisma.printMaterial.update({
        where: { id },
        data: {
          ...(data.name        !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.pricePerGram !== undefined && { pricePerGram: Number(data.pricePerGram) }),
          ...(data.inStock     !== undefined && { inStock: data.inStock }),
          ...(data.sortOrder   !== undefined && { sortOrder: data.sortOrder }),
        },
      });
      return NextResponse.json(item);
    }

    if (kind === "color") {
      const item = await prisma.printColor.update({
        where: { id },
        data: {
          ...(data.name      !== undefined && { name: data.name }),
          ...(data.hex       !== undefined && { hex: data.hex }),
          ...(data.inStock   !== undefined && { inStock: data.inStock }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
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

// DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { kind } = await req.json();

    if (kind === "material") await prisma.printMaterial.delete({ where: { id } });
    else if (kind === "color") await prisma.printColor.delete({ where: { id } });
    else return NextResponse.json({ error: "Geçersiz tür" }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Hata";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
