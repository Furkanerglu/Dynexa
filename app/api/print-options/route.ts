import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/print-options — müşteri formuna stokta olan malzeme+renkler
export async function GET() {
  const [materials, colors] = await Promise.all([
    prisma.printMaterial.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.printColor.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return NextResponse.json({ materials, colors });
}
