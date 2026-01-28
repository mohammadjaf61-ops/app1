'use client';

import {
  ShoppingCart,
  DollarSign,
  Truck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
} from 'lucide-react';
import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminKPIs, useOrders, useLowStockItems } from '@/hooks/use-api';
import { formatCurrency, formatNumber, orderStatusLabels } from '@/lib/formatters';

// Mock data for charts (in production, this would come from API)
const weeklyData = [
  { day: 'السبت', orders: 24, revenue: 2400000 },
  { day: 'الأحد', orders: 18, revenue: 1800000 },
  { day: 'الإثنين', orders: 32, revenue: 3200000 },
  { day: 'الثلاثاء', orders: 28, revenue: 2800000 },
  { day: 'الأربعاء', orders: 35, revenue: 3500000 },
  { day: 'الخميس', orders: 42, revenue: 4200000 },
  { day: 'الجمعة', orders: 38, revenue: 3800000 },
];

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

function StatCard({ title, value, description, icon: Icon, trend, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-full bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span
                className={`flex items-center text-xs font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 ml-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 ml-1" />
                )}
                {trend.value}%
              </span>
            )}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: kpis, isLoading: kpisLoading } = useAdminKPIs();
  const { data: ordersData, isLoading: ordersLoading } = useOrders({ status: 'OUT_FOR_DELIVERY' });

  const stats = useMemo(() => {
    return {
      todayOrders: kpis?.totalOrdersToday ?? 0,
      revenue: kpis?.revenueToday ?? 0,
      pendingOrders: kpis?.pendingOrders ?? 0,
      activeDeliveries: Array.isArray(ordersData)
        ? ordersData.length
        : ((ordersData as { data?: unknown[] })?.data?.length ?? 0),
      lowStockCount: kpis?.outOfStockCount ?? 0,
    };
  }, [kpis, ordersData]);

  const isLoading = kpisLoading || ordersLoading;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
        <p className="text-muted-foreground">مرحباً بك في نظام إدارة الهايبرماركت</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="طلبات اليوم"
          value={formatNumber(stats.todayOrders)}
          icon={ShoppingCart}
          description="الطلبات المسجلة اليوم"
          isLoading={isLoading}
        />
        <StatCard
          title="إيرادات اليوم"
          value={formatCurrency(stats.revenue)}
          icon={DollarSign}
          description="إجمالي المبيعات اليوم"
          isLoading={isLoading}
        />
        <StatCard
          title="طلبات معلقة"
          value={formatNumber(stats.pendingOrders)}
          icon={Truck}
          description="بانتظار المعالجة"
          isLoading={isLoading}
        />
        <StatCard
          title="نفاد المخزون"
          value={formatNumber(stats.lowStockCount)}
          icon={AlertTriangle}
          description="منتجات غير متوفرة"
          isLoading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>الطلبات هذا الأسبوع</CardTitle>
            <CardDescription>عدد الطلبات اليومية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-muted-foreground">الطلبات:</span>
                              <span className="font-bold">{payload[0].value}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات هذا الأسبوع</CardTitle>
            <CardDescription>الإيرادات اليومية بالدينار العراقي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-muted-foreground">الإيرادات:</span>
                              <span className="font-bold">
                                {formatCurrency(payload[0].value as number)}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>آخر الطلبات</CardTitle>
            <CardDescription>الطلبات الأخيرة في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentOrdersList />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تنبيهات المخزون</CardTitle>
            <CardDescription>المنتجات التي تحتاج انتباه</CardDescription>
          </CardHeader>
          <CardContent>
            <StockAlertsList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RecentOrdersList() {
  const { data, isLoading } = useOrders({ limit: 5 });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const orders = ((data as { data?: unknown[] })?.data || data || []) as Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
  }>;

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">لا توجد طلبات حتى الآن</p>;
  }

  return (
    <div className="space-y-4">
      {orders.slice(0, 5).map((order) => (
        <div key={order.id} className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-2">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">طلب #{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground truncate">{order.customerName}</p>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
            <p className="text-xs text-muted-foreground">
              {orderStatusLabels[order.status] || order.status}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StockAlertsList() {
  const { data, isLoading } = useLowStockItems();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    );
  }

  const items = (data || []) as Array<{
    id: string;
    product: { nameAr: string; sku: string };
    quantity: number;
  }>;

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">لا توجد تنبيهات حالياً</p>;
  }

  return (
    <div className="space-y-4">
      {items.slice(0, 5).map((item) => (
        <div key={item.id} className="flex items-center gap-4">
          <div className="rounded-full bg-destructive/10 p-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.product.nameAr}</p>
            <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-destructive">{item.quantity}</p>
            <p className="text-xs text-muted-foreground">متبقي</p>
          </div>
        </div>
      ))}
    </div>
  );
}
