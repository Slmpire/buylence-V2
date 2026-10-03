# Buylence

> Campus marketplace and grocery delivery platform for OAU students

Buylence connects Obafemi Awolowo University students with verified on-campus vendors, enabling seamless ordering, escrow-protected payments via Nomba, and hall-gate delivery through a dedicated rider network.

Built for the **DevCareer x Nomba Hackathon 2026** by Team TECA.

Live URLs:
- Frontend: https://buylence-frontend.vercel.app

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Payment Integration](#payment-integration)
- [Order Lifecycle](#order-lifecycle)
- [User Roles](#user-roles)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Known Issues and Remaining Work](#known-issues-and-remaining-work)

---

## Overview

Buylence solves a real problem at OAU: students have no trusted digital platform to order food, groceries, and daily essentials from the dozens of informal vendors operating across campus. Vendors lack tools to manage inventory, track earnings, or reach students beyond their immediate vicinity.

The platform provides four distinct portals:

- **Student portal** — browse products, add to cart, checkout with Nomba, track orders, view notifications
- **Vendor portal** — manage inventory, confirm orders, track earnings
- **Rider portal** — claim deliveries from a campus-wide pool, mark pickup and delivery
- **Admin dashboard** — verify vendors, manage riders, oversee all orders and users

Payments are held in escrow via Nomba and released to the vendor only after the student confirms receipt.

---

## Features

### Student
- Browse marketplace with category, hall, and server-side price range filters (`priceMin`, `priceMax`)
- Search products across all vendors with debounced backend query processing
- Interactive **Product Detail Modal** — quick view modal with stock status, hall availability, vendor info, and quantity controls
- Add to cart with visual checkmark feedback and persistent cart state
- Complete checkout with Nomba payment gateway
- Escrow-protected payments — funds held safely until delivery confirmation
- Real-time order status tracking
- Confirm delivery to release escrow payment to vendor
- In-app **Notification Drawer** with unread badge counter and categorized alerts
- Customizable notification preferences (order updates, flash deals, vendor messages, weekly digest)
- Order history and archive
- Profile management and account settings
- Password change via Firebase & seamless Google Sign-in sync

### Vendor
- Onboarding wizard — store setup, categories, delivery halls
- Product inventory management — add, edit, delete (soft deletion)
- Order management with lifecycle actions — confirm, mark ready for pickup
- Earnings dashboard with today, weekly, monthly, and all-time breakdown
- Hall delivery overview — read-only since riders handle delivery

### Rider
- Campus-wide pending order pool
- Claim orders with 15-minute auto-expiry — unclaimed orders return to pool automatically
- Mark picked up and mark delivered actions
- Delivery history paginated
- Earnings breakdown per delivery

### Admin
- Platform stats overview — total users, vendors, orders, revenue
- Vendor verification management — toggle verified status
- Rider onboarding — add new riders with Firebase UID
- Rider activation and deactivation
- All-orders oversight with status filtering
- All-users list with role display

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| React Router v6 | Client-side routing with role-based guards |
| Zustand | Global state management (auth, cart, search) with localStorage persistence |
| Axios | HTTP client with Firebase token interceptor |
| Firebase JS SDK v12 | Authentication — email/password and Google sign-in with auto-sync |
| Lucide React | Icon library |
| Custom Vanilla CSS | Design system & micro-animations — no heavy CSS framework dependencies |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Prisma ORM v7 | Database client with pg driver adapter |
| PostgreSQL on Supabase | Primary database |
| Firebase Admin SDK | Server-side Firebase token verification |
| Nomba API | Payment gateway with escrow |
| express-async-handler | Async error propagation |
| helmet | HTTP security headers |
| cors | Cross-origin resource sharing |
| morgan | HTTP request logging |
| express-rate-limit | API rate limiting |

---

## Project Structure

```
buylence/
├── client/                           # React + Vite frontend
│   ├── public/
│   │   └── _redirects               # SPA routing for Vercel
│   ├── src/
│   │   ├── components/
│   │   │   ├── cart/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx        # Main navigation with notification bell & mobile drawer
│   │   │   │   ├── Footer.jsx        # Site footer with mobile accordion
│   │   │   │   ├── NotificationDrawer.jsx # Slide-out notification panel & settings
│   │   │   │   └── ProtectedRoute.jsx # AuthRoute, VendorRoute, RiderRoute, AdminRoute
│   │   │   ├── product/
│   │   │   │   ├── ProductCard.jsx   # Shared product card with add-to-cart & detail modal trigger
│   │   │   │   ├── ProductModal.jsx  # Interactive product detail sheet / quick view
│   │   │   │   └── CategoryPage.jsx  # Generic category page fetching real API
│   │   │   └── vendor/
│   │   │       └── VendorLayout.jsx  # Shared vendor shell with sidebar
│   │   ├── hooks/
│   │   │   ├── useAuth.js            # Firebase auth hook
│   │   │   ├── useCart.js            # Cart hook with order placement
│   │   │   ├── useSearch.js          # Server-side search & price filter hook
│   │   │   └── useWindowSize.js      # Mobile responsive hook
│   │   ├── lib/
│   │   │   ├── axios.js              # Axios instance with Firebase token interceptor
│   │   │   ├── firebase.js           # Firebase init and Google provider export
│   │   │   └── utils.js              # formatNaira, truncate, getInitials
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── AdminDashboard.jsx # 5-tab admin panel
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx         # Email and Google login
│   │   │   │   └── Signup.jsx        # Email and Google signup with vendor tab
│   │   │   ├── categories/
│   │   │   │   ├── Grains.jsx        # Grains & Cereals category
│   │   │   │   ├── Proteins.jsx      # Proteins & Meat category
│   │   │   │   ├── Tubers.jsx        # Tubers & Roots category
│   │   │   │   ├── Vegetables.jsx    # Vegetables category
│   │   │   │   ├── Oils.jsx          # Oils & Spices category
│   │   │   │   └── Snacks.jsx        # Snacks & Beverages category
│   │   │   ├── checkout/
│   │   │   │   ├── Cart.jsx          # Cart page with item management
│   │   │   │   ├── Checkout.jsx      # 3-step checkout with Nomba integration
│   │   │   │   └── Confirmation.jsx  # Order confirmation page
│   │   │   ├── dashboard/
│   │   │   │   ├── BuyerDashboard.jsx # Student dashboard with real order stats
│   │   │   │   ├── Profile.jsx       # Profile management saving to DB
│   │   │   │   └── UserSettings.jsx  # Password change, notifications, privacy
│   │   │   ├── marketplace/
│   │   │   │   ├── Marketplace.jsx   # Product grid with category and sort filters
│   │   │   │   └── Search.jsx        # Search with sidebar filters, price slider & grid
│   │   │   ├── onboarding/
│   │   │   │   └── VendorOnboarding.jsx # 3-step vendor onboarding wizard
│   │   │   ├── orders/
│   │   │   │   ├── Orders.jsx        # Order archive with real API data
│   │   │   │   └── OrderDetail.jsx   # Order detail with escrow confirmation
│   │   │   ├── rider/
│   │   │   │   ├── RiderDashboard.jsx # Pending pool and active deliveries
│   │   │   │   ├── RiderHistory.jsx  # Paginated delivery history
│   │   │   │   └── RiderEarnings.jsx # Earnings breakdown by period
│   │   │   └── vendor/
│   │   │       ├── VendorDashboard.jsx # Vendor stats and recent orders
│   │   │       ├── VendorPage.jsx    # Public vendor storefront
│   │   │       ├── VendorsList.jsx   # Vendor directory with filters
│   │   │       └── vendor-manage/
│   │   │           ├── MyProducts.jsx    # Inventory management table
│   │   │           ├── AddProduct.jsx    # Add product form
│   │   │           ├── Earnings.jsx      # Revenue charts and withdrawals
│   │   │           ├── HallDelivery.jsx  # Order management with vendor actions
│   │   │           └── Settings.jsx      # Store settings saved to DB
│   │   ├── store/
│   │   │   ├── authStore.js          # Zustand auth with Firebase and backend sync
│   │   │   ├── cartStore.js          # Zustand cart with localStorage persistence
│   │   │   └── searchStore.js        # Search state store
│   │   └── App.jsx                   # All routes with role-based guards
│   ├── vercel.json                   # Vercel SPA routing config
│   └── package.json
│
└── server/                           # Express backend API
    ├── prisma/
    │   ├── schema.prisma             # Database schema (User, Vendor, Rider, Product, Order, Notification, etc.)
    │   └── seed.js                   # Seed data with products, vendors, and categories
    ├── src/
    │   ├── config/
    │   │   └── firebase.js           # Firebase Admin SDK initialization
    │   ├── middleware/
    │   │   ├── auth.js               # Firebase token verification middleware
    │   │   ├── requireRole.js        # Role-based access control middleware
    │   │   └── errorHandler.js       # Centralized error handler
    │   ├── routes/
    │   │   ├── auth.routes.js        # POST /sync, GET /me, PATCH /profile, GET /users
    │   │   ├── product.routes.js     # CRUD, search, price filters (priceMin/priceMax), hall filter
    │   │   ├── vendor.routes.js      # List, onboard, dashboard, earnings, settings
    │   │   ├── order.routes.js       # Full order lifecycle — all roles
    │   │   ├── rider.routes.js       # Admin CRUD and rider self-management
    │   │   ├── payment.routes.js     # Nomba initialize, verify, webhook
    │   │   └── notification.routes.js # GET/PATCH notifications & preferences
    │   ├── services/
    │   │   ├── nomba.service.js      # Nomba API client with token caching
    │   │   ├── escrow.service.js     # Escrow release — stamps timestamp, updates vendor sales
    │   │   └── claimExpiry.service.js # Lazy rider claim expiry checker
    │   ├── utils/
    │   │   └── prisma.js             # Prisma singleton with @prisma/adapter-pg
    │   └── index.js                  # Express app — middleware, routes, error handler
    ├── prisma.config.ts              # Prisma 7 config with DIRECT_URL for migrations
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- A Supabase project with PostgreSQL database
- A Firebase project with Email/Password and Google auth enabled
- Nomba developer account with API credentials

### 1. Clone the repository

```bash
git clone https://github.com/Slmpire/buylence-v2.git
cd buylence-v2
```

### 2. Set up the backend

```bash
cd server
npm install
cp .env.example .env
# Fill in all values in .env
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
npm run dev
```

Server runs on http://localhost:5000 (or http://localhost:5001)

### 3. Set up the frontend

```bash
cd client
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

Frontend runs on http://localhost:5173

---

## Environment Variables

### Backend — server/.env

```env
# PostgreSQL — Supabase
# Use pooled URL for runtime, direct URL for migrations
DATABASE_URL=postgresql://postgres:[password]@[host]:6543/postgres?pgbouncer=true&connect_timeout=30
DIRECT_URL=postgresql://postgres:[password]@[host]:5432/postgres?connect_timeout=30

# Firebase Admin SDK
FIREBASE_PROJECT_ID=shopbuylence
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@shopbuylence.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Nomba Payment Gateway
NOMBA_CLIENT_ID=your-nomba-client-id
NOMBA_CLIENT_SECRET=your-nomba-client-secret
NOMBA_ACCOUNT_ID=your-parent-account-id
NOMBA_SUB_ACCOUNT_ID=your-sub-account-id
NOMBA_BASE_URL=https://api.nomba.com

# App config
NODE_ENV=development
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
RIDER_CLAIM_TIMEOUT_MINUTES=15
PORT=5000
```

### Frontend — client/.env

```env
VITE_API_URL=http://localhost:5000/api
```

---

## API Reference

All endpoints prefixed with `/api`. Protected routes require `Authorization: Bearer <firebase-id-token>` header.

### Authentication — /api/auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/sync` | Required | Create or update user in DB after Firebase sign-in / Google auth |
| GET | `/auth/me` | Required | Get current user profile with vendor/rider includes |
| PATCH | `/auth/profile` | Required | Update fullName, phone, hall, room, matric, bio |
| GET | `/auth/users` | Admin only | List all platform users |

### Products — /api/products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | Public | List products — supports `search`, `category`, `hall`, `vendorId`, `priceMin`, `priceMax`, `page`, `limit` |
| GET | `/products/mine` | Vendor | Get authenticated vendor's own products |
| GET | `/products/:id` | Public | Get single product by ID |
| POST | `/products` | Vendor | Create new product |
| PATCH | `/products/:id` | Vendor | Update product |
| DELETE | `/products/:id` | Vendor | Soft delete product — sets isActive false |

### Notifications — /api/notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | Required | Fetch current user's notifications |
| PATCH | `/notifications/read-all` | Required | Mark all notifications as read |
| PATCH | `/notifications/:id/read` | Required | Mark a specific notification as read |
| DELETE | `/notifications/:id` | Required | Delete a notification |
| GET | `/notifications/preferences` | Required | Fetch user notification preferences |
| PUT | `/notifications/preferences` | Required | Update user notification preferences |

### Vendors — /api/vendors

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/vendors` | Public | List all onboarded vendors with filters |
| GET | `/vendors/:id` | Public | Get vendor public profile |
| POST | `/vendors/onboard` | Required | Complete vendor onboarding — creates Vendor record |
| GET | `/vendors/me/dashboard` | Vendor | Dashboard stats and 10 most recent orders |
| GET | `/vendors/me/earnings` | Vendor | Earnings breakdown by today, week, month, all time |
| PATCH | `/vendors/me` | Vendor | Update store name, description |
| PATCH | `/vendors/:id/verify` | Admin | Toggle vendor verified status |

### Orders — /api/orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/orders` | Buyer | Place new order — calculates server-side prices |
| GET | `/orders` | Buyer | Get buyer's own order history with pagination |
| GET | `/orders/admin/all` | Admin | Get all orders across platform — last 100 |
| GET | `/orders/vendor/all` | Vendor | Get vendor's orders with pagination |
| GET | `/orders/rider/pool` | Rider | Get all READY_FOR_PICKUP orders — runs expiry check |
| GET | `/orders/rider/my-deliveries` | Rider | Get rider's ASSIGNED and PICKED_UP orders |
| GET | `/orders/:id` | Required | Get single order — buyer, vendor, rider, or admin only |
| POST | `/orders/:id/confirm-preparing` | Vendor | Vendor accepts order — status PLACED to PREPARING |
| POST | `/orders/:id/ready-for-pickup` | Vendor | Mark ready — enters rider pool |
| POST | `/orders/:id/claim` | Rider | Claim order — sets 15min expiry timer |
| POST | `/orders/:id/picked-up` | Rider | Mark collected from vendor |
| POST | `/orders/:id/delivered` | Rider | Mark delivered — increments rider totalDeliveries |
| POST | `/orders/:id/confirm-receipt` | Buyer | Confirm received — triggers escrow release |
| POST | `/orders/:id/cancel` | Buyer/Vendor | Cancel while PLACED or PREPARING only |

### Riders — /api/riders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/riders` | Admin | List all riders with active delivery stats |
| POST | `/riders` | Admin | Onboard new rider using Firebase UID |
| GET | `/riders/:id` | Admin | Get single rider with full history |
| PATCH | `/riders/:id/toggle-active` | Admin | Activate or deactivate rider |
| DELETE | `/riders/:id` | Admin | Remove rider — sets inactive, reverts role to BUYER |
| GET | `/riders/me/profile` | Rider | Own profile with total deliveries and avg time |
| GET | `/riders/me/history` | Rider | Paginated completed delivery history |
| GET | `/riders/me/earnings` | Rider | Earnings by today, week, month, all time |

### Payments — /api/payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/payments/initialize` | Buyer | Create Nomba checkout order — returns checkoutLink |
| POST | `/payments/verify/:ref` | Buyer | Manually verify payment status from Nomba |
| POST | `/payments/webhook` | None | Nomba webhook receiver — updates paymentStatus |

---

## Payment Integration

Buylence uses the Nomba payment gateway with a dual-confirmation escrow model.

### Payment Flow

```
Student adds products to cart
          ↓
Student fills checkout form — name, hall, room, payment method
          ↓
POST /api/orders — order created with status PLACED, paymentStatus PENDING
          ↓
POST /api/payments/initialize — Nomba checkout order created
          ↓
Student redirected to Nomba hosted checkout page
Student pays via card, bank transfer, USSD, QR, or installments
          ↓
Nomba fires webhook → POST /api/payments/webhook
Order paymentStatus updated to HELD_IN_ESCROW
          ↓
Vendor sees new order → confirms and prepares
Vendor marks READY_FOR_PICKUP
          ↓
Rider claims from pool → picks up from vendor
Rider marks DELIVERED_BY_RIDER
          ↓
Student confirms receipt → POST /api/orders/:id/confirm-receipt
Order status → CONFIRMED_BY_BUYER
Escrow released → escrowReleasedAt stamped, vendor totalSales updated
```

---

## Order Lifecycle

```
PLACED
  ↓ vendor confirms
PREPARING
  ↓ vendor marks ready
READY_FOR_PICKUP          ← enters rider pool
  ↓ rider claims (15min expiry)
ASSIGNED_TO_RIDER
  ↓ rider picks up from vendor
PICKED_UP
  ↓ rider delivers to hall gate
DELIVERED_BY_RIDER
  ↓ student confirms receipt
CONFIRMED_BY_BUYER        ← escrow released

Any stage before ASSIGNED_TO_RIDER → CANCELLED
```

---

## User Roles

| Role | Access | How to create |
|---|---|---|
| BUYER | Default — marketplace, cart, orders, profile | Sign up normally or via Google |
| VENDOR | Vendor dashboard, products, earnings, delivery | Sign up → select Vendor tab → complete onboarding |
| RIDER | Rider portal — pool, deliveries, earnings | Admin creates via /admin/dashboard Riders tab |
| ADMIN | Full platform oversight | Sign up → manually set role to ADMIN in database |

---

## Database Schema

### Models

- **User** — all platform users with role enum (`BUYER`, `VENDOR`, `RIDER`, `ADMIN`), linked to notification preferences and order history.
- **Vendor** — store profile linked to User, with categories array and delivery settings.
- **Rider** — delivery agent profile linked to User, with vehicle type and stats.
- **Product** — vendor products with images array, available halls array, flash deal flag, compare price, and category.
- **Order** — full order with lifecycle status, escrow timestamps, and rider claim expiry.
- **OrderItem** — line items linked to Order and Product with server-side price snapshot.
- **Review** — buyer reviews linked to Order, Vendor, and Buyer.
- **Notification** — user notifications with title, message, type, read status, and links.
- **NotificationPreference** — user preference toggles for order updates, flash deals, marketing emails, etc.

---

## Deployment

### Backend — Railway

1. Go to railway.app and create a new project
2. Connect your GitHub repository
3. Set Root Directory to `server`
4. Set Start Command to `node src/index.js`
5. Set Build Command to `npm install`
6. Add all environment variables from server/.env
7. Railway auto-deploys on every push to main

### Frontend — Vercel

1. Go to vercel.com and import your GitHub repository
2. Set Root Directory to `client`
3. Framework Preset will auto-detect as Vite
4. Add environment variable: `VITE_API_URL=https://buylence-backend-production.up.railway.app/api`
5. Deploy

---

## Known Issues and Remaining Work

### Fixed / Completed
- Prisma v7 driver adapter configuration with `@prisma/adapter-pg`
- Express route ordering — named routes precede `/:id` parameterized routes
- CORS configuration for local and production Vercel frontend
- Google Sign-in first-time user creation & backend auth sync (`/api/auth/sync`)
- Server-side price filtering (`priceMin`, `priceMax`) in product search API
- Product detail modal popup sheet with real stock, hall availability, and quantity selection
- Full Notification System (In-app drawer, badge counter, preference settings, notification DB models)
- Snacks & Beverages category route and page added
- Mobile text size scaling & cart checkmark feedback animations

### Remaining

#### High Priority
- Nomba webhook registration — submit live backend Railway URL to Nomba webhook settings
- Full end-to-end order lifecycle testing on live production environment
- Admin and rider account creation on production database

#### Medium Priority
- Nomba webhook signature verification — add HMAC SHA256 signature verification
- Product image file uploads — enable direct cloud storage upload (e.g. Cloudinary/S3)
- Vendor withdrawal automated payouts

#### Low Priority
- Flash deal scheduling (time-based automated activation)
- Multi-vendor cart support (split checkout per vendor)
- Push notifications for real-time mobile alerts

---

## Hackathon

Built for the DevCareer x Nomba Hackathon 2026

- **Team**: Team TECA
- **University**: Obafemi Awolowo University, Ile-Ife, Nigeria
- **Event**: Nomba Hackathon 2026

---

## License

MIT

