import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "DYNEXA <noreply@dynexa.com>";

export const ORDER_STATUS_LABELS: Record<string, { label: string; description: string; color: string }> = {
  PENDING: {
    label: "Beklemede",
    description: "Siparişiniz alındı, onay bekleniyor.",
    color: "#F59E0B",
  },
  CONFIRMED: {
    label: "Onaylandı",
    description: "Siparişiniz onaylandı, hazırlanmaya başlanacak.",
    color: "#3B82F6",
  },
  PREPARING: {
    label: "Hazırlanıyor",
    description: "Siparişiniz paketleniyor ve kargoya hazırlanıyor.",
    color: "#FF6B35",
  },
  SHIPPED: {
    label: "Kargoya Verildi",
    description: "Siparişiniz kargoya verildi, yolda!",
    color: "#8B5CF6",
  },
  DELIVERED: {
    label: "Teslim Edildi",
    description: "Siparişiniz başarıyla teslim edildi.",
    color: "#00D4AA",
  },
  CANCELLED: {
    label: "İptal Edildi",
    description: "Siparişiniz iptal edildi. Ödeme iadesi için bizimle iletişime geçebilirsiniz.",
    color: "#EF4444",
  },
};

function buildOrderStatusEmail({
  customerName,
  orderId,
  status,
  totalAmount,
  items,
}: {
  customerName: string;
  orderId: string;
  status: string;
  totalAmount: number;
  items: { name: string; quantity: number; price: number }[];
}) {
  const statusInfo = ORDER_STATUS_LABELS[status] ?? {
    label: status,
    description: "Sipariş durumunuz güncellendi.",
    color: "#FF6B35",
  };

  const formattedTotal = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(totalAmount);

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #1a1a1a; color: #d1d5db;">${item.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #1a1a1a; color: #d1d5db; text-align:center;">×${item.quantity}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #1a1a1a; color: #d1d5db; text-align:right;">${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sipariş Durumu Güncellendi</title>
</head>
<body style="margin:0; padding:0; background:#020202; font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020202; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#0a0a0a; border:1px solid #1a1a1a; border-radius:12px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#0f0f0f; padding:28px 32px; border-bottom:1px solid #1a1a1a;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px; font-weight:900; letter-spacing:-0.5px; color:#ffffff;">
                      DYNE<span style="color:#FF6B35;">X</span>A
                    </span>
                    <span style="display:block; font-size:10px; color:#6b7280; letter-spacing:2px; margin-top:2px;">PRECISION IN EVERY LAYER</span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block; background:${statusInfo.color}20; color:${statusInfo.color}; font-size:12px; font-weight:600; padding:4px 12px; border-radius:999px; border:1px solid ${statusInfo.color}40;">
                      ${statusInfo.label}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px; font-size:18px; font-weight:700; color:#ffffff;">Merhaba ${customerName},</p>
              <p style="margin:0 0 24px; font-size:14px; color:#9ca3af; line-height:1.6;">
                <strong style="color:#FF6B35;">#${orderId.slice(-8).toUpperCase()}</strong> numaralı siparişinizin durumu güncellendi.
              </p>

              <!-- Status box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${statusInfo.color}10; border:1px solid ${statusInfo.color}30; border-radius:8px; margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px; font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">Yeni Durum</p>
                    <p style="margin:0 0 8px; font-size:20px; font-weight:800; color:${statusInfo.color};">${statusInfo.label}</p>
                    <p style="margin:0; font-size:13px; color:#9ca3af;">${statusInfo.description}</p>
                  </td>
                </tr>
              </table>

              <!-- Order items -->
              <p style="margin:0 0 12px; font-size:13px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">Sipariş Özeti</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1a1a1a; border-radius:8px; overflow:hidden; margin-bottom:16px;">
                <thead>
                  <tr style="background:#111111;">
                    <th style="padding:8px 12px; text-align:left; font-size:11px; color:#6b7280; font-weight:600;">Ürün</th>
                    <th style="padding:8px 12px; text-align:center; font-size:11px; color:#6b7280; font-weight:600;">Adet</th>
                    <th style="padding:8px 12px; text-align:right; font-size:11px; color:#6b7280; font-weight:600;">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
                <tfoot>
                  <tr style="background:#111111;">
                    <td colspan="2" style="padding:10px 12px; font-size:13px; font-weight:700; color:#ffffff;">Toplam</td>
                    <td style="padding:10px 12px; font-size:13px; font-weight:700; color:#FF6B35; text-align:right;">${formattedTotal}</td>
                  </tr>
                </tfoot>
              </table>

              <p style="margin:24px 0 0; font-size:12px; color:#6b7280; line-height:1.6;">
                Sorularınız için <a href="mailto:destek@dynexa.com" style="color:#FF6B35; text-decoration:none;">destek@dynexa.com</a> adresine yazabilirsiniz.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px; border-top:1px solid #1a1a1a; text-align:center;">
              <p style="margin:0; font-size:11px; color:#374151;">© 2025 DYNEXA. Tüm hakları saklıdır.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return html;
}

export async function sendOrderStatusEmail({
  to,
  customerName,
  orderId,
  status,
  totalAmount,
  items,
}: {
  to: string;
  customerName: string;
  orderId: string;
  status: string;
  totalAmount: number;
  items: { name: string; quantity: number; price: number }[];
}) {
  const statusLabel = ORDER_STATUS_LABELS[status]?.label ?? status;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Siparişiniz Güncellendi: ${statusLabel} — #${orderId.slice(-8).toUpperCase()}`,
      html: buildOrderStatusEmail({ customerName, orderId, status, totalAmount, items }),
    });

    if (error) {
      console.error("[Email] Gönderim hatası:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Email] Beklenmeyen hata:", err);
    return { success: false, error: err };
  }
}
