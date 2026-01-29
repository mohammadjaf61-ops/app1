#!/usr/bin/env ts-node
/**
 * Post-Migration Validation Script
 *
 * Validates data integrity after migration.
 * Runs various checks and reports discrepancies.
 *
 * Usage:
 *   npx ts-node scripts/migrations/legacy/validate-migration.ts
 *   npx ts-node scripts/migrations/legacy/validate-migration.ts --expected-products=500
 */

import { createPrisma } from './config';

interface ValidationResult {
  check: string;
  passed: boolean;
  expected?: number | string;
  actual?: number | string;
  message?: string;
}

async function validateMigration(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const prisma = createPrisma();

  try {
    console.log('Running post-migration validation...\n');

    // Check 1: Categories exist
    const categoryCount = await prisma.category.count();
    results.push({
      check: 'Categories exist',
      passed: categoryCount > 0,
      actual: categoryCount,
      message: categoryCount > 0 ? undefined : 'No categories found',
    });

    // Check 2: Products exist
    const productCount = await prisma.product.count();
    results.push({
      check: 'Products exist',
      passed: productCount > 0,
      actual: productCount,
      message: productCount > 0 ? undefined : 'No products found',
    });

    // Check 3: All products have categories
    const orphanProducts = await prisma.product.count({
      where: {
        category: null,
      },
    });
    results.push({
      check: 'Products have categories',
      passed: orphanProducts === 0,
      actual: orphanProducts,
      message: orphanProducts > 0 ? `${orphanProducts} products without category` : undefined,
    });

    // Check 4: Product prices are valid
    const invalidPrices = await prisma.product.count({
      where: {
        OR: [{ salePrice: { lte: 0 } }, { costPrice: { lt: 0 } }],
      },
    });
    results.push({
      check: 'Product prices valid',
      passed: invalidPrices === 0,
      actual: invalidPrices,
      message: invalidPrices > 0 ? `${invalidPrices} products with invalid prices` : undefined,
    });

    // Check 5: SKUs are unique (should always pass due to constraint)
    const skuGroups = await prisma.product.groupBy({
      by: ['sku'],
      _count: true,
      having: {
        sku: {
          _count: {
            gt: 1,
          },
        },
      },
    });
    results.push({
      check: 'SKUs are unique',
      passed: skuGroups.length === 0,
      actual: skuGroups.length,
      message: skuGroups.length > 0 ? `${skuGroups.length} duplicate SKUs` : undefined,
    });

    // Check 6: Inventory locations exist
    const locationCount = await prisma.inventoryLocation.count();
    results.push({
      check: 'Inventory locations exist',
      passed: locationCount > 0,
      actual: locationCount,
      message: locationCount > 0 ? undefined : 'No inventory locations found',
    });

    // Check 7: Inventory items exist
    const inventoryCount = await prisma.inventoryItem.count();
    results.push({
      check: 'Inventory items exist',
      passed: inventoryCount > 0,
      actual: inventoryCount,
      message: inventoryCount > 0 ? undefined : 'No inventory items found',
    });

    // Check 8: No negative inventory
    const negativeInventory = await prisma.inventoryItem.count({
      where: { quantity: { lt: 0 } },
    });
    results.push({
      check: 'No negative inventory',
      passed: negativeInventory === 0,
      actual: negativeInventory,
      message: negativeInventory > 0 ? `${negativeInventory} negative quantities` : undefined,
    });

    // Check 9: Total inventory value
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: { product: { select: { salePrice: true } } },
    });
    const totalInventoryValue = inventoryItems.reduce(
      (sum, item) => sum + item.quantity * item.product.salePrice,
      0,
    );
    results.push({
      check: 'Inventory value calculated',
      passed: true,
      actual: `${totalInventoryValue.toLocaleString()} IQD`,
    });

    // Check 10: Delivery zones exist
    const zoneCount = await prisma.deliveryZone.count();
    results.push({
      check: 'Delivery zones configured',
      passed: zoneCount > 0,
      actual: zoneCount,
      message: zoneCount > 0 ? undefined : 'No delivery zones - create before go-live',
    });

    // Print results
    console.log('Validation Results');
    console.log('==================\n');

    let passCount = 0;
    let failCount = 0;

    for (const result of results) {
      const status = result.passed ? '✓' : '✗';
      const statusText = result.passed ? 'PASS' : 'FAIL';
      console.log(`${status} [${statusText}] ${result.check}`);
      if (result.actual !== undefined) {
        console.log(`         Value: ${result.actual}`);
      }
      if (result.message) {
        console.log(`         Note: ${result.message}`);
      }
      if (result.passed) {
        passCount++;
      } else {
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(40));
    console.log(`Total: ${passCount} passed, ${failCount} failed`);

    if (failCount > 0) {
      console.log('\n⚠️  Some validation checks failed. Review before go-live.');
    } else {
      console.log('\n✓ All validation checks passed.');
    }

    return results;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await validateMigration();
}

main().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
