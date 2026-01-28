'use client';

import { Save, Globe, Bell, Shield } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [isRTL, setIsRTL] = useState(true);
  const [language, setLanguage] = useState('ar');
  const [notifications, setNotifications] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [expiryWarningDays, setExpiryWarningDays] = useState('30');

  const handleSave = () => {
    // In production, this would save to the API
    toast({
      title: 'تم الحفظ',
      description: 'تم حفظ الإعدادات بنجاح',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
        <p className="text-muted-foreground">إدارة إعدادات النظام والتفضيلات</p>
      </div>

      <div className="grid gap-6">
        {/* Language & Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              اللغة والعرض
            </CardTitle>
            <CardDescription>إعدادات اللغة واتجاه النص</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="language">اللغة</Label>
                <p className="text-sm text-muted-foreground">اختر لغة الواجهة</p>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en" disabled>
                    English (قريباً)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="rtl">اتجاه النص (RTL)</Label>
                <p className="text-sm text-muted-foreground">تفعيل اتجاه النص من اليمين لليسار</p>
              </div>
              <Switch id="rtl" checked={isRTL} onCheckedChange={setIsRTL} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              الإشعارات
            </CardTitle>
            <CardDescription>إعدادات التنبيهات والإشعارات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">تفعيل الإشعارات</Label>
                <p className="text-sm text-muted-foreground">استلام إشعارات النظام</p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              إعدادات المخزون
            </CardTitle>
            <CardDescription>حدود التنبيهات للمخزون</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">حد المخزون المنخفض</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  min="1"
                />
                <p className="text-xs text-muted-foreground">التنبيه عندما يصل المخزون لهذا الحد</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryWarningDays">أيام التحذير من الانتهاء</Label>
                <Input
                  id="expiryWarningDays"
                  type="number"
                  value={expiryWarningDays}
                  onChange={(e) => setExpiryWarningDays(e.target.value)}
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  التنبيه قبل انتهاء الصلاحية بعدد الأيام
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات النظام</CardTitle>
            <CardDescription>معلومات عن إصدار النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">إصدار التطبيق:</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">إصدار API:</span>
                <span>v1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">البيئة:</span>
                <span>Development</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 ml-2" />
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    </div>
  );
}
