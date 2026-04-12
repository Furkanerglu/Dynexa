/**
 * Yurtiçi Kargo REST API entegrasyonu
 *
 * API Credentials (env):
 *   YURTICI_USERNAME   — Yurtiçi Kargo müşteri kodu
 *   YURTICI_PASSWORD   — Yurtiçi Kargo API şifresi
 *   YURTICI_CUSTOMER_NO — Müşteri numarası
 *
 * Sandbox: https://createsend.yurticikargo.com:8443
 * Production: https://ws.yurticikargo.com:8443
 *
 * Yurtiçi API Docs: https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgulama
 * Entegrasyon için: entegrasyon@yurticikargo.com
 */

import type { ShipmentRequest, ShipmentResult, TrackingResult } from "./types";

const BASE_URL = process.env.YURTICI_SANDBOX === "true"
  ? "https://createsend.yurticikargo.com:8443"
  : "https://ws.yurticikargo.com:8443";

const USERNAME    = process.env.YURTICI_USERNAME    ?? "";
const PASSWORD    = process.env.YURTICI_PASSWORD    ?? "";
const CUSTOMER_NO = process.env.YURTICI_CUSTOMER_NO ?? "";

/** Yurtiçi token önbelleği */
let _token: string | null = null;
let _tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const res = await fetch(`${BASE_URL}/YurticiKargoService/rs/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName: USERNAME, password: PASSWORD }),
  });

  if (!res.ok) throw new Error(`Yurtiçi login hatası: ${res.status}`);
  const data = await res.json();

  _token      = data.data?.token ?? data.token;
  _tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 dakika
  return _token!;
}

/** Gönderi oluştur — takip numarası döner */
export async function createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
  if (!USERNAME || !PASSWORD || !CUSTOMER_NO) {
    // Credentials yoksa sandbox/demo modu
    const fakeTracking = `YK${Date.now().toString().slice(-10)}`;
    console.warn("[Yurtiçi] Credentials eksik — demo takip numarası:", fakeTracking);
    return { success: true, trackingNumber: fakeTracking };
  }

  try {
    const token = await getToken();

    const payload = {
      invoiceKey:    CUSTOMER_NO,
      cargoKey:      CUSTOMER_NO,
      receiverName:  req.receiver.fullName,
      receiverPhone: req.receiver.phone,
      receiverAddress: req.receiver.address,
      receiverCityName:    req.receiver.city,
      receiverTownName:    req.receiver.district,
      senderName:    req.sender.fullName,
      senderPhone:   req.sender.phone,
      senderAddress: req.sender.address,
      senderCityName:    req.sender.city,
      senderTownName:    req.sender.district,
      weight:        req.package.weightKg,
      desi:          req.package.desi ?? req.package.weightKg,
      description:   req.package.description ?? "Dynexa Sipariş",
      referenceCode: req.orderId,
      pieceCount:    1,
      productType:   1, // 1=Koli
    };

    const res = await fetch(`${BASE_URL}/YurticiKargoService/rs/shipment/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.isSuccess === false) {
      return { success: false, error: data.errorMessage ?? `HTTP ${res.status}` };
    }

    return {
      success: true,
      trackingNumber: String(data.data?.cargoKey ?? data.cargoKey ?? ""),
      barcode:  data.data?.barcode ?? undefined,
      labelUrl: data.data?.labelUrl ?? undefined,
    };
  } catch (err) {
    console.error("[Yurtiçi] createShipment error:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Gönderi durumunu sorgula */
export async function trackShipment(trackingNumber: string): Promise<TrackingResult> {
  if (!USERNAME || !PASSWORD) {
    return { success: false, trackingNumber, delivered: false, error: "Credentials eksik" };
  }

  try {
    const token = await getToken();

    const res = await fetch(
      `${BASE_URL}/YurticiKargoService/rs/shipment/queryByWaybillNumber?waybillNumber=${trackingNumber}`,
      { headers: { "Authorization": `Bearer ${token}` } }
    );

    const data = await res.json();
    if (!res.ok) return { success: false, trackingNumber, delivered: false, error: `HTTP ${res.status}` };

    const shipment = data.data?.[0] ?? data?.[0];
    const statusCode: string = shipment?.lastStatus ?? "";

    // Teslim edildi kodları: 70, 71 (Yurtiçi'nin status kodları)
    const delivered = ["70", "71", "DELIVERED", "TESLİM EDİLDİ"].includes(statusCode.toUpperCase());

    const events = (shipment?.shipmentMovements ?? []).map((m: Record<string, unknown>) => ({
      date:        new Date(m.date as string),
      description: m.description as string,
      location:    m.unit as string | undefined,
    }));

    return {
      success:    true,
      trackingNumber,
      status:     statusCode,
      delivered,
      lastUpdate: events[0]?.date,
      events,
    };
  } catch (err) {
    console.error("[Yurtiçi] trackShipment error:", err);
    return { success: false, trackingNumber, delivered: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Müşteri için takip URL'i */
export function getTrackingUrl(trackingNumber: string): string {
  return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgulama?code=${trackingNumber}`;
}
