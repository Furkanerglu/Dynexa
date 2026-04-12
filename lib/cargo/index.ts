import type { CargoProvider, ShipmentRequest, ShipmentResult, TrackingResult } from "./types";
import * as yurtici  from "./yurtici";
import * as hepsijet from "./hepsijet";

export type { CargoProvider, ShipmentRequest, ShipmentResult, TrackingResult };

export async function createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
  if (req.provider === "YURTICI")  return yurtici.createShipment(req);
  if (req.provider === "HEPSIJET") return hepsijet.createShipment(req);
  return { success: false, error: `Bilinmeyen kargo firması: ${req.provider}` };
}

export async function trackShipment(
  provider: CargoProvider,
  trackingNumber: string
): Promise<TrackingResult> {
  if (provider === "YURTICI")  return yurtici.trackShipment(trackingNumber);
  if (provider === "HEPSIJET") return hepsijet.trackShipment(trackingNumber);
  return { success: false, trackingNumber, delivered: false, error: `Bilinmeyen kargo firması: ${provider}` };
}

export function getTrackingUrl(provider: CargoProvider, trackingNumber: string): string {
  if (provider === "YURTICI")  return yurtici.getTrackingUrl(trackingNumber);
  if (provider === "HEPSIJET") return hepsijet.getTrackingUrl(trackingNumber);
  return "#";
}
