import { prisma } from "@/lib/prisma";

type NotifType = "ORDER_STATUS" | "SERVICE_STATUS" | "QUOTE" | "DISCOUNT" | "INFO";

export async function createNotification({
  userId,
  title,
  body,
  type = "INFO",
  link,
}: {
  userId: string;
  title: string;
  body: string;
  type?: NotifType;
  link?: string;
}) {
  return prisma.notification.create({
    data: { userId, title, body, type, link },
  });
}

// ─── Sipariş durum mesajları ──────────────────────────────────────────────────

const ORDER_STATUS_MSG: Record<string, { title: string; body: string }> = {
  PENDING:   { title: "Sipariş Alındı",           body: "Siparişiniz başarıyla alındı, onay bekleniyor." },
  CONFIRMED: { title: "Sipariş Onaylandı",        body: "Siparişiniz onaylandı ve hazırlık aşamasına geçecek." },
  PREPARING: { title: "Sipariş Hazırlanıyor",     body: "Siparişiniz paketleniyor ve kargoya hazırlanıyor." },
  SHIPPED:   { title: "Sipariş Kargoda",          body: "Siparişiniz kargoya verildi, yakında teslim edilecek." },
  DELIVERED: { title: "Sipariş Teslim Edildi",    body: "Siparişiniz teslim edildi. İyi kullanımlar!" },
  CANCELLED: { title: "Sipariş İptal Edildi",     body: "Siparişiniz iptal edildi. Sorularınız için bize ulaşın." },
};

export async function notifyOrderStatus(orderId: string, userId: string, status: string) {
  const msg = ORDER_STATUS_MSG[status];
  if (!msg) return;
  return createNotification({
    userId,
    title: msg.title,
    body: msg.body,
    type: "ORDER_STATUS",
    link: `/account/orders`,
  });
}

// ─── Servis talebi durum mesajları ───────────────────────────────────────────

type ServiceType = "PRINT" | "SCANNING" | "TECHNICAL";

const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  PRINT:     "3D Baskı",
  SCANNING:  "3D Tarama",
  TECHNICAL: "Teknik Servis",
};

function getServiceStatusMsg(status: string, serviceType?: ServiceType) {
  const label = serviceType ? SERVICE_TYPE_LABEL[serviceType] : "Servis";
  const msgs: Record<string, { title: string; body: string; type?: NotifType }> = {
    PENDING:     { title: `${label} Talebiniz Alındı`,       body: `${label} talebiniz alındı, incelenecek.` },
    REVIEWING:   { title: `${label} Talebiniz İnceleniyor`,  body: `Talebinizi inceliyoruz, kısa sürede fiyat teklifi sunacağız.` },
    QUOTED:      { title: "Fiyat Teklifi Hazır!",            body: `${label} talebiniz için fiyat teklifi hazır. Onaylamak için tıklayın.`, type: "QUOTE" },
    CONFIRMED:   { title: `${label} Talebiniz Onaylandı`,    body: "Ödemeniz alındı, talebiniz işleme alındı." },
    IN_PROGRESS: { title: `${label} İşlemde`,                body: "Talebiniz aktif olarak işleniyor." },
    COMPLETED:   { title: `${label} Tamamlandı`,             body: `${label} talebiniz başarıyla tamamlandı!` },
    CANCELLED:   { title: `${label} Talebi İptal`,           body: "Servis talebiniz iptal edildi." },
  };
  return msgs[status] ?? null;
}

export async function notifyServiceStatus(
  serviceId: string,
  userId: string,
  status: string,
  serviceType?: ServiceType
) {
  const msg = getServiceStatusMsg(status, serviceType);
  if (!msg) return;
  return createNotification({
    userId,
    title: msg.title,
    body:  msg.body,
    type:  msg.type ?? "SERVICE_STATUS",
    link:  `/account/orders`,
  });
}

// ─── Toplu bildirim (kampanya / duyuru) ──────────────────────────────────────

export async function broadcastNotification({
  title,
  body,
  type = "DISCOUNT",
  link,
  userIds,
}: {
  title: string;
  body: string;
  type?: NotifType;
  link?: string;
  userIds?: string[]; // boşsa tüm kullanıcılar
}) {
  const targets = userIds ?? (await prisma.user.findMany({ where: { role: "USER" }, select: { id: true } })).map((u) => u.id);
  return prisma.notification.createMany({
    data: targets.map((userId) => ({ userId, title, body, type, link: link ?? null })),
  });
}
