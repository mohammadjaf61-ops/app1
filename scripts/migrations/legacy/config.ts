import { PrismaClient } from '@prisma/client';

export interface MigrationConfig {
  dryRun: boolean;
  batchSize: number;
  logLevel: 'verbose' | 'normal' | 'quiet';
}

export interface MigrationResult {
  entity: string;
  read: number;
  created: number;
  updated: number;
  skipped: number;
  errors: MigrationError[];
  duration: number;
}

export interface MigrationError {
  row: number;
  field?: string;
  message: string;
  data?: unknown;
}

export function parseArgs(): MigrationConfig {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    batchSize: parseInt(args.find((a) => a.startsWith('--batch='))?.split('=')[1] || '100', 10),
    logLevel: args.includes('--quiet') ? 'quiet' : args.includes('--verbose') ? 'verbose' : 'normal',
  };
}

export function createPrisma(): PrismaClient {
  return new PrismaClient({
    log: process.env.DEBUG ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
}

export function printResult(result: MigrationResult): void {
  console.log('\n' + '='.repeat(50));
  console.log(`Migration: ${result.entity}`);
  console.log('='.repeat(50));
  console.log(`Records read:    ${result.read}`);
  console.log(`Records created: ${result.created}`);
  console.log(`Records updated: ${result.updated}`);
  console.log(`Records skipped: ${result.skipped}`);
  console.log(`Errors:          ${result.errors.length}`);
  console.log(`Duration:        ${(result.duration / 1000).toFixed(2)}s`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.slice(0, 10).forEach((err) => {
      console.log(`  Row ${err.row}: ${err.message}`);
    });
    if (result.errors.length > 10) {
      console.log(`  ... and ${result.errors.length - 10} more errors`);
    }
  }
}

export function log(config: MigrationConfig, level: 'verbose' | 'normal', message: string): void {
  if (config.logLevel === 'quiet') return;
  if (level === 'verbose' && config.logLevel !== 'verbose') return;
  console.log(message);
}
