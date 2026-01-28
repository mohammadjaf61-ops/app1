/**
 * Hypermarket Platform - Database Seed Script
 *
 * Seeds the database with initial data:
 * - User roles (Admin, Manager, etc.)
 * - Base categories for product catalog
 * - Initial inventory locations
 * - System settings
 *
 * Usage: pnpm --filter @hypermarket/api prisma:seed
 */

import { PrismaClient } from '@prisma/client';
import { UserRole } from '@hypermarket/shared-types';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================
// SEED DATA DEFINITIONS
// ============================================

/**
 * Base categories for the hypermarket
 * Arabic names as primary, organized hierarchically
 */
const BASE_CATEGORIES = [
  {
    nameAr: 'المواد الغذائية',
    children: [
      { nameAr: 'الأرز والحبوب' },
      { nameAr: 'المعلبات' },
      { nameAr: 'الزيوت والسمن' },
      { nameAr: 'السكر والملح' },
      { nameAr: 'البهارات والتوابل' },
      { nameAr: 'الشاي والقهوة' },
    ],
  },
  {
    nameAr: 'الألبان والأجبان',
    children: [
      { nameAr: 'الحليب' },
      { nameAr: 'اللبن والزبادي' },
      { nameAr: 'الأجبان' },
      { nameAr: 'القشطة والزبدة' },
    ],
  },
  {
    nameAr: 'الخضروات والفواكه',
    children: [
      { nameAr: 'الخضروات الطازجة' },
      { nameAr: 'الفواكه الطازجة' },
      { nameAr: 'الخضروات المجمدة' },
      { nameAr: 'الفواكه المجففة' },
    ],
  },
  {
    nameAr: 'اللحوم والدواجن',
    children: [
      { nameAr: 'اللحوم الحمراء' },
      { nameAr: 'الدجاج' },
      { nameAr: 'الأسماك والمأكولات البحرية' },
      { nameAr: 'اللحوم المجمدة' },
    ],
  },
  {
    nameAr: 'المخبوزات',
    children: [
      { nameAr: 'الخبز' },
      { nameAr: 'الصمون' },
      { nameAr: 'المعجنات' },
      { nameAr: 'الكيك والحلويات' },
    ],
  },
  {
    nameAr: 'المشروبات',
    children: [
      { nameAr: 'المياه' },
      { nameAr: 'العصائر' },
      { nameAr: 'المشروبات الغازية' },
      { nameAr: 'مشروبات الطاقة' },
    ],
  },
  {
    nameAr: 'المنظفات',
    children: [
      { nameAr: 'منظفات الملابس' },
      { nameAr: 'منظفات الأطباق' },
      { nameAr: 'منظفات الأرضيات' },
      { nameAr: 'المعطرات' },
    ],
  },
  {
    nameAr: 'العناية الشخصية',
    children: [
      { nameAr: 'الشامبو والصابون' },
      { nameAr: 'معجون الأسنان' },
      { nameAr: 'مستحضرات العناية بالبشرة' },
      { nameAr: 'منتجات الحلاقة' },
    ],
  },
  {
    nameAr: 'مستلزمات الأطفال',
    children: [
      { nameAr: 'الحفاضات' },
      { nameAr: 'حليب الأطفال' },
      { nameAr: 'أغذية الأطفال' },
      { nameAr: 'مستلزمات الرضاعة' },
    ],
  },
  {
    nameAr: 'الأدوات المنزلية',
    children: [
      { nameAr: 'أدوات المطبخ' },
      { nameAr: 'أدوات التنظيف' },
      { nameAr: 'الأكياس والعبوات' },
    ],
  },
];

/**
 * Initial inventory locations (aisles, shelves, bins)
 * Organized for efficient picker navigation
 */
const INVENTORY_LOCATIONS = [
  // Aisle A - Food items
  { aisle: 'A', shelf: '1', bin: 'A' },
  { aisle: 'A', shelf: '1', bin: 'B' },
  { aisle: 'A', shelf: '1', bin: 'C' },
  { aisle: 'A', shelf: '2', bin: 'A' },
  { aisle: 'A', shelf: '2', bin: 'B' },
  { aisle: 'A', shelf: '2', bin: 'C' },
  { aisle: 'A', shelf: '3', bin: 'A' },
  { aisle: 'A', shelf: '3', bin: 'B' },
  { aisle: 'A', shelf: '3', bin: 'C' },
  // Aisle B - Dairy
  { aisle: 'B', shelf: '1', bin: 'A' },
  { aisle: 'B', shelf: '1', bin: 'B' },
  { aisle: 'B', shelf: '2', bin: 'A' },
  { aisle: 'B', shelf: '2', bin: 'B' },
  // Aisle C - Beverages
  { aisle: 'C', shelf: '1', bin: 'A' },
  { aisle: 'C', shelf: '1', bin: 'B' },
  { aisle: 'C', shelf: '2', bin: 'A' },
  { aisle: 'C', shelf: '2', bin: 'B' },
  // Aisle D - Cleaning
  { aisle: 'D', shelf: '1', bin: 'A' },
  { aisle: 'D', shelf: '1', bin: 'B' },
  { aisle: 'D', shelf: '2', bin: 'A' },
  { aisle: 'D', shelf: '2', bin: 'B' },
  // Aisle E - Personal care
  { aisle: 'E', shelf: '1', bin: 'A' },
  { aisle: 'E', shelf: '1', bin: 'B' },
  { aisle: 'E', shelf: '2', bin: 'A' },
  { aisle: 'E', shelf: '2', bin: 'B' },
  // Cold storage - Refrigerator
  { aisle: 'COLD', shelf: '1', bin: null },
  { aisle: 'COLD', shelf: '2', bin: null },
  { aisle: 'COLD', shelf: '3', bin: null },
  // Freezer
  { aisle: 'FREEZE', shelf: '1', bin: null },
  { aisle: 'FREEZE', shelf: '2', bin: null },
];

