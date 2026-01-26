'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, TrendingUp, Package, Truck, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSalesSummary, useStockAging, useCategoryPerformance } from '@/hooks/use-api';
import { formatCurrency, formatNumber, formatDateForInput } from '@/lib/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">التقارير</h1>
        <p className="text-muted-foreground">تحليلات ومؤشرات الأداء</p>
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
            <Button
              variant="outline"
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
          <TabsTrigger value="stock" className="gap-2">
            <Package className="h-4 w-4" />
            المخزون
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Calendar className="h-4 w-4" />
            الأقسام
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4">
          <SalesReport dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="stock" className="mt-4">
          <StockAgingReport />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoryPerformanceReport dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SalesReport({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { data, isLoading } = useSalesSummary({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const salesData = data as {
    summary?: {
      totalOrders: number;
      totalRevenue: number;
      totalItems: number;
      averageOrderValue: number;
    };
    topProducts?: Array<{
      product: { nameAr: string; sku: string };
      quantity: number;
      revenue: number;
    }>;
  } | undefined;

  const exportToExcel = () => {
    if (!salesData?.topProducts) return;

    const wsData = salesData.topProducts.map((item, index) => ({
      '#': index + 1,
      'المنتج': item.product.nameAr,
      'SKU': item.product.sku,
      'الكمية': item.quantity,
      'الإيرادات': item.revenue,
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المبيعات');
    XLSX.writeFile(wb, `تقرير-المبيعات-${new Date().toISOString().split('T')[0]}.xlsx`);
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(salesData?.summary?.totalOrders || 0)}
            </div>
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
              {formatCurrency(salesData?.summary?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              المنتجات المباعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(salesData?.summary?.totalItems || 0)}
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
              {formatCurrency(salesData?.summary?.averageOrderValue || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>المنتجات الأكثر مبيعاً</CardTitle>
              <CardDescription>أعلى 10 منتجات من حيث الإيرادات</CardDescription>
            </div>
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="h-4 w-4 ml-2" />
              تصدير Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {salesData?.topProducts && salesData.topProducts.length > 0 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesData.topProducts.slice(0, 10)}
                  layout="vertical"
                  margin={{ right: 120 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis
                    type="category"
                    dataKey="product.nameAr"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `المنتج: ${label}`}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد بيانات كافية
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StockAgingReport() {
  const { data, isLoading } = useStockAging();

  const stockData = data as {
    summary?: {
      expired: number;
      critical: number;
      warning: number;
      good: number;
      total: number;
    };
    expired?: Array<{
      id: string;
      product: { nameAr: string; sku: string };
      quantity: number;
      expiryDate: string;
    }>;
    critical?: Array<{
      id: string;
      product: { nameAr: string; sku: string };
      quantity: number;
      expiryDate: string;
    }>;
  } | undefined;

  const pieData = stockData?.summary
    ? [
        { name: 'منتهي', value: stockData.summary.expired, color: '#ef4444' },
        { name: 'حرج (< 7 أيام)', value: stockData.summary.critical, color: '#f97316' },
        { name: 'تحذير (< 30 يوم)', value: stockData.summary.warning, color: '#eab308' },
        { name: 'جيد', value: stockData.summary.good, color: '#22c55e' },
      ]
    : [];

  const exportToExcel = () => {
    if (!stockData) return;

    const allItems = [
      ...(stockData.expired || []).map((i) => ({ ...i, status: 'منتهي' })),
      ...(stockData.critical || []).map((i) => ({ ...i, status: 'حرج' })),
    ];

    const wsData = allItems.map((item, index) => ({
      '#': index + 1,
      'المنتج': item.product.nameAr,
      'SKU': item.product.sku,
      'الكمية': item.quantity,
      'تاريخ الانتهاء': item.expiryDate,
      'الحالة': item.status,
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقادم المخزون');
    XLSX.writeFile(wb, `تقرير-تقادم-المخزون-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>تقادم المخزون</CardTitle>
              <CardDescription>توزيع المنتجات حسب تاريخ الصلاحية</CardDescription>
            </div>
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="h-4 w-4 ml-2" />
              تصدير Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Summary */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-red-600">منتهي الصلاحية</p>
                    <p className="text-2xl font-bold text-red-700">
                      {stockData?.summary?.expired || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-orange-600">حرج (أقل من 7 أيام)</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {stockData?.summary?.critical || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-yellow-600">تحذير (أقل من 30 يوم)</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {stockData?.summary?.warning || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-green-600">جيد</p>
                    <p className="text-2xl font-bold text-green-700">
                      {stockData?.summary?.good || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4 flex-wrap">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryPerformanceReport({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { data, isLoading } = useCategoryPerformance({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const categoryData = data as {
    totalRevenue?: number;
    categories?: Array<{
      category: { id: string; nameAr: string };
      totalItems: number;
      totalRevenue: number;
      uniqueProducts: number;
      revenuePercentage: string;
    }>;
  } | undefined;

  const exportToExcel = () => {
    if (!categoryData?.categories) return;

    const wsData = categoryData.categories.map((item, index) => ({
      '#': index + 1,
      'القسم': item.category.nameAr,
      'عدد المنتجات': item.uniqueProducts,
      'المنتجات المباعة': item.totalItems,
      'الإيرادات': item.totalRevenue,
      'النسبة المئوية': `${item.revenuePercentage}%`,
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'أداء الأقسام');
    XLSX.writeFile(wb, `تقرير-أداء-الأقسام-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>أداء الأقسام</CardTitle>
            <CardDescription>
              إجمالي الإيرادات: {formatCurrency(categoryData?.totalRevenue || 0)}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 ml-2" />
            تصدير Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {categoryData?.categories && categoryData.categories.length > 0 ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData.categories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category.nameAr" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `القسم: ${label}`}
                />
                <Bar dataKey="totalRevenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد بيانات كافية
          </div>
        )}
      </CardContent>
    </Card>
  );
}
