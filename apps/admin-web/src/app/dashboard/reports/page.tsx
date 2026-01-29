'use client';

import { Download, TrendingUp, Package, AlertTriangle, FileText } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventoryStatus, useSalesReport, useTopProducts } from '@/hooks/use-api';
import { formatCurrency, formatNumber } from '@/lib/formatters';

function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) {
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const stringValue = String(value ?? '');
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(','),
    ),
  ];

  const blob = new Blob([`\uFEFF${csvRows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const setThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(now.toISOString().split('T')[0]);
  };

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateFrom(today);
    setDateTo(today);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">التقارير</h1>
        <p className="text-muted-foreground">تقارير تشغيلية للمبيعات والمخزون</p>
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">من تاريخ</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">إلى تاريخ</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <Button variant="outline" onClick={setToday}>
              اليوم
            </Button>
            <Button variant="outline" onClick={setThisMonth}>
              هذا الشهر
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
            >
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sales" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            المبيعات
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <FileText className="h-4 w-4" />
            أفضل المنتجات
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4" />
            المخزون
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4">
          <SalesReport dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <TopProductsReport dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <InventoryReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface SalesReportData {
  summary?: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    deliveryOrders: number;
    deliveryRevenue: number;
    posOrders: number;
    posRevenue: number;
  };
}

function SalesReport({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { data, isLoading } = useSalesReport({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const salesData = data as SalesReportData | undefined;

  const exportSalesCSV = () => {
    if (!salesData?.summary) {
      return;
    }

    const csvData = [
      {
        'نوع البيانات': 'إجمالي الطلبات',
        القيمة: salesData.summary.totalOrders,
      },
      {
        'نوع البيانات': 'إجمالي الإيرادات (د.ع)',
        القيمة: salesData.summary.totalRevenue,
      },
      {
        'نوع البيانات': 'متوسط قيمة الطلب (د.ع)',
        القيمة: salesData.summary.averageOrderValue,
      },
      {
        'نوع البيانات': 'طلبات التوصيل',
        القيمة: salesData.summary.deliveryOrders,
      },
      {
        'نوع البيانات': 'إيرادات التوصيل (د.ع)',
        القيمة: salesData.summary.deliveryRevenue,
      },
      {
        'نوع البيانات': 'طلبات نقطة البيع',
        القيمة: salesData.summary.posOrders,
      },
      {
        'نوع البيانات': 'إيرادات نقطة البيع (د.ع)',
        القيمة: salesData.summary.posRevenue,
      },
    ];

    exportToCSV(csvData, 'تقرير-المبيعات');
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!salesData?.summary || salesData.summary.totalOrders === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">لا توجد بيانات للفترة المختارة</p>
            <p className="text-sm mt-2">جرب اختيار فترة زمنية مختلفة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const posPercentage =
    salesData.summary.totalRevenue > 0
      ? ((salesData.summary.posRevenue / salesData.summary.totalRevenue) * 100).toFixed(1)
      : '0';

  const deliveryPercentage =
    salesData.summary.totalRevenue > 0
      ? ((salesData.summary.deliveryRevenue / salesData.summary.totalRevenue) * 100).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={exportSalesCSV}>
          <Download className="h-4 w-4 ml-2" />
          تصدير CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(salesData.summary.totalOrders)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(salesData.summary.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              متوسط قيمة الطلب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(salesData.summary.averageOrderValue)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              نقطة البيع / التوصيل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatNumber(salesData.summary.posOrders)}
              {' / '}
              {formatNumber(salesData.summary.deliveryOrders)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(salesData.summary.posRevenue)}
              {' / '}
              {formatCurrency(salesData.summary.deliveryRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفصيل حسب نوع الطلب</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">نوع الطلب</TableHead>
                <TableHead className="text-right">عدد الطلبات</TableHead>
                <TableHead className="text-right">الإيرادات</TableHead>
                <TableHead className="text-right">النسبة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">نقطة البيع (POS)</TableCell>
                <TableCell>{formatNumber(salesData.summary.posOrders)}</TableCell>
                <TableCell>{formatCurrency(salesData.summary.posRevenue)}</TableCell>
                <TableCell>{posPercentage}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">التوصيل</TableCell>
                <TableCell>{formatNumber(salesData.summary.deliveryOrders)}</TableCell>
                <TableCell>{formatCurrency(salesData.summary.deliveryRevenue)}</TableCell>
                <TableCell>{deliveryPercentage}%</TableCell>
              </TableRow>
              <TableRow className="font-bold bg-muted/50">
                <TableCell>المجموع</TableCell>
                <TableCell>{formatNumber(salesData.summary.totalOrders)}</TableCell>
                <TableCell>{formatCurrency(salesData.summary.totalRevenue)}</TableCell>
                <TableCell>100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

interface TopProduct {
  rank: number;
  product: {
    id: string;
    sku: string;
    nameAr: string;
    category: { id: string; nameAr: string } | null;
  };
  totalQuantity: number;
  totalRevenue: number;
}

function TopProductsReport({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { data, isLoading } = useTopProducts({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy: 'revenue',
    limit: 10,
  });

  const products = (data as TopProduct[] | undefined) || [];

  const exportProductsCSV = () => {
    if (!products.length) {
      return;
    }

    const csvData = products.map((item) => ({
      الترتيب: item.rank,
      'رمز المنتج': item.product.sku,
      'اسم المنتج': item.product.nameAr,
      القسم: item.product.category?.nameAr || '-',
      'الكمية المباعة': item.totalQuantity,
      'الإيرادات (د.ع)': item.totalRevenue,
    }));

    exportToCSV(csvData, 'أفضل-المنتجات');
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!products.length) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">لا توجد بيانات للفترة المختارة</p>
            <p className="text-sm mt-2">جرب اختيار فترة زمنية مختلفة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>أفضل 10 منتجات</CardTitle>
            <CardDescription>مرتبة حسب الإيرادات</CardDescription>
          </div>
          <Button variant="outline" onClick={exportProductsCSV}>
            <Download className="h-4 w-4 ml-2" />
            تصدير CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right w-16">#</TableHead>
              <TableHead className="text-right">المنتج</TableHead>
              <TableHead className="text-right">القسم</TableHead>
              <TableHead className="text-right">الكمية</TableHead>
              <TableHead className="text-right">الإيرادات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((item) => (
              <TableRow key={item.product.id}>
                <TableCell className="font-medium">{item.rank}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.product.nameAr}</div>
                    <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                  </div>
                </TableCell>
                <TableCell>{item.product.category?.nameAr || '-'}</TableCell>
                <TableCell>{formatNumber(item.totalQuantity)}</TableCell>
                <TableCell>{formatCurrency(item.totalRevenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface InventoryStatusData {
  summary?: {
    totalProducts: number;
    outOfStockCount: number;
    lowStockCount: number;
    healthyCount: number;
  };
  outOfStock?: Array<{
    id: string;
    sku: string;
    nameAr: string;
    category: { id: string; nameAr: string } | null;
    totalQuantity: number;
    threshold: number;
  }>;
  lowStock?: Array<{
    id: string;
    sku: string;
    nameAr: string;
    category: { id: string; nameAr: string } | null;
    totalQuantity: number;
    threshold: number;
  }>;
}

function InventoryReport() {
  const { data, isLoading } = useInventoryStatus();

  const inventoryData = data as InventoryStatusData | undefined;

  const exportInventoryCSV = () => {
    if (!inventoryData) {
      return;
    }

    const allItems = [
      ...(inventoryData.outOfStock || []).map((item) => ({
        الحالة: 'غير متوفر',
        'رمز المنتج': item.sku,
        'اسم المنتج': item.nameAr,
        القسم: item.category?.nameAr || '-',
        الكمية: item.totalQuantity,
        'حد التنبيه': item.threshold,
      })),
      ...(inventoryData.lowStock || []).map((item) => ({
        الحالة: 'منخفض',
        'رمز المنتج': item.sku,
        'اسم المنتج': item.nameAr,
        القسم: item.category?.nameAr || '-',
        الكمية: item.totalQuantity,
        'حد التنبيه': item.threshold,
      })),
    ];

    exportToCSV(allItems, 'تقرير-المخزون');
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!inventoryData?.summary) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">لا توجد بيانات مخزون</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasIssues =
    (inventoryData.summary.outOfStockCount || 0) + (inventoryData.summary.lowStockCount || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={exportInventoryCSV} disabled={!hasIssues}>
          <Download className="h-4 w-4 ml-2" />
          تصدير CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي المنتجات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(inventoryData.summary.totalProducts)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">غير متوفر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatNumber(inventoryData.summary.outOfStockCount)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">مخزون منخفض</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {formatNumber(inventoryData.summary.lowStockCount)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">بحالة جيدة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatNumber(inventoryData.summary.healthyCount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Out of Stock Table */}
      {inventoryData.outOfStock && inventoryData.outOfStock.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              منتجات غير متوفرة ({inventoryData.outOfStock.length})
            </CardTitle>
            <CardDescription>يجب إعادة تعبئة هذه المنتجات فوراً</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رمز المنتج</TableHead>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">القسم</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.outOfStock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell className="font-medium">{item.nameAr}</TableCell>
                    <TableCell>{item.category?.nameAr || '-'}</TableCell>
                    <TableCell className="text-red-600 font-bold">0</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Table */}
      {inventoryData.lowStock && inventoryData.lowStock.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Package className="h-5 w-5" />
              مخزون منخفض ({inventoryData.lowStock.length})
            </CardTitle>
            <CardDescription>هذه المنتجات تحتاج إلى إعادة تعبئة قريباً</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رمز المنتج</TableHead>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">القسم</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">حد التنبيه</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.lowStock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell className="font-medium">{item.nameAr}</TableCell>
                    <TableCell>{item.category?.nameAr || '-'}</TableCell>
                    <TableCell className="text-yellow-600 font-bold">
                      {item.totalQuantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.threshold}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Good Message */}
      {!hasIssues && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-12">
            <div className="text-center text-green-700">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">جميع المنتجات متوفرة بكميات كافية</p>
              <p className="text-sm mt-2 text-green-600">لا توجد مشاكل في المخزون حالياً</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
