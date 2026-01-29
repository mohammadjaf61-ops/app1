# System Overview - Hypermarket Platform

## What This System Does

| Component | Function |
|-----------|----------|
| **Customer Mobile App** | Customers browse products, add to cart, place delivery orders |
| **Admin Web Dashboard** | Manage orders, inventory, users, view reports, insights |
| **Picker App** | Store staff pick items for orders |
| **Driver App** | Delivery drivers manage deliveries |
| **Cashier Web** | POS for in-store sales |
| **API Backend** | All business logic, database, authentication |

## What This System Does NOT Do

| Not Supported | Notes |
|---------------|-------|
| Online payment (cards, wallets) | COD (Cash on Delivery) only |
| GPS tracking | No live driver tracking |
| Barcode scanning | Manual item selection |
| Multi-store | Single store operation |
| Multi-currency | IQD only |
| External integrations | No ERP, no accounting software |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
├──────────┬──────────┬──────────┬──────────┬────────────────┤
│ Customer │  Admin   │  Picker  │  Driver  │    Cashier     │
│  Mobile  │   Web    │   App    │   App    │     Web        │
│ (Expo)   │ (Next.js)│ (RN)    │ (RN)    │   (Next.js)    │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴───────┬────────┘
     │          │          │          │             │
     └──────────┴──────────┴──────────┴─────────────┘
                           │
                    ┌──────▼──────┐
                    │   API       │
                    │  (NestJS)   │
                    │  Port 3000  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
   ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
   │ PostgreSQL│    │   Redis   │    │   Bull    │
   │  Port 5432│    │ Port 6379 │    │  (Queues) │
   └───────────┘    └───────────┘    └───────────┘
```

## Key Data Flows

### Order Flow
```
Customer places order
    → PENDING (order created)
    → Admin assigns picker
    → PICKING (picker working)
    → Picker completes → READY
    → Admin assigns driver
    → OUT_FOR_DELIVERY
    → Driver completes → DELIVERED

    (or at any point → CANCELLED/FAILED)
```

### Inventory Flow
```
Product created
    → Stock added via inventory adjustment
    → Order placed → stock reserved
    → Order completed → stock deducted
    → Low stock → alert shown
```

## Environment Requirements

| Service | Version | Port |
|---------|---------|------|
| Node.js | 20.x | - |
| PostgreSQL | 15+ | 5432 |
| Redis | 7+ | 6379 |
| pnpm | 9+ | - |

## Key Directories

```
/home/user/app1/
├── apps/
│   ├── admin-web/          # Admin dashboard (Next.js)
│   ├── customer-mobile/    # Customer app (Expo)
│   ├── picker-app/         # Picker app (React Native)
│   ├── driver-app/         # Driver app (React Native)
│   └── cashier-web/        # POS (Next.js)
├── services/
│   └── api/                # Backend API (NestJS)
├── packages/
│   ├── i18n/              # Translations
│   └── shared-types/      # Shared TypeScript types
└── docs/
    └── adr/               # Architecture Decision Records
```

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `feature_demand_forecasting` | OFF | Complex AI forecasting |
| `feature_basket_analysis` | OFF | Product association analysis |
| `feature_anomaly_detection` | ON | Sales anomaly alerts |
| `feature_ai_insights` | ON | Read-only operational insights |

## User Roles

| Role | Access |
|------|--------|
| ADMIN | Everything |
| MANAGER | Orders, inventory, reports, users (no roles) |
| PICKER | Picker app only |
| DRIVER | Driver app only |
| CASHIER | Cashier POS only |
| CUSTOMER | Customer app only |

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `user` | All users (staff + customers) |
| `order` | Customer orders |
| `order_item` | Items in orders |
| `product` | Product catalog |
| `inventory` | Stock levels per product |
| `delivery_assignment` | Driver delivery assignments |
| `audit_log` | All sensitive operations |
| `setting` | App configuration |

## External Dependencies

| Dependency | Purpose | Required |
|------------|---------|----------|
| PostgreSQL | Primary database | Yes |
| Redis | Caching, sessions, job queues | Yes |
| SMTP (optional) | Email notifications | No |
| SMS (optional) | OTP verification | No |

## SLA Expectations

| Metric | Target |
|--------|--------|
| API Response Time | < 500ms (p95) |
| Uptime | 99% during business hours |
| Order Processing | Orders visible to pickers within 30s |
| Data Retention | Audit logs: 1 year minimum |
