/**
 * Secure Data Export Utilities
 *
 * This module provides secure data export functionality without relying on
 * the vulnerable xlsx library. It uses native browser APIs for CSV export
 * which is sufficient for most admin reporting needs.
 *
 * Security Note: The xlsx library was removed due to CVE-2024-22363
 * (Prototype Pollution vulnerability). This implementation uses safe
 * string concatenation and proper escaping.
 *
 * @module export-utils
 */

export interface ExportColumn<T> {
  key: keyof T;
  header: string;
  formatter?: (value: unknown) => string;
}

/**
 * Escape CSV value to prevent injection attacks
 * Handles: commas, quotes, newlines, and formula injection
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let stringValue = String(value);

  // Prevent CSV formula injection (security measure)
  // Formulas start with =, +, -, @, tab, or carriage return
  if (/^[=+\-@\t\r]/.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }

  // Escape quotes by doubling them
  stringValue = stringValue.replace(/"/g, '""');

  // Wrap in quotes if contains comma, quote, or newline
  if (/[",\n\r]/.test(stringValue)) {
    stringValue = `"${stringValue}"`;
  }

  return stringValue;
}

/**
 * Export data to CSV format with proper UTF-8 BOM for Arabic support
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Build CSV content
  const headers = columns.map((col) => escapeCSVValue(col.header)).join(',');

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        const formatted = col.formatter ? col.formatter(value) : value;
        return escapeCSVValue(formatted);
      })
      .join(',')
  );

  // Add UTF-8 BOM for proper Arabic character display in Excel
  const BOM = '\uFEFF';
  const csvContent = BOM + [headers, ...rows].join('\n');

  // Create and trigger download
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Export data to JSON format
 */
export function exportToJSON<T>(data: T[], filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

/**
 * Helper function to trigger file download
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for export (ISO format)
 */
export function formatDateForExport(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Format currency for export (plain number)
 */
export function formatCurrencyForExport(amount: number | null): string {
  if (amount === null || amount === undefined) return '0';
  return String(amount);
}

/**
 * Pre-defined column configurations for common exports
 */
export const OrderExportColumns = [
  { key: 'orderNumber' as const, header: 'رقم الطلب' },
  { key: 'customerName' as const, header: 'اسم العميل' },
  { key: 'customerPhone' as const, header: 'الهاتف' },
  {
    key: 'total' as const,
    header: 'المجموع (د.ع)',
    formatter: formatCurrencyForExport,
  },
  { key: 'status' as const, header: 'الحالة' },
  {
    key: 'createdAt' as const,
    header: 'تاريخ الطلب',
    formatter: formatDateForExport,
  },
  { key: 'deliveryZone' as const, header: 'منطقة التوصيل' },
];

export const ProductExportColumns = [
  { key: 'sku' as const, header: 'SKU' },
  { key: 'name' as const, header: 'اسم المنتج' },
  { key: 'category' as const, header: 'الفئة' },
  {
    key: 'price' as const,
    header: 'السعر (د.ع)',
    formatter: formatCurrencyForExport,
  },
  { key: 'stock' as const, header: 'المخزون' },
  { key: 'location' as const, header: 'الموقع' },
];

export const InventoryExportColumns = [
  { key: 'sku' as const, header: 'SKU' },
  { key: 'productName' as const, header: 'المنتج' },
  { key: 'currentStock' as const, header: 'المخزون الحالي' },
  { key: 'minimumStock' as const, header: 'الحد الأدنى' },
  { key: 'location' as const, header: 'الموقع' },
  {
    key: 'lastUpdated' as const,
    header: 'آخر تحديث',
    formatter: formatDateForExport,
  },
];
