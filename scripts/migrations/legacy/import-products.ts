#!/usr/bin/env ts-node
/**
 * Product Import Script
 *
 * Imports products from legacy CSV/JSON file.
 * Idempotent: Uses SKU as natural key for upsert.
 *
 * Usage:
 *   npx ts-node scripts/migrations/legacy/import-products.ts --dry-run
 *   npx ts-node scripts/migrations/legacy/import-products.ts data/products.json
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  createPrisma,
  log,
  MigrationConfig,
  MigrationError,
  MigrationResult,
  parseArgs,
  printResult,
} from './config';

interface LegacyProduct {
  sku?: string;
  code?: string;
  barcode?: string;
  name?: string;
  name_ar?: string;
  nameAr?: string;
  description?: string;
  description_ar?: string;
  category?: string;
  category_name?: string;
  cost?: number | string;
  cost_price?: number | string;
  price?: number | string;
  sale_price?: number | string;
  active?: boolean | string | number;
  is_active?: boolean | string | number;
}

interface NormalizedProduct {
  sku: string;
  nameAr: string;
  descriptionAr?: string;
  categoryName: string;
  costPrice: number;
  salePrice: number;
  isActive: boolean;
}

function normalizeProduct(legacy: LegacyProduct, rowNum: number): NormalizedProduct | null {
  const sku = legacy.sku || legacy.code || legacy.barcode;
  const nameAr = legacy.nameAr || legacy.name_ar || legacy.name;
  const categoryName = legacy.category || legacy.category_name;

  if (!sku || !nameAr || !categoryName) {
    return null;
  }

  const costPrice = parsePrice(legacy.cost_price || legacy.cost);
  const salePrice = parsePrice(legacy.sale_price || legacy.price);

  if (salePrice <= 0) {
    return null;
  }

  return {
    sku: sku.trim().toUpperCase(),
    nameAr: nameAr.trim(),
    descriptionAr: (legacy.description_ar || legacy.description)?.trim(),
    categoryName: categoryName.trim(),
    costPrice: costPrice || Math.floor(salePrice * 0.7),
    salePrice,
    isActive: parseBoolean(legacy.is_active ?? legacy.active ?? true),
  };
}

function parsePrice(value: unknown): number {
  if (typeof value === 'number') return Math.round(value);
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.]/g, '');
    return Math.round(parseFloat(cleaned) || 0);
  }
  return 0;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1' || value === 'yes';
  }
  return true;
}

async function importProducts(inputFile: string, config: MigrationConfig): Promise<MigrationResult> {
  const startTime = Date.now();
  const errors: MigrationError[] = [];
  let read = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  const prisma = createPrisma();

  try {
    log(config, 'normal', `Reading products from: ${inputFile}`);

    const content = fs.readFileSync(inputFile, 'utf-8');
    const data: LegacyProduct[] = inputFile.endsWith('.json')
      ? JSON.parse(content)
      : parseCSV(content);

    read = data.length;
    log(config, 'normal', `Found ${read} products to process`);

    if (config.dryRun) {
      log(config, 'normal', '\n[DRY RUN] No changes will be made\n');
    }

    // Build category lookup
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((c) => [c.nameAr.toLowerCase(), c.id]));

    // Process in batches
    for (let i = 0; i < data.length; i += config.batchSize) {
      const batch = data.slice(i, i + config.batchSize);
      log(config, 'verbose', `Processing batch ${Math.floor(i / config.batchSize) + 1}...`);

      for (let j = 0; j < batch.length; j++) {
        const rowNum = i + j + 1;
        const normalized = normalizeProduct(batch[j], rowNum);

        if (!normalized) {
          errors.push({
            row: rowNum,
            message: 'Missing required fields (sku, nameAr, category, price)',
            data: batch[j],
          });
          skipped++;
          continue;
        }

        const categoryId = categoryMap.get(normalized.categoryName.toLowerCase());
        if (!categoryId) {
          errors.push({
            row: rowNum,
            message: `Category not found: ${normalized.categoryName}`,
            data: normalized,
          });
          skipped++;
          continue;
        }

        log(config, 'verbose', `  ${normalized.sku}: ${normalized.nameAr}`);

        if (!config.dryRun) {
          const existing = await prisma.product.findUnique({
            where: { sku: normalized.sku },
          });

          if (existing) {
            await prisma.product.update({
              where: { sku: normalized.sku },
              data: {
                nameAr: normalized.nameAr,
                descriptionAr: normalized.descriptionAr,
                categoryId,
                costPrice: normalized.costPrice,
                salePrice: normalized.salePrice,
                isActive: normalized.isActive,
                deletedAt: null,
              },
            });
            updated++;
          } else {
            await prisma.product.create({
              data: {
                sku: normalized.sku,
                nameAr: normalized.nameAr,
                descriptionAr: normalized.descriptionAr,
                categoryId,
                costPrice: normalized.costPrice,
                salePrice: normalized.salePrice,
                isActive: normalized.isActive,
              },
            });
            created++;
          }
        } else {
          const existing = await prisma.product.findUnique({
            where: { sku: normalized.sku },
          });
          if (existing) {
            updated++;
          } else {
            created++;
          }
        }
      }
    }

    return {
      entity: 'Product',
      read,
      created,
      updated,
      skipped,
      errors,
      duration: Date.now() - startTime,
    };
  } finally {
    await prisma.$disconnect();
  }
}

function parseCSV(content: string): LegacyProduct[] {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj as unknown as LegacyProduct;
  });
}

async function main() {
  const config = parseArgs();
  const inputFile = process.argv.find((a) => !a.startsWith('-') && a.includes('.'));

  if (!inputFile) {
    console.log('Product Import Tool');
    console.log('');
    console.log('Usage:');
    console.log('  npx ts-node import-products.ts <file> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run      Preview changes without writing');
    console.log('  --batch=N      Process N records at a time (default: 100)');
    console.log('  --verbose      Show detailed progress');
    console.log('  --quiet        Minimal output');
    console.log('');
    console.log('Required columns: sku, nameAr/name, category, price/sale_price');
    process.exit(0);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
  }

  const result = await importProducts(path.resolve(inputFile), config);
  printResult(result);

  if (result.errors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
