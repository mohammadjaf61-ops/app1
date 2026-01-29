# Admin Guide - Hypermarket Platform

This guide covers daily operations for administrators using the Admin Web Dashboard.

## Table of Contents

1. [Dashboard Overview](#dashboard-overview)
2. [Order Management](#order-management)
3. [Delivery Management](#delivery-management)
4. [Inventory Management](#inventory-management)
5. [Product Catalog](#product-catalog)
6. [User Management](#user-management)
7. [Reports & Analytics](#reports--analytics)
8. [AI Insights](#ai-insights)
9. [Settings](#settings)

---

## Dashboard Overview

### Accessing the Admin Panel

1. Navigate to: `https://admin.yourcompany.com`
2. Login with admin credentials
3. You'll see the main dashboard with key metrics

### Dashboard Metrics

| Metric | Description |
|--------|-------------|
| **طلبات اليوم** | Today's order count |
| **إيرادات اليوم** | Today's revenue (IQD) |
| **طلبات قيد التنفيذ** | Orders in progress |
| **منتجات منخفضة المخزون** | Low stock alerts |

### Navigation Menu

| Menu Item | Arabic | Purpose |
|-----------|--------|---------|
| Dashboard | لوحة التحكم | Overview and metrics |
| Orders | الطلبات | Order management |
| Delivery | التوصيل | Delivery tracking |
| Inventory | المخزون | Stock management |
| Catalog | المنتجات | Product catalog |
| Users | المستخدمين | User management |
| Reports | التقارير | Reports and analytics |
| Insights | رؤى | AI-powered insights |
| Settings | الإعدادات | System configuration |

---

## Order Management

### Order Status Flow

```
PENDING → PICKING → READY → OUT_FOR_DELIVERY → DELIVERED
    ↓         ↓       ↓            ↓
 CANCELLED  CANCELLED CANCELLED  FAILED
```

### Managing Orders

#### View All Orders

1. Go to **الطلبات** (Orders)
2. Filter by:
   - Status (جميع الحالات)
   - Date range
   - Customer phone

#### Order Details

Click on any order to view:
- Customer information
- Order items with quantities
- Order total
- Status history
- Assigned picker/driver

#### Assign Picker

1. Find order in PENDING status
2. Click **تعيين جامع** (Assign Picker)
3. Select picker from dropdown
4. Confirm assignment

Order moves to PICKING status.

#### Assign Driver

1. Find order in READY status
2. Click **تعيين سائق** (Assign Driver)
3. Select driver from dropdown
4. Confirm assignment

Order moves to OUT_FOR_DELIVERY status.

#### Cancel Order

1. Open order details
2. Click **إلغاء الطلب** (Cancel Order)
3. Provide cancellation reason
4. Confirm

**Note:** Cancelled orders restore reserved stock automatically.

---

## Delivery Management

### Delivery Zones

Configure delivery zones and fees:

1. Go to **التوصيل** (Delivery)
2. Click **إضافة منطقة** (Add Zone)
3. Enter:
   - Zone name (Arabic & English)
   - Delivery fee (IQD)
   - Estimated delivery time
4. Save

### Zone Management

| Action | Steps |
|--------|-------|
| Edit Zone | Click zone → Edit → Save |
| Disable Zone | Click zone → Toggle status |
| Delete Zone | Click zone → Delete (confirm) |

### Delivery Time Slots

Configure available delivery times:

1. Go to **التوصيل** → **الفترات الزمنية**
2. Set available slots per day
3. Set maximum orders per slot

---

## Inventory Management

### Stock Overview

The inventory page shows:
- Product name and SKU
- Current stock level
- Reorder point
- Stock status (Normal / Low / Out)

### Stock Adjustments

#### Add Stock

1. Find product in inventory list
2. Click **تعديل المخزون** (Adjust Stock)
3. Select **إضافة** (Add)
4. Enter quantity and reason
5. Confirm

#### Remove Stock (Manual Correction)

1. Find product
2. Click **تعديل المخزون**
3. Select **خصم** (Remove)
4. Enter quantity and reason (e.g., "damaged", "expired")
5. Confirm

### Stock Alerts

Products showing red badge need attention:

| Badge | Meaning | Action |
|-------|---------|--------|
| 🔴 نفذ | Out of stock | Restock immediately |
| 🟡 منخفض | Low stock | Plan restock |
| 🟢 متوفر | In stock | No action needed |

### Inventory Reports

Access via **التقارير** → **تقرير المخزون**:
- Stock value report
- Movement history
- Low stock report
- Stock turnover

---

## Product Catalog

### Adding Products

1. Go to **المنتجات** (Catalog)
2. Click **إضافة منتج** (Add Product)
3. Fill in:
   - **الاسم بالعربية**: Arabic name
   - **الاسم بالإنجليزية**: English name (optional)
   - **SKU**: Unique product code
   - **السعر**: Price in IQD
   - **الفئة**: Category
   - **الصورة**: Product image
4. Click **حفظ** (Save)

### Product Fields

| Field | Required | Description |
|-------|----------|-------------|
| nameAr | Yes | Arabic product name |
| nameEn | No | English product name |
| sku | Yes | Stock Keeping Unit (unique) |
| price | Yes | Price in IQD |
| categoryId | Yes | Product category |
| description | No | Product description |
| imageUrl | No | Product image |
| isActive | Yes | Enable/disable product |
| barcode | No | Product barcode |

### Managing Categories

1. Go to **المنتجات** → **الفئات**
2. Add/edit categories with:
   - Arabic name
   - English name (optional)
   - Display order
   - Icon/image

### Bulk Operations

#### Import Products

1. Download template CSV
2. Fill in product data
3. Go to **المنتجات** → **استيراد**
4. Upload CSV file
5. Review and confirm

#### Export Products

1. Go to **المنتجات**
2. Click **تصدير** (Export)
3. Download Excel/CSV file

---

## User Management

### User Roles

| Role | Arabic | Permissions |
|------|--------|-------------|
| ADMIN | مدير | Full access |
| MANAGER | مدير فرعي | Orders, inventory, reports |
| PICKER | جامع | Picker app only |
| DRIVER | سائق | Driver app only |
| CASHIER | كاشير | POS only |

### Adding Staff

1. Go to **المستخدمين** (Users)
2. Click **إضافة مستخدم** (Add User)
3. Enter:
   - Name
   - Phone number
   - Role
   - Initial password
4. Save

### Managing Staff

| Action | Steps |
|--------|-------|
| Edit User | Click user → Edit → Save |
| Disable User | Click user → Toggle active status |
| Reset Password | Click user → Reset Password |
| Change Role | Click user → Edit → Select new role |

### Customer Accounts

Customers are created automatically when they:
1. Register via the mobile app
2. Place their first order

View customer details:
1. Go to **المستخدمين** → **العملاء**
2. Search by phone number
3. View order history

---

## Reports & Analytics

### Available Reports

| Report | Arabic | Description |
|--------|--------|-------------|
| Daily Sales | مبيعات اليوم | Today's sales summary |
| Period Sales | مبيعات الفترة | Sales for date range |
| Products | تقرير المنتجات | Product performance |
| Categories | تقرير الفئات | Category performance |
| Inventory | تقرير المخزون | Stock levels and value |
| Staff | تقرير الموظفين | Picker/driver performance |

### Generating Reports

1. Go to **التقارير** (Reports)
2. Select report type
3. Set date range
4. Click **تحميل** (Generate)
5. View on screen or export

### Export Options

| Format | Use Case |
|--------|----------|
| PDF | Printing, sharing |
| Excel | Further analysis |
| CSV | Data import/export |

### Key Performance Indicators (KPIs)

Monitor these metrics regularly:

| KPI | Target | Location |
|-----|--------|----------|
| Average order value | Track trend | Sales report |
| Order completion rate | > 95% | Orders report |
| Delivery time | < 60 min | Delivery report |
| Stock turnover | Category-specific | Inventory report |
| Cancellation rate | < 5% | Orders report |

---

## AI Insights

### What Are Insights?

AI Insights provide automated analysis of your data to help identify:
- Stagnant products (no sales in 30 days)
- Peak ordering hours
- High cancellation rates

**Important:** Insights are for information only. They don't make decisions automatically.

### Viewing Insights

1. Go to **رؤى** (Insights)
2. Review insight cards
3. Click **لماذا؟** (Why?) for detailed explanation

### Insight Types

| Type | What It Shows | Suggested Action |
|------|---------------|------------------|
| 🟡 منتج راكد | Products with no sales | Review pricing, visibility |
| 🔵 ساعات الذروة | Peak order hours | Optimize staffing |
| 🔴 نسبة إلغاء عالية | High cancellation rate | Investigate causes |

### Enabling/Disabling Insights

1. Go to **الإعدادات** (Settings)
2. Find **رؤى الذكاء الاصطناعي**
3. Toggle on/off

---

## Settings

### System Settings

| Setting | Description |
|---------|-------------|
| Store name | Display name in apps |
| Store phone | Contact number |
| Currency | IQD (fixed) |
| Timezone | Asia/Baghdad |
| Language | Arabic (primary) |

### Business Settings

| Setting | Description |
|---------|-------------|
| Minimum order | Minimum order value |
| Delivery fee | Default delivery fee |
| Working hours | Store operating hours |
| Auto-assign | Auto-assign pickers/drivers |

### Feature Flags

Control advanced features:

| Flag | Default | Description |
|------|---------|-------------|
| feature_ai_insights | ON | AI decision support |
| feature_anomaly_detection | ON | Sales anomaly alerts |
| feature_demand_forecasting | OFF | Complex forecasting |
| feature_basket_analysis | OFF | Product associations |

### Audit Logs

View all administrative actions:

1. Go to **الإعدادات** → **سجل النشاط**
2. Filter by:
   - User
   - Action type
   - Date range
3. Export if needed

---

## Quick Reference

### Daily Admin Tasks

- [ ] Check dashboard for overnight orders
- [ ] Review and assign pending orders to pickers
- [ ] Assign ready orders to drivers
- [ ] Check low stock alerts
- [ ] Review cancellations

### Weekly Admin Tasks

- [ ] Generate sales report
- [ ] Review AI insights
- [ ] Check staff performance
- [ ] Update product catalog if needed
- [ ] Review inventory levels

### Monthly Admin Tasks

- [ ] Full inventory reconciliation
- [ ] Staff performance review
- [ ] Review system settings
- [ ] Backup verification
- [ ] Security audit review

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Quick search |
| `Esc` | Close modal |
| `Enter` | Confirm action |

### Contact Support

For technical issues:
- Email: support@yourcompany.com
- Phone: [Support number]
- Hours: 9 AM - 6 PM (Iraq time)
