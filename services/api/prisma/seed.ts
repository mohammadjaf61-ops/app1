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

/**
 * System permissions - defines all available permissions
 */
const PERMISSIONS = [
  // Orders
  {
    resource: 'orders',
    action: 'create',
    descriptionAr: 'إنشاء طلب',
    descriptionEn: 'Create order',
  },
  {
    resource: 'orders',
    action: 'read',
    descriptionAr: 'عرض الطلبات',
    descriptionEn: 'View orders',
  },
  {
    resource: 'orders',
    action: 'update',
    descriptionAr: 'تعديل الطلبات',
    descriptionEn: 'Update orders',
  },
  {
    resource: 'orders',
    action: 'delete',
    descriptionAr: 'حذف الطلبات',
    descriptionEn: 'Delete orders',
  },
  {
    resource: 'orders',
    action: 'manage',
    descriptionAr: 'إدارة كاملة للطلبات',
    descriptionEn: 'Full orders management',
  },

  // Products
  {
    resource: 'products',
    action: 'create',
    descriptionAr: 'إضافة منتج',
    descriptionEn: 'Create product',
  },
  {
    resource: 'products',
    action: 'read',
    descriptionAr: 'عرض المنتجات',
    descriptionEn: 'View products',
  },
  {
    resource: 'products',
    action: 'update',
    descriptionAr: 'تعديل المنتجات',
    descriptionEn: 'Update products',
  },
  {
    resource: 'products',
    action: 'delete',
    descriptionAr: 'حذف المنتجات',
    descriptionEn: 'Delete products',
  },
  {
    resource: 'products',
    action: 'manage',
    descriptionAr: 'إدارة كاملة للمنتجات',
    descriptionEn: 'Full products management',
  },

  // Categories
  {
    resource: 'categories',
    action: 'create',
    descriptionAr: 'إضافة قسم',
    descriptionEn: 'Create category',
  },
  {
    resource: 'categories',
    action: 'read',
    descriptionAr: 'عرض الأقسام',
    descriptionEn: 'View categories',
  },
  {
    resource: 'categories',
    action: 'update',
    descriptionAr: 'تعديل الأقسام',
    descriptionEn: 'Update categories',
  },
  {
    resource: 'categories',
    action: 'delete',
    descriptionAr: 'حذف الأقسام',
    descriptionEn: 'Delete categories',
  },
  {
    resource: 'categories',
    action: 'manage',
    descriptionAr: 'إدارة كاملة للأقسام',
    descriptionEn: 'Full categories management',
  },

  // Inventory
  {
    resource: 'inventory',
    action: 'read',
    descriptionAr: 'عرض المخزون',
    descriptionEn: 'View inventory',
  },
  {
    resource: 'inventory',
    action: 'update',
    descriptionAr: 'تعديل المخزون',
    descriptionEn: 'Update inventory',
  },
  {
    resource: 'inventory',
    action: 'manage',
    descriptionAr: 'إدارة كاملة للمخزون',
    descriptionEn: 'Full inventory management',
  },

  // Delivery
  {
    resource: 'delivery',
    action: 'read',
    descriptionAr: 'عرض التوصيلات',
    descriptionEn: 'View deliveries',
  },
  {
    resource: 'delivery',
    action: 'update',
    descriptionAr: 'تعديل التوصيلات',
    descriptionEn: 'Update deliveries',
  },
  {
    resource: 'delivery',
    action: 'manage',
    descriptionAr: 'إدارة كاملة للتوصيل',
    descriptionEn: 'Full delivery management',
  },

  // Reports
  {
    resource: 'reports',
    action: 'read',
    descriptionAr: 'عرض التقارير',
    descriptionEn: 'View reports',
  },

  // Users
  {
    resource: 'users',
    action: 'create',
    descriptionAr: 'إضافة مستخدم',
    descriptionEn: 'Create user',
  },
  {
    resource: 'users',
    action: 'read',
    descriptionAr: 'عرض المستخدمين',
    descriptionEn: 'View users',
  },
  {
    resource: 'users',
    action: 'update',
    descriptionAr: 'تعديل المستخدمين',
    descriptionEn: 'Update users',
  },
  {
    resource: 'users',
    action: 'delete',
    descriptionAr: 'حذف المستخدمين',
    descriptionEn: 'Delete users',
  },
  {
    resource: 'users',
    action: 'manage',
    descriptionAr: 'إدارة كاملة للمستخدمين',
    descriptionEn: 'Full users management',
  },

  // POS
  {
    resource: 'pos',
    action: 'create',
    descriptionAr: 'إنشاء فاتورة POS',
    descriptionEn: 'Create POS sale',
  },
  {
    resource: 'pos',
    action: 'read',
    descriptionAr: 'عرض مبيعات POS',
    descriptionEn: 'View POS sales',
  },
  {
    resource: 'pos',
    action: 'manage',
    descriptionAr: 'إدارة كاملة لنقطة البيع',
    descriptionEn: 'Full POS management',
  },

  // Payments
  {
    resource: 'payments',
    action: 'create',
    descriptionAr: 'تسجيل دفعة',
    descriptionEn: 'Create payment',
  },
  {
    resource: 'payments',
    action: 'read',
    descriptionAr: 'عرض المدفوعات',
    descriptionEn: 'View payments',
  },
  {
    resource: 'payments',
    action: 'manage',
    descriptionAr: 'إدارة كاملة للمدفوعات',
    descriptionEn: 'Full payments management',
  },

  // Settings
  {
    resource: 'settings',
    action: 'read',
    descriptionAr: 'عرض الإعدادات',
    descriptionEn: 'View settings',
  },
  {
    resource: 'settings',
    action: 'update',
    descriptionAr: 'تعديل الإعدادات',
    descriptionEn: 'Update settings',
  },

  // Permissions/Roles
  {
    resource: 'permissions',
    action: 'read',
    descriptionAr: 'عرض الصلاحيات',
    descriptionEn: 'View permissions',
  },
  {
    resource: 'permissions',
    action: 'manage',
    descriptionAr: 'إدارة الصلاحيات والأدوار',
    descriptionEn: 'Manage permissions and roles',
  },
];

