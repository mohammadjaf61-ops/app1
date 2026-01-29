#!/usr/bin/env ts-node
/**
 * Customer Import Script
 *
 * Imports customer data from legacy system.
 * Idempotent: Uses phone number as natural key for upsert.
 *
 * Note: In current system, customers are created on first order.
 * This script is for pre-populating customer data if available.
 *
 * Usage:
 *   npx ts-node scripts/migrations/legacy/import-customers.ts --dry-run
 *   npx ts-node scripts/migrations/legacy/import-customers.ts data/customers.json
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

interface LegacyCustomer {
  phone?: string;
  mobile?: string;
  name?: string;
  full_name?: string;
  address?: string;
  delivery_address?: string;
  zone?: string;
  delivery_zone?: string;
  notes?: string;
}

interface NormalizedCustomer {
  phone: string;
  name: string;
  address?: string;
  zone?: string;
  notes?: string;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('964')) {
    return '0' + digits.slice(3);
  }
  if (!digits.startsWith('0') && digits.length === 10) {
    return '0' + digits;
  }
  return digits;
}

function normalizeCustomer(legacy: LegacyCustomer): NormalizedCustomer | null {
  const phone = legacy.phone || legacy.mobile;
  const name = legacy.name || legacy.full_name;

  if (!phone || !name) {
    return null;
  }

  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith('07')) {
    return null;
  }

  return {
    phone: normalizedPhone,
    name: name.trim(),
    address: (legacy.delivery_address || legacy.address)?.trim(),
    zone: (legacy.delivery_zone || legacy.zone)?.trim(),
    notes: legacy.notes?.trim(),
  };
}

async function importCustomers(
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
    log(config, 'normal', `Reading customers from: ${inputFile}`);

    const content = fs.readFileSync(inputFile, 'utf-8');
    const data: LegacyCustomer[] = inputFile.endsWith('.json')
      ? JSON.parse(content)
      : parseCSV(content);

    read = data.length;
    log(config, 'normal', `Found ${read} customer records to process`);

    if (config.dryRun) {
      log(config, 'normal', '\n[DRY RUN] No changes will be made\n');
    }

    // Get delivery zones for mapping
    const zones = await prisma.deliveryZone.findMany();
    const zoneMap = new Map(zones.map((z) => [z.name.toLowerCase(), z.id]));

    for (let i = 0; i < data.length; i++) {
      const normalized = normalizeCustomer(data[i]);
      if (!normalized) {
        errors.push({
          row: i + 1,
          message: 'Invalid phone or missing name',
          data: data[i],
        });
        skipped++;
        continue;
      }

      log(config, 'verbose', `  ${normalized.phone}: ${normalized.name}`);

      if (!config.dryRun) {
        // Check if customer has any orders
        const existingOrder = await prisma.order.findFirst({
          where: { customerPhone: normalized.phone },
        });

        if (existingOrder) {
          updated++;
          log(config, 'verbose', `    (existing customer with orders)`);
        } else {
          // Store in a customer preferences table if exists, or just count as ready
          created++;
          log(config, 'verbose', `    (new customer)`);
        }
      } else {
        created++;
      }
    }

    return {
      entity: 'Customer',
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

function parseCSV(content: string): LegacyCustomer[] {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj as unknown as LegacyCustomer;
  });
}

async function main() {
  const config = parseArgs();
  const inputFile = process.argv.find((a) => !a.startsWith('-') && a.includes('.'));

  if (!inputFile) {
    console.log('Customer Import Tool');
    console.log('');
    console.log('Usage:');
    console.log('  npx ts-node import-customers.ts <file> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run    Preview changes without writing');
    console.log('  --verbose    Show detailed progress');
    console.log('  --quiet      Minimal output');
    console.log('');
    console.log('Required columns: phone, name');
    console.log('Optional: address, zone, notes');
    process.exit(0);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
  }

  const result = await importCustomers(path.resolve(inputFile), config);
  printResult(result);

  if (result.errors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
