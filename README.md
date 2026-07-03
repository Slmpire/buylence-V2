# Buylence

> Campus marketplace and grocery delivery platform for OAU students

Buylence connects Obafemi Awolowo University students with verified on-campus vendors, enabling seamless ordering, escrow-protected payments via Nomba, and hall-gate delivery through a dedicated rider network.

Built for the **DevCareer x Nomba Hackathon 2026** by Team TECA.

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
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Overview

Buylence solves a real problem at OAU: students have no trusted digital platform to order food, groceries, and daily essentials from the dozens of informal vendors operating across campus. Vendors lack tools to manage inventory, track earnings, or reach students beyond their immediate vicinity.

The platform provides three distinct portals:

- **Student portal** — browse products, add to cart, checkout with Nomba, track orders
- **Vendor portal** — manage inventory, confirm orders, track earnings
- **Rider portal** — claim deliveries from a campus-wide pool, mark pickup and delivery
- **Admin dashboard** — verify vendors, manage riders, oversee all orders

Payments are held in escrow via Nomba and released to the vendor only after the student confirms receipt.

---

## Features

### Student
- Browse marketplace with category and hall filters
- Search products across all vendors
- Add to cart and checkout with Nomba payment gateway
- Escrow-protected payments (funds held until delivery confirmed)
- Real-time order status tracking
- Confirm delivery to release escrow payment
- Order history and archive

### Vendor
- Onboarding wizard (store setup, categories, delivery halls)
- Product inventory management (add, edit, delete)
- Order management with lifecycle actions (confirm, mark ready)
- Earnings dashboard with daily, weekly, and all-time breakdown
- Hall delivery overview — read-only status since riders handle delivery

### Rider
- Campus-wide pending order pool
- Claim orders with 15-minute auto-expiry
- Mark picked up and mark delivered actions
- Delivery history and earnings tracking

### Admin
- Platform stats overview (users, vendors, orders, revenue)
- Vendor verification management
- Rider onboarding and activation/deactivation
- All-orders oversight

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| React Router v6 | Client-side routing |
| Zustand | Global state management |
| Axios | HTTP client with Firebase token interceptor |
| Firebase JS SDK v12 | Authentication (email/password + Google) |
| Custom inline styles | Design system (no CSS framework) |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Prisma ORM v7 | Database client with driver adapter |
| PostgreSQL (Supabase) | Primary database |
| Firebase Admin SDK | Server-side token verification |
| Nomba API | Payment gateway with escrow |
| express-async-handler | Async error handling |
| helmet + cors | Security middleware |

---

## Project Structure

```
buylence/
├── client/                          # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Navbar, Footer, ProtectedRoute
│   │   │   ├── product/             # ProductCard, CategoryPage
│   │   │   └── vendor/              # VendorLayout
│   │   ├── hooks/
│   │   │   ├── useAuth.js           # Firebase auth hook
│   │   │   ├── useCart.js           # Cart with order placement
│   │   │   ├── useSearch.js         # Debounced product search
│   │   │   └── useWindowSize.js     # Mobile responsive hook
│   │   ├── lib/
│   │   │   ├── axios.js             # Axios instance with auth interceptor
│   │   │   ├── firebase.js          # Firebase init + Google provider
│   │   │   └── utils.js             # formatNaira, truncate, getInitials
│   │   ├── pages/
│   │   │   ├── admin/               # AdminDashboard
│   │   │   ├── auth/                # Login, Signup
│   │   │   ├── categories/          # Grains, Proteins, Tubers, Vegetables, Oils
│   │   │   ├── checkout/            # Cart, Checkout, Confirmation
│   │   │   ├── dashboard/           # BuyerDashboard, Profile, UserSettings
│   │   │   ├── marketplace/         # Marketplace, Search
│   │   │   ├── onboarding/          # VendorOnboarding
│   │   │   ├── orders/              # Orders, OrderDetail
│   │   │   ├── rider/               # RiderDashboard, RiderHistory, RiderEarnings
│   │   │   └── vendor/              # VendorDashboard, VendorPage, VendorsList
│   │   ├── store/
│   │   │   ├── authStore.js         # Zustand auth store (Firebase + backend sync)
│   │   │   └── cartStore.js         # Zustand cart store (persisted)
│   │   └── App.jsx                  # Routes with role-based guards
│   ├── .env
│   └── package.json
│
└── server/                          # Express backend
    ├── prisma/
    │   ├── schema.prisma            # Database schema
    │   └── seed.js                  # Sample data seed
    ├── src/
    │   ├── config/
    │   │   └── firebase.js          # Firebase Admin SDK init
    │   ├── middleware/
    │   │   ├── auth.js              # Firebase token verification
    │   │   ├── requireRole.js       # Role-based access control
    │   │   └── errorHandler.js      # Centralized error handling
    │   ├── routes/
    │   │   ├── auth.routes.js       # POST /sync, GET /me, PATCH /profile
    │   │   ├── product.routes.js    # CRUD + search + vendor filter
    │   │   ├── vendor.routes.js     # List, onboard, dashboard, earnings
    │   │   ├── order.routes.js      # Full order lifecycle
    │   │   ├── rider.routes.js      # Admin CRUD + rider self routes
    │   │   └── payment.routes.js    # Nomba initialize, verify, webhook
    │   ├── services/
    │   │   ├── nomba.service.js     # Nomba API client with token caching
    │   │   ├── escrow.service.js    # Escrow release logic
    │   │   └── claimExpiry.service.js # Lazy rider claim expiry
    │   ├── utils/
    │   │   └── prisma.js            # Prisma client singleton with pg adapter
    │   └── index.js                 # Express app entry point
    ├── .env
    ├── prisma.config.ts
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- A Supabase PostgreSQL database
- A Firebase project with Email/Password and Google auth enabled
- Nomba developer account with API credentials

### 1. Clone the repository

```bash
git clone https://github.com/your-username/buylence.git
cd buylence
```

### 2. Set up the backend

```bash
cd server
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Run database migrations and seed:

