import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notifyOrderStatus } from "@/lib/notifications";

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity:  z.number().min(1),
      price:     z.number().positive(),
    })
  ),
  // Kayıtlı adres ID'si VEYA yeni adres objesi
  addressId: z.string().optional(),
  address: z.object({
    title:    z.string(),
    fullName: z.string(),
    phone:    z.string(),
    city:     z.string(),
    district: z.string(),
    line:     z.string(),
  }).optional(),
  totalAmount: z.number().positive(),
}).refine((d) => d.addressId || d.address, {
  message: "addressId veya address gereklidir",
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: { include: { product: { select: { name: true, images: true, slug: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Kayıtlı adres kullan veya yeni adres oluştur
    let addressId: string;
    if (data.addressId) {
      // Adresin bu kullanıcıya ait olduğunu doğrula
      const existing = await prisma.address.findFirst({
        where: { id: data.addressId, userId: session.user.id },
      });
      if (!existing) return NextResponse.json({ error: "Adres bulunamadı" }, { status: 404 });
      addressId = existing.id;
    } else {
      const created = await prisma.address.create({
        data: { userId: session.user.id, ...data.address! },
      });
      addressId = created.id;
    }

    // Siparişi oluştur
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        addressId,
        totalAmount: data.totalAmount,
        paymentStatus: "PAID",
        status: "CONFIRMED",
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    });

    // Stok güncelle
    for (const item of data.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Siparişi oluşturulunca müşteriye bildirim gönder
    await notifyOrderStatus(order.id, session.user.id, "CONFIRMED").catch(console.error);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }
    return NextResponse.json({ error: "Sipariş oluşturulamadı" }, { status: 500 });
  }
}
