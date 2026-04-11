import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const addressSchema = z.object({
  title: z.string().min(1, "Adres başlığı gereklidir"),
  fullName: z.string().min(2, "Ad soyad gereklidir"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  city: z.string().min(1, "Şehir gereklidir"),
  district: z.string().min(1, "İlçe gereklidir"),
  line: z.string().min(5, "Adres detayı gereklidir"),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });

  return NextResponse.json(addresses);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { isDefault, ...rest } = parsed.data;

  // Eğer yeni adres varsayılan yapılacaksa, diğerlerini kaldır
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  // İlk adres ise otomatik varsayılan yap
  const existingCount = await prisma.address.count({ where: { userId: session.user.id } });

  const address = await prisma.address.create({
    data: {
      ...rest,
      isDefault: isDefault ?? existingCount === 0,
      userId: session.user.id,
    },
  });

  return NextResponse.json(address, { status: 201 });
}
