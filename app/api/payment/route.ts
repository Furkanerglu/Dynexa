import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// İyzico ödeme entegrasyonu (sandbox)
// Gerçek entegrasyon için iyzipay paketi kullanılmalı
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    const body = await req.json();

    // TODO: İyzico entegrasyonu
    // const Iyzipay = require("iyzipay");
    // const iyzipay = new Iyzipay({
    //   apiKey: process.env.IYZICO_API_KEY,
    //   secretKey: process.env.IYZICO_SECRET_KEY,
    //   uri: process.env.IYZICO_BASE_URL,
    // });

    // Şimdilik mock başarılı yanıt
    return NextResponse.json({
      status: "success",
      paymentId: `mock_${Date.now()}`,
      conversationId: body.conversationId,
    });
  } catch {
    return NextResponse.json({ error: "Ödeme işlemi başarısız" }, { status: 500 });
  }
}
