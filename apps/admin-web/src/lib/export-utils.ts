export interface ExportColumn<T> {
  key: keyof T;
  header: string;
  formatter?: (value: unknown) => string;
}

function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  str = str.replace(/"/g, '""');

  if (/[",\n\r]/.test(str)) {
    str = `"${str}"`;
  }

  return str;
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
): void {
  if (data.length === 0) {
    return;
  }

  const headers = columns.map((col) => escapeCSVValue(col.header)).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key];
        return escapeCSVValue(col.formatter ? col.formatter(val) : val);
      })
      .join(','),
  );

  const csvContent = `\uFEFF${[headers, ...rows].join('\n')}`;
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8');
}

export function exportToJSON<T>(data: T[], filename: string): void {
  downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, 'application/json');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDateForExport(date: Date | string | null): string {
  if (!date) {
    return '';
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function formatCurrencyForExport(amount: number | null): string {
  if (amount == null) {
    return '0';
  }
  return String(amount);
}

export const OrderExportColumns = [
  { key: 'orderNumber' as const, header: 'رقم الطلب' },
  { key: 'customerName' as const, header: 'اسم العميل' },
  { key: 'customerPhone' as const, header: 'الهاتف' },
  { key: 'total' as const, header: 'المجموع (د.ع)', formatter: formatCurrencyForExport },
  { key: 'status' as const, header: 'الحالة' },
  { key: 'createdAt' as const, header: 'تاريخ الطلب', formatter: formatDateForExport },
  { key: 'deliveryZone' as const, header: 'منطقة التوصيل' },
];

export const ProductExportColumns = [
  { key: 'sku' as const, header: 'SKU' },
  { key: 'name' as const, header: 'اسم المنتج' },
  { key: 'category' as const, header: 'الفئة' },
  { key: 'price' as const, header: 'السعر (د.ع)', formatter: formatCurrencyForExport },
  { key: 'stock' as const, header: 'المخزون' },
  { key: 'location' as const, header: 'الموقع' },
];

export const InventoryExportColumns = [
  { key: 'sku' as const, header: 'SKU' },
  { key: 'productName' as const, header: 'المنتج' },
  { key: 'currentStock' as const, header: 'المخزون الحالي' },
  { key: 'minimumStock' as const, header: 'الحد الأدنى' },
  { key: 'location' as const, header: 'الموقع' },
  { key: 'lastUpdated' as const, header: 'آخر تحديث', formatter: formatDateForExport },
];
