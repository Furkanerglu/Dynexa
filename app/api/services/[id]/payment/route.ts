import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  cardHolder: z.string().min(3),
  cardNumber: z.string().regex(/^\d{16}$/),
  expiry:     z.string().regex(/^\d{2}\/\d{2}$/),
  cvv:        z.string().regex(/^\d{3,4}$/),
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
    const body     = await req.json();
    const cardData = schema.parse(body);
    void cardData; // İleride İyzico'ya iletilecek

    const service = await prisma.serviceRequest.findUnique({
      where: { id: params.id },
    });

    if (!service) {
      return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
    }

    if (service.userId !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    if (!["PRINT", "SCANNING"].includes(service.type)) {
      return NextResponse.json(
        { error: "Bu talep tipi ödeme gerektirmiyor" },
        { status: 400 }
      );
    }

    if (service.status !== "QUOTED") {
      return NextResponse.json(
        { error: "Bu talep ödeme aşamasında değil" },
        { status: 400 }
      );
    }

    if (!service.price) {
      return NextResponse.json({ error: "Fiyat belirlenmemiş" }, { status: 400 });
    }

    // ── İyzico entegrasyonu buraya gelecek ──────────────────────────────────
    // const Iyzipay = require("iyzipay");
    // const iyzipay = new Iyzipay({
    //   apiKey:    process.env.IYZICO_API_KEY,
    //   secretKey: process.env.IYZICO_SECRET_KEY,
    //   uri:       process.env.IYZICO_BASE_URL,
    // });
    // Şimdilik mock başarılı ödeme
    const paymentSuccess = true;
    const paymentId      = `mock_svc_${Date.now()}`;

    if (!paymentSuccess) {
      // Ödeme başarısız — durum QUOTED kalıyor, admin panelinde görünmüyor
      return NextResponse.json(
        { error: "Ödeme işlemi başarısız, lütfen kart bilgilerinizi kontrol edin" },
        { status: 402 }
      );
    }

    // Ödeme başarılı → CONFIRMED'a geç (artık admin panelinde görünür)
    const updated = await prisma.serviceRequest.update({
      where: { id: params.id },
      data:  { status: "CONFIRMED", adminNotes: service.adminNotes ? `${service.adminNotes} | Ödeme: ${paymentId}` : `Ödeme: ${paymentId}` },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz kart bilgileri" }, { status: 400 });
    }
    console.error("[Service Payment POST]", error);
    return NextResponse.json({ error: "Ödeme işlemi başarısız" }, { status: 500 });
  }
}
