You are a world-class full-stack developer. Build a complete production-ready e-commerce web application called "DYNEXA" — a 3D printing ecosystem platform.

---

## TECH STACK

- Framework: Next.js 14 (App Router, TypeScript)
- Styling: Tailwind CSS v3
- Animation: Framer Motion
- Canvas Animation: HTML5 Canvas (scroll-linked image sequence)
- Database ORM: Prisma
- Database: PostgreSQL (connection string via env)
- Authentication: NextAuth.js v5 (credentials + Google OAuth)
- State Management: Zustand (cart state)
- Data Fetching: TanStack Query (React Query v5)
- File Uploads: uploadthing (STL files and product images)
- Email: Resend
- Payment: İyzico (Turkish market — use iyzipay npm package, add Stripe as commented fallback)
- Deployment target: Vercel

---

## BRAND & VISUAL IDENTITY

- Brand name: DYNEXA
- Tagline: "Precision in Every Layer"
- Background: Pure dark #020202
- Primary accent: Neon orange #FF6B35
- Secondary accent: Industrial teal #00D4AA
- Typography: Inter (Google Fonts), tracking-tight, minimalist
- Visual mood: High-tech, industrial, premium dark UI (like Vercel + Linear combined)

---

## BUSINESS SERVICES (5 core offerings)

1. **3D Parts Store** — sell 3D printer spare parts (hotends, nozzles, belts, motors, extruders, beds, frames)
2. **Filament Shop** — sell premium filaments (PLA, PETG, ABS, TPU, ASA, CF, PA — by brand, color, diameter)
3. **Print-on-Demand** — customers upload STL files, choose material + quality, get a price quote, place order
4. **3D Scanning Service** — customers describe their physical object, book a scan appointment, upload reference photos
5. **Technical Service** — customers submit printer repair/maintenance requests with problem description and photos

---

## SCROLL ANIMATION — HERO SECTION (CRITICAL FEATURE)

Create a `PrinterCanvas` component with these exact specs:

```tsx
// components/PrinterCanvas.tsx
// Sticky canvas scroll animation — 120 frame sequence
// Container height: h-[400vh] to accommodate all scroll sections
// Canvas: sticky top-0 h-screen w-full, background blends with #020202
// Frame images: /animated-image-printer/printer_frame_[001-040].webp
// (files are already placed in /public/animated-image-printer/ directory)
// useImagePreloader hook preloads all 40 frames
// useScrollProgress hook maps scroll 0→1 to frame index 0→39

// 5 scroll sections — evenly distributed across 40 frames:
// 0.00 – 0.18 → HERO: "PRECISION IN EVERY LAYER" — frames 0–7 (assembled)
// 0.20 – 0.38 → PARTS & SERVICE: "ENGINEERED TO LAST" — frames 8–15 (explosion)
// 0.42 – 0.58 → PRINT & SCAN: "FROM DIGITAL TO PHYSICAL" — frames 16–23 (mid-exploded)
// 0.62 – 0.78 → FILAMENT: "VIBRANT STRENGTH" — frames 24–31 (reassembling)
// 0.82 – 1.00 → THE HUB: "ONE ECOSYSTEM" — frames 32–39 (fully assembled)

// Each section overlays Framer Motion text on top of the canvas
// Text uses motion blur on enter/exit (filter: blur + opacity transition)
// Mobile: canvas uses object-fit contain scaling

// LoadingScreen component shows animated progress bar 0→100% while preloading
```

Implement `useImagePreloader`, `useScrollProgress`, `PrinterCanvas`, and `LoadingScreen` as separate files under `components/scroll/`.

---

