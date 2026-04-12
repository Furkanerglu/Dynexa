/**
 * HepsiJet (Hepsiburada Lojistik) REST API entegrasyonu
 *
 * API Credentials (env):
 *   HEPSIJET_CLIENT_ID     — OAuth2 client ID
 *   HEPSIJET_CLIENT_SECRET — OAuth2 client secret
 *   HEPSIJET_MERCHANT_ID   — Merchant/firma kodu
 *
 * Sandbox:    https://sandbox-apigateway.hepsijet.com
 * Production: https://apigateway.hepsijet.com
 *
 * API Docs & Entegrasyon: https://www.hepsijet.com/entegrasyon
 * Destek: entegrasyon@hepsijet.com
 */

import type { ShipmentRequest, ShipmentResult, TrackingResult } from "./types";

const BASE_URL = process.env.HEPSIJET_SANDBOX === "true"
  ? "https://sandbox-apigateway.hepsijet.com"
  : "https://apigateway.hepsijet.com";

const CLIENT_ID     = process.env.HEPSIJET_CLIENT_ID     ?? "";
const CLIENT_SECRET = process.env.HEPSIJET_CLIENT_SECRET ?? "";
const MERCHANT_ID   = process.env.HEPSIJET_MERCHANT_ID   ?? "";

/** HepsiJet OAuth2 token önbelleği */
let _token: string | null = null;
let _tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const body = new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`HepsiJet OAuth hatası: ${res.status}`);
  const data = await res.json();

  _token      = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _token!;
}

/** Gönderi oluştur */
export async function createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
  if (!CLIENT_ID || !CLIENT_SECRET || !MERCHANT_ID) {
    const fakeTracking = `HJ${Date.now().toString().slice(-10)}`;
    console.warn("[HepsiJet] Credentials eksik — demo takip numarası:", fakeTracking);
    return { success: true, trackingNumber: fakeTracking };
  }

  try {
    const token = await getToken();

    const payload = {
      merchantId:     MERCHANT_ID,
      referenceId:    req.orderId,
      deliveryType:   "STANDARD", // STANDARD | EXPRESS
      cargo: {
        weight: req.package.weightKg,
        desi:   req.package.desi ?? req.package.weightKg,
        count:  1,
      },
      receiver: {
        name:         req.receiver.fullName,
        phone:        req.receiver.phone,
        city:         req.receiver.city,
        district:     req.receiver.district,
        addressLine:  req.receiver.address,
      },
      sender: {
        name:         req.sender.fullName,
        phone:        req.sender.phone,
        city:         req.sender.city,
        district:     req.sender.district,
        addressLine:  req.sender.address,
      },
    };

    const res = await fetch(`${BASE_URL}/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.success === false) {
      return { success: false, error: data.message ?? `HTTP ${res.status}` };
    }

    return {
      success:       true,
      trackingNumber: data.data?.trackingNumber ?? data.trackingNumber,
      barcode:       data.data?.barcode ?? undefined,
      labelUrl:      data.data?.labelUrl ?? undefined,
    };
  } catch (err) {
    console.error("[HepsiJet] createShipment error:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Gönderi durumunu sorgula */
export async function trackShipment(trackingNumber: string): Promise<TrackingResult> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return { success: false, trackingNumber, delivered: false, error: "Credentials eksik" };
  }

  try {
    const token = await getToken();

    const res = await fetch(`${BASE_URL}/v1/tracking/${trackingNumber}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) return { success: false, trackingNumber, delivered: false, error: `HTTP ${res.status}` };

    const statusCode: string = data.data?.status ?? data.status ?? "";
    const delivered = ["DELIVERED", "TESLİM_EDİLDİ", "TESLIM_EDILDI"].includes(statusCode.toUpperCase());

    const events = (data.data?.events ?? data.events ?? []).map((e: Record<string, unknown>) => ({
      date:        new Date(e.timestamp as string ?? e.date as string),
      description: e.description as string,
      location:    e.location as string | undefined,
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
    console.error("[HepsiJet] trackShipment error:", err);
    return { success: false, trackingNumber, delivered: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Müşteri için takip URL'i */
export function getTrackingUrl(trackingNumber: string): string {
  return `https://www.hepsijet.com/gonderi-takip?trackingNumber=${trackingNumber}`;
}
