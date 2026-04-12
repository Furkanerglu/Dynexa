import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = schema.parse(body);

    const existing = await prisma.serviceRequest.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
    }

    // Sadece talep sahibi işlem yapabilir
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    // Sadece QUOTED durumundaki talepler onaylanabilir/reddedilebilir
    if (existing.status !== "QUOTED") {
      return NextResponse.json(
        { error: "Bu talep fiyat bekleme aşamasında değil" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "CONFIRMED" : "CANCELLED";

    const updated = await prisma.serviceRequest.update({
      where: { id: params.id },
      data: { status: newStatus },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }
    console.error("[Service Respond POST]", error);
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
