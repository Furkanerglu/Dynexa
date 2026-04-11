import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendServiceStatusEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  status: z
    .enum(["PENDING", "REVIEWING", "QUOTED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional(),
  price: z.number().nonnegative().nullable().optional(),
  adminNotes: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json(
      { error: `Yetkisiz — rol: ${(session.user as { role?: string }).role ?? "yok"}` },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Mevcut kaydı al (email için)
    const existing = await prisma.serviceRequest.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true, name: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;

    const updated = await prisma.serviceRequest.update({
      where: { id: params.id },
      data: updateData,
    });

    // Durum değiştiyse müşteriye email gönder
    if (data.status && data.status !== existing.status) {
      sendServiceStatusEmail({
        to: existing.user.email,
        customerName: existing.user.name ?? "Müşteri",
        requestId: existing.id,
        title: existing.title,
        type: existing.type,
        status: data.status,
        price: data.price !== undefined ? data.price : (existing.price ? Number(existing.price) : null),
        adminNotes: data.adminNotes !== undefined ? data.adminNotes : existing.adminNotes,
      }).catch((err) => console.error("[ServiceStatus Email] Gönderilemedi:", err));
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz veri", details: error.errors }, { status: 400 });
    }
    console.error("[Admin Service PATCH]", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}
