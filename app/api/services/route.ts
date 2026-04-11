import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["PRINT", "SCANNING", "TECHNICAL"]),
  title: z.string().min(3),
  description: z.string().min(10),
  specs: z.record(z.unknown()).optional(),
  files: z.array(z.string()).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const requests = await prisma.serviceRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        userId: session.user.id,
        type: data.type,
        title: data.title,
        description: data.description,
        specs: (data.specs || {}) as object,
        files: data.files || [],
      },
    });

    return NextResponse.json(serviceRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }
    return NextResponse.json({ error: "Talep oluşturulamadı" }, { status: 500 });
  }
}
