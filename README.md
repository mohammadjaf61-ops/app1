# Hypermarket Platform

منصة هايبرماركت متكاملة للسوق العراقي

## المشروع

منصة تجارة إلكترونية كاملة تتضمن:

- **لوحة تحكم المسؤول** (Next.js)
- **تطبيق العملاء** (React Native / Expo)
- **تطبيق جامع الطلبات** (React Native / Expo)
- **تطبيق سائق التوصيل** (React Native / Expo)
- **خدمات الخلفية** (NestJS)

## التقنيات المستخدمة

### Backend

- Node.js 20 LTS
- NestJS
- PostgreSQL 16
- Prisma ORM
- Redis (Cache + BullMQ)
- Meilisearch
- JWT Authentication

### Frontend (Admin Web)

- Next.js 14 (App Router)
- TailwindCSS
- shadcn/ui
- React Query

### Mobile Apps

- React Native (Expo)
- NativeWind
- React Navigation
- Zustand

### Infrastructure

- Docker
- Google Cloud Run
- GitHub Actions

## هيكل المشروع

```
/apps
  /admin-web        # لوحة تحكم المسؤول
  /customer-mobile  # تطبيق العملاء
  /picker-mobile    # تطبيق جامع الطلبات
  /driver-mobile    # تطبيق سائق التوصيل

/services
  /api              # خدمات الخلفية

/packages
  /shared-types     # الأنواع المشتركة
  /shared-utils     # الأدوات المشتركة
  /eslint-config    # إعدادات ESLint
  /tsconfig         # إعدادات TypeScript
```

## البدء السريع

### المتطلبات

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### التثبيت

```bash
# Clone the repository
git clone <repository-url>
cd hypermarket-platform

# Install dependencies
pnpm install

# Start infrastructure services
docker-compose up -d

# Copy environment files
cp services/api/.env.example services/api/.env
cp apps/admin-web/.env.example apps/admin-web/.env.local

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### المنافذ

- API: http://localhost:3000
- Admin Web: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Meilisearch: http://localhost:7700
- MinIO Console: http://localhost:9001

## الأوامر المتاحة

```bash
# Development
pnpm dev              # تشغيل جميع الخدمات
pnpm api:dev          # تشغيل API فقط
pnpm admin:dev        # تشغيل لوحة التحكم فقط

# Build
pnpm build            # بناء جميع الخدمات
pnpm api:build        # بناء API
pnpm admin:build      # بناء لوحة التحكم

# Database
pnpm db:generate      # توليد Prisma Client
pnpm db:migrate       # تشغيل migrations
pnpm db:studio        # فتح Prisma Studio

# Docker
pnpm docker:up        # تشغيل البنية التحتية
pnpm docker:down      # إيقاف البنية التحتية
pnpm docker:logs      # عرض السجلات

# Quality
pnpm lint             # فحص الكود
pnpm type-check       # فحص الأنواع
pnpm test             # تشغيل الاختبارات
```

## البيئات

| البيئة      | الوصف                |
| ----------- | -------------------- |
| Development | بيئة التطوير المحلية |
| Staging     | بيئة الاختبار        |
| Production  | بيئة الإنتاج         |

## الميزات الرئيسية

- ✅ دعم اللغة العربية (RTL)
- ✅ عملة الدينار العراقي (IQD)
- ✅ الدفع عند الاستلام (COD)
- ✅ عناوين نصية (بدون خرائط)
- ✅ تتبع موقع المنتجات (ممر / رف / صندوق)

## المراحل

- **MVP**: التجارة الأساسية + التوصيل + لوحة التحكم
- **V1**: التحسينات + التقارير
- **V2**: ميزات الذكاء الاصطناعي

## الترخيص

UNLICENSED - جميع الحقوق محفوظة
