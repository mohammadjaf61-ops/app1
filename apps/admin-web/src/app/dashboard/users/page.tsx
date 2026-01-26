'use client';

import { useState } from 'react';
import { Plus, Pencil, User, Phone, Shield } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
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
import { useUsers, useCreateUser, useUpdateUser } from '@/hooks/use-api';
import { formatPhone, userRoleLabels, userRoleColors } from '@/lib/formatters';

interface UserData {
  id: string;
  phone: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const userSchema = z.object({
  phone: z.string().min(10, 'رقم الهاتف غير صحيح'),
  fullName: z.string().min(2, 'الاسم مطلوب'),
  role: z.enum(['ADMIN', 'MANAGER', 'PICKER', 'DRIVER', 'CASHIER']),
});

const roleOptions = [
  { value: 'ADMIN', label: 'مسؤول' },
  { value: 'MANAGER', label: 'مدير' },
  { value: 'PICKER', label: 'محضّر' },
  { value: 'DRIVER', label: 'سائق' },
  { value: 'CASHIER', label: 'كاشير' },
];

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useUsers({
    role: roleFilter === 'all' ? undefined : roleFilter,
  });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const users = ((data as { data?: UserData[] })?.data || data || []) as UserData[];

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      phone: '',
      fullName: '',
      role: 'PICKER' as const,
    },
  });

  const onSubmit = async (data: z.infer<typeof userSchema>) => {
    try {
      await createUser.mutateAsync(data);
      setDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const toggleActive = async (user: UserData) => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: { isActive: !user.isActive },
      });
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">المستخدمين</h1>
        <p className="text-muted-foreground">إدارة مستخدمي النظام وصلاحياتهم</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>قائمة المستخدمين</CardTitle>
              <CardDescription>
                {users.length} مستخدم في النظام
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="جميع الأدوار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مستخدم
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                    <DialogDescription>
                      أدخل بيانات المستخدم الجديد
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">الاسم الكامل</Label>
                      <Input id="fullName" {...form.register('fullName')} />
                      {form.formState.errors.fullName && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        {...form.register('phone')}
                        placeholder="07XXXXXXXXX"
                        dir="ltr"
                      />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">الدور</Label>
                      <Select
                        value={form.watch('role')}
                        onValueChange={(v: 'ADMIN' | 'MANAGER' | 'PICKER' | 'DRIVER' | 'CASHIER') =>
                          form.setValue('role', v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الدور" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createUser.isPending}>
                        {createUser.isPending ? 'جاري الحفظ...' : 'حفظ'}
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
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-primary/10 p-2">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{user.fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2" dir="ltr">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {formatPhone(user.phone)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={userRoleColors[user.role]}>
                            <Shield className="h-3 w-3 ml-1" />
                            {userRoleLabels[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => toggleActive(user)}
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
                      <TableCell colSpan={5} className="h-24 text-center">
                        لا يوجد مستخدمون
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
