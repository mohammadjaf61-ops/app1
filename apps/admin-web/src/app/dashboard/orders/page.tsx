'use client';

import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useOrders, useOrder, useUpdateOrderStatus } from '@/hooks/use-api';
import {
  formatCurrency,
  formatDateTime,
  formatPhone,
  orderStatusLabels,
  orderStatusColors,
} from '@/lib/formatters';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  total: number;
  createdAt: string;
  deliveryAddressText: string;
  notes?: string;
  items: Array<{
    id: string;
    productId: string;
    product: { nameAr: string; sku: string };
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

const statusOptions = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'PENDING', label: 'قيد الانتظار' },
  { value: 'PICKING', label: 'قيد التجهيز' },
  { value: 'READY', label: 'جاهز للتوصيل' },
  { value: 'OUT_FOR_DELIVERY', label: 'في الطريق' },
  { value: 'DELIVERED', label: 'تم التوصيل' },
  { value: 'CANCELLED', label: 'ملغي' },
];

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data, isLoading } = useOrders({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit: 10,
  });

  const orders = ((data as { data?: Order[] })?.data || []) as Order[];
  const meta = (data as { meta?: { total: number; totalPages: number } })?.meta;

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'رقم الطلب',
      cell: ({ row }) => (
        <span className="font-medium">#{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'العميل',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.customerName}</p>
          <p className="text-xs text-muted-foreground">
            {formatPhone(row.original.customerPhone)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => (
        <Badge className={orderStatusColors[row.original.status]}>
          {orderStatusLabels[row.original.status] || row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'total',
      header: 'المجموع',
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.original.total)}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'تاريخ الإنشاء',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedOrderId(row.original.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الطلبات</h1>
        <p className="text-muted-foreground">إدارة ومتابعة طلبات العملاء</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>قائمة الطلبات</CardTitle>
              <CardDescription>
                {meta?.total ? `${meta.total} طلب` : 'جاري التحميل...'}
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          لا توجد طلبات
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  صفحة {page} من {meta?.totalPages || 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= (meta?.totalPages || 1)}
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Drawer */}
      <OrderDetailsSheet
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}

function OrderDetailsSheet({
  orderId,
  onClose,
}: {
  orderId: string | null;
  onClose: () => void;
}) {
  const { data: order, isLoading } = useOrder(orderId || '');
  const updateStatus = useUpdateOrderStatus();

  const orderData = order as Order | undefined;

  const handleStatusChange = async (newStatus: string) => {
    if (!orderId) return;
    try {
      await updateStatus.mutateAsync({ id: orderId, status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <Sheet open={!!orderId} onOpenChange={() => onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <>تفاصيل الطلب #{orderData?.orderNumber}</>
            )}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : orderData ? (
          <div className="space-y-6 mt-6">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الحالة</label>
              <Select
                value={orderData.status}
                onValueChange={handleStatusChange}
                disabled={updateStatus.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.slice(1).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Customer Info */}
            <div className="space-y-2">
              <h3 className="font-medium">معلومات العميل</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">الاسم:</span>
                <span>{orderData.customerName}</span>
                <span className="text-muted-foreground">الهاتف:</span>
                <span dir="ltr">{formatPhone(orderData.customerPhone)}</span>
                <span className="text-muted-foreground">العنوان:</span>
                <span>{orderData.deliveryAddressText}</span>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div className="space-y-2">
              <h3 className="font-medium">المنتجات</h3>
              <div className="space-y-3">
                {orderData.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{item.product?.nameAr}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex items-center justify-between text-lg font-bold">
              <span>المجموع الكلي</span>
              <span>{formatCurrency(orderData.total)}</span>
            </div>

            {/* Notes */}
            {orderData.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-medium">ملاحظات</h3>
                  <p className="text-sm text-muted-foreground">{orderData.notes}</p>
                </div>
              </>
            )}

            {/* Timestamps */}
            <Separator />
            <div className="text-xs text-muted-foreground">
              <p>تاريخ الإنشاء: {formatDateTime(orderData.createdAt)}</p>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