/**
 * Default system settings
 */
const SYSTEM_SETTINGS = [
  {
    key: 'delivery_fee_iqd',
    value: 5000,
    description: 'رسوم التوصيل الافتراضية بالدينار العراقي',
  },
  {
    key: 'min_order_amount_iqd',
    value: 15000,
    description: 'الحد الأدنى للطلب بالدينار العراقي',
  },
  {
    key: 'store_name',
    value: 'الهايبرماركت',
    description: 'اسم المتجر',
  },
  {
    key: 'store_phone',
    value: '07XX-XXX-XXXX',
    description: 'رقم هاتف المتجر',
  },
  {
    key: 'store_address',
    value: 'بغداد، العراق',
    description: 'عنوان المتجر',
  },
  {
    key: 'working_hours',
    value: { open: '08:00', close: '22:00' },
    description: 'ساعات العمل',
  },
  {
    key: 'max_items_per_order',
    value: 50,
    description: 'الحد الأقصى لعدد المنتجات في الطلب الواحد',
  },
];

/**
 * Default admin user
 */
const DEFAULT_ADMIN = {
  fullName: 'مدير النظام',
  phone: '07700000000',
  password: 'Admin@123456', // Will be hashed
  role: UserRole.ADMIN,
};

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedUsers(): Promise<void> {
  console.log('🔐 Seeding users...');

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

  await prisma.user.upsert({
    where: { phone: DEFAULT_ADMIN.phone },
    update: {},
    create: {
      fullName: DEFAULT_ADMIN.fullName,
      phone: DEFAULT_ADMIN.phone,
      password: hashedPassword,
      role: DEFAULT_ADMIN.role,
      isActive: true,
    },
  });

  console.log('✅ Default admin user created');
}

async function seedCategories(): Promise<void> {
  console.log('📁 Seeding categories...');

  for (const category of BASE_CATEGORIES) {
    // Create parent category
    const parent = await prisma.category.upsert({
      where: {
        id: `seed-${category.nameAr.replace(/\s+/g, '-')}`,
      },
      update: { nameAr: category.nameAr },
      create: {
        id: `seed-${category.nameAr.replace(/\s+/g, '-')}`,
        nameAr: category.nameAr,
        parentId: null,
      },
    });

    // Create child categories
    if (category.children) {
      for (const child of category.children) {
        await prisma.category.upsert({
          where: {
            id: `seed-${child.nameAr.replace(/\s+/g, '-')}`,
          },
          update: { nameAr: child.nameAr, parentId: parent.id },
          create: {
            id: `seed-${child.nameAr.replace(/\s+/g, '-')}`,
            nameAr: child.nameAr,
            parentId: parent.id,
          },
        });
      }
    }
  }

  const count = await prisma.category.count();
  console.log(`✅ ${count} categories seeded`);
}

async function seedInventoryLocations(): Promise<void> {
  console.log('📍 Seeding inventory locations...');

  for (const location of INVENTORY_LOCATIONS) {
    await prisma.inventoryLocation.upsert({
      where: {
        aisle_shelf_bin: {
          aisle: location.aisle,
          shelf: location.shelf,
          bin: location.bin,
        },
      },
      update: {},
      create: {
        aisle: location.aisle,
        shelf: location.shelf,
        bin: location.bin,
      },
    });
  }

  const count = await prisma.inventoryLocation.count();
  console.log(`✅ ${count} inventory locations seeded`);
}

async function seedSettings(): Promise<void> {
  console.log('⚙️ Seeding system settings...');

  for (const setting of SYSTEM_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        description: setting.description,
      },
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
      },
    });
  }

  const count = await prisma.setting.count();
  console.log(`✅ ${count} settings seeded`);
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...\n');

  try {
    await seedUsers();
    await seedCategories();
    await seedInventoryLocations();
    await seedSettings();

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Users: ${await prisma.user.count()}`);
    console.log(`   - Categories: ${await prisma.category.count()}`);
    console.log(`   - Inventory Locations: ${await prisma.inventoryLocation.count()}`);
    console.log(`   - Settings: ${await prisma.setting.count()}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run seed
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
