'use client';

import { useState } from 'react';
import { AlertTriangle, Calendar, MapPin, Package } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory, useLowStockItems, useNearExpiryItems } from '@/hooks/use-api';
import { formatDate, formatNumber } from '@/lib/formatters';

interface InventoryItem {
  id: string;
  productId: string;
  product: {
    id: string;
    sku: string;
    nameAr: string;
  };
  location: {
    id: string;
    name: string;
    aisle: string;
    shelf: string;
    bin?: string;
  };
  quantity: number;
  expiryDate?: string;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">المخزون</h1>
        <p className="text-muted-foreground">إدارة ومراقبة مخزون المنتجات</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">جميع المنتجات</TabsTrigger>
          <TabsTrigger value="low-stock" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            مخزون منخفض
          </TabsTrigger>
          <TabsTrigger value="near-expiry" className="gap-2">
            <Calendar className="h-4 w-4" />
            قرب انتهاء الصلاحية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <AllInventoryTable />
        </TabsContent>

        <TabsContent value="low-stock" className="mt-4">
          <LowStockTable />
        </TabsContent>

        <TabsContent value="near-expiry" className="mt-4">
          <NearExpiryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AllInventoryTable() {
  const { data, isLoading } = useInventory({ limit: 50 });
  const items = ((data as { data?: InventoryItem[] })?.data || data || []) as InventoryItem[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>جرد المخزون</CardTitle>
        <CardDescription>قائمة بجميع المنتجات ومواقعها في المخزن</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>المنتج</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.product.sku}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.product.nameAr}
                      </TableCell>
                      <TableCell>
                        <QuantityBadge quantity={item.quantity} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {item.location?.name || `${item.location?.aisle}-${item.location?.shelf}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.expiryDate ? (
                          <ExpiryBadge date={item.expiryDate} />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      لا توجد بيانات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LowStockTable() {
  const { data, isLoading } = useLowStockItems();
  const items = (data || []) as InventoryItem[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          منتجات بمخزون منخفض
        </CardTitle>
        <CardDescription>
          المنتجات التي تحتاج إلى إعادة تزويد
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton />
        ) : items.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>المنتج</TableHead>
                  <TableHead>الكمية المتبقية</TableHead>
                  <TableHead>الموقع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="bg-destructive/5">
                    <TableCell className="font-mono text-sm">
                      {item.product.sku}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.product.nameAr}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{item.quantity}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {item.location?.name || `${item.location?.aisle}-${item.location?.shelf}`}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              لا توجد منتجات بمخزون منخفض
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NearExpiryTable() {
  const { data, isLoading } = useNearExpiryItems();
  const items = (data || []) as InventoryItem[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-yellow-600" />
          منتجات قريبة من انتهاء الصلاحية
        </CardTitle>
        <CardDescription>
          المنتجات التي ستنتهي صلاحيتها خلال 30 يوم
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton />
        ) : items.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>المنتج</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead>الموقع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="bg-yellow-50">
                    <TableCell className="font-mono text-sm">
                      {item.product.sku}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.product.nameAr}
                    </TableCell>
                    <TableCell>{formatNumber(item.quantity)}</TableCell>
                    <TableCell>
                      <ExpiryBadge date={item.expiryDate!} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {item.location?.name || `${item.location?.aisle}-${item.location?.shelf}`}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              لا توجد منتجات قريبة من انتهاء الصلاحية
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuantityBadge({ quantity }: { quantity: number }) {
  if (quantity <= 5) {
    return <Badge variant="destructive">{quantity}</Badge>;
  }
  if (quantity <= 20) {
    return <Badge variant="outline" className="border-yellow-500 text-yellow-700">{quantity}</Badge>;
  }
  return <Badge variant="secondary">{quantity}</Badge>;
}

function ExpiryBadge({ date }: { date: string }) {
  const expiryDate = new Date(date);
  const now = new Date();
  const daysUntilExpiry = Math.floor(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    return <Badge variant="destructive">منتهي الصلاحية</Badge>;
  }
  if (daysUntilExpiry <= 7) {
    return (
      <Badge variant="destructive">
        {formatDate(date)} ({daysUntilExpiry} يوم)
      </Badge>
    );
  }
  if (daysUntilExpiry <= 30) {
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
        {formatDate(date)}
      </Badge>
    );
  }
  return <span className="text-sm">{formatDate(date)}</span>;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