```bash
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
```

Start the development server:

```bash
npm run dev
```

The server runs on `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd client
npm install
```

Copy and configure the env file:

```bash
cp .env.example .env
```

Start the development server:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173`.

---

## Environment Variables

### Backend (`server/.env`)

```env
# Database
DATABASE_URL=postgresql://...?pgbouncer=true&connect_timeout=30
DIRECT_URL=postgresql://...?connect_timeout=30

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Nomba Payment Gateway
NOMBA_CLIENT_ID=your-nomba-client-id
NOMBA_CLIENT_SECRET=your-nomba-client-secret
NOMBA_ACCOUNT_ID=your-parent-account-id
NOMBA_SUB_ACCOUNT_ID=your-sub-account-id
NOMBA_BASE_URL=https://api.nomba.com

# App
NODE_ENV=development
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
RIDER_CLAIM_TIMEOUT_MINUTES=15
```

### Frontend (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require a Firebase ID token in the `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/sync` | Required | Create or update user after Firebase sign-in |
| GET | `/auth/me` | Required | Get current user profile |
| PATCH | `/auth/profile` | Required | Update user profile |
| GET | `/auth/users` | Admin | List all users |

### Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | Public | List products with filters (category, hall, search) |
| GET | `/products/mine` | Vendor | Get vendor's own products |
| GET | `/products/:id` | Public | Get single product |
| POST | `/products` | Vendor | Create product |
| PATCH | `/products/:id` | Vendor | Update product |
| DELETE | `/products/:id` | Vendor | Delete product |

### Vendors

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/vendors` | Public | List all verified vendors |
| GET | `/vendors/:id` | Public | Get vendor profile |
| POST | `/vendors/onboard` | Required | Vendor onboarding |
| GET | `/vendors/me/dashboard` | Vendor | Dashboard stats and recent orders |
| GET | `/vendors/me/earnings` | Vendor | Earnings breakdown |
| PATCH | `/vendors/me` | Vendor | Update store settings |
| PATCH | `/vendors/:id/verify` | Admin | Toggle vendor verified status |

### Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/orders` | Buyer | Place a new order |
| GET | `/orders` | Buyer | Get buyer's order history |
| GET | `/orders/admin/all` | Admin | Get all orders |
| GET | `/orders/vendor/all` | Vendor | Get vendor's orders |
| GET | `/orders/rider/pool` | Rider | Get available orders pool |
| GET | `/orders/rider/my-deliveries` | Rider | Get rider's active deliveries |
| GET | `/orders/:id` | Required | Get single order |
| POST | `/orders/:id/confirm-preparing` | Vendor | Confirm order and start preparing |
| POST | `/orders/:id/ready-for-pickup` | Vendor | Mark order ready for rider |
| POST | `/orders/:id/claim` | Rider | Claim order from pool |
| POST | `/orders/:id/picked-up` | Rider | Mark order as picked up |
| POST | `/orders/:id/delivered` | Rider | Mark order as delivered |
| POST | `/orders/:id/confirm-receipt` | Buyer | Confirm receipt and release escrow |
| POST | `/orders/:id/cancel` | Buyer/Vendor | Cancel order |