## PAGE STRUCTURE (App Router)
app/
layout.tsx                    — Root layout, Providers, Navbar, Footer
page.tsx                      — Landing page (PrinterCanvas hero + sections)
(auth)/
login/page.tsx              — Login form
register/page.tsx           — Register form
shop/
page.tsx                    — All products (parts + filaments) with filter sidebar
[slug]/page.tsx             — Product detail page
filament/
page.tsx                    — Filament shop (filter by material, color, brand, diameter)
services/
print/page.tsx              — Print-on-demand (STL upload form + quote calculator)
scanning/page.tsx           — 3D scanning service booking
technical/page.tsx          — Technical service request form
cart/page.tsx                 — Shopping cart
checkout/page.tsx             — Checkout (address + payment)
account/
page.tsx                    — Account dashboard
orders/page.tsx             — Order history
service-requests/page.tsx   — Service request history
admin/
layout.tsx                  — Admin layout with sidebar
page.tsx                    — Dashboard (stats: revenue, orders, pending services)
products/page.tsx           — Product management (CRUD)
orders/page.tsx             — Order management
services/page.tsx           — Service request management
users/page.tsx              — User management
api/
auth/[...nextauth]/route.ts
products/route.ts
products/[id]/route.ts
cart/route.ts
orders/route.ts
services/route.ts
upload/route.ts
payment/route.ts
payment/webhook/route.ts
admin/stats/route.ts

---

## DATABASE SCHEMA (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?   // hashed, null if OAuth
  role          Role      @default(USER)
  image         String?
  phone         String?
  addresses     Address[]
  orders        Order[]
  cart          CartItem[]
  serviceReqs   ServiceRequest[]
  reviews       Review[]
  createdAt     DateTime  @default(now())
}

enum Role { USER ADMIN }

model Address {
  id         String  @id @default(cuid())
  userId     String
  user       User    @relation(fields: [userId], references: [id])
  title      String  // "Ev", "İş"
  fullName   String
  phone      String
  city       String
  district   String
  line       String
  isDefault  Boolean @default(false)
}

model Category {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  type     CategoryType  // PARTS | FILAMENT
  products Product[]
}

enum CategoryType { PARTS FILAMENT }

model Product {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String     @db.Text
  price       Decimal    @db.Decimal(10,2)
  salePrice   Decimal?   @db.Decimal(10,2)
  stock       Int        @default(0)
  images      String[]   // array of URLs
  categoryId  String
  category    Category   @relation(fields: [categoryId], references: [id])
  brand       String?
  specs       Json?      // flexible specs (diameter, material, color, etc.)
  isActive    Boolean    @default(true)
  cartItems   CartItem[]
  orderItems  OrderItem[]
  reviews     Review[]
  createdAt   DateTime   @default(now())
}

model CartItem {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  quantity  Int
}

model Order {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  items       OrderItem[]
  status      OrderStatus @default(PENDING)
  addressId   String
  totalAmount Decimal     @db.Decimal(10,2)
  paymentId   String?
  paymentStatus PaymentStatus @default(WAITING)
  notes       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum OrderStatus { PENDING CONFIRMED PREPARING SHIPPED DELIVERED CANCELLED }
enum PaymentStatus { WAITING PAID FAILED REFUNDED }

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  price     Decimal @db.Decimal(10,2)
}

