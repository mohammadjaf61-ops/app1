import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
        <p className="text-muted-foreground">
          مرحباً بك في نظام إدارة الهايبرماركت
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">١٢٥</div>
            <p className="text-xs text-muted-foreground">
              +٢٠.١٪ من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات قيد التوصيل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">١٨</div>
            <p className="text-xs text-muted-foreground">
              ٥ طلبات في الطريق
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">٢,٥٠٠,٠٠٠ د.ع</div>
            <p className="text-xs text-muted-foreground">
              +١٥.٣٪ من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المنتجات النشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">٥٧٣</div>
            <p className="text-xs text-muted-foreground">
              ١٢ منتج بمخزون منخفض
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>آخر الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              لا توجد طلبات حتى الآن
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المنتجات الأكثر مبيعاً</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              لا توجد بيانات كافية
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
