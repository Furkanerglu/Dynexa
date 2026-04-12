import { PrismaClient, CategoryType, OrderStatus, PaymentStatus, ServiceType, ServiceStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed başlatılıyor...");

  // ─── Eski PARTS ürün + kategorileri temizle ───────────────────────
  const OLD_PART_SLUGS = [
    "hotend-nozzle", "ekstruder", "motor-ray", "yatak-cerceve",
    // ürün slug'ları
    "bambu-lab-hardened-steel-nozzle-04", "e3d-v6-all-metal-hotend-kit",
    "volcano-nozzle-set", "bmg-dual-drive-ekstruder", "orbiter-ekstruder-v20",
    "creality-ender3-ekstruder-seti", "nema17-stepper-motor-42-40",
    "gates-gt2-kayis-seti", "mgn12h-lineer-ray-300mm",
    "ender3-cam-yatak-235x235", "pei-manyetik-yatak-310x310",
    "v-slot-profil-2020-1000mm",
  ];

  // Önce OrderItem'ları sil (FK kısıtlaması)
  const oldProds = await prisma.product.findMany({
    where: { slug: { in: OLD_PART_SLUGS } },
    select: { id: true },
  });
  const oldIds = oldProds.map((p) => p.id);
  if (oldIds.length > 0) {
    await prisma.orderItem.deleteMany({ where: { productId: { in: oldIds } } });
    await prisma.cartItem.deleteMany({ where: { productId: { in: oldIds } } });
    await prisma.product.deleteMany({ where: { id: { in: oldIds } } });
  }
  // Eski kategorileri sil
  await prisma.category.deleteMany({
    where: { slug: { in: ["hotend-nozzle", "ekstruder", "motor-ray", "yatak-cerceve"] } },
  });
  console.log("  ✓ Eski parça verileri temizlendi");

  // ─── Kullanıcılar ─────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dynexa.com" },
    update: {},
    create: { email: "admin@dynexa.com", name: "DYNEXA Admin", password: adminPassword, role: Role.ADMIN },
  });

  const user1Password = await bcrypt.hash("Test123!", 12);
  const user1 = await prisma.user.upsert({
    where: { email: "ahmet@test.com" },
    update: {},
    create: { email: "ahmet@test.com", name: "Ahmet Yılmaz", password: user1Password, phone: "0532 111 22 33" },
  });

  const user2Password = await bcrypt.hash("Test123!", 12);
  const user2 = await prisma.user.upsert({
    where: { email: "ayse@test.com" },
    update: {},
    create: { email: "ayse@test.com", name: "Ayşe Kaya", password: user2Password, phone: "0535 444 55 66" },
  });

  await prisma.address.upsert({
    where: { id: "addr-user1-home" },
    update: {},
    create: {
      id: "addr-user1-home",
      userId: user1.id,
      title: "Ev",
      fullName: "Ahmet Yılmaz",
      phone: "0532 111 22 33",
      city: "İstanbul",
      district: "Kadıköy",
      line: "Moda Caddesi No:42 Daire:5",
      isDefault: true,
    },
  });

  // ─── Kategoriler — 3D Baskı Ürünleri (PARTS) ─────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "figurler" },
      update: { name: "Figürler" },
      create: { name: "Figürler", slug: "figurler", type: CategoryType.PARTS },
    }),
    prisma.category.upsert({
      where: { slug: "ev-dekorasyon" },
      update: { name: "Ev & Dekorasyon" },
      create: { name: "Ev & Dekorasyon", slug: "ev-dekorasyon", type: CategoryType.PARTS },
    }),
    prisma.category.upsert({
      where: { slug: "oyuncak-koleksiyon" },
      update: { name: "Oyuncak & Koleksiyon" },
      create: { name: "Oyuncak & Koleksiyon", slug: "oyuncak-koleksiyon", type: CategoryType.PARTS },
    }),
    prisma.category.upsert({
      where: { slug: "taki-aksesuar" },
      update: { name: "Takı & Aksesuar" },
      create: { name: "Takı & Aksesuar", slug: "taki-aksesuar", type: CategoryType.PARTS },
    }),
    prisma.category.upsert({
      where: { slug: "fonksiyonel" },
      update: { name: "Fonksiyonel" },
      create: { name: "Fonksiyonel", slug: "fonksiyonel", type: CategoryType.PARTS },
    }),
    prisma.category.upsert({
      where: { slug: "minyatur-maket" },
      update: { name: "Minyatür & Maket" },
      create: { name: "Minyatür & Maket", slug: "minyatur-maket", type: CategoryType.PARTS },
    }),
    // ── Filament kategorileri ──────────────────────────────────────
    prisma.category.upsert({
      where: { slug: "pla-filament" },
      update: {},
      create: { name: "PLA Filament", slug: "pla-filament", type: CategoryType.FILAMENT },
    }),
    prisma.category.upsert({
      where: { slug: "petg-filament" },
      update: {},
      create: { name: "PETG Filament", slug: "petg-filament", type: CategoryType.FILAMENT },
    }),
    prisma.category.upsert({
      where: { slug: "abs-asa-filament" },
      update: {},
      create: { name: "ABS & ASA Filament", slug: "abs-asa-filament", type: CategoryType.FILAMENT },
    }),
    prisma.category.upsert({
      where: { slug: "teknik-filament" },
      update: {},
      create: { name: "Teknik Filament (CF/PA/TPU)", slug: "teknik-filament", type: CategoryType.FILAMENT },
    }),
  ]);

  const [figurlerCat, evDekorCat, oyuncakCat, takiCat, fonksiyonelCat, minyaturCat,
         plaCat, petgCat, absCat, teknikCat] = categories;

  // ─── 3D Baskı Ürünleri (12 adet) ─────────────────────────────────
  const products = [
    // Figürler
    {
      name: "Naruto Uzumaki — Sage Mode Figürü",
      slug: "naruto-sage-mode-figuru",
      description: "Naruto Uzumaki'nin Sage Mode pozisyonunun yüksek detaylı 3D baskı figürü. PLA malzeme, 0.1mm baskı kalitesi. Elde boyama veya ham olarak sipariş verilebilir.",
      price: 349.00,
      stock: 8,
      categoryId: figurlerCat.id,
      specs: { malzeme: "PLA", boyut: "18cm yükseklik", agirlik: "120g", baskiKalitesi: "0.1mm", yuzey: "Ham" },
    },
    {
      name: "Monkey D. Luffy — Gear 5 Figürü",
      slug: "luffy-gear5-figuru",
      description: "One Piece'in sevilen karakteri Luffy'nin Gear 5 formunun dinamik figürü. Detaylı yüz ifadesi ve kıyafet dokusu.",
      price: 399.00,
      salePrice: 349.00,
      stock: 5,
      categoryId: figurlerCat.id,
      specs: { malzeme: "PLA", boyut: "20cm yükseklik", agirlik: "145g", baskiKalitesi: "0.1mm", yuzey: "Ham" },
    },
    {
      name: "Ejderha Heykel — Büyük",
      slug: "ejderha-heykel-buyuk",
      description: "Detaylı pul ve kanat yapısına sahip epik ejderha heykeli. Masa üstü dekorasyon için ideal, PETG dayanıklı malzeme.",
      price: 549.00,
      stock: 4,
      categoryId: figurlerCat.id,
      specs: { malzeme: "PETG", boyut: "30x25x20cm", agirlik: "320g", baskiKalitesi: "0.15mm", yuzey: "Ham" },
    },
    {
      name: "Mandalorian Kask Koleksiyon",
      slug: "mandalorian-kask",
      description: "1:1 ölçekli Mandalorian kask replikası. Koleksiyon veya cosplay için uygun, parçalı yapı halinde teslim.",
      price: 899.00,
      salePrice: 749.00,
      stock: 3,
      categoryId: figurlerCat.id,
      specs: { malzeme: "PLA", boyut: "1:1 Ölçek", agirlik: "650g", baskiKalitesi: "0.2mm", yuzey: "Ham" },
    },
    // Ev & Dekorasyon
    {
      name: "Spiral Vazo — Orta Boy",
      slug: "spiral-vazo-orta",
      description: "Modern spiral desen vazo. Gerçek çiçek veya kuru çiçek için uygun, su geçirmez kaplama opsiyonu mevcuttur.",
      price: 189.00,
      stock: 25,
      categoryId: evDekorCat.id,
      specs: { malzeme: "PLA", boyut: "15cm yükseklik", agirlik: "95g", baskiKalitesi: "0.2mm", yuzey: "Ham" },
    },
    {
      name: "Geometrik Saksı Seti (3'lü)",
      slug: "geometrik-saksi-seti",
      description: "3 farklı boyutta geometrik sukulent saksısı seti. Minimalist tasarım, herhangi bir dekor ile uyumlu.",
      price: 269.00,
      stock: 18,
      categoryId: evDekorCat.id,
      specs: { malzeme: "PLA", boyut: "8cm / 12cm / 16cm", agirlik: "180g", baskiKalitesi: "0.2mm", yuzey: "Ham" },
    },
    {
      name: "İstanbul Silüeti Duvar Sanatı",
      slug: "istanbul-silueti-duvar",
      description: "Boğaz köprüsü ve camii silüetini içeren lazer-hassasiyetinde duvar dekorasyonu. Vidalama veya yapıştırma ile montaj.",
      price: 419.00,
      stock: 10,
      categoryId: evDekorCat.id,
      specs: { malzeme: "PLA", boyut: "40x20cm", agirlik: "185g", baskiKalitesi: "0.1mm", yuzey: "Ham" },
    },
    // Oyuncak & Koleksiyon
    {
      name: "Satranç Takımı — Gotik Temalı",
      slug: "satranc-takimi-gotik",
      description: "32 taşlı gotik temalı satranç seti. Kale, şövalye ve diğer taşlar özgün tasarım. Tahta ayrı satılmaktadır.",
      price: 649.00,
      salePrice: 549.00,
      stock: 6,
      categoryId: oyuncakCat.id,
      specs: { malzeme: "PLA", parcaSayisi: "32 taş", agirlik: "380g", baskiKalitesi: "0.1mm", yuzey: "Ham" },
    },
    {
      name: "Gemi Maketi — 1:100 Ölçek",
      slug: "gemi-maketi-1-100",
      description: "Osmanlı kalyonu detaylı gemi maketi. Eğitim veya koleksiyon amaçlı, 14 parçalı kit olarak gönderilir.",
      price: 529.00,
      stock: 5,
      categoryId: oyuncakCat.id,
      specs: { malzeme: "PLA", boyut: "35cm uzunluk", agirlik: "290g", baskiKalitesi: "0.15mm", yuzey: "Ham" },
    },
    // Takı & Aksesuar
    {
      name: "Özel Tasarım Anahtarlık",
      slug: "ozel-tasarim-anahtarlik",
      description: "İsim veya logo baskılı kişiselleştirilmiş anahtarlık. Sipariş notuna istediğiniz yazıyı belirtin.",
      price: 89.00,
      stock: 50,
      categoryId: takiCat.id,
      specs: { malzeme: "PLA", boyut: "6x3cm", agirlik: "12g", baskiKalitesi: "0.1mm", ozellestirilmis: true },
    },
    // Fonksiyonel
    {
      name: "Telefon & Tablet Standı — Ayarlanabilir",
      slug: "telefon-tablet-standi",
      description: "0-90° arasında ayarlanabilir açılı telefon ve tablet standı. Masaüstü şarj ve izleme için ergonomik tasarım.",
      price: 169.00,
      stock: 35,
      categoryId: fonksiyonelCat.id,
      specs: { malzeme: "PETG", boyut: "12x10x8cm", agirlik: "145g", baskiKalitesi: "0.2mm", yuzey: "Ham" },
    },
    {
      name: "Kablo Düzenleyici Set (6'lı)",
      slug: "kablo-duzenleyici-set",
      description: "Masa üstü kablo yönetimi için 6 farklı boyutta kablo tutucu seti. Güçlü yapıştırıcı taban ile sabitlenir.",
      price: 129.00,
      stock: 40,
      categoryId: fonksiyonelCat.id,
      specs: { malzeme: "TPU", parcaSayisi: "6 adet", agirlik: "65g", baskiKalitesi: "0.2mm", yuzey: "Ham" },
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        salePrice: (p as { salePrice?: number }).salePrice ?? null,
        categoryId: p.categoryId,
        specs: p.specs,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        salePrice: (p as { salePrice?: number }).salePrice ?? null,
        stock: p.stock,
        images: [`/images/products/${p.slug}.jpg`],
        categoryId: p.categoryId,
        brand: null,
        specs: p.specs,
      },
    });
  }

  // ─── Filament ürünleri (8 adet) ───────────────────────────────────
  const filaments = [
    {
      name: "Bambu Lab PLA Basic Beyaz 1kg",
      slug: "bambu-pla-basic-beyaz-1kg",
      description: "Yüksek kaliteli PLA filament. Pürüzsüz yüzey, güvenilir baskı performansı.",
      price: 649.00, salePrice: 549.00, stock: 120,
      categoryId: plaCat.id, brand: "Bambu Lab",
      specs: { material: "PLA", color: "Beyaz", diameter: "1.75mm", weight: "1kg", printTemp: "190-230°C" },
    },
    {
      name: "eSUN PLA+ Siyah 1kg",
      slug: "esun-pla-plus-siyah-1kg",
      description: "Geliştirilmiş PLA+ formülü. Standart PLA'ya göre daha sert ve darbe dirençli.",
      price: 399.00, stock: 85,
      categoryId: plaCat.id, brand: "eSUN",
      specs: { material: "PLA+", color: "Siyah", diameter: "1.75mm", weight: "1kg", printTemp: "205-225°C" },
    },
    {
      name: "Bambu Lab PETG HF Şeffaf Mavi 1kg",
      slug: "bambu-petg-hf-seffaf-mavi-1kg",
      description: "Yüksek akış PETG. Kimyasal direnç ve esneklik dengesi mükemmel.",
      price: 749.00, stock: 60,
      categoryId: petgCat.id, brand: "Bambu Lab",
      specs: { material: "PETG HF", color: "Şeffaf Mavi", diameter: "1.75mm", weight: "1kg", printTemp: "230-260°C" },
    },
    {
      name: "Polymaker PolyLite PETG Kırmızı 1kg",
      slug: "polymaker-polylite-petg-kirmizi-1kg",
      description: "PolyLite serisi PETG. Düşük deformasyon, yüksek sertlik.",
      price: 479.00, salePrice: 399.00, stock: 45,
      categoryId: petgCat.id, brand: "Polymaker",
      specs: { material: "PETG", color: "Kırmızı", diameter: "1.75mm", weight: "1kg", printTemp: "230-250°C" },
    },
    {
      name: "Bambu Lab ABS 1kg Gri",
      slug: "bambu-abs-gri-1kg",
      description: "Bambu Lab ABS. Düşük çarpılma, yüksek sıcaklık direnci.",
      price: 699.00, stock: 35,
      categoryId: absCat.id, brand: "Bambu Lab",
      specs: { material: "ABS", color: "Gri", diameter: "1.75mm", weight: "1kg", printTemp: "230-260°C" },
    },
    {
      name: "eSUN ASA Beyaz 1kg",
      slug: "esun-asa-beyaz-1kg",
      description: "UV dayanımlı ASA filament. Dış mekan uygulamaları için ideal.",
      price: 549.00, stock: 28,
      categoryId: absCat.id, brand: "eSUN",
      specs: { material: "ASA", color: "Beyaz", diameter: "1.75mm", weight: "1kg", printTemp: "240-260°C" },
    },
    {
      name: "Bambu Lab PA-CF 500g",
      slug: "bambu-pa-cf-500g",
      description: "Karbon fiber takviyeli naylon. Mühendislik uygulamaları için üstün mukavemet.",
      price: 1299.00, stock: 15,
      categoryId: teknikCat.id, brand: "Bambu Lab",
      specs: { material: "PA-CF", diameter: "1.75mm", weight: "500g", printTemp: "260-280°C" },
    },
    {
      name: "Polymaker PolyFlex TPU90 Siyah 750g",
      slug: "polymaker-polyflex-tpu90-siyah-750g",
      description: "Esnek TPU filament. Mükemmel uzama oranı, güçlü yapışma.",
      price: 649.00, salePrice: 579.00, stock: 40,
      categoryId: teknikCat.id, brand: "Polymaker",
      specs: { material: "TPU", hardness: "90A", color: "Siyah", diameter: "1.75mm", weight: "750g" },
    },
  ];

  for (const f of filaments) {
    await prisma.product.upsert({
      where: { slug: f.slug },
      update: {},
      create: {
        name: f.name, slug: f.slug, description: f.description,
        price: f.price, salePrice: (f as { salePrice?: number }).salePrice ?? null,
        stock: f.stock, images: [`/images/products/${f.slug}.jpg`],
        categoryId: f.categoryId, brand: f.brand, specs: f.specs,
      },
    });
  }

  // ─── Örnek sipariş ────────────────────────────────────────────────
  const prod1   = await prisma.product.findUnique({ where: { slug: "naruto-sage-mode-figuru" } });
  const prod2   = await prisma.product.findUnique({ where: { slug: "spiral-vazo-orta" } });
  const address = await prisma.address.findFirst({ where: { userId: user1.id } });

  if (prod1 && prod2 && address) {
    await prisma.order.create({
      data: {
        userId: user1.id, addressId: address.id,
        status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID,
        totalAmount: prod1.price.toNumber() + prod2.price.toNumber(),
        items: {
          create: [
            { productId: prod1.id, quantity: 1, price: prod1.price },
            { productId: prod2.id, quantity: 1, price: prod2.price },
          ],
        },
      },
    });
  }

  // ─── Örnek servis talepleri ───────────────────────────────────────
  await prisma.serviceRequest.create({
    data: {
      userId: user1.id,
      type: ServiceType.PRINT,
      status: ServiceStatus.QUOTED,
      title: "Drone gövdesi baskısı",
      description: "FPV drone için özel tasarım gövde parçası. PETG malzeme, 0.2mm kalite.",
      files: ["/uploads/drone-body.stl"],
      specs: { material: "PETG", quality: "Standard", color: "Siyah", estimatedWeight: "85g" },
      price: 450.00,
    },
  });

  await prisma.serviceRequest.create({
    data: {
      userId: user2.id,
      type: ServiceType.TECHNICAL,
      status: ServiceStatus.IN_PROGRESS,
      title: "Ender 3 ekstruder tıkanması",
      description: "Ender 3 yazıcımda ekstruder sürekli tıkanıyor.",
      files: [],
      specs: { printerModel: "Ender 3 Pro", issue: "Ekstruder tıkanması" },
    },
  });

  console.log("✅ Seed tamamlandı!");
  console.log("  - Admin: admin@dynexa.com / Admin123!");
  console.log("  - Kullanıcı 1: ahmet@test.com / Test123!");
  console.log("  - Kullanıcı 2: ayse@test.com / Test123!");
  console.log(`  - ${categories.length} kategori, ${products.length + filaments.length} ürün`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
