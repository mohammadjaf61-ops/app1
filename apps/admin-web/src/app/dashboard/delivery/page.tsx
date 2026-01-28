'use client';

import { Truck, User, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDeliveries, useUsers, useAssignDelivery, useOrders } from '@/hooks/use-api';
import {
  formatCurrency,
  formatDateTime,
  formatPhone,
  deliveryStatusLabels,
} from '@/lib/formatters';

interface Delivery {
  id: string;
  orderId: string;
  order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    deliveryAddressText: string;
    total: number;
  };
  driverId: string;
  driver?: {
    id: string;
    fullName: string;
    phone: string;
  };
  status: string;
  assignedAt: string;
  deliveredAt?: string;
}

interface Driver {
  id: string;
  fullName: string;
  phone: string;
  isActive: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
}

const deliveryStatusColors: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-800',
  PICKED_UP: 'bg-purple-100 text-purple-800',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

export default function DeliveryPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: deliveriesData, isLoading: deliveriesLoading } = useDeliveries({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const { data: driversData } = useUsers({ role: 'DRIVER' });
  const { data: readyOrdersData } = useOrders({ status: 'READY' });
  const assignDelivery = useAssignDelivery();

  const deliveries = ((deliveriesData as { data?: Delivery[] })?.data ||
    deliveriesData ||
    []) as Delivery[];
  const drivers = ((driversData as { data?: Driver[] })?.data || driversData || []) as Driver[];
  const readyOrders = ((readyOrdersData as { data?: Order[] })?.data ||
    readyOrdersData ||
    []) as Order[];
  const activeDrivers = drivers.filter((d) => d.isActive);

  const handleAssign = async (driverId: string) => {
    if (!selectedOrderId) {
      return;
    }
    try {
      await assignDelivery.mutateAsync({ orderId: selectedOrderId, driverId });
      setAssignDialogOpen(false);
      setSelectedOrderId(null);
    } catch (error) {
      console.error('Failed to assign delivery:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">التوصيل</h1>
        <p className="text-muted-foreground">إدارة عمليات التوصيل والسائقين</p>
      </div>

      {/* Ready Orders for Assignment */}
      {readyOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              طلبات جاهزة للتوصيل
            </CardTitle>
            <CardDescription>{readyOrders.length} طلب بانتظار تعيين سائق</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {readyOrders.map((order) => (
                <Card key={order.id} className="border-yellow-200 bg-yellow-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">#{order.orderNumber}</span>
                      <span className="font-bold">{formatCurrency(order.total)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{order.customerName}</p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setAssignDialogOpen(true);
                      }}
                    >
                      <Truck className="h-4 w-4 ml-2" />
                      تعيين سائق
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Deliveries */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>عمليات التوصيل</CardTitle>
              <CardDescription>متابعة حالة التوصيلات</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="ASSIGNED">تم التعيين</SelectItem>
                <SelectItem value="PICKED_UP">تم الاستلام</SelectItem>
                <SelectItem value="IN_TRANSIT">في الطريق</SelectItem>
                <SelectItem value="DELIVERED">تم التوصيل</SelectItem>
                <SelectItem value="FAILED">فشل التوصيل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {deliveriesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : deliveries.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>السائق</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>وقت التعيين</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">#{delivery.order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{delivery.order.customerName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {delivery.order.deliveryAddressText}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{delivery.driver?.fullName}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">
                              {delivery.driver?.phone && formatPhone(delivery.driver.phone)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={deliveryStatusColors[delivery.status]}>
                          {deliveryStatusLabels[delivery.status] || delivery.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(delivery.order.total)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(delivery.assignedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">لا توجد عمليات توصيل</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Stats */}
      <Card>
        <CardHeader>
          <CardTitle>السائقون النشطون</CardTitle>
          <CardDescription>حالة السائقين المتاحين</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeDrivers.map((driver) => (
              <Card key={driver.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{driver.fullName}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {formatPhone(driver.phone)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {activeDrivers.length === 0 && (
              <p className="text-muted-foreground col-span-full text-center py-4">
                لا يوجد سائقون نشطون
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assign Driver Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعيين سائق</DialogTitle>
            <DialogDescription>اختر السائق لتوصيل هذا الطلب</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {activeDrivers.map((driver) => (
              <Button
                key={driver.id}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => handleAssign(driver.id)}
                disabled={assignDelivery.isPending}
              >
                <User className="h-5 w-5" />
                <div className="text-right">
                  <p className="font-medium">{driver.fullName}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {formatPhone(driver.phone)}
                  </p>
                </div>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
