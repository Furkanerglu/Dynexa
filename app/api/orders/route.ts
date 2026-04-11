import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      price: z.number().positive(),
    })
  ),
  address: z.object({
    title: z.string(),
    fullName: z.string(),
    phone: z.string(),
    city: z.string(),
    district: z.string(),
    line: z.string(),
  }),
  totalAmount: z.number().positive(),
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

    // Adresi kaydet
    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        ...data.address,
      },
    });

    // Siparişi oluştur
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        addressId: address.id,
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

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }
    return NextResponse.json({ error: "Sipariş oluşturulamadı" }, { status: 500 });
  }
}
