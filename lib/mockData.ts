// DB olmadığında veya build sırasında kullanılan mock veriler

export const MOCK_PARTS_CATEGORIES = [
  { id: "cat-1", name: "Figürler",           slug: "figurler",          type: "PARTS" as const },
  { id: "cat-2", name: "Ev & Dekorasyon",    slug: "ev-dekorasyon",     type: "PARTS" as const },
  { id: "cat-3", name: "Oyuncak & Koleksiyon", slug: "oyuncak-koleksiyon", type: "PARTS" as const },
  { id: "cat-4", name: "Fonksiyonel",        slug: "fonksiyonel",       type: "PARTS" as const },
];

export const MOCK_FILAMENT_CATEGORIES = [
  { id: "cat-5", name: "PLA",        slug: "pla",      type: "FILAMENT" as const },
  { id: "cat-6", name: "PETG",       slug: "petg",     type: "FILAMENT" as const },
  { id: "cat-7", name: "ABS / ASA",  slug: "abs-asa",  type: "FILAMENT" as const },
  { id: "cat-8", name: "TPU / Esnek", slug: "tpu",     type: "FILAMENT" as const },
];

export const MOCK_PARTS_BRANDS: string[] = [];
export const MOCK_FILAMENT_BRANDS = ["Bambu Lab", "eSUN", "Polymaker", "Fiberlogy", "Prusament"];

export const MOCK_PARTS = [
  {
    id: "p-1", name: "Naruto Uzumaki Figürü", slug: "naruto-uzumaki-figuru",
    price: 299, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 8,
    brand: null,
    category: { name: "Figürler", slug: "figurler" },
  },
  {
    id: "p-2", name: "Monkey D. Luffy Figürü", slug: "luffy-figuru",
    price: 349, salePrice: 299,
    images: ["/placeholder-product.jpg"], stock: 5,
    brand: null,
    category: { name: "Figürler", slug: "figurler" },
  },
  {
    id: "p-3", name: "Spiral Vazo — Orta Boy", slug: "spiral-vazo-orta",
    price: 179, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 20,
    brand: null,
    category: { name: "Ev & Dekorasyon", slug: "ev-dekorasyon" },
  },
  {
    id: "p-4", name: "Geometrik Saksı Seti (3'lü)", slug: "geometrik-saksi-seti",
    price: 249, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 12,
    brand: null,
    category: { name: "Ev & Dekorasyon", slug: "ev-dekorasyon" },
  },
  {
    id: "p-5", name: "Satranç Takımı — Tam Set", slug: "satranc-takimi",
    price: 599, salePrice: 499,
    images: ["/placeholder-product.jpg"], stock: 4,
    brand: null,
    category: { name: "Oyuncak & Koleksiyon", slug: "oyuncak-koleksiyon" },
  },
  {
    id: "p-6", name: "Telefon & Tablet Standı", slug: "telefon-tablet-standi",
    price: 159, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 30,
    brand: null,
    category: { name: "Fonksiyonel", slug: "fonksiyonel" },
  },
  {
    id: "p-7", name: "İstanbul Silüeti Duvar Süsü", slug: "istanbul-silueti-duvar",
    price: 389, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 7,
    brand: null,
    category: { name: "Ev & Dekorasyon", slug: "ev-dekorasyon" },
  },
  {
    id: "p-8", name: "Ejderha Heykel — Büyük", slug: "ejderha-heykel",
    price: 549, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 3,
    brand: null,
    category: { name: "Figürler", slug: "figurler" },
  },
];

export const MOCK_FILAMENTS = [
  {
    id: "f-1", name: "PLA+ Beyaz 1kg", slug: "pla-plus-beyaz-1kg",
    price: 520, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 25,
    brand: "eSUN",
    category: { name: "PLA", slug: "pla" },
  },
  {
    id: "f-2", name: "PETG Şeffaf 1kg", slug: "petg-seffaf-1kg",
    price: 580, salePrice: 520,
    images: ["/placeholder-product.jpg"], stock: 18,
    brand: "Polymaker",
    category: { name: "PETG", slug: "petg" },
  },
  {
    id: "f-3", name: "ABS Siyah 1kg", slug: "abs-siyah-1kg",
    price: 490, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 10,
    brand: "eSUN",
    category: { name: "ABS / ASA", slug: "abs-asa" },
  },
  {
    id: "f-4", name: "TPU 95A Kırmızı 1kg", slug: "tpu-95a-kirmizi",
    price: 720, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 6,
    brand: "Fiberlogy",
    category: { name: "TPU / Esnek", slug: "tpu" },
  },
  {
    id: "f-5", name: "Bambu PLA Matte Gri 1kg", slug: "bambu-pla-matte-gri",
    price: 890, salePrice: 820,
    images: ["/placeholder-product.jpg"], stock: 14,
    brand: "Bambu Lab",
    category: { name: "PLA", slug: "pla" },
  },
  {
    id: "f-6", name: "ASA Gri 1kg (UV Dayanıklı)", slug: "asa-gri-1kg",
    price: 640, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 9,
    brand: "Prusament",
    category: { name: "ABS / ASA", slug: "abs-asa" },
  },
  {
    id: "f-7", name: "PLA Silk Gold 1kg", slug: "pla-silk-gold-1kg",
    price: 560, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 0,
    brand: "eSUN",
    category: { name: "PLA", slug: "pla" },
  },
  {
    id: "f-8", name: "Carbon Fiber PETG 500g", slug: "cf-petg-500g",
    price: 980, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 5,
    brand: "Polymaker",
    category: { name: "PETG", slug: "petg" },
  },
];
