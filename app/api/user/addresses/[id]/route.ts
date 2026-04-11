import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1, "Adres başlığı gereklidir").optional(),
  fullName: z.string().min(2, "Ad soyad gereklidir").optional(),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz").optional(),
  city: z.string().min(1, "Şehir gereklidir").optional(),
  district: z.string().min(1, "İlçe gereklidir").optional(),
  line: z.string().min(5, "Adres detayı gereklidir").optional(),
  isDefault: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const address = await prisma.address.findUnique({ where: { id: params.id } });
  if (!address || address.userId !== session.user.id) {
    return NextResponse.json({ error: "Adres bulunamadı" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { isDefault, ...rest } = parsed.data;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id, NOT: { id: params.id } },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.address.update({
    where: { id: params.id },
    data: { ...rest, ...(isDefault !== undefined ? { isDefault } : {}) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const address = await prisma.address.findUnique({ where: { id: params.id } });
  if (!address || address.userId !== session.user.id) {
    return NextResponse.json({ error: "Adres bulunamadı" }, { status: 404 });
  }

  await prisma.address.delete({ where: { id: params.id } });

  // Eğer silinen varsayılan adres ise, ilk kalan adresi varsayılan yap
  if (address.isDefault) {
    const first = await prisma.address.findFirst({ where: { userId: session.user.id } });
    if (first) {
      await prisma.address.update({ where: { id: first.id }, data: { isDefault: true } });
    }
  }

  return NextResponse.json({ success: true });
}
