'use client';

import { Shield, Plus, Pencil, Trash2, Users, Lock } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useRoles,
  usePermissionsGrouped,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  action: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
}

interface RolePermission {
  permission: {
    id: string;
    resource: string;
    action: string;
  };
}

interface Role {
  id: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissions: RolePermission[];
  _count: {
    users: number;
  };
}

export default function RolesPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: permissionsGrouped, isLoading: permissionsLoading } = usePermissionsGrouped();

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    description: '',
    permissionIds: [] as string[],
  });

  const handleCreateOpen = () => {
    setFormData({ nameAr: '', nameEn: '', description: '', permissionIds: [] });
    setIsCreateDialogOpen(true);
  };

  const handleEditOpen = (role: Role) => {
    setFormData({
      nameAr: role.nameAr,
      nameEn: role.nameEn || '',
      description: role.description || '',
      permissionIds: role.permissions.map((rp) => rp.permission.id),
    });
    setEditingRole(role);
  };

  const handleCreate = async () => {
    if (!formData.nameAr || formData.permissionIds.length === 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم الدور واختيار صلاحية واحدة على الأقل',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createRole.mutateAsync(formData);
      toast({ title: 'تم بنجاح', description: 'تم إنشاء الدور بنجاح' });
      setIsCreateDialogOpen(false);
    } catch {
      toast({ title: 'خطأ', description: 'فشل في إنشاء الدور', variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!editingRole) {
      return;
    }

    try {
      await updateRole.mutateAsync({ id: editingRole.id, data: formData });
      toast({ title: 'تم بنجاح', description: 'تم تحديث الدور بنجاح' });
      setEditingRole(null);
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحديث الدور', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) {
      return;
    }

    try {
      await deleteRole.mutateAsync(deletingRole.id);
      toast({ title: 'تم بنجاح', description: 'تم حذف الدور بنجاح' });
      setDeletingRole(null);
    } catch {
      toast({ title: 'خطأ', description: 'فشل في حذف الدور', variant: 'destructive' });
    }
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter((id) => id !== permId)
        : [...prev.permissionIds, permId],
    }));
  };

  const isLoading = rolesLoading || permissionsLoading;
  const rolesList = (roles as Role[]) || [];
  const permGroups = (permissionsGrouped as Record<string, Permission[]>) || {};

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الأدوار والصلاحيات</h1>
          <p className="text-muted-foreground">إدارة أدوار المستخدمين وصلاحياتهم</p>
        </div>
        <Button onClick={handleCreateOpen}>
          <Plus className="h-4 w-4 ml-2" />
          دور جديد
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rolesList.map((role) => (
          <Card key={role.id} className={role.isSystem ? 'border-primary/50' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{role.nameAr}</CardTitle>
                </div>
                {role.isSystem ? (
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3 ml-1" />
                    نظامي
                  </Badge>
                ) : (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditOpen(role)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingRole(role)}
                      disabled={role._count.users > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {role.nameEn && <CardDescription className="text-xs">{role.nameEn}</CardDescription>}
            </CardHeader>
            <CardContent>
              {role.description && (
                <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{role._count.users} مستخدم</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>{role.permissions.length} صلاحية</span>
                </div>
              </div>
              {/* Permission badges */}
              <div className="flex flex-wrap gap-1 mt-3">
                {role.permissions.slice(0, 5).map((rp) => (
                  <Badge key={rp.permission.id} variant="outline" className="text-xs">
                    {rp.permission.resource}:{rp.permission.action}
                  </Badge>
                ))}
                {role.permissions.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{role.permissions.length - 5}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || !!editingRole}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingRole(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'تعديل الدور' : 'إنشاء دور جديد'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'قم بتعديل بيانات الدور والصلاحيات المرتبطة به'
                : 'قم بإنشاء دور جديد وتحديد الصلاحيات المطلوبة'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameAr">اسم الدور (عربي) *</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData((p) => ({ ...p, nameAr: e.target.value }))}
                  placeholder="مثال: مدير المخزون"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">اسم الدور (إنجليزي)</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData((p) => ({ ...p, nameEn: e.target.value }))}
                  placeholder="e.g., Inventory Manager"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف مختصر للدور"
              />
            </div>

            <div className="space-y-3">
              <Label>الصلاحيات *</Label>
              <div className="border rounded-lg p-4 space-y-4 max-h-64 overflow-y-auto">
                {Object.entries(permGroups).map(([resource, perms]) => (
                  <div key={resource} className="space-y-2">
                    <h4 className="font-medium text-sm capitalize">{resource}</h4>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((perm) => (
                        <Button
                          key={perm.id}
                          type="button"
                          variant={formData.permissionIds.includes(perm.id) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => togglePermission(perm.id)}
                        >
                          {perm.action}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                تم اختيار {formData.permissionIds.length} صلاحية
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingRole(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={editingRole ? handleUpdate : handleCreate}
              disabled={createRole.isPending || updateRole.isPending}
            >
              {editingRole ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingRole} onOpenChange={(open) => !open && setDeletingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف الدور &quot;{deletingRole?.nameAr}&quot;؟ لا يمكن التراجع عن هذا
              الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRole(null)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteRole.isPending}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
