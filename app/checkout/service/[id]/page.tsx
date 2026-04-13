import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import ServiceCheckoutClient from "./ServiceCheckoutClient";

export default async function ServiceCheckoutPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const service = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    select: {
      id:          true,
      title:       true,
      type:        true,
      status:      true,
      price:       true,
      description: true,
      specs:       true,
      adminNotes:  true,
      userId:      true,
    },
  });

  if (!service) notFound();
  if (service.userId !== session.user.id) redirect("/account/orders");
  if (service.status !== "QUOTED") redirect("/account/orders");
  if (!["PRINT", "SCANNING"].includes(service.type)) redirect("/account/orders");
  if (!service.price) redirect("/account/orders");

  return (
    <ServiceCheckoutClient
      service={{
        id:          service.id,
        title:       service.title,
        type:        service.type,
        description: service.description,
        price:       Number(service.price),
        specs:       service.specs as Record<string, unknown> | null,
        adminNotes:  service.adminNotes,
      }}
    />
  );
}