model ServiceRequest {
  id          String          @id @default(cuid())
  userId      String
  user        User            @relation(fields: [userId], references: [id])
  type        ServiceType
  status      ServiceStatus   @default(PENDING)
  title       String
  description String          @db.Text
  files       String[]        // uploaded STL files or photos
  specs       Json?           // material, quality for print; object details for scan
  price       Decimal?        @db.Decimal(10,2)
  notes       String?
  adminNotes  String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

enum ServiceType { PRINT SCANNING TECHNICAL }
enum ServiceStatus { PENDING REVIEWING QUOTED CONFIRMED IN_PROGRESS COMPLETED CANCELLED }

model Review {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  productId String?
  product   Product? @relation(fields: [productId], references: [id])
  rating    Int      // 1-5
  comment   String?
  createdAt DateTime @default(now())
}
```

---

## KEY COMPONENTS TO BUILD

### Navbar (`components/Navbar.tsx`)
- Logo: "DYNEXA" with neon orange dot
- Links: Mağaza, Filament, Baskı Hizmeti, Tarama, Teknik Servis
- Icons: Cart (with item count badge), User menu (login/register or profile/logout)
- Sticky, glassmorphism background on scroll: `bg-black/60 backdrop-blur-md`

### Product Card (`components/ProductCard.tsx`)
- Dark card, hover: orange border glow
- Image, name, price, sale price (strikethrough), add-to-cart button
- Stock badge

### Cart Drawer (`components/CartDrawer.tsx`)
- Slides in from right
- List of items with quantity +/- controls
- Subtotal, proceed to checkout button
- Zustand store: `store/cartStore.ts`

### Filter Sidebar (`components/FilterSidebar.tsx`)
- Category, brand, price range slider, material (for filament), in-stock toggle
- URL params sync (useSearchParams)

### STL Upload Form (`components/PrintOrderForm.tsx`)
- Drag & drop STL file upload (uploadthing)
- Material selector: PLA / PETG / ABS / TPU / ASA
- Quality: Draft (0.3mm) / Standard (0.2mm) / Fine (0.1mm) / Ultra (0.05mm)
- Color picker
- Estimated price calculator (client-side: size × quality multiplier)
- Submit creates a ServiceRequest

### Admin Dashboard (`app/admin/page.tsx`)
- Stats cards: Total revenue, orders today, pending service requests, total users
- Recent orders table
- Recent service requests with status badge

---

## ENVIRONMENT VARIABLES

Create `.env.example`:
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
RESEND_API_KEY=
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_BASE_URL=https://sandbox.iyzipay.com

---

## SEED DATA (`prisma/seed.ts`)

Create seed with:
- 1 admin user (admin@dynexa.com / Admin123!)
- 2 test users
- 8 product categories (4 parts, 4 filament)
- 20 products (12 parts + 8 filaments) with realistic 3D printing specs and Turkish pricing (₺)
- 3 sample orders
- 2 sample service requests

---

## IMPLEMENTATION NOTES

1. All prices in Turkish Lira (₺), `Intl.NumberFormat('tr-TR', {style:'currency', currency:'TRY'})`
2. All text in Turkish (UI labels, placeholder text, error messages)
3. Dark mode only — no light mode toggle needed
4. Use `next/image` for all images with proper sizing
5. Implement proper loading states (Suspense + skeleton loaders)
6. Form validation with react-hook-form + zod
7. Toast notifications with sonner
8. Mobile-first responsive design
9. SEO: proper metadata in each page's `generateMetadata`
10. Error boundaries on critical sections
11. Rate limiting on auth routes (using upstash/ratelimit if available, else simple in-memory)

---

## DELIVERABLES — BUILD IN THIS ORDER

IMPORTANT — FRAME IMAGES ALREADY EXIST:
The 40 animation frames are already placed at:
  public/animated-image-printer/printer_frame_001.webp
  public/animated-image-printer/printer_frame_002.webp
  ...
  public/animated-image-printer/printer_frame_040.webp
Do NOT generate or mock these images. Reference them exactly at this path.
The canvas background must be #020202 to blend seamlessly with the frame edges.

1. Project setup: `npx create-next-app@latest dynexa --typescript --tailwind --app --src-dir`
2. Install all dependencies
3. Prisma schema + migrate + seed
4. NextAuth.js setup
5. Zustand cart store
6. Scroll animation components (PrinterCanvas, LoadingScreen, hooks)
7. Landing page
8. Shop pages (listing + detail)
9. Cart + Checkout flow
10. Service request forms (Print, Scan, Technical)
11. Account pages
12. Admin panel
13. API routes
14. `.env.example` and `README.md`

Start building now. Output complete, working code files one by one. Do not summarize or skip any file.