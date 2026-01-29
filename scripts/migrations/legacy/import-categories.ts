#!/usr/bin/env ts-node
/**
 * Category Import Script
 *
 * Imports categories from legacy CSV/JSON file.
 * Idempotent: Uses nameAr as natural key for upsert.
 *
 * Usage:
 *   npx ts-node scripts/migrations/legacy/import-categories.ts --dry-run
 *   npx ts-node scripts/migrations/legacy/import-categories.ts data/categories.json
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

interface LegacyCategory {
  id?: string;
  name?: string;
  name_ar?: string;
  nameAr?: string;
  parent_id?: string;
  parentId?: string;
  parent_name?: string;
}

interface NormalizedCategory {
  nameAr: string;
  parentName?: string;
}

function normalizeCategory(legacy: LegacyCategory): NormalizedCategory | null {
  const nameAr = legacy.nameAr || legacy.name_ar || legacy.name;
  if (!nameAr || nameAr.trim() === '') {
    return null;
  }

  return {
    nameAr: nameAr.trim(),
    parentName: legacy.parent_name?.trim(),
  };
}

async function importCategories(
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
    log(config, 'normal', `Reading categories from: ${inputFile}`);

    const content = fs.readFileSync(inputFile, 'utf-8');
    const data: LegacyCategory[] = inputFile.endsWith('.json')
      ? JSON.parse(content)
      : parseCSV(content);

    read = data.length;
    log(config, 'normal', `Found ${read} categories to process`);

    if (config.dryRun) {
      log(config, 'normal', '\n[DRY RUN] No changes will be made\n');
    }

    // First pass: Create root categories (no parent)
    const categoryMap = new Map<string, string>();

    for (let i = 0; i < data.length; i++) {
      const normalized = normalizeCategory(data[i]);
      if (!normalized) {
        errors.push({ row: i + 1, message: 'Missing category name' });
        skipped++;
        continue;
      }

      if (normalized.parentName) {
        continue; // Handle in second pass
      }

      log(config, 'verbose', `Processing: ${normalized.nameAr}`);

      if (!config.dryRun) {
        const existing = await prisma.category.findFirst({
          where: { nameAr: normalized.nameAr, parentId: null },
        });

        if (existing) {
          categoryMap.set(normalized.nameAr, existing.id);
          updated++;
        } else {
          const created_ = await prisma.category.create({
            data: { nameAr: normalized.nameAr },
          });
          categoryMap.set(normalized.nameAr, created_.id);
          created++;
        }
      } else {
        created++;
      }
    }

    // Second pass: Create child categories
    for (let i = 0; i < data.length; i++) {
      const normalized = normalizeCategory(data[i]);
      if (!normalized || !normalized.parentName) {
        continue;
      }

      const parentId = categoryMap.get(normalized.parentName);
      if (!parentId && !config.dryRun) {
        errors.push({
          row: i + 1,
          message: `Parent category not found: ${normalized.parentName}`,
          data: normalized,
        });
        skipped++;
        continue;
      }

      log(config, 'verbose', `Processing child: ${normalized.nameAr} -> ${normalized.parentName}`);

      if (!config.dryRun) {
        const existing = await prisma.category.findFirst({
          where: { nameAr: normalized.nameAr, parentId },
        });

        if (existing) {
          categoryMap.set(normalized.nameAr, existing.id);
          updated++;
        } else {
          const created_ = await prisma.category.create({
            data: { nameAr: normalized.nameAr, parentId },
          });
          categoryMap.set(normalized.nameAr, created_.id);
          created++;
        }
      } else {
        created++;
      }
    }

    return {
      entity: 'Category',
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

function parseCSV(content: string): LegacyCategory[] {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj as unknown as LegacyCategory;
  });
}

async function main() {
  const config = parseArgs();
  const inputFile = process.argv.find((a) => !a.startsWith('-') && a.includes('.'));

  if (!inputFile) {
    console.log('Category Import Tool');
    console.log('');
    console.log('Usage:');
    console.log('  npx ts-node import-categories.ts <file> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run    Preview changes without writing');
    console.log('  --verbose    Show detailed progress');
    console.log('  --quiet      Minimal output');
    console.log('');
    console.log('Input format (JSON):');
    console.log('  [{ "nameAr": "فواكه", "parent_name": null }]');
    process.exit(0);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
  }

  const result = await importCategories(path.resolve(inputFile), config);
  printResult(result);

  if (result.errors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
