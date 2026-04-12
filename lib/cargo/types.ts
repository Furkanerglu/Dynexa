// Kargo entegrasyonu için ortak tipler

export type CargoProvider = "YURTICI" | "HEPSIJET";

export interface ShipmentRequest {
  /** Kargo firması */
  provider: CargoProvider;
  /** Sipariş ID */
  orderId: string;
  /** Alıcı bilgileri */
  receiver: {
    fullName: string;
    phone: string;
    city: string;
    district: string;
    address: string;
  };
  /** Gönderici bilgileri (mağaza) */
  sender: {
    fullName: string;
    phone: string;
    city: string;
    district: string;
    address: string;
  };
  /** Paket bilgileri */
  package: {
    weightKg: number;
    /** Desi = (boy x en x yükseklik) / 3000 */
    desi?: number;
    description?: string;
  };
}

export interface ShipmentResult {
  success: boolean;
  trackingNumber?: string;
  barcode?: string;
  labelUrl?: string;
  error?: string;
}

export interface TrackingResult {
  success: boolean;
  trackingNumber: string;
  /** Kargo firmasının ham durum kodu */
  status?: string;
  /** Teslim edildi mi? */
  delivered: boolean;
  /** Son güncelleme tarihi */
  lastUpdate?: Date;
  events?: TrackingEvent[];
  error?: string;
}

export interface TrackingEvent {
  date: Date;
  description: string;
  location?: string;
}
