// DB olmadığında veya build sırasında kullanılan mock veriler

export const MOCK_PARTS_CATEGORIES = [
  { id: "cat-1", name: "Hotend & Nozzle", slug: "hotend-nozzle", type: "PARTS" as const },
  { id: "cat-2", name: "Ekstruder", slug: "ekstruder", type: "PARTS" as const },
  { id: "cat-3", name: "Motion Sistemi", slug: "motion", type: "PARTS" as const },
  { id: "cat-4", name: "Isıtma & Yatak", slug: "isitma-yatak", type: "PARTS" as const },
];

export const MOCK_FILAMENT_CATEGORIES = [
  { id: "cat-5", name: "PLA", slug: "pla", type: "FILAMENT" as const },
  { id: "cat-6", name: "PETG", slug: "petg", type: "FILAMENT" as const },
  { id: "cat-7", name: "ABS / ASA", slug: "abs-asa", type: "FILAMENT" as const },
  { id: "cat-8", name: "TPU / Esnek", slug: "tpu", type: "FILAMENT" as const },
];

export const MOCK_PARTS_BRANDS = ["E3D", "Bambu Lab", "Bondtech", "Creality", "Trianglelab"];
export const MOCK_FILAMENT_BRANDS = ["Bambu Lab", "eSUN", "Polymaker", "Fiberlogy", "Prusament"];

export const MOCK_PARTS = [
  {
    id: "p-1", name: "E3D V6 Hotend", slug: "e3d-v6-hotend",
    price: 850, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 12,
    brand: "E3D",
    category: { name: "Hotend & Nozzle", slug: "hotend-nozzle" },
  },
  {
    id: "p-2", name: "0.4mm Pirinç Nozzle", slug: "pirince-nozzle-04",
    price: 85, salePrice: 65,
    images: ["/placeholder-product.jpg"], stock: 50,
    brand: "Trianglelab",
    category: { name: "Hotend & Nozzle", slug: "hotend-nozzle" },
  },
  {
    id: "p-3", name: "BMG Ekstruder Klon", slug: "bmg-ekstruder",
    price: 420, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 8,
    brand: "Bondtech",
    category: { name: "Ekstruder", slug: "ekstruder" },
  },
  {
    id: "p-4", name: "Ender 3 GT2 Kayış 2m", slug: "ender3-gt2-kayis",
    price: 120, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 30,
    brand: "Creality",
    category: { name: "Motion Sistemi", slug: "motion" },
  },
  {
    id: "p-5", name: "NEMA 17 Step Motor", slug: "nema17-step-motor",
    price: 380, salePrice: 320,
    images: ["/placeholder-product.jpg"], stock: 15,
    brand: "Creality",
    category: { name: "Motion Sistemi", slug: "motion" },
  },
  {
    id: "p-6", name: "Silikon Isıtma Bloğu 24V 40W", slug: "silikon-isitma-bloku",
    price: 195, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 20,
    brand: "Trianglelab",
    category: { name: "Isıtma & Yatak", slug: "isitma-yatak" },
  },
  {
    id: "p-7", name: "PEI Yay Çeliği Yatak 235x235", slug: "pei-yatak-235",
    price: 650, salePrice: 550,
    images: ["/placeholder-product.jpg"], stock: 7,
    brand: "Bambu Lab",
    category: { name: "Isıtma & Yatak", slug: "isitma-yatak" },
  },
  {
    id: "p-8", name: "Volcano 0.6mm Nozzle", slug: "volcano-nozzle-06",
    price: 110, salePrice: null,
    images: ["/placeholder-product.jpg"], stock: 0,
    brand: "E3D",
    category: { name: "Hotend & Nozzle", slug: "hotend-nozzle" },
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