### Riders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/riders` | Admin | List all riders with stats |
| POST | `/riders` | Admin | Onboard a new rider |
| GET | `/riders/:id` | Admin | Get rider profile |
| PATCH | `/riders/:id/toggle-active` | Admin | Activate or deactivate rider |
| DELETE | `/riders/:id` | Admin | Remove rider from team |
| GET | `/riders/me/profile` | Rider | Rider's own profile and stats |
| GET | `/riders/me/history` | Rider | Delivery history (paginated) |
| GET | `/riders/me/earnings` | Rider | Earnings breakdown |

### Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/payments/initialize` | Buyer | Create Nomba checkout order |
| POST | `/payments/verify/:ref` | Buyer | Manually verify payment status |
| POST | `/payments/webhook` | None | Nomba webhook receiver |

---

## Payment Integration

Buylence uses the **Nomba payment gateway** with an escrow model.

### Checkout Flow

```
Student adds to cart
        ↓
Student submits checkout form
        ↓
POST /api/orders — order created with status PLACED
        ↓
POST /api/payments/initialize — Nomba checkout order created
        ↓
Student redirected to Nomba hosted checkout page
        ↓
Student completes payment (card, transfer, USSD, QR)
        ↓
Nomba fires webhook → POST /api/payments/webhook
        ↓
Order paymentStatus updated to HELD_IN_ESCROW
        ↓
Vendor confirms and prepares order
        ↓
Rider claims from pool and delivers
        ↓
Student confirms receipt → POST /api/orders/:id/confirm-receipt
        ↓
Escrow released → funds sent to vendor
```

### Webhook Setup

Register your webhook URL with Nomba at:
`https://forms.gle/hKfBRHZiTGvU7LC59`

Your webhook endpoint:
`https://your-railway-url.up.railway.app/api/payments/webhook`

---

## Order Lifecycle

```
PLACED
  → PREPARING          (vendor confirms)
  → READY_FOR_PICKUP   (vendor marks ready)
  → ASSIGNED_TO_RIDER  (rider claims from pool)
  → PICKED_UP          (rider collects from vendor)
  → DELIVERED_BY_RIDER (rider marks delivered)
  → CONFIRMED_BY_BUYER (student confirms receipt → escrow released)

Any stage → CANCELLED  (buyer or vendor, only while PLACED or PREPARING)
```

Rider claims auto-expire after 15 minutes (configurable via `RIDER_CLAIM_TIMEOUT_MINUTES`) and the order returns to the pool.

---

## Deployment

### Backend — Railway

1. Create a new Railway project and connect your GitHub repository
2. Set the root directory to `server/`
3. Add all environment variables from `server/.env`
4. Railway will auto-detect Node.js and run `npm start`
5. Copy the Railway URL and update your Nomba webhook registration

### Frontend — Vercel

1. Import your repository to Vercel
2. Set the root directory to `client/`
3. Add environment variable: `VITE_API_URL=https://your-railway-url.up.railway.app/api`
4. Deploy

---

## Test Accounts

After running the seed script, the following accounts are available for testing. Note that seed Firebase UIDs are placeholders — create real accounts through the signup flow for full functionality.

| Role | Email | Notes |
|---|---|---|
| Admin | admin@buylence.com | Sign up with this email to get admin access |
| Vendor | tunde@buylence.com | Tunde's Fresh Mart — 8 products |
| Vendor | moremi@buylence.com | Moremi Delights — 5 products |
| Buyer | pelumi@buylence.com | Sample buyer account |
| Rider | rider1@buylence.com | Chidi Okafor — Bicycle |
| Rider | rider2@buylence.com | Emeka Nwosu — Motorcycle |

---

## Hackathon

Built for the **DevCareer x Nomba Hackathon 2026**

- Team: Team Buylence
- Builder: The team 
- University: Obafemi Awolowo University (OAU), Ile-Ife

---

## License

MIT