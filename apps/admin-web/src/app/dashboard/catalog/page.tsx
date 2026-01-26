'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, FolderTree, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCategories,
  useProducts,
  useCreateCategory,
  useCreateProduct,
  useUpdateProduct,
} from '@/hooks/use-api';
import { formatCurrency } from '@/lib/formatters';

interface Category {
  id: string;
  nameAr: string;
  descriptionAr?: string;
  parentId?: string;
  isActive: boolean;
  _count?: { products: number };
}

interface Product {
  id: string;
  sku: string;
  nameAr: string;
  descriptionAr?: string;
  price: number;
  categoryId: string;
  category?: { nameAr: string };
  isActive: boolean;
  barcode?: string;
}

const categorySchema = z.object({
  nameAr: z.string().min(2, 'الاسم مطلوب'),
  descriptionAr: z.string().optional(),
  parentId: z.string().optional(),
});

const productSchema = z.object({
  sku: z.string().min(3, 'رمز المنتج مطلوب'),
  nameAr: z.string().min(2, 'اسم المنتج مطلوب'),
  descriptionAr: z.string().optional(),
  price: z.number().min(0, 'السعر يجب أن يكون رقم موجب'),
  categoryId: z.string().min(1, 'التصنيف مطلوب'),
  barcode: z.string().optional(),
});

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الكتالوج</h1>
        <p className="text-muted-foreground">إدارة التصنيفات والمنتجات</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            المنتجات
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderTree className="h-4 w-4" />
            التصنيفات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <ProductsSection />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoriesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductsSection() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: productsData, isLoading } = useProducts({ search, limit: 50 });
  const { data: categoriesData } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const products = ((productsData as { data?: Product[] })?.data || productsData || []) as Product[];
  const categories = (categoriesData || []) as Category[];

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      nameAr: '',
      descriptionAr: '',
      price: 0,
      categoryId: '',
      barcode: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    try {
      await createProduct.mutateAsync(data);
      setDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: { isActive: !product.isActive },
      });
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>المنتجات</CardTitle>
            <CardDescription>إدارة منتجات المتجر</CardDescription>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[200px]"
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة منتج
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة منتج جديد</DialogTitle>
                  <DialogDescription>
                    أدخل بيانات المنتج الجديد
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">رمز المنتج (SKU)</Label>
                      <Input id="sku" {...form.register('sku')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barcode">الباركود</Label>
                      <Input id="barcode" {...form.register('barcode')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameAr">اسم المنتج</Label>
                    <Input id="nameAr" {...form.register('nameAr')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionAr">الوصف</Label>
                    <Textarea id="descriptionAr" {...form.register('descriptionAr')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">السعر (د.ع)</Label>
                      <Input
                        id="price"
                        type="number"
                        {...form.register('price', { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoryId">التصنيف</Label>
                      <Select onValueChange={(v) => form.setValue('categoryId', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر التصنيف" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.nameAr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createProduct.isPending}>
                      {createProduct.isPending ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>المنتج</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell className="font-medium">{product.nameAr}</TableCell>
                      <TableCell>{product.category?.nameAr}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => toggleActive(product)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      لا توجد منتجات
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

function CategoriesSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useCategories();
  const createCategory = useCreateCategory();

  const categories = (data || []) as Category[];

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nameAr: '',
      descriptionAr: '',
      parentId: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof categorySchema>) => {
    try {
      await createCategory.mutateAsync({
        ...data,
        parentId: data.parentId || undefined,
      });
      setDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>التصنيفات</CardTitle>
            <CardDescription>إدارة تصنيفات المنتجات</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة تصنيف
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة تصنيف جديد</DialogTitle>
                <DialogDescription>أدخل بيانات التصنيف الجديد</DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nameAr">اسم التصنيف</Label>
                  <Input id="nameAr" {...form.register('nameAr')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">الوصف</Label>
                  <Textarea id="descriptionAr" {...form.register('descriptionAr')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentId">التصنيف الأب (اختياري)</Label>
                  <Select onValueChange={(v) => form.setValue('parentId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="بدون تصنيف أب" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => !c.parentId)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nameAr}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createCategory.isPending}>
                    {createCategory.isPending ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>التصنيف الأب</TableHead>
                  <TableHead>عدد المنتجات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.nameAr}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.descriptionAr || '-'}
                      </TableCell>
                      <TableCell>
                        {category.parentId
                          ? categories.find((c) => c.id === category.parentId)?.nameAr
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category._count?.products || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? 'default' : 'secondary'}>
                          {category.isActive ? 'نشط' : 'معطل'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      لا توجد تصنيفات
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
