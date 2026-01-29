#!/usr/bin/env ts-node
/**
 * Inventory Import Script
 *
 * Imports inventory balances from legacy CSV/JSON file.
 * Idempotent: Uses SKU + location as composite key for upsert.
 *
 * Usage:
 *   npx ts-node scripts/migrations/legacy/import-inventory.ts --dry-run
 *   npx ts-node scripts/migrations/legacy/import-inventory.ts data/inventory.json
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

interface LegacyInventory {
  sku?: string;
  product_code?: string;
  quantity?: number | string;
  qty?: number | string;
  stock?: number | string;
  aisle?: string;
  shelf?: string;
  bin?: string;
  location?: string;
  expiry_date?: string;
  expiry?: string;
}

interface NormalizedInventory {
  sku: string;
  quantity: number;
  aisle: string;
  shelf: string;
  bin?: string;
  expiryDate?: Date;
}

function normalizeInventory(legacy: LegacyInventory): NormalizedInventory | null {
  const sku = legacy.sku || legacy.product_code;
  const quantity = parseInt(String(legacy.quantity || legacy.qty || legacy.stock || 0), 10);

  if (!sku || quantity < 0) {
    return null;
  }

  let aisle = legacy.aisle || 'A1';
  let shelf = legacy.shelf || '1';
  let bin = legacy.bin;

  // Parse combined location format like "A1-2-3"
  if (legacy.location && !legacy.aisle) {
    const parts = legacy.location.split('-');
    aisle = parts[0] || 'A1';
    shelf = parts[1] || '1';
    bin = parts[2];
  }

  let expiryDate: Date | undefined;
  const expiry = legacy.expiry_date || legacy.expiry;
  if (expiry) {
    const parsed = new Date(expiry);
    if (!isNaN(parsed.getTime())) {
      expiryDate = parsed;
    }
  }

  return {
    sku: sku.trim().toUpperCase(),
    quantity,
    aisle: aisle.trim().toUpperCase(),
    shelf: shelf.trim(),
    bin: bin?.trim(),
    expiryDate,
  };
}

async function importInventory(
  inputFile: string,
  config: MigrationConfig,
): Promise<MigrationResult> {
  const startTime = Date.now();
  const errors: MigrationError[] = [];
  let read = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  const prisma = createPrisma();

  try {
    log(config, 'normal', `Reading inventory from: ${inputFile}`);

    const content = fs.readFileSync(inputFile, 'utf-8');
    const data: LegacyInventory[] = inputFile.endsWith('.json')
      ? JSON.parse(content)
      : parseCSV(content);

    read = data.length;
    log(config, 'normal', `Found ${read} inventory records to process`);

    if (config.dryRun) {
      log(config, 'normal', '\n[DRY RUN] No changes will be made\n');
    }

    // Build product lookup
    const products = await prisma.product.findMany({ select: { id: true, sku: true } });
    const productMap = new Map(products.map((p) => [p.sku.toUpperCase(), p.id]));

    // Build/create location lookup
    const locationMap = new Map<string, string>();

    for (let i = 0; i < data.length; i++) {
      const normalized = normalizeInventory(data[i]);
      if (!normalized) {
        errors.push({ row: i + 1, message: 'Invalid inventory record', data: data[i] });
        skipped++;
        continue;
      }

      const productId = productMap.get(normalized.sku);
      if (!productId) {
        errors.push({
          row: i + 1,
          message: `Product not found: ${normalized.sku}`,
          data: normalized,
        });
        skipped++;
        continue;
      }

      const locationKey = `${normalized.aisle}-${normalized.shelf}-${normalized.bin || ''}`;

      let locationId = locationMap.get(locationKey);
      if (!locationId && !config.dryRun) {
        const existingLocation = await prisma.inventoryLocation.findFirst({
          where: {
            aisle: normalized.aisle,
            shelf: normalized.shelf,
            bin: normalized.bin || null,
          },
        });

        if (existingLocation) {
          locationId = existingLocation.id;
        } else {
          const newLocation = await prisma.inventoryLocation.create({
            data: {
              aisle: normalized.aisle,
              shelf: normalized.shelf,
              bin: normalized.bin,
            },
          });
          locationId = newLocation.id;
        }
        locationMap.set(locationKey, locationId);
      }

      log(config, 'verbose', `  ${normalized.sku} @ ${locationKey}: ${normalized.quantity}`);

      if (!config.dryRun && locationId) {
        const existingItem = await prisma.inventoryItem.findFirst({
          where: { productId, locationId },
        });

        if (existingItem) {
          await prisma.inventoryItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: normalized.quantity,
              expiryDate: normalized.expiryDate,
            },
          });
          updated++;
        } else {
          await prisma.inventoryItem.create({
            data: {
              productId,
              locationId,
              quantity: normalized.quantity,
              expiryDate: normalized.expiryDate,
            },
          });
          created++;
        }
      } else {
        created++;
      }
    }

    return {
      entity: 'Inventory',
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

function parseCSV(content: string): LegacyInventory[] {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj as unknown as LegacyInventory;
  });
}

async function main() {
  const config = parseArgs();
  const inputFile = process.argv.find((a) => !a.startsWith('-') && a.includes('.'));

  if (!inputFile) {
    console.log('Inventory Import Tool');
    console.log('');
    console.log('Usage:');
    console.log('  npx ts-node import-inventory.ts <file> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run    Preview changes without writing');
    console.log('  --verbose    Show detailed progress');
    console.log('  --quiet      Minimal output');
    console.log('');
    console.log('Required columns: sku, quantity');
    console.log('Optional: aisle, shelf, bin, location, expiry_date');
    process.exit(0);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
  }

  const result = await importInventory(path.resolve(inputFile), config);
  printResult(result);

  if (result.errors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
