import { prisma } from "@/lib/prisma";

type NotifType = "ORDER_STATUS" | "SERVICE_STATUS" | "DISCOUNT" | "INFO";

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

const SERVICE_STATUS_MSG: Record<string, { title: string; body: string }> = {
  PENDING:     { title: "Talebiniz Alındı",              body: "Servis talebiniz alındı, incelenecek." },
  REVIEWING:   { title: "Talebiniz İnceleniyor",         body: "Talebinizi inceliyoruz, kısa sürede fiyat teklifi sunacağız." },
  QUOTED:      { title: "Fiyat Teklifi Hazır!",          body: "Talebiniz için fiyat teklifi hazır. Onaylamak için tıklayın." },
  CONFIRMED:   { title: "Servis Talebiniz Onaylandı",    body: "Fiyat teklifini onayladınız. Talebiniz işleme alınacak." },
  IN_PROGRESS: { title: "Servis İşlemde",                body: "Talebiniz aktif olarak işleniyor." },
  COMPLETED:   { title: "Servis Tamamlandı",             body: "Servis talebiniz başarıyla tamamlandı!" },
  CANCELLED:   { title: "Servis Talebi İptal",           body: "Servis talebiniz iptal edildi." },
};

export async function notifyServiceStatus(serviceId: string, userId: string, status: string) {
  const msg = SERVICE_STATUS_MSG[status];
  if (!msg) return;
  return createNotification({
    userId,
    title: msg.title,
    body: msg.body,
    type: "SERVICE_STATUS",
    link: `/account/service-requests`,
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