/**
 * Preset system roles with their permissions
 */
const PRESET_ROLES = [
  {
    nameAr: 'مدير النظام',
    nameEn: 'ADMIN',
    description: 'صلاحية كاملة على جميع الموارد',
    isSystem: true,
    permissions: ['*:manage'], // Special: all permissions
  },
  {
    nameAr: 'مدير المتجر',
    nameEn: 'MANAGER',
    description: 'إدارة المتجر والعمليات اليومية',
    isSystem: true,
    permissions: [
      'orders:manage',
      'products:manage',
      'categories:manage',
      'inventory:manage',
      'delivery:manage',
      'reports:read',
      'users:read',
      'pos:manage',
      'payments:read',
    ],
  },
  {
    nameAr: 'أمين الصندوق',
    nameEn: 'CASHIER',
    description: 'إدارة نقطة البيع والمبيعات المباشرة',
    isSystem: true,
    permissions: [
      'pos:manage',
      'orders:create',
      'orders:read',
      'products:read',
      'categories:read',
      'payments:create',
    ],
  },
  {
    nameAr: 'جامع الطلبات',
    nameEn: 'PICKER',
    description: 'تجميع الطلبات من المستودع',
    isSystem: true,
    permissions: ['orders:read', 'orders:update', 'products:read', 'inventory:read'],
  },
  {
    nameAr: 'سائق التوصيل',
    nameEn: 'DRIVER',
    description: 'توصيل الطلبات للعملاء',
    isSystem: true,
    permissions: ['delivery:read', 'delivery:update', 'orders:read'],
  },
];

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

async function seedPermissions(): Promise<void> {
  console.log('🔐 Seeding permissions...');

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {
        descriptionAr: perm.descriptionAr,
        descriptionEn: perm.descriptionEn,
      },
      create: {
        resource: perm.resource,
        action: perm.action,
        descriptionAr: perm.descriptionAr,
        descriptionEn: perm.descriptionEn,
      },
    });
  }

  const count = await prisma.permission.count();
  console.log(`✅ ${count} permissions seeded`);
}

async function seedRoles(): Promise<void> {
  console.log('👥 Seeding roles...');

  // Get all permissions for lookup
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(
    allPermissions.map((p: { resource: string; action: string; id: string }) => [
      `${p.resource}:${p.action}`,
      p.id,
    ]),
  );

  for (const roleData of PRESET_ROLES) {
    // Create or update the role
    const role = await prisma.role.upsert({
      where: { nameEn: roleData.nameEn },
      update: {
        nameAr: roleData.nameAr,
        description: roleData.description,
      },
      create: {
        nameAr: roleData.nameAr,
        nameEn: roleData.nameEn,
        description: roleData.description,
        isSystem: roleData.isSystem,
      },
    });

    // Handle permissions
    // First, delete existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Then add the new permissions
    if (roleData.permissions.includes('*:manage')) {
      // Admin gets all permissions
      const allPermissionIds = allPermissions.map((p: { id: string }) => p.id);
      await prisma.rolePermission.createMany({
        data: allPermissionIds.map((permId: string) => ({
          roleId: role.id,
          permissionId: permId,
        })),
        skipDuplicates: true,
      });
    } else {
      // Other roles get specific permissions
      const permissionIds = roleData.permissions
        .map((p: string) => permissionMap.get(p))
        .filter((id): id is string => id !== undefined);

      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permId: string) => ({
            roleId: role.id,
            permissionId: permId,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  const count = await prisma.role.count();
  console.log(`✅ ${count} roles seeded`);
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
    await seedPermissions();
    await seedRoles();

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Users: ${await prisma.user.count()}`);
    console.log(`   - Categories: ${await prisma.category.count()}`);
    console.log(`   - Inventory Locations: ${await prisma.inventoryLocation.count()}`);
    console.log(`   - Settings: ${await prisma.setting.count()}`);
    console.log(`   - Permissions: ${await prisma.permission.count()}`);
    console.log(`   - Roles: ${await prisma.role.count()}`);
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
