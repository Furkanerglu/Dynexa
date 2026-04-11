import { PrismaClient, CategoryType, OrderStatus, PaymentStatus, ServiceType, ServiceStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed başlatılıyor...");

  // Admin kullanıcı
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dynexa.com" },
    update: {},
    create: {
      email: "admin@dynexa.com",
      name: "DYNEXA Admin",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Test kullanıcılar
  const user1Password = await bcrypt.hash("Test123!", 12);
  const user1 = await prisma.user.upsert({
    where: { email: "ahmet@test.com" },
    update: {},
    create: {
      email: "ahmet@test.com",
      name: "Ahmet Yılmaz",
      password: user1Password,
      phone: "0532 111 22 33",
    },
  });

  const user2Password = await bcrypt.hash("Test123!", 12);
  const user2 = await prisma.user.upsert({
    where: { email: "ayse@test.com" },
    update: {},
    create: {
      email: "ayse@test.com",
      name: "Ayşe Kaya",
      password: user2Password,
      phone: "0535 444 55 66",
    },
  });

  // Adres
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

  // Kategoriler - PARTS
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "hotend-nozzle" },
      update: {},
      create: { name: "Hotend & Nozzle", slug: "hotend-nozzle", type: CategoryType.PARTS },
    }),
    prisma.category.upsert({
      where: { slug: "ekstruder" },
      update: {},
      create: { name: "Ekstruder", slug: "ekstruder", type: CategoryType.PARTS },
    }),
    prisma.category.upsert({
      where: { slug: "motor-ray" },
      update: {},
      create: { name: "Motor & Ray", slug: "motor-ray", type: CategoryType.PARTS },
    }),
    prisma.category.upsert({
      where: { slug: "yatak-cerceve" },
      update: {},
      create: { name: "Yatak & Çerçeve", slug: "yatak-cerceve", type: CategoryType.PARTS },
    }),
    // Kategoriler - FILAMENT
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

  const [hotendCat, ekstruderCat, motorCat, yatakCat, plaCat, petgCat, absCat, teknikCat] = categories;

  // Ürünler - PARTS (12 adet)
  const parts = [
    {
      name: "Bambu Lab Hardened Steel Nozzle 0.4mm",
      slug: "bambu-lab-hardened-steel-nozzle-04",
      description: "Bambu Lab yazıcılar için sertleştirilmiş çelik nozzle. Aşındırıcı filamentler için ideal.",
      price: 349.90,
      stock: 45,
      categoryId: hotendCat.id,
      brand: "Bambu Lab",
      specs: { diameter: "0.4mm", material: "Sertleştirilmiş Çelik", compatibility: "Bambu Lab X1/P1 Series" },
    },
    {
      name: "E3D V6 All-Metal Hotend Kit",
      slug: "e3d-v6-all-metal-hotend-kit",
      description: "Endüstri standardı E3D V6 hotend. Yüksek sıcaklık filamentler için tasarlanmış.",
      price: 899.00,
      salePrice: 749.00,
      stock: 18,
      categoryId: hotendCat.id,
      brand: "E3D",
      specs: { maxTemp: "300°C", diameter: "1.75mm", heaterBlock: "Alüminyum" },
    },
    {
      name: "Volcano Nozzle Set (0.4/0.6/0.8/1.0mm)",
      slug: "volcano-nozzle-set",
      description: "4'lü Volcano nozzle seti. Yüksek akış hızı için geniş giriş.",
      price: 299.90,
      stock: 32,
      categoryId: hotendCat.id,
      brand: "E3D",
      specs: { sizes: ["0.4mm", "0.6mm", "0.8mm", "1.0mm"], material: "Pirinç" },
    },
    {
      name: "BMG Dual Drive Ekstruder",
      slug: "bmg-dual-drive-ekstruder",
      description: "Bondtech BMG çift tahrikli ekstruder. Flex ve hassas filamentler için üstün performans.",
      price: 649.00,
      salePrice: 549.00,
      stock: 22,
      categoryId: ekstruderCat.id,
      brand: "Bondtech",
      specs: { type: "Dual Drive", gearRatio: "3:1", compatibility: "Ender/Prusa uyumlu" },
    },
    {
      name: "Orbiter Ekstruder v2.0",
      slug: "orbiter-ekstruder-v20",
      description: "Ultra hafif Orbiter ekstruder. Direct drive sistemler için ideal, düşük kütle.",
      price: 549.00,
      stock: 15,
      categoryId: ekstruderCat.id,
      brand: "LDO",
      specs: { weight: "130g", gearRatio: "7.5:1", type: "Direct Drive" },
    },
    {
      name: "Creality Ender 3 Ekstruder Seti",
      slug: "creality-ender3-ekstruder-seti",
      description: "Creality Ender 3 serisi için metal ekstruder upgrade seti.",
      price: 189.90,
      stock: 60,
      categoryId: ekstruderCat.id,
      brand: "Creality",
      specs: { compatibility: "Ender 3/3 Pro/3 V2", material: "Alüminyum Alaşımı" },
    },
    {
      name: "NEMA 17 Stepper Motor 42-40",
      slug: "nema17-stepper-motor-42-40",
      description: "Standart NEMA 17 step motor. X/Y/Z eksenleri için 42mm gövde, 1.8° adım açısı.",
      price: 249.00,
      stock: 85,
      categoryId: motorCat.id,
      brand: "LDO",
      specs: { torque: "40Ncm", stepAngle: "1.8°", current: "1.5A", shaft: "5mm" },
    },
    {
      name: "Gates GT2 Kayış Seti (2m + 2 Kasnak)",
      slug: "gates-gt2-kayis-seti",
      description: "Orijinal Gates GT2 kayış 2 metre + 2 adet 20 dişli kasnak. Titreşimsiz hareket.",
      price: 199.90,
      stock: 40,
      categoryId: motorCat.id,
      brand: "Gates",
      specs: { width: "6mm", pitch: "2mm", length: "2000mm" },
    },
    {
      name: "MGN12H Lineer Ray 300mm",
      slug: "mgn12h-lineer-ray-300mm",
      description: "MGN12H yüksek hassasiyetli lineer ray sistemi. CoreXY sistemler için ideal.",
      price: 329.00,
      stock: 28,
      categoryId: motorCat.id,
      brand: "HIWIN",
      specs: { length: "300mm", type: "MGN12H", carriage: "1 adet dahil" },
    },
    {
      name: "Ender 3 Cam Yatak 235x235mm",
      slug: "ender3-cam-yatak-235x235",
      description: "Ender 3 için temperli cam baskı yatağı. Düz yüzey, kolay baskı kaldırma.",
      price: 149.90,
      stock: 55,
      categoryId: yatakCat.id,
      brand: "Creality",
      specs: { size: "235x235mm", thickness: "4mm", material: "Temperli Cam" },
    },
    {
      name: "PEI Manyetik Yatak Seti 310x310mm",
      slug: "pei-manyetik-yatak-310x310",
      description: "Çift taraflı PEI manyetik yatak seti. Üstün yapışma ve kolay baskı çıkarma.",
      price: 449.00,
      salePrice: 389.00,
      stock: 20,
      categoryId: yatakCat.id,
      brand: "Energetic",
      specs: { size: "310x310mm", coating: "PEI", magnetic: true },
    },
    {
      name: "V-Slot Profil 2020 Alüminyum 1000mm",
      slug: "v-slot-profil-2020-1000mm",
      description: "Ekstrüde alüminyum V-slot profil. 3D yazıcı çerçeve yapımı için standart.",
      price: 129.90,
      stock: 100,
      categoryId: yatakCat.id,
      brand: "Misumi",
      specs: { dimensions: "20x20mm", length: "1000mm", material: "6063 Alüminyum" },
    },
  ];

  for (const part of parts) {
    await prisma.product.upsert({
      where: { slug: part.slug },
      update: {},
      create: {
        name: part.name,
        slug: part.slug,
        description: part.description,
        price: part.price,
        salePrice: part.salePrice || null,
        stock: part.stock,
        images: [`/images/products/${part.slug}.jpg`],
        categoryId: part.categoryId,
        brand: part.brand,
        specs: part.specs,
      },
    });
  }

  // Ürünler - FILAMENT (8 adet)
  const filaments = [
    {
      name: "Bambu Lab PLA Basic Beyaz 1kg",
      slug: "bambu-pla-basic-beyaz-1kg",
      description: "Yüksek kaliteli PLA filament. Pürüzsüz yüzey, güvenilir baskı performansı.",
      price: 649.00,
      salePrice: 549.00,
      stock: 120,
      categoryId: plaCat.id,
      brand: "Bambu Lab",
      specs: { material: "PLA", color: "Beyaz", diameter: "1.75mm", weight: "1kg", printTemp: "190-230°C" },
    },
    {
      name: "eSUN PLA+ Siyah 1kg",
      slug: "esun-pla-plus-siyah-1kg",
      description: "Geliştirilmiş PLA+ formülü. Standart PLA'ya göre daha sert ve darbe dirençli.",
      price: 399.00,
      stock: 85,
      categoryId: plaCat.id,
      brand: "eSUN",
      specs: { material: "PLA+", color: "Siyah", diameter: "1.75mm", weight: "1kg", printTemp: "205-225°C" },
    },
    {
      name: "Bambu Lab PETG HF Şeffaf Mavi 1kg",
      slug: "bambu-petg-hf-seffaf-mavi-1kg",
      description: "Yüksek akış PETG. Kimyasal direnç ve esneklik dengesi mükemmel.",
      price: 749.00,
      stock: 60,
      categoryId: petgCat.id,
      brand: "Bambu Lab",
      specs: { material: "PETG HF", color: "Şeffaf Mavi", diameter: "1.75mm", weight: "1kg", printTemp: "230-260°C" },
    },
    {
      name: "Polymaker PolyLite PETG Kırmızı 1kg",
      slug: "polymaker-polylite-petg-kirmizi-1kg",
      description: "PolyLite serisi PETG. Düşük deformasyon, yüksek sertlik.",
      price: 479.00,
      salePrice: 399.00,
      stock: 45,
      categoryId: petgCat.id,
      brand: "Polymaker",
      specs: { material: "PETG", color: "Kırmızı", diameter: "1.75mm", weight: "1kg", printTemp: "230-250°C" },
    },
    {
      name: "Bambu Lab ABS 1kg Gri",
      slug: "bambu-abs-gri-1kg",
      description: "Bambu Lab ABS. Düşük çarpılma, yüksek sıcaklık direnci.",
      price: 699.00,
      stock: 35,
      categoryId: absCat.id,
      brand: "Bambu Lab",
      specs: { material: "ABS", color: "Gri", diameter: "1.75mm", weight: "1kg", printTemp: "230-260°C" },
    },
    {
      name: "eSUN ASA Beyaz 1kg",
      slug: "esun-asa-beyaz-1kg",
      description: "UV dayanımlı ASA filament. Dış mekan uygulamaları için ideal.",
      price: 549.00,
      stock: 28,
      categoryId: absCat.id,
      brand: "eSUN",
      specs: { material: "ASA", color: "Beyaz", diameter: "1.75mm", weight: "1kg", printTemp: "240-260°C" },
    },
    {
      name: "Bambu Lab PA-CF 500g",
      slug: "bambu-pa-cf-500g",
      description: "Karbon fiber takviyeli naylon. Mühendislik uygulamaları için üstün mukavemet.",
      price: 1299.00,
      stock: 15,
      categoryId: teknikCat.id,
      brand: "Bambu Lab",
      specs: { material: "PA-CF", diameter: "1.75mm", weight: "500g", printTemp: "260-280°C", hardened: true },
    },
    {
      name: "Polymaker PolyFlex TPU90 Siyah 750g",
      slug: "polymaker-polyflex-tpu90-siyah-750g",
      description: "Esnek TPU filament. Mükemmel uzama oranı, güçlü yapışma.",
      price: 649.00,
      salePrice: 579.00,
      stock: 40,
      categoryId: teknikCat.id,
      brand: "Polymaker",
      specs: { material: "TPU", hardness: "90A", color: "Siyah", diameter: "1.75mm", weight: "750g" },
    },
  ];

  for (const filament of filaments) {
    await prisma.product.upsert({
      where: { slug: filament.slug },
      update: {},
      create: {
        name: filament.name,
        slug: filament.slug,
        description: filament.description,
        price: filament.price,
        salePrice: filament.salePrice || null,
        stock: filament.stock,
        images: [`/images/products/${filament.slug}.jpg`],
        categoryId: filament.categoryId,
        brand: filament.brand,
        specs: filament.specs,
      },
    });
  }

  // Örnek sipariş
  const product1 = await prisma.product.findUnique({ where: { slug: "bambu-lab-hardened-steel-nozzle-04" } });
  const product2 = await prisma.product.findUnique({ where: { slug: "bambu-pla-basic-beyaz-1kg" } });
  const address = await prisma.address.findFirst({ where: { userId: user1.id } });

  if (product1 && product2 && address) {
    const order1 = await prisma.order.create({
      data: {
        userId: user1.id,
        addressId: address.id,
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        totalAmount: product1.price.toNumber() + product2.price.toNumber(),
        items: {
          create: [
            { productId: product1.id, quantity: 2, price: product1.price },
            { productId: product2.id, quantity: 1, price: product2.price },
          ],
        },
      },
    });

    await prisma.order.create({
      data: {
        userId: user2.id,
        addressId: address.id,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        totalAmount: 749.00,
        items: {
          create: [{ productId: product2.id, quantity: 1, price: 749.00 }],
        },
      },
    });
  }

  // Örnek servis talepleri
  await prisma.serviceRequest.create({
    data: {
      userId: user1.id,
      type: ServiceType.PRINT,
      status: ServiceStatus.QUOTED,
      title: "Drone gövdesi baskısı",
      description: "FPV drone için özel tasarım gövde parçası baskısı. PETG malzeme tercih ediyorum.",
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
      description: "Ender 3 yazıcımda ekstruder sürekli tıkanıyor. Filament ilerletmiyor.",
      files: [],
      specs: { printerModel: "Ender 3 Pro", issue: "Ekstruder tıkanması" },
    },
  });

  console.log("✅ Seed tamamlandı!");
  console.log(`  - Admin: admin@dynexa.com / Admin123!`);
  console.log(`  - Kullanıcı 1: ahmet@test.com / Test123!`);
  console.log(`  - Kullanıcı 2: ayse@test.com / Test123!`);
  console.log(`  - ${categories.length} kategori, ${parts.length + filaments.length} ürün`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
