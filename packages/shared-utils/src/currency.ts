/**
 * Iraqi Dinar (IQD) currency formatting utilities
 * IQD uses no decimal places and Arabic numerals in RTL context
 */

import type { MoneyAmount } from '@hypermarket/shared-types';

/**
 * Format IQD amount with Arabic locale
 * Example: 25000 -> "٢٥٬٠٠٠ د.ع"
 */
export function formatIQD(amount: number): string {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format IQD amount with Western numerals
 * Example: 25000 -> "25,000 IQD"
 */
export function formatIQDWestern(amount: number): string {
  return new Intl.NumberFormat('en-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format MoneyAmount object
 */
export function formatMoney(money: MoneyAmount): string {
  if (money.currency === 'IQD') {
    return formatIQD(money.amount);
  }
  return formatIQD(money.amount);
}

/**
 * Parse formatted IQD string back to number
 */
export function parseIQD(formatted: string): number {
  // Remove currency symbol, spaces, and thousand separators
  const cleaned = formatted
    .replace(/[د.ع\s,٬]/g, '')
    // Convert Arabic numerals to Western
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

  return parseInt(cleaned, 10) || 0;
}

/**
 * Create MoneyAmount object
 */
export function createMoney(amount: number): MoneyAmount {
  return {
    amount: Math.round(amount), // IQD has no decimals
    currency: 'IQD',
  };
}

/**
 * Add two MoneyAmount values
 */
export function addMoney(a: MoneyAmount, b: MoneyAmount): MoneyAmount {
  return createMoney(a.amount + b.amount);
}

/**
 * Subtract two MoneyAmount values
 */
export function subtractMoney(a: MoneyAmount, b: MoneyAmount): MoneyAmount {
  return createMoney(a.amount - b.amount);
}

/**
 * Multiply MoneyAmount by quantity
 */
export function multiplyMoney(money: MoneyAmount, quantity: number): MoneyAmount {
  return createMoney(money.amount * quantity);
}

/**
 * Calculate percentage of MoneyAmount
 */
export function percentageOf(money: MoneyAmount, percentage: number): MoneyAmount {
  return createMoney(Math.round((money.amount * percentage) / 100));
}
